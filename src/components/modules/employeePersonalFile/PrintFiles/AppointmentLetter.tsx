// ─────────────────────────────────────────────────────────────────────────────
// AppointmentLetter.tsx — Fully dynamic with formData
// REBUILT: follows Left Worker Notice's visual/print CSS structure
// (.nl-page/.nl-wrap/...). Per explicit request, now targets a SINGLE
// print page — the earlier multi-page variant was a real mismatch with
// this app's PDF export (html2canvas + jsPDF captures one screenshot
// onto one page, doesn't truly paginate — confirmed via a real exported
// PDF: 32MB, one page, content either scaled down or clipped). Fitting
// everything onto one sheet via tighter spacing sidesteps that mismatch
// entirely rather than requiring a rewrite of the export mechanism.
//
// FIX (printable-layout audit): the compact spacing below used to live
// inside `@media print { ... }`. Because the export pipeline is
// html2canvas + jsPDF — a DOM screenshot, not a real browser print —
// the print media query never activates, so none of these overrides
// were actually reaching the exported PDF; the letter was being
// captured at the loose base spacing from nlSinglePageCss() and
// overflowing onto a second page that then got clipped/scaled.
// The rules are now applied unconditionally (still `!important` to
// beat nlSinglePageCss()'s defaults) so they take effect both on
// screen and in the html2canvas capture.
//
// The guaranteed single-page fit itself (measuring actual rendered
// height and shrinking if needed) now lives centrally in
// EmployeeFileSystem.tsx's fitPrintContentToOnePage(), shared by both
// the print path and the PDF-export path, and applied generically via
// `.nl-wrap` — no per-component JS needed here. This file only needs to
// keep spacing reasonably tight so little or no shrinking is required.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  EmployeeFormData,
  getAppointmentConditions,
  AppointmentCondition,
} from '../employee.types';
import { nlSinglePageCss } from './notesStyle';
import { toBanglaNumber } from '../../../../utils/bnEnDate';

// Letter-specific compact overrides, layered on top of the shared
// single-page CSS — this letter has meaningfully denser content (2
// address boxes + an employment box + ~16 numbered clauses + salary
// table + signatures) than Left Notice's own short letters, so it needs
// tighter spacing than the shared default to still fit one A4 page.
//
// Applied unconditionally (not inside @media print) — see the FIX note
// above for why.
const COMPACT_PRINT_CSS = `
  .nl-page { padding: 6mm 10mm !important; }
  .nl-header { padding-bottom: 5pt !important; margin-bottom: 5pt !important; }
  .nl-co-name { font-size: 12.5pt !important; margin-bottom: 1pt !important; }
  .nl-co-addr { font-size: 8pt !important; }

  .nl-title-bar { padding: 3pt 0 2pt !important; margin-bottom: 4pt !important; }
  .nl-title { font-size: 10.5pt !important; }
  .nl-meta { font-size: 8.5pt !important; }

  .nl-to { font-size: 9pt !important; margin: 2pt 0 3pt !important; }

  .nl-emp-box { margin-bottom: 6pt !important; }
  .nl-emp-col { padding: 5pt 7pt !important; }
  .nl-emp-head { font-size: 8.5pt !important; padding-bottom: 2pt !important; margin-bottom: 3pt !important; }
  .nl-emp-tbl { font-size: 7.8pt !important; }
  .nl-emp-tbl td { padding: 0.5pt 3pt 0.5pt 0 !important; line-height: 1.25 !important; }
  /* Per explicit request — try to keep name/address values on one line.
     "Try": if a value is genuinely too long to fit even at this
     compact size, the cell is still allowed to wrap rather than being
     clipped — losing part of an address is worse than an imperfect
     line break. The page-level auto-scale (in EmployeeFileSystem.tsx's
     print handler) also checks horizontal overflow as a second-layer
     safety net for the rare case a value pushes the table wider than
     its column. */
  .nl-emp-tbl td:last-child { white-space: nowrap; overflow-wrap: normal; }

  .nl-body { margin-bottom: 4pt !important; }
  .nl-clause-title { font-size: 9pt !important; margin-bottom: 0.5pt !important; }
  .nl-para { font-size: 8pt !important; line-height: 1.25 !important; margin-bottom: 2pt !important; }

  .nl-footer { margin-top: 8pt !important; padding-top: 4pt !important; }
  .nl-authority { font-size: 9pt !important; }
`;

