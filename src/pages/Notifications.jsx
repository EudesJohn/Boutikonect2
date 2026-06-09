import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/database';
import toast from 'react-hot-toast';

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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) return "À l'instant";
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    return `Il y a ${m} min`;
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000);
    return `Il y a ${h}h`;
  }
  if (diff < 604800000) {
    const dd = Math.floor(diff / 86400000);
    return `Il y a ${dd}j`;
  }
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const SORTED_TYPES = ['message', 'order', 'payment', 'product', 'warning', 'info'];

export default function NotificationsPage() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [allNotifs, setAllNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | type
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const loadNotifs = useCallback(async (reset = false) => {
    if (!user) { setLoading(false); return; }
    try {
      const currentPage = reset ? 0 : page;
      const options = {
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        unreadOnly: filter === 'unread',
      };
      // Apply type filter via data attribute if specific type
      const { data } = await getNotifications(user.id, options);

      if (reset) {
        setAllNotifs(data || []);
      } else {
        setAllNotifs((prev) => [...prev, ...(data || [])]);
      }
      setHasMore((data || []).length >= PAGE_SIZE);
      setPage(currentPage + (reset ? 1 : 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, filter, page]);

  useEffect(() => {
    setLoading(true);
    setAllNotifs([]);
    setPage(0);
    setHasMore(true);
    loadNotifs(true);
  }, [filter, user?.id]);

  const handleMarkRead = async (id) => {
    setAllNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    setAllNotifs((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    await markAllNotificationsRead(user?.id);
    toast.success('Toutes les notifications marquées comme lues');
  };

  const getNotifLink = (notif) => {
    if (notif.data?.link) return notif.data.link;
    switch (notif.type) {
      case 'message': return '/messages';
      case 'order': return '/orders';
      default: return null;
    }
  };

  const visibleNotifs = filter === 'all' ? allNotifs : filter === 'unread' ? allNotifs : allNotifs;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-500">Connectez-vous pour voir vos notifications.</p>
          <Link to="/login" className="mt-4 inline-block px-6 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-amber-400" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-sm font-normal text-gray-400">
                    ({unreadCount} non lu{unreadCount > 1 ? 's' : ''})
                  </span>
                )}
              </h1>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-amber-400 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'unread', label: `Non lues${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
              ...SORTED_TYPES.map((t) => ({
                key: t,
                label: {
                  message: 'Messages',
                  order: 'Commandes',
                  payment: 'Paiements',
                  product: 'Produits',
                  warning: 'Alertes',
                  info: 'Infos',
                }[t] || t,
              })),
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filter === f.key
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notifications list */}
          <div className="space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : allNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell className="w-16 h-16 text-gray-700 mb-4" />
                <h2 className="text-lg font-medium text-gray-400">Aucune notification</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filter === 'unread'
                    ? 'Toutes les notifications ont été lues.'
                    : 'Vous serez notifié des nouveaux messages et commandes.'}
                </p>
              </div>
            ) : (
              <>
                {allNotifs.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] || Info;
                  const iconBg = TYPE_ICON_BG[notif.type] || TYPE_ICON_BG.info;
                  const link = getNotifLink(notif);

                  const CardWrapper = link ? Link : 'div';

                  return (
                    <div
                      key={notif.id}
                      className={`group relative rounded-xl transition-all ${
                        notif.is_read
                          ? 'bg-transparent hover:bg-white/[0.02]'
                          : 'bg-amber-500/[0.03] border border-amber-500/10'
                      }`}
                    >
                      <CardWrapper
                        to={link || '#'}
                        onClick={link ? undefined : () => !notif.is_read && handleMarkRead(notif.id)}
                        className="flex items-start gap-3 px-4 py-3.5"
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug ${notif.is_read ? 'text-gray-400' : 'text-white font-medium'}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMarkRead(notif.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer flex-shrink-0"
                                title="Marquer comme lu"
                              >
                                <CheckCheck className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                            )}
                          </div>
                          {notif.body && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notif.body}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-gray-600">
                              {formatDate(notif.created_at)}
                            </span>
                            {!notif.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            )}
                          </div>
                        </div>
                      </CardWrapper>
                    </div>
                  );
                })}

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center pt-4 pb-8">
                    <button
                      onClick={() => loadNotifs(false)}
                      className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-all cursor-pointer"
                    >
                      Charger plus
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
