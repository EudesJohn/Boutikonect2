// ============================================================
// Payment Receipt (Quittance de paiement) generator
// Premium PDF receipt using HTML → jsPDF .html() method
// ============================================================

import { jsPDF } from 'jspdf';

/**
 * Generate a payment receipt PDF and download it.
 */
export function downloadReceipt({
  productTitle,
  transactionId,
  amount,
  durationLabel,
  validUntil,
  customerName,
  customerEmail,
}) {
  const receiptNum = `BK-${String(transactionId || '').slice(-8).toUpperCase()}`;
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const validDate = new Date(validUntil).toLocaleDateString('fr-FR');
  const amountFormatted = Number(amount).toLocaleString('fr-FR');

  const receiptHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f5f3ff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 24px;
    color: #111827;
    -webkit-font-smoothing: antialiased;
  }

  .receipt {
    width: 460px;
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 15px 50px rgba(79,59,158,0.10), 0 0 0 1px rgba(79,59,158,0.05);
  }

  /* ── HEADER ── */
  .header {
    background: linear-gradient(135deg, #0f0a2e 0%, #1a1040 40%, #2d1b69 100%);
    padding: 32px 36px 28px;
    position: relative;
    overflow: hidden;
  }

  .header::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -25%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%);
  }

  .header::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -15%;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,0.04), transparent 70%);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 900;
    font-size: 16px;
    box-shadow: 0 4px 12px rgba(245,158,11,0.25);
  }

  .brand-text h1 {
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .brand-text span {
    font-size: 8px;
    color: rgba(255,255,255,0.4);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .secure-badge {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 8px;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .secure-badge svg { width: 10px; height: 10px; color: #34d399; }

  .header-title {
    margin-top: 20px;
    position: relative;
    z-index: 1;
  }

  .header-title h2 {
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.025em;
    line-height: 1;
  }

  .header-title h2 + h2 { margin-top: 2px; }

  .header-ref {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
  }

  .header-ref .line {
    height: 1px;
    flex: 1;
    background: linear-gradient(to right, rgba(245,158,11,0.5), transparent);
  }

  .header-ref span {
    font-size: 9px;
    color: rgba(255,255,255,0.45);
    font-family: 'SF Mono', 'Fira Code', monospace;
    letter-spacing: 1px;
  }

  /* ── BODY ── */
  .body { padding: 24px 36px 20px; }

  .status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 20px;
    padding: 4px 12px;
  }

  .status-badge .dot {
    width: 5px; height: 5px;
    background: #059669;
    border-radius: 50%;
  }

  .status-badge span {
    font-size: 9px;
    font-weight: 700;
    color: #047857;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .status-bar .sep { color: #d1d5db; font-size: 9px; }
  .status-bar .date { font-size: 8px; color: #9ca3af; }

  /* Snapshot */
  .snapshot {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .snap-item { text-align: center; }

  .snap-icon {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: #f0f0ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  .snap-icon svg { width: 12px; height: 12px; color: #4f3b9e; }

  .snap-label {
    font-size: 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    font-weight: 600;
  }

  .snap-value {
    font-size: 9px;
    font-weight: 700;
    color: #1f2937;
    margin-top: 1px;
  }

  /* Sep dots */
  .sep-dots {
    position: relative;
    margin-bottom: 20px;
    text-align: center;
  }

  .sep-dots::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0; right: 0;
    height: 1px;
    background: #f3f4f6;
  }

  .sep-dots .dots {
    display: inline-flex;
    gap: 5px;
    background: #fff;
    padding: 0 14px;
    position: relative;
  }

  .sep-dots .dots span {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #e5e7eb;
  }

  /* Section title */
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .section-title .accent {
    width: 14px;
    height: 1px;
    background: linear-gradient(to right, #4f3b9e, transparent);
  }

  .section-title span {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #4f3b9e;
  }

  /* Finance table */
  .finance-table {
    background: #fff;
    border: 1px solid #f3f4f6;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .finance-row {
    display: flex;
    justify-content: space-between;
    padding: 9px 14px;
    border-bottom: 1px solid #f9fafb;
  }

  .finance-row:last-child { border-bottom: none; }

  .finance-row .label { font-size: 10px; color: #6b7280; }
  .finance-row .value { font-size: 10px; font-weight: 600; color: #1f2937; text-align: right; }
  .finance-row.amount .value { font-size: 13px; font-weight: 800; color: #4f3b9e; }

  /* Seller */
  .seller-card {
    background: linear-gradient(to right, #f8f7ff, #fff);
    border: 1px solid #eeeaff;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .seller-card .avatar {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #4f3b9e, #2d1b69);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
  }

  .seller-card .name { font-size: 12px; font-weight: 700; color: #111827; }
  .seller-card .email { font-size: 9px; color: #9ca3af; margin-top: 1px; }

  /* Security */
  .security-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 20px;
  }

  .security-grid .item {
    border-radius: 10px;
    padding: 10px 6px;
    text-align: center;
  }

  .security-grid .item.shield { background: #ecfdf5; }
  .security-grid .item.fedapay { background: #f0f0ff; }
  .security-grid .item.rgpd { background: #fffbeb; }

  .security-grid .item svg { width: 14px; height: 14px; margin: 0 auto 3px; display: block; }
  .security-grid .item.shield svg { color: #059669; }
  .security-grid .item.fedapay svg { color: #4f3b9e; }
  .security-grid .item.rgpd svg { color: #d97706; }

  .security-grid .item .slabel {
    font-size: 6px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #9ca3af;
    font-weight: 600;
  }

  .security-grid .item .svalue {
    font-size: 8px;
    font-weight: 700;
    margin-top: 1px;
  }

  .security-grid .item.shield .svalue { color: #059669; }
  .security-grid .item.fedapay .svalue { color: #4f3b9e; }
  .security-grid .item.rgpd .svalue { color: #d97706; }

  /* Thank you */
  .thankyou {
    text-align: center;
    padding-top: 14px;
    border-top: 1px solid #f3f4f6;
  }

  .thankyou p {
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;
  }

  .thankyou span {
    font-size: 8px;
    color: #9ca3af;
    margin-top: 3px;
    display: block;
  }

  /* ── FOOTER ── */
  .footer {
    background: #faf9ff;
    padding: 12px 36px;
    border-top: 1px solid #f0ecff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer .left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .footer .left svg { width: 18px; height: 18px; color: #4f3b9e; opacity: 0.35; }
  .footer .left span { font-size: 7px; color: #9ca3af; font-family: 'SF Mono', 'Fira Code', monospace; }
  .footer .right { font-size: 7px; color: #d1d5db; }
</style>
</head>
<body>

<svg style="display:none">
  <symbol id="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="9" width="18" height="12" rx="2"/>
    <path d="M7 9V6a5 5 0 0110 0v3"/>
    <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
  </symbol>
  <symbol id="fedapay" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M12 3L4 8v8l8 5 8-5V8l-8-5z"/>
    <circle cx="12" cy="12" r="3"/>
  </symbol>
  <symbol id="scroll" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 21h-6a4 4 0 01-4-4V5a2 2 0 012-2h10a2 2 0 012 2v12a4 4 0 01-4 4z"/>
    <path d="M9 7h6M9 11h6"/>
  </symbol>
  <symbol id="hash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </symbol>
  <symbol id="calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </symbol>
  <symbol id="clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </symbol>
  <symbol id="logo" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.12"/>
    <path d="M16 6l3.5 7.5L27 17l-7.5 3.5L16 28l-3.5-7.5L5 17l7.5-3.5L16 6z" fill="currentColor"/>
  </symbol>
</svg>

<div class="receipt">
  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="brand">
        <div class="brand-icon">B</div>
        <div class="brand-text">
          <h1>BoutiKonect</h1>
          <span>Marketplace</span>
        </div>
      </div>
      <div class="secure-badge">
        <svg><use href="#shield"/></svg>
        Sécurisé
      </div>
    </div>
    <div class="header-title">
      <h2>Quittance</h2>
      <h2>de paiement</h2>
      <div class="header-ref">
        <div class="line"></div>
        <span>${receiptNum}</span>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">
    <div class="status-bar">
      <div class="status-badge">
        <span class="dot"></span>
        <span>Payé</span>
      </div>
      <span class="sep">•</span>
      <span class="date">${today}</span>
    </div>

    <div class="snapshot">
      <div class="snap-item">
        <div class="snap-icon"><svg><use href="#hash"/></svg></div>
        <div class="snap-label">Transaction</div>
        <div class="snap-value">#${String(transactionId || '').slice(-8)}</div>
      </div>
      <div class="snap-item">
        <div class="snap-icon"><svg><use href="#calendar"/></svg></div>
        <div class="snap-label">Date</div>
        <div class="snap-value">${today.split(' ').slice(0, 3).join(' ')}</div>
      </div>
      <div class="snap-item">
        <div class="snap-icon"><svg><use href="#clock"/></svg></div>
        <div class="snap-label">Valable jusqu'au</div>
        <div class="snap-value">${validDate}</div>
      </div>
    </div>

    <div class="sep-dots"><div class="dots"><span></span><span></span><span></span></div></div>

    <div class="section-title">
      <div class="accent"></div>
      <span>Détails de la transaction</span>
    </div>
    <div class="finance-table">
      <div class="finance-row">
        <span class="label">Transaction</span>
        <span class="value">#${transactionId || 'N/A'}</span>
      </div>
      <div class="finance-row">
        <span class="label">Produit</span>
        <span class="value">${productTitle || '-'}</span>
      </div>
      <div class="finance-row">
        <span class="label">Forfait</span>
        <span class="value">${durationLabel || '-'}</span>
      </div>
      <div class="finance-row amount">
        <span class="label">Montant total</span>
        <span class="value">${amountFormatted} FCFA</span>
      </div>
      <div class="finance-row">
        <span class="label">Mode de paiement</span>
        <span class="value">Mobile Money (FedaPay)</span>
      </div>
      <div class="finance-row">
        <span class="label">Statut</span>
        <span class="value" style="color:#059669;">✓ Actif</span>
      </div>
    </div>

    <div class="section-title">
      <div class="accent"></div>
      <span>Bénéficiaire</span>
    </div>
    <div class="seller-card">
      <div class="avatar">${(customerName || '?').charAt(0).toUpperCase()}</div>
      <div>
        <div class="name">${customerName || 'Non renseigné'}</div>
        <div class="email">${customerEmail || ''}</div>
      </div>
    </div>

    <div class="security-grid">
      <div class="item shield">
        <svg><use href="#shield"/></svg>
        <div class="slabel">Transaction</div>
        <div class="svalue">100% sécurisée</div>
      </div>
      <div class="item fedapay">
        <svg><use href="#fedapay"/></svg>
        <div class="slabel">Processeur</div>
        <div class="svalue">FedaPay</div>
      </div>
      <div class="item rgpd">
        <svg><use href="#scroll"/></svg>
        <div class="slabel">Conformité</div>
        <div class="svalue">RGPD</div>
      </div>
    </div>

    <div class="thankyou">
      <p>Merci de votre confiance</p>
      <span>BoutiKonect — Mettez vos annonces en avant</span>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="left">
      <svg><use href="#logo"/></svg>
      <span>${receiptNum}</span>
    </div>
    <div class="right">Généré le ${today}</div>
  </div>
</div>

</body>
</html>`;

  // ── Render HTML → canvas → PDF ──
  const container = document.createElement('div');
  container.innerHTML = receiptHtml;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-9999';
  document.body.appendChild(container);

  try {
    const receiptEl = container.querySelector('.receipt');
    if (!receiptEl) {
      document.body.removeChild(container);
      console.error('[Receipt] .receipt element not found in template');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    doc.html(receiptEl, {
      x: 0,
      y: 0,
      width: 190,
      windowWidth: 460,
      autoPaging: false,
      margin: [10, 10, 10, 10],
      callback: (pdfDoc) => {
        try {
          pdfDoc.save(`quittance-${receiptNum}.pdf`);
        } finally {
          if (container.parentNode) document.body.removeChild(container);
        }
      },
    });
  } catch (err) {
    // Cleanup on sync throw
    if (container.parentNode) document.body.removeChild(container);
    console.error('[Receipt] PDF generation failed:', err);
  }
}
