import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Store,
  Shield,
  Package,
  Wrench,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import NotificationBadge from '@/components/ui/Toast';

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/products', label: 'Produits' },
  { to: '/services', label: 'Services' },
];

const DropdownItem = ({ to, icon: Icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
  >
    <Icon className="w-4 h-4 shrink-0" />
    {label}
  </Link>
);

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  // Contexts — create CartContext and AuthContext to enable full functionality
  // CartContext provides: cartCount (number)
  // AuthContext provides: user (object | null), profile (object | null), signOut (fn), loading (bool)
  const { cartCount } = useCart();
  const { user, profile, signOut: logout, loading } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      // Silently handle logout error
    }
    setUserMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="relative backdrop-blur-xl bg-gray-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Bouti
                </span>
                <span className="text-white">Konect</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${
                      isActive(link.to)
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Search — desktop only */}
              <form
                onSubmit={handleSearch}
                className="hidden lg:block relative"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-56 pl-9 pr-3 py-2 rounded-xl text-sm
                    bg-white/5 border border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40
                    transition-all duration-200"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </form>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Panier"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && <NotificationBadge count={cartCount} />}
              </Link>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                ) : user ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
                      aria-label="Menu utilisateur"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          userMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-gray-900 border border-white/10 shadow-xl shadow-black/30 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-sm font-medium text-white truncate">
                              {user.email}
                            </p>
                          </div>
                          <div className="p-1.5">
                            <DropdownItem
                              to="/profile"
                              icon={User}
                              label="Mon Profil"
                            />
                            <DropdownItem
                              to="/dashboard"
                              icon={LayoutDashboard}
                              label="Tableau de bord"
                            />
                            <DropdownItem
                              to="/messages"
                              icon={MessageCircle}
                              label="Messages"
                            />
                            {profile?.is_admin && (
                              <DropdownItem
                                to="/admin"
                                icon={Shield}
                                label="Administration"
                              />
                            )}
                            {profile?.is_seller ? (
                              <DropdownItem
                                to="/my-products"
                                icon={Package}
                                label="Mes Produits"
                              />
                            ) : (
                              <DropdownItem
                                to="/seller/dashboard"
                                icon={Store}
                                label="Devenir vendeur"
                              />
                            )}
                          </div>
                          <div className="border-t border-white/10 p-1.5">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 shrink-0" />
                              Déconnexion
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  /* Auth buttons — desktop */
                  <div className="hidden md:flex items-center gap-2">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      Inscription
                    </Link>
                  </div>
                )}

                {/* Mobile auth button when logged out */}
                {!user && (
                  <div className="md:hidden">
                    <Link
                      to="/login"
                      className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                      aria-label="Connexion"
                    >
                      <User className="w-5 h-5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden backdrop-blur-xl bg-gray-950/95 border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit ou service..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                    bg-white/5 border border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </form>

              {/* Nav links */}
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`
                      block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${
                        isActive(link.to)
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Auth buttons — mobile */}
              {!user && (
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link
                    to="/login"
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-center rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
