import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  PlusCircle,
  TrendingUp,
  Eye,
  Loader2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerProducts } from '../lib/database';
import toast from 'react-hot-toast';

function formatPrice(amount) {
  if (amount == null) return 'Prix sur devis';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SellerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        if (!user) return;
      const data = await getSellerProducts(user.id);
        setProducts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const filtered = filter === 'all' ? products : products.filter((p) => p.type === filter);

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status !== 'archived').length,
    views: products.reduce((sum, p) => sum + (p.view_count || 0), 0),
  };

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
              <h1 className="text-2xl font-bold text-white">Mes annonces</h1>
              <p className="text-gray-400 text-sm">Gerer vos produits et services</p>
            </div>
            <Link
              to="/publish"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Nouvelle annonce
            </Link>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total annonces', value: stats.total, icon: Package },
              { label: 'Actives', value: stats.active, icon: Eye },
              { label: 'Vues totales', value: stats.views, icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-gray-900/70 border border-gray-800"
              >
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <stat.icon className="w-4 h-4" />
                  {stat.label}
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'product', label: 'Produits' },
              { key: 'service', label: 'Services' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === tab.key
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Aucune annonce</h2>
              <p className="text-gray-400 mb-6">
                {filter === 'all'
                  ? 'Vous n\'avez pas encore publie d\'annonce.'
                  : `Aucun ${filter === 'product' ? 'produit' : 'service'} publie.`}
              </p>
              <Link
                to="/publish"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Publier une annonce
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.images?.[0] || item.image_url ? (
                        <img src={item.images?.[0] || item.image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{item.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'product'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {item.type === 'product' ? 'Produit' : 'Service'}
                        </span>
                      </div>
                      <p className="text-sm text-amber-400 font-medium mt-0.5">{formatPrice(item.price)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Publie le {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/promote/${item.id}`}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-amber-400 transition-all"
                        title="Promouvoir"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-amber-400 transition-all"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
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
