// src/utils/pdfExport.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central smart PDF export — wraps jsPDF + html2canvas.
//
// Before capture, the element is temporarily forced to the A4 page width for the
// chosen orientation (portrait 794px, landscape 1123px = 210mm / 297mm at 96dpi) so
// the captured image fills the page exactly like the print preview. Original
// styles are restored after.
//
// OPTIONAL extras (all off by default, so existing callers are unchanged):
//   resolveImage   — swaps each <img> src for a data URL (e.g. fetched through a
//                    backend) so cross-site pictures are drawn instead of blank
//   rowSafeBreaks  — cuts pages BETWEEN table rows instead of through one
//   printStyle     — thin 1px black collapsed table borders, like the print view
//   addLinks       — puts clickable PDF link areas over every element marked
//                    data-pdf-link="URL" (the page itself is a picture, so links
//                    are added on top of it)
// ─────────────────────────────────────────────────────────────────────────────
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  /** The DOM element to capture */
  element:      HTMLElement;
  /** File name (without .pdf) */
  filename?:    string;
  /** A4 portrait (default) or landscape */
  orientation?: 'portrait' | 'landscape';
  /** 1–3; higher = better quality, slower. Default 2 */
  scale?:       number;
  /** Light diagonal watermark text */
  watermark?:   string;
  /** Called with 0–100 progress */
  onProgress?:  (pct: number) => void;
  /** Returns a data URL for an <img> src (or ''/null to keep the original). */
  resolveImage?: (src: string) => Promise<string | null | undefined>;
  /** Cut pages between table rows, never through a row. */
  rowSafeBreaks?: boolean;
  /** Thin black collapsed table borders (print-view look). */
  printStyle?:   boolean;
  /** Add clickable link areas for elements marked data-pdf-link="URL". */
  addLinks?:     boolean;
}

// A4 at 96dpi: 210mm = 794px, 297mm = 1123px
const A4_PORTRAIT_PX  = 794;
const A4_LANDSCAPE_PX = 1123;
const A4_WIDTH_MM     = 210;
const A4_HEIGHT_MM    = 297;
const MARGIN_MM       = 10;

/** Bengali font CDN URLs */
const FONT_400 = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-bengali@5.0.18/files/noto-sans-bengali-bengali-400-normal.woff2';
const FONT_700 = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-bengali@5.0.18/files/noto-sans-bengali-bengali-700-normal.woff2';

