// @ts-ignore
import html2pdf from 'html2pdf.js';

/**
 * Enhanced PDF and Print Helper for Thai Glass POS & Inventory
 * Supports direct crisp PDF rendering across deployments and safe browser printing.
 */

// Helper canvas context to convert any CSS color string (including oklch) to rgb/hex
const colorCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (colorCanvas) {
  colorCanvas.width = 1;
  colorCanvas.height = 1;
}
const colorCtx = colorCanvas ? colorCanvas.getContext('2d') : null;

/**
 * Converts any oklch(...) color string to a safe hex/rgb color string supported by html2canvas.
 */
function convertCssColor(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('oklch')) return colorStr;

  // Try parsing oklch lightness value: e.g. oklch(0.98 0.01 200) or oklch(98% ...)
  const match = colorStr.match(/oklch\(\s*([\d.%]+)/i);
  if (match) {
    let lVal = parseFloat(match[1]);
    if (match[1].endsWith('%')) {
      lVal = lVal / 100;
    }
    // High lightness (>=0.7) -> light gray/white background
    if (lVal >= 0.8) return '#f8fafc';
    if (lVal >= 0.6) return '#e2e8f0';
    if (lVal >= 0.4) return '#475569';
    return '#000000'; // dark text
  }

  return '#ffffff'; // Safe light background fallback
}

/**
 * Sanitizes all style tags, element styles, and CSS rules inside a Document to eliminate oklch() color functions.
 */
function sanitizeDocColors(doc: Document) {
  // 1. Sanitize all <style> tags in document
  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/gi, (match) => convertCssColor(match));
    }
  });

  // 2. Sanitize inline style attributes on all elements
  const allNodes = doc.querySelectorAll<HTMLElement>('*');
  allNodes.forEach((node) => {
    const styleAttr = node.getAttribute('style');
    if (styleAttr && styleAttr.includes('oklch')) {
      const fixedAttr = styleAttr.replace(/oklch\([^)]+\)/gi, (match) => convertCssColor(match));
      node.setAttribute('style', fixedAttr);
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
    .divide-y > * + * {
      border-top: 1px solid #e2e8f0 !important;
    }

    /* Backgrounds & Text Colors */
    .bg-white { background-color: #ffffff !important; }
    .bg-slate-50, .bg-slate-100, .bg-slate-800, .bg-slate-900, .bg-slate-950, .bg-slate-950\\/80 {
      background-color: #f8fafc !important;
    }
    .text-slate-900, .text-slate-800, .text-slate-700, .text-slate-100, .text-slate-200, .text-slate-300 {
      color: #0f172a !important;
    }
    .text-slate-600, .text-slate-500, .text-slate-400 {
      color: #475569 !important;
    }
    .text-emerald-400, .text-emerald-500, .text-emerald-600, .text-emerald-700 {
      color: #047857 !important;
    }
    .text-rose-400, .text-rose-500, .text-rose-600, .text-rose-700 {
      color: #be123c !important;
    }
    .text-amber-400, .text-amber-500, .text-amber-600, .text-amber-700 {
      color: #b45309 !important;
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
  `;
}

/**
 * Prints a specific HTML element cleanly in a dedicated printable iframe.
 * Preserves the exact on-screen preview layout, grids, flexboxes, borders, and colors
 * across desktop and mobile browsers (including Android Print Spooler).
 */
export const printElementDirectly = (elementId: string, title?: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for printing.`);
    window.print();
    return;
  }

  try {
    // 1. Clone element and transform to crisp light mode
    const clone = element.cloneNode(true) as HTMLElement;
    prepareCloneForOutput(clone);

    // 2. Collect existing stylesheets & fonts from main document
    let parentStyles = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
      parentStyles += el.outerHTML + '\n';
    });

    // 3. Create an isolated iframe configured so mobile Print Spoolers don't clip it
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-99999';
    iframe.style.opacity = '0.01'; // Visible to print engines, transparent to user
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
          <title>${title || 'Memo Print'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          ${parentStyles}
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

function showPdfToast(status: 'loading' | 'success' | 'error', message?: string) {
  if (typeof document === 'undefined') return;
  let toastEl = document.getElementById('pdf-generation-status-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'pdf-generation-status-toast';
    toastEl.style.position = 'fixed';
    toastEl.style.bottom = '24px';
    toastEl.style.right = '24px';
    toastEl.style.zIndex = '99999';
    toastEl.style.transition = 'all 0.3s ease';
    document.body.appendChild(toastEl);
  }

  if (status === 'loading') {
    toastEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;background:#0f172a;color:#f8fafc;padding:12px 20px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #334155;font-family:sans-serif;font-size:14px;">
        <div style="width:18px;height:18px;border:2px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:spinPdf 1s linear infinite;"></div>
        <div>
          <div style="font-weight:600;color:#38bdf8;">Generating Invoice PDF...</div>
          <div style="font-size:12px;color:#94a3b8;">Please wait...</div>
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
          <div style="font-weight:600;color:#f87171;">ত্রুটি (Error)</div>
          <div style="font-size:12px;color:#fca5a5;">${message || 'Invoice PDF তৈরি করা সম্ভব হয়নি। আবার চেষ্টা করুন।'}</div>
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
    showPdfToast('error', 'Invoice PDF তৈরি করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
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
        sanitizeDocColors(clonedDoc);
      },
    },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  };

  let wrapper: HTMLDivElement | null = null;

  try {
    // Clone element for PDF generation
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove no-print elements from clone
    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    // Apply print-friendly light styling to clone root
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#000000';
    clone.style.padding = '16px';
    clone.style.fontFamily = "'Hind Siliguri', 'SolaimanLipi', 'Plus Jakarta Sans', sans-serif";
    clone.style.width = '750px';

    // Transform dark classes to crisp light mode inside PDF clone
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

      // 1. Strip dark background & text Tailwind classes
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

      // 2. Set background color to light gray for headers/summary cards or white for body
      if (isDarkHeaderOrCard) {
        child.style.backgroundColor = '#f8fafc';
      } else {
        child.style.backgroundColor = '#ffffff';
      }

      // 3. Keep crisp black text unless it's a specific colored metric
      if (
        !child.classList.contains('text-rose-700') &&
        !child.classList.contains('text-rose-600') &&
        !child.classList.contains('text-rose-400') &&
        !child.classList.contains('text-emerald-700') &&
        !child.classList.contains('text-emerald-600') &&
        !child.classList.contains('text-emerald-400') &&
        !child.classList.contains('text-sky-700') &&
        !child.classList.contains('text-amber-400')
      ) {
        child.style.color = '#000000';
      } else if (child.classList.contains('text-emerald-400') || child.classList.contains('text-emerald-600')) {
        child.style.color = '#047857';
      } else if (child.classList.contains('text-rose-400') || child.classList.contains('text-rose-600')) {
        child.style.color = '#be123c';
      } else if (child.classList.contains('text-amber-400')) {
        child.style.color = '#b45309';
      }

      // 4. Force thin light border
      child.style.borderColor = '#cbd5e1';
    });

    wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '794px'; // Standard A4 width in pixels at 96 DPI
    wrapper.style.zIndex = '-9999';
    wrapper.style.opacity = '0.01';
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
    showPdfToast('error', 'Invoice PDF তৈরি করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    // Fallback to direct print if PDF generation was interrupted
    printElementDirectly(elementId, cleanFilename);
    return false;
  } finally {
    if (wrapper && document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
};
