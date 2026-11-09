// ─────────────────────────────────────────────────────────────────────────────
// RecruitmentVerificationForm.tsx — "নতুন শ্রমিক নিয়োগকালীন তথ্য যাচাইকরন ফরম"
// (New Worker Recruitment Information Verification Form), matching the
// reference scan: company name box + title/date header, a 2×2 candidate
// info grid (Name/Present Address, Designation/Permanent Address), a
// 15-row ক্রমিক/প্রশ্ন/উত্তর(হ্যাঁ|না) verification table, and a 3-column
// signature block (Candidate / Verifier / Authority).
//
// QUESTIONS: the 15 questions below are the approved wording supplied by the user (replaces the earlier reconstruction).
//
// Same structural pattern as every other PrintFiles/*.tsx component in
// this module (NomineeForm.tsx, AppointmentLetter.tsx, etc.): .nl-page >
// .nl-wrap root so EmployeeFileSystem.tsx's shared
// fitPrintContentToOnePage() can find and scale it, nlSinglePageCss()
// for the shared single-sheet layout rules, and a small set of
// form-specific overrides layered on top.
//
// FULL-SHEET LAYOUT: the 15 question rows are a CSS grid whose rows are all EQUAL height and together fill the page between the
// info block and the signatures (see .rvf-q-grid / COMPACT_PRINT_CSS) — so the printout always covers the whole A4 sheet.
//
// SINGLE-PAGE FIT (same fix as AppointmentLetter.tsx): this form has a
// 15-row question table plus a header, an info grid, and a 3-column
// signature block — meaningfully denser than the shared
// nlSinglePageCss() defaults budget for, so left as-is it can overflow
// onto a clipped/scaled second page. The export pipeline is
// html2canvas + jsPDF (a DOM screenshot, not a real browser print), so
// `@media print` rules never activate in the exported PDF — any
// tightening has to be applied unconditionally (hence the
// COMPACT_PRINT_CSS block below, `!important` throughout to beat
// nlSinglePageCss()'s looser base spacing) so it takes effect both on
// screen and in the html2canvas capture. The guaranteed single-page fit
// itself (measuring actual rendered height and shrinking further if
// still needed) lives centrally in EmployeeFileSystem.tsx's
// fitPrintContentToOnePage(), applied generically via `.nl-wrap` — this
// file only needs to keep spacing tight enough that little or no
// shrinking is required.
//
// The হ্যাঁ/না answer boxes are intentionally left blank (checkboxes to
// be ticked by hand during the actual verification interview) rather
// than driven by any formData field — this is a physical checklist
// filled out during recruitment, not a computed report.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { EmployeeFormData } from '../employee.types';
import { nlSinglePageCss } from './notesStyle';

interface DocumentProps {
  formData: EmployeeFormData;
}

const val = (v?: string | null, fallback = '---') =>
  (v && String(v).trim()) ? String(v).trim() : fallback;

const formatDateLong = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

// The verification questions, in order, matching the reference form's
// numbering. `type: 'descriptive'` rows (1–5, confirmed against the
// clearer scan) get an open blank answer space for a written response;
// `type: 'yesno'` rows (6 onward, per explicit instruction — every
// question after 5 is yes/no) get the হ্যাঁ/না split box instead.
//
// Q1–15 use the approved wording.
interface VerificationQuestion {
  text: string;
  type: 'descriptive' | 'yesno';
}

