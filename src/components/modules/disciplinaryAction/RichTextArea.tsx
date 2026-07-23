// ─────────────────────────────────────────────────────────────────────────────
// RichTextArea.tsx — REBUILT (3rd round): now a true WYSIWYG editor using a
// contentEditable <div> instead of a plain <textarea>. A <textarea> can only
// ever show raw "**text**" characters — it cannot render actual bold/italic
// — so clicking Bold/Italic never visibly changed the input box itself (a
// separate preview panel was added first, but the explicit ask was to see
// the change IN the input box directly, not in a separate panel below it).
//
// Public interface is UNCHANGED (value/onChange/rows/placeholder/style), so
// ShowCauseForm.tsx, EvaluationForm.tsx, and FinalDecisionForm.tsx don't need
// any changes. Internally, the editor still stores/emits the exact same
// markdown-lite string format (**bold**, *italic*, "• " bullets, "1. "
// numbers) via onChange — richTextRender.tsx (used by the print output) and
// any already-saved records are fully compatible, unchanged.
//
// How it works: markdownToHtml() converts the incoming string to HTML once
// on mount/external update, so the contentEditable shows real <strong>/<em>/
// <ul>/<ol>. Toolbar buttons use document.execCommand (bold/italic/
// insertUnorderedList/insertOrderedList) for genuine native editing
// behavior. On every input, htmlToMarkdown() walks the DOM back into the
// same markdown-lite string and calls onChange — so what's SAVED never
// changes, only what's SEEN while editing.
// Path: src/components/modules/disciplinaryAction/RichTextArea.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback } from 'react';

const font = "'Noto Sans Bengali', Arial, sans-serif";

interface Props {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  style?: React.CSSProperties;
}

const toolbarBtnStyle: React.CSSProperties = {
  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6,
  cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1e293b',
  fontFamily: font,
};

// ── markdown-lite → HTML (for initial/external render into the editable div) ──

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMdToHtml(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return html;
}

function markdownToHtml(value: string): string {
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
      out.push('<ul>' + items.map(it => `<li>${inlineMdToHtml(it)}</li>`).join('') + '</ul>');
      continue;
    }
    if (numberMatch) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+(.*)$/)) {
        items.push(lines[i].match(/^\s*\d+\.\s+(.*)$/)![1]);
        i++;
      }
      out.push('<ol>' + items.map(it => `<li>${inlineMdToHtml(it)}</li>`).join('') + '</ol>');
      continue;
    }
    out.push(line.trim() === '' ? '<div><br></div>' : `<div>${inlineMdToHtml(line)}</div>`);
    i++;
  }
  return out.join('');
}

// ── HTML → markdown-lite (walks the edited DOM back into the storage string) ──

function inlineToMd(node: Node): string {
  let out = '';
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent || '';
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'br') return;
    const inner = inlineToMd(el);
    const isBold = tag === 'b' || tag === 'strong';
    const isItalic = tag === 'i' || tag === 'em';
    if (isBold) out += `**${inner}**`;
    else if (isItalic) out += `*${inner}*`;
    else out += inner;
  });
  return out;
}

function htmlToMarkdown(root: HTMLElement): string {
  const lines: string[] = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      const t = node.textContent || '';
      if (t.trim()) lines.push(t);
      return;
    }
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'ul') {
      el.querySelectorAll(':scope > li').forEach((li) => lines.push(`• ${inlineToMd(li)}`));
    } else if (tag === 'ol') {
      let n = 1;
      el.querySelectorAll(':scope > li').forEach((li) => { lines.push(`${n}. ${inlineToMd(li)}`); n++; });
    } else if (tag === 'div' || tag === 'p') {
      lines.push(inlineToMd(el));
    } else {
      const t = inlineToMd(el);
      if (t) lines.push(t);
    }
  });
  return lines.join('\n');
}

export default function RichTextArea({ value, onChange, rows = 5, placeholder, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string>('');
  const mounted = useRef(false);

  // Initial paint + any EXTERNAL value change (e.g. a saved record loaded) —
  // but never re-paint from a change this editor itself just emitted, or
  // the user's cursor would jump on every keystroke.
  useEffect(() => {
    if (!ref.current) return;
    if (mounted.current && value === lastValue.current) return;
    ref.current.innerHTML = markdownToHtml(value);
    lastValue.current = value;
    mounted.current = true;
    // Chrome/Safari/Firefox split Enter-key paragraphs differently by
    // default (<div> vs <p> vs bare <br>) — force <div> so htmlToMarkdown's
    // line-splitting stays predictable across browsers.
    try { document.execCommand('defaultParagraphSeparator', false, 'div'); } catch { /* no-op */ }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!ref.current) return;
    const md = htmlToMarkdown(ref.current);
    lastValue.current = md;
    onChange(md);
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

  const isEmpty = !value || value.trim() === '';

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <button
          type="button"
          title="Bold"
          style={toolbarBtnStyle}
          onMouseDown={mouseDownHandler(() => exec('bold'))}
        >
          B
        </button>
        <button
          type="button"
          title="Italic"
          style={{ ...toolbarBtnStyle, fontStyle: 'italic' }}
          onMouseDown={mouseDownHandler(() => exec('italic'))}
        >
          I
        </button>
        <button
          type="button"
          title="Bullet list"
          style={toolbarBtnStyle}
          onMouseDown={mouseDownHandler(() => exec('insertUnorderedList'))}
        >
          •≡
        </button>
        <button
          type="button"
          title="Numbered list"
          style={toolbarBtnStyle}
          onMouseDown={mouseDownHandler(() => exec('insertOrderedList'))}
        >
          1≡
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        {isEmpty && placeholder && (
          <div style={placeholderStyle}>{placeholder}</div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          style={{
            minHeight: rows * 22, width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1',
            borderRadius: 8, fontSize: 13, fontFamily: font, background: '#fff',
            color: '#1e293b', outline: 'none', boxSizing: 'border-box',
            lineHeight: 1.7, overflowY: 'auto',
            ...style,
          }}
        />
      </div>
    </div>
  );
}

const placeholderStyle: React.CSSProperties = {
  position: 'absolute', top: 9, left: 12, right: 12,
  color: '#94a3b8', fontSize: 13, fontFamily: font, lineHeight: 1.7,
  pointerEvents: 'none',
};