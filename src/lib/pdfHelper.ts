// @ts-ignore
import html2pdf from 'html2pdf.js';

/**
 * Enhanced PDF and Print Helper for Thai Glass POS & Inventory
 * Supports direct crisp PDF rendering across deployments and safe browser printing.
 */

/**
 * Mathematically parses and converts any CSS oklch(L C H [/ A]) string to sRGB rgb(r, g, b) / rgba(r, g, b, a).
 * Compliant with W3C CSS Color Module 4 standard.
 */
function parseOklchToRgb(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('oklch')) {
    return colorStr;
  }

  const regex = /oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi;
  return colorStr.replace(regex, (_match, lRaw, cRaw, hRaw, aRaw) => {
    let L = parseFloat(lRaw);
    if (lRaw.endsWith('%')) L /= 100;
    let C = parseFloat(cRaw);
    if (cRaw.endsWith('%')) C /= 100;
    let H = parseFloat(hRaw);
    if (isNaN(H)) H = 0;

    let A = 1;
    if (aRaw) {
      A = parseFloat(aRaw);
      if (aRaw.endsWith('%')) A /= 100;
    }

    // OKLCH to OKLab
    const hRad = (H * Math.PI) / 180;
    const aLab = C * Math.cos(hRad);
    const bLab = C * Math.sin(hRad);

    // OKLab to LMS (cube)
    const l_ = L + 0.3963377774 * aLab + 0.2158037573 * bLab;
    const m_ = L - 0.1055613458 * aLab - 0.0638541728 * bLab;
    const s_ = L - 0.0894841775 * aLab - 1.291485548 * bLab;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    // LMS to Linear sRGB
    const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    // Linear sRGB to standard sRGB gamma
    const toSrgb = (c: number) => {
      const clamped = Math.max(0, Math.min(1, c));
      const val = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
      return Math.round(Math.max(0, Math.min(255, val * 255)));
    };

    const r = toSrgb(rLin);
    const g = toSrgb(gLin);
    const b = toSrgb(bLin);

    if (A < 1) {
      return `rgba(${r}, ${g}, ${b}, ${A.toFixed(2)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  });
}

/**
 * Sanitizes all style tags, element styles, and CSS rules inside a Document to eliminate oklch() color functions.
 */
function sanitizeDocColors(doc: Document) {
  // 1. Sanitize all <style> tags in document
  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = parseOklchToRgb(styleTag.textContent);
    }
  });

  // 2. Sanitize inline style attributes on all elements
  const allNodes = doc.querySelectorAll<HTMLElement>('*');
  allNodes.forEach((node) => {
    const styleAttr = node.getAttribute('style');
    if (styleAttr && styleAttr.includes('oklch')) {
      const fixedAttr = parseOklchToRgb(styleAttr);
      node.setAttribute('style', fixedAttr);
    }
    if (node.style) {
      if (node.style.color && node.style.color.includes('oklch')) {
        node.style.color = parseOklchToRgb(node.style.color);
      }
      if (node.style.backgroundColor && node.style.backgroundColor.includes('oklch')) {
        node.style.backgroundColor = parseOklchToRgb(node.style.backgroundColor);
      }
      if (node.style.borderColor && node.style.borderColor.includes('oklch')) {
        node.style.borderColor = parseOklchToRgb(node.style.borderColor);
      }
    }
  });
}

/**
 * Prepares and converts a cloned invoice element to crisp, ink-saving light mode.
 */
function prepareCloneForOutput(clone: HTMLElement) {
  // Remove no-print elements from clone
  const noPrintElements = clone.querySelectorAll('.no-print');
  noPrintElements.forEach((el) => el.remove());

  // Set baseline light styling on root clone
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.fontFamily = "'Hind Siliguri', 'SolaimanLipi', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  clone.style.width = '100%';
  clone.style.maxWidth = '780px';
  clone.style.margin = '0 auto';
  clone.style.boxSizing = 'border-box';

  const isFinancialOrExpenseReport =
    clone.id === 'printable-full-financial-report' ||
    clone.id === 'printable-operating-expenses-report' ||
    clone.classList.contains('printable-financial-report');

  if (isFinancialOrExpenseReport) {
    // For financial reports, match exact preview: white background with dark header & KPI cards, and colored metric text.
    const children = clone.querySelectorAll<HTMLElement>('*');
    children.forEach((child) => {
      // Keep dark banner & summary cards
      if (child.classList.contains('bg-slate-900') || child.classList.contains('bg-slate-950')) {
        child.style.backgroundColor = '#0f172a';
        child.style.color = '#ffffff';
      }
      // Keep light table headers
      if (child.classList.contains('bg-slate-100') || child.style.backgroundColor === 'rgb(241, 245, 249)') {
        child.style.backgroundColor = '#f1f5f9';
        child.style.color = '#0f172a';
      }
      // Ensure crisp borders
      if (child.classList.contains('border-slate-900')) {
        child.style.borderColor = '#0f172a';
      } else if (child.classList.contains('border-slate-300') || child.classList.contains('border-slate-400')) {
        child.style.borderColor = '#cbd5e1';
      }
      // Keep exact vibrant status & KPI metrics
      if (child.classList.contains('text-emerald-400') || child.classList.contains('text-emerald-500')) {
        child.style.color = '#10b981';
      } else if (child.classList.contains('text-rose-400') || child.classList.contains('text-rose-500') || child.classList.contains('text-rose-700')) {
        child.style.color = '#f43f5e';
      } else if (child.classList.contains('text-amber-400') || child.classList.contains('text-amber-500')) {
        child.style.color = '#f59e0b';
      } else if (child.classList.contains('text-sky-400') || child.classList.contains('text-sky-500')) {
        child.style.color = '#0284c7';
      } else if (child.classList.contains('text-purple-400')) {
        child.style.color = '#a855f7';
      }
    });
  } else {
    // Transform dark classes to crisp light mode
    const children = clone.querySelectorAll<HTMLElement>('*');
    children.forEach((child) => {
      const tagName = child.tagName.toLowerCase();
      const isDarkHeaderOrCard =
        tagName === 'th' ||
        child.classList.contains('bg-slate-900') ||
        child.classList.contains('bg-slate-950') ||
        child.classList.contains('bg-slate-800') ||
        child.classList.contains('bg-slate-850') ||
        child.classList.contains('bg-slate-700') ||
        child.classList.contains('bg-slate-50') ||
        child.classList.contains('bg-slate-100');

      // Remove dark background & text Tailwind classes
      child.classList.remove(
        'bg-slate-900',
        'bg-slate-950',
        'bg-slate-800',
        'bg-slate-850',
        'bg-slate-700',
        'bg-slate-900/50',
        'bg-slate-950/70',
        'bg-slate-950/80',
        'text-white',
        'text-slate-100',
        'text-slate-200',
        'text-slate-300',
        'text-slate-400'
      );

      // Apply inline light backgrounds for cards/headers
      if (isDarkHeaderOrCard) {
        child.style.backgroundColor = '#f8fafc';
      }

      // Set border colors
      if (
        child.classList.contains('border') ||
        child.classList.contains('border-b') ||
        child.classList.contains('border-t') ||
        child.classList.contains('border-slate-800') ||
        child.classList.contains('border-slate-700') ||
        child.classList.contains('border-slate-400') ||
        child.classList.contains('border-slate-300')
      ) {
        child.style.borderColor = '#cbd5e1';
      }

      // Keep crisp text colors
      if (
        child.classList.contains('text-rose-700') ||
        child.classList.contains('text-rose-600') ||
        child.classList.contains('text-rose-500') ||
        child.classList.contains('text-rose-400')
      ) {
        child.style.color = '#be123c';
      } else if (
        child.classList.contains('text-emerald-700') ||
        child.classList.contains('text-emerald-600') ||
        child.classList.contains('text-emerald-500') ||
        child.classList.contains('text-emerald-400')
      ) {
        child.style.color = '#047857';
      } else if (
        child.classList.contains('text-amber-700') ||
        child.classList.contains('text-amber-600') ||
        child.classList.contains('text-amber-500') ||
        child.classList.contains('text-amber-400')
      ) {
        child.style.color = '#b45309';
      } else if (child.classList.contains('text-slate-600') || child.classList.contains('text-slate-500')) {
        child.style.color = '#475569';
      } else if (child.classList.contains('text-slate-400')) {
        child.style.color = '#64748b';
      } else if (!child.classList.contains('text-emerald-400') && !child.classList.contains('text-rose-400')) {
        child.style.color = '#0f172a';
      }
    });
  }
}

/**
 * Returns a comprehensive, standalone CSS stylesheet guaranteed to render
 * memo cards, tables, grids, flexboxes, borders, and typography identically to the on-screen preview.
 */
function getEmbeddedPrintStyles(): string {
  return `
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Hind Siliguri', 'SolaimanLipi', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
      font-size: 12px !important;
      line-height: 1.5 !important;
    }

    body * {
      visibility: visible !important;
    }

    .print-outer-container {
      width: 100% !important;
      max-width: 780px !important;
      margin: 0 auto !important;
      padding: 8px !important;
      background-color: #ffffff !important;
      color: #0f172a !important;
    }

    .no-print {
      display: none !important;
    }

    /* Flexbox Layout Utilities */
    .flex { display: flex !important; }
    .inline-flex { display: inline-flex !important; }
    .flex-col { flex-direction: column !important; }
    .flex-wrap { flex-wrap: wrap !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-end { align-items: flex-end !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-end { justify-content: flex-end !important; }
    .justify-center { justify-content: center !important; }
    .shrink-0 { flex-shrink: 0 !important; }

    /* Grid Layout Utilities */
    .grid { display: grid !important; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
    .grid-cols-2, .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-3, .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .grid-cols-4, .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .grid-cols-5, .sm\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
    .grid-cols-6, .sm\\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; }
    .gap-1 { gap: 4px !important; }
    .gap-1\\.5 { gap: 6px !important; }
    .gap-2 { gap: 8px !important; }
    .gap-2\\.5 { gap: 10px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-4 { gap: 16px !important; }
    .gap-5 { gap: 20px !important; }

    /* Vertical Spacing System */
    .space-y-1 > * + * { margin-top: 4px !important; }
    .space-y-1\\.5 > * + * { margin-top: 6px !important; }
    .space-y-2 > * + * { margin-top: 8px !important; }
    .space-y-3 > * + * { margin-top: 12px !important; }
    .space-y-4 > * + * { margin-top: 16px !important; }
    .space-y-5 > * + * { margin-top: 20px !important; }
    .space-y-6 > * + * { margin-top: 24px !important; }

    /* Width & Alignment Helpers */
    .w-full { width: 100% !important; }
    .w-12 { width: 48px !important; }
    .w-48 { width: 192px !important; }
    .w-60 { width: 240px !important; }
    .w-72, .sm\\:w-72 { width: 288px !important; }
    .w-80 { width: 320px !important; }
    .ml-auto { margin-left: auto !important; }
    .mr-auto { margin-right: auto !important; }

    /* Padding & Margins */
    .p-1 { padding: 4px !important; }
    .p-1\\.5 { padding: 6px !important; }
    .p-2 { padding: 8px !important; }
    .p-3 { padding: 12px !important; }
    .p-3\\.5 { padding: 14px !important; }
    .p-4 { padding: 16px !important; }
    .p-6 { padding: 24px !important; }
    .p-8 { padding: 32px !important; }
    .pt-1 { padding-top: 4px !important; }
    .pt-2 { padding-top: 8px !important; }
    .pt-4 { padding-top: 16px !important; }
    .pt-6 { padding-top: 24px !important; }
    .pt-8 { padding-top: 32px !important; }
    .pt-12 { padding-top: 48px !important; }
    .pb-1 { padding-bottom: 4px !important; }
    .pb-2 { padding-bottom: 8px !important; }
    .my-1 { margin-top: 4px !important; margin-bottom: 4px !important; }
    .my-2 { margin-top: 8px !important; margin-bottom: 8px !important; }
    .mb-1 { margin-bottom: 4px !important; }
    .mb-1\\.5 { margin-bottom: 6px !important; }
    .mb-2 { margin-bottom: 8px !important; }
    .mt-0\\.5 { margin-top: 2px !important; }
    .mt-1 { margin-top: 4px !important; }

    /* Typography & Font Weight */
    .font-sans { font-family: 'Hind Siliguri', 'SolaimanLipi', 'Plus Jakarta Sans', system-ui, sans-serif !important; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
    .font-normal { font-weight: 400 !important; }
    .font-medium { font-weight: 500 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-bold { font-weight: 700 !important; }
    .font-black, .font-extrabold { font-weight: 900 !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    .text-\\[9px\\] { font-size: 9px !important; }
    .text-\\[10px\\] { font-size: 10px !important; }
    .text-\\[11px\\] { font-size: 11px !important; }
    .text-xs { font-size: 12px !important; }
    .text-sm { font-size: 14px !important; }
    .text-base { font-size: 15px !important; }
    .text-lg { font-size: 18px !important; }
    .text-xl { font-size: 20px !important; }
    .text-2xl { font-size: 24px !important; }
    .uppercase { text-transform: uppercase !important; }
    .tracking-tight { letter-spacing: -0.025em !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .leading-normal { line-height: 1.5 !important; }
    .leading-tight { line-height: 1.25 !important; }

    /* Borders & Dividers */
    .border { border: 1px solid #cbd5e1 !important; }
    .border-t { border-top: 1px solid #cbd5e1 !important; }
    .border-b { border-bottom: 1px solid #cbd5e1 !important; }
    .border-t-2 { border-top: 2px solid #0f172a !important; }
    .border-b-2 { border-bottom: 2px solid #0f172a !important; }
    .border-dashed { border-style: dashed !important; }
    .rounded { border-radius: 4px !important; }
    .rounded-md { border-radius: 6px !important; }
    .rounded-lg { border-radius: 8px !important; }
    .rounded-xl { border-radius: 12px !important; }
    .border-slate-200, .border-slate-300, .border-slate-400, .border-slate-700, .border-slate-800 {
      border-color: #cbd5e1 !important;
    }
    .border-slate-900 {
      border-color: #0f172a !important;
    }
    .divide-y > * + * {
      border-top: 1px solid #e2e8f0 !important;
    }

    /* Backgrounds & Text Colors */
    .bg-white { background-color: #ffffff !important; }
    .bg-slate-50, .bg-slate-100 {
      background-color: #f1f5f9 !important;
    }
    .bg-slate-800, .bg-slate-900, .bg-slate-950, .bg-slate-950\\/80 {
      background-color: #0f172a !important;
      color: #ffffff !important;
    }
    .text-slate-900, .text-slate-800, .text-slate-700 {
      color: #0f172a !important;
    }
    .text-slate-600, .text-slate-500 {
      color: #475569 !important;
    }
    .text-slate-400 {
      color: #64748b !important;
    }
    .text-slate-100, .text-slate-200, .text-slate-300, .text-white {
      color: #ffffff !important;
    }

    /* Metric & Category Status Colors */
    .text-emerald-400, .text-emerald-500, .text-emerald-600, .text-emerald-700 {
      color: #10b981 !important;
    }
    .text-rose-400, .text-rose-500, .text-rose-600, .text-rose-700 {
      color: #f43f5e !important;
    }
    .text-amber-400, .text-amber-500, .text-amber-600, .text-amber-700 {
      color: #f59e0b !important;
    }
    .text-sky-400, .text-sky-500, .text-sky-600, .text-sky-700 {
      color: #0284c7 !important;
    }
    .text-purple-400 {
      color: #a855f7 !important;
    }

    /* Badges */
    .bg-emerald-500\\/10, .bg-emerald-50 {
      background-color: #ecfdf5 !important;
      color: #047857 !important;
      border-color: #a7f3d0 !important;
    }
    .bg-rose-500\\/10, .bg-rose-50 {
      background-color: #fff1f2 !important;
      color: #be123c !important;
      border-color: #fecdd3 !important;
    }
    .bg-amber-500\\/10, .bg-amber-50 {
      background-color: #fffbeb !important;
      color: #b45309 !important;
      border-color: #fde68a !important;
    }

    /* Crisp Table Styling */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin-top: 6px !important;
      margin-bottom: 6px !important;
      font-size: 11px !important;
    }
    table thead th {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: 700 !important;
      padding: 7px 8px !important;
      border: 1px solid #cbd5e1 !important;
    }
    table tbody td {
      padding: 6px 8px !important;
      border: 1px solid #e2e8f0 !important;
      color: #0f172a !important;
    }
    table tbody tr:nth-child(even) {
      background-color: #f8fafc !important;
    }

    /* Print Memo Containers */
    #printable-cash-memo,
    #printable-single-invoice,
    #printable-full-financial-report,
    #printable-operating-expenses-report,
    #printable-attendance-sheet,
    .printable-memo,
    .printable-invoice,
    .printable-financial-report {
      width: 100% !important;
      max-width: 780px !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      color: #0f172a !important;
      padding: 16px !important;
      box-sizing: border-box !important;
      box-shadow: none !important;
    }

    /* Preserve dark banners inside financial reports in print */
    .printable-financial-report .bg-slate-900,
    .printable-financial-report .bg-slate-950 {
      background-color: #0f172a !important;
      color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .printable-financial-report .border-slate-900 {
      border-color: #0f172a !important;
    }
  `;
}

/**
 * Directly invokes system print dialog via an isolated, fully styled iframe.
 */
export const printElementDirectly = (elementId: string, title?: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for printing.`);
    window.print();
    return;
  }

  try {
    // 1. Clone element and prepare layout matching preview
    const clone = element.cloneNode(true) as HTMLElement;
    prepareCloneForOutput(clone);

    // 2. Create an isolated iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-99999';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title || 'Print Document'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            ${getEmbeddedPrintStyles()}
          </style>
        </head>
        <body>
          <div class="print-outer-container">
            ${clone.outerHTML}
          </div>
        </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Allow fonts and styles to settle before invoking system print spooler
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1200);
      }
    }, 450);
  } catch (e) {
    console.error('Direct print failed, falling back to window.print():', e);
    window.print();
  }
};

/**
 * Displays feedback toast during PDF compilation & download.
 */
function showPdfToast(status: 'loading' | 'success' | 'error', message?: string) {
  if (typeof document === 'undefined') return;
  let toastEl = document.getElementById('pdf-download-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'pdf-download-toast';
    toastEl.style.position = 'fixed';
    toastEl.style.bottom = '24px';
    toastEl.style.right = '24px';
    toastEl.style.zIndex = '999999';
    toastEl.style.transition = 'all 0.3s ease';
    document.body.appendChild(toastEl);
  }

  if (status === 'loading') {
    toastEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;background:#0f172a;color:#f8fafc;padding:12px 20px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #334155;font-family:sans-serif;font-size:14px;">
        <div style="width:18px;height:18px;border:2px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:spinPdf 1s linear infinite;"></div>
        <div>
          <div style="font-weight:600;color:#38bdf8;">${message || 'PDF তৈরি হচ্ছে (Generating PDF)...'}</div>
          <div style="font-size:12px;color:#94a3b8;">অনুগ্রহ করে অপেক্ষা করুন...</div>
        </div>
      </div>
      <style>@keyframes spinPdf { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
    toastEl.style.display = 'block';
  } else if (status === 'error') {
    toastEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;background:#450a0a;color:#fecaca;padding:12px 20px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #dc2626;font-family:sans-serif;font-size:14px;">
        <span style="font-size:18px;">⚠️</span>
        <div>
          <div style="font-weight:600;color:#f87171;">প্রিন্ট নোটিফিকেশন</div>
          <div style="font-size:12px;color:#fca5a5;">${message || 'সরাসরি PDF ডাউনলোড করা সম্ভব হয়নি। প্রিন্ট ডায়ালগ ওপেন করা হয়েছে...'}</div>
        </div>
      </div>
    `;
    toastEl.style.display = 'block';
    setTimeout(() => {
      if (toastEl && document.body.contains(toastEl)) {
        toastEl.style.display = 'none';
      }
    }, 4000);
  } else {
    if (toastEl && document.body.contains(toastEl)) {
      toastEl.style.display = 'none';
    }
  }
}

/**
 * Downloads a printable HTML element as a PDF file directly.
 * Hardened for production deployments and cross-origin CSS compatibility.
 */
export const downloadElementAsPDF = async (elementId: string, filename: string): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found.`);
    showPdfToast('error', 'ডকুমেন্ট খুঁজে পাওয়া যায়নি। আবার চেষ্টা করুন।');
    return false;
  }

  showPdfToast('loading');
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8] as [number, number, number, number],
    filename: cleanFilename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      letterRendering: true,
      onclone: (clonedDoc: Document) => {
        // 1. Remove all external stylesheets to eliminate oklch rules that crash html2canvas
        const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach((s) => s.remove());

        // 2. Inject standalone CSS stylesheet with pure hex/rgb colors
        const newStyle = clonedDoc.createElement('style');
        newStyle.textContent = getEmbeddedPrintStyles();
        clonedDoc.head.appendChild(newStyle);

        // 3. Mathematical OKLCH sanitizer on all cloned DOM elements
        sanitizeDocColors(clonedDoc);
      },
    },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  };

  let wrapper: HTMLDivElement | null = null;

  try {
    // Clone element for PDF generation
    const clone = element.cloneNode(true) as HTMLElement;
    prepareCloneForOutput(clone);

    wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '-99999px';
    wrapper.style.left = '0';
    wrapper.style.width = '794px'; // Standard A4 width in pixels at 96 DPI
    wrapper.style.zIndex = '-99999';
    wrapper.style.opacity = '1';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'visible';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await html2pdf().set(opt).from(clone).save();
    showPdfToast('success');
    return true;
  } catch (err) {
    console.error('PDF export error:', err);
    showPdfToast('error', 'সরাসরি PDF ডাউনলোড করা সম্ভব হয়নি। প্রিন্ট ডায়ালগ ওপেন করা হয়েছে...');
    // Fallback to direct print if PDF generation was interrupted
    printElementDirectly(elementId, cleanFilename);
    return false;
  } finally {
    if (wrapper && document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
};

