// ─────────────────────────────────────────────────────────────────────────────
// types.ts — Supplier Assessment: data model + business logic + table engine + Excel export.
// Path: src/components/modules/supplierAssessment/types.ts
//
// ONE sheet row = one supplier. The form has three parts:
//   A. Supplier information   (name / address / contact / mobile / email come from the Compliance Audit sheet,
//                              + Audit Certification List, Brand / Buyer List as text)
//   B. Assessment details     (date, method, assessed by, OVERALL COMPLIANCE SCORE /100 — the ten
//                              "Assessment score" areas are filled automatically from it: area = overall × max ÷ 100)
//   C. Approval details       (approved by, date of approval, validity (years), expire on = approval date + validity, status)
// Result from the score: 85+ Approved · 70–84 Conditional · below 70 Not Approved.
// An Approved / Conditional supplier whose "Expire on" date has passed is shown as Expired and leaves the ASL.
// Assessment Analysis also reads the complianceaudit sheet (audit type "External for Supplier").
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { parseNcItems, parseAuditors, computeAuditScore, findPointByRef, timelineIso, areaCodeOf, AUDIT_AREAS } from '../complianceAudit/types';
import type { Severity } from '../complianceAudit/types';

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown): number | null => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const pad2 = (n: number) => String(n).padStart(2, '0');

