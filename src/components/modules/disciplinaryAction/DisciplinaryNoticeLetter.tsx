// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryNoticeLetter.tsx — reuses Left Worker Notice's visual/print
// CSS structure.
//
// REBUILT (4th round): added Notice 4 — চূড়ান্ত সিদ্ধান্ত অবহিতকরণ,
// structured like Notice 1 (employee info box + subject + body + copy
// list + standard authority signature), formally communicating
// data.finalDecision to the employee. Notice 4's date is NOT a stored
// field — it's derived fresh via calculateNotice4Date() as the next
// business day after evaluationDate (skipping Friday + festival
// holidays), same math as Notice 3's investigation deadline.
//
// UPDATE (this round): নোটিশ ১-এর অভিযোগ (data.complaint) now also runs
// through renderRichText() — ShowCauseForm's অভিযোগ field just gained the
// same Bold/Italic/Bullet/Numbered toolbar as চূড়ান্ত সিদ্ধান্ত and
// মূল্যায়ন, so the print output needs to parse it the same way or any
// formatting typed there would be silently dropped on the printed notice.
//
// CARRIED FORWARD from prior rounds:
// - Evaluation output's signature no longer shows "নির্দেশক্রমে," above
//   the investigation-committee signature row (the committee signs its
//   own report, it isn't issuing an order on someone else's behalf).
// - সূত্র নং is now dynamic per notice type instead of a static blank
//   placeholder — auto-generated as
//   FactoryCode (space-separated initials) / TypeCode-CardSerial / Date,
//   e.g. "এম জি এস এল/EV-২৩০৫৫/১৪-০৭-২০২৬" — falling back only when
//   data.referenceNo hasn't been manually filled in.
// Path: src/components/modules/disciplinaryAction/DisciplinaryNoticeLetter.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import type { DisciplinaryActionData } from './types';
import { calculateRepresentativeCount, formatDateBn, calculateNotice4Date } from './types';
import { renderRichText } from './richTextRender';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { addDaysSkippingHolidays } from '../../../utils/businessDays';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';

interface Props {
  data: DisciplinaryActionData;
  notice: 1 | 2 | 3 | 4 | 'evaluation';
  authorization: AuthorizationState;
  festivalHolidays: string[];
}

// ── Bengali-digit helper (kept local/independent of toBanglaNumber so
//    leading zeros and separators in dd-mm-yyyy are preserved exactly). ──
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

// ── Factory code: initials of factoryName words, space-separated,
//    e.g. "মেসার্স জিএমএস লিমিটেড" → "এম জি এস এল" style. ──
const getFactoryCode = (name?: string): string => {
  if (!name || !name.trim()) return '___';
  const code = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join(' ')
    .toUpperCase();
  return code || '___';
};

// ── Per-notice-type short code used inside the reference. ──
const NOTICE_TYPE_CODE: Record<'1' | '2' | '3' | '4' | 'evaluation', string> = {
  '1': 'SC',   // শোকজ / কারণ দর্শানোর নোটিশ
  '2': 'IN',   // তদন্ত সংক্রান্ত নোটিশ
  '3': 'IC',   // তদন্ত কমিটি নোটিশ
  '4': 'FD',   // চূড়ান্ত সিদ্ধান্ত অবহিতকরণ
  evaluation: 'EV', // মূল্যায়ন / প্রতিবেদন
};

// ── Builds সূত্র নং as FactoryCode/TypeCode-CardSerial/DD-MM-YYYY (Bengali digits).
//    Only used when data.referenceNo isn't manually provided, so manual entry
//    still overrides auto-generation if the user fills it in. ──
const buildReferenceNo = (
  data: DisciplinaryActionData,
  notice: 1 | 2 | 3 | 4 | 'evaluation',
  dateStr?: string
): string => {
  const factoryCode = getFactoryCode(data.factoryName);
  const typeCode = NOTICE_TYPE_CODE[String(notice) as '1' | '2' | '3' | '4' | 'evaluation'];
  const serial = data.cardNo ? toBnDigits(String(data.cardNo)) : '___';

  let dateCode = '__-__-____';
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      dateCode = toBnDigits(`${dd}-${mm}-${yyyy}`);
    }
  }

  return `${factoryCode}/${typeCode}-${serial}/${dateCode}`;
};

