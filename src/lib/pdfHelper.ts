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
 * Prints a specific HTML element cleanly in a dedicated printable iframe or popup window.
 * This completely avoids iframe restriction bugs and parent app layout clipping on deployed sites.
 */
export const printElementDirectly = (elementId: string, title?: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for printing.`);
    window.print();
    return;
  }

  try {
    // Clone element
    const clone = element.cloneNode(true) as HTMLElement;
    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    // Create an invisible iframe for standalone isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title || 'Memo Print'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Hind Siliguri', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              color: #000000;
              background: #ffffff;
              padding: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
            }
            th {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
            }
            .border-slate-800, .border-slate-700, .border-slate-400, .border-slate-300 {
              border-color: #cbd5e1 !important;
            }
            .bg-slate-950, .bg-slate-900, .bg-slate-800, .bg-slate-50 {
              background-color: #f8fafc !important;
              color: #0f172a !important;
            }
            .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400 {
              color: #0f172a !important;
            }
            .text-emerald-400, .text-emerald-500, .text-emerald-600 {
              color: #047857 !important;
            }
            .text-rose-400, .text-rose-500, .text-rose-600 {
              color: #be123c !important;
            }
            .text-amber-400, .text-amber-500 {
              color: #b45309 !important;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${clone.innerHTML}
          </div>
        </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    }, 400);
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
