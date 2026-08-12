// @ts-ignore
import html2pdf from 'html2pdf.js';

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
 * Downloads a printable HTML element as a PDF file directly.
 */
export const downloadElementAsPDF = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found, falling back to print.`);
    window.print();
    return;
  }

  const opt = {
    margin: [8, 8, 8, 8] as [number, number, number, number],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc: Document) => {
        sanitizeDocColors(clonedDoc);
      },
    },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  };

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
    clone.style.fontFamily = "'Hind Siliguri', sans-serif";
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
        !child.classList.contains('text-emerald-700') &&
        !child.classList.contains('text-emerald-600') &&
        !child.classList.contains('text-sky-700')
      ) {
        child.style.color = '#000000';
      }

      // 4. Force thin light border
      child.style.borderColor = '#cbd5e1';
    });

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '-9999px';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '794px'; // Standard A4 width in pixels at 96 DPI
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    html2pdf()
      .set(opt)
      .from(clone)
      .save()
      .then(() => {
        if (document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
      })
      .catch((err: any) => {
        console.error('PDF export error:', err);
        if (document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
        window.print();
      });
  } catch (err) {
    console.error('PDF generation error:', err);
    window.print();
  }
};
