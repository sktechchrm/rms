// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryNoticeLetter.tsx — reuses Left Worker Notice's visual/print
// CSS structure. REBUILT (3rd round): manual notice dates (was
// auto-filled from data.date before), Bengali-digit date formatting
// throughout, business-day-aware investigation deadline, and a 4th
// output type — "evaluation" (প্রতিবেদন ও সুপারিশ, from ধাপ ৫ মূল্যায়ন).
// Path: src/components/modules/disciplinaryAction/DisciplinaryNoticeLetter.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import type { DisciplinaryActionData } from './types';
import { calculateRepresentativeCount, formatDateBn } from './types';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { addDaysSkippingHolidays } from '../../../utils/businessDays';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';

interface Props {
  data: DisciplinaryActionData;
  notice: 1 | 2 | 3 | 'evaluation';
  authorization: AuthorizationState;
  festivalHolidays: string[];
}

export const DisciplinaryNoticeLetter: React.FC<Props> = ({ data, notice, authorization, festivalHolidays }) => {
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const repCount     = calculateRepresentativeCount(memberCount);
  const deadline     = addDaysSkippingHolidays(data.showCauseDate, 50, festivalHolidays);
  const isSuspension = data.subject === 'অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।';

  const copyList = ['শ্রমিকের ব্যক্তিগত নথি।', 'সংশ্লিষ্ট ব্যক্তি।'];

  // MANUAL notice dates now (confirmed) — never auto-filled from today.
  // Notice 1 uses কারণ দর্শানোর তারিখ directly (confirmed identical to
  // the old, now-removed separate নোটিশ ১ ইস্যু তারিখ field).
  const noticeDate =
    notice === 1 ? data.showCauseDate :
    notice === 2 ? data.notice2Date :
    notice === 3 ? data.notice3Date :
    data.evaluationDate;

  return (
    <div className="nl-page">
      <div className="nl-wrap">

        {/* ══ HEADER ══════════════════════════════════════ */}
        <div className="nl-header">
          {data.factoryName && <h1 className="nl-co-name">{data.factoryName}</h1>}
          {data.factoryAddress && <p className="nl-co-addr">{data.factoryAddress}</p>}
        </div>

        {/* ══ REFERENCE + DATE (Bengali digits) ═══════════════════════════════ */}
        <div className="nl-title-bar">
          <h2 className="nl-title">সূত্রঃ {data.referenceNo || '_____/_____/_____'}</h2>
          <div className="nl-meta">
            <span className="nl-meta-date">তারিখ :&nbsp;<strong>{formatDateBn(noticeDate)} ইং</strong></span>
          </div>
        </div>

        {/* ══ EMPLOYEE INFO (Notice 1 & 2 only) ══════════════ */}
        {(notice === 1 || notice === 2) && (
          <div className="nl-emp-box">
            <div className="nl-emp-col">
              <table className="nl-emp-tbl"><tbody>
                <tr><td>নাম</td><td>{data.employeeName || '—'}</td></tr>
                <tr><td>পদবী</td><td>{data.designation || '—'}</td></tr>
                <tr><td>কার্ড নং</td><td>{data.cardNo || '—'}</td></tr>
                <tr><td>সেকশন</td><td>{data.section || '—'}</td></tr>
              </tbody></table>
            </div>
          </div>
        )}

        {/* ══ SUBJECT ═════════════════════════════════════════ */}
        <p className="nl-subject">
          বিষয়ঃ {notice === 1 && ( <u><strong>{data.subject}</strong></u>)}
        </p>

        {/* ══ TO ══════════════════════════════════════════ */}
        <p className="nl-salute">জনাব/জনাবা,</p>

        {/* ══ NOTICE BODY ═════════════════════════════════════ */}
        <div className="nl-body">
          {notice === 1 && (
            <>
              <p className="nl-para">আপনার বিরুদ্ধে অভিযোগ যে, {data.complaint || '_____'}</p>
              <p className="nl-para">আপনার এহেন কর্মকান্ড কোম্পানী নিয়মের সম্পূর্ণ পরিপন্থি ও বাংলাদেশ শ্রম আইন ২০০৬ মোতাবেক অসদাচরণের আওতায় পড়ে।</p>
              <p className="nl-para">সুতরাং উপরোক্ত কর্মকান্ডের প্রেক্ষিতে আপনার বিরুদ্ধে কেন আইনানুগ ব্যবস্থা গ্রহণ করা হবে না তাহার লিখিত জবাব আগামী ০৭ কর্মদিবসের মধ্যে নিম্ন স্বাক্ষরকারীগণের নিকট প্রদান করার জন্য নির্দেশ প্রদান করা হইল।</p>
              {isSuspension && (
                <>
                  <p className="nl-para">উল্লেখ্য যে পরবর্তী নির্দেশনা না দেওয়া পর্যন্ত আপনি অস্থায়ীভাবে কর্ম থেকে ছুটিত থাকবেন।</p>
                </>
              )}
            </>
          )}

          {notice === 2 && (
            <>
              <p className="nl-para">
                আপনার বিরুদ্ধে গত <u><strong>{formatDateBn(data.showCauseDate)}</strong></u> ইং তারিখে উত্থাপিত অভিযোগের ভিত্তিতে আপনার
                {' '}<u><strong>{formatDateBn(data.replyDate)}</strong></u> ইং তারিখের জবাব কর্তৃপক্ষের নিকট সন্তোষজনক হয়নি বিধায় উক্ত অভিযোগটির
                সঠিক তদন্ত কার্যক্রম পরিচালনার সিদ্ধান্ত গ্রহণ করা হয়েছে।
              </p>
              <p className="nl-para">
                এই মর্মে আপনাকে আগামী ৪ দিনের মধ্যে আপনার মনোনীত <u><strong>{toBanglaNumber(repCount)}</strong></u> জন
                প্রতিনিধির তালিকা নিম্ন স্বাক্ষরকারী কর্তৃপক্ষের নিকট প্রদান করার জন্য বলা হয়েছে।
              </p>
              <p className="nl-para">উল্লেখ্য যে যথা সময়ে প্রতিনিধি মনোনয়নে ব্যর্থ হলে তদন্তকার্যক্রমটি একতরফাভাবে পরিচালিত হবে।</p>
            </>
          )}

          {notice === 3 && (
            <>
              <p className="nl-para">
                আপনাদেরকে এই মর্মে অবগত করা হচ্ছে যে, গত <u><strong>{formatDateBn(data.showCauseDate)}</strong></u> ইং তারিখে
                জনাব/জনাবা <u><strong>{data.employeeName || '—'}</strong></u> (কার্ড নং: {data.cardNo || '—'}, {data.designation || '—'},
                {' '}{data.section || '—'})-এর বিরুদ্ধে উত্থাপিত অভিযোগের ভিত্তিতে তদন্ত পরিচালনা কমিটিতে মনোনয়ন প্রদান করা হয়েছে।
              </p>
              <p className="nl-para">
                সুতরাং আপনারা আগামী <u><strong>{formatDateBn(deadline)}</strong></u> ইং তারিখের মধ্যে তদন্ত কার্যক্রমটি সংক্ষুক্তভাবে
                নিরপেক্ষতার ভিত্তিতে কোন প্রকার স্বার্থের সংঘর্ষ (Conflict of interest) ব্যতিত সম্পন্ন করার জন্য নির্দেশ প্রদান করা হয়েছে।
              </p>

              <p className="nl-para" style={{ fontWeight: 700, textDecoration: 'underline', marginTop: 14 }}>কমিটির তালিকাঃ</p>
              <table className="nl-emp-tbl" style={{ width: '100%', marginTop: 6 }}>
                <thead>
                  <tr>
                    <td style={{ fontWeight: 700, borderBottom: '1px solid #374151' }}>ক্র.</td>
                    <td style={{ fontWeight: 700, borderBottom: '1px solid #374151' }}>নাম</td>
                    <td style={{ fontWeight: 700, borderBottom: '1px solid #374151' }}>কার্ড নং</td>
                    <td style={{ fontWeight: 700, borderBottom: '1px solid #374151' }}>পদবী</td>
                    <td style={{ fontWeight: 700, borderBottom: '1px solid #374151' }}>সেকশন</td>
                  </tr>
                </thead>
                <tbody>
                  {data.committeeMembers.map((m, i) => (
                    <tr key={i}>
                      <td>{toBanglaNumber(m.slNo)}</td>
                      <td>{m.name || '—'}</td>
                      <td>{m.cardNo || '—'}</td>
                      <td>{m.designation || '—'}</td>
                      <td>{m.section || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {notice === 'evaluation' && (
            <>
              <p className="nl-para">
                জনাব/জনাবা <u><strong>{data.employeeName || '—'}</strong></u> (কার্ড নং: {data.cardNo || '—'})-এর বিরুদ্ধে গঠিত তদন্ত কমিটি
                তদন্ত কার্যক্রম সম্পন্ন করে নিম্নরূপ প্রতিবেদন ও সুপারিশ পেশ করেছে।
              </p>
              <table className="nl-emp-tbl" style={{ width: '100%', marginTop: 6 }}>
                <tbody>
                  <tr><td style={{ fontWeight: 700, width: '30%', verticalAlign: 'top' }}>প্রতিবেদন সারাংশ</td><td>{data.investigationReportSummary || '—'}</td></tr>
                  <tr><td style={{ fontWeight: 700, verticalAlign: 'top' }}>সুপারিশ</td><td>{data.recommendation || '—'}</td></tr>
                  <tr><td style={{ fontWeight: 700, verticalAlign: 'top' }}>চূড়ান্ত সিদ্ধান্ত</td><td>{data.finalDecision || '—'}</td></tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ══ COPY LIST (Notice 1 & 2 only) ══ */}
        {(notice === 1 || notice === 2) && (
          <div className="nl-copy">
            <p><strong><u>অনুলিপি :</u></strong></p>
            <ol>
              {copyList.map((item, i) => <li key={i}><span>{toBanglaNumber(i + 1)}.</span>{item}</li>)}
            </ol>
          </div>
        )}

        {/* ══ SIGNATURE ═══════════════════════════════════════ */}
        <div className="nl-footer">
          <p className="nl-authority">নির্দেশক্রমে,</p>
          <PrintSignatureRow value={authorization} lang="bn" hidePrepared hideTopBorder />
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        .nl-page, .nl-page * { font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif; box-sizing: border-box; }

        .nl-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 18mm 16mm;
        }
        .nl-wrap { display: flex; flex-direction: column; min-height: calc(297mm - 36mm); gap: 0; }

        .nl-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 10px; }
        .nl-co-name { font-size: 20px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
        .nl-co-addr { font-size: 13px; color: #374151; margin: 0; }

        .nl-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 6px; border-bottom: 1px dashed #d1d5db; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
        .nl-title { font-size: 13px; font-weight: 600; margin: 0; color: #111827; }
        .nl-meta { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; gap: 2px; }
        .nl-meta-date { color: #374151; }

        .nl-salute { font-size: 14px; font-weight: 600; margin: 8px 0 10px; }

        .nl-emp-box { display: flex; gap: 0; border: 1.5px solid #374151; border-radius: 5px; overflow: hidden; margin-bottom: 14px; max-width: 320px; }
        .nl-emp-col { flex: 1; padding: 10px 12px; }
        .nl-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .nl-emp-tbl td { padding: 2px 4px 2px 0; vertical-align: top; line-height: 1.5; }
        .nl-emp-tbl td:first-child { font-weight: 600; white-space: nowrap; padding-right: 6px; width: 38%; }
        .nl-emp-tbl td:first-child::after { content: ':'; }

        .nl-subject { font-weight: 700; font-size: 13.5px; line-height: 1.7; margin: 0 0 6px; }

        .nl-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 0; margin-bottom: 14px; }
        .nl-para { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 12px; }

        .nl-copy { font-size: 13px; margin-bottom: 12px; }
        .nl-copy p { margin: 0 0 4px; }
        .nl-copy ol { list-style: none; padding: 0; margin: 0; }
        .nl-copy li { display: flex; gap: 6px; margin-bottom: 2px; }
        .nl-copy li span { font-weight: 600; flex-shrink: 0; }

        .nl-footer { margin-top: auto; padding-top: 8px; }
        .nl-authority { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; }

        ${BASE_PRINT_CSS}

        @media print {
          @page { size: A4 portrait; margin: 14mm 15mm 14mm 15mm; }
          body * { visibility: hidden !important; }
          .nl-page, .nl-page * { visibility: visible !important; }
          .nl-page {
            position: absolute !important; inset: 0 !important; width: 100% !important;
            min-height: unset !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border-radius: 0 !important; background: white !important;
          }
          .nl-wrap { min-height: calc(297mm - 28mm) !important; height: calc(297mm - 28mm) !important; page-break-inside: avoid !important; }
          .nl-body { flex: 1 !important; justify-content: flex-start !important; margin-bottom: 10pt !important; }
          .nl-para { font-size: 10pt !important; line-height: 1.75 !important; }
          .nl-footer { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};
