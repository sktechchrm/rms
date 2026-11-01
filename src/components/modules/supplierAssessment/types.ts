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

// ─── Overall Compliance Score → the ten areas (automatic) ────────────────────

export interface AreaDef { key: string; label: string; max: number; guide: string }
export const AREAS: AreaDef[] = [
  { key: 'profile',      label: 'Company Profile & Legal Documents', max: 5,  guide: 'Trade licence, TIN/BIN, incorporation, bank details, ownership' },
  { key: 'financial',    label: 'Financial Stability', max: 5,  guide: 'Financial statements, bank reference, credit standing' },
  { key: 'capacity',     label: 'Production Capacity', max: 10, guide: 'Machines / lines, capacity vs our demand, backup capacity' },
  { key: 'quality',      label: 'Quality Management & Product Compliance', max: 20, guide: 'QMS, inspection system, lab test reports, AQL, RSL/MRSL' },
  { key: 'delivery',     label: 'Delivery & Supply Chain', max: 15, guide: 'Lead-time reliability, delivery history, planning, logistics' },
  { key: 'social',       label: 'Social Compliance', max: 15, guide: 'Child / forced labour, wages & hours, association, discrimination' },
  { key: 'safety',       label: 'Health & Safety', max: 10, guide: 'Building, fire & electrical safety, chemicals, PPE, accidents' },
  { key: 'environment',  label: 'Environmental Management', max: 10, guide: 'ETP / waste, energy & water monitoring, environmental clearance' },
  { key: 'ethics',       label: 'Ethical Business Practices', max: 5,  guide: 'Anti-bribery, conflict of interest, code of conduct' },
  { key: 'traceability', label: 'Traceability & Customer References', max: 5,  guide: 'Material origin, batch traceability, buyer references' },
];
export const MAX_TOTAL = AREAS.reduce((s, a) => s + a.max, 0);   // 100
export const APPROVE_MIN = 85;
export const CONDITIONAL_MIN = 70;
export const SOON_DAYS = 90;                                       // "expiring soon" window

/** area score = overall × max ÷ 100 (the ten maxima add up to 100). */
export function areaScores(overall: number | null): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  AREAS.forEach(a => { out[a.key] = overall === null ? null : round2((overall * a.max) / MAX_TOTAL); });
  return out;
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
export function suggestedStatus(overall: number | null): SupplierStatus {
  const r = scoreFrom(overall).result;
  return r === 'Approved' ? 'Approved' : r === 'Conditional' ? 'Conditional' : r === 'Rejected' ? 'Not Approved' : 'Pending';
}

export type AssessmentMethod = 'Desktop' | 'On-site' | 'Desktop + On-site';
export const METHOD_OPTIONS: AssessmentMethod[] = ['Desktop', 'On-site', 'Desktop + On-site'];
export interface Prequal {
  assessmentDate: string; method: AssessmentMethod; assessedBy: string;
  overallScore: number | null;                // the one input; the ten area scores are derived from it
  remarks: Record<string, string>;            // optional evidence note per area
}
export const blankPrequal = (): Prequal => ({ assessmentDate: '', method: 'Desktop', assessedBy: '', overallScore: null, remarks: {} });

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
  AREAS.forEach(a => { const r = (o.remarks as Record<string, unknown> | undefined)?.[a.key]; if (r) remarks[a.key] = String(r); });
  let overall = num(o.overallScore);
  if (overall === null && o.scores && typeof o.scores === 'object') {           // older rows: complete area scores → their total
    const vals = AREAS.map(a => num((o.scores as Record<string, unknown>)[a.key]));
    if (vals.every(v => v !== null)) overall = round1(vals.reduce<number>((s, v) => s + (v ?? 0), 0));
  }
  const m = String(o.method ?? '');
  return {
    assessmentDate: String(o.assessmentDate ?? '').slice(0, 10), method: (METHOD_OPTIONS as string[]).includes(m) ? (m as AssessmentMethod) : 'Desktop',
    assessedBy: String(o.assessedBy ?? ''), overallScore: overall, remarks,
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
      areas: areaScores(d.prequal.overallScore), remarks: d.prequal.remarks,
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
export interface ExtAudit {
  id: string; key: string; site: string; company: string; round: string; auditDate: string; areas: string[]; auditors: string;
  score: number; rating: string; minor: number; major: number; critical: number; total: number; pastDue: number;
  byArea: Record<string, number>; refs: string[]; supplierCode: string; supplierName: string;
  // Supplier details typed in the Compliance Audit (they fill the Supplier form)
  siteAddress: string; contactName: string; contactTitle: string; phone: string; email: string;
  auditorsInfo: string;   // "Name, Designation, Organization; …" of the auditors of this audit
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
    });
  });
  return out.sort((a, b) => b.auditDate.localeCompare(a.auditDate) || b.id.localeCompare(a.id));
}
export const areaName = (code: string) => AUDIT_AREAS.find(a => a.code === code)?.name ?? code;

