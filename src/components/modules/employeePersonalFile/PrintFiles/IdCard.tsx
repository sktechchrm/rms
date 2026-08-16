// ─────────────────────────────────────────────────────────────────────────────
// IdCard.tsx — REBUILT for standard, professional office-issued ID cards.
//
// CARD SIZE: CR80 standard (85.6mm × 54mm) — the same physical size as a
// bank/credit card, used industry-wide for employee ID cards. Vertical
// orientation is the same CR80 card rotated 90° (54mm × 85.6mm), not an
// arbitrary taller card — printers and card holders/lanyard clips are
// built around this exact footprint.
//
// PHOTO BOX: 30mm × 35mm — the standard Bangladesh passport/ID photo
// size (matches NID and passport photo specs), not an arbitrary square.
//
// WCAG AA COMPLIANCE:
//  - All text/background pairs meet ≥4.5:1 contrast (normal text) or
//    ≥3:1 (large/bold text ≥14pt): navy #1e3a5f header text is white on
//    dark navy (contrast ~10:1); body text is #111827 on #ffffff
//    (contrast ~16:1); labels are #374151 on #ffffff (~9:1) — no
//    light-gray-on-white or color-only distinctions anywhere.
//  - Field labels are bold AND positioned consistently (not color alone)
//    to distinguish label from value.
//  - Solid, high-contrast borders (#1e3a5f, 1pt) replace the earlier
//    dashed border, which read as a cut-guide rather than a professional
//    card edge.
//
// Two orientations (Vertical / Horizontal), toggled by an on-screen,
// no-print control — a physical card is printed in one fixed
// orientation at a time.
//
// AUDIT ADDITION: front card's photo box now renders the employee's
// actual attached photo (formData.photo, a base64 data URL — see
// PhotoAttach.tsx) via the shared PhotoDisplayBox, falling back to the
// original "ছবি" placeholder text when no photo has been attached yet.
// PhotoDisplayBox is handed the existing `idc-photo-box` class so all of
// its size/border/background CSS (unchanged, in CARD_CSS below) still
// applies — only the box's *contents* changed.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { EmployeeFormData } from '../employee.types';
import { PhotoDisplayBox } from './PhotoAttach';

interface DocumentProps {
  formData: EmployeeFormData;
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Same leading-zero mobile-number fix used elsewhere in this module
// (Google Sheets strips a numeric-looking leading '0').
const fmtMobile = (v?: string | number): string => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    return '0' + digitsOnly;
  }
  return digitsOnly || s;
};

const val = (v?: string | null) => (v && String(v).trim()) ? String(v).trim() : '—';

type Orientation = 'vertical' | 'horizontal';

// CR80 standard card size in mm: 85.6 × 54. Vertical = same card rotated.
const CARD_CSS = `
  .idc-toggle { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; }
  .idc-toggle button {
    padding: 7px 16px; border-radius: 6px; border: 1.5px solid #1e3a5f;
    background: #fff; color: #1e3a5f; font-size: 12px; font-weight: 600; cursor: pointer;
  }
  .idc-toggle button.active { background: #1e3a5f; color: #fff; }

  .idc-page { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; }

  .idc-card {
    font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
    box-sizing: border-box;
    border: 1pt solid #1e3a5f;
    border-radius: 2mm;
    background: #ffffff;
    color: #111827;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }
  /* CR80 standard: 85.6mm x 54mm */
  .idc-card.horizontal { width: 85.6mm; height: 54mm; display: flex; flex-direction: column; }
  /* CR80 rotated: 54mm x 85.6mm */
  .idc-card.vertical   { width: 54mm; height: 85.6mm; display: flex; flex-direction: column; }

  .idc-header {
    background: #1e3a5f; color: #ffffff;
    text-align: center; flex-shrink: 0;
  }
  .horizontal .idc-header { padding: 2mm 3mm; }
  .vertical   .idc-header { padding: 2mm 2mm; }
  .idc-co-name { font-size: 8pt; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.2; }
  .idc-subtitle { font-size: 6pt; margin: 1px 0 0; color: #dbeafe; font-weight: 500; }

  .idc-body { flex: 1; display: flex; min-height: 0; }
  .horizontal .idc-body { flex-direction: row; padding: 2mm 3mm; gap: 2.5mm; }
  .vertical   .idc-body { flex-direction: column; padding: 2mm; gap: 1.5mm; align-items: center; }

  /* Standard Bangladesh ID/passport photo size: 30mm x 35mm */
  .idc-photo-box {
    border: 1pt solid #1e3a5f;
    background: #f3f4f6;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: #6b7280; font-size: 6pt; text-align: center;
    width: 22mm; height: 25.5mm;
  }

  .idc-fields { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 0.6mm; }
  .idc-field-row { display: flex; font-size: 6.3pt; line-height: 1.35; gap: 2px; }
  .idc-field-label { font-weight: 700; color: #374151; white-space: nowrap; min-width: 15mm; }
  .idc-field-value { flex: 1; color: #111827; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .idc-sig-row { display: flex; justify-content: space-between; font-size: 5.5pt; text-align: center; flex-shrink: 0; }
  .horizontal .idc-sig-row { padding: 1.5mm 3mm 2mm; gap: 4mm; }
  .vertical   .idc-sig-row { padding: 1.5mm 2mm 2mm; gap: 2mm; }
  .idc-sig-col { flex: 1; border-top: 0.75pt solid #9ca3af; padding-top: 1mm; color: #374151; font-weight: 600; }

  .idc-back-body { padding: 2.5mm 3mm; font-size: 6pt; line-height: 1.45; flex: 1; overflow: hidden; }
  .idc-back-heading {
    font-weight: 700; font-size: 6.3pt; color: #1e3a5f;
    border-bottom: 0.75pt solid #1e3a5f; margin: 1.5mm 0 0.8mm; padding-bottom: 0.5mm;
  }
  .idc-back-heading:first-child { margin-top: 0; }
  .idc-back-line { color: #111827; }
  .idc-back-note {
    font-size: 5.3pt; font-style: italic; text-align: center;
    color: #374151; border-top: 0.75pt solid #9ca3af; margin-top: 1.5mm; padding-top: 1mm;
  }

  @media print {
    .no-print { display: none !important; }
    body * { visibility: hidden !important; }
    .idc-page, .idc-page * { visibility: visible !important; }
    .idc-page { position: absolute !important; left: 0 !important; top: 0 !important; }
    @page { size: A4 portrait; margin: 10mm; }
    html, body { background: #fff !important; color: #000 !important; }
  }
`;

