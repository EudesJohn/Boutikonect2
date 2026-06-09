import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerOrders, updateOrderStatus } from '../lib/database';
import toast from 'react-hot-toast';

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

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        if (!user) return;
      const data = await getSellerOrders(user.id);
        setOrders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const handleStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Commande ${STATUS_LABELS[newStatus]?.toLowerCase()}`);
    } catch (err) {
      toast.error('Erreur lors de la mise a jour');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">Commandes recues</h1>
          <p className="text-gray-400 text-sm mb-6">Gerer les commandes de vos clients</p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-white' },
              { label: 'En attente', value: stats.pending, color: 'text-yellow-400' },
              { label: 'En cours', value: stats.processing, color: 'text-amber-400' },
              { label: 'Livrees', value: stats.delivered, color: 'text-green-400' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-gray-900/70 border border-gray-800 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filter === key
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-gray-900 text-gray-400 border border-gray-800'
                }`}
              >
                {STATUS_LABELS[key] || key}
              </button>
            ))}
          </div>

          {/* Orders */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-xl bg-gray-900/70 border border-gray-800"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">#{order.id?.toString().slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Client: {order.buyer?.full_name || 'Anonyme'}
                        </p>
                        <p className="text-amber-400 font-semibold text-sm mt-1">{formatPrice(order.total_amount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatus(order.id, 'confirmed')}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-all cursor-pointer"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => handleStatus(order.id, 'cancelled')}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all cursor-pointer"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatus(order.id, 'processing')}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition-all cursor-pointer"
                        >
                          En preparation
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleStatus(order.id, 'shipped')}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-all"
                        >
                          Expedier
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => handleStatus(order.id, 'delivered')}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-all"
                        >
                          Marquer livree
                        </button>
                      )}
                      <span className={`px-2 py-1 rounded-lg text-xs border ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
