import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Package,
  Heart,
  Share2,
  Eye,
  User,
  ShieldCheck,
  Clock,
  Briefcase,
} from 'lucide-react';
import { getFullServiceById, formatPrice, getServiceReviews, getOrCreateConversation } from '../lib/database';
import { getCategoryLabel } from '../lib/categories';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import ReviewForm from '../components/ReviewForm';
import { useTracking } from '../hooks/useTracking';

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
      <Briefcase className="w-20 h-20 text-gray-700 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Service introuvable</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        Le service que vous recherchez n'existe pas ou a ete supprime.
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
// ServiceDetail Page
// ===================================================================
export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Service state
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wishlist
  const [isFavorited, setIsFavorited] = useState(false);
  const { trackServiceView } = useTracking();
  const { user, isAuthenticated } = useAuth();

  // Reviews
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // -----------------------------------------------------------------------
  // Load service
  // -----------------------------------------------------------------------
  const loadService = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const result = await getFullServiceById(id);

    if (result.error) {
      setError(result.error);
    } else if (result.service) {
      setService(result.service);
    } else {
      setError('Service introuvable.');
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  // Tracker la vue service
  useEffect(() => {
    if (service) {
      trackServiceView(service.id);
    }
  }, [service, trackServiceView]);

  // -----------------------------------------------------------------------
  // Load reviews
  // -----------------------------------------------------------------------
  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const result = await getServiceReviews(id);
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
      setIsFavorited(stored.includes(`service_${id}`));
    } catch {
      // ignore
    }
  }, [id]);

  const toggleWishlist = useCallback(() => {
    try {
      const key = `service_${id}`;
      const stored = JSON.parse(localStorage.getItem('boutikonect_wishlist') || '[]');
      let updated;
      if (stored.includes(key)) {
        updated = stored.filter((pid) => pid !== key);
        toast.success('Retire des favoris');
      } else {
        updated = [...stored, key];
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
          title: service?.title || 'BoutiKonect',
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copie dans le presse-papier !');
    }
  }, [service]);

  // -----------------------------------------------------------------------
  // Contact seller (in-app messaging)
  // -----------------------------------------------------------------------
  const handleContactSeller = useCallback(async () => {
    if (!user) {
      navigate('/login', { state: { from: `/service/${service?.slug}` } });
      return;
    }
    if (!service?.seller_id || service.seller_id === user.id) {
      toast.error('Vous ne pouvez pas vous envoyer un message à vous-même.');
      return;
    }
    try {
      const conv = await getOrCreateConversation(user.id, service.seller_id, null, service.id);
      if (conv?.id) {
        navigate('/messages');
      } else {
        toast.error('Erreur lors de la création de la conversation.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création de la conversation.');
    }
  }, [user, navigate, service]);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------
  const image = service?.images?.[0] || null;
  const isQuoteBased = service?.pricing_type === 'custom_quote';
  const displayPrice = isQuoteBased ? 'Sur Devis' : formatPrice(service?.price);
  const seller = service?.seller;
  const reviews = reviewsList;
  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
      : 0;

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

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        {error.includes('introuvable') || error.includes('not found') ? (
          <NotFound />
        ) : (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadService}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              Reessayer
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <NotFound />
      </div>
    );
  }

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
          {/* ---- Left: Image ---- */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            {image ? (
              <img
                src={image}
                alt={service.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                <Briefcase className="w-20 h-20 mb-2" />
                <span className="text-sm">Image non disponible</span>
              </div>
            )}

            {/* Promoted badge */}
            {service.is_promoted && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-yellow-900 bg-yellow-300 shadow-lg animate-pulse">
                  <Star size={12} fill="currentColor" />
                  Vedette
                </span>
              </div>
            )}
          </div>

          {/* ---- Right: Service info ---- */}
          <div>
            {/* Category */}
            {service.category && (
              <span className="inline-block text-xs font-medium text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full mb-3">
                {getCategoryLabel(service.category)}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {service.title}
            </h1>

            {/* Price / Devis */}
            <div
              className={`text-3xl font-bold mb-4 ${
                isQuoteBased
                  ? 'text-purple-400 bg-purple-500/10 px-3 py-1 inline-block rounded-lg text-lg'
                  : 'text-amber-400'
              }`}
            >
              {displayPrice}
            </div>

            {/* Description */}
            {service.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            )}

            {/* Service type badge */}
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {isQuoteBased
                  ? 'Ce service est sur devis. Contactez le prestataire pour obtenir un tarif.'
                  : 'Prix fixe indique par le prestataire.'}
              </span>
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
            </div>

            {/* Seller info card */}
            {seller && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Prestataire</h3>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden">
                    {seller.avatar_url ? (
                      <img
                        src={seller.avatar_url}
                        alt={seller.full_name || 'Prestataire'}
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
                      to={`/seller/${service.seller_id}`}
                      className="font-semibold text-white truncate hover:text-amber-400 transition-colors block"
                    >
                      {seller.full_name || seller.store_name || 'Prestataire'}
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
                      href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, '')}?text=Bonjour%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20le%20service%20%3A%20${encodeURIComponent(service.title)}`}
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
      </div>

        {/* ---- Reviews Section ---- */}
        <div className="mt-12 border-t border-gray-800 pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                targetType="service"
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
  );
}