async function toDataURI(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { cache: 'force-cache' });
    if (!r.ok) return null;
    const buf   = await r.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:font/woff2;base64,${btoa(bin)}`;
  } catch { return null; }
}

function buildFontStyle(u400: string | null, u700: string | null): string {
  let css = '';
  if (u400) css += `@font-face{font-family:BengaliFontEmbed;font-weight:400;src:url('${u400}') format('woff2');}`;
  if (u700) css += `@font-face{font-family:BengaliFontEmbed;font-weight:700;src:url('${u700}') format('woff2');}`;
  return css;
}

// AUDIT NOTE: like jsPDF's other native-text calls, this draws with the
// built-in 'helvetica' font, which has no Bengali glyphs. Currently no
// caller anywhere in the codebase passes a `watermark` option, so this is
// dormant, not an active bug.
function addWatermark(doc: jsPDF, text: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(42);
    doc.setFont('helvetica', 'bold');
    // @ts-ignore
    doc.text(text, doc.internal.pageSize.width / 2, doc.internal.pageSize.height / 2, {
      align: 'center', angle: 45,
    });
  }
}

/**
 * Force the element to the page width before capture so the PDF always fills the
 * full page — identical to the print preview. Returns a cleanup function.
 */
function forceWidth(el: HTMLElement, widthPx: number): () => void {
  const prev = {
    width:     el.style.width,
    maxWidth:  el.style.maxWidth,
    minWidth:  el.style.minWidth,
    margin:    el.style.margin,
    position:  el.style.position,
    left:      el.style.left,
    top:       el.style.top,
  };

  // Position off-screen so layout doesn't shift visibly, then force width
  el.style.position = 'fixed';
  el.style.left     = '-9999px';
  el.style.top      = '0px';
  el.style.width    = `${widthPx}px`;
  el.style.maxWidth = `${widthPx}px`;
  el.style.minWidth = `${widthPx}px`;
  el.style.margin   = '0';

  return () => {
    el.style.width    = prev.width;
    el.style.maxWidth = prev.maxWidth;
    el.style.minWidth = prev.minWidth;
    el.style.margin   = prev.margin;
    el.style.position = prev.position;
    el.style.left     = prev.left;
    el.style.top      = prev.top;
  };
}

/** Swaps <img> sources for resolved data URLs; returns a function that restores them. */
async function swapImages(el: HTMLElement, resolve: (src: string) => Promise<string | null | undefined>) {
  const imgs      = Array.from(el.querySelectorAll('img'));
  const originals = imgs.map(i => i.src);
  const cache     = new Map<string, Promise<string | null | undefined>>();

  await Promise.all(imgs.map(async img => {
    const src = img.src;
    if (!/^https?:/i.test(src)) return;
    if (!cache.has(src)) cache.set(src, resolve(src).catch(() => null));
    const data = await cache.get(src);
    if (data) { img.removeAttribute('crossorigin'); img.src = data; }
  }));
  await Promise.all(imgs.map(i => (i.decode ? i.decode().catch(() => undefined) : Promise.resolve())));

  return () => { imgs.forEach((img, i) => { img.src = originals[i]; }); };
}

export async function exportToPDF(opts: PDFExportOptions): Promise<void> {
  const {
    element,
    filename     = 'document',
    orientation  = 'portrait',
    scale        = 2,
    watermark,
    onProgress,
    resolveImage,
    rowSafeBreaks = false,
    printStyle    = false,
    addLinks      = false,
  } = opts;

  const widthPx = orientation === 'landscape' ? A4_LANDSCAPE_PX : A4_PORTRAIT_PX;

  onProgress?.(5);

  // Inject Bengali font so html2canvas captures it correctly
  const [u400, u700] = await Promise.all([toDataURI(FONT_400), toDataURI(FONT_700)]);
  const fontStyle = buildFontStyle(u400, u700);
  let styleEl: HTMLStyleElement | null = null;
  if (fontStyle) {
    styleEl = document.createElement('style');
    styleEl.textContent = fontStyle;
    document.head.appendChild(styleEl);
    await new Promise(r => setTimeout(r, 120));
  }

  onProgress?.(12);

  // Pictures first (so they are decoded before capture)
  const restoreImages = resolveImage ? await swapImages(element, resolveImage) : () => {};

  onProgress?.(18);

  // Force element to the page width before capture
  const restoreStyles = forceWidth(element, widthPx);

  // Let browser reflow at the new width
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Row bottoms (relative to the element's top, in CSS px) for row-safe page breaks
  const elRect = element.getBoundingClientRect();
  const rowBottomsCss = rowSafeBreaks
    ? Array.from(element.querySelectorAll('tr'))
        .map(r => r.getBoundingClientRect().bottom - elRect.top)
        .sort((a, b) => a - b)
    : [];

  // Link areas (relative to the element's top-left, in CSS px), measured at the forced width
  const linkBoxes = addLinks
    ? Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-link]'))
        .map(n => {
          const r = n.getBoundingClientRect();
          return { url: n.dataset.pdfLink || '', left: r.left - elRect.left, top: r.top - elRect.top, w: r.width, h: r.height };
        })
        .filter(b => b.url && b.w > 0 && b.h > 0)
    : [];

  onProgress?.(22);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale,
      useCORS:       true,
      allowTaint:    true,
      backgroundColor: '#ffffff',
      logging:       false,
      // Use the forced page width — not the element's original scrollWidth
      windowWidth:   widthPx,
      windowHeight:  element.scrollHeight,
      width:         widthPx,
      onclone: printStyle
        ? doc => {
            doc.querySelectorAll('table').forEach(t => { (t as HTMLElement).style.borderCollapse = 'collapse'; });
            doc.querySelectorAll('th, td').forEach(c => { (c as HTMLElement).style.border = '1px solid #000'; });
          }
        : undefined,
    });
  } finally {
    // Restore the live page immediately after capture
    restoreStyles();
    restoreImages();
    if (styleEl) document.head.removeChild(styleEl);
  }

  onProgress?.(75);

  const pageW   = orientation === 'portrait' ? A4_WIDTH_MM  : A4_HEIGHT_MM;
  const pageH   = orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const usableW = pageW - MARGIN_MM * 2;
  const usableH = pageH - MARGIN_MM * 2;

  // px-per-mm based on the FORCED width (always widthPx → usableW mm)
  const pxPerMm   = canvas.width / usableW;
  const perPagePx = Math.floor(usableH * pxPerMm);
  const cssToPx   = canvas.width / (elRect.width || widthPx);
  const rowBottoms = rowBottomsCss.map(b => Math.round(b * cssToPx));

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  let y = 0;
  let pageIndex = 0;

  while (y < canvas.height) {
    if (pageIndex > 0) doc.addPage();

    const limit = y + perPagePx;
    let end = canvas.height;
    if (limit < canvas.height) {
      if (rowSafeBreaks) {
        const fits = rowBottoms.filter(b => b > y + 20 * scale && b <= limit);
        end = fits.length ? fits[fits.length - 1] : limit;
      } else {
        end = limit;
      }
    }

    const srcH   = end - y;
    const stripH = srcH / pxPerMm;

    const strip    = document.createElement('canvas');
    strip.width    = canvas.width;
    strip.height   = srcH;
    const ctx      = strip.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, strip.width, strip.height);
    ctx.drawImage(canvas, 0, y, canvas.width, srcH, 0, 0, canvas.width, srcH);

    doc.addImage(strip.toDataURL('image/jpeg', 0.95), 'JPEG', MARGIN_MM, MARGIN_MM, usableW, stripH);

    // Clickable areas for this page (cut at the page edges)
    for (const b of linkBoxes) {
      const top = b.top * cssToPx;
      const t   = Math.max(top, y);
      const btm = Math.min(top + b.h * cssToPx, end);
      if (btm <= t) continue;                       // not on this page
      doc.link(
        MARGIN_MM + (b.left * cssToPx) / pxPerMm,
        MARGIN_MM + (t - y) / pxPerMm,
        (b.w * cssToPx) / pxPerMm,
        (btm - t) / pxPerMm,
        { url: b.url },
      );
    }

    y = end;
    pageIndex++;
  }

  if (watermark) addWatermark(doc, watermark);

  onProgress?.(95);
  doc.save(`${filename}.pdf`);
  onProgress?.(100);
}

// ─── Convenience types ────────────────────────────────────────────────────────
export interface UsePDFExportReturn {
  exportPDF:   () => Promise<void>;
  isExporting: boolean;
  progress:    number;
}