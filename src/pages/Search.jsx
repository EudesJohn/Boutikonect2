import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  Grid3X3,
  List,
  MapPin,
  Star,
  Clock,
  Package,
  Wrench,
  User,
  Loader2,
  X,
} from 'lucide-react';
import { searchProducts, searchServices } from '../lib/database';
import { getCategoryLabel } from '../lib/categories';
import toast from 'react-hot-toast';
import { useTracking } from '../hooks/useTracking';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';
  const typeFromUrl = searchParams.get('type') || 'all';

  const [query, setQuery] = useState(queryFromUrl);
  const [type, setType] = useState(typeFromUrl);
  const [viewMode, setViewMode] = useState('grid');
  const [results, setResults] = useState({ products: [], services: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!queryFromUrl);
  const { trackSearch } = useTracking();

  const performSearch = useCallback(async (q, t) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const [products, services] = await Promise.all([
        t !== 'service' ? searchProducts(q.trim()) : Promise.resolve([]),
        t !== 'product' ? searchServices(q.trim()) : Promise.resolve([]),
      ]);
      setResults({ products: products || [], services: services || [] });
      setHasSearched(true);
      trackSearch(q.trim());
    } catch (err) {
      toast.error('Erreur lors de la recherche');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryFromUrl) {
      setQuery(queryFromUrl);
      setType(typeFromUrl);
      performSearch(queryFromUrl, typeFromUrl);
    }
  }, [queryFromUrl, typeFromUrl, performSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query.trim(), type });
    performSearch(query.trim(), type);
  };

  const totalCount = results.products.length + results.services.length;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Recherche</h1>
          <p className="text-gray-400">Trouvez ce que vous cherchez sur BoutiKonect</p>
        </motion.div>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="relative mb-6"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit ou service..."
                className="w-full pl-12 pr-10 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
              Chercher
            </button>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {['all', 'product', 'service'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    if (query.trim()) {
                      setSearchParams({ q: query, type: t });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                    type === t
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'Tout' : t === 'product' ? 'Produits' : 'Services'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-gray-800 text-amber-400' : 'text-gray-500 hover:text-white'
                }`}
                aria-label="Vue en grille"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-gray-800 text-amber-400' : 'text-gray-500 hover:text-white'
                }`}
                aria-label="Vue en liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.form>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : hasSearched && totalCount === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <SearchIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Aucun resultat</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Desole, nous n&apos;avons rien trouve pour &quot;{query}&quot;. Essayez d&apos;autres mots-cles.
            </p>
          </motion.div>
        ) : hasSearched ? (
          <div className="space-y-10">
            {/* Products */}
            {type !== 'service' && results.products.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  Produits ({results.products.length})
                </h2>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                    : 'space-y-3'
                }>
                  {results.products.map((product, i) => (
                    <ResultCard key={product.id || i} item={product} type="product" viewMode={viewMode} />
                  ))}
                </div>
              </section>
            )}

            {/* Services */}
            {type !== 'product' && results.services.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  Services ({results.services.length})
                </h2>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                    : 'space-y-3'
                }>
                  {results.services.map((service, i) => (
                    <ResultCard key={service.id || i} item={service} type="service" viewMode={viewMode} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <SearchIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p>Entrez un mot-cle et cliquez sur Chercher</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(amount) {
  if (amount == null) return 'Prix sur devis';
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

function ResultCard({ item, type, viewMode }) {
  const linkTo = `/${type === 'product' ? 'product' : 'service'}/${item.id}`;
  const imageUrl = item.images?.[0] || item.image_url || item.image;

  if (viewMode === 'list') {
    return (
      <Link
        to={linkTo}
        className="flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:bg-gray-800/50 transition-all group"
      >
        <div className="w-16 h-16 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {type === 'product' ? <Package className="w-6 h-6 text-gray-600" /> : <Wrench className="w-6 h-6 text-gray-600" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate group-hover:text-amber-400 transition-colors">{item.title}</h3>
          <p className="text-sm text-gray-400 truncate">{item.description}</p>
          <div className="flex items-center gap-2 mt-1">
            {item.seller?.avatar_url ? (
              <img src={item.seller.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <User size={12} className="text-gray-600 shrink-0" />
            )}
            <span className="text-xs text-gray-500 truncate">
              {item.seller?.full_name || item.seller?.store_name || ''}
            </span>
            {(item.city || item.location) && (
              <>
                <span aria-hidden="true" className="text-gray-600">·</span>
                <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
                <span className="text-xs text-gray-500 truncate">{item.city || item.location}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-amber-400 font-semibold">
            {type === 'service' && item.pricing_type === 'custom_quote' ? 'Sur Devis' : formatPrice(item.price)}
          </p>
          {item.rating && (
            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-1">
              <Star className="w-3 h-3 text-yellow-500" /> {item.rating}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={linkTo}
      className="block bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all group"
    >
      <div className="aspect-square bg-gray-800 relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {type === 'product' ? <Package className="w-10 h-10 text-gray-600" /> : <Wrench className="w-10 h-10 text-gray-600" />}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">{item.title}</h3>
        <p className="text-xs text-gray-400 truncate mt-1">{item.city || item.location || getCategoryLabel(item.category)}</p>
        <p className="text-amber-400 font-semibold text-sm mt-2">
            {type === 'service' && item.pricing_type === 'custom_quote' ? 'Sur Devis' : formatPrice(item.price)}
          </p>
        {item.seller && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-800">
            {item.seller.avatar_url ? (
              <img src={item.seller.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <User size={12} className="text-gray-600 shrink-0" />
            )}
            <span className="text-[11px] text-gray-500 truncate">
              {item.seller.full_name || item.seller.store_name || ''}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
