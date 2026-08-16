// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE CV MODAL  (resume-template layout)
//
// Follows the visual structure of the reference CV template (CV_Zahid.docx):
//   - Centered "Resume Of [Name]" header
//   - Current address (left) + ID-photo box (right)
//   - Contact block
//   - Career Objective (if present)
//   - Academic Background — gray section band, per-degree colon list
//   - Field of Interest (if present)
//   - Personal Information — gray band, colon list (father/mother, DOB,
//     marital status, nationality, religion, sex, blood group, etc.)
//   - Employment Info — gray band, colon list (card no, designation,
//     department, joining date, status)
//   - Work Experience — gray band, colon list per past job
//   - References — gray band, colon list (only if reference data exists)
//   - Salary Structure — gray band, colon list + highlighted gross total
//   - Additional Info — catch-all for any other DB field, so nothing from
//     the sheet is ever silently dropped
//   - Declaration + signature line, matching the template's closing
//
// Used only for the 'employees' module (কর্মী ব্যক্তিগত ফাইল); every other
// module keeps the generic flat-field DetailModal.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { FaPrint, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { formatDate, formatCurrency } from './ReportConfig';
import type { DbRecord } from '../../../business/DataUseCases';

// ── Constants ─────────────────────────────────────────────────────────────────

const SALARY_ROWS: { key: string; label: string }[] = [
  { key: 'basicSalary',        label: 'মূল বেতন'     },
  { key: 'houseRent',          label: 'বাড়িভাড়া'    },
  { key: 'medicalAllowance',   label: 'চিকিৎসা ভাতা' },
  { key: 'transportAllowance', label: 'যাতায়াত ভাতা' },
  { key: 'foodAllowance',      label: 'খাদ্য ভাতা'   },
];

/** Every field the CV explicitly places somewhere — anything else in the
 *  record falls through to the "অতিরিক্ত তথ্য" (additional info) section
 *  so nothing from the sheet ever gets silently hidden. */
const HANDLED_KEYS = new Set([
  'id', 'cardNo', 'fullName', 'fullNameBengali', 'designation', 'department',
  'status', 'joiningDate', 'mobile', 'mobileNo', 'nid', 'nationalId', 'email',
  'dateOfBirth', 'bloodGroup', 'religion', 'gender', 'maritalStatus', 'nationality',
  'height', 'weight',
  'presentAddress', 'permanentAddress',
  'fatherName', 'motherName', 'emergencyContact', 'emergencyContactName', 'emergencyContactNumber',
  'careerObjective', 'objective', 'fieldOfInterest', 'interests',
  'referenceName', 'referenceDesignation', 'referenceDepartment', 'referenceOrganization',
  'referenceContact', 'referenceRelation',
  'basicSalary', 'houseRent', 'medicalAllowance', 'transportAllowance', 'foodAllowance', 'grossSalary',
  'educationHistory', 'educationHistoryJson', 'previousJobs', 'previousJobsJson', 'trainingHistory',
  'photo', 'photoUrl',
  'savedBy', 'savedAt', 'factoryId',
]);

const FIELD_LABELS: Record<string, string> = {
  mobileNo: 'মোবাইল নং', nationalId: 'জাতীয় পরিচয়পত্র',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function val(v: unknown): string {
  return v === null || v === undefined || v === '' ? '' : String(v);
}

function keyToLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()).trim();
}

/** Parse a JSON array/object field (education history, previous jobs, etc.)
 *  into a list of plain objects. Tolerant of the field already being an
 *  array (some backends may hand back parsed JSON directly). */
function parseListField(raw: unknown): Record<string, unknown>[] {
  if (raw === null || raw === undefined || raw === '') return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const s = String(raw).trim();
  if (!s || (!s.startsWith('[') && !s.startsWith('{'))) return [];
  try {
    const parsed = JSON.parse(s);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.filter(i => i && typeof i === 'object') as Record<string, unknown>[];
  } catch { return []; }
}

/** First non-empty value among candidate keys — different sheets may name
 *  the same concept differently (e.g. degree vs qualification). */
function pick(item: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return '';
}

// ── Screen components: gray section band + colon-aligned row ──────────────────

function Band({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#e8e8e8', padding: '7px 12px', fontWeight: 700,
      fontSize: 13, color: '#1e293b', margin: '20px 0 10px', borderRadius: 3 }}>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 12px 1fr', fontSize: 13,
      padding: '3px 0', color: '#1e293b', lineHeight: 1.5 }}>
      <span style={{ color: '#374151' }}>{label}</span>
      <span>:</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 10, marginBottom: 2, color: '#1e293b' }}>{children}</div>;
}