const QUESTIONS: VerificationQuestion[] = [
  { type: 'descriptive', text: 'আপনি কীভাবে জানতে পেরেছেন যে আমাদের প্রতিষ্ঠানে কর্মী নিয়োগ করা হচ্ছে? (নিয়োগ বিজ্ঞপ্তি / পরিচিত ব্যক্তির মাধ্যমে / অন্যান্য)' },
  { type: 'descriptive', text: 'আপনি পূর্বে কোন কোন প্রতিষ্ঠানে কর্মরত ছিলেন? প্রতিষ্ঠানের নাম, পদবি ও চাকরির সময়কাল উল্লেখ করুন।' },
  { type: 'descriptive', text: 'আপনি পূর্ববর্তী প্রতিষ্ঠান থেকে কীভাবে চাকরি থেকে অব্যাহতি নিয়েছেন? (স্বেচ্ছায় পদত্যাগ / চাকরি অবসান / ছাঁটাই / অনুপস্থিতি / অন্যান্য)' },
  { type: 'descriptive', text: 'আপনার পূর্ববর্তী কর্মসংস্থানের তথ্য যাচাইয়ের জন্য সংশ্লিষ্ট প্রতিষ্ঠানের একজন দায়িত্বশীল ব্যক্তির নাম, পদবি ও যোগাযোগ নম্বর প্রদান করুন।' },
  { type: 'descriptive', text: 'আপনার বর্তমান বাসস্থানের বাড়িওয়ালার নাম ও যোগাযোগ নম্বর প্রদান করুন।' },
  { type: 'yesno',       text: 'আমাদের প্রতিষ্ঠানে আপনার কোনো আত্মীয়, বন্ধু বা পরিচিত ব্যক্তি কর্মরত আছেন কি? থাকলে তাঁর নাম, পদবি ও আপনার সঙ্গে সম্পর্ক উল্লেখ করুন।' },
  { type: 'yesno',       text: 'আপনি কি পূর্বে আমাদের প্রতিষ্ঠানে কর্মরত ছিলেন?' },
  { type: 'yesno',       text: 'আপনার পূর্ববর্তী কর্মস্থলে আপনার বিরুদ্ধে কোনো শৃঙ্খলাজনিত অভিযোগ বা ব্যবস্থা গ্রহণ করা হয়েছিল কি?' },
  { type: 'yesno',       text: 'আপনার বিরুদ্ধে বর্তমানে কোনো ফৌজদারি মামলা বিচারাধীন আছে কি?' },
  { type: 'yesno',       text: 'আপনার বিরুদ্ধে কোনো অপরাধমূলক কার্যক্রমে দোষী সাব্যস্ত হওয়ার রেকর্ড আছে কি?' },
  { type: 'yesno',       text: 'পূর্ববর্তী কোনো কর্মস্থলে প্রতিষ্ঠানের সম্পদ বা অর্থের অপব্যবহার কিংবা আত্মসাতের অভিযোগে আপনি অভিযুক্ত হয়েছিলেন কি?' },
  { type: 'yesno',       text: 'আপনি কি এমন কোনো শারীরিক স্বাস্থ্যগত সমস্যায় ভুগছেন, যা সংশ্লিষ্ট কাজের দায়িত্ব পালনে প্রভাব ফেলতে পারে?' },
  { type: 'yesno',       text: 'আপনি কি কোনো মাদকদ্রব্য সেবনের অভ্যাসে অভ্যস্ত?' },
  { type: 'yesno',       text: 'আপনি কি প্রতিষ্ঠানের প্রযোজ্য চাকরির শর্তাবলি, নিয়ম-কানুন ও আচরণবিধি মেনে চলতে সম্মত?' },
  { type: 'yesno',       text: 'আপনি কি নিশ্চিত করছেন যে, এই ফরমে প্রদত্ত সকল তথ্য আপনার জ্ঞান ও বিশ্বাস অনুযায়ী সত্য, সঠিক ও সম্পূর্ণ?' },
];

