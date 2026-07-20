// NomineeForm.tsx — matches the reference nominee-declaration form
// layout (bordered government-form grid, present/permanent address
// sub-grids, a multi-category benefit-share table, and a witness/
// signature block).
//
// Field names below reflect your actual employee.types.ts (adopted from
// your own edit): presentHouseNo, gender, motherName, spouseName,
// dateOfBirth, permanentHouseNo, and the existing fullName, fatherName,
// present*/permanent* address parts, designation, joiningDate,
// companyName, companyAddress, nomineeName, nomineeRelation, nomineeNid,
// nomineePercentage.
//
// Still-unconfirmed fields (read via `(formData as any).fieldName`, same
// escape-hatch pattern as elsewhere — renders blank rather than breaking
// the build if the name doesn't match):
//   identificationMark → সনাক্তকরণ চিহ্ন
//   nomineeVillage / nomineePostOffice / nomineeThana / nomineeDistrict
//                      → nominee's address
//   relativeMobile     → নমিনীর মোবাইল নং
//   nomineeDob         → nominee's date of birth, used to compute the
//                         বয়স (age) column — see calcAgeBn() below
//
// FIX: nl-header was a sibling of .nl-wrap rather than nested inside it.
// EmployeeFileSystem.tsx's centralized fitPrintContentToOnePage() scales
// (and measures, for the "does this fit one page" check) .nl-wrap
// specifically — content outside it isn't included in that calculation
// and wouldn't scale down together with the rest. Moved inside.
//
// FIX: removed a duplicate NID line (val(formData.nomineeNid) followed
// by a second conditional line rendering the same value again).

import React from 'react';
import { EmployeeFormData } from '../employee.types';
import { nlSinglePageCss } from './notesStyle';
import { toBanglaNumber } from '../../../../utils/bnEnDate';

interface DocumentProps {
  formData: EmployeeFormData;
}