export const DisciplinaryNoticeLetter: React.FC<Props> = ({ data, notice, authorization, festivalHolidays }) => {
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const repCount     = calculateRepresentativeCount(memberCount);
  const deadline     = addDaysSkippingHolidays(data.showCauseDate, 50, festivalHolidays);
  const isSuspension = data.subject === 'অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।';
  // Notice 4's issue date — next business day after evaluationDate,
  // never manually entered.
  const notice4Date  = calculateNotice4Date(data.evaluationDate, festivalHolidays);

  const copyList = ['শ্রমিকের ব্যক্তিগত নথি।', 'সংশ্লিষ্ট ব্যক্তি।'];

  // MANUAL notice dates now (confirmed) — never auto-filled from today,
  // EXCEPT Notice 4, which is always derived (see notice4Date above).
  // Notice 1 uses কারণ দর্শানোর তারিখ directly (confirmed identical to
  // the old, now-removed separate নোটিশ ১ ইস্যু তারিখ field).
  const noticeDate =
    notice === 1 ? data.showCauseDate :
    notice === 2 ? data.notice2Date :
    notice === 3 ? data.notice3Date :
    notice === 4 ? notice4Date :
    data.evaluationDate;

  // Dynamic সূত্র নং: auto-generated per notice type (factory code +
  // notice-type code + card serial + date), falls back to manual
  // data.referenceNo if that's been explicitly filled in.
  const referenceNo = data.referenceNo || buildReferenceNo(data, notice, noticeDate);

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
          <h2 className="nl-title">সূত্রঃ {referenceNo}</h2>
          <div className="nl-meta">
            <span className="nl-meta-date">তারিখ :&nbsp;<strong>{formatDateBn(noticeDate)} ইং</strong></span>
          </div>
        </div>

        {/* ══ EMPLOYEE INFO (Notice 1, 2 & 4) ══════════════ */}
        {(notice === 1 || notice === 2 || notice === 4) && (
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

        {/* ══ TO (above subject — Notice 3 & প্রতিবেদন ও সুপারিশ only) ══════ */}
        {notice === 3 && (
          <div className="nl-salute">
            <p style={{ margin: 0 }}>প্রতি,</p>
            <p style={{ margin: 0 }}>তদন্ত কমিটির সদস্যবৃন্দ।</p>
          </div>
        )}
        {notice === 'evaluation' && (
          <div className="nl-salute">
            <p style={{ margin: 0 }}>প্রতি,</p>
            <p style={{ margin: 0 }}>ব্যবস্থাপনা কর্তৃপক্ষ।</p>
          </div>
        )}

        {/* ══ SUBJECT ═════════════════════════════════════════ */}
        <p className="nl-subject">
          বিষয়ঃ {notice === 1 && ( <u><strong>{data.subject}</strong></u>)}
          {notice === 2 && ( <u><strong>তদন্ত কমিটিতে প্রতিনিধি মনোনয়ন প্রসঙ্গে।</strong></u>)}
          {notice === 3 && ( <u><strong>তদন্ত কমিটিতে সদস্য মনোনীতকরণ প্রসঙ্গে।।</strong></u>)}
          {notice === 4 && ( <u><strong>শৃঙ্খলামূলক ব্যবস্থা গ্রহণ সংক্রান্ত চূড়ান্ত সিদ্ধান্ত অবহিতকরণ।</strong></u>)}
          {notice === 'evaluation' && (<u>অভিযোগ সূত্রঃ <u style={{ whiteSpace: 'nowrap' }}>{buildReferenceNo(data, 1, data.showCauseDate)}</u>-এর <strong>প্রেক্ষিতে তদন্ত প্রতিবেদন দাখিল।</strong></u>)}
        </p>

        {/* ══ TO (below subject — all notices) ══════════════ */}
        <p className="nl-salute">জনাব/জনাবা,</p>

        {/* ══ NOTICE BODY ═════════════════════════════════════ */}
        <div className="nl-body">
          {notice === 1 && (
            <>
              <p className="nl-para">আপনার বিরুদ্ধে অভিযোগ যে,</p>
              <div className="nl-para">{data.complaint ? renderRichText(data.complaint, 'complaint') : '_____'}</div>
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
              <table className="nl-committee-tbl">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>ক্রমিক</th>
                    <th style={{ width: '25%' }}>নাম</th>
                    <th style={{ width: '20%' }}>কার্ড নং</th>
                    <th style={{ width: '20%' }}>পদবী</th>
                    <th style={{ width: '20%' }}>সেকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {data.committeeMembers.map((m, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{toBanglaNumber(m.slNo)}</td>
                      <td>{m.name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{m.cardNo || '—'}</td>
                      <td>{m.designation || '—'}</td>
                      <td>{m.section || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {notice === 4 && (
            <>
              <p className="nl-para">
                আপনাকে জানানো যাচ্ছে যে, আপনার বিরুদ্ধে উত্থাপিত অভিযোগের প্রেক্ষিতে গঠিত তদন্ত কমিটি নিরপেক্ষ ও বিস্তারিত তদন্ত সম্পন্ন করেছে। <br></br> <br></br>
                উক্ত তদন্ত কার্যক্রমের বিবরণী ও ফলাফল নিম্নরূপ:
              </p>
              <div className="nl-para">{data.finalDecision ? renderRichText(data.finalDecision, 'fd4') : '_____'}</div>
              <p className="nl-para">
                উপরে উল্লেখিত তদন্ত কমিটির দাখিলকৃত রিপোর্ট, প্রমাণাদি এবং সার্বিক পর্যবেক্ষণ সূক্ষ্মভাবে পর্যালোচনা করে ব্যবস্থাপনা কর্তৃপক্ষ নিশ্চিত হয়েছে যে, আনীত অভিযোগসমূহ শতভাগ সত্য এবং প্রমাণিত। আপনার এহেন আচরণ প্রতিষ্ঠানের নিয়মনীতি ও কর্মক্ষেত্রের শৃঙ্খলাবিধির মারাত্মক লঙ্ঘন।<br></br> <br></br>
                অতএব, তদন্ত কমিটির সুপারিশ ও অপরাধের গুরুত্ব বিবেচনা করে ব্যবস্থাপনা কর্তৃপক্ষ আপনাকে চাকরি থেকে "সরাসরি অপসারন/বরখাস্ত" করার চূড়ান্ত সিদ্ধান্ত গ্রহণ করেছে। <br></br> <br></br>
                উক্ত সিদ্ধান্ত অত্র পত্র প্রাপ্তির তারিখ থেকে কার্যকর হবে। আপনাকে আপনার হিসাব সংক্রান্ত চূড়ান্ত পাওনাদী (যদি থাকে) নিষ্পত্তির জন্য নিয়ম অনুযায়ী আগামী ১৫ দিনের মধ্যে মানবসম্পদ ও হিসাব বিভাগের সাথে যোগাযোগ করার জন্য নির্দেশ প্রদান করা হলো।
              </p>
            </>
          )}

          {notice === 'evaluation' && (
            <>
              <p className="nl-para">
                গত {formatDateBn(data.notice3Date)} ইং তারিখে জারিকৃত নোটিশের আলোকে আমরা নিম্নস্বাক্ষরকারীগণ অভিযুক্ত {data.designation} {' '}
                <strong>{data.employeeName}-{data.cardNo}</strong> এর বিরুদ্ধে আনীত অভিযোগের নিরপেক্ষ তদন্তের জন্য কমিটি সদস্য হিসেবে দায়িত্ব প্রাপ্ত হই।
                দায়িত্ব গ্রহণের পর কালক্ষেপণ না করে তদন্ত কমিটি ঘটনার সার্বিক সত্যতা উদঘাটনে প্রাপ্ত লিখিত ও মৌখিক সাক্ষ্য, সিস্টেম ভিত্তিক তথ্য সংগ্রহ এবং সংশ্লিষ্ট অন্যান্য 
                আলামত সূক্ষ্মভাবে পর্যবেক্ষণ করে আজ {formatDateBn(data.evaluationDate)} ইং তারিখে তদন্ত কার্যক্রম সম্পন্ন করেছে। <br></br> <br></br>
                <strong>নিচে তদন্তের বিস্তারিত বিবরণ ও সিদ্ধান্ত উপস্থাপন করা হলো:</strong>
              </p>

              <div className="nl-eval-section">
                <p className="nl-eval-label"><strong><u>তদন্তে প্রাপ্ত জবানবন্দি ও সাক্ষ্য-প্রমণ:</u></strong></p>
                <div className="nl-eval-text">{data.investigationReportSummary ? renderRichText(data.investigationReportSummary, 'sum') : '—'}</div>
                <hr className="nl-eval-divider" />
              </div>

              <div className="nl-eval-section">
                <p className="nl-eval-label"><strong><u>তদন্ত কমিটির মতামত ও সুপারিশ:</u></strong></p>
                <div className="nl-eval-text">{data.recommendation ? renderRichText(data.recommendation, 'rec') : '—'}</div>
                <hr className="nl-eval-divider" />
              </div>

              {/* <div className="nl-eval-section">
                <p className="nl-eval-label">চূড়ান্ত সিদ্ধান্ত:</p>
                <div className="nl-eval-text">{data.finalDecision ? renderRichText(data.finalDecision, 'fd') : '—'}</div>
                <hr className="nl-eval-divider" />
              </div> */}
            </>
          )}
        </div>

        {/* ══ COPY LIST (Notice 1, 2 & 4) ══ */}
        {(notice === 1 || notice === 2 || notice === 4) && (
          <div className="nl-copy">
            <p><strong><u>অনুলিপি :</u></strong></p>
            <ol>
              {copyList.map((item, i) => <li key={i}><span>{toBanglaNumber(i + 1)}.</span>{item}</li>)}
            </ol>
          </div>
        )}

        {/* ══ SIGNATURE ═══════════════════════════════════════ */}
        <div className="nl-footer">
          {notice === 'evaluation' ? (
            // Evaluation output signs off with the INVESTIGATION
            // COMMITTEE's own members, not the standard authority
            // signature block — the committee is the body that produced
            // this report/recommendation, so their names (from ধাপ ৪
            // তদন্ত কমিটি) appear here, each as its own signature column
            // with name + designation, matching the reference layout.
            // No "নির্দেশক্রমে," heading — the committee is reporting
            // its own findings, not issuing an order.
            <>
              {data.committeeMembers.length > 0 && (
                <div className="nl-committee-sig-row">
                  {data.committeeMembers.map((m, i) => (
                    <div className="nl-committee-sig-col" key={i}>
                      <div className="nl-committee-sig-name">{m.name || '—'}</div>
                      <div className="nl-committee-sig-desig">
                        {m.designation || '—'}
                        {m.section ? ` (${m.section})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Notices 1, 2, 3, and 4 all use the standard authority
            // signature — Notice 4 communicates the FINAL DECISION as
            // issued by the authority (per the committee's report), not
            // the committee itself signing off.
            <>
              <p className="nl-authority">নির্দেশক্রমে,</p>
              <PrintSignatureRow value={authorization} lang="bn" hidePrepared hideTopBorder />
            </>
          )}
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

        .nl-salute { font-size: 14px; font-weight: 400; margin: 8px 0 10px; }

        .nl-emp-box { display: flex; gap: 0; border: 1.5px solid #374151; border-radius: 5px; overflow: hidden; margin-bottom: 14px; max-width: 320px; }
        .nl-emp-col { flex: 1; padding: 10px 12px; }
        .nl-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .nl-emp-tbl td { padding: 2px 4px 2px 0; vertical-align: top; line-height: 1.5; }
        .nl-emp-tbl td:first-child { font-weight: 600; white-space: nowrap; padding-right: 6px; width: 38%; }
        .nl-emp-tbl td:first-child::after { content: ':'; }

        .nl-subject { font-weight: 700; font-size: 13.5px; line-height: 1.7; margin: 0 0 6px; }

        /* কমিটির তালিকাঃ (Notice 3 committee list) — bordered, striped,
           professional table distinct from the plain nl-emp-tbl used for
           the employee-info box. */
        .nl-committee-tbl {
          width: 100%; border-collapse: collapse; table-layout: fixed;
          margin: 8px 0 14px; font-size: 12.5px;
          border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;
        }
        .nl-committee-tbl thead tr { background: #1e3a5f; }
        .nl-committee-tbl th {
          padding: 8px 10px; font-weight: 700; font-size: 12px; color: #fff;
          text-align: left; letter-spacing: 0.2px; border-right: 1px solid rgba(255,255,255,0.15);
        }
        .nl-committee-tbl th:last-child { border-right: none; }
        .nl-committee-tbl td {
          padding: 7px 10px; border-right: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0;
          vertical-align: middle; color: #1f2937;
        }
        .nl-committee-tbl td:last-child { border-right: none; }
        .nl-committee-tbl tbody tr:nth-child(even) { background: #f8fafc; }
        .nl-committee-tbl tbody tr:hover { background: #eff6ff; }

        .nl-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 0; margin-bottom: 14px; }
        .nl-para { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 12px; }

        /* Evaluation output (প্রতিবেদন ও সুপারিশ) — label + paragraph,
           each section closed off with a dashed divider, matching the
           reference layout instead of table rows. */
        .nl-eval-section { margin-bottom: 10px; }
        .nl-eval-label { font-size: 13.5px; font-weight: 400; margin: 0 0 4px; color: #111827; }
        /* .nl-eval-text is now a <div> wrapping renderRichText()'s output
           (paragraphs/lists), not a single <p> with white-space:pre-line —
           the parser handles line breaks explicitly via <p>/<ul>/<ol>. */
        .nl-eval-text { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 8px; }
        .nl-rt-p { margin: 0 0 6px; }
        .nl-rt-spacer { height: 6px; }
        .nl-rt-list { margin: 0 0 8px; padding-left: 22px; }
        .nl-rt-list li { margin-bottom: 3px; }

        /* New HTML-based rich-text fields (see richTextHtml.ts) — the
           editor emits <div> per line and <ul>/<ol><li> for lists, same
           shape as the legacy classes above, just via real markup instead
           of a parsed marker string. */
        .nl-rt-html div, .nl-rt-html p { margin: 0 0 6px; }
        .nl-rt-html div:last-child, .nl-rt-html p:last-child { margin-bottom: 0; }
        .nl-rt-html ul, .nl-rt-html ol { margin: 0 0 8px; padding-left: 22px; }
        .nl-rt-html li { margin-bottom: 3px; }
        .nl-eval-divider { border: none; border-top: 1px dashed #9ca3af; margin: 0; }

        .nl-copy { font-size: 13px; margin-bottom: 12px; }
        .nl-copy p { margin: 0 0 4px; }
        .nl-copy ol { list-style: none; padding: 0; margin: 0; }
        .nl-copy li { display: flex; gap: 6px; margin-bottom: 2px; }
        .nl-copy li span { font-weight: 600; flex-shrink: 0; }

        .nl-footer { margin-top: auto; padding-top: 8px; }
        .nl-authority { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; }

        /* Investigation-committee signature row (evaluation output only) —
           each member gets a bordered column with name (bold) + role,
           matching the reference layout's multi-column authority block. */
        .nl-committee-sig-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin-top: 34px;
        }
        .nl-committee-sig-col {
          border-top: 1.5px solid #1e3a5f;
          padding-top: 6px;
          text-align: center;
        }
        .nl-committee-sig-name { font-size: 12.5px; font-weight: 700; color: #1e3a5f; margin-bottom: 2px; }
        .nl-committee-sig-desig { font-size: 11px; color: #374151; line-height: 1.4; }

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
          .nl-eval-label, .nl-eval-text { font-size: 10pt !important; line-height: 1.75 !important; }
          .nl-rt-html { font-size: 10pt !important; line-height: 1.75 !important; }
          .nl-committee-sig-name { font-size: 10pt !important; }
          .nl-committee-sig-desig { font-size: 8.5pt !important; }
          .nl-committee-tbl { font-size: 9.5pt !important; }
          .nl-committee-tbl thead tr, .nl-committee-tbl th {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            background: #1e3a5f !important; color: #fff !important;
          }
          .nl-footer { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};