// ─────────────────────────────────────────────────────────────────────────────
// RichTextArea.tsx — REBUILT (5th round): PERMANENT FIX for bullets/numbers
// not rendering at all. Root cause: the <ul>/<ol> markers relied on the
// browser's native default list-style, but most global CSS resets used in
// real apps (Tailwind's preflight, etc.) set `list-style: none` on every
// ul/ol site-wide — silently killing the bullet/number marker regardless of
// how correct the underlying <ul>/<ol><li> structure was. This never showed
// up in isolated testing because nothing here was fighting a global reset.
//
// FIX: markers are no longer left to native list-style at all — they're
// rendered via CSS ::before + counter(), which no `list-style: none` reset
// can touch (it targets the native marker box, not a ::before pseudo-
// element the component defines itself). This is a same-shape fix applied
// in DisciplinaryNoticeLetter.tsx's print CSS too, so print output and the
// live editor render identically and neither depends on any ambient
// stylesheet.
//
// NEW: numbered lists now come in two explicit variants — বাংলা (০-৯
// digits) and English (0-9 digits) — selected via a `data-num="bn"|"en"`
// attribute on the <ol>, driving which CSS counter-style renders the
// marker. Toggling a whole list's number script (bn↔en) just flips this
// attribute; converting a line's list TYPE (bullet↔numbered) still uses
// the split logic from the previous round.
// Path: src/components/modules/disciplinaryAction/RichTextArea.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback } from 'react';
import { looksLikeHtml, sanitizeHtml, legacyMarkdownToHtml } from './richTextHtml';

const font = "'Noto Sans Bengali', Arial, sans-serif";

interface Props {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  style?: React.CSSProperties;
}

const MIN_FONT_SIZE = 9;
const MAX_FONT_SIZE = 28;
const DEFAULT_FONT_SIZE = 13;
const FONT_STEP = 2;

const toolbarBtnStyle: React.CSSProperties = {
  minWidth: 28, height: 28, padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6,
  cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#1e293b',
  fontFamily: font, lineHeight: 1,
};
const dividerStyle: React.CSSProperties = { width: 1, alignSelf: 'stretch', background: '#e2e8f0', margin: '0 2px' };

type ListKind = 'bullet' | 'ol-bn' | 'ol-en';