// ─── Dates / helpers ─────────────────────────────────────────────────────────

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** ISO (YYYY-MM-DD) → DD-MM-YYYY for display; '' stays ''. */
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}
/** ISO date plus N months (day clamped, e.g. 31 Jan + 1 month = 28/29 Feb). '' if not a date. */
export function addMonthsIso(iso: string, months: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '';
  const day = Number(m[3]);
  const base = new Date(Number(m[1]), Number(m[2]) - 1 + months, 1);
  const dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(day, dim));
  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
}
export function daysFrom(today: string, iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso ?? '')) return null;
  return Math.round((new Date(`${iso.slice(0, 10)}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000);
}
/** Google Sheets drops the leading 0 of phone numbers — put it back for 9–10 digit numbers. */
function fixPhone(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (/^#(ERROR|N\/A|REF|VALUE|NAME|DIV)/i.test(s)) return '';   // a Google Sheets error value is not a phone number
  return /^[1-9]\d{8,9}$/.test(s) ? `0${s}` : s;
}
function parseJson<T>(raw: unknown, fallback: T): T {
  try { const v = JSON.parse(String(raw ?? '')); return (v ?? fallback) as T; } catch { return fallback; }
}

// ─── Options and colours ─────────────────────────────────────────────────────

export const SUPPLIER_CATEGORIES = [
  'Fabric', 'Yarn', 'Sewing Thread', 'Buttons', 'Zipper', 'Labels', 'Interlining', 'Packaging Materials', 'Other Accessories',
  'Chemicals & Dyes', 'Washing / Dyeing / Printing (subcontract)', 'Embroidery / Other Subcontract', 'Other',
];
export const BUSINESS_TYPE_OPTIONS = ['Manufacturer', 'Trading Company', 'Subcontractor', 'Raw Material Supplier', 'Service Provider', 'Other'];

/** 'Rejected' is shown as "Not Approved". */
export type ApprovalStatus = 'Pending' | 'Approved' | 'Conditional' | 'Rejected';
export const approvalLabel = (s: ApprovalStatus) => (s === 'Rejected' ? 'Not Approved' : s);
export const APPROVAL_COLORS: Record<ApprovalStatus, { bg: string; color: string }> = {
  Pending: { bg: '#f1f5f9', color: '#64748b' }, Approved: { bg: '#f0fdf4', color: '#15803d' },
  Conditional: { bg: '#fef3c7', color: '#92400e' }, Rejected: { bg: '#fee2e2', color: '#b91c1c' },
};

export type SupplierStatus = 'Pending' | 'Approved' | 'Conditional' | 'Not Approved' | 'On Hold' | 'Blacklisted';
export const STATUS_OPTIONS: SupplierStatus[] = ['Pending', 'Approved', 'Conditional', 'Not Approved', 'On Hold', 'Blacklisted'];
export type ShownStatus = SupplierStatus | 'Expired';
export const STATUS_COLORS: Record<ShownStatus, { bg: string; color: string }> = {
  Pending: { bg: '#f1f5f9', color: '#64748b' }, Approved: { bg: '#f0fdf4', color: '#15803d' }, Conditional: { bg: '#fef3c7', color: '#92400e' },
  'Not Approved': { bg: '#fee2e2', color: '#b91c1c' }, 'On Hold': { bg: '#ffedd5', color: '#c2410c' }, Blacklisted: { bg: '#7f1d1d', color: '#ffffff' },
  Expired: { bg: '#fce7f3', color: '#9d174d' },
};
export const RATING_COLORS: Record<string, { bg: string; color: string }> = {
  Good: { bg: '#f0fdf4', color: '#15803d' }, Satisfactory: { bg: '#dbeafe', color: '#1d4ed8' },
  'Needs Improvement': { bg: '#fef3c7', color: '#92400e' }, 'High Risk': { bg: '#fee2e2', color: '#b91c1c' },
};

// ─── GMFSA framework: 3 parts × 100 marks → final average (0–100) ────────────
// Part 1 – Corporate, Legal & Responsible Business Compliance: AUTOMATIC (from the latest Compliance Audit score)
// Part 2 – Operational & Business Performance and Part 3 – Building, Electrical & Fire Safety: MANUAL (assessor)
// Final score = (P1 + P2 + P3) ÷ 3.   N/A is allowed on a manual criterion only with a documented justification;
// the applicable criteria of that part are then normalised back to 100 marks.

export interface AreaDef { key: string; no: string; label: string; max: number; part: 'p1' | 'p2' | 'p3'; coverage: string[]; /** coverage joined for display */ guide: string }
const area = (key: string, no: string, label: string, max: number, part: AreaDef['part'], coverage: string[]): AreaDef => ({ key, no, label, max, part, coverage, guide: coverage.join(' · ') });
export const AREAS: AreaDef[] = [
  area('c11', '1.1', 'Company Profile, Ownership & Corporate Governance', 10, 'p1', ['Company registration, ownership and organizational structure', 'Management responsibility and accountability', 'Corporate governance and organizational transparency']),
  area('c12', '1.2', 'Legal Documents, Licences & Regulatory Authorizations', 15, 'p1', ['Trade Licence, TIN, BIN and Incorporation Certificate', 'Factory registration and applicable statutory licences', 'Environmental clearance and other regulatory permits', 'Applicable legal authorizations and renewal records']),
  area('c13', '1.3', 'Financial Stability & Creditworthiness', 15, 'p1', ['Financial statements and bank references', 'Credit standing and financial capability', 'Financial risk management and business sustainability', 'Business continuity and financial resilience']),
  area('c14', '1.4', 'Management Systems, Policies & Certifications', 10, 'p1', ['Management policies and documented procedures', 'Internal audits and management reviews', 'Risk assessment and corrective action management', 'ISO 9001, ISO 14001, ISO 45001, ISO 50001, ISO 22301']),
  area('c15', '1.5', 'Social & Labour Compliance', 18, 'p1', ['Child labour and young worker protection', 'Forced labour, human trafficking and ethical recruitment', 'Wages, overtime, statutory benefits and deductions', 'Working hours, rest days, breaks and leave', 'Freedom of association and collective bargaining', 'Non-discrimination and equal opportunity', 'Harassment prevention and workplace dignity', 'Employment contracts and regular employment', 'Maternity protection and worker welfare', 'Grievance mechanisms, worker participation and non-retaliation']),
  area('c16', '1.6', 'Occupational Health & Safety', 12, 'p1', ['OHS Management System', 'Hazard Identification and Risk Assessment (HIRA)', 'Machine guarding and safe operating procedures', 'PPE and chemical exposure control', 'Occupational health and medical facilities', 'Ergonomics, ventilation, lighting and noise exposure', 'Accident investigation and near-miss reporting', 'Safety training and worker consultation']),
  area('c17', '1.7', 'Environmental & Regulatory Compliance', 12, 'p1', ['Environmental Management System', 'ETP and wastewater management', 'Air emissions and pollution control', 'Solid, hazardous and chemical waste management', 'Water and energy consumption monitoring', 'Noise and vibration monitoring', 'Chemical inventory, SDS and storage management', 'Environmental reporting and statutory compliance']),
  area('c18', '1.8', 'Business Ethics & Legal Practices', 8, 'p1', ['Anti-bribery and anti-corruption', 'Conflict of interest and transparency', 'Code of Conduct and business integrity', 'Responsible sourcing and supply-chain due diligence', 'Fraud prevention and document authenticity', 'Confidentiality, information security and data protection']),

  area('c21', '2.1', 'Production Capacity & Manufacturing Capability', 20, 'p2', ['Production machinery, lines and installed capacity', 'Workforce capacity and production efficiency', 'Production planning and capacity utilization', 'Manufacturing processes and productivity', 'Ability to meet customer demand']),
  area('c22', '2.2', 'Quality Management & Product Compliance', 30, 'p2', ['Quality Management System (QMS)', 'Incoming, in-process and final inspection', 'AQL and defect management', 'Laboratory testing and product conformity', 'Customer specifications and product safety', 'RSL/MRSL requirements, where applicable', 'Non-conformity management and corrective actions']),
  area('c23', '2.3', 'Machinery, Equipment Maintenance & Calibration', 15, 'p2', ['Preventive and predictive maintenance', 'Machinery breakdown and repair records', 'Equipment reliability and maintenance planning', 'Calibration of measuring and testing instruments', 'Maintenance records and technical competency']),
  area('c24', '2.4', 'Supply Chain, Procurement & Inventory Management', 15, 'p2', ['Supplier selection and evaluation', 'Procurement procedures and purchasing controls', 'Raw material inspection and verification', 'Warehouse management and stock control', 'Material preservation and storage conditions', 'Supplier performance monitoring']),
  area('c25', '2.5', 'Delivery, Planning & Logistics Performance', 10, 'p2', ['Order planning and production scheduling', 'Lead-time reliability', 'On-time delivery performance', 'Transportation and logistics management', 'Order fulfilment and delivery records']),
  area('c26', '2.6', 'Traceability, Subcontracting & Customer References', 10, 'p2', ['Raw material origin and batch/lot identification', 'Production and finished-goods traceability', 'Subcontractor approval and monitoring', 'Outsourced production control', 'Customer complaints and feedback', 'Customer references and corrective action history', 'Product recall and traceability readiness']),

  area('c31', '3.1', 'Building & Structural Safety', 20, 'p3', ['Structural integrity of foundation, columns, beams and floors', 'Building stability and load-bearing capacity', 'Floor loading and rooftop structures', 'Structural cracks, settlement and deterioration', 'Building maintenance and structural assessments']),
  area('c32', '3.2', 'Building Approval & Legal Authorization', 10, 'p3', ['Approved building plans and architectural layouts', 'Occupancy and use authorization', 'Structural design and completion certificates, where applicable', 'Applicable statutory approvals and inspection records']),
  area('c33', '3.3', 'Electrical Safety & Installation', 20, 'p3', ['Electrical wiring and distribution boards', 'Transformer, generator and substation safety', 'Electrical panels and circuit breakers', 'Earthing, grounding and lightning protection', 'Cable management and overload protection', 'Electrical inspection, testing and maintenance', 'Thermography, where applicable']),
  area('c34', '3.4', 'Fire Detection & Protection Systems', 20, 'p3', ['Fire alarm and detection systems', 'Smoke and heat detectors', 'Fire extinguishers and hose reels', 'Hydrant and sprinkler systems', 'Fire pumps and water reservoirs', 'Automatic fire suppression systems, where required', 'Inspection and maintenance records']),
  area('c35', '3.5', 'Fire Prevention & Emergency Preparedness', 15, 'p3', ['Fire risk assessment and prevention procedures', 'Emergency response and contingency plans', 'Fire safety training and designated response teams', 'Fire drills and emergency response evaluation', 'Hot work permits and ignition-source control']),
  area('c36', '3.6', 'Emergency Exits & Evacuation Facilities', 15, 'p3', ['Adequate and accessible emergency exits', 'Unobstructed escape routes and stairways', 'Emergency lighting and exit signage', 'Evacuation maps and assembly points', 'Exit doors and emergency access', 'Evacuation capacity and arrangements']),
];
/** The final score is an average of three parts, so it is out of 100. */
export const MAX_TOTAL = 100;

export interface PartDef { key: 'p1' | 'p2' | 'p3'; label: string; title: string; short: string; auto: boolean; areas: string[]; extra?: string[] }
export const PARTS: PartDef[] = [
  { key: 'p1', label: 'Part 1', title: 'Part 1 – Corporate, Legal & Responsible Business Compliance', short: 'Corporate & Compliance', auto: true, areas: AREAS.filter(a => a.part === 'p1').map(a => a.key) },
  { key: 'p2', label: 'Part 2', title: 'Part 2 – Operational & Business Performance', short: 'Operations', auto: false, areas: AREAS.filter(a => a.part === 'p2').map(a => a.key) },
  { key: 'p3', label: 'Part 3', title: 'Part 3 – Building, Electrical & Fire Safety', short: 'Building & Fire Safety', auto: false, areas: AREAS.filter(a => a.part === 'p3').map(a => a.key),
    extra: ['Boiler and pressure vessel safety', 'Lift, elevator and material-handling equipment', 'Air compressors and pressure-operated equipment', 'Emergency backup power systems', 'Fire water storage and emergency utilities'] },
];
export const APPROVE_MIN = 85;
export const CONDITIONAL_MIN = 70;
export const SOON_DAYS = 90;                                       // "expiring soon" window

export const isManualArea = (key: string) => (AREAS.find(a => a.key === key)?.part ?? 'p1') !== 'p1';
/** Older record (earlier ten-area scheme / overall score only): its stored overall score is kept as the final score. */
export const isLegacyPq = (p: Prequal): boolean => p.fw !== 2 && p.overallScore !== null;
/** N/A applies only to manual criteria of the new framework. */
export const isNa = (p: Prequal, key: string): boolean => !isLegacyPq(p) && isManualArea(key) && !!p.na[key];

/** Mark of every criterion. Part 1 = audit score × criterion marks ÷ 100 (automatic); Parts 2 / 3 = typed by the assessor (null when N/A or empty). */
export function areaScoresOf(p: Prequal): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  AREAS.forEach(a => {
    if (isLegacyPq(p)) out[a.key] = round2(((p.overallScore ?? 0) * a.max) / 100);
    else if (!isManualArea(a.key)) out[a.key] = p.auditScore === null ? null : round2((p.auditScore * a.max) / 100);
    else out[a.key] = isNa(p, a.key) ? null : (p.manual[a.key] ?? null);
  });
  // Part 1: make the criterion marks add up exactly to the audit score (rounding remainder goes to the last criterion).
  if (!isLegacyPq(p) && p.auditScore !== null) {
    const auto = AREAS.filter(a => !isManualArea(a.key));
    const last = auto[auto.length - 1];
    if (last) out[last.key] = round2(p.auditScore - auto.slice(0, -1).reduce((s, a) => s + (out[a.key] ?? 0), 0));
  }
  return out;
}
export interface PartScore extends PartDef { defs: AreaDef[]; /** always 100 */ max: number; score: number | null; naCount: number; applicableMax: number }
/** Part scores out of 100. Manual parts: applicable criteria are normalised to 100 when some are N/A; null until every applicable criterion is marked. */
export function partScores(p: Prequal): PartScore[] {
  const marks = areaScoresOf(p);
  return PARTS.map(part => {
    const defs = part.areas.map(k => AREAS.find(a => a.key === k)!);
    const na = defs.filter(a => isNa(p, a.key)), app = defs.filter(a => !isNa(p, a.key));
    const applicableMax = app.reduce((s, a) => s + a.max, 0);
    let score: number | null;
    if (isLegacyPq(p)) score = p.overallScore;
    else if (part.auto) score = p.auditScore;
    else if (!app.length || app.some(a => marks[a.key] === null)) score = null;
    else score = round2((app.reduce((s, a) => s + (marks[a.key] ?? 0), 0) / applicableMax) * 100);
    return { ...part, defs, max: 100, score, naCount: na.length, applicableMax };
  });
}
/** Final Overall Compliance Score = (P1 + P2 + P3) ÷ 3; null until all three parts have a score. */
export function overallOf(p: Prequal): number | null {
  if (isLegacyPq(p)) return p.overallScore;
  const s = partScores(p).map(x => x.score);
  return s.some(v => v === null) ? null : round2((s as number[]).reduce((a, b) => a + b, 0) / 3);
}
export interface ScoreResult { total: number | null; result: ApprovalStatus; grade: string; text: string }
export function scoreFrom(overall: number | null): ScoreResult {
  if (overall === null) return { total: null, result: 'Pending', grade: '—', text: 'Enter the Overall Compliance Score to get the result.' };
  const result: ApprovalStatus = overall >= APPROVE_MIN ? 'Approved' : overall >= CONDITIONAL_MIN ? 'Conditional' : 'Rejected';
  return {
    total: overall, result, grade: overall >= APPROVE_MIN ? 'A' : overall >= CONDITIONAL_MIN ? 'B' : 'C',
    text: `${APPROVE_MIN}+ Approved · ${CONDITIONAL_MIN}–${APPROVE_MIN - 1} Conditional · below ${CONDITIONAL_MIN} Not Approved.`,
  };
}
/**
 * Status suggested by the score. Zero-tolerance rule (common in BSCI / SA8000 / buyer codes): a supplier whose latest audit
 * still has a Critical non-compliance is never suggested as plain "Approved" — at best "Conditional".
 */
export function suggestedStatus(overall: number | null, criticalNcs = 0): SupplierStatus {
  const r = scoreFrom(overall).result;
  if (r === 'Approved') return criticalNcs > 0 ? 'Conditional' : 'Approved';
  return r === 'Conditional' ? 'Conditional' : r === 'Rejected' ? 'Not Approved' : 'Pending';
}

export type AssessmentMethod = 'Desktop' | 'On-site' | 'Desktop + On-site';
export const METHOD_OPTIONS: AssessmentMethod[] = ['Desktop', 'On-site', 'Desktop + On-site'];
export interface Prequal {
  assessmentDate: string; method: AssessmentMethod; assessedBy: string;
  overallScore: number | null;                // automatic: the sum of the ten areas
  auditScore: number | null;                  // latest external audit score (/100) — Part 1 is automatic from it
  manual: Record<string, number | null>;      // Part 2 and Part 3 criteria typed by the assessor
  na: Record<string, boolean>;                // manual criteria marked N/A (needs a remark as justification)
  fw: 1 | 2;                                  // 2 = GMFSA three-part framework; 1 = older record (overall score kept as it was)
  remarks: Record<string, string>;            // optional evidence note per area
}
export const blankPrequal = (): Prequal => ({ assessmentDate: '', method: 'Desktop', assessedBy: '', overallScore: null, auditScore: null, manual: {}, na: {}, fw: 2, remarks: {} });

// ─── Approval details ────────────────────────────────────────────────────────

export interface Approval { approvedBy: string; approvalDate: string; validityYears: number | null; status: SupplierStatus }
export const blankApproval = (): Approval => ({ approvedBy: '', approvalDate: '', validityYears: null, status: 'Pending' });
/** Expire On = Date of Approval + Validity (years; halves allowed). '' until both are set. */
export const expireOnOf = (a: Approval): string =>
  a.approvalDate && a.validityYears !== null && a.validityYears > 0 ? addMonthsIso(a.approvalDate, Math.round(a.validityYears * 12)) : '';
/** Changing the status to Approved / Conditional fills the approval date (today) and a 1-year validity when empty. */
export function withStatus(a: Approval, status: SupplierStatus, today: string): Approval {
  const next: Approval = { ...a, status };
  if (status === 'Approved' || status === 'Conditional') {
    if (!next.approvalDate) next.approvalDate = today;
    if (next.validityYears === null) next.validityYears = 1;
  }
  return next;
}

// ─── Form state ──────────────────────────────────────────────────────────────

export interface SupplierData {
  supplierCode: string; supplierName: string; category: string; businessType: string; productCategory: string;
  contactPerson: string; phone: string; email: string; address: string;
  certificationList: string; buyerList: string;
  prequal: Prequal; approval: Approval;
  date: string; factoryName: string; factoryAddress: string;
}
export function blankSupplierData(): SupplierData {
  return {
    supplierCode: '', supplierName: '', category: '', businessType: 'Manufacturer', productCategory: '',
    contactPerson: '', phone: '', email: '', address: '', certificationList: '', buyerList: '',
    prequal: blankPrequal(), approval: blankApproval(), date: todayIso(), factoryName: '', factoryAddress: '',
  };
}

function parsePrequal(raw: unknown): Prequal {
  const o = parseJson<Record<string, unknown>>(raw, {});
  const remarks: Record<string, string> = {};
  Object.entries((o.remarks as Record<string, unknown> | undefined) ?? {}).forEach(([k, r]) => { if (r) remarks[k] = String(r); });
  const manual: Record<string, number | null> = {}, na: Record<string, boolean> = {};
  AREAS.filter(a => isManualArea(a.key)).forEach(a => {
    manual[a.key] = num((o.manual as Record<string, unknown> | undefined)?.[a.key]);
    if ((o.na as Record<string, unknown> | undefined)?.[a.key]) na[a.key] = true;
  });
  let overall = num(o.overallScore);
  if (overall === null && o.scores && typeof o.scores === 'object') {           // older rows: complete area scores → their total
    const vals = Object.values(o.scores as Record<string, unknown>).map(num);
    if (vals.length && vals.every(v => v !== null)) overall = round1(vals.reduce<number>((s, v) => s + (v ?? 0), 0));
  }
  const m = String(o.method ?? '');
  return {
    assessmentDate: String(o.assessmentDate ?? '').slice(0, 10), method: (METHOD_OPTIONS as string[]).includes(m) ? (m as AssessmentMethod) : 'Desktop',
    assessedBy: String(o.assessedBy ?? ''), overallScore: overall, auditScore: num(o.auditScore), manual, na, fw: o.fw === 2 || overall === null ? 2 : 1, remarks,
  };
}
const listFromJson = (raw: unknown, pick: (x: Record<string, unknown>) => string): string => {
  const a = parseJson<unknown[]>(raw, []);
  return (Array.isArray(a) ? a : []).map(x => pick((x ?? {}) as Record<string, unknown>)).filter(Boolean).join('\n');
};

/** Saved row → form state (reads older rows too). */
export function dataFromRecord(rec: Record<string, unknown>, prev: SupplierData): SupplierData {
  const str = (k: string) => String(rec[k] ?? '');
  const saved = str('lifecycleStatus');
  const status: SupplierStatus = (STATUS_OPTIONS as string[]).includes(saved) ? (saved as SupplierStatus) : 'Pending';
  return {
    ...prev,
    supplierCode: str('supplierCode'), supplierName: str('supplierName'), category: str('category'), businessType: str('businessType') || 'Manufacturer',
    productCategory: str('productCategory'), contactPerson: str('contactPerson'), phone: fixPhone(rec.phone), email: str('email'), address: str('address'),
    certificationList: str('certificationList') || listFromJson(rec.certificatesJson, c => [c.name, c.validUntil ? `(valid until ${formatDMY(String(c.validUntil).slice(0, 10))})` : ''].filter(Boolean).join(' ')),
    buyerList: str('buyerList') || listFromJson(rec.buyersJson, b => String(b.name ?? '')),
    prequal: parsePrequal(rec.prequalJson),
    approval: { approvedBy: str('approvedBy'), approvalDate: str('approvalDate').slice(0, 10), validityYears: num(rec.validityYears), status },
    date: str('date').slice(0, 10) || prev.date,
  };
}
/** Form state → sheet columns (score / result / expiry copies make the Google Sheet readable). */
export function dataToRecord(d: SupplierData, code: string): Record<string, string> {
  const sc = scoreFrom(d.prequal.overallScore);
  return {
    supplierCode: code, supplierName: d.supplierName.trim(), category: d.category, businessType: d.businessType, productCategory: d.productCategory,
    contactPerson: d.contactPerson, phone: d.phone, email: d.email, address: d.address,
    certificationList: d.certificationList, buyerList: d.buyerList,
    prequalJson: JSON.stringify(d.prequal), preQualScore: d.prequal.overallScore === null ? '' : String(d.prequal.overallScore), preQualResult: sc.result, approvalDecision: sc.result,
    approvedBy: d.approval.approvedBy, approvalDate: d.approval.approvalDate, validityYears: d.approval.validityYears === null ? '' : String(d.approval.validityYears),
    expireOn: expireOnOf(d.approval), lifecycleStatus: d.approval.status, date: d.date,
  };
}
/** Next sequential Supplier ID: SUP-001, SUP-002 … */
export function nextSupplierCode(records: DbRecord[]): string {
  let max = 0;
  records.forEach(r => { const m = /^SUP-(\d+)$/.exec(String((r as unknown as Record<string, unknown>).supplierCode ?? '')); if (m) max = Math.max(max, Number(m[1])); });
  return `SUP-${String(max + 1).padStart(3, '0')}`;
}

// ─── Supplier rows ───────────────────────────────────────────────────────────

export interface SupplierRow {
  id: string; code: string; name: string; category: string; businessType: string; product: string; contact: string; phone: string; email: string; address: string;
  date: string; savedAt: string;
  overall: number | null; result: ApprovalStatus; grade: string;
  status: SupplierStatus; state: ShownStatus; approvedBy: string; approvalDate: string; validityYears: number | null; expireOn: string; daysLeft: number | null;
  expiry: '' | 'soon' | 'expired';
  assessedBy: string; assessmentDate: string; method: string; certificationList: string; buyerList: string;
  areas: Record<string, number | null>; remarks: Record<string, string>;
  /** Older record with only an overall score (areas are a proportional split, not auto / manual). */
  legacy: boolean;
  /** Part scores (out of 100) and the manual criteria marked N/A. */
  parts: PartScore[]; na: Record<string, boolean>;
}

export function buildSupplierRows(records: DbRecord[], today: string = todayIso()): SupplierRow[] {
  return records.map((rec): SupplierRow => {
    const r = rec as unknown as Record<string, unknown>;
    const d = dataFromRecord(r, blankSupplierData());
    const sc = scoreFrom(d.prequal.overallScore);
    const expireOn = expireOnOf(d.approval);
    const daysLeft = expireOn ? daysFrom(today, expireOn) : null;
    const live = d.approval.status === 'Approved' || d.approval.status === 'Conditional';
    const expiry: SupplierRow['expiry'] = live && daysLeft !== null ? (daysLeft < 0 ? 'expired' : daysLeft <= SOON_DAYS ? 'soon' : '') : '';
    return {
      id: String(r.id ?? ''), code: d.supplierCode || String(r.id ?? ''), name: d.supplierName || '—', category: d.category, businessType: d.businessType,
      product: d.productCategory, contact: d.contactPerson, phone: d.phone, email: d.email, address: d.address, date: d.date, savedAt: String(r.savedAt ?? ''),
      overall: d.prequal.overallScore, result: sc.result, grade: sc.grade,
      status: d.approval.status, state: expiry === 'expired' ? 'Expired' : d.approval.status, approvedBy: d.approval.approvedBy, approvalDate: d.approval.approvalDate,
      validityYears: d.approval.validityYears, expireOn, daysLeft, expiry,
      assessedBy: d.prequal.assessedBy, assessmentDate: d.prequal.assessmentDate, method: d.prequal.method, certificationList: d.certificationList, buyerList: d.buyerList,
      areas: areaScoresOf(d.prequal), remarks: d.prequal.remarks, legacy: isLegacyPq(d.prequal), parts: partScores(d.prequal), na: d.prequal.na,
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
/** Approved list: Approved / Conditional suppliers whose approval has not expired. */
export const aslRows = (rows: SupplierRow[]) =>
  rows.filter(r => r.state === 'Approved' || r.state === 'Conditional').sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

export function supplierSummary(rows: SupplierRow[]) {
  const n = (fn: (r: SupplierRow) => boolean) => rows.filter(fn).length;
  const scored = rows.filter(r => r.overall !== null);
  return {
    total: rows.length, approved: n(r => r.state === 'Approved'), conditional: n(r => r.state === 'Conditional'),
    notApproved: n(r => r.status === 'Not Approved' || r.status === 'Blacklisted'), pending: n(r => r.status === 'Pending'), onHold: n(r => r.status === 'On Hold'),
    expired: n(r => r.state === 'Expired'), soon: n(r => r.expiry === 'soon'),
    assessed: scored.length, avgScore: scored.length ? round1(scored.reduce((s, r) => s + (r.overall ?? 0), 0) / scored.length) : null,
  };
}

// ─── Table engine: sort + column filters + search (state is owned by the Manager) ─

export const BLANK = '(Blank)';
export interface ColDef<T> { key: string; label: string; value: (r: T) => string | number | null; filter?: boolean; hidden?: boolean }
export interface TableState { search: string; sort: { key: string; dir: 'asc' | 'desc' }; filters: Record<string, string[]> }
export const EMPTY_TABLE: TableState = { search: '', sort: { key: '', dir: 'asc' }, filters: {} };
export type TableId = 'dashboard' | 'asl' | 'category' | 'sites';
export type TablesState = Record<TableId, TableState>;
export const INITIAL_TABLES: TablesState = {
  dashboard: EMPTY_TABLE, asl: EMPTY_TABLE, category: EMPTY_TABLE, sites: { ...EMPTY_TABLE, sort: { key: 'score', dir: 'asc' } },   // weakest sites first
};
const cellText = (v: string | number | null) => { const s = String(v ?? '').trim(); return s || BLANK; };

export function applyTable<T>(rows: T[], cols: ColDef<T>[], st: TableState): T[] {
  const words = st.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter(r => {
    for (const c of cols) { const sel = st.filters[c.key]; if (sel && sel.length && !sel.includes(cellText(c.value(r)))) return false; }
    if (words.length) {
      const hay = cols.map(c => String(c.value(r) ?? '')).join(' ').toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const col = cols.find(c => c.key === st.sort.key);
  if (!col) return out;
  const mult = st.sort.dir === 'asc' ? 1 : -1;
  return [...out].sort((x, y) => {
    const a = col.value(x), b = col.value(y);
    const ea = a === null || a === '', eb = b === null || b === '';
    if (ea && eb) return 0;
    if (ea) return 1;                       // blanks always last
    if (eb) return -1;
    return mult * (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
  });
}
/** Values offered by a column's funnel — the other filters and the search still apply, this column's own filter does not. */
export function columnOptions<T>(rows: T[], cols: ColDef<T>[], st: TableState, key: string): string[] {
  const filters = { ...st.filters }; delete filters[key];
  const col = cols.find(c => c.key === key);
  if (!col) return [];
  return Array.from(new Set(applyTable(rows, cols, { ...st, filters }).map(r => cellText(col.value(r))))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
export const countActiveFilters = (st: TableState) => (st.search.trim() ? 1 : 0) + Object.values(st.filters).filter(a => a.length > 0).length;

/** Address with its contact details — one searchable text (screen, print and PDF show it on separate lines). */
export const addressText = (r: { address: string; phone: string; email: string }) =>
  [r.address, r.phone && `Tel: ${r.phone}`, r.email && `Email: ${r.email}`].filter(Boolean).join(' · ');

export const SUPPLIER_COLS: ColDef<SupplierRow>[] = [
  { key: 'code', label: 'Supplier ID', value: r => r.code },
  { key: 'name', label: 'Supplier', value: r => r.name },
  { key: 'category', label: 'Category', value: r => r.category, filter: true },
  { key: 'address', label: 'Address', value: r => addressText(r) },
  { key: 'score', label: 'Score', value: r => r.overall },
  { key: 'status', label: 'Status', value: r => r.state, filter: true },
  { key: 'approvedBy', label: 'Approved by', value: r => r.approvedBy, filter: true },
  { key: 'approvalDate', label: 'Date of approval', value: r => r.approvalDate || null },
  { key: 'expireOn', label: 'Expire on', value: r => r.expireOn || null },
  { key: 'contact', label: 'Contact', value: r => r.contact, hidden: true },
  { key: 'phone', label: 'Mobile', value: r => r.phone, hidden: true },
  { key: 'assessedBy', label: 'Assessed by', value: r => r.assessedBy, hidden: true },
];
export const ASL_COLS: ColDef<SupplierRow>[] = [
  { key: 'code', label: 'Supplier ID', value: r => r.code },
  { key: 'name', label: 'Supplier', value: r => r.name },
  { key: 'category', label: 'Category', value: r => r.category, filter: true },
  { key: 'type', label: 'Supplier type', value: r => r.businessType, filter: true },
  { key: 'address', label: 'Address', value: r => addressText(r) },
  { key: 'score', label: 'Score', value: r => r.overall },
  { key: 'status', label: 'Approval', value: r => r.state, filter: true },
  { key: 'approvedBy', label: 'Approved by', value: r => r.approvedBy, filter: true },
  { key: 'approvalDate', label: 'Date of approval', value: r => r.approvalDate || null },
  { key: 'expireOn', label: 'Expire on', value: r => r.expireOn || null },
  { key: 'contact', label: 'Contact', value: r => r.contact, hidden: true },
];

// ─── Assessment Analysis (1): supplier data from this module ─────────────────

export interface CategoryRow { category: string; suppliers: number; avgScore: number | null; approved: number; conditional: number; notApproved: number; pending: number; soon: number; expired: number }
export function buildCategoryRows(rows: SupplierRow[]): CategoryRow[] {
  return Array.from(new Set(rows.map(r => r.category || '(No category)'))).map(c => {
    const list = rows.filter(r => (r.category || '(No category)') === c);
    const sc = list.filter(r => r.overall !== null);
    return {
      category: c, suppliers: list.length, avgScore: sc.length ? round1(sc.reduce((s, r) => s + (r.overall ?? 0), 0) / sc.length) : null,
      approved: list.filter(r => r.state === 'Approved').length, conditional: list.filter(r => r.state === 'Conditional').length,
      notApproved: list.filter(r => r.status === 'Not Approved' || r.status === 'Blacklisted').length, pending: list.filter(r => r.status === 'Pending').length,
      soon: list.filter(r => r.expiry === 'soon').length, expired: list.filter(r => r.state === 'Expired').length,
    };
  }).sort((a, b) => a.category.localeCompare(b.category));
}
export const CATEGORY_COLS: ColDef<CategoryRow>[] = [
  { key: 'category', label: 'Category', value: r => r.category, filter: true },
  { key: 'suppliers', label: 'Suppliers', value: r => r.suppliers },
  { key: 'avgScore', label: 'Avg score', value: r => r.avgScore },
  { key: 'approved', label: 'Approved', value: r => r.approved },
  { key: 'conditional', label: 'Conditional', value: r => r.conditional },
  { key: 'notApproved', label: 'Not approved', value: r => r.notApproved },
  { key: 'pending', label: 'Pending', value: r => r.pending },
  { key: 'soon', label: `Expiring ≤${SOON_DAYS}d`, value: r => r.soon },
  { key: 'expired', label: 'Expired', value: r => r.expired },
];

// ─── Assessment Analysis (2): external audits from the Compliance Audit module ─
// complianceaudit sheet, audit type "External for Supplier". Scores come from computeAuditScore() of that module.
// The same records also feed the Supplier form (name / address / contact / mobile / email).

export function normName(s: string): string {
  return s.toLowerCase().replace(/\b(ltd|limited|pvt|private|inc|co|company|corp|corporation|industries|industry)\b/g, ' ').replace(/[^a-z0-9\u0980-\u09FF]+/g, '');
}
/** One non-compliance of an audit (read from the Compliance Audit record). */
export interface ExtNc {
  ncId: string; point: string; area: string; severity: Severity; details: string; recommendation: string; responsible: string;
  /** Timeline as ISO date ('' when none). overdue = the date has passed (the audit module does not record closure). */
  timeline: string; overdue: boolean;
}
export interface ExtAudit {
  id: string; key: string; site: string; company: string; round: string; auditDate: string; areas: string[]; auditors: string;
  score: number; rating: string; minor: number; major: number; critical: number; total: number; pastDue: number;
  byArea: Record<string, number>; refs: string[]; supplierCode: string; supplierName: string;
  // Supplier details typed in the Compliance Audit (they fill the Supplier form)
  siteAddress: string; contactName: string; contactTitle: string; phone: string; email: string;
  auditorsInfo: string;   // "Name, Designation, Organization; …" of the auditors of this audit
  ncs: ExtNc[];
}
/** "Name (Job title)" — how the Contact person field shows it. */
export const contactOf = (a: { contactName: string; contactTitle: string }) =>
  a.contactName && a.contactTitle ? `${a.contactName} (${a.contactTitle})` : a.contactName || a.contactTitle;

/** Reads a sheet value whatever the key's letter case / separators (siteName, sitename, site_name …). First non-empty wins. */
function fieldReader(r: Record<string, unknown>) {
  const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
  const map = new Map<string, unknown>();
  Object.keys(r).forEach(k => map.set(norm(k), r[k]));
  return (...keys: string[]): string => {
    for (const k of keys) { const v = String(map.get(norm(k)) ?? '').trim(); if (v) return v; }
    return '';
  };
}
/** Auditors JSON → "Name, Designation, Organization; Name, …" (tolerant of the exact key names used). */
function auditorsText(raw: unknown): string {
  const arr = parseJson<unknown[]>(raw, []);
  return (Array.isArray(arr) ? arr : []).map(x => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const keys = Object.keys(o);
    const val = (k?: string) => (k ? String(o[k] ?? '').trim() : '');
    const name  = val(keys.find(k => /^(auditor)?name$/i.test(k)) ?? keys.find(k => /name/i.test(k) && !/org|company|firm/i.test(k)));
    const title = val(keys.find(k => /(title|desig|position|role)/i.test(k)));
    const org   = val(keys.find(k => /(org|company|firm|agency)/i.test(k)));
    return [name, title, org].filter(Boolean).join(', ');
  }).filter(Boolean).join('; ');
}

export function buildExtAudits(records: DbRecord[], suppliers: SupplierRow[], today: string = todayIso()): ExtAudit[] {
  const byName = new Map<string, SupplierRow>();
  suppliers.forEach(s => byName.set(normName(s.name), s));
  const out: ExtAudit[] = [];
  records.forEach(rec => {
    const r = rec as unknown as Record<string, unknown>;
    const g = fieldReader(r);
    if (!/external/i.test(g('auditType'))) return;
    const items = parseNcItems(r.correctiveActionsJson);
    const filled = items.filter(c => c.ncRef.trim() || c.detailsOfNonCompliance.trim());
    const sc = computeAuditScore(items);
    const auditDate = g('auditDate').slice(0, 10);
    const site = g('siteName'), company = g('companyName');
    const byArea: Record<string, number> = {};
    const refs: string[] = [];
    filled.forEach(c => { const p = findPointByRef(c.ncRef); if (p) { byArea[p.area] = (byArea[p.area] ?? 0) + 1; refs.push(p.point); } });
    const pastDue = filled.filter(c => { const iso = timelineIso(c.timeline, auditDate); return iso !== '' && iso < today; }).length;
    const match = byName.get(normName(site)) ?? byName.get(normName(company));
    const areaVals = parseJson<unknown[]>(r.auditingAreasJson, []);
    const ncs: ExtNc[] = filled.map(c => {
      const p = findPointByRef(c.ncRef), iso = timelineIso(c.timeline, auditDate);
      return {
        ncId: c.ncId, point: p ? p.point : c.ncRef.trim(), area: p?.area ?? '', severity: (c.severity || 'Minor') as Severity,
        details: c.detailsOfNonCompliance.trim(), recommendation: c.preventiveCorrectiveActions.trim(),
        responsible: [c.responsiblePersonName, c.agreedByManagement].map(x => String(x ?? '').trim()).filter(Boolean).join(' — '),
        timeline: iso, overdue: iso !== '' && iso < today,
      };
    });
    out.push({
      id: String(r.id ?? ''), key: normName(site || company), site: site || company || '—', company, round: String(r.auditRound ?? ''), auditDate,
      areas: Array.from(new Set((Array.isArray(areaVals) ? areaVals : []).map(v => areaCodeOf(String(v))).filter(Boolean))).sort(),
      auditors: parseAuditors(r.auditorsJson).map(a => a.name).filter(Boolean).join(', '),
      score: sc.score, rating: sc.rating, minor: sc.minor, major: sc.major, critical: sc.critical, total: sc.total, pastDue, byArea, refs,
      supplierCode: match?.code ?? '', supplierName: match?.name ?? '',
      siteAddress: g('siteAddress'),
      contactName: g('siteContactName'),
      contactTitle: g('siteContactJobTitle'),
      phone: fixPhone(g('sitePhone')),
      email: g('siteEmail'),
      auditorsInfo: auditorsText(r.auditorsJson ?? g('auditorsJson')),
      ncs,
    });
  });
  return out.sort((a, b) => b.auditDate.localeCompare(a.auditDate) || b.id.localeCompare(a.id));
}
export const areaName = (code: string) => AUDIT_AREAS.find(a => a.code === code)?.name ?? code;

/** Supplier details of a site: for every field the MOST RECENT audit that actually has a value (the latest audit may have left it empty). */
export interface SiteInfo { siteAddress: string; contactName: string; contactTitle: string; phone: string; email: string; auditorsInfo: string }

// ─── Risk rating (transparent rules, shown with its reasons in the report) ───

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export const RISK_COLORS: Record<RiskLevel, { bg: string; color: string }> = {
  Low: { bg: '#f0fdf4', color: '#15803d' }, Medium: { bg: '#fef3c7', color: '#92400e' }, High: { bg: '#ffedd5', color: '#c2410c' }, Critical: { bg: '#fee2e2', color: '#b91c1c' },
};
const RISK_RANK: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };
export interface RiskAssessment { level: RiskLevel; reasons: string[]; hint: SupplierStatus }
/**
 * Risk of the LATEST external audit of a site:
 *   Critical — any Critical NC (zero tolerance)
 *   High     — audit score below 60 · 3 or more Major NCs · 2 or more NCs past their timeline
 *   Medium   — audit score below 75 · any Major NC · any NC past its timeline · any repeat finding
 *   Low      — none of the above
 * hint = the status the evidence supports (never "Approved" with a Critical NC; High risk caps at "Conditional").
 */
export function riskOf(a: ExtAudit, repeatCount: number): RiskAssessment {
  let level: RiskLevel = 'Low';
  const reasons: string[] = [];
  const bump = (l: RiskLevel, why: string) => { reasons.push(why); if (RISK_RANK[l] > RISK_RANK[level]) level = l; };
  if (a.critical > 0) bump('Critical', `${a.critical} Critical non-compliance${a.critical > 1 ? 's' : ''} — zero tolerance`);
  if (a.score < 60) bump('High', `Audit score ${a.score} is below 60`); else if (a.score < 75) bump('Medium', `Audit score ${a.score} is below 75`);
  if (a.major >= 3) bump('High', `${a.major} Major non-compliances`); else if (a.major > 0) bump('Medium', `${a.major} Major non-compliance${a.major > 1 ? 's' : ''}`);
  if (a.pastDue >= 2) bump('High', `${a.pastDue} non-compliances are past their timeline`); else if (a.pastDue === 1) bump('Medium', '1 non-compliance is past its timeline');
  if (repeatCount > 0) bump('Medium', `${repeatCount} repeat finding${repeatCount > 1 ? 's' : ''} from the previous audit`);
  if (!reasons.length) reasons.push('No Critical or Major findings; audit score 75 or above');
  let hint = suggestedStatus(a.score, a.critical);
  if (RISK_RANK[level] >= RISK_RANK.High && hint === 'Approved') hint = 'Conditional';
  return { level, reasons, hint };
}

export interface SiteSummary {
  key: string; site: string; supplierCode: string; supplierName: string; inList: 'Yes' | 'No'; audits: number; latest: ExtAudit; prevScore: number | null; info: SiteInfo;
  /** All audits of the site, newest first. */
  history: ExtAudit[];
  /** Points that are non-compliant in BOTH the latest and the previous audit. */
  repeat: string[];
  risk: RiskAssessment;
}
export function summarizeSites(audits: ExtAudit[]): SiteSummary[] {
  const groups = new Map<string, ExtAudit[]>();
  audits.forEach(a => { const l = groups.get(a.key) ?? []; l.push(a); groups.set(a.key, l); });
  return Array.from(groups.values()).map(list => {
    const s = [...list].sort((a, b) => b.auditDate.localeCompare(a.auditDate) || b.id.localeCompare(a.id));
    const pick = (k: 'siteAddress' | 'phone' | 'email' | 'auditorsInfo') => s.find(a => a[k])?.[k] ?? '';
    const c = s.find(a => a.contactName) ?? s[0];
    const info: SiteInfo = { siteAddress: pick('siteAddress'), contactName: c.contactName, contactTitle: c.contactTitle, phone: pick('phone'), email: pick('email'), auditorsInfo: pick('auditorsInfo') };
    const prevPoints = new Set((s[1]?.ncs ?? []).map(n => n.point.toLowerCase()).filter(Boolean));
    const repeat = Array.from(new Set(s[0].ncs.map(n => n.point).filter(p => p && prevPoints.has(p.toLowerCase()))));
    return {
      key: s[0].key, site: s[0].site, supplierCode: s[0].supplierCode, supplierName: s[0].supplierName, inList: (s[0].supplierCode ? 'Yes' : 'No') as 'Yes' | 'No',
      audits: s.length, latest: s[0], prevScore: s[1] ? s[1].score : null, info, history: s, repeat, risk: riskOf(s[0], repeat.length),
    };
  });
}
export const SITE_COLS: ColDef<SiteSummary>[] = [
  { key: 'site', label: 'Site / supplier', value: r => r.site },
  { key: 'inList', label: 'In supplier list', value: r => r.inList, filter: true },
  { key: 'audits', label: 'Audits', value: r => r.audits },
  { key: 'round', label: 'Latest round', value: r => r.latest.round, filter: true },
  { key: 'date', label: 'Audit date', value: r => r.latest.auditDate || null },
  { key: 'score', label: 'Score', value: r => r.latest.score },
  { key: 'rating', label: 'Rating', value: r => r.latest.rating, filter: true },
  { key: 'critical', label: 'Critical', value: r => r.latest.critical },
  { key: 'major', label: 'Major', value: r => r.latest.major },
  { key: 'minor', label: 'Minor', value: r => r.latest.minor },
  { key: 'pastDue', label: 'Past timeline', value: r => r.latest.pastDue },
];

// ─── Validation ──────────────────────────────────────────────────────────────

/** Which form field an issue belongs to — the form shows the message right under that field. */
export type FieldKey = 'supplierName' | 'category' | 'email' | 'assessmentDate' | 'assessedBy' | 'overallScore'
  | `a_${string}`
  | 'approvedBy' | 'approvalDate' | 'validityYears' | 'status';
export interface FieldIssue { field: FieldKey; message: string }
export interface SupplierIssues { errors: FieldIssue[]; warnings: FieldIssue[] }
const RANK: Record<string, number> = { Rejected: 0, Pending: 0, Conditional: 1, Approved: 2 };

/** Errors block saving (listed in form order); warnings do not. `existingNames` = the OTHER saved suppliers. */
export function validateSupplier(d: SupplierData, existingNames: string[], today: string = todayIso(), site: SiteSummary | null = null): SupplierIssues {
  const errors: FieldIssue[] = [], warnings: FieldIssue[] = [];
  const err  = (field: FieldKey, message: string) => errors.push({ field, message });
  const warn = (field: FieldKey, message: string) => warnings.push({ field, message });
  const ap = d.approval, pq = d.prequal;
  const sc = scoreFrom(pq.overallScore);
  const live = ap.status === 'Approved' || ap.status === 'Conditional';
  const expire = expireOnOf(ap);
  const key = normName(d.supplierName);

  // A. Supplier information
  if (!d.supplierName.trim()) err('supplierName', 'Select the supplier from the Compliance Audit list.');
  else if (existingNames.some(n => normName(n) === key)) err('supplierName', 'This supplier is already saved — open it with Update instead of adding it again.');
  if (!d.category) err('category', 'Select the supplier category.');
  if (d.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) warn('email', 'This email does not look valid — correct it in the Compliance Audit.');

  // B. Assessment details
  if (!pq.assessmentDate) err('assessmentDate', 'Enter the assessment date.');
  else if (pq.assessmentDate > today) warn('assessmentDate', 'The assessment date is in the future.');
  if (!pq.assessedBy.trim()) err('assessedBy', 'Enter who assessed the supplier.');
  if (!isLegacyPq(pq)) {
    if (pq.auditScore === null) err('overallScore', 'Part 1 is automatic — select a supplier that has an audit in the Compliance Audit module.');
    AREAS.filter(a => isManualArea(a.key)).forEach(a => {
      if (pq.na[a.key]) { if (!(pq.remarks[a.key] ?? '').trim()) err(`a_${a.key}` as FieldKey, `${a.no} is N/A — write the justification in its remark.`); }
      else if (pq.manual[a.key] === null || pq.manual[a.key] === undefined) err(`a_${a.key}` as FieldKey, `Enter the mark for ${a.no} ${a.label} (0–${a.max}).`);
    });
    if (partScores(pq).some(p => !p.auto && p.score === null && p.defs.every(a => pq.na[a.key]))) err('overallScore', 'Every criterion of a part is N/A — at least one criterion must be assessed.');
  } else if (pq.overallScore === null) err('overallScore', 'Overall Compliance Score is missing.');

  // C. Approval details — required once the status is Approved / Conditional
  if (live && !ap.approvedBy.trim()) err('approvedBy', `Enter who approved — the status is ${ap.status}.`);
  if (live && !ap.approvalDate) err('approvalDate', 'Enter the date of approval.');
  else if (ap.approvalDate && pq.assessmentDate && ap.approvalDate < pq.assessmentDate) err('approvalDate', 'Date of approval is before the assessment date.');
  if (live && (ap.validityYears === null || ap.validityYears <= 0)) err('validityYears', 'Enter the validity in years — Expire on is calculated from it.');
  if (live && pq.overallScore !== null && RANK[ap.status] > RANK[sc.result]) warn('status', `Status (${ap.status}) is more lenient than the score result (${approvalLabel(sc.result)}) — document the reason.`);
  if (live && site && site.risk.level === 'Critical' && ap.status === 'Approved') warn('status', `The latest audit has ${site.latest.critical} Critical NC(s) — policy allows at most Conditional until they are closed.`);
  if (live && expire && expire < today) warn('status', `The approval expired on ${formatDMY(expire)} — the supplier is shown as Expired and is not on the ASL.`);
  return { errors, warnings };
}

// ─── Excel export ────────────────────────────────────────────────────────────

const addSheet = (wb: XLSX.WorkBook, name: string, head: string[], body: (string | number)[][], w: number[]) => {
  const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
  ws['!cols'] = w.map(wch => ({ wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: head.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, ws, name);
};
const supplierLine = (r: SupplierRow, i: number): (string | number)[] => [
  i + 1, r.code, r.name, r.category, r.businessType, r.product, r.contact, r.phone, r.email, r.address, r.certificationList, r.buyerList,
  formatDMY(r.assessmentDate), r.method, r.assessedBy, r.overall ?? '', ...r.parts.map(p => p.score ?? ''), ...AREAS.map(a => (r.na[a.key] ? 'N/A' : r.areas[a.key] ?? '')), approvalLabel(r.result),
  r.approvedBy, formatDMY(r.approvalDate), r.validityYears ?? '', formatDMY(r.expireOn), r.daysLeft ?? '', r.state,
];
const SUPPLIER_HEAD = ['SL', 'Supplier ID', 'Supplier', 'Category', 'Supplier Type', 'Product / Service', 'Contact', 'Mobile', 'Email', 'Address', 'Audit Certification List', 'Brand / Buyer List',
  'Assessment Date', 'Method', 'Assessed By', 'Final Score (avg of 3 parts)', ...PARTS.map(p => `${p.label} (/100)`), ...AREAS.map(a => `${a.no} ${a.label} (/${a.max})`), 'Score Result',
  'Approved By', 'Date of Approval', 'Validity (Years)', 'Expire On', 'Days Left', 'Status'];
const SUPPLIER_W = [5, 11, 26, 20, 16, 22, 18, 14, 22, 30, 36, 30, 13, 14, 16, 12, ...PARTS.map(() => 12), ...AREAS.map(() => 14), 13, 16, 13, 10, 12, 9, 12];

export interface ExportSets { rows: SupplierRow[]; asl: SupplierRow[]; cats: CategoryRow[]; sites: SiteSummary[]; audits: ExtAudit[] }
/** Sheets: Suppliers · ASL · Category Summary · Audited Sites · External Audits — exactly the sorted / filtered rows on screen. */
export function exportSupplierExcel(s: ExportSets, filename: string): void {
  const wb = XLSX.utils.book_new();
  addSheet(wb, 'Suppliers', SUPPLIER_HEAD, s.rows.map(supplierLine), SUPPLIER_W);
  addSheet(wb, 'ASL', SUPPLIER_HEAD, s.asl.map(supplierLine), SUPPLIER_W);
  addSheet(wb, 'Category Summary', ['Category', 'Suppliers', 'Avg Score', 'Approved', 'Conditional', 'Not Approved', 'Pending', `Expiring ≤${SOON_DAYS}d`, 'Expired'],
    s.cats.map(c => [c.category, c.suppliers, c.avgScore ?? '', c.approved, c.conditional, c.notApproved, c.pending, c.soon, c.expired]), [28, 10, 10, 10, 12, 13, 9, 14, 9]);
  addSheet(wb, 'Audited Sites', ['Site / Supplier', 'In Supplier List', 'Supplier ID', 'Audits', 'Latest Round', 'Audit Date', 'Score', 'Rating', 'Critical', 'Major', 'Minor', 'Past Timeline', 'Previous Score'],
    s.sites.map(x => [x.site, x.inList, x.supplierCode, x.audits, x.latest.round, formatDMY(x.latest.auditDate), x.latest.score, x.latest.rating, x.latest.critical, x.latest.major, x.latest.minor, x.latest.pastDue, x.prevScore ?? '']),
    [28, 12, 12, 8, 14, 12, 8, 18, 9, 8, 8, 13, 13]);
  addSheet(wb, 'External Audits', ['Site / Supplier', 'Matched Supplier ID', 'Audit Round', 'Audit Date', 'Auditing Areas', 'Auditors', 'Score', 'Rating', 'Critical', 'Major', 'Minor', 'Total NCs', 'NCs Past Timeline'],
    s.audits.map(a => [a.site, a.supplierCode, a.round, formatDMY(a.auditDate), a.areas.join(', '), a.auditors, a.score, a.rating, a.critical, a.major, a.minor, a.total, a.pastDue]),
    [28, 14, 14, 12, 14, 26, 8, 18, 9, 8, 8, 10, 14]);
  addSheet(wb, 'Findings (latest audits)', ['Site / Supplier', 'Audit Date', 'NC ID', 'Area', 'Point', 'Severity', 'Details', 'Recommendation', 'Responsible', 'Timeline', 'Past Timeline'],
    s.sites.flatMap(x => x.latest.ncs.map(n => [x.site, formatDMY(x.latest.auditDate), n.ncId, n.area, n.point, n.severity, n.details, n.recommendation, n.responsible, formatDMY(n.timeline), n.overdue ? 'Yes' : ''])),
    [28, 12, 11, 6, 30, 10, 40, 34, 24, 12, 12]);
  addSheet(wb, 'Risk Rating', ['Site / Supplier', 'Risk', 'Suggested Status', 'Reasons', 'Repeat Findings'],
    s.sites.map(x => [x.site, x.risk.level, x.risk.hint, x.risk.reasons.join('; '), x.repeat.join('; ')]), [28, 10, 16, 70, 50]);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}