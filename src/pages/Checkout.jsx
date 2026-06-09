import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  CreditCard,
  MapPin,
  Phone,
  User,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/database';
import toast from 'react-hot-toast';

function formatPrice(amount) {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

function validatePhone(phone) {
  return /^(\+229|00229)?[0-9]{8,10}$/.test(phone.replace(/\s/g, ''));
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items: cart, cartTotal: total, clearCart } = useCart();
  const { user, profile } = useAuth();

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: '',
    city: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Nom requis';
    if (!form.phone.trim()) errs.phone = 'Telephone requis';
    else if (!validatePhone(form.phone)) errs.phone = 'Numero invalide (+229 XX XX XX XX)';
    if (!form.address.trim()) errs.address = 'Adresse requise';
    if (!form.city.trim()) errs.city = 'Ville requise';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) { toast.error('Veuillez vous connecter'); return; }

    setSubmitting(true);
    try {
      // Create one order per item with fields matching the orders table
      for (const item of cart) {
        await createOrder({
          product_id: item.id,
          quantity: item.quantity,
          total_amount: item.price * item.quantity,
          buyer_id: user.id,
          seller_id: item.sellerId || user.id,
          shipping_address: `${form.address.trim()}, ${form.city.trim()}`,
          delivery_contact_name: form.full_name.trim(),
          delivery_contact_phone: form.phone.trim(),
          notes: form.notes.trim(),
          status: 'pending',
        });
      }
      clearCart();
      setSuccess(true);
      toast.success('Commande passee avec succes !');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  }, [form, user, cart, clearCart]);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="p-8 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Commande confirmee !</h1>
            <p className="text-gray-400 mb-6">
              Votre commande a ete envoyee avec succes. Vous recevrez une confirmation par email.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/orders"
                className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
              >
                Voir mes commandes
              </Link>
              <Link
                to="/products"
                className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Panier vide</h1>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
          >
            Ajouter des articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour au panier
          </Link>

          <h1 className="text-2xl font-bold text-white mb-6">Finaliser la commande</h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
              >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  Informations de livraison
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom complet *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500 ${
                          errors.full_name ? 'border-red-500' : 'border-gray-700'
                        }`}
                        placeholder="Votre nom"
                      />
                    </div>
                    {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Telephone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-700'
                        }`}
                        placeholder="+229 XX XX XX XX"
                      />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500 ${
                          errors.address ? 'border-red-500' : 'border-gray-700'
                        }`}
                        placeholder="Numero, rue, quartier"
                      />
                    </div>
                    {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Ville *</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="Cotonou, Porto-Novo, etc."
                    />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes (optionnel)</label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder-gray-500"
                      placeholder="Instructions particulieres..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Sidebar inside form so the submit button is inside the <form> */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
                >
                  <h2 className="text-lg font-semibold text-white mb-4">Votre commande</h2>
                  <div className="space-y-3 mb-4">
                    {cart.map((item, i) => (
                      <div key={item.id || i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.quantity} x {formatPrice(item.price)}</p>
                        </div>
                        <p className="text-sm text-amber-400 font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-800 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Sous-total</span>
                      <span className="text-white">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Livraison</span>
                      <span className="text-gray-400">Calculer plus tard</span>
                    </div>
                    <div className="border-t border-gray-800 pt-2 mt-2 flex justify-between">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-amber-400 font-bold text-lg">{formatPrice(total)}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl transition-all cursor-pointer"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Commande en cours...</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> Commander ({formatPrice(total)})</>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