interface Props { formData: EmployeeFormData; }

const fmtDate = (s?: string) => {
  if (!s) return '---';
  return new Date(s).toLocaleDateString('bn-BD', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};
const fmtMobile = (v?: string | number): string => {
  const s = String(v ?? '').trim();
  if (!s) return '---';
  // ১০ ডিজিট এবং '1' দিয়ে শুরু হলে (Google Sheets-এর leading-zero
  // strip করে ফেলার কারণে) সামনে '0' জুড়ে দেওয়া হচ্ছে — বাংলাদেশি
  // মোবাইল নম্বর সবসময় ১১ ডিজিট, '01' দিয়ে শুরু।
  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    return '0' + digitsOnly;
  }
  return digitsOnly || s;
};
const val = (v?: string | null, fallback = '---') =>
  v && v.trim() ? v.trim() : fallback;

const AppointmentLetter: React.FC<Props> = ({ formData }) => {
  const conditions = getAppointmentConditions(formData);

  const idDisplay = val(formData.idNo) !== '---'
    ? formData.idNo
    : val(formData.cardNo);

  return (
    <div className="nl-page">
      <div className="nl-wrap">

        {/* ══ HEADER ══════════════════════════════════════ */}
        <div className="nl-header">
          <h1 className="nl-co-name">{val(formData.companyName, 'Company Name')}</h1>
          <p className="nl-co-addr">{val(formData.companyAddress)}</p>
        </div>

        {/* ══ TITLE BAR ════════════════════════════════════ */}
        <div className="nl-title-bar">
          <h2 className="nl-title">নিয়োগ পত্র (Appointment Letter)</h2>
          <div className="nl-meta">
            <span className="nl-meta-type">সূত্র: {val(formData.companyName, 'কোং')}/{toBanglaNumber(val(idDisplay))}</span>
            <span className="nl-meta-date">তারিখ: <strong>{fmtDate(formData.joiningDate)} ইং</strong></span>
          </div>
        </div>

        {/* ══ TO + ADDRESS + EMPLOYMENT — ALL THREE IN ONE ROW ═════════════ */}
        <p className="nl-to">প্রতি,</p>
        <div className="nl-emp-box" style={{ maxWidth: 'none' }}>
          <div className="nl-emp-col">
            <div className="nl-emp-head">নিয়োগ বিবরণ</div>
            <table className="nl-emp-tbl"><tbody>
              <tr><td>নাম</td><td>{val(formData.fullNameBengali)}</td></tr>
              <tr><td>আইডি নং</td><td>{toBanglaNumber(val(idDisplay))}</td></tr>
              {/* <tr><td>পদবী</td><td>{val(formData.designation)}</td></tr>
              <tr><td>বিভাগ</td><td>{val(formData.department || formData.sectionLine)}</td></tr> */}
              {/* <tr><td>কার্ড নং</td><td>{toBanglaNumber(val(formData.cardNo))}</td></tr> */}
              {/* <tr><td>গ্রেড</td><td>{toBanglaNumber(val(formData.grade))}</td></tr>
              <tr><td>যোগদানের তারিখ</td><td>{fmtDate(formData.joiningDate)} ইং</td></tr> */}
              {formData.nid && <tr><td>জাতীয় পরিচয়পত্র</td><td>{toBanglaNumber(formData.nid)}</td></tr>}
              {formData.mobile && <tr><td>মোবাইল</td><td>{toBanglaNumber(fmtMobile(formData.mobile))}</td></tr>}
            </tbody></table>
          </div>
          <div className="nl-emp-divider" />
          <div className="nl-emp-col">
            <div className="nl-emp-head">বর্তমান ঠিকানা</div>
            <table className="nl-emp-tbl"><tbody>
              {/* <tr><td>নাম</td><td>{val(formData.fullName)}</td></tr>
              <tr><td>বাড়ি/রাস্তা</td><td>{val((formData as any).presentHouseNo)}</td></tr> */}
              <tr><td>গ্রাম</td><td>{val(formData.presentVillage)}</td></tr>
              <tr><td>ডাকঘর</td><td>{val(formData.presentPostOffice)}</td></tr>
              <tr><td>থানা</td><td>{val(formData.presentThana)}</td></tr>
              <tr><td>জেলা</td><td>{val(formData.presentDistrict)}</td></tr>
            </tbody></table>
          </div>
          <div className="nl-emp-divider" />
          <div className="nl-emp-col">
            <div className="nl-emp-head">স্থায়ী ঠিকানা</div>
            <table className="nl-emp-tbl"><tbody>
              {/* <tr><td>নাম</td><td>{val(formData.fullName)}</td></tr>
              <tr><td>পিতার নাম</td><td>{val(formData.fatherName)}</td></tr>
              <tr><td>বাড়ি/রাস্তা</td><td>{val((formData as any).permanentHouseNo)}</td></tr> */}
              <tr><td>গ্রাম</td><td>{val(formData.permanentVillage)}</td></tr>
              <tr><td>ডাকঘর</td><td>{val(formData.permanentPostOffice)}</td></tr>
              <tr><td>থানা</td><td>{val(formData.permanentThana)}</td></tr>
              <tr><td>জেলা</td><td>{val(formData.permanentDistrict)}</td></tr>
            </tbody></table>
          </div>
        </div>

        {/* ══ SALUTATION ═══════════════════════════════════ */}
        {/* NOTE: salutation (জনাব/জনাবা,) is rendered via the conditions
           loop below ('greeting' entry) — a hardcoded duplicate used to
           sit here too, rendering it twice (confirmed via a real exported
           PDF). Removed. */}

        {/* ══ CONDITIONS ═══════════════════════════════════ */}
        <div className="nl-body">
          {conditions.map((cond: AppointmentCondition) => (
            <ConditionBlock key={String(cond.id)} cond={cond} />
          ))}
        </div>

        {/* ══ SIGNATURE ════════════════════════════════════ */}
        <div className="nl-footer" style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5px solid #374151', width: 180, marginBottom: 4 }} />
              <div className="nl-authority">স্বাক্ষর : শ্রমিক/কর্মচারী/কর্মকর্তা</div>
              {/* <div style={{ fontSize: 11, color: '#555' }}>(Employee Signature)</div> */}
              <div style={{ fontSize: 12, marginTop: 4 }}>{val(formData.fullName)}</div>
              <div style={{ fontSize: 12 }}>{fmtDate(formData.joiningDate)} ইং</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5px solid #374151', width: 180, marginBottom: 4 }} />
              <div className="nl-authority">স্বাক্ষর : কর্তৃপক্ষ</div>
              {/* <div style={{ fontSize: 11, color: '#555' }}>(Authority Signature)</div> */}
              <div style={{ fontSize: 12, marginTop: 4 }}>{val(formData.companyName)}</div>
            </div>
          </div>
        </div>

      </div>

      <style>{nlSinglePageCss() + COMPACT_PRINT_CSS}</style>
    </div>
  );
};

