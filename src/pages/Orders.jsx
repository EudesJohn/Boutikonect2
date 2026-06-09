import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../lib/database';

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  confirmed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  processing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  shipped: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  delivered: 'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  processing: 'En preparation',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
};

function formatPrice(amount) {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        if (!user) return;
      const data = await getUserOrders(user.id);
        setOrders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const tabs = [
    { key: 'all', label: 'Toutes', count: orders.length },
    { key: 'pending', label: 'En attente', count: orders.filter((o) => o.status === 'pending').length },
    { key: 'delivered', label: 'Livrees', count: orders.filter((o) => o.status === 'delivered').length },
    { key: 'cancelled', label: 'Annulees', count: orders.filter((o) => o.status === 'cancelled').length },
  ];

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Mes commandes</h1>
            <p className="text-gray-400 text-sm mt-1">Suivez toutes vos commandes</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  filter === tab.key
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? 'bg-amber-500/30' : 'bg-gray-800'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Order list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <ShoppingBag className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Aucune commande</h2>
              <p className="text-gray-400 mb-6">
                {filter === 'all'
                  ? 'Vous n\'avez pas encore passe de commande.'
                  : `Aucune commande avec le statut "${STATUS_LABELS[filter] || filter}".`}
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
              >
                <Package className="w-5 h-5" />
                Decouvrir nos produits
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/order/${order.id}`}
                      className="block p-5 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800 hover:border-amber-500/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                            <Package className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                          <p className="text-white font-medium">
                            Commande #{order.id?.toString().slice(-8).toUpperCase() || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-amber-400 font-semibold">{formatPrice(order.total_amount)}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[order.status] || 'text-gray-400 bg-gray-800 border-gray-700'}`}>
                              {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                              {order.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                              {order.status === 'pending' && <Clock className="w-3 h-3" />}
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          {order.seller?.avatar_url ? (
                            <img src={order.seller.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <Package className="w-3 h-3 shrink-0" />
                          )}
                          <span>Vendu par <strong className="text-gray-400 font-medium">{order.seller?.full_name || order.seller?.store_name || 'Vendeur'}</strong></span>
                        </div>
                        {(order.items?.length > 0) && (
                          <span>{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
