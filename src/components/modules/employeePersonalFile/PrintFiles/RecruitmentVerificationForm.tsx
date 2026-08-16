// ─────────────────────────────────────────────────────────────────────────────
// RecruitmentVerificationForm.tsx — "নতুন শ্রমিক নিয়োগকালীন তথ্য যাচাইকরন ফরম"
// (New Worker Recruitment Information Verification Form), matching the
// reference scan: company name box + title/date header, a 2×2 candidate
// info grid (Name/Present Address, Designation/Permanent Address), a
// 15-row ক্রমিক/প্রশ্ন/উত্তর(হ্যাঁ|না) verification table, and a 3-column
// signature block (Candidate / Verifier / Authority).
//
// NOTE ON QUESTION TEXT: the source scan supplied was low-resolution and
// several lines were not fully legible. The 15 questions below are a
// best-effort reconstruction matching what IS legible (topics: how the
// candidate learned of the vacancy, prior employment and how it ended,
// address/identity verification, references, disciplinary/criminal
// history, health/substance questions, and a closing consent
// declaration) — please proofread against the original document and
// correct any wording before this goes into real use.
//
// Same structural pattern as every other PrintFiles/*.tsx component in
// this module (NomineeForm.tsx, AppointmentLetter.tsx, etc.): .nl-page >
// .nl-wrap root so EmployeeFileSystem.tsx's shared
// fitPrintContentToOnePage() can find and scale it, nlSinglePageCss()
// for the shared single-sheet layout rules, and a small set of
// form-specific overrides layered on top.
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
// Q1–7 text is transcribed directly from the clearer scan supplied.
// Q8–15 are carried over from the earlier, lower-resolution scan and
// are still a best-effort reconstruction — please proofread those
// against the original document.
interface VerificationQuestion {
  text: string;
  type: 'descriptive' | 'yesno';
}

