import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  MessageCircle,
  ShoppingBag,
  Package,
  CreditCard,
  AlertTriangle,
  Info,
  CheckCheck,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBadge from './Toast';

const TYPE_ICONS = {
  message: MessageCircle,
  order: ShoppingBag,
  product: Package,
  payment: CreditCard,
  warning: AlertTriangle,
  info: Info,
};

const TYPE_ICON_BG = {
  message: 'bg-blue-500/20 text-blue-400',
  order: 'bg-green-500/20 text-green-400',
  product: 'bg-purple-500/20 text-purple-400',
  payment: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-red-500/20 text-red-400',
  info: 'bg-gray-500/20 text-gray-400',
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    loading,
    showDropdown,
    markAsRead,
    markAllAsRead,
    toggleDropdown,
    closeDropdown,
  } = useNotifications();

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown, closeDropdown]);

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    closeDropdown();
  };

  const getNotifLink = (notif) => {
    if (notif.data?.link) return notif.data.link;
    switch (notif.type) {
      case 'message': return '/messages';
      case 'order': return '/orders';
      case 'payment': return '/orders';
      default: return null;
    }
  };

  return (
    <>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-gray-900 border border-white/10 shadow-xl shadow-black/30 overflow-hidden"
            style={{ maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <Bell className="w-10 h-10 text-gray-700 mb-2" />
                  <p className="text-gray-500 text-sm">Aucune notification</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Vous serez notifié des messages et commandes
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] || Info;
                  const iconBg = TYPE_ICON_BG[notif.type] || TYPE_ICON_BG.info;
                  const link = getNotifLink(notif);

                  return (
                    <div
                      key={notif.id}
                      className={`
                        flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer
                        ${notif.is_read
                          ? 'hover:bg-white/5'
                          : 'bg-amber-500/5 hover:bg-amber-500/10'
                        }
                      `}
                      onClick={() => handleNotifClick(notif)}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${notif.is_read ? 'text-gray-400' : 'text-white font-medium'}`}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-600 mt-1 block">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      {/* Unread dot */}
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                      )}

                      {/* External link indicator */}
                      {link && !notif.is_read && (
                        <ExternalLink className="w-3 h-3 text-gray-600 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer link */}
            {notifications.length > 0 && (
              <Link
                to="/notifications"
                onClick={closeDropdown}
                className="block text-center text-xs text-amber-400 hover:text-amber-300 py-3 border-t border-white/10 transition-colors"
              >
                Voir toutes les notifications
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