// Structural rules — borders, grid layout, the yes/no box shape. These
// don't need !important; nothing in nlSinglePageCss() targets rvf-*
// class names, so there's no specificity fight here.
const FORM_CSS = `
  .rvf-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 14pt; margin-bottom: 10pt; }
  .rvf-co-box { border: 1px solid #111827; padding: 8pt 12pt; min-width: 150pt; text-align: center; font-weight: 700; font-size: 10.5pt; }
  .rvf-title-block { flex: 1; text-align: center; }
  .rvf-title { font-weight: 700; font-size: 12.5pt; margin: 0; }
  .rvf-date { font-size: 9.5pt; margin-top: 3pt; }

  .rvf-info-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 10pt; }
  .rvf-info-table td { border: 1px solid #111827; padding: 5pt 8pt; width: 50%; vertical-align: top; line-height: 1.4; }
  .rvf-info-label { font-weight: 600; margin-right: 4pt; }

  /* The question table is a CSS grid, not a <table>: the header is as tall as its text and the 15 question rows share the
     remaining page height EQUALLY (1fr each), so every row is the same height and the table fills the sheet down to the
     signature block, whatever the paper size. */
  .rvf-q-grid { flex: 1 1 auto; display: grid; grid-template-columns: 7% minmax(0, 1fr) 22%; grid-template-rows: auto repeat(15, minmax(0, 1fr));
                border-top: 1.2px solid #111827; border-left: 1.2px solid #111827; font-size: 9.6pt; min-height: 0; }
  .rvf-q-grid > div { border-right: 1.2px solid #111827; border-bottom: 1.2px solid #111827; padding: 3pt 7pt; display: flex; align-items: center; line-height: 1.4; min-height: 0; }
  .rvf-q-head { justify-content: center; text-align: center; font-weight: 700; background: #eef1f6; padding: 5pt 7pt !important; font-size: 10pt; }
  .rvf-q-idx { justify-content: center; font-weight: 600; }
  .rvf-q-text { text-align: left; }
  .rvf-q-ans { }
  /* হ্যাঁ/না drawn inside each yes/no row's answer cell; descriptive rows keep a single open writing space */
  .rvf-yn-inner { display: flex; align-items: center; justify-content: space-around; gap: 6pt; width: 100%; }
  .rvf-yn-opt { display: flex; align-items: center; gap: 5pt; font-weight: 600; }
  .rvf-yn-box { width: 11pt; height: 11pt; border: 1.3px solid #111827; display: inline-block; flex-shrink: 0; }

  .rvf-sig-block { display: flex; justify-content: space-between; margin-top: 26pt; padding: 0 4pt; }
  .rvf-sig-col { text-align: center; flex: 1; }
  .rvf-sig-line { border-top: 1.3px solid #111827; margin: 0 10pt 4pt; }
  .rvf-sig-label { font-size: 9pt; }
`;

// Compact single-page overrides, layered on top of FORM_CSS above and
// nlSinglePageCss()'s shared base — applied unconditionally (not inside
// `@media print`) for the same reason documented in AppointmentLetter.tsx:
// the html2canvas + jsPDF export never triggers print media, so any
// tightening meant for the exported PDF has to hold on screen too.
// `!important` is only needed on the handful of rules that override
// nlSinglePageCss()'s own `.nl-page`/`.nl-wrap` defaults; the rvf-*
// tightenings below win on specificity already but keep !important for
// consistency and to survive any future reordering of the two CSS blocks.
const COMPACT_PRINT_CSS = `
  /* the sheet: the page is a flex column, the wrap fills it, the question grid takes all the space left between the
     info block and the signatures. Screen = one full A4; print = the printable area. */
  .nl-page { padding: 8mm 11mm !important; display: flex !important; flex-direction: column !important; }
  .nl-wrap { flex: 1 1 auto !important; min-height: calc(297mm - 16mm) !important; }
  @media print {
    .nl-page { position: relative !important; inset: auto !important; width: 194mm !important; height: 280mm !important; min-height: 0 !important; margin: 0 !important; padding: 4mm 6mm !important; box-shadow: none !important; border-radius: 0 !important; overflow: hidden !important; }
    .nl-wrap { height: 100% !important; min-height: 0 !important; flex: 1 1 auto !important; }
  }

  .rvf-top { margin-bottom: 7pt !important; gap: 10pt !important; }
  .rvf-co-box { padding: 6pt 10pt !important; min-width: 130pt !important; font-size: 10pt !important; }
  .rvf-title { font-size: 12pt !important; }
  .rvf-date { font-size: 9pt !important; margin-top: 2pt !important; }

  .rvf-info-table { font-size: 9pt !important; margin-bottom: 7pt !important; }
  .rvf-info-table td { padding: 4pt 7pt !important; line-height: 1.3 !important; }

  .rvf-sig-block { margin-top: 48pt !important; padding-bottom: 6pt !important; flex: 0 0 auto; }
  .rvf-sig-label { font-size: 8.8pt !important; }
`;

