import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('mobile');

  useEffect(() => {
    // Check if already in standalone mode (already installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setPlatform(isMobile ? 'mobile' : 'desktop');

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 30s
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed (from app's perspective)
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    };
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Re-show after 7 days
    setTimeout(() => setShowPrompt(true), 7 * 24 * 60 * 60 * 1000);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-50"
        >
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/40 backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/25">
                <Download className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-sm font-semibold text-white">
                  Installer Boutikonect
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {platform === 'mobile'
                    ? 'Installez l\'application sur votre écran d\'accueil pour un accès rapide.'
                    : 'Installez Boutikonect sur votre ordinateur pour une expérience native.'}
                </p>

                {/* Platform tips */}
                {platform === 'mobile' && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                    <Smartphone className="w-3 h-3" />
                    <span>Ajouter à l'écran d'accueil</span>
                  </div>
                )}
                {platform === 'desktop' && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                    <Monitor className="w-3 h-3" />
                    <span>Installation rapide</span>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 mt-4">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium transition-colors cursor-pointer"
                >
                  Installer
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors cursor-pointer"
              >
                Plus tard
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
