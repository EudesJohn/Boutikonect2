import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  Eye,
  ShoppingBag,
  DollarSign,
  Loader2,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LineChart, HorizontalBarChart, buildSalesTimeline, buildProductRanking, StatCard } from '../components/Charts';

function formatPrice(amount) {
  if (amount == null) return '0 FCFA';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

export default function SellerAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [salesTimeline, setSalesTimeline] = useState([]);
  const [productRanking, setProductRanking] = useState([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      try {
        // Calculate date ranges — current and previous period
        const now = new Date();
        let periodDays, prevPeriodDays;
        switch (period) {
          case 'month':
            periodDays = 30; prevPeriodDays = 60;
            break;
          case 'year':
            periodDays = 365; prevPeriodDays = 730;
            break;
          case 'week':
          default:
            periodDays = 7; prevPeriodDays = 14;
            break;
        }

        const currentStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString();
        const prevStart = new Date(now.getTime() - prevPeriodDays * 24 * 60 * 60 * 1000).toISOString();

        // Fetch all data in parallel
        const [ordersRes, productsRes, prevOrdersRes] = await Promise.all([
          supabase
            .from('orders')
            .select('total_amount, status, created_at, product_id')
            .eq('seller_id', user.id)
            .gte('created_at', currentStart)
            .order('created_at', { ascending: true }),
          supabase
            .from('products')
            .select('id, title, view_count')
            .eq('seller_id', user.id),
          supabase
            .from('orders')
            .select('total_amount, status, created_at')
            .eq('seller_id', user.id)
            .gte('created_at', prevStart)
            .lt('created_at', currentStart),
        ]);

        const orders = ordersRes.data || [];
        const products = productsRes.data || [];
        const prevOrders = prevOrdersRes.data || [];

        // Current period stats
        const totalRevenue = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        const totalOrders = orders.length;
        const totalViews = products.reduce((sum, p) => sum + (p.view_count || 0), 0);
        const completedOrders = orders.filter((o) => o.status === 'delivered').length;
        const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

        // Previous period stats for trends
        const prevRevenue = prevOrders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const prevOrdersCount = prevOrders.length;

        // Trends (% change)
        const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;
        const ordersChange = prevOrdersCount > 0 ? Math.round(((totalOrders - prevOrdersCount) / prevOrdersCount) * 100) : 0;

        // Build chart data
        const timeline = buildSalesTimeline(orders, period);
        const ranking = buildProductRanking(products, orders);

        setData({
          revenue: totalRevenue,
          revenueChange,
          orders: totalOrders,
          ordersChange,
          views: totalViews,
          viewsChange: 0,
          conversionRate,
          conversionChange: 0,
        });
        setSalesTimeline(timeline);
        setProductRanking(ranking);
      } catch (err) {
        console.error(err);
        setData({
          revenue: 0, revenueChange: 0,
          orders: 0, ordersChange: 0,
          views: 0, viewsChange: 0,
          conversionRate: 0, conversionChange: 0,
        });
        setSalesTimeline([]);
        setProductRanking([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Analytiques</h1>
              <p className="text-gray-400 text-sm">Suivez les performances de votre boutique</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-1 border border-gray-800">
              {[
                { key: 'week', label: '7 jours' },
                { key: 'month', label: '30 jours' },
                { key: 'year', label: '12 mois' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    period === p.key
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <StatCard
                title="Revenus"
                value={data?.revenue ?? 0}
                format={formatPrice}
                icon={DollarSign}
                color="green"
                trend={data?.revenueChange}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatCard
                title="Commandes"
                value={data?.orders ?? 0}
                icon={ShoppingBag}
                color="blue"
                trend={data?.ordersChange}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StatCard
                title="Vues"
                value={data?.views ?? 0}
                icon={Eye}
                color="purple"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatCard
                title="Taux de conversion"
                value={data?.conversionRate ?? 0}
                format={(v) => v.toFixed(1) + '%'}
                icon={BarChart3}
                color="amber"
              />
            </motion.div>
          </div>

          {/* Charts section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Sales evolution chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Évolution des ventes
                </h2>
                {salesTimeline.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {period === 'year' ? 'Par mois' : period === 'month' ? 'Par jour' : 'Par jour'}
                  </span>
                )}
              </div>
              <LineChart
                data={salesTimeline}
                height={200}
                color="#f59e0b"
                valueFormatter={(v) => formatPrice(v)}
                showDots
                showLabels
              />
              {salesTimeline.length > 0 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Revenus sur la période
                </p>
              )}
            </motion.div>

            {/* Popular products chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  Produits populaires
                </h2>
                {productRanking.length > 0 && (
                  <span className="text-xs text-gray-500">
                    Classement par commandes
                  </span>
                )}
              </div>
              {productRanking.length > 0 ? (
                <HorizontalBarChart
                  data={productRanking}
                  height={Math.max(240, productRanking.length * 38)}
                  valueFormatter={(v) => v + ' cmd(s)'}
                />
              ) : (
                <div className="h-48 flex items-center justify-center bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                  <div className="text-center">
                    <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucune commande reçue</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent activity summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              Résumé de la période
            </h2>

            {data && (data.revenue > 0 || data.orders > 0) ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Panier moyen</p>
                  <p className="text-lg font-bold text-white">
                    {formatPrice(data.orders > 0 ? data.revenue / data.orders : 0)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Taux de complétion</p>
                  <p className="text-lg font-bold text-white">
                    {data.orders > 0
                      ? Math.round((data.orders / Math.max(data.views, 1)) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Produits actifs</p>
                  <p className="text-lg font-bold text-white">{productRanking.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">
                    {data.revenueChange >= 0 ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <ArrowUpRight className="w-3 h-3" /> Progression
                      </span>
                    ) : (
                      <span className="text-red-400">Régression</span>
                    )}
                  </p>
                  <p className="text-lg font-bold text-white">
                    {data.revenueChange >= 0 ? '+' : ''}{data.revenueChange}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-700" />
                <p>Publiez des produits pour voir vos statistiques</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
