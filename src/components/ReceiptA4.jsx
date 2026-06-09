import { forwardRef } from 'react';
import './ReceiptA4.css';

/**
 * ReceiptA4 component representing a payment receipt in standard A4 format (210mm x 297mm).
 * Optimized for screen viewing and print/PDF download.
 *
 * @param {object} props
 * @param {object} props.data - The normalized data of the receipt containing:
 *   - receiptRef (e.g. BK-38A2E80A)
 *   - today (formatted date)
 *   - validUntil (expiry date)
 *   - transactionId
 *   - productTitle
 *   - productImage
 *   - plan: { duration, durationDays, price, priceLabel }
 *   - seller: { name, email, phone }
 */
const ReceiptA4 = forwardRef(({ data }, ref) => {
  const {
    receiptRef,
    today,
    transactionId,
    productTitle,
    productImage,
    plan,
    seller,
  } = data || {};

  return (
    <div
      ref={ref}
      id="receipt-a4-content"
      className="receipt-a4-container"
    >
      {/* ── HEADER ── */}
      <div>
        <div className="receipt-header">
          <div className="header-left">
            <div className="brand-wrapper">
              <img src="/logo.png" alt="BoutiKonect" className="receipt-main-logo" />
              <span className="brand-name">
                BoutiKonect<span className="brand-dot">.</span>bj
              </span>
            </div>
            <span className="brand-country">République du Bénin</span>
          </div>

          <div className="header-right">
            <h2 className="document-title">QUITTANCE DE PAIEMENT</h2>
            <span className="document-ref">Réf: {receiptRef}</span>
          </div>
        </div>

        <div className="header-divider" />

        {/* ── STATUS BADGE ── */}
        <div className="status-pill-container">
          <div className="status-pill">
            <span className="status-dot"></span>
            <span>Transaction Confirmée & Sécurisée</span>
          </div>
        </div>

        {/* ── PRODUCT BOX (APERÇU) ── */}
        <div className="product-preview-box">
          <div className="product-image-container">
            {productImage ? (
              <img
                src={productImage}
                alt={productTitle}
                className="product-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="product-fallback-img"
              style={{
                display: productImage ? 'none' : 'flex',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#eef2ff'
              }}
            >
              📦
            </div>
          </div>
          <div className="product-details">
            <h3 className="product-title">{productTitle || 'Produit'}</h3>
            <span className="product-plan">
              Plan : <span className="product-plan-highlight">{plan?.duration || 'Vedette'}</span>
            </span>
            <span className="product-duration">
              Durée : {plan?.durationDays || 30} jours
            </span>
          </div>
        </div>

        {/* ── INFORMATION GRID (2 COLUMNS) ── */}
        <div className="info-grid-container">
          {/* Column 1: Seller / Beneficiary */}
          <div className="info-column">
            <span className="info-label">Bénéficiaire (Vendeur)</span>
            <span className="info-value">{seller?.name || 'Vendeur BoutiKonect'}</span>
            <span className="info-subtext">{seller?.email || 'non renseigné'}</span>
          </div>

          {/* Column 2: Date */}
          <div className="info-column">
            <span className="info-label">Date de Paiement</span>
            <span className="info-value">{today}</span>
            <span className="info-subtext">Heure locale de Cotonou</span>
          </div>
        </div>

        {/* ── BILLING DETAILS BOX ── */}
        <div className="billing-details-box">
          <h4 className="billing-box-title">Détails de la Promotion</h4>
          
          <div className="billing-row">
            <span className="billing-row-label">Description du Service</span>
            <span className="billing-row-value">Mise en avant - Plan {plan?.duration || 'Vedette'}</span>
          </div>
          
          <div className="billing-row">
            <span className="billing-row-label">ID Transaction</span>
            <span className="billing-row-value monospace">{transactionId || 'N/A'}</span>
          </div>
          
          <div className="billing-row">
            <span className="billing-row-label">Méthode de règlement</span>
            <span className="billing-row-value">FedaPay Mobile Money</span>
          </div>

          <div className="billing-total-row">
            <span className="billing-total-label">Total Payé</span>
            <span className="billing-total-amount">
              {plan?.priceLabel || (plan?.price != null ? `${plan.price.toLocaleString('fr-FR')} FCFA` : '5 000 FCFA')}
            </span>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="receipt-footer">
        <div className="qr-code-section">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(transactionId || 'BK-VERIFY')}`}
            alt="QR Code de vérification"
            className="qr-code-img"
          />
          <span className="qr-verified-text">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ width: '14px', height: '14px', color: '#10b981' }}
            >
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
              <path d="M6 10.5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Vérifié
          </span>
        </div>

        <hr className="footer-divider" />

        <p className="footer-legal-text">
          Ce document certifie le paiement des frais de promotion sur BoutiKonect.bj.
        </p>
        <p className="footer-contact-text">
          BoutiKonect.bj - République du Bénin | Contact : support@boutikonect.bj
        </p>

        <div className="security-badge-container">
          <div className="security-badge">
            <span>🔒 DOCUMENT SÉCURISÉ & AUTHENTIQUE</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ReceiptA4.displayName = 'ReceiptA4';

export default ReceiptA4;
