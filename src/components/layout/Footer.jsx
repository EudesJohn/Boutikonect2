import { Link } from 'react-router-dom';
import { Store, Mail, MessageCircle, ChevronRight } from 'lucide-react';

const quickLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/products', label: 'Produits' },
  { to: '/services', label: 'Services' },
  { to: '/become-seller', label: 'Devenir Vendeur' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gray-950 border-t border-white/10">
      {/* Benin flag decoration */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-green-600" />
        <div className="flex-1 bg-amber-400" />
        <div className="flex-1 bg-red-600" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Column 1: Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
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
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              La premiere marketplace beninoise qui connecte les acheteurs et les
              vendeurs de produits et services a travers tout le Benin. Achetez
              local, vendez facilement.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Liens Rapides
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-amber-400 transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500/50 group-hover:text-amber-500 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@boutikonect.bj"
                  className="inline-flex items-center gap-2.5 text-sm text-gray-400 hover:text-amber-400 transition-colors group"
                >
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                  contact@boutikonect.bj
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/229XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors group"
                >
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </span>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} BoutiKonect. Tous droits reserves.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <Link
                to="/privacy"
                className="hover:text-gray-400 transition-colors"
              >
                Confidentialite
              </Link>
              <Link
                to="/terms"
                className="hover:text-gray-400 transition-colors"
              >
                Conditions
              </Link>
              <span className="inline-flex items-center gap-1.5">
                Fait au
                <span className="inline-flex gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                </span>
                Benin
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
