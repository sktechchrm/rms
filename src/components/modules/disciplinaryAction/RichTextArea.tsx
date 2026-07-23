// ─────────────────────────────────────────────────────────────────────────────
// RichTextArea.tsx — REBUILT (4th round): full toolbar — Bold, Italic,
// Underline, Strikethrough, Subscript, Superscript, Clear formatting,
// Bullet list, Numbered list, Font size decrease/increase — matching the
// requested toolbar layout (B I U S x₂ x² Tx | ≔ 1≔ | A- A+).
//
// STORAGE FORMAT CHANGE: this field's value is now sanitized HTML (see
// richTextHtml.ts), not the old plain-text **bold**/*italic* markers.
// Representing every combination of 8 independent inline styles as a
// hand-rolled text grammar isn't reliably parseable; real HTML is what the
// browser already keeps structurally valid, so it's the sturdier
// foundation. Old records (plain markdown-lite text) still open correctly
// — see legacyMarkdownToHtml() — and are upgraded to HTML the moment
// they're next edited. richTextRender.tsx (print output) handles both
// formats transparently; no other file needs to change.
//
// RELIABILITY CHOICES (why each command is implemented the way it is):
// - Bold/Italic/Underline/Strikethrough/Subscript/Superscript/Clear
//   formatting: native document.execCommand — these are the well-supported
//   "inline toggle" commands and behave consistently across Chrome/
//   Firefox/Edge/Safari.
// - Bullet/Numbered list: NOT execCommand — insertUnorderedList/
//   insertOrderedList are known to silently no-op in several browser
//   versions inside a plain contentEditable div. Implemented instead as
//   direct, predictable DOM manipulation (wrap/unwrap/convert the current
//   line, splitting the list around it) — see toggleList().
// - Font size -/+: no native command produces clean CSS px sizes
//   (execCommand('fontSize') only emits legacy <font size="1-7">). Instead
//   wraps the selection in a <span style="font-size:Npx"> via
//   Range.extractContents()/insertNode(), which — unlike
//   Range.surroundContents() — doesn't throw on selections that partially
//   cross element boundaries.
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
  minWidth: 28, height: 28, padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6,
  cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#1e293b',
  fontFamily: font, lineHeight: 1,
};
const dividerStyle: React.CSSProperties = { width: 1, alignSelf: 'stretch', background: '#e2e8f0', margin: '0 2px' };

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

    // Chrome/Safari/Firefox split Enter-key paragraphs differently by
    // default (<div> vs <p> vs bare <br>) — force <div> for predictability.
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

  // ── Bullet / numbered list — manual DOM toggle (see file header for why) ──
  const placeCaretAtEnd = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const splitListAroundItem = (li: HTMLElement): { before: HTMLElement[]; after: HTMLElement[]; listTag: string } => {
    const listEl = li.parentElement as HTMLElement;
    const items = Array.from(listEl.children) as HTMLElement[];
    const idx = items.indexOf(li);
    return { before: items.slice(0, idx), after: items.slice(idx + 1), listTag: listEl.tagName };
  };

  const toggleList = (mode: 'bullet' | 'number') => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node.parentNode !== el) node = node.parentNode;
    if (!node) return;
    const block = node as HTMLElement;
    const tag = block.tagName?.toLowerCase();
    const wantTag = mode === 'bullet' ? 'ul' : 'ol';

    if (tag === 'div' || tag === 'p') {
      const list = document.createElement(wantTag);
      const li = document.createElement('li');
      li.innerHTML = block.innerHTML || '<br>';
      list.appendChild(li);
      block.replaceWith(list);
      placeCaretAtEnd(li);
    } else if (tag === 'ul' || tag === 'ol') {
      let liNode: Node | null = sel.getRangeAt(0).startContainer;
      while (liNode && (liNode as HTMLElement).tagName !== 'LI') liNode = liNode.parentNode;
      if (!liNode) return;
      const li = liNode as HTMLElement;
      const { before, after, listTag } = splitListAroundItem(li);
      const frag = document.createDocumentFragment();

      if (before.length) {
        const beforeList = document.createElement(listTag);
        before.forEach((it) => beforeList.appendChild(it));
        frag.appendChild(beforeList);
      }

      if (tag === wantTag) {
        const div = document.createElement('div');
        div.innerHTML = li.innerHTML || '<br>';
        frag.appendChild(div);
        if (after.length) {
          const afterList = document.createElement(listTag);
          after.forEach((it) => afterList.appendChild(it));
          frag.appendChild(afterList);
        }
        (li.parentElement as HTMLElement).replaceWith(frag);
        placeCaretAtEnd(div);
      } else {
        const newLi = document.createElement('li');
        newLi.innerHTML = li.innerHTML || '<br>';
        const newList = document.createElement(wantTag);
        newList.appendChild(newLi);
        frag.appendChild(newList);
        if (after.length) {
          const afterList = document.createElement(listTag);
          after.forEach((it) => afterList.appendChild(it));
          frag.appendChild(afterList);
        }
        (li.parentElement as HTMLElement).replaceWith(frag);
        placeCaretAtEnd(newLi);
      }
    }

    emitChange();
  };

  // ── Font size -/+ ──────────────────────────────────────────────────────
  const adjustFontSize = (delta: number) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return; // needs an actual selection
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;

    // Read the effective size at the selection's start to step relative to
    // it (so repeated clicks step up/down from whatever size is already
    // there, not always from the default).
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
    // extractContents()/insertNode() — unlike surroundContents() — doesn't
    // throw when the selection partially crosses element boundaries.
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

        <button type="button" title="Bullet list" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => toggleList('bullet'))}>≔</button>
        <button type="button" title="Numbered list" style={toolbarBtnStyle} onMouseDown={mouseDownHandler(() => toggleList('number'))}>1≔</button>

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
        <style>{`
          .rta-editable ul, .rta-editable ol { margin: 0 0 8px; padding-left: 22px; }
          .rta-editable li { margin-bottom: 3px; }
          .rta-editable div { min-height: 1.2em; }
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