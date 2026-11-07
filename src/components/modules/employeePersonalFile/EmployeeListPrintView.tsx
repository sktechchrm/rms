// ─────────────────────────────────────────────────────────────────────────────
// EmployeeListPrintView.tsx — Employee Personal File list (A4 landscape), the CURRENTLY FILTERED list.
//
// COLUMNS
//   1 SL · 2 Employee Information · 3 Personal · 4 Joining & Service · 5 Contact · 6 Salary · 7 File status ·
//   8 Employee Acknowledgment & Signature
//
// Same table style as the Maternity / Final Settlement sheets: Bangla labels + digits, nothing bold in the body,
// thin crisp borders, light header band that repeats on every printed page.
// NO id="printable-area" here — EmployeeFileSystem.tsx wraps it.
// Path: src/components/modules/employeePersonalFile/EmployeeListPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import type { EmployeeRow } from './employeeModel';
import { formatDMY, todayIso, money, STATUS_STYLE } from './employeeModel';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props { rows: EmployeeRow[]; factoryName: string; factoryAddress: string; authorization: AuthorizationState; filterText?: string }

/** Column width in %, in the order of the 8 columns (adds up to 100). */
const WIDTHS = [4, 20, 17, 12, 13, 8, 10, 16];

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const bn = (v: string | number): string => String(v).replace(/\d/g, d => BN_DIGITS[Number(d)]);
const bnMoney = (x: number) => bn(money(x));
const bnDate = (iso: string) => (iso ? bn(formatDMY(iso)) : '—');

const Head = ({ title }: { title: string }) => <th>{title}</th>;
const Line = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="esl-line-item"><div className="esl-line-label">{label}</div><div className="esl-line-value">{children}</div></div>
);

export default function EmployeeListPrintView({ rows, factoryName, factoryAddress, authorization, filterText }: Props) {
  const sumGross = rows.reduce((s, r) => s + r.gross, 0);
  const complete = rows.filter(r => r.status === 'Complete').length;

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Employee Personal File List (কর্মীর ব্যক্তিগত ফাইল তালিকা)</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>{filterText && <div><strong>View:</strong> {filterText}</div>}</div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Submission date:</strong> {formatDMY(todayIso())}</div>
                <div><strong>Employees:</strong> {rows.length} | <strong>Total gross:</strong> {money(sumGross)} | <strong>Complete files:</strong> {complete}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="esl-table req-items-table">
            <colgroup>{WIDTHS.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
            <thead>
              <tr>
                <Head title="SL." /><Head title="Employee Information" /><Head title="Personal" /><Head title="Joining & Service" />
                <Head title="Contact" /><Head title="Gross Salary" /><Head title="File Status" /><Head title="Employee Acknowledgment & Signature" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} className="esl-empty">ফিল্টারের সাথে মিল আছে এমন কোনো রেকর্ড নেই</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id || i} className="req-item-row">
                  <td className="esl-c">{bn(i + 1)}</td>
                  <td>
                    <div className="esl-name">{r.name}{r.cardNo ? ` (${bn(r.cardNo)})` : ''}</div>
                    <div>{r.designation || '—'}</div>
                    <div className="esl-mute">{[r.section, r.department].filter(Boolean).join(' · ') || '—'}</div>
                  </td>
                  <td>
                    <Line label="পিতা">{r.father || '—'}</Line>
                    <Line label="জন্ম">{bnDate(r.dob)}</Line>
                    <Line label="লিঙ্গ">{[r.gender, r.bloodGroup].filter(Boolean).join(' · ') || '—'}</Line>
                  </td>
                  <td>
                    <Line label="যোগদান">{bnDate(r.joining)}</Line>
                    <div className="esl-mute">{r.service ? bn(r.service) : '—'}</div>
                  </td>
                  <td>
                    <div>{r.mobile ? bn(r.mobile) : '—'}</div>
                    <div className="esl-mute">{r.presentDistrict || r.permanentDistrict || '—'}</div>
                  </td>
                  <td className="esl-net">{r.gross ? bnMoney(r.gross) : '—'}</td>
                  <td>
                    <div>{STATUS_STYLE[r.status].label}</div>
                    <div className="esl-mute">{bn(r.filled)}/{bn(r.total)} · {r.hasPhoto ? 'ছবি আছে' : 'ছবি নেই'}</div>
                  </td>
                  <td className="esl-sign" />
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="esl-total">
                  <td colSpan={5} className="esl-tl">সর্বমোট ({bn(rows.length)} জন)</td>
                  <td className="esl-ta">{bnMoney(sumGross)}</td>
                  <td colSpan={2} />
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

        .esl-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; line-height: 1.45; color: #0f172a; font-variant-numeric: tabular-nums; }
        /* words are never split: wrapping happens only at spaces */
        .esl-table th, .esl-table td { border: 0.5px solid #1e293b; padding: 4px 5px; vertical-align: top; font-weight: 400; word-break: normal; overflow-wrap: normal; hyphens: none; }
        .esl-table th { background: #eef2f7; color: #0f172a; text-align: left; vertical-align: middle; font-weight: 600; font-size: 8.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .esl-table .esl-c { text-align: center; }
        .esl-table .esl-mute { color: #475569; }
        .esl-table .esl-name { color: #000; margin-bottom: 1px; }
        .esl-table .esl-line-item { display: flex; justify-content: space-between; align-items: baseline; gap: 5px; }
        .esl-table .esl-line-label { flex: 1 1 auto; min-width: 0; color: #475569; font-size: 8.5px; }
        .esl-table .esl-line-value { flex: none; margin-left: auto; text-align: right; color: #000; }
        .esl-table .esl-net { text-align: right; font-size: 9.5px; color: #000; white-space: nowrap; }
        .esl-table .esl-sign { height: 50px; }
        .esl-table .esl-empty { text-align: center; padding: 16px; color: #475569; }
        .esl-table tr.esl-total td { border-top: 1.2px solid #0f172a; background: #f8fafc; padding: 5px; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .esl-table .esl-tl { text-align: right; }
        .esl-table .esl-ta { text-align: right; }

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
