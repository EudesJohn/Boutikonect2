import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  PlusCircle,
  Wrench,
  Eye,
  CheckCircle,
  XCircle,
  MessageCircle,
  Loader2,
  AlertCircle,
  Store,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSellerStats, getSellerOrders, updateOrderStatus } from '../lib/database';
import { supabase } from '../lib/supabase';
import { LineChart, buildSalesTimeline } from '../components/Charts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  delivered: 'Livree',
  cancelled: 'Annulee',
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Format price
// ---------------------------------------------------------------------------

function formatPrice(amount) {
  if (amount == null) return '0 FCFA';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

// ---------------------------------------------------------------------------
// WhatsApp message
// ---------------------------------------------------------------------------

function openWhatsApp(phone, buyerName, productName) {
  if (!phone) {
    toast.error('Aucun numero de telephone disponible pour cet acheteur.');
    return;
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    `Bonjour ${buyerName}, je vous contacte concernant votre commande de ${productName} sur BoutiKonect. Pour planifier la livraison, veuillez me contacter au plus vite. Merci!`
  );
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SellerDashboard() {
  const { user, profile, loading: authLoading, becomeSeller } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // orderId being acted upon
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  // -----------------------------------------------------------------------
  // Load chart data (last 7 days revenue)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile?.is_seller) return;
    let cancelled = false;
    async function load() {
      setChartLoading(true);
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('total_amount, status, created_at')
          .eq('seller_id', user.id)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true });

        if (!cancelled) {
          const timeline = buildSalesTimeline(recentOrders || [], 'week');
          setChartData(timeline);
        }
      } catch (err) {
        console.error('Chart error:', err);
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, profile?.is_seller]);

  // -----------------------------------------------------------------------
  // Redirect if not authenticated
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // -----------------------------------------------------------------------
  // Fetch data
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile?.is_seller) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [sellerStats, sellerOrders] = await Promise.all([
          getSellerStats(user.id),
          getSellerOrders(user.id),
        ]);
        if (!cancelled) {
          setStats(sellerStats);
          setOrders(sellerOrders);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Une erreur est survenue.');
          toast.error(err.message || 'Erreur lors du chargement.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.is_seller]);

  // -----------------------------------------------------------------------
  // Handle order status update
  // -----------------------------------------------------------------------
  async function handleUpdateStatus(orderId, newStatus) {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      // Update local order state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      // Rafraîchir les stats après modification pour que les cartes s'incrémentent
      const updatedStats = await getSellerStats(user.id);
      setStats(updatedStats);
      toast.success(`Commande ${STATUS_LABELS[newStatus].toLowerCase()} avec succes.`);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise a jour.');
    } finally {
      setActionLoading(null);
    }
  }

  // -----------------------------------------------------------------------
  // Handle become seller
  // -----------------------------------------------------------------------
  async function handleBecomeSeller() {
    try {
      await becomeSeller();
      toast.success('Vous etes maintenant vendeur!');
    } catch {
      // Toast already handled in AuthContext
    }
  }

  // -----------------------------------------------------------------------
  // Refresh dashboard data
  // -----------------------------------------------------------------------
  async function handleRefresh() {
    if (!user) return;
    setRefreshing(true);
    try {
      const [sellerStats, sellerOrders] = await Promise.all([
        getSellerStats(user.id),
        getSellerOrders(user.id),
      ]);
      setStats(sellerStats);
      setOrders(sellerOrders);
      toast.success('Tableau de bord mis a jour.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors du rafraîchissement.');
    } finally {
      setRefreshing(false);
    }
  }

  // -----------------------------------------------------------------------
  // Auth loading
  // -----------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Not logged in
  // -----------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Redirection vers la connexion...</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Not a seller
  // -----------------------------------------------------------------------
  if (!profile?.is_seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Devenir Vendeur
          </h2>
          <p className="text-gray-600 mb-8">
            Rejoignez notre marketplace et commencez a vendre vos produits et
            services des maintenant.
          </p>
          <button
            onClick={handleBecomeSeller}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
          >
            Devenir vendeur
          </button>
        </motion.div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          {/* CTA skeleton */}
          <div className="flex gap-4">
            <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          {/* Table skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <table className="w-full">
              <thead>
                <tr>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i}>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Reessayer
          </button>
        </motion.div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord Vendeur
            </h1>
            <p className="text-gray-500 mt-1">
              Bienvenue, {profile?.full_name || 'Vendeur'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Revenus Totaux
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats?.total_revenue ?? 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Commandes en Cours
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.pending_orders ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Produits Listes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_products ?? 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <Link
            to="/publish"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
          >
            <PlusCircle className="w-5 h-5" />
            Publier un produit
          </Link>
          <Link
            to="/publish?type=service"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <Wrench className="w-5 h-5" />
            Publier un service
          </Link>
          <Link
            to="/my-products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-5 h-5" />
            Mes produits
          </Link>
        </motion.div>

        {/* ─── Sales curve ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Évolution des ventes (7 derniers jours)
          </h2>
          <div className="h-48">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <TrendingUp className="w-10 h-10 text-gray-700 mb-2" />
                <p className="text-sm">Aucune vente cette semaine</p>
              </div>
            ) : (
              <LineChart data={chartData} color="emerald" height={180} />
            )}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Commandes Recentes
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Aucune commande pour le moment.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Des que des clients commanderont vos produits, elles
                apparaitront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Produit
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Acheteur
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Telephone
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Montant
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Statut
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {order.product?.title || 'Produit'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {order.buyer?.full_name || 'Anonyme'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {order.buyer?.phone || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${
                            STATUS_STYLES[order.status] ||
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {/* Confirm */}
                          {order.status === 'pending' && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, 'confirmed')
                              }
                              disabled={actionLoading === order.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              Confirmer
                            </button>
                          )}

                          {/* Complete */}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, 'delivered')
                              }
                              disabled={actionLoading === order.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              Completer
                            </button>
                          )}

                          {/* Cancel */}
                          {(order.status === 'pending' ||
                            order.status === 'confirmed') && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, 'cancelled')
                              }
                              disabled={actionLoading === order.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              Annuler
                            </button>
                          )}

                          {/* WhatsApp */}
                          <button
                            onClick={() =>
                              openWhatsApp(
                                order.buyer?.phone,
                                order.buyer?.full_name || 'Client',
                                order.product?.title || 'produit'
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            title="Contacter via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
