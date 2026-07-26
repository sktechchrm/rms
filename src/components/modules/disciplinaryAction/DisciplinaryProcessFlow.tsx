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
// CARRIED FORWARD (4th round): connected box-and-arrow FLOWCHART shape,
// each node showing the step's ACTUAL recorded date.
// Path: src/components/modules/disciplinaryAction/DisciplinaryProcessFlow.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import type { DisciplinaryActionData } from './types';
import { formatDateBn, calculateNotice4Date } from './types';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';

const font = "'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif";

interface Props {
  data: DisciplinaryActionData;
  festivalHolidays: string[];
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

export const DisciplinaryProcessFlow: React.FC<Props> = ({ data, festivalHolidays }) => {
  const notice4Date = calculateNotice4Date(data.evaluationDate, festivalHolidays);
  const caseClosedEarly = data.replyStatus === 'সন্তোষজনক';
  const caseContinuing = data.replyStatus === 'অসন্তোষজনক';
  const decided = !!data.replyStatus;

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

  return (
    <div className="pf-page">
      <div className="pf-wrap">

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
              <div className="pf-flow-end">🏁 প্রক্রিয়া সম্পন্ন</div>
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
        }
        .pf-wrap { display: flex; flex-direction: column; }

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