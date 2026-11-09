// ─────────────────────────────────────────────────────────────────────────────
// FULL-SHEET LAYOUT (latest): the certificate covers the whole A4 sheet — comfortable fixed row heights, the medical box takes
// the spare height and spaces its rows evenly, and the verification block has generous signing space (see COMPACT_PRINT_CSS).
//
// MedicalFitnessCertificate.tsx — REBUILT to follow AppointmentLetter's
// print layout pattern (.nl-page/.nl-wrap/.nl-header/.nl-title-bar), for
// consistent single-page print/PDF output across all PrintFiles components.
//
// Previous version used ad-hoc Tailwind classes (bg-white, border-4,
// space-y-4, etc.) with no .nl-wrap root — EmployeeFileSystem.tsx's
// fitPrintContentToOnePage() couldn't find its scale target, so nothing
// guaranteed single-page fit, and the on-screen language-toggle buttons
// had no no-print guard and rendered into both the Print and PDF-export
// paths.
//
// Same reasoning as AppointmentLetter's own header comment: the export
// pipeline is html2canvas + jsPDF (a DOM screenshot), not a true browser
// print, so print-only overrides never reach the exported PDF — compact
// spacing rules here are applied unconditionally (still !important to
// beat nlSinglePageCss()'s defaults), not wrapped in @media print.
//
// FIX (label-width alignment): Height/Weight row's Height: label uses
// the unmodified .mfc-label class so its value-underline starts at the
// same x-position as Name/DOB/Gender/Address; only the second label
// (Weight:) is narrowed.
//
// FIX (title + photo layout, round 3): photo box is wrapped around the
// title bar AND the candidate-info rows (Name→Address) together, so its
// height naturally spans that whole block per the reference image.
// Identification Marks row sits below/outside that block.
//
// FIX (photo box overflow, round 4): the box's border was pushed outside
// its allotted width/height because .mfc-photo-box and its container
// used the default content-box sizing — border + 100% height could
// extend past the row block's actual bottom edge and past the page's
// right margin. Both now use box-sizing: border-box, and the
// container's padding-right was widened slightly so the box (width +
// right offset) always sits fully inside it with room to spare.
//
// FIX (verification block, per reference layout): two-column
// Employee/Practitioner signature block, matching a reference image.
// Left Thumb Impression block removed entirely per explicit request.
//
// FIX (certification paragraph): replaced the original English-style
// clinical-exam wording with the requested Bengali certification
// paragraph — includes candidate name, father's name, mother's name,
// address, and computed age, plus an age-based eligibility category
// (প্রাপ্ত বয়স্ক for 18+, কিশোর for 16–17). This paragraph is now
// rendered directly (not part of the en/bn `content` translation table)
// since only a Bengali version was provided.
//
// FIX (under-18 eligibility wording, per explicit request): candidates
// under 18 are NOT legally eligible for standard employment under the
// certificate's own logic — the previous "কিশোর" (16–17) branch still
// phrased this as a positive eligibility statement ("...হিসাবে নিযুক্ত
// হইবার যোগ্য"), which reads as certifying them fit to be employed
// exactly like an adult, just under a different label. That's now split
// into two genuinely different sentences instead of one sentence with a
// swapped-in category word: 18+ keeps the original positive form
// ("...প্রাপ্ত বয়স্ক হিসাবে নিযুক্ত হইবার যোগ্য।"); anything under 18
// now renders a negative form ("...অপ্রাপ্ত বয়স্ক হিসাবে নিযুক্ত হওয়ার
// যোগ্য নয়।") — same computed age, opposite conclusion. `eligibilityCategory`
// is kept for the 18+ case; the under-18 label is inlined directly in the
// negative sentence since it's only ever used there now.
// ─────────────────────────────────────────────────────────────────────────────

import { FACTORY_NAME_EN, FACTORY_ADDRESS_EN } from '../../../../factories/FactoryRegistry';
import React, { useState } from 'react';
import { EmployeeFormData, AgeData, DocumentProps } from '../employee.types';
import { nlSinglePageCss } from './notesStyle';
import { PhotoDisplayBox } from './PhotoAttach';

const calculateAge = (dob: string): AgeData => {
  if (!dob) return { years: 0, months: 0, days: 0 };
  const birthDate = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
};

