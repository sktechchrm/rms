// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlementListPrintView.tsx — Final Settlement sheet (A4 landscape), the CURRENTLY FILTERED list.
//
// COLUMNS
//   1 SL · 2 Employee Details · 3 Types of Separation · 4 Duration of Service · 5 Payable Salary · 6 Payable OT ·
//   7 Earn Leave · 8 Compensation · 9 Deduction · 10 Net Payable ([5+6+7+8] − 9) · 11 Employee Signature
// Column 8 holds EVERY other earning (service / death compensation, gratuity, lay-off, notice pay, others), so the
// formula [5+6+7+8] − 9 always equals the Net Payable.
//
// TABLE STYLE: every row value is in Bangla (labels + Bangla digits), nothing in the body is bold; hierarchy comes
// from colour and a label / value split. Thin crisp borders, light header band, repeats on every printed page.
// All per-column figures come from SettlementRow (settlementModel.ts → buildSettlementRows).
// NO id="printable-area" here — FinalSettlement.tsx wraps it.
// Path: src/components/modules/finalSettlement/FinalSettlementListPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

// import type { ReactNode } from 'react';
import type { SettlementRow } from './settlementModel';
import { formatDMY, todayIso, money } from './settlementModel';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props { rows: SettlementRow[]; factoryName: string; factoryAddress: string; authorization: AuthorizationState; filterText?: string }

/** Column width in %, in the order of the 11 columns (adds up to 100). */
const WIDTHS = [3, 12, 9.5, 12, 8, 7, 7.5, 15.5, 10.5, 9, 6];

// ─── Bangla helpers ──────────────────────────────────────────────────────────
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const bn = (v: string | number): string => String(v).replace(/\d/g, d => BN_DIGITS[Number(d)]);
const bnMoney = (x: number) => bn(money(x));
const bnDate = (iso: string) => (iso ? bn(formatDMY(iso)) : '—');
/** Plain number without trailing zeros ("৩", "৩.৫"). */
const bnNum = (x: number) => bn(Number.isInteger(x) ? x : parseFloat(x.toFixed(2)));

/** Column 8 total for one row: every earning except salary, overtime and earned leave. */
const compEarnings = (r: SettlementRow) => r.serviceComp + r.deathComp + r.gratuity + r.layOff + r.noticePay + r.others;
/** Column 9 total for one row. */
const deductionsOf = (r: SettlementRow) => r.noticeDeduction + r.advance + r.otherDeduction;

/** One line inside a cell: muted label on the left, value on the right (or just the value). */
// const Ln = ({ label, children }: { label?: string; children: ReactNode }) => (
//   <div className="fsl-ln">
//     {label ? <span className="fsl-lb">{label}</span> : null}
//     <span className="fsl-v">{children}</span>
//   </div>
// );

const Head = ({ title }: { title: string }) => <th>{title}</th>;

