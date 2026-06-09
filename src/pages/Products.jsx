import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  RefreshCw,
  Package,
  Filter,
  ChevronDown,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import GeolocationFilter from '../components/GeolocationFilter';
import { getProducts } from '../lib/database';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PRODUCT_CATEGORIES = [
  { value: 'all', label: 'Toutes les categories' },
  { value: 'electronics', label: 'Electronique' },
  { value: 'clothing', label: 'Vetements' },
  { value: 'food_beverages', label: 'Alimentation' },
  { value: 'home_garden', label: 'Maison & Jardin' },
  { value: 'beauty_health', label: 'Beaute & Sante' },
  { value: 'sports', label: 'Sports' },
  { value: 'books', label: 'Livres' },
  { value: 'handicrafts', label: 'Artisanat' },
  { value: 'automotive', label: 'Vehicules' },
  { value: 'baby_kids', label: 'Jouets & Enfants' },
  { value: 'pet_supplies', label: 'Animaux' },
  { value: 'other', label: 'Autres' },
];

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden animate-pulse"
        >
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
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
function EmptyState({ onReset }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
        <Package className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Aucun produit trouve</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
        Aucun produit ne correspond a vos criteres de recherche. Essayez de
        modifier vos filtres ou d elargir votre recherche.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reinitialiser les filtres
      </button>
    </div>
  );
}

// ===================================================================
// Products Page
// ===================================================================
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state (initialized from URL params)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [geoFilter, setGeoFilter] = useState(null);

  // Results state
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------------
  // Fetch products
  // -----------------------------------------------------------------------
  const fetchProducts = useCallback(async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getProducts({
        category: filters.category !== 'all' ? filters.category : undefined,
        search: filters.search || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        city: filters.geoFilter?.enabled ? filters.geoFilter.city : undefined,
        limit: 50,
      });

      let filtered = result.data || [];

      // Client-side distance filtering if geolocation enabled
      if (filters.geoFilter?.enabled && filters.geoFilter?.lat && filters.geoFilter?.lng) {
        const { lat, lng, radius } = filters.geoFilter;
        filtered = filtered.filter((p) => {
          if (p.latitude == null || p.longitude == null) return false;
          const dist = getDistance(lat, lng, p.latitude, p.longitude);
          return dist <= radius;
        });
        // Attach distance for display
        filtered = filtered.map((p) => {
          if (p.latitude == null || p.longitude == null) return p;
          return {
            ...p,
            distance: Math.round(getDistance(
              filters.geoFilter.lat,
              filters.geoFilter.lng,
              p.latitude,
              p.longitude
            )),
          };
        });
      }

      setProducts(filtered || []);
      setTotal((filtered && filtered.length) || 0);
    } catch (err) {
      setError(err.message);
      setProducts([]);
      setTotal(0);
    }

    setLoading(false);
  }, []);

  // Reload when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts({ search, category, minPrice, maxPrice, geoFilter });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, minPrice, maxPrice, geoFilter, fetchProducts]);

  // Sync URL params
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'all') params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    setSearchParams(params, { replace: true });
  }, [search, category, minPrice, maxPrice, setSearchParams]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleReset = () => {
    setSearch('');
    setSearchInput('');
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setGeoFilter(null);
    setShowFilters(false);
  };

  const handleGeoFilterChange = useCallback((filter) => {
    setGeoFilter(filter.enabled ? filter : null);
  }, []);

  const hasActiveFilters = search || (category && category !== 'all') || minPrice || maxPrice || geoFilter;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Produits</h1>
          <p className="text-gray-400 text-sm mt-1">
            Decouvrez tous les produits disponibles sur BoutiKonect.
          </p>
        </div>

        {/* Search and filter bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Filtres</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-white">Filtres avances</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Categorie
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Min price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Prix minimum (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>

                  {/* Max price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Prix maximum (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Aucune limite"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>

                  {/* Reset */}
                  <div className="flex items-end">
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700"
                    >
                      Reinitialiser
                    </button>
                  </div>
                </div>

                {/* Geolocation filter */}
                <div className="mt-4">
                  <GeolocationFilter
                    onFilterChange={handleGeoFilterChange}
                    resultCount={products.length}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Geolocation filter when collapsed (shown inline) */}
        {!showFilters && (
          <div className="mb-6">
            <GeolocationFilter
              onFilterChange={handleGeoFilterChange}
              resultCount={products.length}
            />
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Recherche en cours...' : `${total} produit${total !== 1 ? 's' : ''} trouve${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Content */}
        {loading && <LoadingSkeleton />}

        {error && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchProducts({ search, category, minPrice, maxPrice, geoFilter })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reessayer
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <EmptyState onReset={handleReset} />
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Haversine distance helper
// ---------------------------------------------------------------------------
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}