const formatDateLong = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Letter-specific compact overrides, layered on top of the shared
// single-page CSS — matches AppointmentLetter.tsx's approach so this
// certificate reliably fits one A4 page in both the print and
// html2canvas/jsPDF export paths.
const COMPACT_PRINT_CSS = `
  /* FULL-SHEET LAYOUT: the page is a flex column and .nl-wrap fills it (screen = one full A4, print = the printable area).
     Rows have a fixed comfortable height; the medical box takes ALL spare height and spaces its rows evenly, so the
     certificate covers the whole sheet instead of leaving a blank strip at the bottom. */
  .nl-page { padding: 8mm 12mm !important; display: flex !important; flex-direction: column !important; }
  .nl-wrap { flex: 1 1 auto !important; min-height: calc(297mm - 16mm) !important; }
  @media print {
    .nl-page { position: relative !important; inset: auto !important; width: 194mm !important; height: 280mm !important; min-height: 0 !important; margin: 0 !important; padding: 4mm 6mm !important; box-shadow: none !important; border-radius: 0 !important; overflow: hidden !important; }
    .nl-wrap { height: 100% !important; min-height: 0 !important; flex: 1 1 auto !important; }
  }

  .nl-header { padding-bottom: 6pt !important; margin-bottom: 8pt !important; flex: 0 0 auto; }
  .nl-co-name { font-size: 14pt !important; margin-bottom: 2pt !important; }
  .nl-co-addr { font-size: 9pt !important; }

  .mfc-row { display: flex; align-items: flex-end; gap: 8pt; font-size: 10pt; line-height: 1.35; margin-bottom: 0 !important; min-height: 20pt; flex: 0 0 auto; }
  .mfc-label { font-weight: 600; white-space: nowrap; min-width: 140pt; padding-bottom: 1pt; }
  .mfc-value { flex: 1; border-bottom: 1px solid #111827; padding: 0 4pt 1pt; min-height: 16pt; }

  .mfc-med-box { flex: 1 0 auto; display: flex; flex-direction: column; justify-content: space-between; gap: 6pt;
                 border: 1px solid #9ca3af; background: #f9fafb; padding: 8pt 12pt; font-size: 10pt; margin-top: 8pt !important; min-height: min-content; }
  .mfc-field-line { border: 1px solid #111827; background: #fff; flex: 1; min-height: 20pt; padding: 1pt 5pt; }
  .mfc-med-row { display: flex; align-items: center; gap: 8pt; margin-bottom: 0 !important; }
  .mfc-med-label { font-weight: 600; min-width: 100pt; font-size: 10pt; }

  .mfc-med-row + .mfc-med-row { margin-top: 7pt; }
  .mfc-verify-line { display: flex; align-items: flex-end; }
  .mfc-verify-label { padding-bottom: 1px; }
  .mfc-lang { position: absolute; top: 2.5mm; right: 12mm; display: flex; gap: 6px; z-index: 5; }
  .nl-page { position: relative !important; }
  .mfc-med-box .mfc-lbl-s { min-width: 40pt !important; }
  .mfc-med-box .mfc-lbl-m { min-width: 70pt !important; }
  .mfc-med-box .mfc-med-label { min-width: 110pt; }
  .mfc-verify-label { font-size: 10pt !important; }
  .mfc-stamp-row .mfc-verify-label { font-size: 10pt !important; }

  .mfc-add-exam { display: flex; flex-direction: column; gap: 3pt; }
  .mfc-add-box { flex: none; height: 30pt; }
  .mfc-check { width: 11pt; height: 11pt; border: 1.3px solid #111827; display: inline-block; margin-right: 4pt; vertical-align: middle; }

  .mfc-cert-box { flex: 0 0 auto; border: 1px solid #9ca3af; background: #eff6ff; padding: 10pt 12pt; margin: 8pt 0 0 !important; font-size: 10pt; line-height: 1.5; text-align: justify; }

  /* Two-column verifier block — Employee (left) / Practitioner (right) */
  .mfc-verify-block { flex: 0 0 auto; display: flex; gap: 28pt; margin-top: 10pt !important; }
  .mfc-verify-col { flex: 1; }
  .mfc-verify-field { margin-bottom: 8pt !important; font-size: 10pt; }
  .mfc-verify-label { font-weight: 600; }
  .mfc-verify-line { min-height: 24px !important; padding: 0 3px; }
  .mfc-stamp-row { display: flex; align-items: center; gap: 8pt; margin-top: 10pt !important; }
  .mfc-note { text-align: center; margin-top: 8pt; font-size: 8pt; font-style: italic; color: #374151; }
`;

