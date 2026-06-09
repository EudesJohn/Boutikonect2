import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  User,
  AlertTriangle,
  MapPin,
  Phone,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, formatPrice, validateBeninPhone } from '../lib/database';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Guest session helper
// ---------------------------------------------------------------------------
async function ensureGuestSession() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data?.user) {
      console.error('Guest session error:', error);
      return null;
    }
    return data.user.id;
  } catch (err) {
    console.error('Guest session error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Empty cart state
// ---------------------------------------------------------------------------
function EmptyCart() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        <ShoppingCart className="w-12 h-12 text-gray-600" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Votre panier est vide</h2>
      <p className="text-gray-400 mb-6 max-w-sm">
        Parcourez nos produits et ajoutez ceux qui vous interessent a votre panier.
      </p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
      >
        <ShoppingBag className="w-5 h-5" />
        Decouvrir nos produits
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------
function OrderSuccess({ order, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto text-center py-12"
    >
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Commande confirmee !</h2>
      <p className="text-gray-400 mb-6">
        Votre commande a ete envoyee au vendeur. Vous serez contacte prochainement
        pour finaliser la livraison.
      </p>

      {order && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Resume de la commande</span>
          </div>
          <div className="space-y-1 text-sm text-gray-400">
            <p>Numero de commande : <span className="text-white font-mono">{order.id?.slice(0, 8)}</span></p>
            <p>Total : <span className="text-white font-semibold">{formatPrice(order.total_amount)}</span></p>
            <p>Statut : <span className="text-amber-400 font-medium">En attente de confirmation</span></p>
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors cursor-pointer"
      >
        <ShoppingBag className="w-5 h-5" />
        Continuer mes achats
      </button>
    </motion.div>
  );
}

// ===================================================================
// Cart Page
// ===================================================================
export default function Cart() {
  const { items, cartTotal, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();

  // Checkout form state
  const [buyerName, setBuyerName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [buyerPhone, setBuyerPhone] = useState(profile?.phone || '');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Order state
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // -----------------------------------------------------------------------
  // Phone validation
  // -----------------------------------------------------------------------
  const handlePhoneChange = useCallback((value) => {
    setBuyerPhone(value);
    if (value && !validateBeninPhone(value)) {
      setPhoneError(
        'Format de telephone beninois invalide. Utilisez +229 XXXX XXXX ou 01 XX XX XX XX.'
      );
    } else {
      setPhoneError('');
    }
  }, []);

  // -----------------------------------------------------------------------
  // Submit order
  // -----------------------------------------------------------------------
  const handleSubmitOrder = useCallback(async () => {
    // Validate
    if (!buyerName.trim()) {
      toast.error('Veuillez entrer votre nom.');
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error('Veuillez entrer votre numero de telephone.');
      return;
    }
    if (!validateBeninPhone(buyerPhone)) {
      toast.error('Format de telephone invalide. Utilisez +229 XXXX XXXX ou 01 XX XX XX XX.');
      return;
    }
    if (!buyerAddress.trim()) {
      toast.error('Veuillez entrer votre adresse de livraison.');
      return;
    }
    if (items.length === 0) {
      toast.error('Votre panier est vide.');
      return;
    }

    // Guest checkout : creer une session anonyme si necessaire
    const effectiveUserId = user?.id || await ensureGuestSession();

    if (!effectiveUserId) {
      toast.error('Impossible de passer commande pour le moment.');
      return;
    }

    setSubmitting(true);

    // Create orders for each item (group by seller? For now, one order per item)
    let lastOrder = null;
    let allSuccess = true;

    for (const item of items) {
      try {
        const order = await createOrder({
          product_id: item.id,
          quantity: item.quantity,
          total_amount: item.price * item.quantity,
          buyer_id: effectiveUserId,
          seller_id: item.sellerId,
          shipping_address: buyerAddress.trim(),
          delivery_contact_name: buyerName.trim(),
          delivery_contact_phone: buyerPhone.trim(),
        });
        lastOrder = order;
      } catch (err) {
        toast.error(`Erreur pour "${item.title}" : ${err.message}`);
        allSuccess = false;
      }
    }

    if (allSuccess) {
      toast.success('Commande(s) passee(s) avec succes !');
      setOrderResult(lastOrder);
      clearCart();
    } else {
      toast.error('Certaines commandes ont echoue. Verifiez les details.');
    }

    setSubmitting(false);
  }, [buyerName, buyerPhone, buyerAddress, items, clearCart, user]);

  // -----------------------------------------------------------------------
  // Continue shopping
  // -----------------------------------------------------------------------
  const handleContinue = useCallback(() => {
    setOrderResult(null);
  }, []);

  // -----------------------------------------------------------------------
  // Render: Success state
  // -----------------------------------------------------------------------
  if (orderResult) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <OrderSuccess order={orderResult} onContinue={handleContinue} />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Empty cart
  // -----------------------------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <EmptyCart />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Cart with items
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Mon Panier</h1>
            <span className="text-sm text-gray-500">({cartCount} article{cartCount > 1 ? 's' : ''})</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Vider le panier ?')) {
                clearCart();
              }
            }}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Vider le panier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ---- Cart Items ---- */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.id}`}
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-amber-400 font-bold text-sm mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Stock warning */}
                    {item.quantity > item.stock && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">
                          Stock insuffisant. Maximum : {item.stock}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 bg-gray-800 rounded-lg border border-gray-700">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Item total */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    {item.sellerName && (
                      <Link
                        to={`/seller/${item.sellerId}`}
                        className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 hover:text-amber-400 transition-colors justify-end"
                      >
                        {item.sellerAvatar ? (
                          <img src={item.sellerAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <User size={12} className="shrink-0" />
                        )}
                        <span>Vendu par {item.sellerName}</span>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ---- Summary + Checkout ---- */}
          <div className="space-y-4">
            {/* Summary box */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Resume de la commande</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Articles ({cartCount})</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Livraison</span>
                  <span className="text-gray-500">Calculee ulterieurement</span>
                </div>
                <div className="border-t border-gray-800 pt-2 flex justify-between font-bold text-white">
                  <span>Total</span>
                  <span className="text-amber-400">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            {/* Checkout form */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">
                Informations de livraison
              </h3>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nom complet *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Telephone * (Format Benin)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+229 XX XX XX XX"
                      className={`w-full pl-9 pr-3 py-2 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                        phoneError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-700 focus:ring-amber-500'
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Adresse de livraison *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <textarea
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      rows={2}
                      placeholder="Ville, quartier, points de repere..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl transition-all disabled:cursor-not-allowed mt-2 cursor-pointer"
                >
                  {submitting ? (
                    'Traitement en cours...'
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Passer la commande ({formatPrice(cartTotal)})
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-600 text-center">
                  En passant la commande, vous acceptez nos conditions generales de vente.
                  Le vendeur vous contactera pour confirmer la livraison.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
