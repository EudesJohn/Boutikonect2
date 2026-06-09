import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Package, Zap, User } from 'lucide-react';
import TiltCard from '@/components/ui/TiltCard';
import { getCategoryLabel } from '../lib/categories';

/**
 * Formats a numeric price to FCFA (XOF) currency string.
 */
function formatPrice(price) {
  if (price == null || isNaN(price)) return 'Prix non disponible';
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

/**
 * Truncates text to a max length with ellipsis.
 */
function truncateText(text, maxLength = 60) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * ProductCard — 3D tilt card with rich animations.
 */
export default function ProductCard({ product }) {
  const navigate = useNavigate();

  if (!product) {
    return null;
  }

  const {
    id,
    title = 'Produit sans titre',
    price,
    images,
    category,
    quantity,
    is_promoted,
    seller,
    seller_id,
    distance,
  } = product;

  const hasImage = images && Array.isArray(images) && images.length > 0 && images[0];
  const inStock = quantity != null && quantity > 0;
  const sellerName = seller?.full_name || seller?.store_name || 'Vendeur inconnu';
  const sellerCity = seller?.city || '';

  const handleClick = () => {
    if (id) {
      navigate(`/product/${id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <TiltCard
      tiltDegree={10}
      scale={1.03}
      perspective={900}
      speed={400}
      glare={true}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      ariaLabel={`Voir le produit : ${title}`}
      className="relative rounded-xl bg-white shadow-md hover:shadow-2xl cursor-pointer overflow-hidden transition-shadow duration-500 flex flex-col group"
    >
      {/* Promoted badge */}
      {is_promoted && (
        <div className="absolute top-3 left-3 z-10">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-yellow-900 bg-gradient-to-r from-yellow-300 to-amber-400 shadow-[0_0_15px_3px_rgba(250,204,21,0.5)] animate-pulse-glow-3d"
            aria-label="Produit vedette"
          >
            <Star size={12} fill="currentColor" className="animate-wiggle" />
            Vedette
          </motion.span>
        </div>
      )}

      {/* Distance badge */}
      {distance != null && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-blue-600/90 backdrop-blur-sm shadow-lg animate-slide-down">
            <MapPin size={12} />
            {'À'} {distance} km
          </span>
        </div>
      )}

      {/* Image container with overlay shimmer */}
      <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-125"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextElementSibling?.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}

        {/* Image shimmer overlay */}
        {hasImage && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }}
            aria-hidden="true"
          />
        )}

        {/* Fallback icon */}
        <div className={`flex flex-col items-center justify-center text-gray-400 ${hasImage ? 'hidden' : ''}`}>
          <Package size={48} strokeWidth={1} />
          <span className="text-xs mt-1">Image non disponible</span>
        </div>

        {/* Corner accent glow */}
        <div
          className="absolute -bottom-10 -right-10 w-20 h-20 rounded-full bg-amber-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2 relative z-10">
        {/* Category badge */}
        {category ? (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit"
          >
            {getCategoryLabel(category)}
          </motion.span>
        ) : null}

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-amber-700 transition-colors duration-300">
          {title}
        </h3>

        {/* Price */}
        <motion.p
          className="text-lg font-bold text-gray-900"
          whileHover={{ scale: 1.05, color: '#d97706' }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {formatPrice(price)}
        </motion.p>

        {/* Stock indicator */}
        <div className="flex items-center gap-1.5 mt-auto">
          <motion.span
            animate={inStock ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`inline-block w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`}
            aria-hidden="true"
          />
          <span
            className={`text-xs font-medium ${inStock ? 'text-green-700' : 'text-red-600'}`}
          >
            {inStock ? 'En stock' : 'Rupture'}
          </span>

          {/* Fast delivery hint */}
          {inStock && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-medium"
            >
              <Zap size={10} className="animate-pulse" />
              Livraison rapide
            </motion.span>
          )}
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
          {seller?.avatar_url ? (
            <img
              src={seller.avatar_url}
              alt={sellerName}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
          ) : (
            <User size={14} className="shrink-0" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/seller/${seller_id}`);
            }}
            className="truncate hover:text-amber-600 transition-colors text-left cursor-pointer"
            title="Voir le profil du vendeur"
          >
            {truncateText(sellerName, 30)}
          </button>
          {sellerCity ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{sellerCity}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Bottom glow line on hover */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 opacity-0 group-hover:opacity-100"
        layoutId={`glow-${id}`}
        transition={{ duration: 0.3 }}
        aria-hidden="true"
      />
    </TiltCard>
  );
}