const MedicalFitnessCertificate: React.FC<DocumentProps> = ({ formData }) => {
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const age = calculateAge(formData.dateOfBirth);
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const displayName = language === 'bn'
    ? (formData.fullNameBengali || formData.fullName)
    : formData.fullName;

  const displayGender = language === 'bn'
    ? (formData.gender === 'Male' ? 'পুরুষ' : formData.gender === 'Female' ? 'মহিলা' : formData.gender)
    : formData.gender;

  // Construct permanent address properly
  const fullAddress = formData.permanentAddress ||
    [
      formData.permanentVillage,
      formData.permanentPostOffice,
      formData.permanentThana,
      formData.permanentDistrict
    ].filter(Boolean).join(', ');

  // AUDIT ADDITION: whether the candidate meets the 18+ threshold used by
  // the certification paragraph below. Everything under 18 is now treated
  // as genuinely ineligible (negative sentence), not just relabeled —
  // see the file-header FIX note for why the old "কিশোর" branch was
  // removed rather than kept as a third positive-eligibility case.
  const isAdult = age.years >= 18;

  const eligibilityCategory = isAdult ? 'প্রাপ্ত বয়স্ক' : '';

  // AUDIT ADDITION: same formData.photo convention as IdCard.tsx — see
  // PhotoAttach.tsx's header comment for the EmployeeFormData type
  // addition this still needs.
  const photoSrc = (formData as any).photo as string | undefined;

  const content = {
    en: {
      title: 'CERTIFICATE OF AGE AND MEDICAL FITNESS',
      subtitle: '[Bangladesh Labour Rules Form No. 15]',
      candidateName: 'Name of the candidate',
      fatherName: "Father's Name",
      motherName: "Mother's Name",
      dobAge: 'Date of Birth & Age',
      gender: 'Gender',
      address: 'Address',
      height: 'Height',
      weight: 'Weight',
      idMarks: 'Identification Marks on body',
      bloodPressure: 'Blood Pressure',
      eyeExamination: 'Eye Examination Results',
      hearing: 'Hearing Defect',
      physicallyCap: 'Physically Capable',
      capable: 'Capable',
      notCapable: 'Not Capable',
      employeeName: 'Employee Name',
      designation: 'Designation',
      practitioner: 'Practitioner',
      registration: 'Regi. Number',
      signature: 'Signature',
      sigDate: 'Date',
      addExam: 'If need any additional examination',
      stamp: 'Stamp / Seal',
      photo: 'Photograph',
      note: '***Certificate should be on the letter head of Doctor',
      years: 'Years',
      normal: 'Normal',
      abnormal: 'Abnormal',
      kg: 'kg'
    },
    bn: {
      title: 'বয়স ও সক্ষমতার প্রত্যয়নপত্র',
      subtitle: '[বাংলাদেশ শ্রম বিধিমালা ফরম নং-১৫]',
      candidateName: 'প্রার্থীর নাম',
      fatherName: 'পিতার নাম',
      motherName: 'মাতার নাম',
      dobAge: 'জন্ম তারিখ ও বয়স',
      gender: 'লিঙ্গ',
      address: 'ঠিকানা',
      height: 'উচ্চতা',
      weight: 'ওজন',
      idMarks: 'শরীরের সনাক্তকরণ চিহ্ন',
      bloodPressure: 'রক্তচাপ',
      eyeExamination: 'চোখের পরীক্ষা ফলাফল',
      hearing: 'শ্রবণ ত্রুটি',
      physicallyCap: 'শারীরিকভাবে সক্ষমতা',
      capable: 'সক্ষম',
      notCapable: 'অক্ষম',
      employeeName: 'কর্মীর নাম',
      designation: 'পদবি',
      practitioner: 'চিকিৎসকের নাম',
      registration: 'নিবন্ধন নম্বর',
      signature: 'স্বাক্ষর',
      sigDate: 'তারিখ',
      addExam: 'প্রয়োজনে অতিরিক্ত পরীক্ষা',
      stamp: 'সিল/স্ট্যাম্প',
      photo: 'ছবি',
      note: '***সনদপত্র অবশ্যই চিকিৎসকের লেটার হেডে হতে হবে',
      years: 'বৎসর',
      normal: 'স্বাভাবিক',
      abnormal: 'অস্বাভাবিক',
      kg: 'কে.জি.'
    }
  };

  const t = content[language];

  return (
      <div className="nl-page">
        {/* Language Toggle — screen only, never printed/exported */}
        <div className="no-print mfc-lang">
          <button onClick={() => setLanguage('en')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: language === 'en' ? '#2563EB' : '#E2E8F0', color: language === 'en' ? '#fff' : '#374151' }}>
            English
          </button>

          <button onClick={() => setLanguage('bn')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: language === 'bn' ? '#2563EB' : '#E2E8F0', color: language === 'bn' ? '#fff' : '#374151' }}>
            বাংলা
          </button>
        </div>

          <div className="nl-wrap">          
              {/* HEADER */}
              <div className="nl-header">
                <h1 className="nl-co-name">
                  {formData.companyName || FACTORY_NAME_EN}
                </h1>

                <p className="nl-co-addr">
                  {formData.companyAddress || FACTORY_ADDRESS_EN}
                </p>
              </div>

              {/* TITLE + PHOTO */}
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: 12 }}>
                <tbody>
                  <tr>
                    {/* TITLE — 75% */}
                    <td style={{ width: '75%', padding: '0 12px 0 0', border: 'none', verticalAlign: 'middle' }}>
                      <div style={{ minHeight: '4.5cm', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div>
                          <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: 19, fontWeight: 700, lineHeight: 1.25, textAlign: 'center', letterSpacing: 0.3 }}>
                            {t.title}
                          </h2>
                          <div style={{ marginTop: 6, fontSize: 11, color: '#374151', textAlign: 'center' }}>{t.subtitle}</div>
                        </div>
                      </div>
                    </td>

                    {/* PHOTO — 25% */}
                    <td style={{ width: '25%', padding: 0, border: 'none', verticalAlign: 'middle' }}>
                      <PhotoDisplayBox
                        src={photoSrc}
                        alt={`${displayName} — ছবি`}
                        placeholderLabel={t.photo}
                        style={{ width: '3.5cm', height: '4.5cm', maxWidth: '100%', margin: '0 auto', border: '1px solid #000', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11, color: '#555' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* CANDIDATE INFORMATION */}
              <div className="mfc-row">
                <span className="mfc-label">{t.candidateName}:</span>
                <span className="mfc-value">{displayName}</span>
              </div>

              <div className="mfc-row">
                <span className="mfc-label">{t.fatherName}:</span>
                <span className="mfc-value">{formData.fatherName}</span>
              </div>

              <div className="mfc-row">
                <span className="mfc-label">{t.motherName}:</span>
                <span className="mfc-value">{formData.motherName}</span>
              </div>

              <div className="mfc-row">
                <span className="mfc-label">{t.dobAge}:</span>
                <span className="mfc-value">{formatDateLong(formData.dateOfBirth)}</span>
              </div>

              <div className="mfc-row">
                <span className="mfc-label">{t.gender}:</span>
                <span className="mfc-value">{displayGender}</span>
              </div>

              <div className="mfc-row">
                <span className="mfc-label">{t.height}:</span>

                <span className="mfc-value" style={{ flex: '0 0 32%' }}>
                  {formData.height ? `${formData.height}` : ''}
                </span>

                <span className="mfc-label" style={{ minWidth: 'auto', marginLeft: 8 }}>
                  {t.weight}:
                </span>

                <span className="mfc-value" style={{ flex: 1 }}>
                  {formData.weight ? `${formData.weight} ${t.kg}` : ''}
                </span>
              </div>

              <div className="mfc-row">
                <span className="mfc-label">{t.address}:</span>
                <span className="mfc-value">{fullAddress}</span>
              </div>

              {/* ID MARKS */}
              <div className="mfc-row">
                <span className="mfc-label">{t.idMarks}:</span>
                <span className="mfc-value">{formData.identificationMark}</span>
              </div>

              <div style={{ clear: 'both' }} />

              {/* MEDICAL DETAILS */}
              <div className="mfc-med-box" style={{ marginTop: 12 }}>

                <div className="mfc-med-row">
                  <span className="mfc-med-label">{t.bloodPressure}:</span>
                  <span className="mfc-field-line"></span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '10pt', marginBottom: 0 }}>
                  {t.eyeExamination}:
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>

                    <div className="mfc-med-row" style={{ marginBottom: 3 }}>
                      <span className="mfc-med-label mfc-lbl-s">
                        VAR:
                      </span>

                      <span className="mfc-field-line"></span>
                    </div>

                    <div className="mfc-med-row">
                      <span className="mfc-med-label mfc-lbl-s">
                        VAL:
                      </span>

                      <span className="mfc-field-line"></span>
                    </div>

                  </div>

                  <div style={{ flex: 1 }}>

                    <div className="mfc-med-row" style={{ marginBottom: 3 }}>
                      <span className="mfc-med-label mfc-lbl-m">
                        {t.normal}:
                      </span>

                      <span className="mfc-field-line"></span>
                    </div>

                    <div className="mfc-med-row">
                      <span className="mfc-med-label mfc-lbl-m">
                        {t.abnormal}:
                      </span>

                      <span className="mfc-field-line"></span>
                    </div>

                  </div>
                </div>

                <div className="mfc-med-row">
                  <span className="mfc-med-label">{t.hearing}:</span>
                  <span className="mfc-field-line"></span>
                </div>

                <div className="mfc-add-exam">
                  <span className="mfc-med-label" style={{ minWidth: 0 }}>{t.addExam}:</span>
                  <span className="mfc-field-line mfc-add-box"></span>
                </div>

                <div className="mfc-med-row" style={{ marginBottom: 0 }}>
                  <span className="mfc-med-label">{t.physicallyCap}:</span>

                  <span style={{ display: 'flex', gap: 16, marginLeft: 6 }}>
                    <span>
                      <span className="mfc-check"></span>
                      {t.capable}
                    </span>

                    <span>
                      <span className="mfc-check"></span>
                      {t.notCapable}
                    </span>
                  </span>
                </div>

              </div>

              {/* CERTIFICATION STATEMENT */}
              {/* AUDIT FIX: 18+ keeps the original positive-eligibility
                 sentence; under 18 now renders a genuinely negative
                 sentence ("...অপ্রাপ্ত বয়স্ক হিসাবে নিযুক্ত হওয়ার যোগ্য
                 নয়।") instead of the old "কিশোর" branch, which still read
                 as certifying the candidate fit for employment. See the
                 file-header FIX note. */}
              <div className="mfc-cert-box" style={{ marginTop: 12 }}>
                {isAdult ? (
                  <p style={{ margin: 0 }}>
                    আমি এই মর্মে প্রত্যয়ন করিতেছি যে, উপরিউক্ত ব্যক্তিকে আমি পরীক্ষা করিয়াছি।
                    তিনি প্রতিষ্ঠানে নিযুক্ত হইতে ইচ্ছুক মর্মে আমার পরীক্ষা হইতে এইরূপ পাওয়া গিয়াছে
                    যে তাহার বয়স{' '}
                    <strong>
                      {age.years} {t.years}
                    </strong>{' '}
                    এবং তিনি প্রতিষ্ঠানে{' '}
                    <strong>
                      {eligibilityCategory}
                    </strong>{' '}
                    হিসাবে নিযুক্ত হইবার যোগ্য।
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    আমি এই মর্মে প্রত্যয়ন করিতেছি যে, উপরিউক্ত ব্যক্তিকে আমি পরীক্ষা করিয়াছি।
                    আমার পরীক্ষা হইতে এইরূপ পাওয়া গিয়াছে যে তাহার বয়স{' '}
                    <strong>
                      {age.years} {t.years}
                    </strong>{' '}
                    এবং তিনি প্রতিষ্ঠানে{' '}
                    <strong>
                      অপ্রাপ্ত বয়স্ক
                    </strong>{' '}
                    হিসাবে নিযুক্ত হওয়ার যোগ্য নয়।
                  </p>
                )}
              </div>

              {/* VERIFICATION */}
              <div className="mfc-verify-block" style={{ marginTop: 12 }}>  

              <div className="mfc-verify-col">

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.employeeName}:
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}>
                    {displayName}
                  </div>
                </div>

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.designation}:
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}>
                    {formData.designation || ''}
                  </div>
                </div>

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.signature}:
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}></div>
                </div>

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: 0 }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.sigDate}:
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}>
                    {formData.joiningDate ? formatDateLong(formData.joiningDate) : ''}
                  </div>
                </div>

              </div>

              <div className="mfc-verify-col">

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.practitioner}:
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}>Dr. Mohammad Tanzir Ahmed</div>
                </div>

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.registration}: 
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}>125457</div>
                </div>

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.signature}:
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}></div>
                </div>

                <div className="mfc-verify-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: 0 }}>
                  <div className="mfc-verify-label" style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>
                    {t.sigDate}:
                  </div>
                  <div className="mfc-verify-line" style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }}>
                    {formData.joiningDate ? formatDateLong(formData.joiningDate) : ''}
                  </div>
                </div>
                {/* STAMP / SEAL */}
                <div className="mfc-stamp-row" style={{ marginTop: 16 }}>
                  <span className="mfc-verify-label">{t.stamp}:</span>
                  {/* <span className="mfc-stamp-box"></span> */}
                </div>
              </div>
            </div>
          </div>
        <style>
          {nlSinglePageCss() + COMPACT_PRINT_CSS}
        </style>
      </div>
  );
};

export default MedicalFitnessCertificate;