// PersonalInfoSheet.tsx — REBUILT to follow the print standard shared by
// every other PrintFiles/*.tsx component (.nl-page/.nl-wrap, custom CSS
// instead of Tailwind utility classes, notesStyle.ts for the print
// reset), with one deliberate difference from AppointmentLetter/
// NomineeForm: this uses nlMultiPageCss(), not nlSinglePageCss().
//
// WHY MULTI-PAGE, NOT SINGLE-PAGE:
// This sheet has 8 substantial sections — genuinely too much content for
// one page (notesStyle.ts's own comments already call this out by name
// as a multi-page document). The centralized fitPrintContentToOnePage()
// in EmployeeFileSystem.tsx scales ANY .nl-wrap content to fit one page —
// applied here, it would try to cram 3 pages of content into 1, hit its
// 50% safety floor, and still overflow, with the added cost of
// illegibly tiny text. To prevent that, `.nl-page` below carries
// `data-multipage="true"`, and fitPrintContentToOnePage() has been
// updated to skip scaling when that marker is present — see the
// matching AUDIT FIX comment in EmployeeFileSystem.tsx. Page breaks are
// instead handled the ordinary way: nlMultiPageCss() + break-inside:avoid
// on each section box, so sections don't get cut in half across a page
// boundary, but the sheet is otherwise free to flow across as many pages
// as it needs.
//
// WHY CUSTOM CSS INSTEAD OF TAILWIND:
// Every other print document in this module (AppointmentLetter,
// NomineeForm) uses hand-rolled `nl-*`/component-prefixed CSS rather than
// Tailwind utility classes, specifically so the print/PDF-export pipeline
// (which clones styles via `document.styleSheets` for the print iframe,
// or captures the live DOM via html2canvas) doesn't depend on whatever
// Tailwind classes happen to be present/purged in the app's compiled
// stylesheet at export time. This file follows the same convention for
// consistency and the same reliability reason.
//
// All field names below are unchanged from the original and already
// confirmed against the real employee.types.ts — no `any`-casts needed.

import React from 'react';
import { EmployeeFormData } from '../employee.types';
import { nlMultiPageCss } from './notesStyle';

