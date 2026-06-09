import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Package,
  Wrench,
  Trash2,
  ShoppingBag,
  Loader2,
  MapPin,
  HeartOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserFavorites, removeFavorite } from '../lib/database';
import toast from 'react-hot-toast';

function formatPrice(amount) {
  if (amount == null) return 'Prix sur devis';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!user) return;
      const data = await getUserFavorites(user.id);
        setFavorites(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const handleRemove = async (favId) => {
    try {
      await removeFavorite(favId);
      setFavorites((prev) => prev.filter((f) => f.id !== favId));
      toast.success('Retire des favoris');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-red-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Mes favoris</h1>
              <p className="text-gray-400 text-sm">
                {favorites.length} article{favorites.length !== 1 ? 's' : ''} enregistre{favorites.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HeartOff className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Aucun favori</h2>
              <p className="text-gray-400 mb-6">
                Vous n&apos;avez pas encore ajoute d&apos;articles a vos favoris.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Decouvrir nos produits
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {favorites.filter((fav) => fav.product || fav.service).map((fav, i) => {
                  const item = fav.product || fav.service;
                  const type = fav.product ? 'product' : 'service';
                  if (!item) return null;
                  const imageUrl = item.images?.[0] || item.image_url || item.image;

                  return (
                    <motion.div
                      key={fav.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative"
                    >
                      <Link
                        to={`/${type}/${item.id}`}
                        className="block bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all"
                      >
                        <div className="aspect-square bg-gray-800 relative overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {type === 'product' ? <Package className="w-10 h-10 text-gray-600" /> : <Wrench className="w-10 h-10 text-gray-600" />}
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              type === 'product'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {type === 'product' ? 'Produit' : 'Service'}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                            {item.title}
                          </h3>
                          {item.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {item.location}
                            </p>
                          )}
                          <p className="text-amber-400 font-semibold text-sm mt-2">{formatPrice(item.price)}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleRemove(fav.id)}
                        className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        aria-label="Retirer des favoris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
