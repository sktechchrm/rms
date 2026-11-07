// ─────────────────────────────────────────────────────────────────────────────
// MaternityListPrintView.tsx — Maternity Benefit sheet (A4 landscape), the CURRENTLY FILTERED list.
//
// COLUMNS
//   1 SL · 2 Employee Information · 3 Eligibility · 4 Delivery & Leave · 5 Length of Service · 6 Wage ·
//   7 1st Installment · 8 2nd Installment · 9 Total Paid · 10 Pending · 11 Employee Acknowledgment & Signature
//
// TABLE STYLE (same as the Final Settlement sheet): every value is in Bangla (labels + Bangla digits), nothing in the
// body is bold; thin crisp borders, light header band that repeats on every printed page.
// All per-column figures come from MaternityRow (maternityModel.ts → buildMaternityRows).
// NO id="printable-area" here — maternityBenefit.tsx wraps it.
// Path: src/components/modules/maternityBenefit/MaternityListPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import type { MaternityRow, InstView } from './maternityModel';
import { formatDMY, todayIso, money, STATUS_STYLE } from './maternityModel';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props { rows: MaternityRow[]; factoryName: string; factoryAddress: string; authorization: AuthorizationState; filterText?: string }

/** Column width in %, in the order of the 11 columns (adds up to 100). */
const WIDTHS = [3, 14, 7, 11, 9, 8, 11, 11, 8, 7, 11];

// ─── Bangla helpers ──────────────────────────────────────────────────────────
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const bn = (v: string | number): string => String(v).replace(/\d/g, d => BN_DIGITS[Number(d)]);
const bnMoney = (x: number) => bn(money(x));
const bnDate = (iso: string) => (iso ? bn(formatDMY(iso)) : '—');

const Head = ({ title }: { title: string }) => <th>{title}</th>;

/** One line inside a cell: muted label on the left, value on the right. */
const Line = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="msl-line-item"><div className="msl-line-label">{label}</div><div className="msl-line-value">{children}</div></div>
);

/** An installment cell: paid → paid date + amount; otherwise the time limit + amount; not eligible → a dash. */
function Inst({ v, eligible }: { v: InstView; eligible: boolean }) {
  if (!eligible) return <div className="msl-c">—</div>;
  return (
    <>
      <Line label="অবস্থা">{v.paid ? 'পরিশোধিত' : 'বকেয়া'}</Line>
      <Line label={v.paid ? 'পরিশোধ' : 'সময়সীমা'}>{bnDate(v.paid ? v.paidDate : v.due)}</Line>
      <Line label="টাকা">{v.combined && v.amount === 0 ? '১ম+২য় একসাথে' : bnMoney(v.amount)}</Line>
    </>
  );
}