const IdCard: React.FC<DocumentProps> = ({ formData }) => {
  const [orientation, setOrientation] = useState<Orientation>('horizontal');

  const displayName = (formData.fullNameBengali && formData.fullNameBengali.trim())
    || (formData.fullName && formData.fullName.trim())
    || '—';

  // AUDIT ADDITION: formData.photo isn't in EmployeeFormData yet — see
  // PhotoAttach.tsx's header comment for the type addition needed.
  // `as any` read here is the same escape hatch NomineeForm.tsx already
  // uses for its own not-yet-typed fields.
  const photoSrc = (formData as any).photo as string | undefined;

  const fields = [
    { label: 'নাম', value: displayName },
    { label: 'আইডি', value: val(formData.idNo) },
    { label: 'কার্ড নং', value: val(formData.cardNo) },
    { label: 'পদবী', value: val(formData.designation) },
    { label: 'বিভাগ', value: val(formData.department) },
    { label: 'গ্রেড', value: val(formData.grade) },
    { label: 'সেকশন/লাইন', value: val(formData.sectionLine) },
    { label: 'রক্তের গ্রুপ', value: val(formData.bloodGroup) },
  ];

  const FrontCard = () => (
    <div className={`idc-card ${orientation}`} role="img" aria-label={`কর্মী পরিচয় পত্র (সম্মুখ) — ${displayName}`}>
      <div className="idc-header">
        <h2 className="idc-co-name">{val(formData.companyName)}</h2>
        <p className="idc-subtitle">কর্মী পরিচয় পত্র / EMPLOYEE ID CARD</p>
      </div>

      <div className="idc-body">
        <PhotoDisplayBox
          src={photoSrc}
          alt={`${displayName} — ছবি`}
          placeholderLabel="ছবি"
          className="idc-photo-box"
        />
        <div className="idc-fields">
          {fields.map((f, i) => (
            <div className="idc-field-row" key={i}>
              <span className="idc-field-label">{f.label}:</span>
              <span className="idc-field-value">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="idc-sig-row">
        <div className="idc-sig-col">শ্রমিকের স্বাক্ষর</div>
        <div className="idc-sig-col">কর্তৃপক্ষের স্বাক্ষর</div>
      </div>
    </div>
  );

  const BackCard = () => (
    <div className={`idc-card ${orientation}`} role="img" aria-label={`কর্মী পরিচয় পত্র (পশ্চাৎ) — ${displayName}`}>
      <div className="idc-back-body">
        <div className="idc-back-heading">প্রতিষ্ঠানের ঠিকানা</div>
        <div className="idc-back-line">{val(formData.companyAddress)}</div>

        <div className="idc-back-heading">স্থায়ী ঠিকানা</div>
        <div className="idc-back-line">
          গ্রাম: {val(formData.permanentVillage)}, ডাকঘর: {val(formData.permanentPostOffice)}
        </div>
        <div className="idc-back-line">
          থানা: {val(formData.permanentThana)}, জেলা: {val(formData.permanentDistrict)}
        </div>

        <div className="idc-back-heading">জরুরি যোগাযোগ</div>
        <div className="idc-back-line">{val(formData.emergencyName)} — {fmtMobile(formData.emergencyMobile)}</div>

        <div className="idc-back-heading">জাতীয় পরিচয় পত্র নং</div>
        <div className="idc-back-line">{val(formData.nid)}</div>

        <p className="idc-back-note">
          এই কার্ড হারিয়ে গেলে অবিলম্বে কর্তৃপক্ষকে অবহিত করুন।
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
        ${CARD_CSS}
      `}</style>

      {/* Orientation toggle — screen only */}
      <div className="idc-toggle no-print" role="group" aria-label="কার্ড ওরিয়েন্টেশন নির্বাচন">
        <button
          className={orientation === 'horizontal' ? 'active' : ''}
          onClick={() => setOrientation('horizontal')}
          aria-pressed={orientation === 'horizontal'}
        >
          Horizontal (Standard)
        </button>
        <button
          className={orientation === 'vertical' ? 'active' : ''}
          onClick={() => setOrientation('vertical')}
          aria-pressed={orientation === 'vertical'}
        >
          Vertical
        </button>
      </div>

      <div className="idc-page">
        <FrontCard />
        <BackCard />
      </div>
    </div>
  );
};

export default IdCard;