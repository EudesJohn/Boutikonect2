import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  MapPin,
  Package,
  Wrench,
  Calendar,
  Phone,
  MessageCircle,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { getProfile, getProducts, getServices, formatPrice } from '../lib/database';
import StarRating from '../components/StarRating';

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-32 mb-6" />
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-800" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-800 rounded w-48" />
              <div className="h-4 bg-gray-800 rounded w-32" />
              <div className="h-4 bg-gray-800 rounded w-24" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden">
              <div className="aspect-square bg-gray-700/50" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-700/50 rounded w-1/3" />
                <div className="h-4 bg-gray-700/50 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state for a section
// ---------------------------------------------------------------------------
function EmptySection({ icon: Icon, message }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini product card (same style as ProductCard but just a link)
// ---------------------------------------------------------------------------
function MiniProductCard({ product }) {
  const image = product.images?.[0] || null;

  return (
    <Link
      to={`/product/${product.id}`}
      className="block bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all group"
    >
      <div className="aspect-square bg-gray-800 relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <Package className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">
          {product.title}
        </h3>
        <p className="text-amber-400 font-semibold text-sm mt-1">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Mini service card
// ---------------------------------------------------------------------------
function MiniServiceCard({ service }) {
  const image = service.images?.[0] || null;
  const isQuote = service.pricing_type === 'custom_quote';

  return (
    <Link
      to={`/service/${service.id}`}
      className="block bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all group"
    >
      <div className="aspect-square bg-gray-800 relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={service.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <Wrench className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors">
          {service.title}
        </h3>
        <p className="text-purple-400 font-semibold text-sm mt-1">
          {isQuote ? 'Sur Devis' : formatPrice(service.price)}
        </p>
      </div>
    </Link>
  );
}

// ===================================================================
// SellerProfile Page
// ===================================================================
export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------------
  // Load seller profile + their products and services
  // -----------------------------------------------------------------------
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [profile, productsRes, servicesRes] = await Promise.all([
        getProfile(id),
        getProducts({ sellerId: id, limit: 50 }),
        getServices({ sellerId: id, limit: 50 }),
      ]);

      if (!profile) {
        setError('Vendeur introuvable.');
      } else {
        setSeller(profile);
        setProducts(productsRes.data || []);
        setServices(servicesRes.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // -----------------------------------------------------------------------
  // Render: Loading
  // -----------------------------------------------------------------------
  if (loading) return <ProfileSkeleton />;

  // -----------------------------------------------------------------------
  // Render: Error / Not found
  // -----------------------------------------------------------------------
  if (error && !seller) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <User className="w-20 h-20 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Vendeur introuvable</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!seller) return null;

  const joinedDate = seller.created_at
    ? new Date(seller.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
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

        {/* ---- Seller Profile Card ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              {seller.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt={seller.full_name || 'Vendeur'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white truncate">
                  {seller.store_name || seller.full_name || 'Vendeur'}
                </h1>
                {seller.is_verified && (
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" title="Vendeur verifie" />
                )}
              </div>

              {seller.full_name && seller.store_name && (
                <p className="text-sm text-gray-500">{seller.full_name}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
                {seller.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[seller.city, seller.arrondissement, seller.neighborhood].filter(Boolean).join(', ') || 'Localisation non renseignee'}
                  </span>
                )}
                {seller.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <StarRating rating={seller.rating} size="sm" />
                    <span className="text-xs">({seller.rating})</span>
                  </span>
                )}
                {joinedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Membre depuis {joinedDate}
                  </span>
                )}
                {seller.is_seller && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Store className="w-3.5 h-3.5" />
                    Vendeur
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio / description */}
          {seller.bio && (
            <p className="text-gray-400 text-sm mt-4 max-w-2xl">{seller.bio}</p>
          )}

          {/* Contact buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {seller.whatsapp && (
              <a
                href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
            {seller.phone && (
              <a
                href={`tel:${seller.phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                {seller.phone}
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{products.length}</p>
              <p className="text-xs text-gray-500">Produit{products.length > 1 ? 's' : ''}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{services.length}</p>
              <p className="text-xs text-gray-500">Service{services.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </motion.div>

        {/* ---- Products Section ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Produits</h2>
            <span className="text-sm text-gray-500">({products.length})</span>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <MiniProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptySection icon={Package} message="Ce vendeur n'a pas encore de produits." />
          )}
        </motion.section>

        {/* ---- Services Section ---- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Services</h2>
            <span className="text-sm text-gray-500">({services.length})</span>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {services.map((service) => (
                <MiniServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <EmptySection icon={Wrench} message="Ce vendeur n'a pas encore de services." />
          )}
        </motion.section>
      </div>
    </div>
  );
}