const RecruitmentVerificationForm: React.FC<DocumentProps> = ({ formData }) => {
  const candidateName = val(formData.fullNameBengali || formData.fullName, '');

  const presentAddress = formData.presentAddress ||
    [
      formData.presentHouseNo,
      formData.presentVillage,
      formData.presentPostOffice,
      formData.presentThana,
      formData.presentDistrict,
    ].filter(Boolean).join(', ');

  const permanentAddress = formData.permanentAddress ||
    [
      formData.permanentHouseNo,
      formData.permanentVillage,
      formData.permanentPostOffice,
      formData.permanentThana,
      formData.permanentDistrict,
    ].filter(Boolean).join(', ');

  return (
    <div className="nl-page">
      <div className="nl-wrap">

        <div className="rvf-top">
          <div className="rvf-co-box">{val(formData.companyName, 'Company Name')}</div>
          <div className="rvf-title-block">
            <p className="rvf-title">নতুন শ্রমিক নিয়োগকালীন তথ্য যাচাইকরন ফরম</p>
            <div className="rvf-date">তারিখ: {formatDateLong(formData.date) || '---'}</div>
          </div>
        </div>

        <table className="rvf-info-table"><tbody>
          <tr>
            <td><span className="rvf-info-label">প্রার্থীর নাম:</span> {val(candidateName)}</td>
            <td><span className="rvf-info-label">বর্তমান ঠিকানা:</span> {val(presentAddress)}</td>
          </tr>
          <tr>
            <td><span className="rvf-info-label">প্রার্থীর পদবি:</span> {val(formData.designation)}</td>
            <td><span className="rvf-info-label">স্থায়ী ঠিকানা:</span> {val(permanentAddress)}</td>
          </tr>
        </tbody></table>

        <div className="rvf-q-grid" role="table" aria-label="যাচাই প্রশ্নাবলি">
          <div className="rvf-q-head" role="columnheader">ক্রমিক</div>
          <div className="rvf-q-head" role="columnheader">প্রশ্ন</div>
          <div className="rvf-q-head" role="columnheader">উত্তর</div>
          {QUESTIONS.map((q, i) => (
            <React.Fragment key={i}>
              <div className="rvf-q-idx" role="cell">{i + 1}.</div>
              <div className="rvf-q-text" role="cell">{q.text}</div>
              <div className="rvf-q-ans" role="cell">
                {q.type === 'yesno' && (
                  <div className="rvf-yn-inner">
                    <span className="rvf-yn-opt">হ্যাঁ <span className="rvf-yn-box" /></span>
                    <span className="rvf-yn-opt">না <span className="rvf-yn-box" /></span>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="rvf-sig-block">
          <div className="rvf-sig-col">
            <div className="rvf-sig-line" />
            <div className="rvf-sig-label">প্রার্থীর স্বাক্ষর</div>
          </div>
          <div className="rvf-sig-col">
            <div className="rvf-sig-line" />
            <div className="rvf-sig-label">তথ্য যাচাইকারীর স্বাক্ষর</div>
          </div>
          <div className="rvf-sig-col">
            <div className="rvf-sig-line" />
            <div className="rvf-sig-label">কর্তৃপক্ষের স্বাক্ষর</div>
          </div>
        </div>

      </div>

      <style>{nlSinglePageCss() + FORM_CSS + COMPACT_PRINT_CSS}</style>
    </div>
  );
};

export default RecruitmentVerificationForm;