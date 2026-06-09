import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Flag,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  Shield,
  ShieldCheck,
  Clock,
  Eye,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTracking } from '../hooks/useTracking';
import { getFullProductById, formatPrice, createReport, getProductReviews, getOrCreateConversation } from '../lib/database';
import { getCategoryLabel } from '../lib/categories';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import ReviewForm from '../components/ReviewForm';
import Modal from '../components/ui/Modal';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REPORT_REASONS = [
  { label: 'Produit non conforme a la description', value: 'fake' },
  { label: 'Produit contrefait ou de qualite douteuse', value: 'fake' },
  { label: 'Prix abusif', value: 'inappropriate' },
  { label: 'Vendeur non fiable', value: 'other' },
  { label: 'Arnaque ou fraude', value: 'spam' },
  { label: 'Contenu inapproprie', value: 'offensive' },
  { label: 'Produit dangereux', value: 'inappropriate' },
  { label: 'Autre motif', value: 'other' },
];

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      <div className="h-6 bg-gray-800 rounded w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-800 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-800 rounded w-1/3" />
          <div className="h-8 bg-gray-800 rounded w-3/4" />
          <div className="h-6 bg-gray-800 rounded w-1/2" />
          <div className="h-20 bg-gray-800 rounded w-full" />
          <div className="h-10 bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotFound
// ---------------------------------------------------------------------------
function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <Package className="w-20 h-20 text-gray-700 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Produit introuvable</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        Le produit que vous recherchez n'existe pas ou a ete supprime.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>
    </div>
  );
}