export default function RichTextArea({ value, onChange, rows = 5, placeholder, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string>('');
  const mounted = useRef(false);

  // Initial paint + any EXTERNAL value change (e.g. a saved record loaded)
  // — never re-paint from a change this editor itself just emitted, or the
  // caret would jump on every keystroke.
  useEffect(() => {
    if (!ref.current) return;
    if (mounted.current && value === lastValue.current) return;

    const html = !value
      ? '<div><br></div>'
      : looksLikeHtml(value)
        ? sanitizeHtml(value)
        : legacyMarkdownToHtml(value); // old plain-text record — upgrade on open

    ref.current.innerHTML = html;
    lastValue.current = value;
    mounted.current = true;

    try { document.execCommand('defaultParagraphSeparator', false, 'div'); } catch { /* no-op */ }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!ref.current) return;
    const clean = sanitizeHtml(ref.current.innerHTML);
    lastValue.current = clean;
    onChange(clean);
  }, [onChange]);

  const exec = (cmd: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false);
    emitChange();
  };

  const mouseDownHandler = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  // ── Bullet / numbered list — manual DOM toggle (execCommand's list
  //    commands are unreliable inside a plain contentEditable div). ──
  const placeCaretAtEnd = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const splitListAroundItem = (li: HTMLElement): { before: HTMLElement[]; after: HTMLElement[]; listTag: string; listNum: string | null } => {
    const listEl = li.parentElement as HTMLElement;
    const items = Array.from(listEl.children) as HTMLElement[];
    const idx = items.indexOf(li);
    return {
      before: items.slice(0, idx),
      after: items.slice(idx + 1),
      listTag: listEl.tagName,
      listNum: listEl.getAttribute('data-num'),
    };
  };

  const rebuildList = (tag: string, items: HTMLElement[], num?: string | null): HTMLElement => {
    const list = document.createElement(tag);
    if (tag === 'OL' && num) list.setAttribute('data-num', num);
    items.forEach((it) => list.appendChild(it));
    return list;
  };

  const toggleList = (kind: ListKind) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const wantTag = kind === 'bullet' ? 'ul' : 'ol';
    const wantNum = kind === 'ol-bn' ? 'bn' : kind === 'ol-en' ? 'en' : null;

    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node.parentNode !== el) node = node.parentNode;
    if (!node) return;
    const block = node as HTMLElement;
    const tag = block.tagName?.toLowerCase();

    if (tag === 'div' || tag === 'p') {
      // Plain line → wrap as a new single-item list.
      const li = document.createElement('li');
      li.innerHTML = block.innerHTML || '<br>';
      const list = rebuildList(wantTag.toUpperCase(), [li], wantNum);
      block.replaceWith(list);
      placeCaretAtEnd(li);
      emitChange();
      return;
    }

    if (tag !== 'ul' && tag !== 'ol') return;

    let liNode: Node | null = sel.getRangeAt(0).startContainer;
    while (liNode && (liNode as HTMLElement).tagName !== 'LI') liNode = liNode.parentNode;
    if (!liNode) return;
    const li = liNode as HTMLElement;
    const currentTag = tag; // 'ul' | 'ol'
    const currentNum = currentTag === 'ol' ? (li.parentElement as HTMLElement).getAttribute('data-num') : null;

    // Same numbered list, just switching script (bn↔en) — restyle the
    // WHOLE surrounding list in place, no split needed.
    if (currentTag === 'ol' && wantTag === 'ol' && currentNum !== wantNum) {
      (li.parentElement as HTMLElement).setAttribute('data-num', wantNum || 'en');
      emitChange();
      return;
    }

    const { before, after, listTag, listNum } = splitListAroundItem(li);
    const frag = document.createDocumentFragment();

    if (before.length) frag.appendChild(rebuildList(listTag, before, listNum));

    const sameKindClicked = currentTag === wantTag && (currentTag !== 'ol' || currentNum === wantNum);

    if (sameKindClicked) {
      // Toggle OFF → plain line.
      const div = document.createElement('div');
      div.innerHTML = li.innerHTML || '<br>';
      frag.appendChild(div);
      if (after.length) frag.appendChild(rebuildList(listTag, after, listNum));
      (li.parentElement as HTMLElement).replaceWith(frag);
      placeCaretAtEnd(div);
    } else {
      // Converting this line to a different list type (bullet↔numbered).
      const newLi = document.createElement('li');
      newLi.innerHTML = li.innerHTML || '<br>';
      frag.appendChild(rebuildList(wantTag.toUpperCase(), [newLi], wantNum));
      if (after.length) frag.appendChild(rebuildList(listTag, after, listNum));
      (li.parentElement as HTMLElement).replaceWith(frag);
      placeCaretAtEnd(newLi);
    }

    emitChange();
  };

  // ── Font size -/+ ──────────────────────────────────────────────────────
  const adjustFontSize = (delta: number) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;

    const startNode = range.startContainer;
    const startEl = startNode.nodeType === Node.ELEMENT_NODE ? (startNode as HTMLElement) : startNode.parentElement;
    let currentSize = DEFAULT_FONT_SIZE;
    const sizedAncestor = startEl?.closest('span[style*="font-size"]') as HTMLElement | null;
    if (sizedAncestor) {
      const parsed = parseInt(sizedAncestor.style.fontSize, 10);
      if (!Number.isNaN(parsed)) currentSize = parsed;
    }
    const newSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, currentSize + delta));

    const span = document.createElement('span');
    span.style.fontSize = `${newSize}px`;
    const content = range.extractContents();
    span.appendChild(content);
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);

    emitChange();
  };

  const isEmpty = !value || value.trim() === '' || value === '<div><br></div>';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        <button type="button" title="Bold" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => exec('bold'))}>B</button>
        <button type="button" title="Italic" style={{ ...toolbarBtnStyle, fontStyle: 'italic' }} onMouseDown={mouseDownHandler(() => exec('italic'))}>I</button>
        <button type="button" title="Underline" style={{ ...toolbarBtnStyle, textDecoration: 'underline' }} onMouseDown={mouseDownHandler(() => exec('underline'))}>U</button>
        <button type="button" title="Strikethrough" style={{ ...toolbarBtnStyle, textDecoration: 'line-through' }} onMouseDown={mouseDownHandler(() => exec('strikeThrough'))}>S</button>
        <button type="button" title="Subscript" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => exec('subscript'))}>x<sub>2</sub></button>
        <button type="button" title="Superscript" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => exec('superscript'))}>x<sup>2</sup></button>
        <button type="button" title="Clear formatting" style={{ ...toolbarBtnStyle, textDecoration: 'line-through' }} onMouseDown={mouseDownHandler(() => exec('removeFormat'))}>T<sub style={{ fontSize: 9 }}>x</sub></button>

        <div style={dividerStyle} />

        <button type="button" title="Bullet list" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => toggleList('bullet'))}>• ≡</button>
        <button type="button" title="বাংলা সংখ্যা তালিকা" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => toggleList('ol-bn'))}>১ ≡</button>
        <button type="button" title="English numbered list" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => toggleList('ol-en'))}>1 ≡</button>

        <div style={dividerStyle} />

        <button type="button" title="Decrease font size" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => adjustFontSize(-FONT_STEP))}>A<span style={{ fontSize: 10 }}>-</span></button>
        <button type="button" title="Increase font size" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => adjustFontSize(FONT_STEP))}>A<span style={{ fontSize: 15 }}>+</span></button>
      </div>

      <div style={{ position: 'relative' }}>
        {isEmpty && placeholder && <div style={placeholderStyle}>{placeholder}</div>}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          className="rta-editable"
          style={{
            minHeight: rows * 22, width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1',
            borderRadius: 8, fontSize: 13, fontFamily: font, background: '#fff',
            color: '#1e293b', outline: 'none', boxSizing: 'border-box',
            lineHeight: 1.7, overflowY: 'auto',
            ...style,
          }}
        />
        {/* PERMANENT bullet/number fix — markers are drawn with ::before +
            counter(), completely independent of native list-style, so no
            global CSS reset (list-style: none on ul/ol, very common in
            Tailwind/other resets) can ever suppress them again. The exact
            same rules are duplicated in DisciplinaryNoticeLetter.tsx's
            print stylesheet so the editor and the printed notice always
            match. */}
        <style>{`
          @counter-style rta-bn-num {
            system: numeric;
            symbols: "০" "১" "২" "৩" "৪" "৫" "৬" "৭" "৮" "৯";
            suffix: ". ";
          }
          .rta-editable div { min-height: 1.2em; }

          .rta-editable ul { list-style: none; margin: 0 0 8px; padding-left: 0; }
          .rta-editable ul > li { position: relative; padding-left: 20px; margin-bottom: 3px; }
          .rta-editable ul > li::before { content: "•"; position: absolute; left: 4px; }

          .rta-editable ol { list-style: none; counter-reset: rta-num; margin: 0 0 8px; padding-left: 0; }
          .rta-editable ol > li { counter-increment: rta-num; position: relative; padding-left: 28px; margin-bottom: 3px; }
          .rta-editable ol > li::before { content: counter(rta-num) ". "; position: absolute; left: 0; }
          .rta-editable ol[data-num="bn"] > li::before { content: counter(rta-num, rta-bn-num); }
        `}</style>
      </div>
    </div>
  );
}

const placeholderStyle: React.CSSProperties = {
  position: 'absolute', top: 9, left: 12, right: 12,
  color: '#94a3b8', fontSize: 13, fontFamily: font, lineHeight: 1.7,
  pointerEvents: 'none',
};