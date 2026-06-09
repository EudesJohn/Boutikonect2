import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ShoppingBag, Truck, Sparkles, ArrowRight, Store, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * HeroSection — Full-width hero with 3D floating elements, morphing blobs,
 * particle effects, and parallax animations.
 */
export default function HeroSection() {
  const { user, profile, loading, becomeSeller } = useAuth();
  const navigate = useNavigate();
  const isSeller = profile?.is_seller ?? false;

  const handleNavigate = (path) => {
    navigate(path);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section
      className="relative w-full min-h-[560px] md:min-h-[650px] flex items-center justify-center overflow-hidden"
      aria-label="Bannière d'accueil BoutiKonect"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 animate-gradient-shift" />

      {/* 3D Morphing Blobs */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blob 1 — large morphing shape */}
        <div
          className="absolute w-[500px] h-[500px] -top-20 -left-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-morph-blob-3d blur-3xl"
          style={{ animationDelay: '-2s', animationDuration: '12s' }}
        />

        {/* Blob 2 — floating organic shape */}
        <div
          className="absolute w-[400px] h-[400px] bottom-0 right-0 bg-gradient-to-br from-amber-500/15 to-orange-500/15 animate-morph-blob-3d blur-3xl"
          style={{ animationDelay: '-5s', animationDuration: '15s' }}
        />

        {/* Blob 3 — small accent */}
        <div
          className="absolute w-[250px] h-[250px] top-1/3 right-1/4 bg-gradient-to-br from-pink-500/15 to-rose-500/15 animate-morph-blob blur-3xl"
          style={{ animationDelay: '-8s', animationDuration: '10s' }}
        />
      </div>

      {/* Floating 3D decorative shapes */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 3D rotating ring */}
        <div className="shape-ring shape-ring--1 animate-spin-3d" style={{ animationDuration: '20s' }} />

        {/* Floating diamonds */}
        <div className="shape-diamond shape-diamond--1 animate-float-3d" style={{ animationDuration: '6s', animationDelay: '-1s' }} />
        <div className="shape-diamond shape-diamond--2 animate-float-3d" style={{ animationDuration: '7s', animationDelay: '-3s' }} />
        <div className="shape-diamond shape-diamond--3 animate-float-3d" style={{ animationDuration: '8s', animationDelay: '-5s' }} />

        {/* Floating orbs with glow */}
        <div className="shape-orb shape-orb--1 animate-float-heavy" style={{ animationDuration: '5s' }} />
        <div className="shape-orb shape-orb--2 animate-float" style={{ animationDuration: '4s', animationDelay: '-2s' }} />
        <div className="shape-orb shape-orb--3 animate-tilt-glow" style={{ animationDuration: '6s', animationDelay: '-4s' }} />
      </div>

      {/* Particle field */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Dot pattern overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        {/* Sparkle badge */}
        <motion.div
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Sparkles size={14} className="text-yellow-300" />
          <span className="text-xs font-medium text-indigo-200">
            Marketplace #1 au Bénin
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4"
          {...fadeInUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          Découvrez{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 animate-text-shimmer">
            BoutiKonect
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-base sm:text-lg md:text-xl text-indigo-200/80 max-w-2xl mx-auto mb-10 leading-relaxed"
          {...fadeInUp}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
        >
          La marketplace qui connecte les acheteurs et les vendeurs de tout le Bénin
        </motion.p>

        {/* Statistics row with 3D hover */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
        >
          <StatItem icon={<MapPin size={20} />} label="77 Communes" delay={0} />
          <StatItem icon={<ShoppingBag size={20} />} label="Produits & Services" delay={0.1} />
          <StatItem icon={<Truck size={20} />} label="Paiement à la livraison" delay={0.2} />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
        >
          <motion.button
            type="button"
            onClick={() => handleNavigate('/products')}
            className="group relative w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-base shadow-lg shadow-yellow-400/25 overflow-hidden"
            whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(234,179,8,0.35)' }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              Acheter maintenant
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </span>
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
              aria-hidden="true"
            />
          </motion.button>

          {!loading && user && isSeller ? (
            <motion.button
              type="button"
              onClick={() => handleNavigate('/publish')}
              className="group relative w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-base border border-white/20 overflow-hidden"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                <PlusCircle size={18} />
                Publier un produit
              </span>
            </motion.button>
          ) : loading ? null : (
            <motion.button
              type="button"
              onClick={async () => {
                if (!user) {
                  navigate('/register?become_seller=1');
                } else {
                  try {
                    await becomeSeller();
                    navigate('/publish');
                  } catch {
                    navigate('/publish');
                  }
                }
              }}
              className="group relative w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-base border border-white/20 overflow-hidden"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                <Store size={18} />
                {user ? 'Commencer a vendre' : 'Devenir vendeur'}
              </span>
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2.5s linear infinite',
                }}
                aria-hidden="true"
              />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Inline keyframes for extended animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-40px, 20px) rotate(180deg); }
        }

        .shape-ring {
          position: absolute;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.06);
        }
        .shape-ring--1 {
          width: 300px;
          height: 300px;
          top: -5%;
          right: 10%;
          border-color: rgba(255, 255, 255, 0.05);
        }

        .shape-diamond {
          position: absolute;
          background: rgba(255, 255, 255, 0.03);
          transform: rotate(45deg);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .shape-diamond--1 {
          width: 60px; height: 60px;
          top: 18%; left: 8%;
        }
        .shape-diamond--2 {
          width: 40px; height: 40px;
          bottom: 25%; right: 15%;
        }
        .shape-diamond--3 {
          width: 30px; height: 30px;
          top: 60%; left: 20%;
        }

        .shape-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(40px);
          opacity: 0.12;
        }
        .shape-orb--1 {
          width: 120px; height: 120px;
          background: rgba(251, 191, 36, 0.4);
          top: 20%; right: 25%;
        }
        .shape-orb--2 {
          width: 80px; height: 80px;
          background: rgba(129, 140, 248, 0.4);
          bottom: 30%; left: 15%;
        }
        .shape-orb--3 {
          width: 100px; height: 100px;
          background: rgba(217, 70, 239, 0.3);
          top: 50%; left: 60%;
        }
      `}</style>
    </section>
  );
}

/**
 * StatItem — Small inline stat display with icon and label.
 */
function StatItem({ icon, label, delay = 0 }) {
  return (
    <motion.div
      className="flex items-center gap-2 text-indigo-200 text-sm md:text-base"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + delay, duration: 0.4 }}
      whileHover={{ scale: 1.05, color: '#fde68a' }}
    >
      <motion.span
        className="text-yellow-300 shrink-0"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: delay }}
      >
        {icon}
      </motion.span>
      <span className="font-medium whitespace-nowrap">{label}</span>
    </motion.div>
  );
}
