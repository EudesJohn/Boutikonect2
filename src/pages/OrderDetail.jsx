import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  MapPin,
  Phone,
  User,
  ChevronLeft,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getOrderById } from '../lib/database';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'text-yellow-400', icon: Clock },
  confirmed: { label: 'Confirmee', color: 'text-blue-400', icon: FileText },
  processing: { label: 'En preparation', color: 'text-amber-400', icon: Package },
  shipped: { label: 'Expediee', color: 'text-purple-400', icon: Truck },
  delivered: { label: 'Livree', color: 'text-green-400', icon: CheckCircle },
  cancelled: { label: 'Annulee', color: 'text-red-400', icon: XCircle },
};

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function formatPrice(amount) {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrderById(id);
        if (!data) {
          toast.error('Commande introuvable');
          return;
        }
        setOrder(data);
      } catch (err) {
        toast.error('Erreur lors du chargement de la commande');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Commande introuvable</h1>
          <Link to="/orders" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Retour a mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.status);
  const StatusIcon = STATUS_CONFIG[order.status]?.icon || Package;

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back link */}
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour a mes commandes
          </Link>

          {/* Header */}
          <div className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Commande #{order.id?.toString().slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Passee le {formatDate(order.created_at)}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${STATUS_CONFIG[order.status]?.color?.replace('text-', 'border-').replace('400', '500/20') || 'border-gray-700'} bg-gray-800/50`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-medium">{STATUS_CONFIG[order.status]?.label || order.status}</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order progress */}
              {order.status !== 'cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
                >
                  <h2 className="text-lg font-semibold text-white mb-4">Suivi de commande</h2>
                  <div className="relative">
                    {STEPS.map((step, i) => {
                      const StepIcon = STATUS_CONFIG[step].icon;
                      const isActive = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <div key={step} className="flex items-start gap-3 pb-6 last:pb-0 relative">
                          {/* Line */}
                          {i < STEPS.length - 1 && (
                            <div className={`absolute left-[15px] top-8 w-0.5 h-6 ${
                              i < currentStepIndex ? 'bg-amber-500' : 'bg-gray-700'
                            }`} />
                          )}
                          {/* Circle */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCurrent
                              ? 'bg-amber-500 text-black ring-2 ring-amber-500/30'
                              : isActive
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-800 text-gray-600'
                          }`}>
                            <StepIcon className="w-4 h-4" />
                          </div>
                          {/* Info */}
                          <div className={`pt-1 ${isCurrent ? 'text-white' : isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                            <p className="font-medium text-sm">{STATUS_CONFIG[step].label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Order cancelled message */}
              {order.status === 'cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10"
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-400" />
                    <div>
                      <h3 className="text-white font-medium">Commande annulee</h3>
                      <p className="text-sm text-gray-400">Cette commande a ete annulee.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Order items */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Articles</h2>
                {order.items?.length > 0 ? (
                  <div className="space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-800/50">
                        <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{item.name || item.product_name}</p>
                          <p className="text-sm text-gray-400">
                            {item.quantity || 1} x {formatPrice(item.price || item.unit_price)}
                          </p>
                        </div>
                        <p className="text-amber-400 font-semibold">
                          {formatPrice((item.price || item.unit_price) * (item.quantity || 1))}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun detail d&apos;article disponible</p>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Resume</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sous-total</span>
                    <span className="text-white">{formatPrice(order.total_amount)}</span>
                  </div>
                  {order.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Livraison</span>
                      <span className="text-white">{formatPrice(order.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-800 pt-2 mt-2 flex justify-between">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-amber-400 font-bold text-lg">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Delivery info */}
              {order.delivery_address && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
                >
                  <h2 className="text-lg font-semibold text-white mb-4">Livraison</h2>
                  <div className="space-y-3">
                    {order.delivery_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">{order.delivery_name}</span>
                      </div>
                    )}
                    {order.delivery_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">{order.delivery_phone}</span>
                      </div>
                    )}
                    {typeof order.delivery_address === 'string' ? (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-gray-300">{order.delivery_address}</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-gray-300">
                          {order.delivery_address?.city}, {order.delivery_address?.district}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