export default function FinalSettlementListPrintView({ rows, factoryName, factoryAddress, authorization, filterText }: Props) {
  const dates = rows.map(r => r.settlementDate).filter(Boolean).sort();
  const range = dates.length ? (dates[0] === dates[dates.length - 1] ? formatDMY(dates[0]) : `${formatDMY(dates[0])} → ${formatDMY(dates[dates.length - 1])}`) : '—';
  const sum = (fn: (r: SettlementRow) => number) => rows.reduce((s, r) => s + fn(r), 0);

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Final Settlement Sheet (চূড়ান্ত পাওনা বিবরণী)</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                <div><strong>Settlement dates:</strong> {range}</div>
                {filterText && <div><strong>View:</strong> {filterText}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Submission date:</strong> {formatDMY(todayIso())}</div>
                <div><strong>Employees:</strong> {rows.length} | <strong>Total net payable:</strong> {money(sum(r => r.net))}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="fsl-table req-items-table">
            <colgroup>{WIDTHS.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
            <thead>
                <tr>
                    <Head title="SL." />
                    <Head title="Employee Information" />
                    <Head title="Separation Type" />
                    <Head title="Length of Service" />
                    <Head title="Salary Payable" />
                    <Head title="Overtime Payable" />
                    <Head title="Earned Leave Encashment" />
                    <Head title="Compensation & Benefits" />
                    <Head title="Deductions" />
                    <Head title="Total Net Payable" />
                    <Head title="Employee Acknowledgment & Signature" />
                </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={11} className="fsl-empty">ফিল্টারের সাথে মিল আছে এমন কোনো রেকর্ড নেই</td></tr>}
              {rows.map((r, i) => {
                const hasDeduction = deductionsOf(r) > 0 || r.noticeDeductionDays > 0;
                    return (
                    <tr key={r.id || i} className="req-item-row">
                        {/* 1. SL */}
                        <td className="fsl-c">{bn(i + 1)}</td>

                        {/* 2. Employee Information */}
                        <td>
                        <div className="fsl-name">
                            {r.name}{r.cardNo ? ` (${bn(r.cardNo)})` : ''}
                        </div>
                        <div>{r.designation || '—'}</div>
                        <div className="fsl-mute">{r.section || '—'}</div>
                        </td>

                        {/* 3. Separation Type */}
                        <td>{r.termination || '—'}</td>

                        {/* 4. Length of Service */}
                        <td>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">নিয়োগ</div>
                            <div className="fsl-line-value">{bnDate(r.joining)}</div>
                        </div>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">শেষ কর্মদিবস</div>
                            <div className="fsl-line-value">{bnDate(r.lastAttendance)}</div>
                        </div>
                        <div className="fsl-sep">{bn(r.service)}</div>
                        </td>

                        {/* 5. Salary Payable */}
                        <td>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">দিন</div>
                            <div className="fsl-line-value">{bnNum(r.payableDays)}</div>
                        </div>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">টাকা</div>
                            <div className="fsl-line-value">{bnMoney(r.salaryAmount)}</div>
                        </div>
                        </td>

                        {/* 6. Overtime Payable */}
                        <td>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">ঘণ্টা</div>
                            <div className="fsl-line-value">{bnNum(r.otHours)}</div>
                        </div>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">টাকা</div>
                            <div className="fsl-line-value">{bnMoney(r.otAmount)}</div>
                        </div>
                        </td>

                        {/* 7. Earned Leave Encashment */}
                        <td>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">দিন</div>
                            <div className="fsl-line-value">{bnNum(r.elDays)}</div>
                        </div>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">টাকা</div>
                            <div className="fsl-line-value">{bnMoney(r.elAmount)}</div>
                        </div>
                        </td>

                        {/* 8. Compensation & Benefits */}
                        <td>
                        <div className="fsl-line-item">
                            <div className="fsl-line-label">সুবিধাপ্রাপ্ত বছর</div>
                            <div className="fsl-line-value">{bnNum(r.benefitYears)}</div>
                        </div>

                        {(r.serviceComp > 0 || r.gratuity === 0) && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">চাকরি অবসান ক্ষতিপূরণ</div>
                            <div className="fsl-line-value">{bnMoney(r.serviceComp)}</div>
                            </div>
                        )}

                        {(r.deathComp > 0 || (r.isDeath && r.gratuity === 0)) && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">মৃত্যুজনিত ক্ষতিপূরণ</div>
                            <div className="fsl-line-value">{bnMoney(r.deathComp)}</div>
                            </div>
                        )}

                        {r.gratuity > 0 && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">গ্র্যাচুইটি</div>
                            <div className="fsl-line-value">{bnMoney(r.gratuity)}</div>
                            </div>
                        )}

                        {r.layOff > 0 && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">লে-অফ ক্ষতিপূরণ</div>
                            <div className="fsl-line-value">{bnMoney(r.layOff)}</div>
                            </div>
                        )}

                        {r.noticePay > 0 && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">নোটিশ পে</div>
                            <div className="fsl-line-value">{bnMoney(r.noticePay)}</div>
                            </div>
                        )}

                        {r.others > 0 && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">অন্যান্য</div>
                            <div className="fsl-line-value">{bnMoney(r.others)}</div>
                            </div>
                        )}
                        </td>

                        {/* 9. Deductions */}
                        <td>
                        {!hasDeduction && <div className="fsl-c">—</div>}

                        {(r.noticeDeduction > 0 || r.noticeDeductionDays > 0) && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">
                                নোটিশ ({bnNum(r.noticeDeductionDays)} দিন)
                            </div>
                            <div className="fsl-line-value">{bnMoney(r.noticeDeduction)}</div>
                            </div>
                        )}

                        {r.advance > 0 && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">
                                অগ্রিম{r.advanceNote ? ` (${r.advanceNote})` : ''}
                            </div>
                            <div className="fsl-line-value">{bnMoney(r.advance)}</div>
                            </div>
                        )}

                        {r.otherDeduction > 0 && (
                            <div className="fsl-line-item">
                            <div className="fsl-line-label">
                                অন্যান্য{r.otherDeductionNote ? ` (${r.otherDeductionNote})` : ''}
                            </div>
                            <div className="fsl-line-value">{bnMoney(r.otherDeduction)}</div>
                            </div>
                        )}
                        </td>

                        {/* 10. Total Net Payable */}
                        <td className="fsl-net">{bnMoney(r.net)}</td>

                        {/* 11. Employee Signature */}
                        <td className="fsl-sign" />
                    </tr>
                    );
              })}
              {rows.length > 0 && (
                <tr className="fsl-total">
                  <td colSpan={4} className="fsl-tl">সর্বমোট ({bn(rows.length)} জন)</td>
                  <td className="fsl-ta">{bnMoney(sum(r => r.salaryAmount))}</td>
                  <td className="fsl-ta">{bnMoney(sum(r => r.otAmount))}</td>
                  <td className="fsl-ta">{bnMoney(sum(r => r.elAmount))}</td>
                  <td className="fsl-ta">{bnMoney(sum(compEarnings))}</td>
                  <td className="fsl-ta">{bnMoney(sum(deductionsOf))}</td>
                  <td className="fsl-ta">{bnMoney(sum(r => r.net))}</td>
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

        .fsl-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; line-height: 1.45; color: #0f172a; font-variant-numeric: tabular-nums; }
        /* words are never split: wrapping happens only at spaces */
        .fsl-table th, .fsl-table td { border: 0.5px solid #1e293b; padding: 4px 5px; vertical-align: top; font-weight: 400; word-break: normal; overflow-wrap: normal; hyphens: none; }
        .fsl-table th { background: #eef2f7; color: #0f172a; text-align: left; vertical-align: middle; font-weight: 600; font-size: 8.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fsl-table .fsl-c { text-align: center; }
        .fsl-table .fsl-mute { color: #475569; }
        .fsl-table .fsl-name { color: #000; margin-bottom: 1px; }
        .fsl-table .fsl-ln { display: flex; justify-content: space-between; align-items: baseline; gap: 5px; }
        .fsl-table .fsl-lb { flex: 1 1 auto; min-width: 0; color: #475569; font-size: 8.5px; }
        .fsl-table .fsl-v { flex: none; margin-left: auto; text-align: right; color: #000; white-space: nowrap; }
        .fsl-table .fsl-sep { margin-top: 2px; padding-top: 2px; border-top: 0.5px dotted #94a3b8; }
        .fsl-table .fsl-net { text-align: right; middle; font-size: 9.5px; color: #000; white-space: nowrap; }
        .fsl-table .fsl-sign { height: 50px; }
        .fsl-table .fsl-empty { text-align: center; padding: 16px; color: #475569; }
        .fsl-table tr.fsl-total td { border-top: 1.2px solid #0f172a; background: #f8fafc; padding: 5px; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fsl-table .fsl-tl { text-align: right; }
        .fsl-table .fsl-ta { text-align: right; }

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