export default function MaternityListPrintView({ rows, factoryName, factoryAddress, authorization, filterText }: Props) {
  const starts = rows.map(r => r.leaveStart).filter(Boolean).sort(), ends = rows.map(r => r.leaveEnd).filter(Boolean).sort();
  const range = starts.length && ends.length ? `${formatDMY(starts[0])} → ${formatDMY(ends[ends.length - 1])}` : '—';
  const sum = (fn: (r: MaternityRow) => number) => rows.reduce((s, r) => s + fn(r), 0);

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Maternity Benefit Sheet (মাতৃত্বকালীন সুবিধা বিবরণী)</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                <div><strong>Leave period:</strong> {range}</div>
                {filterText && <div><strong>View:</strong> {filterText}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Submission date:</strong> {formatDMY(todayIso())}</div>
                <div><strong>Employees:</strong> {rows.length} | <strong>Total paid:</strong> {money(sum(r => r.totalPaid))} | <strong>Pending:</strong> {money(sum(r => r.pendingAmount))}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="msl-table req-items-table">
            <colgroup>{WIDTHS.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
            <thead>
              <tr>
                <Head title="SL." />
                <Head title="Employee Information" />
                <Head title="Eligibility" />
                <Head title="Expected Delivery & Leave" />
                <Head title="Length of Service" />
                <Head title="Wage" />
                <Head title="1st Installment" />
                <Head title="2nd Installment" />
                <Head title="Total Paid" />
                <Head title="Pending Amount" />
                <Head title="Employee Acknowledgment & Signature" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={11} className="msl-empty">ফিল্টারের সাথে মিল আছে এমন কোনো রেকর্ড নেই</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id || i} className="req-item-row">
                  {/* 1. SL */}
                  <td className="msl-c">{bn(i + 1)}</td>

                  {/* 2. Employee Information */}
                  <td>
                    <div className="msl-name">{r.name}{r.cardNo ? ` (${bn(r.cardNo)})` : ''}</div>
                    <div>{r.designation || '—'}</div>
                    <div className="msl-mute">{r.section || '—'}</div>
                  </td>

                  {/* 3. Eligibility */}
                  <td>
                    <div>{r.eligibility || '—'}</div>
                    {r.aliveChildren !== '' && <div className="msl-mute">জীবিত সন্তান {bn(r.aliveChildren)}</div>}
                  </td>

                  {/* 4. Delivery & Leave */}
                  <td>
                    <Line label="প্রসব">{bnDate(r.delivery)}</Line>
                    <Line label="ছুটি শুরু">{bnDate(r.leaveStart)}</Line>
                    <Line label="ছুটি শেষ">{bnDate(r.leaveEnd)}</Line>
                  </td>

                  {/* 5. Length of Service */}
                  <td>{bn(r.service)}</td>

                  {/* 6. Wage */}
                  <td>
                    <Line label="মাসিক">{bnMoney(r.wage)}</Line>
                    <Line label="দৈনিক">{bnMoney(r.daily)}</Line>
                  </td>

                  {/* 7–8. Installments */}
                  <td><Inst v={r.first} eligible={r.eligible} /></td>
                  <td><Inst v={r.second} eligible={r.eligible} /></td>

                  {/* 9. Total paid */}
                  <td className="msl-net">{bnMoney(r.totalPaid)}</td>

                  {/* 10. Pending */}
                  <td className="msl-net">{r.pendingAmount > 0 ? bnMoney(r.pendingAmount) : '—'}<div className="msl-mute" style={{ textAlign: 'right' }}>{STATUS_STYLE[r.status].label}</div></td>

                  {/* 11. Employee Signature */}
                  <td className="msl-sign" />
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="msl-total">
                  <td colSpan={8} className="msl-tl">সর্বমোট ({bn(rows.length)} জন)</td>
                  <td className="msl-ta">{bnMoney(sum(r => r.totalPaid))}</td>
                  <td className="msl-ta">{bnMoney(sum(r => r.pendingAmount))}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </main>

        <footer className="print-footer mt-10"><PrintSignatureRow value={authorization} lang="en" /></footer>
      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}

        .msl-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; line-height: 1.45; color: #0f172a; font-variant-numeric: tabular-nums; }
        /* words are never split: wrapping happens only at spaces */
        .msl-table th, .msl-table td { border: 0.5px solid #1e293b; padding: 4px 5px; vertical-align: top; font-weight: 400; word-break: normal; overflow-wrap: normal; hyphens: none; }
        .msl-table th { background: #eef2f7; color: #0f172a; text-align: left; vertical-align: middle; font-weight: 600; font-size: 8.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .msl-table .msl-c { text-align: center; }
        .msl-table .msl-mute { color: #475569; }
        .msl-table .msl-name { color: #000; margin-bottom: 1px; }
        .msl-table .msl-line-item { display: flex; justify-content: space-between; align-items: baseline; gap: 5px; }
        .msl-table .msl-line-label { flex: 1 1 auto; min-width: 0; color: #475569; font-size: 8.5px; }
        .msl-table .msl-line-value { flex: none; margin-left: auto; text-align: right; color: #000; white-space: nowrap; }
        .msl-table .msl-net { text-align: right; font-size: 9.5px; color: #000; white-space: nowrap; }
        .msl-table .msl-sign { height: 50px; }
        .msl-table .msl-empty { text-align: center; padding: 16px; color: #475569; }
        .msl-table tr.msl-total td { border-top: 1.2px solid #0f172a; background: #f8fafc; padding: 5px; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .msl-table .msl-tl { text-align: right; }
        .msl-table .msl-ta { text-align: right; }

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