const QUESTIONS: VerificationQuestion[] = [
  { type: 'descriptive', text: 'আপনি কিভাবে জেনেছেন আমাদের কারখানায় লোক নিয়োগ হচ্ছে? (বিজ্ঞপ্তি/ব্যক্তি মারফত)' },
  { type: 'descriptive', text: 'আপনি পূর্বে কোন কোন কোম্পানীতে কাজ করেছেন?' },
  { type: 'descriptive', text: 'পূর্বের কোম্পানী থেকে কিভাবে চাকরী ছেড়েছেন? (ইস্তফা/ বরখাস্ত/ ছাঁটাই/ অনুপস্থিতি/অন্যান্য)' },
  { type: 'descriptive', text: 'আপনার তথ্য যাচাই করার জন্য পূর্বের কোম্পানীর একজন ব্যক্তির নাম ও নাম্বার বলুন।' },
  { type: 'descriptive', text: 'আপনার বর্তমান বাড়িওয়ালার নাম ও নম্বর বলুন।' },
  { type: 'yesno',       text: 'আমাদের কারখানায় আপনার কোন আত্মীয়/বন্ধু/ পরিচিত কেউ আছেন? (যদি থাকে, ব্যক্তি সহ)' },
  { type: 'yesno',       text: 'আপনি কি আমাদের কারখানায় পূর্বে কাজ করেছিলেন?' },
  { type: 'yesno',       text: 'পূর্বের কোম্পানীতে কোন শৃঙ্খলাজনিত সমস্যা বা অভিযোগ ছিল কি?' },
  { type: 'yesno',       text: 'আপনার বিরুদ্ধে থানা বা আদালতে কোন মামলা বিচারাধীন আছে কি?' },
  { type: 'yesno',       text: 'আপনার নামে বা ঠিকানায় কোন অপরাধমূলক রেকর্ড আছে কি?' },
  { type: 'yesno',       text: 'আপনি কি পূর্বে কোন কোম্পানীর সম্পত্তি বা অর্থ আত্মসাৎ করেছেন?' },
  { type: 'yesno',       text: 'আপনার শারীরিক কোন গুরুতর অসুস্থতা আছে কি?' },
  { type: 'yesno',       text: 'আপনি কি নিয়মিত মাদক সেবন করেন?' },
  { type: 'yesno',       text: 'আপনি কি প্রতিষ্ঠানের চাকুরীর শর্তাবলী মেনে চলতে সম্মত আছেন?' },
  { type: 'descriptive', text: 'আপনি কি স্বীকার করছেন যে উপরে উল্লেখিত তথ্যসমূহ সত্য ও নির্ভুল?' },
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

  .rvf-q-table { width: 100%; border-collapse: collapse; font-size: 8.6pt; }
  .rvf-q-table th, .rvf-q-table td { border: 1px solid #111827; padding: 4pt 6pt; vertical-align: middle; line-height: 1.35; }
  .rvf-q-table thead th { text-align: center; font-weight: 700; background: #f3f4f6; }
  .rvf-q-idx { width: 6%; text-align: center; }
  .rvf-q-text { text-align: left; }
  .rvf-q-ans-head { width: 22%; }

  /* Q1–5: a single open blank space for a written answer — no হ্যাঁ/না
     split. min-height gives room to actually write a name/number/short
     sentence, not just tick a box. */
  .rvf-q-ans-blank { min-height: 20pt; }

  /* Q6+: the header column only ever says "উত্তর" (no হ্যাঁ/না in the
     header row itself, matching the reference) — the হ্যাঁ/না split is
     drawn INSIDE each yes/no row's own answer cell instead, via a plain
     flex row, so descriptive rows above it can stay a single undivided
     box. */
  .rvf-yn-inner { display: flex; align-items: center; justify-content: space-around; gap: 6pt; }
  .rvf-yn-opt { display: flex; align-items: center; gap: 4pt; }
  .rvf-yn-box { width: 9pt; height: 9pt; border: 1.2px solid #111827; display: inline-block; flex-shrink: 0; }

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
  .nl-page { padding: 6mm 10mm !important; }

  .rvf-top { margin-bottom: 6pt !important; gap: 10pt !important; }
  .rvf-co-box { padding: 5pt 9pt !important; min-width: 120pt !important; font-size: 9.5pt !important; }
  .rvf-title { font-size: 11pt !important; }
  .rvf-date { font-size: 8.5pt !important; margin-top: 2pt !important; }

  .rvf-info-table { font-size: 8.6pt !important; margin-bottom: 6pt !important; }
  .rvf-info-table td { padding: 3.5pt 7pt !important; line-height: 1.3 !important; }

  .rvf-q-table { font-size: 7.9pt !important; }
  .rvf-q-table th, .rvf-q-table td { padding: 2.5pt 5pt !important; line-height: 1.22 !important; }
  .rvf-q-ans-blank { min-height: 13pt !important; }
  .rvf-yn-box { width: 8pt !important; height: 8pt !important; }

  .rvf-sig-block { margin-top: 16pt !important; }
  .rvf-sig-label { font-size: 8.3pt !important; }
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

        <table className="rvf-q-table">
          <thead>
            <tr>
              <th className="rvf-q-idx">ক্রমিক</th>
              <th className="rvf-q-text" style={{ textAlign: 'center' }}>প্রশ্ন</th>
              <th className="rvf-q-ans-head">উত্তর</th>
            </tr>
          </thead>
          <tbody>
            {QUESTIONS.map((q, i) => (
              <tr key={i}>
                <td className="rvf-q-idx">{i + 1}.</td>
                <td className="rvf-q-text">{q.text}</td>
                {q.type === 'descriptive' ? (
                  <td className="rvf-q-ans-blank"></td>
                ) : (
                  <td>
                    <div className="rvf-yn-inner">
                      <span className="rvf-yn-opt">হ্যাঁ <span className="rvf-yn-box" /></span>
                      <span className="rvf-yn-opt">না <span className="rvf-yn-box" /></span>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

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