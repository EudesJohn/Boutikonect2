import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  RefreshCw,
  Briefcase,
  Filter,
  ChevronDown,
} from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import GeolocationFilter from '../components/GeolocationFilter';
import { getServices } from '../lib/database';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SERVICE_CATEGORIES = [
  { value: 'all', label: 'Toutes les categories' },
  { value: 'home_repair', label: 'Services a domicile' },
  { value: 'it_support', label: 'Freelance & Digital' },
  { value: 'education_tutoring', label: 'Education & Formation' },
  { value: 'beauty_wellness', label: 'Sante & Bien-etre' },
  { value: 'delivery_logistics', label: 'Transport & Logistique' },
  { value: 'event_planning', label: 'Evenementiel' },
  { value: 'consulting', label: 'Conseil & Expertise' },
  { value: 'photography', label: 'Photographie' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'other', label: 'Autres services' },
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
          <div className="h-44 bg-gray-700/50" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-gray-700/50 rounded w-1/3" />
            <div className="h-4 bg-gray-700/50 rounded w-3/4" />
            <div className="h-5 bg-gray-700/50 rounded w-1/3" />
            <div className="h-3 bg-gray-700/50 rounded w-2/3" />
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
        <Briefcase className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Aucun service trouve</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
        Aucun service ne correspond a vos criteres de recherche. Essayez de
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
// Services Page
// ===================================================================
export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state (initialized from URL params)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [geoFilter, setGeoFilter] = useState(null);

  // Results state
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------------
  // Fetch services
  // -----------------------------------------------------------------------
  const fetchServices = useCallback(async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getServices({
        category: filters.category !== 'all' ? filters.category : undefined,
        search: filters.search || undefined,
        city: filters.geoFilter?.enabled ? filters.geoFilter.city : undefined,
        limit: 50,
      });

      setServices(result.data || []);
      setTotal(result.count || result.data?.length || 0);
    } catch (err) {
      setError(err.message);
      setServices([]);
      setTotal(0);
    }

    setLoading(false);
  }, []);

  // Reload when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices({ search, category, geoFilter });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, geoFilter, fetchServices]);

  // Sync URL params
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'all') params.category = category;

    setSearchParams(params, { replace: true });
  }, [search, category, setSearchParams]);

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
    setGeoFilter(null);
    setShowFilters(false);
  };

  const handleGeoFilterChange = useCallback((filter) => {
    setGeoFilter(filter.enabled ? filter : null);
  }, []);

  const hasActiveFilters = search || (category && category !== 'all') || geoFilter;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Services</h1>
          <p className="text-gray-400 text-sm mt-1">
            Trouvez des prestataires de services partout au Benin.
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
              placeholder="Rechercher un service..."
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      {SERVICE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
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
                    resultCount={services.length}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Geolocation filter when collapsed */}
        {!showFilters && (
          <div className="mb-6">
            <GeolocationFilter
              onFilterChange={handleGeoFilterChange}
              resultCount={services.length}
            />
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Recherche en cours...' : `${total} service${total !== 1 ? 's' : ''} trouve${total !== 1 ? 's' : ''}`}
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
              onClick={() => fetchServices({ search, category, geoFilter })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reessayer
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <EmptyState onReset={handleReset} />
        )}

        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
