// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentChartPrintView.tsx — section-wise risk chart (print preview page).
// Path: src/components/modules/riskAssessment/RiskAssessmentChartPrintView.tsx
//
// NOTE: no id="printable-area" here — RiskAssessmentManager wraps it in the one element.
// Shows the CURRENTLY FILTERED records as a stacked bar per section
// (অত্যন্ত উচ্চ | উচ্চ | মাঝারি | নিম্ন), most dangerous sections first.
// Built from table rows + CSS bars (no canvas), so Print and the PDF export
// reproduce it exactly and rows never split across pages.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import { RISK_LEVEL_OPTIONS, buildRiskEntries, formatDMY, todayIso, toBn } from './types';
import type { RiskLevelName } from './types';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
  /** Date shown as "Submission Date" (ISO). Defaults to today. */
  submissionDate?: string;
}

const TH = 'border border-black px-2 py-2 text-center font-bold';
const TD = 'border border-black px-2 py-1.5 align-middle';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };

// Solid chart colours (the pale on-screen pill colours are too faint on paper).
const LEVEL_COLOR: Record<RiskLevelName, { bg: string; fg: string }> = {
  'অত্যন্ত উচ্চ': { bg: '#7f1d1d', fg: '#ffffff' },
  'উচ্চ':         { bg: '#dc2626', fg: '#ffffff' },
  'মাঝারি':       { bg: '#f59e0b', fg: '#1f2937' },
  'নিম্ন':        { bg: '#15803d', fg: '#ffffff' },
};
// Bar order, left to right: most dangerous first so the danger edge lines up.
const STACK: RiskLevelName[] = [...RISK_LEVEL_OPTIONS].reverse();

// widths sum to 100
const WIDTHS = [5, 20, 45, 8, 12, 10];

interface SectionRow {
  name: string;
  total: number;
  unrated: number;
  maxScore: number;
  counts: Record<RiskLevelName, number>;
}