// ── Condition Block ───────────────────────────────────────────────────────────

const ConditionBlock: React.FC<{ cond: AppointmentCondition }> = ({ cond }) => {
  // Salary breakdown table
  if (cond.subConditions && String(cond.id) === '2') {
    return (
      <div className="nl-para" style={{ marginBottom: 3 }}>
        <div className="nl-clause-title">{cond.title}:</div>
        <table style={{ marginLeft: 20, marginTop: 2, borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {cond.subConditions.map((sub, i) => (
              <tr key={i} style={{
                borderTop: sub.key === 'মোট' ? '1.5px solid #374151' : 'none',
                fontWeight: sub.key === 'মোট' ? 700 : 400,
              }}>
                <td style={{ paddingRight: 10, lineHeight: 1.35 }}>{sub.key}</td>
                <td style={{ lineHeight: 1.35 }}>: {sub.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Sub-condition list
  if (cond.subConditions) {
    return (
      <div style={{ marginBottom: 3 }}>
        <div className="nl-clause-title">
          {cond.title}{cond.content ? `: ${cond.content}` : ''}
        </div>
        <div style={{ marginLeft: 20 }}>
          {cond.subConditions.map((sub, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, lineHeight: 1.35 }}>
              <span style={{ minWidth: 22, fontWeight: 700 }}>{sub.key}</span>
              <span>{sub.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Plain text condition
  return (
    <div className="nl-para" style={{ marginBottom: 3 }}>
      {cond.title && (
        <span className="nl-clause-title" style={{ display: 'inline' }}>{cond.title}{cond.content ? ' ' : ''}</span>
      )}
      {cond.content}
    </div>
  );
};

export default AppointmentLetter;