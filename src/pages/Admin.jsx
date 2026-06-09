import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Package,
  CreditCard,
  AlertTriangle,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldOff,
  ShieldCheck,
  X,
  Loader2,
  AlertCircle,
  UserCheck,
  Ban,
  Flag,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStats,
  searchUsers,
  deleteUser,
  getPendingReports,
  resolveReport,
  getAllOrders,
} from '../lib/database';
import { LineChart, buildSalesTimeline } from '../components/Charts';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  completed: 'Completee',
  cancelled: 'Annulee',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount) {
  if (amount == null) return '0 FCFA';
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

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonStatCard() {
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

function SkeletonTable({ rows = 4, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-4 pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm Modal
// ---------------------------------------------------------------------------

function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel, loading, danger }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              danger ? 'bg-red-100' : 'bg-gray-100'
            }`}
          >
            {danger ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gray-600" />
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 text-center mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Admin() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reports
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  // Chart data
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  // UI
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmResolve, setConfirmResolve] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedSellers, setExpandedSellers] = useState({});

  // -----------------------------------------------------------------------
  // Redirect if not authenticated
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // -----------------------------------------------------------------------
  // Load stats
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile?.is_admin) return;

    let cancelled = false;

    async function load() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const data = await getAdminStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setStatsError(err.message || 'Erreur de chargement des statistiques.');
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.is_admin]);

  // -----------------------------------------------------------------------
  // Load users
  // -----------------------------------------------------------------------
  const loadUsers = useCallback(async (query) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await searchUsers(query);
      setUsers(data);
    } catch (err) {
      setUsersError(err.message || 'Erreur de chargement des utilisateurs.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !profile?.is_admin) return;
    loadUsers('');
  }, [user, profile?.is_admin, loadUsers]);

  // -----------------------------------------------------------------------
  // Debounced search
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile?.is_admin) return;

    const timer = setTimeout(() => {
      loadUsers(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, user, profile?.is_admin, loadUsers]);

  // -----------------------------------------------------------------------
  // Load reports
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile?.is_admin) return;

    let cancelled = false;

    async function load() {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const result = await getPendingReports();
        if (!cancelled) setReports(result.data);
      } catch (err) {
        if (!cancelled) {
          setReportsError(err.message || 'Erreur de chargement des signalements.');
        }
      } finally {
        if (!cancelled) setReportsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.is_admin]);

  // -----------------------------------------------------------------------
  // Load all orders
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile?.is_admin) return;

    let cancelled = false;

    async function load() {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const result = await getAllOrders();
        if (!cancelled) setOrders(result.data);
      } catch (err) {
        if (!cancelled) {
          setOrdersError(err.message || 'Erreur de chargement des commandes.');
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.is_admin]);

  // -----------------------------------------------------------------------
  // Load chart data (last 7 days revenue)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile?.is_admin) return;

    let cancelled = false;

    async function load() {
      setChartLoading(true);
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('total_amount, status, created_at')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true });

        if (!cancelled) {
          const timeline = buildSalesTimeline(recentOrders || [], 'week');
          setChartData(timeline);
        }
      } catch (err) {
        console.error('Chart data error:', err);
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, profile?.is_admin]);

  // -----------------------------------------------------------------------
  // Handle delete user
  // -----------------------------------------------------------------------
  async function handleDeleteUser() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await deleteUser(confirmDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
      toast.success(`Utilisateur "${confirmDelete.full_name || confirmDelete.email}" supprime.`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression.');
    } finally {
      setActionLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Handle resolve report
  // -----------------------------------------------------------------------
  async function handleResolveReport() {
    if (!confirmResolve) return;
    setActionLoading(true);
    try {
      const resolution = confirmResolve.action === 'delete' ? 'resolved' : 'dismissed';
      await resolveReport(confirmResolve.id, resolution);
      setReports((prev) => prev.filter((r) => r.id !== confirmResolve.id));
      const msg =
        confirmResolve.action === 'delete'
          ? 'Produit supprime et signalement resolu.'
          : 'Signalement classe sans suite.';
      toast.success(msg);
      setConfirmResolve(null);
    } catch (err) {
      toast.error(err.message || 'Erreur lors du traitement.');
    } finally {
      setActionLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Group orders by seller
  // -----------------------------------------------------------------------
  const ordersBySeller = orders.reduce((acc, order) => {
    const sellerId = order.seller_id || 'unknown';
    if (!acc[sellerId]) {
      acc[sellerId] = {
        sellerId,
        orders: [],
      };
    }
    acc[sellerId].orders.push(order);
    return acc;
  }, {});

  // -----------------------------------------------------------------------
  // Get seller name from orders
  // -----------------------------------------------------------------------
  function getSellerName(sellerId) {
    const order = orders.find((o) => o.seller_id === sellerId);
    // Since we don't have seller name in the joined data, we show ID
    return `Vendeur #${sellerId.slice(0, 8)}`;
  }

  // -----------------------------------------------------------------------
  // Toggle seller accordion
  // -----------------------------------------------------------------------
  function toggleSeller(sellerId) {
    setExpandedSellers((prev) => ({
      ...prev,
      [sellerId]: !prev[sellerId],
    }));
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Redirection vers la connexion...</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Not admin
  // -----------------------------------------------------------------------
  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Acces Refuse
          </h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions necessaires pour acceder a cette
            page. Seuls les administrateurs peuvent acceder au tableau de bord
            d'administration.
          </p>
        </motion.div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Administration
          </h1>
          <p className="text-gray-500 mt-1">
            Gerer la plateforme BoutiKonect
          </p>
        </motion.div>

        {/* ============================================================= */}
        {/* Stats Cards */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Apercu general
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
          ) : statsError ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {statsError}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Total Utilisateurs
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_users ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Products */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Total Produits
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_products ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Transactions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_orders ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Reports */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Signalements en attente
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.pending_reports ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ============================================================= */}
        {/* Graphique des ventes (7 derniers jours) */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Évolution des revenus (7 jours)
            </h2>
            {!chartLoading && chartData.length > 0 && (
              <span className="text-xs text-gray-400">
                Total: {formatPrice(chartData.reduce((s, d) => s + d.value, 0))}
              </span>
            )}
          </div>
          {chartLoading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          ) : (
            <LineChart
              data={chartData}
              height={180}
              color="#7c3aed"
              valueFormatter={(v) => formatPrice(v)}
              showDots
              showLabels
            />
          )}
        </motion.div>

        {/* ============================================================= */}
        {/* Gestion des Comptes */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Gestion des Comptes
          </h2>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, email, telephone ou ville..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white text-gray-900"
            />
          </div>

          {/* Users table */}
          {usersLoading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : usersError ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {usersError}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery
                  ? 'Aucun utilisateur trouve pour cette recherche.'
                  : 'Aucun utilisateur inscrit.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Nom
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Telephone
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Ville
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                      Vendeur?
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                      Admin?
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {u.full_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {u.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {u.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {u.city || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.is_seller ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                            <UserCheck className="w-3 h-3" />
                            Oui
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Non</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            Oui
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Non</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ============================================================= */}
        {/* Signalements */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Signalements en attente
          </h2>

          {reportsLoading ? (
            <SkeletonTable rows={3} cols={5} />
          ) : reportsError ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {reportsError}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Aucun signalement en attente de traitement.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Produit signale
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Auteur du signalement
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Motif
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Details
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {report.product?.title || 'Produit supprime'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {report.reporter?.full_name || 'Anonyme'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[150px] truncate">
                        {report.reason || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                        {report.details || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              setConfirmResolve({
                                id: report.id,
                                action: 'delete',
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Supprimer le produit
                          </button>
                          <button
                            onClick={() =>
                              setConfirmResolve({
                                id: report.id,
                                action: 'dismiss',
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Classer sans suite
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

        {/* ============================================================= */}
        {/* Commandes globales */}
        {/* ============================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Commandes globales
          </h2>

          {ordersLoading ? (
            <SkeletonTable rows={4} cols={4} />
          ) : ordersError ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Aucune commande pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(ordersBySeller).map(
                ([sellerId, group]) => {
                  const isExpanded = expandedSellers[sellerId];
                  return (
                    <div
                      key={sellerId}
                      className="border border-gray-100 rounded-xl overflow-hidden"
                    >
                      {/* Accordion header */}
                      <button
                        onClick={() => toggleSeller(sellerId)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900 text-sm">
                            {getSellerName(sellerId)}
                          </span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                            {group.orders.length} commande(s)
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {/* Accordion content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-100 bg-white">
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                                    Produit
                                  </th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                                    Acheteur
                                  </th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                                    Montant
                                  </th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                                    Statut
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.orders.map((order) => (
                                  <tr
                                    key={order.id}
                                    className="border-b border-gray-50 bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {order.product?.title || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {order.buyer?.full_name || 'Anonyme'}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      {formatPrice(order.total_amount)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                          STATUS_STYLES[order.status] ||
                                          'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {STATUS_LABELS[order.status] ||
                                          order.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete user confirmation modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer l'utilisateur"
        message={`Etes-vous sur de vouloir supprimer definitivement l'utilisateur "${
          confirmDelete?.full_name || confirmDelete?.email || ''
        }" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmDelete(null)}
        loading={actionLoading}
        danger
      />

      {/* Resolve report confirmation modal */}
      <ConfirmModal
        isOpen={!!confirmResolve}
        title={
          confirmResolve?.action === 'delete'
            ? "Supprimer le produit signale"
            : "Classer sans suite"
        }
        message={
          confirmResolve?.action === 'delete'
            ? 'Etes-vous sur de vouloir supprimer ce produit? Le signalement sera automatiquement resolu apres la suppression.'
            : 'Etes-vous sur de vouloir classer ce signalement sans suite? Le produit reste en ligne.'
        }
        confirmLabel={
          confirmResolve?.action === 'delete'
            ? 'Supprimer le produit'
            : 'Classer sans suite'
        }
        onConfirm={handleResolveReport}
        onCancel={() => setConfirmResolve(null)}
        loading={actionLoading}
        danger={confirmResolve?.action === 'delete'}
      />
    </div>
  );
}
