// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryProcessFlow.tsx — REBUILT (2nd round): now a printable case
// TIMELINE / SUMMARY SHEET meant to be printed and kept together with the
// physical file, instead of a static reference diagram. Each step shows its
// ACTUAL recorded date (pulled from `data`), so the sheet documents exactly
// when each stage of the case happened — not just what the process is.
// Source file names removed (per explicit request) — not useful on a
// printed document, only inside the codebase.
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

interface RowDef {
  step: number;
  stage: string;      // ধাপ label
  title: string;       // step title
  description: string; // one-line plain description
  date: string;         // raw date string (may be empty)
  output: string;       // notice/output this step produces
}

export const DisciplinaryProcessFlow: React.FC<Props> = ({ data, festivalHolidays }) => {
  const notice4Date = calculateNotice4Date(data.evaluationDate, festivalHolidays);
  const caseClosedEarly = data.replyStatus === 'সন্তোষজনক';

  const rows: RowDef[] = [
    {
      step: 1, stage: 'ধাপ ১', title: 'কারণ দর্শানো',
      description: 'কারণ দর্শানোর নোটিশ জারি করা হয়।',
      date: data.showCauseDate, output: 'নোটিশ ১',
    },
    {
      step: 2, stage: 'ধাপ ২', title: 'জবাব ও অবস্থা',
      description: data.replyStatus
        ? `কর্মীর জবাব "${data.replyStatus}" হিসেবে চিহ্নিত হয়েছে।`
        : 'কর্মীর জবাব যাচাই করা হয়।',
      date: data.replyDate, output: data.replyStatus || '—',
    },
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
          <h2 className="pf-title">শৃঙ্খলামূলক ব্যবস্থা — কার্যধারার সারসংক্ষেপ</h2>
          <div className="pf-meta">
            {data.referenceNo && <span>সূত্রঃ <strong>{data.referenceNo}</strong></span>}
          </div>
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

        {/* ══ TIMELINE TABLE ═══════════════════════════════════ */}
        <table className="pf-tbl">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ধাপ</th>
              <th style={{ width: '38%' }}>বিবরণ</th>
              <th style={{ width: '18%' }}>তারিখ</th>
              <th style={{ width: '18%' }}>ফলাফল</th>
              <th style={{ width: '18%' }}>অবস্থা</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              // Steps after ধাপ ২ don't apply once the reply was সন্তোষজনক.
              const suppressed = caseClosedEarly && r.step > 2;
              const hasDate = !!r.date;

              return (
                <tr key={r.step} className={suppressed ? 'pf-row-muted' : ''}>
                  <td className="pf-cell-step">
                    <span className="pf-step-badge">{r.step}</span>
                  </td>
                  <td>
                    <div className="pf-cell-title">{r.title}</div>
                    <div className="pf-cell-desc">{r.description}</div>
                  </td>
                  <td className="pf-cell-date">
                    {suppressed ? '—' : (hasDate ? `${formatDateBn(r.date)} ইং` : '—')}
                  </td>
                  <td className="pf-cell-output">
                    {suppressed ? '—' : (r.output === '—' ? '—' : r.output)}
                  </td>
                  <td>
                    {suppressed ? (
                      <span className="pf-status pf-status-na">প্রযোজ্য নয়</span>
                    ) : r.step === 2 && data.replyStatus === 'সন্তোষজনক' ? (
                      <span className="pf-status pf-status-done">সমাপ্ত</span>
                    ) : r.step === 2 && data.replyStatus === 'অসন্তোষজনক' ? (
                      <span className="pf-status pf-status-progress">চলমান</span>
                    ) : hasDate ? (
                      <span className="pf-status pf-status-done">সম্পন্ন</span>
                    ) : (
                      <span className="pf-status pf-status-pending">অসম্পন্ন</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {caseClosedEarly && (
          <div className="pf-note">
            ✓ কর্মীর জবাব সন্তোষজনক বিবেচিত হওয়ায় ধাপ ২-এ কেসটি সমাপ্ত হয়েছে — পরবর্তী ধাপগুলো প্রযোজ্য হয়নি।
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        .pf-page, .pf-page * { font-family: ${font}; box-sizing: border-box; }

        .pf-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 16mm 16mm 14mm;
        }
        .pf-wrap { display: flex; flex-direction: column; }

        .pf-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 12px; }
        .pf-co-name { font-size: 19px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
        .pf-co-addr { font-size: 12.5px; color: #374151; margin: 0; }

        .pf-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #d1d5db; margin-bottom: 14px; flex-wrap: wrap; gap: 6px; }
        .pf-title { font-size: 15px; font-weight: 700; margin: 0; color: #1e3a5f; }
        .pf-meta { font-size: 12.5px; color: #374151; }

        .pf-emp-box { border: 1.5px solid #1e3a5f; border-radius: 6px; overflow: hidden; margin-bottom: 18px; max-width: 460px; }
        .pf-emp-box-head { background: #1e3a5f; color: #fff; font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px; padding: 5px 12px; }
        .pf-emp-col { padding: 8px 12px; }
        .pf-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .pf-emp-tbl td { padding: 3px 6px; vertical-align: top; line-height: 1.5; }
        .pf-emp-tbl td:nth-child(1), .pf-emp-tbl td:nth-child(3) { font-weight: 600; color: #475569; white-space: nowrap; width: 15%; }
        .pf-emp-tbl td:nth-child(1)::after, .pf-emp-tbl td:nth-child(3)::after { content: ':'; margin-right: 2px; }
        .pf-emp-tbl td:nth-child(2), .pf-emp-tbl td:nth-child(4) { width: 35%; }

        .pf-tbl {
          width: 100%; border-collapse: collapse; table-layout: fixed;
          font-size: 12px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;
        }
        .pf-tbl thead tr { background: #1e3a5f; }
        .pf-tbl th {
          padding: 9px 10px; font-weight: 700; font-size: 11.5px; color: #fff;
          text-align: left; letter-spacing: 0.2px; border-right: 1px solid rgba(255,255,255,0.15);
        }
        .pf-tbl th:last-child { border-right: none; }
        .pf-tbl td {
          padding: 9px 10px; border-right: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0;
          vertical-align: top; color: #1f2937;
        }
        .pf-tbl td:last-child { border-right: none; }
        .pf-tbl tbody tr:nth-child(even) { background: #f8fafc; }
        .pf-tbl tbody tr.pf-row-muted { color: #94a3b8; background: #f8fafc; }
        .pf-tbl tbody tr.pf-row-muted td { color: #94a3b8; }

        .pf-cell-step { text-align: center; }
        .pf-step-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%; background: #1e3a5f; color: #fff;
          font-weight: 700; font-size: 12px;
        }
        .pf-row-muted .pf-step-badge { background: #cbd5e1; }

        .pf-cell-title { font-weight: 700; font-size: 12.5px; color: #111827; margin-bottom: 2px; }
        .pf-row-muted .pf-cell-title { color: #94a3b8; }
        .pf-cell-desc { font-size: 11px; line-height: 1.5; color: #64748b; }
        .pf-cell-date { font-weight: 600; white-space: nowrap; }
        .pf-cell-output { font-weight: 600; }

        .pf-status {
          display: inline-block; font-size: 10.5px; font-weight: 700; border-radius: 999px;
          padding: 2px 9px; white-space: nowrap;
        }
        .pf-status-done     { color: #15803d; background: #f0fdf4; border: 1px solid #86efac; }
        .pf-status-progress { color: #c2410c; background: #fff7ed; border: 1px solid #fdba74; }
        .pf-status-pending  { color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; }
        .pf-status-na       { color: #94a3b8; background: #f8fafc; border: 1px dashed #e2e8f0; }

        .pf-note {
          margin-top: 14px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #86efac;
          border-radius: 8px; font-size: 12px; color: #15803d; font-weight: 600; line-height: 1.6;
        }

        .pf-footer { margin-top: 24px; text-align: right; font-size: 11px; color: #94a3b8; }

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
          .pf-tbl { font-size: 9.5pt !important; }
          .pf-tbl thead tr, .pf-tbl th {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            background: #1e3a5f !important; color: #fff !important;
          }
          .pf-status-done, .pf-status-progress, .pf-status-pending, .pf-status-na {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
          .pf-tbl { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};

export default DisciplinaryProcessFlow;