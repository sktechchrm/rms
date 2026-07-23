// ─────────────────────────────────────────────────────────────────────────────
// richTextHtml.ts — NEW: shared helpers for the upgraded rich-text fields
// (data.complaint, data.investigationReportSummary, data.recommendation,
// data.finalDecision).
//
// WHY THIS EXISTS: the toolbar grew from Bold/Italic/Bullet/Number to also
// include Underline, Strikethrough, Subscript, Superscript, Clear
// formatting, and Font size (A-/A+). Representing every combination of
// these as a hand-rolled plain-text marker grammar (the old **/*/•/N.
// scheme) gets combinatorially fragile fast — nested bold+underline+
// superscript+resized text has no clean unambiguous plain-text encoding.
// Storing real (sanitized) HTML is what the browser already guarantees is
// structurally valid, so it's the more reliable foundation for "the
// toolbar should just work."
//
// BACKWARD COMPATIBILITY: fields saved before this change contain plain
// markdown-lite text (**bold**, *italic*, "• "/"1. " lines), not HTML.
// looksLikeHtml() distinguishes the two so old records keep rendering
// correctly (via the pre-existing renderInline/renderRichText parser in
// richTextRender.tsx) while new edits are saved as HTML going forward.
// legacyMarkdownToHtml() is the one-time upgrade path RichTextArea uses to
// display an old record's markdown-lite text correctly the first time it's
// opened in the new editor.
// Path: src/components/modules/disciplinaryAction/richTextHtml.ts
// ─────────────────────────────────────────────────────────────────────────────

/** True if `text` already contains real markup (new-format field), false if
 *  it's plain text — either empty, or old markdown-lite content. */
export function looksLikeHtml(text: string): boolean {
  if (!text) return false;
  return /<\/?(div|p|ul|ol|li|b|strong|i|em|u|s|strike|sub|sup|span|br)\b[^>]*>/i.test(text);
}

// ── Allowlist sanitizer ──────────────────────────────────────────────────
// Strips any tag not on this list (unwrapping it — its own children are
// kept), and strips all attributes except a `style` on <span> that's
// filtered down to font-size only. No scripts, no event handlers, no
// arbitrary attributes can ever reach saved data or the print output.
const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SUB', 'SUP',
  'SPAN', 'DIV', 'P', 'BR', 'UL', 'OL', 'LI',
]);

function sanitizeElement(el: HTMLElement) {
  const children = Array.from(el.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      if (!ALLOWED_TAGS.has(childEl.tagName)) {
        // Unwrap disallowed tags (e.g. accidental pasted <script>/<img>/
        // <a>) — keep their text/child content, drop the wrapper itself.
        while (childEl.firstChild) el.insertBefore(childEl.firstChild, childEl);
        el.removeChild(childEl);
        continue;
      }
      // Strip every attribute except a font-size-only style on <span>.
      Array.from(childEl.attributes).forEach((attr) => {
        if (childEl.tagName === 'SPAN' && attr.name === 'style') {
          const size = childEl.style.fontSize;
          childEl.removeAttribute('style');
          if (size) childEl.style.fontSize = size;
        } else {
          childEl.removeAttribute(attr.name);
        }
      });
      sanitizeElement(childEl);
    } else if (child.nodeType !== Node.TEXT_NODE) {
      // Comments, processing instructions, etc.
      el.removeChild(child);
    }
  }
}

/** Runs `html` through the allowlist sanitizer and returns clean HTML. */
export function sanitizeHtml(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;
  sanitizeElement(container);
  return container.innerHTML;
}

// ── Legacy markdown-lite → HTML (one-time upgrade path for old records) ──

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function legacyInlineToHtml(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return html;
}


export function legacyMarkdownToHtml(value: string): string {
  if (!value) return '<div><br></div>';
  const lines = value.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*•\s+(.*)$/);
    const numberMatch = line.match(/^\s*\d+\.\s+(.*)$/);

    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*•\s+(.*)$/)) {
        items.push(lines[i].match(/^\s*•\s+(.*)$/)![1]);
        i++;
      }
      out.push('<ul>' + items.map((it) => `<li>${legacyInlineToHtml(it)}</li>`).join('') + '</ul>');
      continue;
    }
    if (numberMatch) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+(.*)$/)) {
        items.push(lines[i].match(/^\s*\d+\.\s+(.*)$/)![1]);
        i++;
      }
      out.push('<ol>' + items.map((it) => `<li>${legacyInlineToHtml(it)}</li>`).join('') + '</ol>');
      continue;
    }
    out.push(line.trim() === '' ? '<div><br></div>' : `<div>${legacyInlineToHtml(line)}</div>`);
    i++;
  }
  return out.join('');
}