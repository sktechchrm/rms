// ─────────────────────────────────────────────────────────────────────────────
// richTextRender.tsx — REBUILT (2nd round): renderRichText() now branches on
// format. RichTextArea.tsx's toolbar grew to include Underline,
// Strikethrough, Subscript, Superscript, Clear formatting, and Font size —
// styles that don't fit the old plain-text **bold**/*italic* marker scheme.
// New field values are sanitized HTML (see richTextHtml.ts) and are
// rendered directly via a sanitized dangerouslySetInnerHTML. Fields saved
// BEFORE this change are still plain markdown-lite text — those keep going
// through the exact same renderInline()/line-grouping parser as before,
// completely unchanged, so old printed notices are pixel-identical to
// before this update.
// Path: src/components/modules/disciplinaryAction/richTextRender.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { looksLikeHtml, sanitizeHtml } from './richTextHtml';

// Inline **bold** / *italic* parsing within a single line of text.
// (Legacy plain-markdown parser — unchanged from before. Only reached for
// records saved before the HTML-based editor existed.)
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      // Bold + italic combined.
      nodes.push(<strong key={`${keyPrefix}-bi${i}`}><em>{match[1]}</em></strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i${i}`}>{match[3]}</em>);
    }
    lastIndex = pattern.lastIndex;
    i++;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/**
 * Legacy path: renders a multi-line markdown-lite string as JSX — plain
 * lines become paragraphs, consecutive "• " lines become one <ul>,
 * consecutive "N. " lines become one <ol>. Only used for records saved
 * before the HTML-based RichTextArea existed.
 */
function renderLegacyMarkdown(text: string, keyPrefix: string): React.ReactNode {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

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
      blocks.push(
        <ul className="nl-rt-list" key={`${keyPrefix}-ul-${blockKey++}`}>
          {items.map((it, idx) => <li key={idx}>{renderInline(it, `${keyPrefix}-ul-${blockKey}-${idx}`)}</li>)}
        </ul>
      );
      continue;
    }

    if (numberMatch) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+(.*)$/)) {
        items.push(lines[i].match(/^\s*\d+\.\s+(.*)$/)![1]);
        i++;
      }
      blocks.push(
        <ol className="nl-rt-list" key={`${keyPrefix}-ol-${blockKey++}`}>
          {items.map((it, idx) => <li key={idx}>{renderInline(it, `${keyPrefix}-ol-${blockKey}-${idx}`)}</li>)}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      blocks.push(<div key={`${keyPrefix}-sp-${blockKey++}`} className="nl-rt-spacer" />);
    } else {
      blocks.push(<p key={`${keyPrefix}-p-${blockKey++}`} className="nl-rt-p">{renderInline(line, `${keyPrefix}-p-${blockKey}`)}</p>);
    }
    i++;
  }

  return <>{blocks}</>;
}

/**
 * Renders a rich-text field for print. Detects format automatically:
 * - New records: sanitized HTML from the upgraded RichTextArea toolbar
 *   (bold/italic/underline/strikethrough/sub/superscript/font-size/lists)
 *   — rendered directly via a sanitized dangerouslySetInnerHTML.
 * - Old records: plain markdown-lite text (**bold**, "• "/"1. " lines) —
 *   rendered via the original parser, byte-for-byte the same as before.
 */
export function renderRichText(text: string, keyPrefix = 'rt'): React.ReactNode {
  if (!text) return null;

  if (looksLikeHtml(text)) {
    const clean = sanitizeHtml(text);
    // eslint-disable-next-line react/no-danger
    return <div className="nl-rt-html" dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  return renderLegacyMarkdown(text, keyPrefix);
}