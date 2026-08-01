// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryProcessFlow.tsx — REBUILT (5th round): decision branch
// after ধাপ ২ now shows ONLY the branch that actually happened
// (সন্তোষজনক or অসন্তোষজনক), not both side by side with one dimmed —
// showing the un-taken branch duplicated/confused against the জবাবের
// অবস্থা already implied by ধাপ ২'s own node above. Nothing renders
// until a decision has actually been made (replyStatus is set). All
// flow/branch elements are also now reliably centered regardless of
// container width.
//
// FIX (single-page print guarantee — this round): this flowchart's
// rendered height varies enormously with the case data — a case closed
// early after ধাপ ২ renders only 3 node boxes, while a case that goes
// all the way to ধাপ ৬ renders 8 node boxes + 8 arrows + a branch box,
// and any node's description/company address can wrap to extra lines
// depending on text length. No single fixed print font-size/padding
// budget can guarantee EVERY combination of that fits one A4 sheet —
// tightening the CSS for the worst case would make the common
// short-case print look needlessly cramped, and any fixed budget will
// eventually be wrong for some data. So instead of guessing a static
// compression, a `useLayoutEffect` below measures the ACTUAL rendered
// content height on every render and computes exactly how much to
// shrink it to fit the printable page area, storing the result as a
// CSS custom property (`--pf-print-zoom`) that's consumed ONLY inside
// `@media print` via the non-standard-but-Chromium-supported `zoom`
// property (this app's print pipeline is confirmed Chromium — see the
// print-preview screenshots reviewed for the sibling
// DisciplinaryNoticeLetter.tsx). `zoom` was chosen over
// `transform: scale()` specifically because `transform` only repaints
// an element smaller without shrinking its own LAYOUT box — the page
// would still reserve the original (too-tall) height in the print flow
// and could still spill a mostly-blank page 2 despite visibly "looking"
// shrunk on page 1. `zoom` genuinely reflows the box at the smaller
// size, which is what actually prevents the extra page.
//
// The value is baked in as a plain inline style / custom property
// rather than applied imperatively in a 'beforeprint' handler, because
// this app's print pipeline clones the live DOM via `outerHTML` into a
// separate iframe (per DisciplinaryNoticeLetter.tsx's print-normalize
// comments describing the same mechanism) — a 'beforeprint' listener
// would fire on the IFRAME's window, not this component's, and would
// never run. A `useLayoutEffect` instead recomputes the value on every
// render/data change, so by the time the user ever clicks Print, the
// correct `--pf-print-zoom` is already sitting on the DOM as a real
// attribute, and gets captured verbatim by the outerHTML clone
// regardless of timing.
//
// FIX (this round — on-screen Print/Close toolbar pinned to top): added
// a small fixed-position toolbar (Print + Close icon buttons) anchored
// to the top-right of the viewport on screen. It's a SIBLING of
// .pf-wrap (not inside it), so it never affects the useLayoutEffect
// height measurement above (that measures wrap.scrollHeight only).
// `position: fixed` (not `sticky`) so it stays pinned to the viewport
// regardless of how far the page content scrolls, and z-index keeps it
// above the page's own box-shadow/border. It's explicitly hidden in
// `@media print` (`display: none !important`) — the print pipeline
// clones .pf-page's outerHTML into a separate iframe (see above), and
// these two buttons are pure on-screen chrome with no place on a
// printed page.
//
// CARRIED FORWARD (4th round): connected box-and-arrow FLOWCHART shape,
// each node showing the step's ACTUAL recorded date.
// Path: src/components/modules/disciplinaryAction/DisciplinaryProcessFlow.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useLayoutEffect, useRef } from 'react';
import type { DisciplinaryActionData } from './types';
import { formatDateBn, calculateNotice4Date } from './types';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';

const font = "'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif";

interface Props {
  data: DisciplinaryActionData;
  festivalHolidays: string[];
  // Optional handlers for the on-screen Print/Close toolbar pinned to
  // the top of the page. Both are optional so this component still
  // renders standalone (e.g. in a preview) without a parent wiring
  // these up — the toolbar simply omits whichever button has no
  // handler, and renders nothing at all if neither is provided.
  onPrint?: () => void;
  onClose?: () => void;
}

