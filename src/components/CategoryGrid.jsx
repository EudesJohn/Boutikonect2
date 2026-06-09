import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Shirt,
  Apple,
  Home,
  Sparkles,
  Trophy,
  ToyBrick,
  Car,
  Wrench,
  Store,
} from 'lucide-react';

/**
 * Category data with icon component references and theme colors.
 */
const categories = [
  {
    name: 'Électronique',
    Icon: Smartphone,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    slug: 'Électronique',
  },
  {
    name: 'Vêtements',
    Icon: Shirt,
    color: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-600',
    textColor: 'text-pink-600',
    bgLight: 'bg-pink-50',
    glowColor: 'rgba(236, 72, 153, 0.3)',
    slug: 'Vêtements',
  },
  {
    name: 'Alimentation',
    Icon: Apple,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    textColor: 'text-green-600',
    bgLight: 'bg-green-50',
    glowColor: 'rgba(34, 197, 94, 0.3)',
    slug: 'Alimentation',
  },
  {
    name: 'Maison',
    Icon: Home,
    color: 'bg-amber-500',
    hoverColor: 'hover:bg-amber-600',
    textColor: 'text-amber-600',
    bgLight: 'bg-amber-50',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    slug: 'Maison',
  },
  {
    name: 'Beauté',
    Icon: Sparkles,
    color: 'bg-violet-500',
    hoverColor: 'hover:bg-violet-600',
    textColor: 'text-violet-600',
    bgLight: 'bg-violet-50',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    slug: 'Beauté',
  },
  {
    name: 'Sports',
    Icon: Trophy,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50',
    glowColor: 'rgba(249, 115, 22, 0.3)',
    slug: 'Sports',
  },
  {
    name: 'Jouets',
    Icon: ToyBrick,
    color: 'bg-cyan-500',
    hoverColor: 'hover:bg-cyan-600',
    textColor: 'text-cyan-600',
    bgLight: 'bg-cyan-50',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    slug: 'Jouets',
  },
  {
    name: 'Véhicules',
    Icon: Car,
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    slug: 'Véhicules',
  },
  {
    name: 'Services',
    Icon: Wrench,
    color: 'bg-gray-600',
    hoverColor: 'hover:bg-gray-700',
    textColor: 'text-gray-600',
    bgLight: 'bg-gray-50',
    glowColor: 'rgba(107, 114, 128, 0.3)',
    slug: 'Services',
  },
  {
    name: 'Autres',
    Icon: Store,
    color: 'bg-teal-500',
    hoverColor: 'hover:bg-teal-600',
    textColor: 'text-teal-600',
    bgLight: 'bg-teal-50',
    glowColor: 'rgba(20, 184, 166, 0.3)',
    slug: 'Autres',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * CategoryGrid — Responsive grid with 3D hover effects.
 */
export default function CategoryGrid() {
  const navigate = useNavigate();

  const handleCategoryClick = (slug) => {
    const isService = slug === 'Services';
    const basePath = isService ? '/services' : '/products';
    navigate(`${basePath}?category=${encodeURIComponent(slug)}`);
  };

  const handleKeyDown = (e, slug) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCategoryClick(slug);
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune catégorie disponible pour le moment.
      </div>
    );
  }

  return (
    <section aria-label="Catégories" className="w-full">
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {categories.map(({ name, Icon, color, textColor, bgLight, glowColor, slug }) => (
          <motion.div
            key={slug}
            variants={itemVariants}
            onClick={() => handleCategoryClick(slug)}
            onKeyDown={(e) => handleKeyDown(e, slug)}
            role="button"
            tabIndex={0}
            aria-label={`Catégorie : ${name}`}
            className="group relative flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 overflow-hidden"
            whileHover={{
              scale: 1.08,
              y: -4,
              boxShadow: `0 15px 35px ${glowColor}`,
              transition: { type: 'spring', stiffness: 400, damping: 15 },
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${glowColor} 0%, transparent 70%)`,
              }}
              aria-hidden="true"
            />

            {/* Icon container with 3D rotation on hover */}
            <motion.div
              className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full ${bgLight} ${textColor}`}
              whileHover={{
                rotateY: 180,
                scale: 1.15,
                transition: { duration: 0.5 },
              }}
            >
              <motion.div
                className="backface-hidden"
                whileHover={{ rotateY: -180 }}
                transition={{ duration: 0.5 }}
              >
                <Icon size={24} strokeWidth={1.5} />
              </motion.div>
            </motion.div>

            {/* Label */}
            <span className="relative text-xs md:text-sm font-medium text-gray-700 text-center leading-tight group-hover:text-gray-900 transition-colors duration-200">
              {name}
            </span>

            {/* Animated bottom bar */}
            <motion.span
              className={`w-0 h-1 rounded-full ${color} absolute bottom-0 left-1/2 -translate-x-1/2`}
              initial={{ width: 0 }}
              whileHover={{ width: '40%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              aria-hidden="true"
            />

            {/* Corner sparkle dots */}
            <div
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: glowColor }}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-2 left-2 w-1 h-1 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-500 delay-100"
              style={{ backgroundColor: glowColor }}
              aria-hidden="true"
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
