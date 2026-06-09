import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Heart,
  MessageCircle,
  User,
  Settings,
  Clock,
  Package,
  Loader2,
  ArrowRight,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function UserDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      try {
        const [ordersRes, favoritesRes, messagesRes] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id),
          supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('conversations').select('id', { count: 'exact', head: true })
            .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
        ]);

        setStats({
          orders: ordersRes.count || 0,
          favorites: favoritesRes.count || 0,
          messages: messagesRes.count || 0,
        });
      } catch (err) {
        console.error(err);
        setStats({ orders: 0, favorites: 0, messages: 0 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const cards = [
    {
      title: 'Mes commandes',
      value: stats?.orders ?? 0,
      icon: ShoppingBag,
      color: 'from-blue-500 to-blue-600',
      link: '/orders',
      label: 'Voir mes commandes',
    },
    {
      title: 'Favoris',
      value: stats?.favorites ?? 0,
      icon: Heart,
      color: 'from-red-500 to-red-600',
      link: '/favorites',
      label: 'Voir mes favoris',
    },
    {
      title: 'Messages',
      value: stats?.messages ?? 0,
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      link: '/messages',
      label: 'Voir mes messages',
    },
    {
      title: 'Profil',
      value: '',
      icon: User,
      color: 'from-purple-500 to-purple-600',
      link: '/profile',
      label: 'Modifier mon profil',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
              <p className="text-gray-400 text-sm mt-1">
                Bienvenue, {profile?.full_name || 'Utilisateur'}
              </p>
            </div>
            {profile?.is_seller && (
              <Link
                to="/seller/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all text-sm"
              >
                <Store className="w-4 h-4" />
                Espace vendeur
              </Link>
            )}
          </div>

          {/* Stats grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {cards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={card.link}
                    className="block p-5 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800 hover:border-amber-500/30 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    <p className="text-sm text-gray-400">{card.title}</p>
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {card.label} <ArrowRight className="w-3 h-3" />
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/products"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all text-center"
              >
                <Package className="w-6 h-6 text-amber-400" />
                <span className="text-sm text-gray-300">Parcourir</span>
              </Link>
              <Link
                to="/orders"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all text-center"
              >
                <Clock className="w-6 h-6 text-amber-400" />
                <span className="text-sm text-gray-300">Mes commandes</span>
              </Link>
              <Link
                to="/favorites"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all text-center"
              >
                <Heart className="w-6 h-6 text-amber-400" />
                <span className="text-sm text-gray-300">Favoris</span>
              </Link>
              <Link
                to="/profile"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all text-center"
              >
                <Settings className="w-6 h-6 text-amber-400" />
                <span className="text-sm text-gray-300">Parametres</span>
              </Link>
            </div>
          </motion.div>

          {/* Recent orders placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Commandes recentes</h2>
              <Link to="/orders" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Voir tout
              </Link>
            </div>
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-700" />
              <p>Aucune commande pour le moment</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