interface DocumentProps {
  formData: EmployeeFormData;
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
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
const val = (v?: string | null, fallback = '—') =>
  (v && String(v).trim()) ? String(v).trim() : fallback;

const PIS_CSS = `
  .pis-title { text-align: center; font-size: 13pt; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; margin: 10pt 0 12pt; }

  .pis-section { border: 1.5px solid #374151; border-radius: 4px; margin-bottom: 8pt; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
  .pis-section-head { font-weight: 700; background: #f8fafc; padding: 4pt 8pt; font-size: 9.5pt; border-bottom: 1.5px solid #374151; color: #111827; letter-spacing: 0.2px; }
  .pis-section-body { padding: 6pt 8pt; font-size: 9pt; line-height: 1.55; }

  .pis-grid-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12pt; row-gap: 3pt; }
  .pis-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 12pt; row-gap: 3pt; }
  .pis-full { grid-column: 1 / -1; }
  .pis-label { font-weight: 600; }
  .pis-muted { color: #9ca3af; }

  .pis-subhead { font-weight: 600; font-style: italic; margin: 0 0 2pt; }
  .pis-fine { font-size: 8pt; color: #4b5563; }
  .pis-block { padding-top: 4pt; }
  .pis-block + .pis-block { border-top: 1px solid #e5e7eb; margin-top: 4pt; }
  .pis-divider { border-top: 1px dashed #d1d5db; margin-top: 4pt; padding-top: 4pt; }
  .pis-entry + .pis-entry { border-top: 1px dashed #d1d5db; margin-top: 4pt; padding-top: 4pt; }

  .pis-sig-block { display: flex; justify-content: space-between; margin-top: 26pt; padding: 0 10pt; }
  .pis-sig-col { text-align: center; }
  .pis-sig-line { border-top: 1.3px solid #111827; width: 190px; margin-bottom: 4pt; }
  .pis-sig-label { font-size: 9pt; font-weight: 700; }
  .pis-sig-date { font-size: 8pt; }
`;

const PersonalInfoSheet: React.FC<DocumentProps> = ({ formData }) => (
  <div className="nl-page" data-multipage="true">
    <div className="nl-wrap">

      <div className="nl-header">
        <h1 className="nl-co-name">{val(formData.companyName, 'Company Name')}</h1>
        <p className="nl-co-addr">{val(formData.companyAddress)}</p>
      </div>
      <div className="pis-title">PERSONAL BACKGROUND VERIFICATION SHEET</div>

      {/* 1. Office Identification */}
      <div className="pis-section">
        <div className="pis-section-head">OFFICE IDENTIFICATION</div>
        <div className="pis-section-body pis-grid-3">
          <div><span className="pis-label">Card No:</span> {val(formData.cardNo)}</div>
          <div><span className="pis-label">ID No:</span> {val(formData.idNo)}</div>
          <div><span className="pis-label">Date Of Joining:</span> {val(formData.joiningDate)}</div>
          <div><span className="pis-label">Proximity No:</span> {val(formData.proximityNumber)}</div>
          <div><span className="pis-label">Grade:</span> {val(formData.grade)}</div>
          <div><span className="pis-label">Section/Line:</span> {val(formData.sectionLine)}</div>
        </div>
      </div>

      {/* 2. Personal Information */}
      <div className="pis-section">
        <div className="pis-section-head">PERSONAL INFORMATION</div>
        <div className="pis-section-body pis-grid-2">
          <div className="pis-full"><span className="pis-label">Full Name (Eng):</span> {val(formData.fullName)}</div>
          <div className="pis-full"><span className="pis-label">Full Name (Ben):</span> {val(formData.fullNameBengali)}</div>
          <div><span className="pis-label">Father's Name:</span> {val(formData.fatherName)}</div>
          <div><span className="pis-label">Mother's Name:</span> {val(formData.motherName)}</div>
          <div><span className="pis-label">Date of Birth:</span> {formatDate(formData.dateOfBirth) || '—'}</div>
          <div><span className="pis-label">Gender:</span> {val(formData.gender)}</div>
          <div><span className="pis-label">Blood Group:</span> {val(formData.bloodGroup)}</div>
          <div><span className="pis-label">Marital Status:</span> {val(formData.maritalStatus)}</div>
          <div><span className="pis-label">Nationality:</span> {val(formData.nationality)}</div>
          <div><span className="pis-label">Religion:</span> {val(formData.religion)}</div>
          <div><span className="pis-label">National ID:</span> {val(formData.nid)}</div>
          <div><span className="pis-label">Birth Reg. No:</span> {val(formData.birthRegistrationNo)}</div>
          <div><span className="pis-label">Passport No:</span> {val(formData.passportNumber)}</div>
          <div><span className="pis-label">TIN Number:</span> {val(formData.tinNumber)}</div>
          <div><span className="pis-label">Height:</span> {val(formData.height)}</div>
          <div><span className="pis-label">Weight (kg):</span> {val(formData.weight)}</div>
          <div className="pis-full"><span className="pis-label">Identification Mark:</span> {val(formData.identificationMark)}</div>
        </div>
      </div>

      {/* 3. Spouse & Family */}
      <div className="pis-section">
        <div className="pis-section-head">SPOUSE &amp; FAMILY DETAILS</div>
        <div className="pis-section-body pis-grid-2">
          <div><span className="pis-label">Spouse Name:</span> {val(formData.spouseName)}</div>
          <div><span className="pis-label">Spouse Phone:</span> {val(formData.spousePhone)}</div>
          <div><span className="pis-label">Profession:</span> {val(formData.spouseProfession)}</div>
          <div><span className="pis-label">Education:</span> {val(formData.spouseEducation)}</div>
          <div><span className="pis-label">Spouse DOB:</span> {formatDate(formData.spouseDob) || '—'}</div>
          <div><span className="pis-label">Spouse Blood:</span> {val(formData.spouseBloodGroup)}</div>
          <div><span className="pis-label">No. of Sons:</span> {val(formData.numberOfSons)}</div>
          <div><span className="pis-label">No. of Daughters:</span> {val(formData.numberOfDaughters)}</div>
        </div>
      </div>

      {/* 4. Contact Information */}
      <div className="pis-section">
        <div className="pis-section-head">CONTACT INFORMATION</div>
        <div className="pis-section-body">
          <div className="pis-grid-2">
            <div><span className="pis-label">Mobile:</span> {fmtMobile(formData.mobile)}</div>
            <div><span className="pis-label">Email:</span> {val(formData.email)}</div>
          </div>
          <div className="pis-block">
            <p className="pis-subhead">Present Address</p>
            <p>{val(formData.presentAddress)}</p>
            <p className="pis-fine">
              Union: {val(formData.presentUnion)}, Village: {val(formData.presentVillage)}, P.O: {val(formData.presentPostOffice)},
              {' '}Thana: {val(formData.presentThana)}, Dist: {val(formData.presentDistrict)}, Div: {val(formData.presentDivision)}
            </p>
          </div>
          <div className="pis-block">
            <p className="pis-subhead">Permanent Address</p>
            <p>{val(formData.permanentAddress)}</p>
            <p className="pis-fine">
              Union: {val(formData.permanentUnion)}, Village: {val(formData.permanentVillage)}, P.O: {val(formData.permanentPostOffice)},
              {' '}Thana: {val(formData.permanentThana)}, Dist: {val(formData.permanentDistrict)}, Div: {val(formData.permanentDivision)}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Employment and EDUCATION*/}
      <div className="pis-section">
        <div className="pis-section-head">EMPLOYMENT</div>
        <div className="pis-section-body">
          <div className="pis-grid-2">
            <div><span className="pis-label">Designation:</span> {val(formData.designation)}</div>
            <div><span className="pis-label">Department:</span> {val(formData.department)}</div>
            <div><span className="pis-label">Joining Date:</span> {formatDate(formData.joiningDate) || '—'}</div>
            <div><span className="pis-label">Monthly Salary:</span> {val(formData.grossSalary)}</div>
            <div><span className="pis-label">Fixed Salary:</span> {val(formData.fixedSalary)}</div>
            <div><span className="pis-label">Job Source:</span> {val(formData.jobSource)}</div>
          </div>
        </div>
      </div>

