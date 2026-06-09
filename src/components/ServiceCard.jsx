import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, User, Sparkles } from 'lucide-react';
import TiltCard from '@/components/ui/TiltCard';

function formatPrice(price) {
  if (price == null || isNaN(price)) return 'Prix non disponible';
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function truncateText(text, maxLength = 30) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * ServiceCard — 3D tilt card with rich animations for services.
 */
export default function ServiceCard({ service }) {
  const navigate = useNavigate();

  if (!service) {
    return null;
  }

  const {
    id,
    title = 'Service sans titre',
    description,
    price,
    pricing_type,
    category,
    images,
    seller,
    seller_id,
    is_promoted,
  } = service;

  const hasImage = images && Array.isArray(images) && images.length > 0 && images[0];
  const sellerName = seller?.full_name || seller?.store_name || 'Prestataire inconnu';
  const sellerCity = seller?.city || '';
  const displayPrice = pricing_type === 'custom_quote' ? 'Sur Devis' : formatPrice(price);

  const handleClick = () => {
    if (id) {
      navigate(`/service/${id}`);
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
      tiltDegree={8}
      scale={1.03}
      perspective={900}
      speed={400}
      glare={true}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      ariaLabel={`Voir le service : ${title}`}
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
            aria-label="Service vedette"
          >
            <Star size={12} fill="currentColor" className="animate-wiggle" />
            Vedette
          </motion.span>
        </div>
      )}

      {/* Image */}
      <div className="relative w-full h-44 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
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

        {/* Shimmer overlay */}
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

        {/* Fallback icon (visible when no image or image fails to load) */}
        <div
          className={`flex-col items-center justify-center text-indigo-300 ${hasImage ? 'hidden' : 'flex'}`}
          style={hasImage ? {} : { display: 'flex' }}
        >
          <User size={48} strokeWidth={1} />
          <span className="text-xs mt-1 text-indigo-400">Service</span>
        </div>

        {/* Corner glow */}
        <div
          className="absolute -bottom-10 -right-10 w-20 h-20 rounded-full bg-purple-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
            className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full w-fit"
          >
            {category}
          </motion.span>
        ) : null}

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-purple-700 transition-colors duration-300">
          {title}
        </h3>

        {/* Price / Devis */}
        <motion.p
          className={`text-lg font-bold ${
            pricing_type === 'custom_quote'
              ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-fit text-sm'
              : 'text-gray-900'
          }`}
          whileHover={pricing_type !== 'custom_quote' ? { scale: 1.05, color: '#7c3aed' } : {}}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {displayPrice}
        </motion.p>

        {/* Description preview */}
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1 text-[10px] text-purple-500 font-medium mt-1"
        >
          <Sparkles size={10} className="animate-pulse" />
          Prestataire vérifié
        </motion.div>

        {/* Seller info */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-auto">
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
            className="truncate hover:text-purple-600 transition-colors text-left cursor-pointer"
            title="Voir le profil du prestataire"
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
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-400 opacity-0 group-hover:opacity-100"
        layoutId={`glow-service-${id}`}
        transition={{ duration: 0.3 }}
        aria-hidden="true"
      />
    </TiltCard>
  );
}