interface NodeDef {
  step: number;
  stage: string;
  title: string;
  description: string;
  date: string;
  output: string;
}

type StatusKind = 'done' | 'progress' | 'pending' | 'na';
const STATUS_LABEL: Record<StatusKind, string> = {
  done: 'সম্পন্ন', progress: 'চলমান', pending: 'অসম্পন্ন', na: 'প্রযোজ্য নয়',
};

// ── Print page-fit constants ──────────────────────────────────────────
// PAGE_MARGIN_MM must match the @page rule's margin below — if that
// value ever changes, this needs to change with it or the computed
// budget will silently be wrong.
const PAGE_MARGIN_MM = 14;
const MM_TO_PX = 96 / 25.4;
const PRINT_PAGE_HEIGHT_PX = (297 - PAGE_MARGIN_MM * 2) * MM_TO_PX;
// Never shrink past this. Beyond it the content would be unreadably
// small, which signals a genuine "this case has too much content for
// one page" edge case that automatic shrinking shouldn't try to paper
// over silently.
const MIN_PRINT_ZOOM = 0.6;

export const DisciplinaryProcessFlow: React.FC<Props> = ({ data, festivalHolidays, onPrint, onClose }) => {
  const notice4Date = calculateNotice4Date(data.evaluationDate, festivalHolidays);
  const caseClosedEarly = data.replyStatus === 'সন্তোষজনক';
  const caseContinuing = data.replyStatus === 'অসন্তোষজনক';
  const decided = !!data.replyStatus;

  // Total elapsed days from ধাপ ১ (কারণ দর্শানো — showCauseDate) to ধাপ ৬
  // (চূড়ান্ত সিদ্ধান্ত — notice4Date), shown next to the "প্রক্রিয়া
  // সম্পন্ন" completion label. Only computed — and only shown — when
  // the full flow actually runs to ধাপ ৬ (i.e. NOT caseClosedEarly) and
  // both endpoint dates are valid; an early-closed case has no ধাপ ৬
  // date to measure against, so it intentionally shows nothing extra.
  const totalProcessDays = (() => {
    if (!data.showCauseDate || !notice4Date) return null;
    const start = new Date(data.showCauseDate);
    const end = new Date(notice4Date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  })();

  const pageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measureAndApply = () => {
      const page = pageRef.current;
      const wrap = wrapRef.current;
      if (!page || !wrap) return;
      // Reset to natural (unzoomed) size before measuring, so repeated
      // calls (e.g. once web fonts finish loading, below) always start
      // from the TRUE unscaled height rather than compounding whatever
      // zoom was previously applied.
      page.style.setProperty('--pf-print-zoom', '1');
      // NOTE: this measures the element as currently laid out under
      // SCREEN styles, since forcing real print-media layout without a
      // hidden offscreen iframe is significantly more machinery than
      // this warrants. The screen and print stylesheets are close
      // enough (only a few font-sizes differ, and only slightly) that
      // this is a safe, if slightly conservative, proxy — screen layout
      // tends to be marginally taller than the print layout actually
      // will be, so the resulting zoom errs toward shrinking a little
      // more than strictly necessary rather than risking overflow.
      // (wrapRef is a sibling of the fixed-position toolbar below, so
      // the toolbar never contributes to this measurement.)
      const naturalHeight = wrap.scrollHeight;
      const zoom = naturalHeight > PRINT_PAGE_HEIGHT_PX
        ? Math.max(PRINT_PAGE_HEIGHT_PX / naturalHeight, MIN_PRINT_ZOOM)
        : 1;
      page.style.setProperty('--pf-print-zoom', zoom.toFixed(3));
    };

    measureAndApply();

    // The Noto Sans Bengali webfont (@import'd below) loads
    // asynchronously — if it finishes AFTER this first measurement,
    // line heights/wrapping can shift and the baked-in zoom goes stale.
    // Re-measure once fonts are actually ready, if the browser exposes
    // the Font Loading API.
    const fonts = typeof document !== 'undefined' ? (document as any).fonts : undefined;
    if (fonts?.ready) {
      fonts.ready.then(measureAndApply).catch(() => {});
    }
  }, [data, festivalHolidays]);

  const before: NodeDef[] = [
    {
      step: 1, stage: 'ধাপ ১', title: 'কারণ দর্শানো',
      description: 'কারণ দর্শানোর নোটিশ জারি করা হয়।',
      date: data.showCauseDate, output: 'নোটিশ ১',
    },
    {
      step: 2, stage: 'ধাপ ২', title: 'জবাব ও অবস্থা',
      description: 'কর্মীর জবাব যাচাই করা হয়।',
      date: data.replyDate, output: data.replyStatus || '—',
    },
  ];

  const after: NodeDef[] = [
    {
      step: 3, stage: 'ধাপ ৩', title: 'প্রতিনিধি মনোনয়ন',
      description: 'কমিটি সদস্য সংখ্যা ও শ্রমিক প্রতিনিধি মনোনয়নের নির্দেশনা।',
      date: data.notice2Date, output: 'নোটিশ ২',
    },
    {
      step: 4, stage: 'ধাপ ৪', title: 'তদন্ত কমিটি',
      description: 'তদন্ত কমিটি গঠন ও তদন্ত সময়সীমা নির্ধারণ।',
      date: data.notice3Date, output: 'নোটিশ ৩',
    },
    {
      step: 5, stage: 'ধাপ ৫', title: 'মূল্যায়ন',
      description: 'তদন্ত প্রতিবেদনের সারাংশ ও সুপারিশ লিপিবদ্ধ।',
      date: data.evaluationDate, output: 'প্রতিবেদন ও সুপারিশ',
    },
    {
      step: 6, stage: 'ধাপ ৬', title: 'চূড়ান্ত সিদ্ধান্ত',
      description: 'কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত অবহিতকরণ।',
      date: notice4Date, output: 'নোটিশ ৪',
    },
  ];

  const nodeStatus = (n: NodeDef): StatusKind => (n.date ? 'done' : 'pending');

  const NodeBox: React.FC<{ n: NodeDef }> = ({ n }) => {
    const status: StatusKind = nodeStatus(n);
    return (
      <div className="pf-node-box">
        <div className="pf-node-top">
          <span className="pf-node-badge">{n.step}</span>
          <div className="pf-node-heading">
            <div className="pf-node-stage">{n.stage}</div>
            <div className="pf-node-title">{n.title}</div>
          </div>
          <span className={`pf-status pf-status-${status}`}>{STATUS_LABEL[status]}</span>
        </div>
        <div className="pf-node-desc">{n.description}</div>
        <div className="pf-node-meta">
          <span><b>তারিখ:</b> {n.date ? `${formatDateBn(n.date)} ইং` : '—'}</span>
          <span className="pf-meta-divider" />
        </div>
      </div>
    );
  };

  const Arrow: React.FC = () => (
    <div className="pf-arrow"><span className="pf-arrow-line" /><span className="pf-arrow-head">▼</span></div>
  );

  const showToolbar = !!(onPrint || onClose);

  return (
    <div className="pf-page" ref={pageRef}>

      {/* ══ ON-SCREEN TOOLBAR (Close / Print) — pinned to the top of
          the print-preview card, never part of the printed output.
          Sits OUTSIDE .pf-wrap so it's excluded from the
          useLayoutEffect's height measurement above. Styled to match
          the reference: plain-text "Close" button + bordered/emphasized
          "Print" button, Close before Print. ══ */}
      {showToolbar && (
        <div className="pf-toolbar" role="toolbar" aria-label="Print or close">
          {onClose && (
            <button
              type="button"
              className="pf-toolbar-btn pf-toolbar-btn-close"
              onClick={onClose}
            >
              Close
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              className="pf-toolbar-btn pf-toolbar-btn-print"
              onClick={onPrint}
            >
              Print
            </button>
          )}
        </div>
      )}

      <div className="pf-wrap" ref={wrapRef}>

        {/* ══ HEADER ══════════════════════════════════════ */}
        <div className="pf-header">
          {data.factoryName && <h1 className="pf-co-name">{data.factoryName}</h1>}
          {data.factoryAddress && <p className="pf-co-addr">{data.factoryAddress}</p>}
        </div>

        {/* ══ TITLE BAR ═══════════════════════════════════════ */}
        <div className="pf-title-bar">
          <div>
            <h2 className="pf-title">শৃঙ্খলামূলক ব্যবস্থা — কার্যধারা ফ্লোচার্ট</h2>
            <p className="pf-subtitle">Case Flowchart &amp; Status Summary</p>
          </div>
          {data.referenceNo && (
            <div className="pf-ref-badge">
              <span className="pf-ref-label">সূত্র নং</span>
              <span className="pf-ref-value">{data.referenceNo}</span>
            </div>
          )}
        </div>

        {/* ══ EMPLOYEE INFO ═══════════════════════════════════ */}
        <div className="pf-emp-box">
          <div className="pf-emp-box-head">কর্মীর তথ্য</div>
          <div className="pf-emp-col">
            <table className="pf-emp-tbl"><tbody>
              <tr>
                <td>নাম</td><td>{data.employeeName || '—'}</td>
                <td>কার্ড নং</td><td>{data.cardNo || '—'}</td>
              </tr>
              <tr>
                <td>পদবী</td><td>{data.designation || '—'}</td>
                <td>সেকশন</td><td>{data.section || '—'}</td>
              </tr>
            </tbody></table>
          </div>
        </div>

        {/* ══ FLOWCHART ═══════════════════════════════════════ */}
        <div className="pf-flow">
          <NodeBox n={before[0]} />
          <Arrow />
          <NodeBox n={before[1]} />

          {/* ── Decision branch after ধাপ ২ — shows ONLY the branch that
             actually happened, not both side by side. Nothing renders
             until a decision is actually made. ── */}
          {decided && (
            <>
              <div className="pf-branch-stem" />
              <div className="pf-branch-row pf-branch-row-single">
                {caseClosedEarly && (
                  <div className="pf-branch-col">
                    <div className="pf-branch-label pf-branch-label-good">সন্তোষজনক</div>
                    <div className="pf-branch-box pf-branch-box-good">
                      কেস সমাপ্ত{data.replyDate ? ` — ${formatDateBn(data.replyDate)} ইং` : ''}
                    </div>
                  </div>
                )}
                {caseContinuing && (
                  <div className="pf-branch-col">
                    <div className="pf-branch-label pf-branch-label-continue">অসন্তোষজনক</div>
                    <div className="pf-branch-box pf-branch-box-continue">তদন্ত প্রক্রিয়া চলমান</div>
                  </div>
                )}
              </div>
            </>
          )}

          {!caseClosedEarly && (
            <>
              <Arrow />
              {after.map((n, idx) => (
                <React.Fragment key={n.step}>
                  <NodeBox n={n} />
                  {idx < after.length - 1 && <Arrow />}
                </React.Fragment>
              ))}
            </>
          )}

          {caseClosedEarly && (
            <div className="pf-flow-end pf-flow-end-closed">🏁 কেস সমাপ্ত</div>
          )}
          {!caseClosedEarly && (
            <>
              <Arrow />
              <div className="pf-flow-end">
                🏁 প্রক্রিয়া সম্পন্ন
                {totalProcessDays !== null && (
                  <span className="pf-flow-end-days"> (মোট {toBanglaNumber(totalProcessDays)} দিন)</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="pf-footer">
          <span>প্রস্তুতের তারিখঃ {formatDateBn(new Date().toISOString().split('T')[0])} ইং</span>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        .pf-page, .pf-page * { font-family: ${font}; box-sizing: border-box; }

        .pf-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 16mm 16mm 14mm;
          position: relative;
        }
        .pf-wrap { display: flex; flex-direction: column; }

        /* ── On-screen Print/Close toolbar — pinned to the viewport
           (not the page), stays visible while the page content
           scrolls. Excluded entirely from print (see @media print
           below). ── */
        /* position: sticky (NOT fixed) — anchors the toolbar to THIS
           card's own scroll container (the modal body wrapping
           .pf-page), not the browser viewport. With 'fixed', the
           buttons floated at the literal top-right of the whole
           browser window — detached from the card, sitting over the
           dark modal backdrop / underlying page nav instead of the
           document itself, and not actually tied to whatever is
           scrolled. 'sticky' keeps it flush with the card's own
           top-right corner at rest, and only "sticks" there once the
           card scrolls past it — same fixed-while-scrolling behavior,
           but correctly scoped to the print-preview card rather than
           the whole page. */
        .pf-toolbar {
          position: sticky; top: 12px; z-index: 100;
          display: flex; justify-content: flex-end; align-items: center; gap: 10px;
          margin: 0 0 16px; width: 100%;
          padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;
        }
        /* Text-label buttons matching the reference: plain gray "Close",
           bordered/emphasized "Print" — not icon-only circles. */
        .pf-toolbar-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 76px; height: 34px; padding: 0 16px;
          border-radius: 4px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s ease, transform 0.1s ease;
        }
        .pf-toolbar-btn:active { transform: scale(0.97); }
        .pf-toolbar-btn-close {
          background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155;
        }
        .pf-toolbar-btn-close:hover { background: #e2e8f0; }
        .pf-toolbar-btn-print {
          background: #fff; border: 2px solid #1e293b; color: #1e293b;
        }
        .pf-toolbar-btn-print:hover { background: #f8fafc; }

        .pf-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 14px; }
        .pf-co-name { font-size: 19px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
        .pf-co-addr { font-size: 12.5px; color: #374151; margin: 0; }

        .pf-title-bar {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
        }
        .pf-title { font-size: 16px; font-weight: 700; margin: 0; color: #111827; letter-spacing: 0.1px; }
        .pf-subtitle { font-size: 10.5px; color: #94a3b8; margin: 2px 0 0; letter-spacing: 0.6px; text-transform: uppercase; }
        .pf-ref-badge {
          display: flex; flex-direction: column; align-items: flex-end;
          border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; background: #f8fafc;
        }
        .pf-ref-label { font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
        .pf-ref-value { font-size: 12px; font-weight: 700; color: #1e3a5f; margin-top: 1px; }

        .pf-emp-box { border: 1.5px solid #1e3a5f; border-radius: 6px; overflow: hidden; margin: 0 auto 22px; width: 100%; max-width: 480px; }
        .pf-emp-box-head { background: #1e3a5f; color: #fff; font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px; padding: 5px 12px; }
        .pf-emp-col { padding: 8px 12px; }
        .pf-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .pf-emp-tbl td { padding: 3px 6px; vertical-align: top; line-height: 1.5; }
        .pf-emp-tbl td:nth-child(1), .pf-emp-tbl td:nth-child(3) { font-weight: 600; color: #475569; white-space: nowrap; width: 15%; }
        .pf-emp-tbl td:nth-child(1)::after, .pf-emp-tbl td:nth-child(3)::after { content: ':'; margin-right: 2px; }
        .pf-emp-tbl td:nth-child(2), .pf-emp-tbl td:nth-child(4) { width: 35%; }

        /* ── Flowchart — all children centered, full-width container so
           margin:auto on the fixed-max-width children actually centers
           them regardless of the page's own width. ── */
        .pf-flow { display: flex; flex-direction: column; align-items: center; width: 100%; }

        .pf-node-box {
          width: 100%; max-width: 480px; margin: 0 auto; background: #fff; border: 1.5px solid #cbd5e1; border-radius: 10px;
          padding: 12px 16px; box-shadow: 0 1px 3px rgba(15,23,42,0.05);
        }
        .pf-node-top { display: flex; align-items: flex-start; gap: 10px; }
        .pf-node-badge {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #1e3a5f; color: #fff;
          font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center;
        }
        .pf-node-heading { flex: 1; min-width: 0; }
        .pf-node-stage { font-size: 9.5px; font-weight: 700; color: #2563eb; letter-spacing: 0.4px; text-transform: uppercase; }
        .pf-node-title { font-weight: 700; font-size: 13px; color: #111827; }
        .pf-node-desc { font-size: 11px; line-height: 1.55; color: #64748b; margin: 6px 0 0 36px; }
        .pf-node-meta { display: flex; align-items: center; gap: 10px; margin: 6px 0 0 36px; font-size: 11px; color: #374151; }
        .pf-node-meta b { color: #1e293b; font-weight: 600; }
        .pf-meta-divider { width: 1px; height: 11px; background: #e2e8f0; }

        .pf-arrow { display: flex; flex-direction: column; align-items: center; padding: 4px 0; }
        .pf-arrow-line { width: 2px; height: 16px; background: #cbd5e1; }
        .pf-arrow-head { color: #94a3b8; font-size: 11px; line-height: 1; margin-top: -3px; }

        .pf-branch-stem { width: 2px; height: 14px; background: #cbd5e1; margin: 0 auto; }
        .pf-branch-row {
          display: flex; justify-content: center; gap: 20px;
          width: 100%; max-width: 480px; margin: 4px auto 6px;
        }
        /* Single-branch variant (only ONE outcome is ever shown) —
           narrower max-width so the lone box reads as centered content,
           not a half-empty two-column row. */
        .pf-branch-row-single { max-width: 300px; }
        .pf-branch-col { flex: 1; text-align: center; }
        .pf-branch-label { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
        .pf-branch-label-good { color: #15803d; }
        .pf-branch-label-continue { color: #c2410c; }
        .pf-branch-box {
          border-radius: 8px; padding: 8px 10px; font-size: 10.5px; font-weight: 600; border: 1.5px solid;
        }
        .pf-branch-box-good { background: #f0fdf4; border-color: #86efac; color: #15803d; }
        .pf-branch-box-continue { background: #fff7ed; border-color: #fdba74; color: #c2410c; }

        .pf-status {
          display: inline-block; font-size: 9.5px; font-weight: 700; border-radius: 999px;
          padding: 2px 9px; white-space: nowrap; flex-shrink: 0;
        }
        .pf-status-done     { color: #15803d; background: #f0fdf4; border: 1px solid #86efac; }
        .pf-status-progress { color: #c2410c; background: #fff7ed; border: 1px solid #fdba74; }
        .pf-status-pending  { color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; }
        .pf-status-na       { color: #94a3b8; background: #f8fafc; border: 1px dashed #e2e8f0; }

        .pf-flow-end {
          margin-top: 4px; font-size: 12.5px; font-weight: 700; color: #1e3a5f;
          background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;
          padding: 7px 18px; text-align: center;
        }
        .pf-flow-end-closed { color: #15803d; background: #f0fdf4; border-color: #86efac; margin-top: 10px; }
        .pf-flow-end-days { font-weight: 600; color: #2563eb; }

        .pf-footer { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #e2e8f0; text-align: right; font-size: 10.5px; color: #94a3b8; }

        ${BASE_PRINT_CSS}

        @media print {
          @page { size: A4 portrait; margin: 14mm 15mm 14mm 15mm; }
          body * { visibility: hidden !important; }
          .pf-page, .pf-page * { visibility: visible !important; }
          .pf-page {
            position: absolute !important; inset: 0 !important; width: 100% !important;
            min-height: unset !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border-radius: 0 !important; background: white !important;
          }
          /* On-screen-only chrome — never part of the printed page. */
          .pf-toolbar { display: none !important; visibility: hidden !important; }
          /* Single-page guarantee: shrink the ENTIRE flow to whatever
             scale the useLayoutEffect above computed, via the
             non-standard-but-Chromium-supported 'zoom' property (this
             app's print pipeline is confirmed Chromium). 'zoom' — unlike
             'transform: scale()' — actually reflows the box at the
             smaller size, so the page genuinely stops reserving the
             original, too-tall height instead of just visually shrinking
             while still occupying (and spilling into) a second sheet.
             Falls back to 1 (no shrink) if the custom property was
             never set, e.g. this stylesheet somehow renders before the
             layout effect has run.
             Deliberately NOT paired with overflow:hidden on .pf-page —
             the height measurement this is based on is a conservative
             estimate (see the useLayoutEffect comment), not a
             guarantee. If it's ever slightly off, letting the tail
             content spill naturally onto a second page is a far better
             failure mode than silently clipping the footer or last
             node off the printout. */
          .pf-wrap { zoom: var(--pf-print-zoom, 1); }
          .pf-node-box { page-break-inside: avoid !important; }
          .pf-node-title { font-size: 10.5pt !important; }
          .pf-node-desc, .pf-node-meta { font-size: 9pt !important; }
          .pf-emp-box-head, .pf-node-badge {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
          .pf-status-done, .pf-status-progress, .pf-status-pending, .pf-status-na,
          .pf-branch-box-good, .pf-branch-box-continue {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DisciplinaryProcessFlow;