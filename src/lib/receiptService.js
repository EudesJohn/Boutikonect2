// ============================================================
// receiptService.js
// Premium printable HTML receipt — opens print dialog
// ============================================================

/**
 * Generate and print a promotion payment receipt.
 *
 * @param {object} params
 * @param {string} params.transactionId   - FedaPay transaction ID
 * @param {string} params.productTitle    - Name of the promoted product
 * @param {string} [params.productImage]  - Product image URL
 * @param {object} params.plan            - { duration, durationDays, price, priceLabel }
 * @param {object} params.seller          - { name, email, phone? }
 */
export function generatePromotionReceipt({ transactionId, productTitle, productImage, plan, seller }) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const receiptRef = `BK-${String(transactionId || '').slice(-8).toUpperCase()}`;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (plan?.durationDays || 0));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Quittance de paiement — ${receiptRef}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background-color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 0;
  }

  .receipt-a4-container {
    width: 210mm;
    height: 297mm;
    background-color: #ffffff;
    padding: 15mm 15mm 12mm 15mm;
    border: none;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    background-image: 
      radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.025) 0%, transparent 40%),
      radial-gradient(circle at 0% 100%, rgba(245, 158, 11, 0.015) 0%, transparent 40%);
  }

  /* Decorative top bar border */
  .receipt-a4-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #f59e0b 100%);
  }

  /* HEADER */
  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 5mm;
    margin-bottom: 6mm;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .brand-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .receipt-main-logo {
    height: 32px;
    width: auto;
    display: block;
    border-radius: 4px;
  }

  .brand-name {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .brand-dot {
    color: #f59e0b;
  }

  .brand-country {
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
    letter-spacing: 0.5px;
    margin-left: 2px;
  }

  .header-right {
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .document-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .document-ref {
    font-size: 12px;
    font-weight: 600;
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    color: #4f46e5;
    background-color: #f5f3ff;
    padding: 3px 8px;
    border-radius: 4px;
    display: inline-block;
    align-self: flex-end;
  }

  .header-divider {
    height: 1px;
    background-color: #f1f5f9;
    width: 100%;
    margin-bottom: 6mm;
  }

  /* STATUS PILL */
  .status-pill-container {
    margin-bottom: 6mm;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #ecfdf5;
    border: 1px solid #d1fae5;
    color: #065f46;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    background-color: #10b981;
    border-radius: 50%;
    display: inline-block;
  }

  /* PRODUCT PREVIEW BOX */
  .product-preview-box {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    background-color: #f8fafc;
    margin-bottom: 7mm;
  }

  .product-image-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid #f1f5f9;
    background-color: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .product-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }

  .product-plan {
    font-size: 12px;
    font-weight: 500;
    color: #475569;
  }

  .product-plan-highlight {
    font-weight: 700;
    color: #4f46e5;
    background-color: #eef2ff;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 4px;
    display: inline-block;
  }

  .product-duration {
    font-size: 12px;
    color: #64748b;
  }

  /* INFORMATION GRID */
  .info-grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-bottom: 8mm;
  }

  .info-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .info-label {
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .info-value {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  .info-subtext {
    font-size: 12px;
    color: #64748b;
    margin-top: 1px;
  }

  /* BILLING DETAILS BOX */
  .billing-details-box {
    background-color: #fafbfd;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 10mm;
  }

  .billing-box-title {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-top: 0;
    margin-bottom: 16px;
  }

  .billing-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 13px;
    color: #475569;
  }

  .billing-row:not(:last-child) {
    border-bottom: 1px solid #f8fafc;
  }

  .billing-row-label {
    font-weight: 400;
  }

  .billing-row-value {
    font-weight: 700;
    color: #0f172a;
  }

  .billing-row-value.monospace {
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    background-color: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .billing-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 16px;
    border-top: 1px dashed #cbd5e1;
  }

  .billing-total-label {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }

  .billing-total-amount {
    font-size: 22px;
    font-weight: 900;
    color: #4f46e5;
    letter-spacing: -0.02em;
  }

  /* FOOTER */
  .receipt-footer {
    margin-top: auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .qr-code-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 6mm;
    gap: 6px;
  }

  .qr-code-img {
    width: 100px;
    height: 100px;
    padding: 4px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background-color: #ffffff;
  }

  .qr-verified-text {
    font-size: 11px;
    font-weight: 700;
    color: #10b981;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .footer-divider {
    border: none;
    border-top: 1px dashed #e2e8f0;
    width: 100%;
    margin-bottom: 5mm;
  }

  .footer-legal-text {
    font-size: 11px;
    color: #64748b;
    line-height: 1.5;
    margin: 0 0 4px 0;
    max-width: 90%;
  }

  .footer-contact-text {
    font-size: 10px;
    color: #94a3b8;
    margin: 0;
  }

  .security-badge-container {
    margin-top: 5mm;
    margin-bottom: 2mm;
  }

  .security-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #ecfdf5;
    border: 1px solid #d1fae5;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    color: #065f46;
    letter-spacing: 0.5px;
  }

  /* PRINT STYLE OVERRIDES */
  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      background-color: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .receipt-a4-container {
      width: 210mm !important;
      height: 297mm !important;
      padding: 15mm !important;
      background-color: #ffffff !important;
    }
  }