// Kept exported (unchanged behavior) in case anything else imports it.
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Numeric DD-MM-YYYY with Bangla digits, matching the reference form's
// date style (e.g. "০৭-১০-১৯৮৫").
const fmtDateNumeric = (dateString?: string): string => {
  if (!dateString) return '---';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '---';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return toBanglaNumber(`${dd}-${mm}-${yyyy}`);
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

// Age in completed years, from a date-of-birth string to today, in
// Bangla digits — used for the নমিনী বয়স column (image-1: dob → age).
const calcAgeBn = (dobString?: string): string => {
  if (!dobString) return '---';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '---';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  if (age < 0 || !isFinite(age)) return '---';
  return toBanglaNumber(String(age));
};

const val = (v?: string | null, fallback = '---') =>
  (v && String(v).trim()) ? String(v).trim() : fallback;

const FORM_CSS = `
  .nom-title { display: block; text-align: center; font-weight: 700; font-size: 12.5pt; margin: 2pt 0 8pt; }

  .nom-outer { margin-bottom: 10pt; }
  .nom-info-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  .nom-info-table td { border: none; padding: 3pt 6pt; vertical-align: top; line-height: 1.4; }
  .nom-label { font-weight: 600; }

  .nom-declaration { font-size: 9.5pt; line-height: 1.55; text-align: justify; margin: 8pt 6pt; }

  .nom-nominee-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  .nom-nominee-table th, .nom-nominee-table td { border: 1px solid #111827; padding: 3pt 6pt; text-align: left; vertical-align: top; line-height: 1.4; }
  .nom-nominee-table thead th { text-align: center; font-weight: 700; background: #f3f4f6; }
  .nom-nominee-table .nom-idx-row th { font-weight: 600; font-size: 9pt; }
  .nom-nominee-table .nom-center { text-align: center; vertical-align: middle; }
  .nom-nominee-table .nom-cat { width: 60%; }
  .nom-nominee-table .nom-pct { width: 20%; text-align: center; vertical-align: middle; font-weight: 700; font-size: 12pt; }

  .nom-cert { font-size: 9.5pt; line-height: 1.55; margin: 10pt 0 0; }

  .nom-sig-block { display: flex; justify-content: space-between; margin-top: 30pt; padding: 0 6pt; }
  .nom-sig-col { text-align: center; }
  .nom-sig-line { border-top: 1.3px solid #111827; width: 200px; margin-bottom: 4pt; }
  .nom-sig-label { font-size: 9.5pt; }
`;

const NomineeForm: React.FC<DocumentProps> = ({ formData }) => {
  const fd = formData as unknown as Record<string, string | undefined>;

  return (
    <div className="nl-page">
      <div className="nl-wrap">

        <div className="nl-header">
          <h1 className="nl-co-name">{val(formData.companyName, 'Company Name')}</h1>
          <p className="nl-co-addr">{val(formData.companyAddress)}</p>
        </div>

        <div className="nom-title">
          জমা ও বিভিন্নখাতে প্রাপ্য অর্থ পরিষদের ঘোষণা ও মনোনয়নের ফর্ম
        </div>

        <div className="nom-outer">
          <table className="nom-info-table"><tbody>
            <tr>
              <td colSpan={4} style={{ borderBottom: '1px solid #000' }}>
                <span className="nom-label">১। শ্রমিকের নাম ও বর্তমান ঠিকানা:</span>{val(formData.fullNameBengali)}, {val(formData.presentHouseNo)}, {val(formData.presentVillage)}, {val(formData.presentPostOffice)}, {val(formData.presentThana)}, {val(formData.presentDistrict)} | <span className="nom-label">লিঙ্গ:</span> {val(formData.gender)}
              </td>
            </tr>
            <tr>
              <td colSpan={4}><span className="nom-label">২। পিতা/মাতা/স্বামী/স্ত্রী:</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td><span className="nom-label">পিতা:</span> {val(formData.fatherName)}</td>
              <td><span className="nom-label">মাতা:</span> {val(formData.motherName)}</td>
              <td><span className="nom-label">স্বামী:</span> {val(formData.spouseName)}</td>
              <td><span className="nom-label">স্ত্রী:</span> {val(formData.spouseName)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td colSpan={4}><span className="nom-label">৩। জন্ম তারিখ:</span> {fmtDateNumeric(formData.dateOfBirth)} ইং</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td colSpan={4}><span className="nom-label">৪। সনাক্তকরণ চিহ্ন (যদি থাকে):</span> {val(fd.identificationMark, 'নাই')}</td>
            </tr>
            <tr>
              <td colSpan={4}><span className="nom-label">৫। স্থায়ী ঠিকানা:</span> <span className="nom-label">বাড়ি / বাড়ি নং / রাস্তা:</span> {val(formData.permanentHouseNo)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td><span className="nom-label">গ্রাম:</span> {val(formData.permanentVillage)}</td>
              <td><span className="nom-label">ডাকঘর:</span> {val(formData.permanentPostOffice)}</td>
              <td><span className="nom-label">থানা:</span> {val(formData.permanentThana)}</td>
              <td><span className="nom-label">জেলা:</span> {val(formData.permanentDistrict)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td colSpan={2}><span className="nom-label">৬। চাকুরীতে নিযুক্তির তারিখ:</span> {fmtDateNumeric(formData.joiningDate)} ইং</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td colSpan={4}><span className="nom-label">৭। পদবি:</span> {val(formData.designation)}</td>
            </tr>
          </tbody></table>

          <p className="nom-declaration">
            আমি এতদ্বারা ঘোষণা করিতেছি যে, আমার মৃত্যু হইলে বা আমার অবর্তমানে, আমার কর্মচ্যুতি হইলে বা বিধিমতে প্রাপ্য টাকা প্রদানের জন্য নিম্নবর্ণিত
            ব্যক্তিকে/ব্যক্তিদেরকে মনোনয়ন দান করিতেছি এবং অনুরোধ জানাইতেছি যে, উক্ত নির্ধারিত পদ্ধতিতে মনোনীত ব্যক্তিদের মধ্যে বণ্টন করিতে হইবে।
          </p>

          <table className="nom-nominee-table">
            <thead>
              <tr>
                <th>মনোনীত ব্যক্তি বা ব্যক্তিদের নাম, ঠিকানা ও ছবি (নমিনীর ছবি ও স্বাক্ষর শ্রমিক কর্তৃক সত্যায়িত) এন আই ডি নং</th>
                <th>সদস্যদের সহিত মনোনীত ব্যক্তিদের সম্পর্ক</th>
                <th>বয়স</th>
                <th colSpan={2}>প্রত্যেক মনোনীত ব্যক্তিদের দেয় অংশ</th>
              </tr>
              <tr className="nom-idx-row">
                <th>১</th>
                <th>২</th>
                <th>৩</th>
                <th colSpan={2}>৪</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={7}>
                  নাম: {val(formData.nomineeName)} [{val(formData.bloodGroup)}, {val(formData.nomineeEducation)}, {val(formData.nomineeProfession)}]<br />
                  গ্রাম: {val(formData.nomineeVillage)}<br />
                  ডাক: {val(formData.nomineePostOffice)}<br />
                  থানা: {val(formData.nomineeThana)}<br />
                  জেলা: {val(formData.nomineeDistrict)}<br />
                  মোবাইল নং: {fmtMobile(formData.nomineePhone)}<br />
                  এন আই ডি নং: {toBanglaNumber(val(formData.nomineeNid, '---'))}
                </td>

                <td rowSpan={7} className="nom-center">
                  {val(formData.nomineeRelation)}
                </td>

                <td rowSpan={7} className="nom-center">
                  {calcAgeBn(fd.nomineeDob)}
                </td>

                <td>জমা খাত</td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle'}}>অংশ (%)</td>
              </tr>

              <tr>
                <td>বকেয়া মজুরি</td>
                <td className="nom-pct" style={{ fontWeight: 400 }}>{toBanglaNumber(val(formData.nomineePercentage, '---'))}</td>
              </tr>

              <tr>
                <td>প্রবিডেন্ট ফান্ড</td>
                <td className="nom-pct"></td>
              </tr>

              <tr>
                <td>বীমা</td>
                <td className="nom-pct" style={{ fontWeight: 400 }}>{toBanglaNumber(val(formData.nomineePercentage, '---'))}</td>
              </tr>

              <tr>
                <td>দুর্ঘটনার ক্ষতিপূরণ</td>
                <td className="nom-pct" style={{ fontWeight: 400 }}>{toBanglaNumber(val(formData.nomineePercentage, '---'))}</td>
              </tr>

              <tr>
                <td>লভ্যাংশ</td>
                <td className="nom-pct" style={{ fontWeight: 400 }}>{toBanglaNumber(val(formData.nomineePercentage, '---'))}</td>
              </tr>

              <tr>
                <td>অন্যান্য</td>
                <td className="nom-pct" style={{ fontWeight: 400 }}>{toBanglaNumber(val(formData.nomineePercentage, '---'))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="nom-cert">
          প্রত্যয়ন করিতেছি যে, আমার উপস্থিতিতে জনাব <strong>{val(formData.nomineeName)}</strong> স্বাক্ষর করিয়াছেন। শ্রমিকগণ বিবরণসমূহ পাঠ করিবার পর
          উক্ত ঘোষণা অনুমোদন করিয়াছেন।
        </p>

<table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '40px' }}>
  <tbody>
    <tr>
      <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'bottom', paddingRight: '20px' }}>
        <div style={{ borderTop: '1px solid #000', marginBottom: '6px' }}></div>
        <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
          তারিখসহ মনোনীত ব্যক্তি/ব্যক্তিদের স্বাক্ষর/টিপসই
          <br />
          (শ্রমিক কর্তৃক সত্যায়িত ছবি)
        </div>
      </td>

      <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'bottom', padding: '0 20px' }}>
        <div style={{ borderTop: '1px solid #000', marginBottom: '6px' }}></div>
        <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
          মনোনয়ন প্রদানকারী শ্রমিকের
          <br />
          স্বাক্ষর, টিপসই ও তারিখ
        </div>
      </td>

      <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'bottom', paddingLeft: '20px' }}>
        <div style={{ borderTop: '1px solid #000', marginBottom: '6px' }}></div>
        <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
          মালিকের বা প্রধিকারপ্রাপ্ত কর্মকর্তার
          <br />
          স্বাক্ষর ও তারিখ
        </div>
      </td>
    </tr>
  </tbody>
</table>

      </div>

      <style>{nlSinglePageCss() + FORM_CSS}</style>
    </div>
  );
};

export default NomineeForm;