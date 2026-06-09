// ============================================================
// ReceiptPage.jsx
// Route: /quittance
// Premium payment receipt with QR code, PDF download, and print.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Printer,
  FileText,
  Loader2,
  AlertCircle,
  Share2,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generatePromotionReceipt } from '../lib/receiptService';
import ReceiptA4 from '../components/ReceiptA4';

function VerifiedBadge({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M6 10.5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// -------------------------------------------------------------------
// QR Code component
// -------------------------------------------------------------------
function QRCodeSection({ data, transactionId }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const size = 160;

  const qrData = data || transactionId || 'BK-VERIFY';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
      <div className="flex items-center justify-center gap-2 mb-4">
        <VerifiedBadge className="w-5 h-5 text-emerald-500" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Vérification
        </span>
      </div>

      <div className="relative inline-flex">
        {error ? (
          <div
            className="bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200"
            style={{ width: size, height: size }}
          >
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
        ) : (
          <>
            <img
              src={qrUrl}
              alt="QR Code de vérification"
              width={size}
              height={size}
              className={`rounded-2xl ring-1 ring-gray-100 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-[10px] text-gray-400 mt-3 leading-relaxed max-w-[200px] mx-auto">
        Scannez ce code pour vérifier l'authenticité de la quittance
      </p>
      <p className="text-[8px] text-gray-300 mt-1 font-mono">
        ID: {transactionId ? `#${String(transactionId).slice(-8)}` : 'N/A'}
      </p>
    </div>
  );
}

// -------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------
export default function ReceiptPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const receiptRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState(null);

  // -------------------------------------------------------------------
  // Load data from 3 sources (hierarchical)
  // -------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Try sessionStorage first
        const stored = sessionStorage.getItem('last_promotion_receipt');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.transactionId) {
            if (!cancelled) setData(normalizeData(parsed));
            if (!cancelled) setLoading(false);
            return;
          }
        }

        // 2. Try URL param pid for product lookup
        const pid = searchParams.get('pid');
        if (pid && user) {
          const { data: product, error: prodErr } = await supabase
            .from('products')
            .select('id, title, images, is_promoted, promoted_until, last_transaction_id, promotion_plan_name, seller_id')
            .eq('id', pid)
            .maybeSingle();

          if (!prodErr && product?.last_transaction_id) {
            // Fetch seller info
            const { data: sellerProfile } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', product.seller_id)
              .maybeSingle();

            if (!cancelled) setData(normalizeData({
              transactionId: product.last_transaction_id,
              productTitle: product.title,
              productImage: product.images?.[0] || null,
              plan: { duration: product.promotion_plan_name || 'Promotion', durationDays: 0 },
              seller: {
                name: sellerProfile?.full_name || '',
                email: sellerProfile?.email || '',
                phone: sellerProfile?.phone || '',
              },
              validUntil: product.promoted_until,
            }));
            if (!cancelled) setLoading(false);
            return;
          }
        }

        // 3. Fallback: direct URL params
        const tid = searchParams.get('tid');
        const title = searchParams.get('title');
        const price = searchParams.get('price');
        const duration = searchParams.get('duration');
        const days = searchParams.get('days');
        const vuntil = searchParams.get('valid_until');
        const sname = searchParams.get('seller');
        const semail = searchParams.get('email');

        if (tid) {
          if (!cancelled) setData(normalizeData({
            transactionId: tid,
            productTitle: title || 'Produit',
            productImage: null,
            plan: {
              duration: duration || 'Promotion',
              durationDays: parseInt(days || '0', 10),
              price: parseInt(price || '0', 10),
              priceLabel: price ? `${parseInt(price).toLocaleString('fr-FR')} FCFA` : '',
            },
            seller: { name: sname || '', email: semail || '' },
            validUntil: vuntil || undefined,
          }));
          if (!cancelled) setLoading(false);
          return;
        }

        // No data found
        if (!cancelled) setError('Aucune information de quittance trouvée. Effectuez d\'abord un paiement.');
        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error('[ReceiptPage] Load error:', err);
        if (!cancelled) setError(err.message || 'Erreur de chargement');
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [searchParams, user]);

  // -------------------------------------------------------------------
  // Normalize data
  // -------------------------------------------------------------------
  function normalizeData(raw) {
    const today = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const receiptRef = `BK-${String(raw.transactionId || '').slice(-8).toUpperCase()}`;
    const validUntil = raw.validUntil
      ? new Date(raw.validUntil).toLocaleDateString('fr-FR')
      : new Date(Date.now() + (raw.plan?.durationDays || 0) * 86400000).toLocaleDateString('fr-FR');

    return {
      receiptRef,
      today,
      validUntil,
      transactionId: raw.transactionId,
      productTitle: raw.productTitle || 'Produit',
      productImage: raw.productImage || null,
      plan: raw.plan || { duration: 'Promotion', durationDays: 0, price: 0, priceLabel: '' },
      seller: raw.seller || { name: '', email: '' },
    };
  }

  // -------------------------------------------------------------------
  // Download PDF via html2pdf
  // -------------------------------------------------------------------
  const handleDownloadPDF = useCallback(async () => {
    if (!receiptRef.current || downloading) return;
    setDownloading(true);

    const element = receiptRef.current;

    // --- 1. Freeze element dimensions to exact A4 pixels before capture ---
    // This prevents the responsive layout from collapsing when html2canvas
    // renders the element at a different (smaller) viewport size.
    const A4_PX_WIDTH = 794;
    const A4_PX_HEIGHT = 1123;

    const prevWidth    = element.style.width;
    const prevMinWidth = element.style.minWidth;
    const prevHeight   = element.style.height;
    const prevOverflow = element.style.overflow;

    element.style.width    = `${A4_PX_WIDTH}px`;
    element.style.minWidth = `${A4_PX_WIDTH}px`;
    element.style.height   = `${A4_PX_HEIGHT}px`;
    element.style.overflow = 'hidden';

    try {
      const html2pdf = (await import('html2pdf.js/dist/html2pdf.bundle.min.js')).default;

      // Ensure images are fully loaded before capture
      const imgs = element.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img =>
        new Promise((resolve) => {
          if (img.complete) resolve();
          else { img.onload = resolve; img.onerror = resolve; }
        })
      ));

      const opt = {
        margin: 0,
        filename: `quittance-${data.receiptRef}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          // Force the virtual viewport to exactly A4 pixel size
          windowWidth:  A4_PX_WIDTH,
          windowHeight: A4_PX_HEIGHT,
          width:  A4_PX_WIDTH,
          height: A4_PX_HEIGHT,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Quittance téléchargée avec succès !');
    } catch (err) {
      console.error('[ReceiptPage] PDF error:', err);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      // --- 2. Restore original element dimensions after capture ---
      element.style.width    = prevWidth;
      element.style.minWidth = prevMinWidth;
      element.style.height   = prevHeight;
      element.style.overflow = prevOverflow;
      setDownloading(false);
    }
  }, [data, downloading]);

  // -------------------------------------------------------------------
  // Print receipt
  // -------------------------------------------------------------------
  function handlePrint() {
    if (!data) return;
    generatePromotionReceipt({
      transactionId: data.transactionId,
      productTitle: data.productTitle,
      productImage: data.productImage,
      plan: data.plan,
      seller: data.seller,
    });
  }

  // -------------------------------------------------------------------
  // Share receipt link
  // -------------------------------------------------------------------
  function handleShare() {
    if (!data?.transactionId) return;
    const url = `${window.location.origin}/quittance?tid=${data.transactionId}&title=${encodeURIComponent(data.productTitle)}&duration=${encodeURIComponent(data.plan?.duration || '')}&days=${data.plan?.durationDays || 0}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Lien de la quittance copié !');
    }).catch(() => {
      toast.error('Erreur de copie');
    });
  }

  // ===================================================================
  // Render
  // ===================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f7ff] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4f3b9e] to-[#2d1b69] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-[#4f3b9e] mx-auto" />
          <p className="text-sm text-gray-500 mt-3 font-medium">Chargement de la quittance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f7ff] to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quittance non disponible</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <Link
              to="/my-products"
              className="px-6 py-3 bg-gradient-to-r from-[#4f3b9e] to-[#2d1b69] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-200"
            >
              Mes annonces
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7ff] via-white to-[#f5f3ff] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Retour
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Document authentique</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4f3b9e] to-[#2d1b69] flex items-center justify-center shadow-lg shadow-purple-200">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quittance de paiement</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-gray-400 font-mono">{data.receiptRef}</p>
              <span className="text-gray-200">•</span>
              <p className="text-xs text-gray-400">{data.today}</p>
            </div>
          </div>
        </motion.div>

        {/* Content: Receipt + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Receipt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <div className="receipt-a4-preview-wrapper">
              <ReceiptA4 ref={receiptRef} data={data} />
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            {/* QR Code */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <QRCodeSection
                data={data.transactionId}
                transactionId={data.transactionId}
              />
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-gradient-to-b from-[#4f3b9e] to-[#f59e0b] rounded-full" />
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Actions</span>
              </div>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#4f3b9e] to-[#2d1b69] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-200/50 disabled:opacity-60 cursor-pointer"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? 'Téléchargement...' : 'Télécharger le PDF'}
              </button>

              <button
                onClick={handlePrint}
                className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-200/50 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>

              <button
                onClick={handleShare}
                className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Copier le lien
              </button>
            </motion.div>

            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#f8f7ff] to-white rounded-2xl border border-[#eeeaff] p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Document valide</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Cette quittance fait foi de preuve de paiement pour le service de promotion
                d'annonce sur BoutiKonect. Conservez-la pour votre comptabilité.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[8px] text-gray-400">
                  {data.receiptRef} — Généré automatiquement
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
