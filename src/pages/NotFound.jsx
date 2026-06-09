import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Error code */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
          </div>
        </motion.div>

        <h1 className="text-7xl font-bold text-white mb-2">404</h1>
        <p className="text-xl text-gray-300 mb-2">Page introuvable</p>
        <p className="text-gray-500 mb-8">
          La page que vous cherchez n&apos;existe pas ou a ete deplacee.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all w-full sm:w-auto justify-center"
          >
            <Home className="w-5 h-5" />
            Accueil
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all w-full sm:w-auto justify-center"
          >
            <Search className="w-5 h-5" />
            Decouvrir
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white font-semibold rounded-xl transition-all w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        </div>
      </motion.div>
    </div>
  );
}
