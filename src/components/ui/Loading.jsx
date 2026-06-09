import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Spinner = ({ message, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 ${className}`}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className="w-8 h-8 text-amber-500" />
    </motion.div>
    {message && <p className="text-sm text-gray-400">{message}</p>}
  </div>
);

const Dots = ({ message, className = '' }) => {
  const dotVariants = {
    animate: (i) => ({
      y: [0, -8, 0],
      transition: { duration: 0.6, repeat: Infinity, delay: i * 0.15 },
    }),
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            animate="animate"
            className="w-2.5 h-2.5 rounded-full bg-amber-500"
          />
        ))}
      </div>
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );
};

const Pulse = ({ message, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 ${className}`}
  >
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600"
    />
    {message && <p className="text-sm text-gray-400">{message}</p>}
  </div>
);

const Loading = ({ variant = 'spinner', message, className = '' }) => {
  switch (variant) {
    case 'dots':
      return <Dots message={message} className={className} />;
    case 'pulse':
      return <Pulse message={message} className={className} />;
    case 'spinner':
    default:
      return <Spinner message={message} className={className} />;
  }
};

const FullPageLoader = ({ message = 'Chargement...' }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
    >
      <Loader2 className="w-8 h-8 text-amber-500" />
    </motion.div>
    {message && (
      <p className="mt-4 text-gray-400 font-medium text-sm">{message}</p>
    )}
  </div>
);

export { Spinner, Dots, Pulse, FullPageLoader };
export default Loading;
