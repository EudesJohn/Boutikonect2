import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_URL = '/logo.png';

const STEPS = [
  { label: 'Initialisation...', min: 0, max: 15 },
  { label: 'Connexion à Supabase...', min: 15, max: 45 },
  { label: 'Vérification de l\'authentification...', min: 45, max: 70 },
  { label: 'Chargement de votre profil...', min: 70, max: 90 },
  { label: 'Finalisation...', min: 90, max: 100 },
];

export default function SplashScreen({ ready, minDuration = 2000, children }) {
  const [phase, setPhase] = useState('loading'); // loading → done
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const startTime = useRef(Date.now());

  // Fake progress animation while we wait for real auth loading
  useEffect(() => {
    if (phase === 'done') return;

    // Determine target progress from real loading state
    const targetFromSteps = STEPS[stepIdx]?.max ?? 100;
    const speed = (targetFromSteps - progress) / 20; // reach target in ~20 frames

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;

      // If real loading is done and we've waited at least minDuration
      const elapsedOk = elapsed >= minDuration;
      if (ready && elapsedOk) {
        // Fast-fill to 100%
        setProgress((p) => {
          const next = Math.min(p + 8, 100);
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => setPhase('done'), 300);
            return 100;
          }
          return next;
        });
        return;
      }

      // Normal progress based on step bounds
      setProgress((p) => {
        const step = STEPS[stepIdx];
        const next = p + Math.random() * 2 + 0.5;

        if (next >= step.max) {
          // Move to next step if ready hasn't come yet
          if (stepIdx < STEPS.length - 1) {
            setStepIdx((i) => i + 1);
          }
          return Math.min(next, step.max);
        }
        return next;
      });
    }, speed * 3);

    return () => clearInterval(interval);
  }, [phase, stepIdx, ready, minDuration]);

  // Reset if ready becomes false again (shouldn't happen normally)
  useEffect(() => {
    if (phase === 'done' && !ready) {
      setPhase('loading');
      setProgress(0);
      setStepIdx(0);
      startTime.current = Date.now();
    }
  }, [ready, phase]);

  return (
    <>
      <AnimatePresence mode="wait">
        {phase !== 'done' && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
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
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center"
            >
              {LOGO_URL ? (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-900 border-2 border-amber-500/30 flex items-center justify-center overflow-hidden shadow-glow-amber">
                  <img
                    src={LOGO_URL}
                    alt="Boutikonect"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-glow-amber">
                  <span className="text-4xl md:text-5xl font-bold text-white">B</span>
                </div>
              )}

              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-5 text-3xl md:text-4xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                Boutikonect
              </motion.h1>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-1 text-sm text-gray-500"
              >
                Le marché à portée de main
              </motion.p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="relative z-10 mt-12 w-64"
            >
              {/* Current step label */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{STEPS[stepIdx]?.label ?? 'Chargement...'}</span>
                <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
              </div>

              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            {/* Spinning loader dots */}
            <div className="relative z-10 mt-6 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-amber-500"
                />
              ))}
            </div>

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

      {/* Children — hidden until splash is done */}
      <div style={{ opacity: phase === 'done' ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        {children}
      </div>
    </>
  );
}