// ===================================================================
// ProductDetail Page
// ===================================================================
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { trackProductView } = useTracking();

  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Image gallery
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Wishlist (localStorage)
  const [isFavorited, setIsFavorited] = useState(false);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Reviews
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // -----------------------------------------------------------------------
  // Load product
  // -----------------------------------------------------------------------
  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const result = await getFullProductById(id);

    if (result.error) {
      setError(result.error);
    } else if (result.product) {
      setProduct(result.product);
    } else {
      setError('Produit introuvable.');
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Tracker la vue produit
  useEffect(() => {
    if (product) {
      trackProductView(product.id, product.category);
    }
  }, [product, trackProductView]);

  // -----------------------------------------------------------------------
  // Load reviews
  // -----------------------------------------------------------------------
  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const result = await getProductReviews(id);
      setReviewsList(result.data || []);
    } catch {
      // silence — reviews are non-critical
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // -----------------------------------------------------------------------
  // Wishlist
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!id) return;
    try {
      const stored = JSON.parse(localStorage.getItem('boutikonect_wishlist') || '[]');
      setIsFavorited(stored.includes(id));
    } catch {
      // ignore
    }
  }, [id]);

  const toggleWishlist = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('boutikonect_wishlist') || '[]');
      let updated;
      if (stored.includes(id)) {
        updated = stored.filter((pid) => pid !== id);
        toast.success('Retire des favoris');
      } else {
        updated = [...stored, id];
        toast.success('Ajoute aux favoris');
      }
      localStorage.setItem('boutikonect_wishlist', JSON.stringify(updated));
      setIsFavorited(!isFavorited);
    } catch {
      toast.error('Erreur lors de la mise a jour des favoris.');
    }
  }, [id, isFavorited]);

  // -----------------------------------------------------------------------
  // Share
  // -----------------------------------------------------------------------
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || 'BoutiKonect',
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copie dans le presse-papier !');
    }
  }, [product]);

  // -----------------------------------------------------------------------
  // Report
  // -----------------------------------------------------------------------
  const handleReport = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour signaler un produit.');
      return;
    }
    if (!reportReason) {
      toast.error('Veuillez selectionner un motif.');
      return;
    }

    setReportSubmitting(true);
    try {
      await createReport({
        product_id: id,
        reporter_id: user.id,
        reason: reportReason,
        description: reportDetails,
      });

      toast.success('Signalement envoye. Merci de votre vigilance !');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      toast.error(err.message || 'Echec de l envoi du signalement.');
    } finally {
      setReportSubmitting(false);
    }
  }, [id, user, isAuthenticated, reportReason, reportDetails]);

  // -----------------------------------------------------------------------
  // Add to cart
  // -----------------------------------------------------------------------
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (!product.quantity || product.quantity <= 0) {
      toast.error('Ce produit est en rupture de stock.');
      return;
    }

    // Add to cart multiple times if quantity > 1
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        stock: product.quantity,
        image: product.images?.[0] || '',
        sellerId: product.seller_id,
        sellerName: product.seller?.full_name || '',
        sellerAvatar: product.seller?.avatar_url || '',
      });
    }
  }, [product, quantity, addToCart]);

  // -----------------------------------------------------------------------
  // Contact seller (opens in-app messaging)
  // -----------------------------------------------------------------------
  const handleContactSeller = useCallback(async () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${product?.slug}` } });
      return;
    }
    if (!product?.seller_id || product.seller_id === user.id) {
      toast.error('Vous ne pouvez pas vous envoyer un message à vous-même.');
      return;
    }
    try {
      const conv = await getOrCreateConversation(user.id, product.seller_id, product.id);
      if (conv?.id) {
        navigate('/messages');
      } else {
        toast.error('Erreur lors de la création de la conversation.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création de la conversation.');
    }
  }, [user, navigate, product]);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------
  const images = useCallback(() => {
    if (!product?.images || !Array.isArray(product.images)) return [];
    return product.images.filter(Boolean);
  }, [product]);

  const mainImage = images()[selectedImageIndex] || images()[0] || null;
  const inStock = product?.quantity != null && product.quantity > 0;
  const seller = product?.seller;
  const reviews = reviewsList;
  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
      : product?.average_rating || 0;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <DetailSkeleton />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        {error.includes('introuvable') || error.includes('not found') ? (
          <NotFound />
        ) : (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadProduct}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              Reessayer
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <NotFound />
      </div>
    );
  }

  const allImages = images();

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* ---- Left: Image gallery ---- */}
          <div>
            {/* Main image */}
            <div
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 cursor-pointer group"
              onClick={() => setFullscreenPreview(true)}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                  <Package className="w-20 h-20 mb-2" />
                  <span className="text-sm">Image non disponible</span>
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white/70">
                <Eye className="w-4 h-4" />
              </div>

              {/* Promoted badge on image */}
              {product.is_promoted && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-yellow-900 bg-yellow-300 shadow-lg animate-pulse">
                    <Star size={12} fill="currentColor" />
                    Vedette
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails row */}
            {allImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {allImages.slice(0, showAllImages ? allImages.length : 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? 'border-amber-500 opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
                {allImages.length > 5 && !showAllImages && (
                  <button
                    onClick={() => setShowAllImages(true)}
                    className="shrink-0 w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    +{allImages.length - 5}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ---- Right: Product info ---- */}
          <div>
            {/* Category */}
            {product.category && (
              <span className="inline-block text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full mb-3">
                {getCategoryLabel(product.category)}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {product.title}
            </h1>

            {/* Price */}
            <div className="text-3xl font-bold text-amber-400 mb-4">
              {formatPrice(product.price)}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-4">
              {inStock ? (
                <>
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">
                    En stock ({product.quantity} unite{product.quantity > 1 ? 's' : ''})
                  </span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400 font-medium">Rupture de stock</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity selector + Add to cart */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Quantity */}
              {inStock && (
                <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-xl">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-3 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Diminuer la quantite"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                    disabled={quantity >= product.quantity}
                    className="p-3 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Augmenter la quantite"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {inStock ? 'Ajouter au panier' : 'Indisponible'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-8">
              {/* Wishlist */}
              <button
                onClick={toggleWishlist}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm ${
                  isFavorited
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Favori' : 'Ajouter aux favoris'}
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg transition-all text-sm"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>

              {/* Report */}
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Veuillez vous connecter pour signaler un produit.');
                    return;
                  }
                  setShowReportModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-500 hover:text-red-400 rounded-lg transition-all text-sm"
              >
                <Flag className="w-4 h-4" />
                Signaler
              </button>
            </div>

            {/* Seller info card */}
            {seller && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Vendeur</h3>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden">
                    {seller.avatar_url ? (
                      <img
                        src={seller.avatar_url}
                        alt={seller.full_name || 'Vendeur'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/seller/${product.seller_id}`}
                      className="font-semibold text-white truncate hover:text-amber-400 transition-colors block"
                    >
                      {seller.full_name || seller.store_name || 'Vendeur'}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {[seller.city, seller.arrondissement, seller.neighborhood].filter(Boolean).join(', ') || 'Localisation non renseignee'}
                      </span>
                    </div>
                    {seller.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating rating={seller.rating} size="sm" />
                        <span className="text-xs text-gray-500">({seller.rating})</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={handleContactSeller}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter
                  </button>
                  {seller.whatsapp && (
                    <a
                      href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, '')}?text=Bonjour%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20${encodeURIComponent(product.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                  {seller.phone && (
                    <a
                      href={`tel:${seller.phone}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {seller.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Reviews Section ---- */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">
                Avis ({reviews.length})
              </h2>
              {averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating rating={averageRating} size="sm" />
                  <span className="text-sm text-gray-400">{averageRating}/5</span>
                </div>
              )}
            </div>
            {isAuthenticated && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Star className="w-4 h-4" />
                Donner mon avis
              </button>
            )}
          </div>

          {/* Review form */}
          {showReviewForm && (
            <div className="mb-6">
              <ReviewForm
                targetType="product"
                targetId={id}
                reviewerId={user?.id}
                onSuccess={() => {
                  setShowReviewForm(false);
                  loadReviews();
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          {/* Loading */}
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-900/30 rounded-xl border border-gray-800">
              <MessageCircle className="w-10 h-10 mx-auto text-gray-600 mb-2" />
              <p className="text-gray-500 text-sm">
                Aucun avis pour le moment. Soyez le premier a donner votre avis !
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-xl bg-gray-900/50 border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        {review.reviewer?.avatar_url ? (
                          <img
                            src={review.reviewer.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {review.reviewer?.full_name || 'Anonyme'}
                      </span>
                      {review.reviewer?.is_verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>
                  <StarRating rating={review.rating || 0} size="sm" className="mb-2" />
                  {review.comment && (
                    <p className="text-sm text-gray-400 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Fullscreen image preview modal ---- */}
      <AnimatePresence>
        {fullscreenPreview && mainImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={() => setFullscreenPreview(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
              onClick={() => setFullscreenPreview(false)}
              aria-label="Fermer"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Previous */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev <= 0 ? allImages.length - 1 : prev - 1
                  );
                }}
                className="absolute left-4 p-2 text-white/70 hover:text-white z-10"
                aria-label="Image precedente"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img
              src={mainImage}
              alt={product.title}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev >= allImages.length - 1 ? 0 : prev + 1
                  );
                }}
                className="absolute right-4 p-2 text-white/70 hover:text-white z-10"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 text-white/50 text-sm">
              {selectedImageIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Report Modal ---- */}
      <Modal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportReason('');
          setReportDetails('');
        }}
        title="Signaler ce produit"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Motif du signalement *
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Selectionnez un motif</option>
              {REPORT_REASONS.map((reason, idx) => (
                <option key={idx} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Details (optionnel)
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={4}
              placeholder="Fournissez des informations supplementaires sur le probleme..."
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">
              Les signalements abusifs peuvent entrainer des sanctions. Veuillez
              ne signaler que des problemes legitimes.
            </p>
          </div>

          <button
            onClick={handleReport}
            disabled={!reportReason || reportSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
          >
            {reportSubmitting ? (
              'Envoi en cours...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer le signalement
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
