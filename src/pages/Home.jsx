import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Package, Store, TrendingUp, RefreshCw, ChevronRight, Shield, Truck, HeartHandshake, Star, Wrench, PlusCircle } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import { useAuth } from '../context/AuthContext';
import { getPromotedProducts, getLatestProducts, getPromotedServices, getLatestServices, getRecommendedProducts } from '../lib/database';
import { useTracking } from '../hooks/useTracking';

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function useAnimatedCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const started = useRef(false);

  useEffect(() => {
    if (!isInView || started.current) return;
    started.current = true;

    const startTime = performance.now();
    const targetNum = Number(target) || 0;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * targetNum));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return { count, ref };
}

// ---------------------------------------------------------------------------
// AnimatedStatItem
// ---------------------------------------------------------------------------
function AnimatedStatItem({ icon, target, label, suffix }) {
  const { count, ref } = useAnimatedCounter(target);
  const display = target >= 1000
    ? (count / 1000).toFixed(count >= target ? 0 : 1) + 'k+'
    : count + (suffix || '');

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-amber-400 mb-2">{icon}</div>
      <span className="text-3xl md:text-4xl font-bold text-white mb-1">
        {display}
      </span>
      <span className="text-sm text-gray-400 text-center">{label}</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper with reveal
// ---------------------------------------------------------------------------
function SectionReveal({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// ProductSection (shared between "Vedette" and "Nouveautés")
// ---------------------------------------------------------------------------
function ProductSection({ title, icon, fetchFn, emptyMessage }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchFn();
    if (result.error) {
      setError(result.error);
    } else {
      setProducts(result.products || []);
    }
    setLoading(false);
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SectionReveal className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <Link
          to="/products"
          className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
        >
          Voir tout
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-700/50" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-700/50 rounded w-1/3" />
                <div className="h-4 bg-gray-700/50 rounded w-3/4" />
                <div className="h-5 bg-gray-700/50 rounded w-1/2" />
                <div className="h-3 bg-gray-700/50 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reessayer
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <Package className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </SectionReveal>
  );
}

// ---------------------------------------------------------------------------
// ServiceSection — affiche les services en vedette ou nouveautés
// ---------------------------------------------------------------------------
function ServiceSection({ title, icon, fetchFn, emptyMessage }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchFn();
    if (result.error) {
      setError(result.error);
    } else {
      setServices(result.services || []);
    }
    setLoading(false);
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SectionReveal className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <Link
          to="/services"
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          Voir tout
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-700/50" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-700/50 rounded w-1/3" />
                <div className="h-4 bg-gray-700/50 rounded w-3/4" />
                <div className="h-5 bg-gray-700/50 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reessayer
          </button>
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <Wrench className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      )}

      {!loading && !error && services.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </SectionReveal>
  );
}

// ---------------------------------------------------------------------------
// RecommendationsSection — suggestions personnalisées (connecté) ou tendances
// ---------------------------------------------------------------------------
function RecommendationsSection() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getRecommendedProducts(user?.id, 8);
      if (!cancelled) {
        setProducts(result.products || []);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!loading && products.length === 0) return null;

  return (
    <SectionReveal className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          {user ? 'Suggestions pour vous' : 'Tendances'}
        </h2>
        <span className="text-xs text-amber-400/70 bg-amber-400/10 px-2 py-0.5 rounded-full">
          Personnalisé
        </span>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-700/50" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-700/50 rounded w-1/3" />
                <div className="h-4 bg-gray-700/50 rounded w-3/4" />
                <div className="h-5 bg-gray-700/50 rounded w-1/2" />
                <div className="h-3 bg-gray-700/50 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </SectionReveal>
  );
}

