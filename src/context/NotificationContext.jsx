import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/database';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const notificationCacheRef = useRef(null);
  const channelsRef = useRef([]);

  // ── Load initial data ──────────────────────────────────────────
  const loadNotifications = useCallback(async (userId) => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data } = await getNotifications(userId, { limit: 15 });
      setNotifications(data || []);

      const count = await getUnreadNotificationCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Real-time subscription ─────────────────────────────────────
  const subscribeToNotifications = useCallback((userId) => {
    if (!userId) return () => {};

    // Clean up existing channels
    channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    channelsRef.current = [];

    // Listen for new notifications
    const notifChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
          if (!newNotif.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    // Listen for read updates (e.g., marked read from another tab)
    const updateChannel = supabase
      .channel(`notifications-updates:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
          );
          if (payload.old.is_read !== updated.is_read) {
            setUnreadCount((prev) => prev + (updated.is_read ? -1 : 1));
          }
        }
      )
      .subscribe();

    channelsRef.current = [notifChannel, updateChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, []);

  // ── Public API ─────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
    // Get user ID from supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await markAllNotificationsRead(session.user.id);
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  // ── Effect: attach to auth state ───────────────────────────────
  useEffect(() => {
    let unsub = () => {};

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadNotifications(session.user.id);
        unsub = subscribeToNotifications(session.user.id);
      } else {
        setLoading(false);
      }
    };

    setup();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          await loadNotifications(session.user.id);
          unsub = subscribeToNotifications(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          unsub();
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
        }
      }
    );

    return () => {
      unsub();
      authListener?.subscription?.unsubscribe();
    };
  }, [loadNotifications, subscribeToNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    showDropdown,
    markAsRead,
    markAllAsRead,
    toggleDropdown,
    closeDropdown,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