/** Supplier details of a site: for every field the MOST RECENT audit that actually has a value (the latest audit may have left it empty). */
export interface SiteInfo { siteAddress: string; contactName: string; contactTitle: string; phone: string; email: string; auditorsInfo: string }
export interface SiteSummary { key: string; site: string; supplierCode: string; supplierName: string; inList: 'Yes' | 'No'; audits: number; latest: ExtAudit; prevScore: number | null; info: SiteInfo }
export function summarizeSites(audits: ExtAudit[]): SiteSummary[] {
  const groups = new Map<string, ExtAudit[]>();
  audits.forEach(a => { const l = groups.get(a.key) ?? []; l.push(a); groups.set(a.key, l); });
  return Array.from(groups.values()).map(list => {
    const s = [...list].sort((a, b) => b.auditDate.localeCompare(a.auditDate) || b.id.localeCompare(a.id));
    const pick = (k: 'siteAddress' | 'phone' | 'email' | 'auditorsInfo') => s.find(a => a[k])?.[k] ?? '';
    const c = s.find(a => a.contactName) ?? s[0];
    const info: SiteInfo = { siteAddress: pick('siteAddress'), contactName: c.contactName, contactTitle: c.contactTitle, phone: pick('phone'), email: pick('email'), auditorsInfo: pick('auditorsInfo') };
    return { key: s[0].key, site: s[0].site, supplierCode: s[0].supplierCode, supplierName: s[0].supplierName, inList: (s[0].supplierCode ? 'Yes' : 'No') as 'Yes' | 'No', audits: s.length, latest: s[0], prevScore: s[1] ? s[1].score : null, info };
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
  | 'approvedBy' | 'approvalDate' | 'validityYears' | 'status';
export interface FieldIssue { field: FieldKey; message: string }
export interface SupplierIssues { errors: FieldIssue[]; warnings: FieldIssue[] }
const RANK: Record<string, number> = { Rejected: 0, Pending: 0, Conditional: 1, Approved: 2 };

/** Errors block saving (listed in form order); warnings do not. `existingNames` = the OTHER saved suppliers. */
export function validateSupplier(d: SupplierData, existingNames: string[], today: string = todayIso()): SupplierIssues {
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
  if (pq.overallScore === null) err('overallScore', 'Enter the Overall Compliance Score (0–100).');

  // C. Approval details — required once the status is Approved / Conditional
  if (live && !ap.approvedBy.trim()) err('approvedBy', `Enter who approved — the status is ${ap.status}.`);
  if (live && !ap.approvalDate) err('approvalDate', 'Enter the date of approval.');
  else if (ap.approvalDate && pq.assessmentDate && ap.approvalDate < pq.assessmentDate) err('approvalDate', 'Date of approval is before the assessment date.');
  if (live && (ap.validityYears === null || ap.validityYears <= 0)) err('validityYears', 'Enter the validity in years — Expire on is calculated from it.');
  if (live && pq.overallScore !== null && RANK[ap.status] > RANK[sc.result]) warn('status', `Status (${ap.status}) is more lenient than the score result (${approvalLabel(sc.result)}) — document the reason.`);
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
  formatDMY(r.assessmentDate), r.method, r.assessedBy, r.overall ?? '', ...AREAS.map(a => r.areas[a.key] ?? ''), approvalLabel(r.result),
  r.approvedBy, formatDMY(r.approvalDate), r.validityYears ?? '', formatDMY(r.expireOn), r.daysLeft ?? '', r.state,
];
const SUPPLIER_HEAD = ['SL', 'Supplier ID', 'Supplier', 'Category', 'Supplier Type', 'Product / Service', 'Contact', 'Mobile', 'Email', 'Address', 'Audit Certification List', 'Brand / Buyer List',
  'Assessment Date', 'Method', 'Assessed By', 'Overall Compliance Score', ...AREAS.map(a => `${a.label} (/${a.max})`), 'Score Result',
  'Approved By', 'Date of Approval', 'Validity (Years)', 'Expire On', 'Days Left', 'Status'];
const SUPPLIER_W = [5, 11, 26, 20, 16, 22, 18, 14, 22, 30, 36, 30, 13, 14, 16, 12, ...AREAS.map(() => 14), 13, 16, 13, 10, 12, 9, 12];

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
  XLSX.writeFile(wb, `${filename}.xlsx`);
}