      <div className="pis-section">
        <div className="pis-section-head">EDUCATION</div>

        <div className="pis-section-body">
          {formData.educationHistory.length > 0 ? (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Education
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Group
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Board
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Institution
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Passing Year
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Result
                  </th>
                </tr>
              </thead>

              <tbody>
                {formData.educationHistory.map((ed) => (
                  <tr key={ed.id}>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(ed.education)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(ed.educationGroup)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(ed.educationBoard)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(ed.institution)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                      {val(ed.passingYear)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                      {val(ed.educationResult)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className="pis-muted">—</span>
          )}
        </div>
      </div>

      {/* 6. Previous Experience */}
      <div className="pis-section">
        <div className="pis-section-head">PREVIOUS EXPERIENCE</div>

        <div className="pis-section-body">
          {formData.previousJobs.length > 0 ? (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Company
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    চাকরির বছর
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Designation
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    Reason for Leave
                  </th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                    রেফারেন্স
                  </th>
                </tr>
              </thead>

              <tbody>
                {formData.previousJobs.map((job) => (
                  <tr key={job.id}>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(job.prevCompanyName)}
                    </td>

                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                      {val(job.prevServiceYears)}
                    </td>

                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(job.prevDesignation)}
                    </td>

                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(job.prevLeaveReason)}
                    </td>

                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {val(job.prevRefDetails)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className="pis-muted">—</span>
          )}
        </div>
      </div>

      {/* 7. Banking & Nominee */}
      <div className="pis-section">
        <div className="pis-section-head">BANKING</div>
        <div className="pis-section-body pis-grid-2">
          <div><span className="pis-label">Bank:</span> {val(formData.bankName)} ({val(formData.bankBranch)})</div>
          <div><span className="pis-label">A/C No:</span> {val(formData.bankAccountNo)}</div>
        </div>
      </div>
      
      <div className="pis-section">
        <div className="pis-section-head">NOMINEE</div>
        <div className="pis-section-body pis-grid-2">
            <span className="pis-label">Nominee:</span> {val(formData.nomineeName)} ({val(formData.nomineeRelation)}) - {val(formData.nomineePercentage)}%
            <br />
            <span className="pis-label">Address:</span> {val(formData.nomineeAddress)}
        </div>
      </div>

      {/* 8. Emergency & Reference */}
      <div className="pis-section">
        <div className="pis-section-head">EMERGENCY &amp; REFERENCE</div>
        <div className="pis-section-body pis-grid-2">
          <div><span className="pis-label">Emergency Contact:</span> {val(formData.emergencyName)} ({val(formData.emergencyRelation)})</div>
          <div><span className="pis-label">Phone:</span> {fmtMobile(formData.emergencyMobile)}</div>
          <div className="pis-full pis-divider">
            <span className="pis-label">Supervisor Ref:</span> {val(formData.supervisorName)} | {val(formData.supervisorOrg)}
            <br />
            <span className="pis-label">Supervisor Phone:</span> {fmtMobile(formData.supervisorPhone)} | <span className="pis-label">Relation:</span> {val(formData.supervisorRelation)}
          </div>
        </div>
      </div>

      <div 
        className="pis-section" 
        style={{ 
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
          margin: '20px 0',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
      >
        <div 
          className="pis-section-head" 
          style={{fontWeight: '700', fontSize: '15px', color: '#111827', letterSpacing: '0.5px' }}
        >
          ATTESTATION
        </div>

        <table
          style={{
            width: '100%',
            maxWidth: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: '13px',
            border: '1px solid #9ca3af',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <tbody>
            <tr>
              <th style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #9ca3af', padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#1f2937', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                Verification Methods
              </th>
            </tr>
            <tr>
              <td style={{ borderBottom: '1px solid #9ca3af', padding: '18px 14px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 32px', lineHeight: '1.6', color: '#374151', fontWeight: '500' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>☐ A. Telephone / Mobile</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>☐ B. Personal Contact</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>☐ C. Verification by Police</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>☐ D. Educational Certificate</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>☐ E. National Identity Card (NID)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>☐ F. Service Book</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>☐ G. Birth Registration</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ borderBottom: '1px solid #9ca3af', padding: '14px 14px', backgroundColor: '#fffbeb', color: '#111827' }}>
                <span style={{ fontWeight: '700', color: '#1f2937' }}>Verifier's Note:</span>{' '}
                <span style={{ fontStyle: 'italic', color: '#374151', fontWeight: '500' }}>
                  All the information provided above has been independently verified and is true and correct.
                </span>
              </td>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #9ca3af', padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#1f2937', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                Verifier Details
              </th>
            </tr>
<tr>
  <td style={{ padding: '24px 14px', backgroundColor: '#ffffff' }}>
    <div 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '24px 56px' 
      }}
    >
      {/* Verifier 01 - Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>Verifier Name:</span>
          <div style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>Designation:</span>
          <div style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px', paddingBottom: '4px' }}>
            Sig. & Date:
          </span>
          <div 
            style={{ 
              flexGrow: 1, 
              borderBottom: '1.5px dotted #6b7280', 
              minHeight: '45px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'flex-end', 
              alignItems: 'center',
              paddingBottom: '4px',
              color: '#374151', 
              fontSize: '12px' 
            }}
          >
            {/* উপরে স্বাক্ষরের জন্য খালি জায়গা বা হালকা টেক্সট */}
            <span style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '10px', marginBottom: '12px' }}>
              Signature
            </span>
            
            {/* নিচে ডাইনামিক তারিখ */}
            <span style={{ fontWeight: '500', fontSize: '12px' }}>
              {formatDate(formData.joiningDate) || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Verifier 02 - Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>Verifier Name:</span>
          <div style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px' }}>Designation:</span>
          <div style={{ flexGrow: 1, borderBottom: '1.5px dotted #6b7280', minHeight: '20px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{ whiteSpace: 'nowrap', color: '#1f2937', fontWeight: '600', minWidth: '90px', paddingBottom: '4px' }}>
            Sig. & Date:
          </span>
          <div 
            style={{ 
              flexGrow: 1, 
              borderBottom: '1.5px dotted #6b7280', 
              minHeight: '45px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'flex-end', 
              alignItems: 'center',
              paddingBottom: '4px',
              color: '#374151', 
              fontSize: '12px' 
            }}
          >
            {/* উপরে স্বাক্ষরের জন্য খালি জায়গা বা হালকা টেক্সট */}
            <span style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '10px', marginBottom: '12px' }}>
              Signature
            </span>
            
            {/* নিচে ডাইনামিক তারিখ */}
            <span style={{ fontWeight: '500', fontSize: '12px' }}>
              {formatDate(formData.joiningDate) || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </td>
</tr>
          </tbody>
        </table>
      </div>
      {/* 9. Signatures */}
<div className="pis-sig-block" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
  <div className="pis-sig-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
    <div className="pis-sig-line" style={{ width: '180px', borderBottom: '1.5px solid #6b7280', marginBottom: '6px' }} />
    <p className="pis-sig-label" style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '12px', letterSpacing: '0.5px' }}>
      HR / MANAGER SIGNATURE
    </p>
    <p className="pis-sig-date" style={{ margin: '4px 0 0 0', color: '#374151', fontSize: '12px' }}>
      Date: {formatDate(formData.joiningDate) || '—'}
    </p>
  </div>
</div>

    </div>

    <style>{nlMultiPageCss() + PIS_CSS}</style>
  </div>
);

export default PersonalInfoSheet;