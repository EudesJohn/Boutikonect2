import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Wrench, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import NotificationBadge from '@/components/ui/Toast';

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/products', icon: Package, label: 'Produits' },
  { to: '/services', icon: Wrench, label: 'Services' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/cart', icon: ShoppingCart, label: 'Panier', hasBadge: true },
];

const MobileNav = () => {
  const location = useLocation();
  const { cartCount } = useCart();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="backdrop-blur-xl bg-gray-950/90 border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px]
                  transition-all duration-200
                  ${active ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}
                `}
              >
                <div
                  className={`relative p-1.5 rounded-lg transition-colors duration-200 ${
                    active ? 'bg-amber-500/10' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.hasBadge && cartCount > 0 && (
                    <NotificationBadge count={cartCount} />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
                {active && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
