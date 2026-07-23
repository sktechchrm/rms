// ─────────────────────────────────────────────────────────────────────────────
// richTextRender.tsx — parses the markdown-lite syntax written by
// RichTextArea.tsx (**bold**, *italic*, "• " bullets, "1. " numbers) into
// real JSX: <strong>, <em>, and grouped <ul>/<ol> lists. Consecutive
// bullet/number lines are grouped into one list rather than one list per
// line, so multi-point summaries print as an actual list, not one
// separate <ul> per bullet.
// Path: src/components/modules/disciplinaryAction/richTextRender.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';

// Inline **bold** / *italic* parsing within a single line of text.
// AUDIT FIX: the pattern only recognized **bold** or *italic* in
// isolation — a combined "***text***" (bold+italic, produced when both
// toolbar buttons are applied to the same selection) fell through to
// the wrong alternative, matched partially, and left a stray literal
// "*" in the output (confirmed via a broken printed line with an
// orphaned asterisk). The triple-star alternative is now checked FIRST
// (regex alternation is ordered, first match wins), so it's consumed
// whole as bold+italic before the double/single-star alternatives ever
// get a chance to partially match it.
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
 * Renders a multi-line markdown-lite string as JSX: plain lines become
 * paragraphs, consecutive "• " lines become one <ul>, consecutive
 * "N. " lines become one <ol> — matching how the RichTextArea toolbar
 * writes bullet/numbered content.
 */
export function renderRichText(text: string, keyPrefix = 'rt'): React.ReactNode {
  if (!text) return null;
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

    // Plain line (blank lines render as spacing via CSS margin, not <br>).
    if (line.trim() === '') {
      blocks.push(<div key={`${keyPrefix}-sp-${blockKey++}`} className="nl-rt-spacer" />);
    } else {
      blocks.push(<p key={`${keyPrefix}-p-${blockKey++}`} className="nl-rt-p">{renderInline(line, `${keyPrefix}-p-${blockKey}`)}</p>);
    }
    i++;
  }

  return <>{blocks}</>;
}