// ===================================================================
// Home Page
// ===================================================================
export default function Home() {
  const { user, profile, loading } = useAuth();
  const isSeller = profile?.is_seller ?? false;
  const { trackPageView } = useTracking();

  // Tracker la page d'accueil
  useEffect(() => {
    trackPageView('home');
  }, [trackPageView]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <HeroSection />

      {/* Statistics bar */}
      <SectionReveal>
        <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-800 bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl shadow-black/20">
            <AnimatedStatItem
              icon={<Package className="w-6 h-6" />}
              target={10000}
              label="Produits disponibles"
              suffix="+"
            />
            <AnimatedStatItem
              icon={<MapPinIcon className="w-6 h-6" />}
              target={77}
              label="Communes couvertes"
            />
            <AnimatedStatItem
              icon={<Store className="w-6 h-6" />}
              target={500}
              label="Services proposes"
              suffix="+"
            />
          </div>
        </div>
      </SectionReveal>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-16">
        <SectionReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-white">Categories</h2>
          </div>
          <CategoryGrid />
        </SectionReveal>
      </section>

      {/* Produits en Vedette */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductSection
          title="Produits en Vedette"
          icon={<Star className="w-5 h-5" />}
          fetchFn={() => getPromotedProducts(8)}
          emptyMessage="Aucun produit vedette pour le moment."
        />
      </section>

      {/* Suggestions personnalisées / Tendances */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecommendationsSection />
      </section>

      {/* Nouveautes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductSection
          title="Nouveautes"
          icon={<Package className="w-5 h-5" />}
          fetchFn={() => getLatestProducts(8)}
          emptyMessage="Aucun nouveau produit pour le moment."
        />
      </section>

      {/* Services en Vedette */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ServiceSection
          title="Services en Vedette"
          icon={<Star className="w-5 h-5" />}
          fetchFn={() => getPromotedServices(8)}
          emptyMessage="Aucun service vedette pour le moment."
        />
      </section>

      {/* Nouveaux Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ServiceSection
          title="Nouveaux Services"
          icon={<Wrench className="w-5 h-5" />}
          fetchFn={() => getLatestServices(8)}
          emptyMessage="Aucun nouveau service pour le moment."
        />
      </section>

      {/* Devenir Vendeur CTA */}
      <SectionReveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 p-8 md:p-12">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {!user
                    ? 'Devenez Vendeur sur BoutiKonect'
                    : isSeller
                    ? 'Gerer vos produits et services'
                    : 'Devenez Vendeur sur BoutiKonect'}
                </h2>
                <p className="text-amber-100/80 max-w-xl">
                  {!user
                    ? 'Rejoignez des centaines de vendeurs a travers le Benin. Publiez vos produits et services gratuitement et touchez des milliers d\'acheteurs potentiels.'
                    : isSeller
                    ? 'Publiez de nouveaux produits ou services et developpez votre activite sur BoutiKonect.'
                    : 'Rejoignez des centaines de vendeurs a travers le Benin. Publiez vos produits et services gratuitement et touchez des milliers d\'acheteurs potentiels.'}
                </p>
              </div>

              {loading ? (
                <div className="shrink-0 inline-flex items-center gap-2 bg-white/50 text-amber-700/50 font-bold px-6 py-3 rounded-xl shadow-lg opacity-50 cursor-wait">
                  <Store className="w-5 h-5" />
                  Chargement...
                </div>
              ) : !user ? (
                <Link
                  to="/register?become_seller=1"
                  className="shrink-0 inline-flex items-center gap-2 bg-white text-amber-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-amber-50 transition-all duration-200 hover:shadow-xl hover:scale-105"
                >
                  <Store className="w-5 h-5" />
                  Devenir vendeur
                </Link>
              ) : isSeller ? (
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/publish"
                    className="shrink-0 inline-flex items-center gap-2 bg-white text-amber-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-amber-50 transition-all duration-200 hover:shadow-xl hover:scale-105"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Publier un produit
                  </Link>
                  <Link
                    to="/publish?type=service"
                    className="shrink-0 inline-flex items-center gap-2 bg-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 hover:scale-105 border border-white/20"
                  >
                    <Wrench className="w-5 h-5" />
                    Proposer un service
                  </Link>
                </div>
              ) : (
                <Link
                  to="/seller/dashboard"
                  className="shrink-0 inline-flex items-center gap-2 bg-white text-amber-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-amber-50 transition-all duration-200 hover:shadow-xl hover:scale-105"
                >
                  <Store className="w-5 h-5" />
                  Commencer a vendre
                </Link>
              )}
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Trust / Features section */}
      <SectionReveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              Pourquoi choisir BoutiKonect ?
            </h2>
            <p className="text-gray-400">
              La marketplace qui rapproche acheteurs et vendeurs au Benin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Paiement securise',
                desc: 'Transactions protegees et multiples options de paiement adaptees au Benin.',
              },
              {
                icon: <Truck className="w-8 h-8" />,
                title: 'Livraison dans tout le Benin',
                desc: 'Disponible dans les 77 communes du pays. Livraison rapide et fiable.',
              },
              {
                icon: <HeartHandshake className="w-8 h-8" />,
                title: 'Achetez et vendez local',
                desc: 'Connectez-vous avec des vendeurs pres de chez vous et soutenez l economie locale.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Final CTA */}
      <SectionReveal>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Pret a explorer ?
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Des milliers de produits et services vous attendent. Trouvez ce que
              vous cherchez des maintenant.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-200"
              >
                Voir les produits
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
              >
                Voir les services
              </Link>
            </div>
          </div>
        </div>
      </SectionReveal>
    </div>
  );
}

// Placeholder MapPinIcon inline since GeolocationFilter already has its own import
function MapPinIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
