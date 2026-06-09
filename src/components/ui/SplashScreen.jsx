import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_URL = '/logo.png';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('logo'); // logo → progress → done

  useEffect(() => {
    // Phase 1: logo animation (800ms)
    const t1 = setTimeout(() => setPhase('progress'), 800);

    // Phase 2: progress bar fill (1.2s)
    const t2 = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setPhase('done');
            return 100;
          }
          return p + Math.random() * 15 + 5;
        });
      }, 120);
    }, 800);

    // Phase 3: signal parent that splash is done
    const t3 = setTimeout(() => {
      onFinish?.();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <AnimatePresence mode="wait">
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-950"
        >
          {/* Background gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-aurora" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-aurora" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl animate-pulse-glow" />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={
              phase === 'logo'
                ? { scale: [0.5, 1.1, 1], opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center"
          >
            {LOGO_URL ? (
              <img
                src={LOGO_URL}
                alt="Boutikonect"
                className="w-24 h-24 md:w-28 md:h-28 object-contain"
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-glow-amber">
                <span className="text-4xl md:text-5xl font-bold text-white">B</span>
              </div>
            )}

            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-5 text-3xl md:text-4xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              Boutikonect
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-1 text-sm text-gray-500"
            >
              Le marché à portée de main
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              phase === 'progress' || phase === 'done'
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.4 }}
            className="relative z-10 mt-12 w-48"
          >
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </div>
            <p className="text-center text-xs text-gray-600 mt-2">
              {Math.round(Math.min(progress, 100))}%
            </p>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 text-[10px] text-gray-700"
          >
            © {new Date().getFullYear()} Boutikonect
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