</style>
</head>
<body>

<div class="receipt-a4-container">

  <!-- ── HEADER ── -->
  <div>
    <div class="receipt-header">
      <div class="header-left">
        <div class="brand-wrapper">
          <img src="/logo.png" alt="BoutiKonect" class="receipt-main-logo" />
          <span class="brand-name">
            BoutiKonect<span class="brand-dot">.</span>bj
          </span>
        </div>
        <span class="brand-country">République du Bénin</span>
      </div>

      <div class="header-right">
        <h2 class="document-title">QUITTANCE DE PAIEMENT</h2>
        <span class="document-ref">Réf: ${receiptRef}</span>
      </div>
    </div>

    <div class="header-divider"></div>

    <!-- ── STATUS BADGE ── -->
    <div class="status-pill-container">
      <div class="status-pill">
        <span class="status-dot"></span>
        <span>Transaction Confirmée & Sécurisée</span>
      </div>
    </div>

    <!-- ── PRODUCT BOX (APERÇU) ── -->
    <div class="product-preview-box">
      <div class="product-image-container">
        ${productImage
          ? `<img class="product-img" src="${productImage}" alt="${productTitle || 'Produit'}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''
        }
        <div class="product-fallback-img" style="display:${productImage ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; background-color: #eef2ff;">📦</div>
      </div>
      <div class="product-details">
        <h3 class="product-title">${productTitle || 'Produit'}</h3>
        <span class="product-plan">
          Plan : <span class="product-plan-highlight">${plan?.duration || 'Vedette'}</span>
        </span>
        <span class="product-duration">
          Durée : ${plan?.durationDays || 30} jours
        </span>
      </div>
    </div>

    <!-- ── INFORMATION GRID ── -->
    <div class="info-grid-container">
      <div class="info-column">
        <span class="info-label">Bénéficiaire (Vendeur)</span>
        <span class="info-value">${seller?.name || 'Vendeur BoutiKonect'}</span>
        <span class="info-subtext">${seller?.email || 'non renseigné'}</span>
      </div>

      <div class="info-column">
        <span class="info-label">Date de Paiement</span>
        <span class="info-value">${today}</span>
        <span class="info-subtext">Heure locale de Cotonou</span>
      </div>
    </div>

    <!-- ── BILLING DETAILS BOX ── -->
    <div class="billing-details-box">
      <h4 class="billing-box-title">Détails de la Promotion</h4>
      
      <div class="billing-row">
        <span class="billing-row-label">Description du Service</span>
        <span class="billing-row-value">Mise en avant - Plan ${plan?.duration || 'Vedette'}</span>
      </div>
      
      <div class="billing-row">
        <span class="billing-row-label">ID Transaction</span>
        <span class="billing-row-value monospace">${transactionId || 'N/A'}</span>
      </div>
      
      <div class="billing-row">
        <span class="billing-row-label">Méthode de règlement</span>
        <span class="billing-row-value">FedaPay Mobile Money</span>
      </div>

      <div class="billing-total-row">
        <span class="billing-total-label">Total Payé</span>
        <span class="billing-total-amount">
          ${plan?.priceLabel || (plan?.price ? `${plan.price.toLocaleString('fr-FR')} FCFA` : '5 000 FCFA')}
        </span>
      </div>
    </div>
  </div>

  <!-- ── FOOTER ── -->
  <div class="receipt-footer">
    <div class="qr-code-section">
      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(transactionId || 'BK-VERIFY')}"
        alt="QR Code de vérification"
        class="qr-code-img"
      />
      <span class="qr-verified-text">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px; color: #10b981;">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" opacity="0.3" />
          <path d="M6 10.5l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Vérifié
      </span>
    </div>

    <hr class="footer-divider" />

    <p class="footer-legal-text">
      Ce document certifie le paiement des frais de promotion sur BoutiKonect.bj.
    </p>
    <p class="footer-contact-text">
      BoutiKonect.bj - République du Bénin | Contact : support@boutikonect.bj
    </p>

    <div class="security-badge-container">
      <div class="security-badge">
        <span>🔒 DOCUMENT SÉCURISÉ & AUTHENTIQUE</span>
      </div>
    </div>
  </div>

</div>

</body>
</html>`;

  // Open in a new window and print
  const printWindow = window.open('', '_blank', 'width=500,height=700,menubar=no,toolbar=no,location=no,status=no');
  if (!printWindow) {
    // Fallback if popup blocked — print in current window
    const fallback = document.createElement('div');
    fallback.innerHTML = html;
    document.body.appendChild(fallback);
    fallback.style.position = 'fixed';
    fallback.style.top = '0';
    fallback.style.left = '0';
    fallback.style.zIndex = '99999';
    fallback.style.width = '100%';
    fallback.style.overflow = 'auto';
    fallback.style.background = '#fff';
    setTimeout(() => {
      window.print();
      document.body.removeChild(fallback);
    }, 500);
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Trigger print after content loads
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}