// ── Print — mirrors the on-screen resume layout ────────────────────────────────
function printCV(record: DbRecord, factoryName: string) {
  const education = parseListField(record.educationHistory ?? record.educationHistoryJson);
  const jobs       = parseListField(record.previousJobs ?? record.previousJobsJson);
  const extraFields = Object.keys(record)
    .filter(k => !HANDLED_KEYS.has(k) && record[k] !== undefined && record[k] !== '');

  const kv = (label: string, value: unknown) => {
    const v = val(value);
    if (!v) return '';
    return `<div class="kv"><span class="k">${label}</span><span>:</span><span class="v">${v}</span></div>`;
  };

  const eduBlocks = education.map(e => {
    const degree = pick(e, ['degree', 'qualification', 'exam', 'level']);
    return `<div class="sub">${degree || 'শিক্ষাগত যোগ্যতা'}</div>
      ${kv('বিভাগ', pick(e, ['group', 'stream']))}
      ${kv('প্রতিষ্ঠান', pick(e, ['institution', 'school', 'college', 'board', 'institute']))}
      ${kv('ফলাফল', pick(e, ['result', 'grade', 'gpa', 'cgpa']))}
      ${kv('পাসের বছর', pick(e, ['year', 'passingYear', 'yearOfPassing']))}
      ${kv('বোর্ড', pick(e, ['board']))}`;
  }).join('');

  const jobBlocks = jobs.map(j => {
    const from = pick(j, ['from', 'fromDate', 'startDate']);
    const to   = pick(j, ['to', 'toDate', 'endDate']);
    return `<div class="sub">${pick(j, ['company', 'organization', 'employer']) || 'কর্মস্থল'}</div>
      ${kv('পদবী', pick(j, ['designation', 'position', 'role']))}
      ${kv('মেয়াদ', [from, to].filter(Boolean).join(' – '))}
      ${kv('ছাড়ার কারণ', pick(j, ['reason', 'reasonForLeaving']))}`;
  }).join('');

  const hasReference = record.referenceName || record.referenceContact;
  const salaryKv = SALARY_ROWS.map(r => kv(r.label, record[r.key] !== undefined ? formatCurrency(record[r.key] as string | number) : '')).join('');
  const extraKv  = extraFields.map(k => kv(FIELD_LABELS[k] ?? keyToLabel(k), record[k])).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      @page { size: A4 portrait; margin: 16mm 18mm; }
      body  { font-family:'Noto Sans Bengali', Arial, sans-serif; margin:0; color:#1e293b; font-size:13px; }
      .title { text-align:center; }
      .title .h1 { font-size:20px; font-weight:800; }
      .title .h2 { font-size:12px; color:#64748b; font-weight:600; margin:2px 0; }
      .title .name { font-size:18px; font-weight:800; margin-top:4px; }
      .top   { display:flex; justify-content:space-between; gap:20px; margin-top:18px; }
      .addr  { flex:1; }
      .lbl-b { font-weight:700; margin-bottom:2px; }
      .photo { width:110px; height:130px; border:2px solid #1e293b; display:flex; align-items:center;
               justify-content:center; font-size:26px; font-weight:800; color:#64748b; background:#f1f5f9; flex-shrink:0; }
      .band  { background:#e8e8e8; padding:6px 12px; font-weight:700; margin:16px 0 8px; }
      .sub   { font-weight:700; font-size:13px; margin-top:10px; }
      .kv    { display:grid; grid-template-columns:130px 10px 1fr; padding:2px 0; }
      .k     { color:#374151; }
      .v     { font-weight:500; }
      .total { background:#eff6ff; font-weight:800; padding:4px 0; }
      .hr    { border-top:3px double #1e293b; margin:16px 0; }
      .decl  { margin-top:14px; }
      .sign  { margin-top:26px; }
      .sign .line { border-top:1px solid #1e293b; width:180px; margin-bottom:4px; }
      .footer { margin-top:20px; border-top:1px solid #e2e8f0; padding-top:8px; font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; }
    </style>
    </head><body>
    <div class="title">
      <div class="h1">জীবন বৃত্তান্ত</div>
      <div class="h2">Resume of</div>
      <div class="name">${val(record.fullName)}</div>
      ${record.fullNameBengali ? `<div class="h2">${val(record.fullNameBengali)}</div>` : ''}
    </div>

    <div class="top">
      <div class="addr">
        ${record.presentAddress ? `<div class="lbl-b">বর্তমান ঠিকানা:</div><div>${val(record.presentAddress)}</div>` : ''}
        <div class="lbl-b" style="margin-top:10px">যোগাযোগ:</div>
        ${record.mobile ? `<div>মোবাইল: ${val(record.mobile)}</div>` : ''}
        ${record.email ? `<div>ইমেইল: ${val(record.email)}</div>` : ''}
      </div>
      <div class="photo">${initials(String(record.fullName ?? '?'))}</div>
    </div>

    ${record.careerObjective || record.objective ? `
    <div class="band">ক্যারিয়ার লক্ষ্য</div>
    <div>${val(record.careerObjective ?? record.objective)}</div>` : ''}

    <div class="band">একাডেমিক ব্যাকগ্রাউন্ড</div>
    ${eduBlocks || '<div style="color:#94a3b8">কোনো তথ্য নেই</div>'}

    ${record.fieldOfInterest || record.interests ? `
    <div class="band">আগ্রহের ক্ষেত্র</div>
    <div>${val(record.fieldOfInterest ?? record.interests)}</div>` : ''}

    <div class="band">ব্যক্তিগত তথ্য</div>
    ${kv('পিতার নাম', record.fatherName)}
    ${kv('মাতার নাম', record.motherName)}
    ${kv('স্থায়ী ঠিকানা', record.permanentAddress)}
    ${kv('জন্ম তারিখ', record.dateOfBirth ? formatDate(String(record.dateOfBirth)) : '')}
    ${kv('বৈবাহিক অবস্থা', record.maritalStatus)}
    ${kv('জাতীয়তা', record.nationality)}
    ${kv('ধর্ম', record.religion)}
    ${kv('লিঙ্গ', record.gender)}
    ${kv('রক্তের গ্রুপ', record.bloodGroup)}
    ${kv('উচ্চতা', record.height)}
    ${kv('ওজন', record.weight)}
    ${kv('জাতীয় পরিচয়পত্র', record.nid ?? record.nationalId)}

    <div class="band">কর্মসংস্থান তথ্য</div>
    ${kv('কার্ড নং', record.cardNo)}
    ${kv('পদবী', record.designation)}
    ${kv('বিভাগ', record.department)}
    ${kv('যোগদানের তারিখ', record.joiningDate ? formatDate(String(record.joiningDate)) : '')}
    ${kv('অবস্থা', record.status)}

    ${jobBlocks ? `<div class="band">কর্মসংস্থানের ইতিহাস</div>${jobBlocks}` : ''}

    ${hasReference ? `
    <div class="band">রেফারেন্স</div>
    ${kv('নাম', record.referenceName)}
    ${kv('পদবী', record.referenceDesignation)}
    ${kv('বিভাগ', record.referenceDepartment)}
    ${kv('প্রতিষ্ঠান', record.referenceOrganization)}
    ${kv('যোগাযোগ', record.referenceContact)}
    ${kv('সম্পর্ক', record.referenceRelation)}` : ''}

    <div class="band">বেতন কাঠামো</div>
    ${salaryKv}
    <div class="kv total"><span class="k">মোট বেতন</span><span>:</span><span class="v">${formatCurrency(record.grossSalary as string | number)}</span></div>

    ${extraKv ? `<div class="band">অতিরিক্ত তথ্য</div>${extraKv}` : ''}

    <div class="hr"></div>
    <div class="decl">আমি ঘোষণা করছি যে এই তথ্যাবলী সত্য ও সঠিক।</div>
    <div class="sign">
      <div>বিনীত,</div>
      <div style="height:34px"></div>
      <div class="line"></div>
      <div style="font-weight:700">${val(record.fullName)}</div>
    </div>

    <div class="footer">
      <span>${factoryName}</span>
      <span>RMS V16 · ${new Date().toLocaleDateString('en-GB')}</span>
    </div>
    </body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;border:none;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open(); doc.write(html); doc.close();
  iframe.onload = () => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    iframe.contentWindow!.addEventListener('afterprint', () => {
      document.body.removeChild(iframe);
    });
  };
}

// ── Component ───────────────────────────────────────────────────────────────
export default function EmployeeCVModal({ record, factoryName, onClose, onOpenModule }: {
  record:        DbRecord;
  factoryName:   string;
  onClose:       () => void;
  onOpenModule?: () => void;
}) {
  const education = parseListField(record.educationHistory ?? record.educationHistoryJson);
  const jobs       = parseListField(record.previousJobs ?? record.previousJobsJson);
  const extraFields = Object.keys(record).filter(
    k => !HANDLED_KEYS.has(k) && record[k] !== undefined && record[k] !== ''
  );
  const hasReference = Boolean(record.referenceName || record.referenceContact);
  const photoUrl = record.photoUrl ?? record.photo;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 720,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <button onClick={() => printCV(record, factoryName)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px',
              border: '1px solid #cbd5e1', borderRadius: 7, background: '#f8fafc', color: '#374151',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            <FaPrint style={{ fontSize: 11 }}/> প্রিন্ট
          </button>
          {onOpenModule && (
            <button onClick={onOpenModule}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                border: '1.5px solid #60A5FA', borderRadius: 7, background: '#1d4ed8', color: '#fff',
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
              <FaExternalLinkAlt style={{ fontSize: 10 }}/> মডিউলে খুলুন
            </button>
          )}
          <button onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 9px',
              color: '#374151', cursor: 'pointer', lineHeight: 1 }}>
            <FaTimes style={{ fontSize: 14 }}/>
          </button>
        </div>

        {/* Resume body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '22px 28px 28px', color: '#1e293b' }}>

          {/* Centered title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>জীবন বৃত্তান্ত</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: '2px 0' }}>Resume of</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{val(record.fullName) || '—'}</div>
            {record.fullNameBengali ? (
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{val(record.fullNameBengali)}</div>
            ) : null}
          </div>

          {/* Address + photo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {record.presentAddress ? (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>বর্তমান ঠিকানা:</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{val(record.presentAddress)}</div>
                </>
              ) : null}
              <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 2 }}>যোগাযোগ:</div>
              {record.mobile ? <div style={{ fontSize: 13 }}>মোবাইল: {val(record.mobile)}</div> : null}
              {record.email ? <div style={{ fontSize: 13 }}>ইমেইল: {val(record.email)}</div> : null}
              {!record.mobile && !record.email ? <div style={{ fontSize: 13, color: '#94a3b8' }}>—</div> : null}
            </div>
            <div style={{ width: 110, height: 130, border: '2px solid #1e293b', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              background: '#f1f5f9' }}>
              {photoUrl ? (
                <img src={String(photoUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              ) : (
                <span style={{ fontSize: 28, fontWeight: 800, color: '#64748b' }}>{initials(String(record.fullName ?? '?'))}</span>
              )}
            </div>
          </div>

          {/* Career objective */}
          {(record.careerObjective || record.objective) ? (
            <>
              <Band>ক্যারিয়ার লক্ষ্য</Band>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{val(record.careerObjective ?? record.objective)}</div>
            </>
          ) : null}

          {/* Academic background */}
          <Band>একাডেমিক ব্যাকগ্রাউন্ড</Band>
          {education.length === 0 ? (
            <div style={{ fontSize: 12.5, color: '#94a3b8' }}>কোনো তথ্য নেই</div>
          ) : education.map((e, i) => (
            <div key={i}>
              <SubHeading>{pick(e, ['degree', 'qualification', 'exam', 'level']) || 'শিক্ষাগত যোগ্যতা'}</SubHeading>
              <KV label="বিভাগ"       value={pick(e, ['group', 'stream'])}/>
              <KV label="প্রতিষ্ঠান"  value={pick(e, ['institution', 'school', 'college', 'institute'])}/>
              <KV label="ফলাফল"       value={pick(e, ['result', 'grade', 'gpa', 'cgpa'])}/>
              <KV label="পাসের বছর"   value={pick(e, ['year', 'passingYear', 'yearOfPassing'])}/>
              <KV label="বোর্ড"       value={pick(e, ['board'])}/>
            </div>
          ))}

          {/* Field of interest */}
          {(record.fieldOfInterest || record.interests) ? (
            <>
              <Band>আগ্রহের ক্ষেত্র</Band>
              <div style={{ fontSize: 13 }}>{val(record.fieldOfInterest ?? record.interests)}</div>
            </>
          ) : null}

          {/* Personal information */}
          <Band>ব্যক্তিগত তথ্য</Band>
          <KV label="পিতার নাম"        value={val(record.fatherName)}/>
          <KV label="মাতার নাম"        value={val(record.motherName)}/>
          <KV label="স্থায়ী ঠিকানা"    value={val(record.permanentAddress)}/>
          <KV label="জন্ম তারিখ"       value={record.dateOfBirth ? formatDate(String(record.dateOfBirth)) : ''}/>
          <KV label="বৈবাহিক অবস্থা"   value={val(record.maritalStatus)}/>
          <KV label="জাতীয়তা"         value={val(record.nationality)}/>
          <KV label="ধর্ম"             value={val(record.religion)}/>
          <KV label="লিঙ্গ"            value={val(record.gender)}/>
          <KV label="রক্তের গ্রুপ"     value={val(record.bloodGroup)}/>
          <KV label="উচ্চতা"           value={val(record.height)}/>
          <KV label="ওজন"              value={val(record.weight)}/>
          <KV label="জাতীয় পরিচয়পত্র" value={val(record.nid ?? record.nationalId)}/>

          {/* Employment info */}
          <Band>কর্মসংস্থান তথ্য</Band>
          <KV label="কার্ড নং"          value={val(record.cardNo)}/>
          <KV label="পদবী"              value={val(record.designation)}/>
          <KV label="বিভাগ"             value={val(record.department)}/>
          <KV label="যোগদানের তারিখ"    value={record.joiningDate ? formatDate(String(record.joiningDate)) : ''}/>
          <KV label="অবস্থা"            value={val(record.status)}/>

          {/* Work experience */}
          {jobs.length > 0 && (
            <>
              <Band>কর্মসংস্থানের ইতিহাস</Band>
              {jobs.map((j, i) => {
                const from = pick(j, ['from', 'fromDate', 'startDate']);
                const to   = pick(j, ['to', 'toDate', 'endDate']);
                return (
                  <div key={i}>
                    <SubHeading>{pick(j, ['company', 'organization', 'employer']) || 'কর্মস্থল'}</SubHeading>
                    <KV label="পদবী"          value={pick(j, ['designation', 'position', 'role'])}/>
                    <KV label="মেয়াদ"         value={[from, to].filter(Boolean).join(' – ')}/>
                    <KV label="ছাড়ার কারণ"    value={pick(j, ['reason', 'reasonForLeaving'])}/>
                  </div>
                );
              })}
            </>
          )}

          {/* References */}
          {hasReference && (
            <>
              <Band>রেফারেন্স</Band>
              <KV label="নাম"       value={val(record.referenceName)}/>
              <KV label="পদবী"      value={val(record.referenceDesignation)}/>
              <KV label="বিভাগ"     value={val(record.referenceDepartment)}/>
              <KV label="প্রতিষ্ঠান" value={val(record.referenceOrganization)}/>
              <KV label="যোগাযোগ"   value={val(record.referenceContact)}/>
              <KV label="সম্পর্ক"   value={val(record.referenceRelation)}/>
            </>
          )}

          {/* Salary structure */}
          <Band>বেতন কাঠামো</Band>
          {SALARY_ROWS.filter(r => record[r.key] !== undefined && record[r.key] !== '').map(r => (
            <KV key={r.key} label={r.label} value={formatCurrency(record[r.key] as string | number)}/>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 12px 1fr', fontSize: 13,
            padding: '5px 0', marginTop: 2, background: '#eff6ff', fontWeight: 800, color: '#1e3a5f' }}>
            <span>মোট বেতন</span><span>:</span><span>{formatCurrency(record.grossSalary as string | number)}</span>
          </div>

          {/* Additional info */}
          {extraFields.length > 0 && (
            <>
              <Band>অতিরিক্ত তথ্য</Band>
              {extraFields.map(k => (
                <KV key={k} label={FIELD_LABELS[k] ?? keyToLabel(k)} value={val(record[k])}/>
              ))}
            </>
          )}

          {/* Declaration + signature, matching the reference template's closing */}
          <div style={{ borderTop: '3px double #1e293b', margin: '22px 0 16px' }}/>
          <div style={{ fontSize: 13 }}>আমি ঘোষণা করছি যে এই তথ্যাবলী সত্য ও সঠিক।</div>
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 13 }}>বিনীত,</div>
            <div style={{ height: 34 }}/>
            <div style={{ borderTop: '1px solid #1e293b', width: 180, marginBottom: 4 }}/>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{val(record.fullName)}</div>
          </div>

          {/* Meta footer */}
          <div style={{ marginTop: 20, padding: '10px 12px', background: '#f0f9ff', borderRadius: 8,
            fontSize: 11, color: '#64748b', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>সংরক্ষণকারী: <strong>{val(record.savedBy) || '—'}</strong></span>
            <span>তারিখ: <strong>{formatDate(String(record.savedAt ?? ''))}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}