export default function RiskAssessmentChartPrintView({
  records, factoryName, factoryAddress, authorization, submissionDate,
}: Props) {
  const submitted = submissionDate || todayIso();
  const entries   = buildRiskEntries(records);

  // ── Aggregate per section ──────────────────────────────────────────────────
  const map = new Map<string, SectionRow>();
  for (const e of entries) {
    const name = String(e.rec.section ?? '').trim() || 'সেকশন উল্লেখ নেই';
    let row = map.get(name);
    if (!row) {
      row = { name, total: 0, unrated: 0, maxScore: 0, counts: { 'নিম্ন': 0, 'মাঝারি': 0, 'উচ্চ': 0, 'অত্যন্ত উচ্চ': 0 } };
      map.set(name, row);
    }
    row.total += 1;
    if (e.level) row.counts[e.level] += 1; else row.unrated += 1;
    if (e.score && e.score > row.maxScore) row.maxScore = e.score;
  }

  // Most dangerous first: extreme, then high, then medium, then low (all descending), then name.
  const rows = Array.from(map.values()).sort((a, b) =>
    (b.counts['অত্যন্ত উচ্চ'] - a.counts['অত্যন্ত উচ্চ']) ||
    (b.counts['উচ্চ'] - a.counts['উচ্চ']) ||
    (b.counts['মাঝারি'] - a.counts['মাঝারি']) ||
    (b.counts['নিম্ন'] - a.counts['নিম্ন']) ||
    a.name.localeCompare(b.name, 'bn'),
  );

  const maxTotal = Math.max(1, ...rows.map(r => r.total));
  const grand    = entries.length;
  const levelTotals = STACK.map(lv => ({ lv, n: rows.reduce((s, r) => s + r.counts[lv], 0) }));
  const unratedTotal = rows.reduce((s, r) => s + r.unrated, 0);
  const pct = (n: number) => (grand ? Math.round((n / grand) * 100) : 0);

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">বিভাগ/ক্ষেত্র অনুযায়ী ঝুঁকির চিত্র (Section-wise Risk Chart)</h2>
            <div
              className="text-xs text-gray-700 mt-2"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, textAlign: 'left', lineHeight: 1.6 }}
            >
              <div>
                <strong>মোট বিভাগ/ক্ষেত্র:</strong> {toBn(rows.length)} | <strong>মোট রেকর্ড:</strong> {toBn(grand)}
                {unratedTotal > 0 && <> | <strong>মূল্যায়ন হয়নি:</strong> {toBn(unratedTotal)}</>}
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <strong>মূল্যায়নের তারিখ:</strong> {toBn(formatDMY(submitted))}
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">

          {/* Summary boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
            <div className="rc-box" style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 11 }}>মোট রেকর্ড</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{toBn(grand)}</div>
            </div>
            {levelTotals.map(({ lv, n }) => (
              <div
                key={lv}
                className="rc-seg"
                style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', background: LEVEL_COLOR[lv].bg, color: LEVEL_COLOR[lv].fg }}
              >
                <div style={{ fontSize: 11 }}>{lv}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {toBn(n)} <span style={{ fontSize: 11, fontWeight: 400 }}>({toBn(pct(n))}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', fontSize: 11, marginBottom: 6, flexWrap: 'wrap' }}>
            {STACK.map(lv => (
              <span key={lv} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span className="rc-seg" style={{ width: 12, height: 12, background: LEVEL_COLOR[lv].bg, border: '1px solid #000', display: 'inline-block' }} />
                {lv}
              </span>
            ))}
            <span style={{ color: '#4b5563' }}>(বিভাগ/ক্ষেত্রগুলো সবচেয়ে ঝুঁকিপূর্ণ থেকে ক্রমানুসারে)</span>
          </div>

          {/* Chart table: one row per section */}
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 11, lineHeight: 1.35, tableLayout: 'fixed' }}>
            <colgroup>{WIDTHS.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className={TH}>ক্রমিক</th>
                <th className={TH}>বিভাগ / ক্ষেত্র</th>
                <th className={TH}>ঝুঁকির মাত্রা অনুযায়ী রেকর্ড সংখ্যা</th>
                <th className={TH}>মোট</th>
                <th className={TH}>উচ্চ ও অত্যন্ত উচ্চ</th>
                <th className={TH}>সর্বোচ্চ স্কোর</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={WIDTHS.length} className="border border-black px-2 py-4 text-center text-gray-600">কোনো রেকর্ড পাওয়া যায়নি</td></tr>
              )}
              {rows.map((row, index) => {
                const high = row.counts['উচ্চ'] + row.counts['অত্যন্ত উচ্চ'];
                return (
                  <tr key={row.name} className="req-item-row">
                    <td className={`${TD} text-center`}>{toBn(index + 1)}</td>
                    <td className={`${TD} font-semibold`} style={wrap}>{row.name}</td>
                    <td className={TD}>
                      <div style={{ display: 'flex', width: `${(row.total / maxTotal) * 100}%`, minWidth: 24, height: 22, border: '1px solid #000', overflow: 'hidden' }}>
                        {STACK.map(lv => row.counts[lv] > 0 && (
                          <div
                            key={lv}
                            className="rc-seg"
                            title={`${lv}: ${row.counts[lv]}`}
                            style={{
                              flex: row.counts[lv], minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: LEVEL_COLOR[lv].bg, color: LEVEL_COLOR[lv].fg, fontSize: 11, fontWeight: 700,
                            }}
                          >{toBn(row.counts[lv])}</div>
                        ))}
                        {row.unrated > 0 && (
                          <div
                            className="rc-seg"
                            title={`মূল্যায়ন হয়নি: ${row.unrated}`}
                            style={{ flex: row.unrated, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d1d5db', color: '#111827', fontSize: 11, fontWeight: 700 }}
                          >{toBn(row.unrated)}</div>
                        )}
                      </div>
                    </td>
                    <td className={`${TD} text-center font-semibold`}>{toBn(row.total)}</td>
                    <td className={`${TD} text-center font-semibold`}>{toBn(high)}</td>
                    <td className={`${TD} text-center`}>{row.maxScore ? toBn(row.maxScore) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>

        <footer className="print-footer mt-10">
          <PrintSignatureRow value={authorization} lang="en" />
        </footer>

      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
        .rc-seg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * { visibility: visible !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; background: white !important; }
          .print-content { font-size: 10pt !important; }
          .req-items-table thead { display: table-header-group; }
          .req-item-row { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}