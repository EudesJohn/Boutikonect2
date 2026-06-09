import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  CheckCircle,
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ImageOff,
  TrendingUp,
  Zap,
  Crown,
  Sparkles,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getProductById } from '../lib/database';
import { supabase } from '../lib/supabase';
import { downloadReceipt } from '../lib/receipt';

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

const PLANS = [
  {
    id: '3days',
    duration: '3 jours',
    durationDays: 3,
    price: 1000,
    priceLabel: '1 000 FCFA',
    icon: Zap,
    color: 'blue',
    benefits: [
      'Visibilite accrue dans les recherches',
      'Badge "Promu" sur votre annonce',
      'Mise en avant pendant 3 jours',
    ],
  },
  {
    id: '1week',
    duration: '1 semaine',
    durationDays: 7,
    price: 2500,
    priceLabel: '2 500 FCFA',
    icon: TrendingUp,
    color: 'purple',
    benefits: [
      'Visibilite accrue dans les recherches',
      'Badge "Promu" sur votre annonce',
      'Mise en avant pendant 1 semaine',
      'Priorite dans les resultats de recherche',
    ],
    popular: true,
  },
  {
    id: '1month',
    duration: '1 mois',
    durationDays: 30,
    price: 9000,
    priceLabel: '9 000 FCFA',
    icon: Crown,
    color: 'amber',
    benefits: [
      'Visibilite maximale dans les recherches',
      'Badge "Promu" sur votre annonce',
      'Mise en avant pendant 1 mois',
      'Priorite absolue dans les resultats',
      'Apparition en page d\'accueil',
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount) {
  if (amount == null) return 'Prix sur devis';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

function getTimeRemaining(endDateStr) {
  if (!endDateStr) return null;
  const now = new Date();
  const end = new Date(endDateStr);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return { days, hours };
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success Animation
// ---------------------------------------------------------------------------

function SuccessAnimation({ onClose, receiptInfo, navigateToQuittance }) {
  function handleDownloadReceipt() {
    if (!receiptInfo) return;
    downloadReceipt(receiptInfo);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="w-10 h-10 text-green-600" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Paiement reussi!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 mb-6"
        >
          Votre produit est maintenant promu et beneficie d'une visibilite
          accrue.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-3"
        >
          {receiptInfo && (
            <button
              onClick={handleDownloadReceipt}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Telecharger la quittance
            </button>
          )}
          {navigateToQuittance && (
            <button
              onClick={navigateToQuittance}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Voir ma quittance
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Retour a mes annonces
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Promote() {
  const { id } = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('1week');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [receiptInfo, setReceiptInfo] = useState(null);
  const [promotionHistory, setPromotionHistory] = useState(null);
  const [promoLoaded, setPromoLoaded] = useState(false);

  // -----------------------------------------------------------------------
  // Redirect if not authenticated
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // -----------------------------------------------------------------------
  // Fetch product
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || !id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(id);
        if (!cancelled) {
          setProduct(data);
          if (data.is_promoted && data.promoted_until) {
            const remaining = getTimeRemaining(data.promoted_until);
            setRemainingTime(remaining);
          }
          // Fetch latest promotion for receipt download
          supabase
            .from('promotions')
            .select('*')
            .eq('product_id', id)
            .order('start_date', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data: promo, error: promoErr }) => {
              if (!cancelled) {
                if (promo && !promoErr) setPromotionHistory(promo);
                setPromoLoaded(true);
              }
            });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Produit introuvable.');
          toast.error(err.message || 'Erreur de chargement.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  // -----------------------------------------------------------------------
  // Check if product belongs to user
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (product && user && product.seller_id !== user.id) {
      toast.error('Ce produit ne vous appartient pas.');
      navigate('/my-products', { replace: true });
    }
  }, [product, user, navigate]);

  // -----------------------------------------------------------------------
  // Check URL params on mount (return from FedaPay redirect)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // FedaPay peut utiliser différents noms de paramètres selon le mode
    const transactionId = params.get('transaction_id')
      || params.get('id')
      || params.get('fp_transaction_id');
    if (transactionId && id) {
      activateFromCallback(transactionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Activate promotion after FedaPay redirect (server-side verification)
  // -----------------------------------------------------------------------
  async function activateFromCallback(transactionId) {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fedapay-activate', {
        body: { transaction_id: transactionId, product_id: id },
      });

      if (error) throw new Error(error.message);

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur inconnue');
      }

      toast.success('Paiement confirmé ! Votre produit est maintenant promu.');

      setProduct((prev) => ({
        ...prev,
        is_promoted: true,
        promoted_until: data.promoted_until,
      }));
      setRemainingTime({ days: Math.ceil(
        (new Date(data.promoted_until).getTime() - Date.now()) / 86400000
      ), hours: 0 });

      // Store receipt info for download
      const durationLabel = data.duration_days
        ? `${data.duration_days} jour${data.duration_days > 1 ? 's' : ''}`
        : '';
      const receiptData = {
        transactionId: data.transaction_id || transactionId,
        amount: data.amount || 0,
        durationLabel,
        productTitle: product?.title || 'Produit',
        productImage: product?.images?.[0] || null,
        validUntil: data.promoted_until,
        customerName: user?.user_metadata?.full_name || profile?.full_name || '',
        customerEmail: user?.email || '',
        plan: {
          duration: durationLabel,
          durationDays: data.duration_days,
          price: data.amount || 0,
          priceLabel: data.amount ? `${Number(data.amount).toLocaleString('fr-FR')} FCFA` : '',
        },
        seller: {
          name: user?.user_metadata?.full_name || profile?.full_name || '',
          email: user?.email || '',
        },
      };
      setReceiptInfo(receiptData);

      // Store in sessionStorage for ReceiptPage access
      sessionStorage.setItem('last_promotion_receipt', JSON.stringify(receiptData));

      setShowSuccess(true);
      setProcessing(false);
      // Clean URL params
      window.history.replaceState({}, '', '/promote/' + id);
    } catch (err) {
      console.error('[Activate] Error:', err);
      toast.error('Erreur activation: ' + (err.message || 'inconnue'));
      setProcessing(false);
    }
  }

  // -----------------------------------------------------------------------
  // Open FedaPay checkout — create session via API then redirect
  // -----------------------------------------------------------------------
  async function handleOpenCheckout() {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setProcessing(true);

    const returnUrl = window.location.origin + '/promote/' + id;

    try {
      const { data, error } = await supabase.functions.invoke('fedapay-checkout', {
        body: {
          amount: plan.price,
          description: `Promotion ${plan.duration} - ${product?.title || 'Produit'}`,
          customer_email: user?.email || 'client@example.com',
          customer_name: user?.user_metadata?.full_name || profile?.full_name || '',
          callback_url: returnUrl,
          product_id: id,
          duration_days: plan.durationDays,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la création du paiement');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Redirect to FedaPay checkout
      if (data?.url) {
        toast.success('Redirection vers la page de paiement sécurisée...');
        // Small delay so user sees the success toast before redirect
        setTimeout(() => {
          window.location.href = data.url;
        }, 800);
      } else {
        throw new Error('URL de paiement non trouvée');
      }
    } catch (err) {
      console.error('[FedaPay] Error:', err);
      toast.error('Erreur de paiement: ' + (err.message || 'inconnue'));
      setProcessing(false);
    }
  }

  function handleCloseSuccess() {
    setShowSuccess(false);
    navigate('/my-products');
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
  // Loading
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <Skeleton />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Error
  // -----------------------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Produit introuvable
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/my-products')}
            className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            Mes annonces
          </button>
        </motion.div>
      </div>
    );
  }

  if (!product) return null;

  // -----------------------------------------------------------------------
  // Build receipt data (from history or fallback)
  // -----------------------------------------------------------------------
  function buildReceiptInfo() {
    if (receiptInfo) return receiptInfo; // from current activation
    const promo = promotionHistory;
    const durationLabel = promo?.duration_days
      ? `${promo.duration_days} jour${promo.duration_days > 1 ? 's' : ''}`
      : product?.duration_days
        ? `${product.duration_days} jour${product.duration_days > 1 ? 's' : ''}`
        : '';
    return {
      transactionId: promo?.transaction_id || 'N/A',
      amount: promo?.amount || 0,
      durationLabel,
      productTitle: product?.title || 'Produit',
      validUntil: product?.promoted_until || new Date().toISOString(),
      customerName: user?.user_metadata?.full_name || profile?.full_name || '',
      customerEmail: user?.email || '',
    };
  }

  function handleDownloadReceiptFromBanner() {
    const info = buildReceiptInfo();
    downloadReceipt(info);
  }

  // -----------------------------------------------------------------------
  // Already promoted — show banner but still allow extending promotion
  // -----------------------------------------------------------------------
  const isActivePromotion = product.is_promoted && remainingTime;

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/my-products')}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour a mes annonces
        </motion.button>

        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-8"
        >
          Promouvoir votre annonce
        </motion.h1>

        {/* Already promoted banner */}
        {isActivePromotion && promoLoaded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3"
          >
            <Star className="w-5 h-5 text-yellow-600 fill-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800 flex-1">
              <span className="font-semibold">Deja promu</span> — il reste{' '}
              <span className="font-bold">{remainingTime.days} jour{remainingTime.days > 1 ? 's' : ''}</span>
              {remainingTime.hours > 0 && ` et ${remainingTime.hours} heure${remainingTime.hours > 1 ? 's' : ''}`}.
              Vous pouvez prolonger la promotion en choisissant un forfait ci-dessous.
            </div>
            <button
              onClick={handleDownloadReceiptFromBanner}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-yellow-300 text-yellow-800 text-xs font-semibold rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Re-télécharger la quittance
            </button>
          </motion.div>
        )}

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 mb-8"
        >
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{product.title}</h3>
            <p className="text-sm text-gray-500">{product.category}</p>
            <p className="text-sm font-bold text-purple-600">
              {formatPrice(product.price)}
            </p>
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const colorMap = {
              blue: {
                bg: 'bg-blue-100',
                text: 'text-blue-600',
                ring: 'ring-blue-500',
                border: 'border-blue-200',
                btn: 'bg-blue-600 hover:bg-blue-700',
              },
              purple: {
                bg: 'bg-purple-100',
                text: 'text-purple-600',
                ring: 'ring-purple-500',
                border: 'border-purple-200',
                btn: 'bg-purple-600 hover:bg-purple-700',
              },
              amber: {
                bg: 'bg-amber-100',
                text: 'text-amber-600',
                ring: 'ring-amber-500',
                border: 'border-amber-200',
                btn: 'bg-amber-600 hover:bg-amber-700',
              },
            };
            const colors = colorMap[plan.color];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`relative bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${colors.ring} ring-2 shadow-lg`
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Populaire
                  </div>
                )}

                <div className="p-6">
                  {/* Icon & Duration */}
                  <div
                    className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {plan.duration}
                  </h3>
                  <p className={`text-2xl font-bold ${colors.text} mb-4`}>
                    {plan.priceLabel}
                  </p>

                  {/* Radio */}
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={isSelected}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-600">Selectionner</span>
                  </label>

                  {/* Benefits */}
                  <ul className="space-y-2">
                    {plan.benefits.map((benefit, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Payment section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Section header */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Paiement securise
            </h2>
          </div>

          <div className="p-6">
            {/* Accepted methods */}
            <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Accepte :
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                <span className="text-base">📱</span> MTN MoMo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                <span className="text-base">📱</span> Moov Flooz
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                <span className="text-base">💳</span> Carte bancaire
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">
                via FedaPay
              </span>
            </div>

            {/* Recap commande */}
            {(() => {
              const plan = PLANS.find((p) => p.id === selectedPlan);
              if (!plan) return null;
              const Icon = plan.icon;
              return (
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Recapitulatif de votre commande
                  </p>
                  <div className="flex items-start gap-3">
                    {product?.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {product?.title || 'Produit'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs text-gray-500">
                          Promotion {plan.duration}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-purple-600">
                        {plan.priceLabel}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={handleOpenCheckout}
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all shadow-lg shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {isActivePromotion ? 'Prolonger' : 'Payer'} {(() => {
                    const plan = PLANS.find((p) => p.id === selectedPlan);
                    return plan ? plan.priceLabel : '';
                  })()}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="6" width="22" height="12" rx="2" />
                  <path d="M6 12h4" />
                </svg>
                Paiement 100% securise
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-400">
                Environnement de test (sandbox)
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Receipt download card */}
      {promoLoaded && product?.is_promoted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Quittance de paiement
            </h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>
                {remainingTime
                  ? 'Votre produit est actuellement en promotion.'
                  : 'Votre produit a bénéficié d\'une promotion.'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Téléchargez votre reçu de paiement au format PDF.
              </p>
            </div>
            <button
              onClick={handleDownloadReceiptFromBanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md cursor-pointer shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Re-télécharger la quittance
            </button>
          </div>
        </motion.div>
      )}

      {/* Success modal */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessAnimation
            onClose={handleCloseSuccess}
            receiptInfo={receiptInfo}
            navigateToQuittance={() => { setShowSuccess(false); navigate('/quittance'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
