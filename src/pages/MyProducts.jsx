import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Wrench,
  Edit3,
  Trash2,
  TrendingUp,
  PlusCircle,
  Loader2,
  AlertCircle,
  ImageOff,
  Star,
  CalendarDays,
  X,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getUserProducts, deleteProduct } from '../lib/database';
import { getCategoryLabel } from '../lib/categories';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'product', label: 'Mes Produits', icon: Package },
  { key: 'service', label: 'Mes Services', icon: Wrench },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 bg-gray-200 rounded-lg w-20" />
          <div className="h-9 bg-gray-200 rounded-lg w-20" />
          <div className="h-9 bg-gray-200 rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({ isOpen, onClose, onConfirm, productTitle, loading }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            Supprimer l'annonce
          </h3>
          <p className="text-sm text-gray-600 text-center mb-6">
            Etes-vous sur de vouloir supprimer <strong>{productTitle}</strong> ?
            Cette action est irreversible.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Supprimer
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

export default function MyProducts() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('product');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // -----------------------------------------------------------------------
  // Redirect if not authenticated
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // -----------------------------------------------------------------------
  // Fetch products
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserProducts(user.id, activeTab);
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erreur de chargement.');
          toast.error(err.message || 'Erreur lors du chargement.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, activeTab]);

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success('Annonce supprimee avec succes.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Redirection vers la connexion...</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Annonces</h1>
            <p className="text-gray-500 mt-1">
              Gerer vos produits et services publies
            </p>
          </div>
          <Link
            to="/publish"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
          >
            <PlusCircle className="w-5 h-5" />
            Publier maintenant
          </Link>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 inline-flex mb-8"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          /* Error state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center"
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Reessayer
            </button>
          </motion.div>
        ) : products.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'product' ? (
                <Package className="w-8 h-8 text-gray-400" />
              ) : (
                <Wrench className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Vous n'avez rien publie
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'product'
                ? 'Commencez par publier votre premier produit.'
                : 'Commencez par publier votre premier service.'}
            </p>
            <Link
              to={activeTab === 'product' ? '/publish' : '/publish?type=service'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Publier maintenant
            </Link>
          </motion.div>
        ) : (
          /* Product/Service grid */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {products.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full items-center justify-center ${
                      item.images && item.images.length > 0 ? 'hidden' : 'flex'
                    }`}
                  >
                    <ImageOff className="w-8 h-8 text-gray-300" />
                  </div>

                  {/* Promoted badge */}
                  {item.is_promoted && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-yellow-900" />
                      Promu
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                    {getCategoryLabel(item.category)}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-purple-600 mb-1">
                    {item.type === 'service' && item.pricing_type === 'custom_quote' ? 'Sur Devis' : formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(item.created_at)}
                    {item.type === 'product' && item.quantity != null && (
                      <>
                        <span className="mx-1">|</span>
                        <span>Stock: {item.quantity}</span>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                    {/* Edit */}
                    <Link
                      to={`/publish?edit=${item.id}&type=${item.type}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modifier
                    </Link>

                    {/* Promote */}
                    {item.type === 'product' && (
                      <Link
                        to={`/promote/${item.id}`}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          item.is_promoted
                            ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        {item.is_promoted ? 'Promu' : 'Promouvoir'}
                      </Link>
                    )}

                    {/* Quittance */}
                    {item.is_promoted && item.last_transaction_id && (
                      <Link
                        to={`/quittance?pid=${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Quittance
                      </Link>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        productTitle={deleteTarget?.title || ''}
        loading={deleting}
      />
    </div>
  );
}
