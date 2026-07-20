// ─────────────────────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────

import { FACTORY_NAME_EN, FACTORY_ADDRESS_EN } from '../../../../factories/FactoryRegistry';
import React, { useState } from 'react';
import { EmployeeFormData, AgeData, DocumentProps } from '../employee.types';
import { nlSinglePageCss } from './notesStyle';

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
  .nl-page { padding: 6mm 10mm !important; }
  .nl-header { padding-bottom: 5pt !important; margin-bottom: 6pt !important; }
  .nl-co-name { font-size: 12.5pt !important; margin-bottom: 1pt !important; }
  .nl-co-addr { font-size: 8pt !important; }

  /* Wraps title bar + candidate-info rows together so the photo box's
     height naturally spans that whole block. box-sizing: border-box +
     generous padding-right keeps the box (width + right offset) fully
     inside this container, on both axes, instead of overflowing past
     the row block's bottom edge or the page's right margin. */
  .mfc-title-photo-row {
    position: relative;
    margin-bottom: 6pt !important;
    padding-right: 88pt;
    box-sizing: border-box;
  }

  .nl-title-bar {
    padding: 3pt 0 2pt !important;
    margin: 0 !important;
    display: block !important;
    justify-content: center !important;
    text-align: center !important;
  }
  .nl-title { font-size: 10.5pt !important; display: block; text-align: center; }
  .nl-meta { font-size: 8.5pt !important; display: block; text-align: center; }

  .mfc-photo-box {
    box-sizing: border-box;
    border: 1.3px solid #111827;
    width: 70pt; height: 100%;
    min-height: 95pt;
    display: flex; align-items: center; justify-content: center;
    position: absolute; top: 0; right: 8pt;
  }
  .mfc-photo-box span { font-size: 7pt; color: #9ca3af; }

  .mfc-row { display: flex; align-items: flex-start; gap: 6pt; font-size: 8.5pt; line-height: 1.3; margin-bottom: 3pt; }
  .mfc-label { font-weight: 600; white-space: nowrap; min-width: 130pt; }
  .mfc-value { flex: 1; border-bottom: 1px solid #111827; padding: 0 3pt 1pt; min-height: 11pt; }

  .mfc-cert-box { border: 1px solid #9ca3af; background: #eff6ff; padding: 6pt 8pt; margin: 6pt 0; font-size: 8.3pt; line-height: 1.45; text-align: justify; }

  .mfc-med-box { border: 1px solid #d1d5db; background: #f9fafb; padding: 6pt 8pt; font-size: 8.3pt; }
  .mfc-field-line { border: 1px solid #111827; background: #fff; flex: 1; min-height: 13pt; padding: 1pt 4pt; }
  .mfc-med-row { display: flex; align-items: center; gap: 6pt; margin-bottom: 4pt; }
  .mfc-med-label { font-weight: 600; min-width: 90pt; font-size: 8.3pt; }

  .mfc-check { width: 9pt; height: 9pt; border: 1.3px solid #111827; display: inline-block; margin-right: 3pt; vertical-align: middle; }

  /* Two-column verifier block — Employee (left) / Practitioner (right),
     each with a Name field, a secondary field, a centered "Signature"
     label, and a Sig & Date line — matching the reference layout. */
  .mfc-verify-block { display: flex; gap: 20pt; margin-top: 10pt; }
  .mfc-verify-col { flex: 1; }
  .mfc-verify-field { margin-bottom: 9pt; font-size: 8.5pt; }
  .mfc-verify-label { font-weight: 600; margin-bottom: 2pt; }
  .mfc-verify-line { border-bottom: 1px dotted #111827; min-height: 12pt; padding: 0 2pt; }
  .mfc-verify-sig { text-align: center; font-style: italic; color: #9ca3af; font-size: 7.5pt; margin: 4pt 0 2pt; }

  .mfc-stamp-row { display: flex; align-items: center; gap: 8pt; margin-top: 8pt; }
  .mfc-stamp-box { border: 1.3px solid #111827; width: 55pt; height: 55pt; background: #f9fafb; flex-shrink: 0; }

  .mfc-note { text-align: center; margin-top: 8pt; font-size: 7.5pt; font-style: italic; color: #374151; }
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

  // AUDIT ADDITION: age-based eligibility category for the certification
  // paragraph — 18+ years = প্রাপ্ত বয়স্ক (adult), 16–17 years = কিশোর
  // (adolescent). Below 16 shows nothing (Bangladesh Labour Act
  // prohibits employment under 18 without this classification applying
  // at all, but the label itself is only meaningful at 16+).
  const eligibilityCategory =
    age.years >= 18 ? 'প্রাপ্ত বয়স্ক'
    : age.years >= 16 ? 'কিশোর'
    : '';

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
      practitioner: 'Name of the Practitioner',
      registration: 'Registration Number',
      signature: 'Signature',
      sigDate: 'Sig. & Date',
      stamp: 'Stamp / Seal',
      photo: 'Photograph',
      note: '***Certificate should be on the letter head of Doctor',
      years: 'Years',
      normal: 'Normal',
      abnormal: 'Abnormal',
      kg: 'kg'
    },
    bn: {
      title: 'বয়স ও সক্ষমতার প্রত্যয়নপত্র',
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
      sigDate: 'স্বাক্ষর ও তারিখ',
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
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10 }}>
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
                        <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: 18, fontWeight: 700, lineHeight: 1.25, textAlign: 'center' }}>
                          {t.title}
                        </h2>
                      </div>
                    </td>

                    {/* PHOTO — 25% */}
                    <td style={{ width: '25%', padding: 0, border: 'none', verticalAlign: 'middle' }}>
                      <div style={{ width: '3.5cm', height: '4.5cm', maxWidth: '100%', margin: '0 auto', border: '1px solid #000', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11, color: '#555', overflow: 'hidden' }}>
                        <span>{t.photo}</span>
                      </div>
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

              <div className="mfc-row" style={{ alignItems: 'center' }}>
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

                <div style={{ fontWeight: 600, fontSize: '8.3pt', marginBottom: 3 }}>
                  {t.eyeExamination}:
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>

                    <div className="mfc-med-row" style={{ marginBottom: 3 }}>
                      <span className="mfc-med-label" style={{ minWidth: 30 }}>
                        VAR:
                      </span>

                      <span className="mfc-field-line"></span>
                    </div>

                    <div className="mfc-med-row">
                      <span className="mfc-med-label" style={{ minWidth: 30 }}>
                        VAL:
                      </span>

                      <span className="mfc-field-line"></span>
                    </div>

                  </div>

                  <div style={{ flex: 1 }}>

                    <div className="mfc-med-row" style={{ marginBottom: 3 }}>
                      <span className="mfc-med-label" style={{ minWidth: 60 }}>
                        {t.normal}:
                      </span>

                      <span className="mfc-field-line"></span>
                    </div>

                    <div className="mfc-med-row">
                      <span className="mfc-med-label" style={{ minWidth: 60 }}>
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
              <div className="mfc-cert-box" style={{ marginTop: 12 }}>
                <p style={{ margin: 0 }}>
                  আমি এই মর্মে প্রত্যয়ন করিতেছি যে, উপরিউক্ত ব্যক্তিকে আমি পরীক্ষা করিয়াছি।
                  তিনি প্রতিষ্ঠানে নিযুক্ত হইতে ইচ্ছুক মর্মে আমার পরীক্ষা হইতে এইরূপ পাওয়া গিয়াছে
                  যে তাহার বয়স{' '}
                  <strong>
                    {age.years} {t.years}
                  </strong>{' '}
                  এবং তিনি প্রতিষ্ঠানে{' '}
                  <strong>
                    {eligibilityCategory || '---'}
                  </strong>{' '}
                  হিসাবে নিযুক্ত হইবার যোগ্য।
                </p>
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
                  <span className="mfc-stamp-box"></span>
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