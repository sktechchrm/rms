// ─────────────────────────────────────────────────────────────────────────────
// types.ts — Supplier Assessment: data model + business logic + Excel export (one file).
// Path: src/components/modules/supplierAssessment/types.ts
//
// ONE sheet row = one supplier:
//   profile columns · prequalJson (assessment details + 10-area, 100-point scorecard) ·
//   certificatesJson (list of certificates) · buyersJson (list of buyers)
// The RESULT (Approved / Conditional / Not Approved) is computed from the score — never typed in:
//   85+ Approved · 70–84 Conditional · below 70 Not Approved; a key area (Quality, Social, Health & Safety)
//   below 50% of its maximum lowers the result by one level.
// The Assessment Analysis page reads the complianceaudit sheet (audit type "External for Supplier")
// and reuses its own scoring (computeAuditScore) so the numbers match the Compliance Audit module.
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { getExpiryStatus, daysUntil } from '../../../utils/expiryStatus';
import { parseNcItems, parseAuditors, computeAuditScore, findPointByRef, timelineIso, areaCodeOf, AUDIT_AREAS } from '../complianceAudit/types';

const round1 = (n: number) => Math.round(n * 10) / 10;
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
  Pending:     { bg: '#f1f5f9', color: '#64748b' },
  Approved:    { bg: '#f0fdf4', color: '#15803d' },
  Conditional: { bg: '#fef3c7', color: '#92400e' },
  Rejected:    { bg: '#fee2e2', color: '#b91c1c' },
};

export type SupplierStatus = 'Prospect' | 'Under Assessment' | 'Approved' | 'Conditional' | 'Not Approved';
export const STATUS_COLORS: Record<SupplierStatus, { bg: string; color: string }> = {
  Prospect:           { bg: '#f1f5f9', color: '#64748b' },
  'Under Assessment': { bg: '#e0e7ff', color: '#3730a3' },
  Approved:           { bg: '#f0fdf4', color: '#15803d' },
  Conditional:        { bg: '#fef3c7', color: '#92400e' },
  'Not Approved':     { bg: '#fee2e2', color: '#b91c1c' },
};
export const RATING_COLORS: Record<string, { bg: string; color: string }> = {
  Good: { bg: '#f0fdf4', color: '#15803d' }, Satisfactory: { bg: '#dbeafe', color: '#1d4ed8' },
  'Needs Improvement': { bg: '#fef3c7', color: '#92400e' }, 'High Risk': { bg: '#fee2e2', color: '#b91c1c' },
};

// ─── Assessment scorecard (100 points) ───────────────────────────────────────

export interface AreaDef { key: string; label: string; max: number; keyArea?: boolean; guide: string }
export const AREAS: AreaDef[] = [
  { key: 'profile',      label: 'Company Profile & Legal Documents', max: 5,  guide: 'Trade licence, TIN/BIN, incorporation, bank details, ownership, years in business' },
  { key: 'financial',    label: 'Financial Stability', max: 5,  guide: 'Financial statements, bank reference, credit standing, turnover trend' },
  { key: 'capacity',     label: 'Production Capacity', max: 10, guide: 'Machines / lines, capacity vs our demand, utilisation, backup capacity' },
  { key: 'quality',      label: 'Quality Management & Product Compliance', max: 20, keyArea: true, guide: 'ISO 9001 / QMS, incoming-inline-final inspection, lab test reports (shrinkage, colour fastness, GSM), AQL, RSL/MRSL, OEKO-TEX / REACH' },
  { key: 'delivery',     label: 'Delivery & Supply Chain', max: 15, guide: 'Lead-time reliability, delivery history, planning, buffer stock, logistics, business continuity' },
  { key: 'social',       label: 'Social Compliance', max: 15, keyArea: true, guide: 'No child / forced labour, wages & hours, freedom of association, discrimination; valid BSCI / SMETA / WRAP / SLCP report' },
  { key: 'safety',       label: 'Health & Safety', max: 10, keyArea: true, guide: 'Building, fire & electrical safety, chemical storage, PPE, accident log, safety committee' },
  { key: 'environment',  label: 'Environmental Management', max: 10, guide: 'ETP / waste water, waste disposal, energy & water monitoring, ZDHC, DoE clearance' },
  { key: 'ethics',       label: 'Ethical Business Practices', max: 5,  guide: 'Anti-bribery, conflict of interest, code-of-conduct acknowledgement, no unauthorised subcontracting' },
  { key: 'traceability', label: 'Traceability & Customer References', max: 5,  guide: 'Raw-material origin, batch traceability, references from other buyers' },
];
export const MAX_TOTAL = AREAS.reduce((s, a) => s + a.max, 0);   // 100
export const APPROVE_MIN = 85;
export const CONDITIONAL_MIN = 70;
export const KEY_AREA_FLOOR = 0.5;

export type AssessmentMethod = 'Desktop' | 'On-site' | 'Desktop + On-site';
export const METHOD_OPTIONS: AssessmentMethod[] = ['Desktop', 'On-site', 'Desktop + On-site'];

export interface Prequal {
  assessmentDate: string; method: AssessmentMethod; assessedBy: string;
  scores: Record<string, number | null>;      // area key → points (null = not scored)
  remarks: Record<string, string>;
  findings: string;                           // assessment remarks / findings
}
export const blankPrequal = (): Prequal => ({ assessmentDate: '', method: 'Desktop', assessedBy: '', scores: {}, remarks: {}, findings: '' });
export interface PrequalResult { total: number; scored: number; complete: boolean; result: ApprovalStatus; grade: string; reasons: string[]; weakAreas: string[] }

export function scorePrequal(p: Prequal): PrequalResult {
  let total = 0, scored = 0;
  const weak: string[] = [];
  AREAS.forEach(a => {
    const v = p.scores[a.key];
    if (typeof v === 'number') { total += v; scored++; if (a.keyArea && v < a.max * KEY_AREA_FLOOR) weak.push(a.label); }
  });
  total = round1(total);
  const complete = scored === AREAS.length;
  const reasons: string[] = [];
  let result: ApprovalStatus = 'Pending';
  if (!complete) {
    reasons.push(`${scored} of ${AREAS.length} areas scored — the result appears once every area is scored.`);
  } else {
    result = total >= APPROVE_MIN ? 'Approved' : total >= CONDITIONAL_MIN ? 'Conditional' : 'Rejected';
    reasons.push(`Score ${total}/${MAX_TOTAL}: ${APPROVE_MIN}+ Approved · ${CONDITIONAL_MIN}–${APPROVE_MIN - 1} Conditional · below ${CONDITIONAL_MIN} Not Approved.`);
    if (weak.length && result !== 'Rejected') {
      result = result === 'Approved' ? 'Conditional' : 'Rejected';
      reasons.push(`Key area below 50%: ${weak.join(', ')} — result lowered one level.`);
    }
  }
  const grade = scored === 0 ? '—' : total >= APPROVE_MIN ? 'A' : total >= CONDITIONAL_MIN ? 'B' : 'C';
  return { total, scored, complete, result, grade, reasons, weakAreas: weak };
}
export function statusOf(pq: PrequalResult): SupplierStatus {
  if (pq.complete) return pq.result === 'Approved' ? 'Approved' : pq.result === 'Conditional' ? 'Conditional' : 'Not Approved';
  return pq.scored > 0 ? 'Under Assessment' : 'Prospect';
}

// ─── Additional: certificates and buyers ─────────────────────────────────────

export interface SupplierCertificate { name: string; number: string; issuedBy: string; validUntil: string }
export const blankCertificate = (): SupplierCertificate => ({ name: '', number: '', issuedBy: '', validUntil: '' });
export const CERTIFICATE_SUGGESTIONS = [
  'ISO 9001', 'ISO 14001', 'ISO 45001', 'OEKO-TEX Standard 100', 'GOTS', 'GRS', 'RCS', 'OCS', 'BCI', 'BSCI', 'Sedex SMETA', 'WRAP', 'SLCP',
  'ZDHC', 'Higg FEM', 'Bluesign', 'Fire / Building Safety Certificate', 'DoE Environmental Clearance', 'Trade License',
];
export interface SupplierBuyer { name: string; country: string; products: string }
export const blankBuyer = (): SupplierBuyer => ({ name: '', country: '', products: '' });

// ─── Form state ──────────────────────────────────────────────────────────────

export interface SupplierData {
  supplierCode: string; supplierName: string; category: string; businessType: string; productCategory: string;
  contactPerson: string; phone: string; email: string; address: string; tradeLicenseNo: string;
  prequal: Prequal; certificates: SupplierCertificate[]; buyers: SupplierBuyer[];
  date: string; factoryName: string; factoryAddress: string;
}
export function blankSupplierData(): SupplierData {
  return {
    supplierCode: '', supplierName: '', category: '', businessType: 'Manufacturer', productCategory: '',
    contactPerson: '', phone: '', email: '', address: '', tradeLicenseNo: '',
    prequal: blankPrequal(), certificates: [], buyers: [], date: todayIso(), factoryName: '', factoryAddress: '',
  };
}

function parsePrequal(raw: unknown): Prequal {
  const o = parseJson<Record<string, unknown>>(raw, {});
  const scores: Record<string, number | null> = {}, remarks: Record<string, string> = {};
  AREAS.forEach(a => {
    scores[a.key] = num((o.scores as Record<string, unknown> | undefined)?.[a.key]);
    const r = (o.remarks as Record<string, unknown> | undefined)?.[a.key];
    if (r) remarks[a.key] = String(r);
  });
  const m = String(o.method ?? '');
  return {
    assessmentDate: String(o.assessmentDate ?? '').slice(0, 10), method: (METHOD_OPTIONS as string[]).includes(m) ? (m as AssessmentMethod) : 'Desktop',
    assessedBy: String(o.assessedBy ?? ''), scores, remarks, findings: String(o.findings ?? ''),
  };
}
function parseCertificates(raw: unknown): SupplierCertificate[] {
  const arr = parseJson<unknown[]>(raw, []);
  return (Array.isArray(arr) ? arr : []).map(x => {
    const c = (x ?? {}) as Record<string, unknown>;
    return { name: String(c.name ?? ''), number: String(c.number ?? ''), issuedBy: String(c.issuedBy ?? ''), validUntil: String(c.validUntil ?? '').slice(0, 10) };
  });
}
function parseBuyers(raw: unknown): SupplierBuyer[] {
  const arr = parseJson<unknown[]>(raw, []);
  return (Array.isArray(arr) ? arr : []).map(x => {
    const b = (x ?? {}) as Record<string, unknown>;
    return { name: String(b.name ?? ''), country: String(b.country ?? ''), products: String(b.products ?? '') };
  });
}

/** Saved row → form state. Older rows (saved before this version) simply open with whatever columns they have. */
export function dataFromRecord(rec: Record<string, unknown>, prev: SupplierData): SupplierData {
  const str = (k: string) => String(rec[k] ?? '');
  return {
    ...prev,
    supplierCode: str('supplierCode'), supplierName: str('supplierName'), category: str('category'), businessType: str('businessType') || 'Manufacturer',
    productCategory: str('productCategory'), contactPerson: str('contactPerson'), phone: fixPhone(rec.phone), email: str('email'), address: str('address'),
    tradeLicenseNo: str('tradeLicenseNo'),
    prequal: parsePrequal(rec.prequalJson), certificates: parseCertificates(rec.certificatesJson), buyers: parseBuyers(rec.buyersJson),
    date: str('date').slice(0, 10) || prev.date,
  };
}
/** Form state → sheet columns (denormalised score / result columns make the Google Sheet readable). */
export function dataToRecord(d: SupplierData, code: string): Record<string, string> {
  const pq = scorePrequal(d.prequal);
  return {
    supplierCode: code, supplierName: d.supplierName.trim(), category: d.category, businessType: d.businessType, productCategory: d.productCategory,
    contactPerson: d.contactPerson, phone: d.phone, email: d.email, address: d.address, tradeLicenseNo: d.tradeLicenseNo,
    prequalJson: JSON.stringify(d.prequal), preQualScore: pq.scored ? String(pq.total) : '', preQualResult: pq.result, approvalDecision: pq.result,
    lifecycleStatus: statusOf(pq), certificatesJson: JSON.stringify(d.certificates.filter(c => c.name.trim())), buyersJson: JSON.stringify(d.buyers.filter(b => b.name.trim())),
    date: d.date,
  };
}
/** Next sequential Supplier ID: SUP-001, SUP-002 … */
export function nextSupplierCode(records: DbRecord[]): string {
  let max = 0;
  records.forEach(r => { const m = /^SUP-(\d+)$/.exec(String((r as unknown as Record<string, unknown>).supplierCode ?? '')); if (m) max = Math.max(max, Number(m[1])); });
  return `SUP-${String(max + 1).padStart(3, '0')}`;
}

// ─── Supplier rows (Dashboard / ASL) ─────────────────────────────────────────

export type CertState = ReturnType<typeof getExpiryStatus>;
export interface CertRow { c: SupplierCertificate; state: CertState; days: number | null }

export interface SupplierRow {
  id: string; code: string; name: string; category: string; businessType: string; contact: string; phone: string; date: string; savedAt: string;
  pq: PrequalResult; status: SupplierStatus; assessedBy: string; assessmentDate: string; method: string; findings: string;
  certs: CertRow[]; buyers: SupplierBuyer[]; certIssue: '' | 'expired' | 'due-soon';
  scores: Record<string, number | null>;
}

export function buildSupplierRows(records: DbRecord[]): SupplierRow[] {
  return records.map(rec => {
    const r = rec as unknown as Record<string, unknown>;
    const d = dataFromRecord(r, blankSupplierData());
    const pq = scorePrequal(d.prequal);
    const certs: CertRow[] = d.certificates.map(c => ({ c, state: getExpiryStatus(c.validUntil), days: daysUntil(c.validUntil) }));
    const certIssue: SupplierRow['certIssue'] = certs.some(x => x.state === 'expired') ? 'expired' : certs.some(x => x.state === 'due-soon') ? 'due-soon' : '';
    return {
      id: String(r.id ?? ''), code: d.supplierCode || String(r.id ?? ''), name: d.supplierName || '—', category: d.category, businessType: d.businessType,
      contact: d.contactPerson, phone: d.phone, date: d.date, savedAt: String(r.savedAt ?? ''),
      pq, status: statusOf(pq), assessedBy: d.prequal.assessedBy, assessmentDate: d.prequal.assessmentDate, method: d.prequal.method, findings: d.prequal.findings,
      certs, buyers: d.buyers, certIssue,
      scores: d.prequal.scores,
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function filterSuppliers(rows: SupplierRow[], search: string): SupplierRow[] {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return rows;
  return rows.filter(r => {
    const hay = [r.name, r.code, r.category, r.businessType, r.contact, r.phone, r.status].join(' ').toLowerCase();
    return words.every(w => hay.includes(w));
  });
}
export const aslRows = (rows: SupplierRow[]) =>
  rows.filter(r => r.status === 'Approved' || r.status === 'Conditional').sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

export function supplierSummary(rows: SupplierRow[]) {
  const n = (fn: (r: SupplierRow) => boolean) => rows.filter(fn).length;
  return {
    total: rows.length, approved: n(r => r.status === 'Approved'), conditional: n(r => r.status === 'Conditional'), notApproved: n(r => r.status === 'Not Approved'),
    pending: n(r => r.status === 'Prospect' || r.status === 'Under Assessment'), certExpired: n(r => r.certIssue === 'expired'), certDueSoon: n(r => r.certIssue === 'due-soon'),
  };
}

// ─── Assessment Analysis: external audits from the Compliance Audit module ───
// Source: complianceaudit sheet, audit type "External for Supplier". Scores come from computeAuditScore()
// of that module (100 − Critical×10 − Major×5 − Minor×2), so both modules always agree.

export function normName(s: string): string {
  return s.toLowerCase().replace(/\b(ltd|limited|pvt|private|inc|co|company|corp|corporation|industries|industry)\b/g, ' ').replace(/[^a-z0-9\u0980-\u09FF]+/g, '');
}

export interface ExtAudit {
  id: string; key: string; site: string; company: string; round: string; auditDate: string; areas: string[]; auditors: string;
  score: number; rating: string; minor: number; major: number; critical: number; total: number; pastDue: number;
  byArea: Record<string, number>; refs: string[]; supplierCode: string; supplierName: string;
}

export function buildExtAudits(records: DbRecord[], suppliers: SupplierRow[], today: string = todayIso()): ExtAudit[] {
  const byName = new Map<string, SupplierRow>();
  suppliers.forEach(s => byName.set(normName(s.name), s));
  const out: ExtAudit[] = [];
  records.forEach(rec => {
    const r = rec as unknown as Record<string, unknown>;
    if (!/external/i.test(String(r.auditType ?? ''))) return;
    const items = parseNcItems(r.correctiveActionsJson);
    const filled = items.filter(c => c.ncRef.trim() || c.detailsOfNonCompliance.trim());
    const sc = computeAuditScore(items);
    const auditDate = String(r.auditDate ?? '').slice(0, 10);
    const site = String(r.siteName ?? '').trim(), company = String(r.companyName ?? '').trim();
    const byArea: Record<string, number> = {};
    const refs: string[] = [];
    filled.forEach(c => {
      const p = findPointByRef(c.ncRef);
      if (p) { byArea[p.area] = (byArea[p.area] ?? 0) + 1; refs.push(p.point); }
    });
    const pastDue = filled.filter(c => { const iso = timelineIso(c.timeline, auditDate); return iso !== '' && iso < today; }).length;
    const match = byName.get(normName(site)) ?? byName.get(normName(company));
    out.push({
      id: String(r.id ?? ''), key: normName(site || company), site: site || company || '—', company, round: String(r.auditRound ?? ''), auditDate,
      areas: Array.from(new Set(parseAreaValues(r.auditingAreasJson).map(areaCodeOf).filter(Boolean))).sort(),
      auditors: parseAuditors(r.auditorsJson).map(a => a.name).filter(Boolean).join(', '),
      score: sc.score, rating: sc.rating, minor: sc.minor, major: sc.major, critical: sc.critical, total: sc.total, pastDue, byArea, refs,
      supplierCode: match?.code ?? '', supplierName: match?.name ?? '',
    });
  });
  return out.sort((a, b) => b.auditDate.localeCompare(a.auditDate) || b.id.localeCompare(a.id));
}
function parseAreaValues(raw: unknown): string[] {
  const a = parseJson<unknown[]>(raw, []);
  return Array.isArray(a) ? a.map(String) : [];
}
export const areaName = (code: string) => AUDIT_AREAS.find(a => a.code === code)?.name ?? code;

export interface SiteSummary { key: string; site: string; supplierCode: string; supplierName: string; audits: number; latest: ExtAudit; prevScore: number | null }
/** One line per audited site: the latest audit plus the change in score since the audit before it. */
export function summarizeSites(audits: ExtAudit[]): SiteSummary[] {
  const groups = new Map<string, ExtAudit[]>();
  audits.forEach(a => { const l = groups.get(a.key) ?? []; l.push(a); groups.set(a.key, l); });
  return Array.from(groups.values()).map(list => {
    const sorted = [...list].sort((a, b) => b.auditDate.localeCompare(a.auditDate) || b.id.localeCompare(a.id));
    return { key: sorted[0].key, site: sorted[0].site, supplierCode: sorted[0].supplierCode, supplierName: sorted[0].supplierName, audits: sorted.length, latest: sorted[0], prevScore: sorted[1] ? sorted[1].score : null };
  }).sort((a, b) => a.latest.score - b.latest.score);       // weakest first
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface SupplierIssues { errors: string[]; warnings: string[] }

/** Errors block saving; warnings do not. `existingNames` = the OTHER saved suppliers. */
export function validateSupplier(d: SupplierData, existingNames: string[]): SupplierIssues {
  const errors: string[] = [], warnings: string[] = [];
  const name = d.supplierName.trim().toLowerCase();
  const pq = scorePrequal(d.prequal);
  if (!name) errors.push('Supplier name is required.');
  else if (existingNames.some(n => n.trim().toLowerCase() === name)) warnings.push('A supplier with this name is already saved — use Update to change it instead of adding a second one.');
  if (!d.category) errors.push('Supplier category is required.');
  if (d.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) warnings.push('The email address does not look valid.');
  if (pq.scored > 0 && !d.prequal.assessmentDate) warnings.push('Scores are entered but the assessment date is empty.');
  if (pq.scored > 0 && !d.prequal.assessedBy.trim()) warnings.push('Scores are entered but "Assessed by" is empty.');
  d.certificates.forEach((c, i) => {
    const tag = `Certificate ${i + 1}${c.name ? ` (${c.name})` : ''}`;
    if (!c.name.trim() && (c.number || c.issuedBy || c.validUntil)) warnings.push(`${tag}: certificate name is empty — it will not be saved.`);
    if (c.name.trim() && getExpiryStatus(c.validUntil) === 'expired') warnings.push(`${tag}: expired on ${formatDMY(c.validUntil)}.`);
  });
  d.buyers.forEach((b, i) => { if (!b.name.trim() && (b.country || b.products)) warnings.push(`Buyer ${i + 1}: buyer name is empty — it will not be saved.`); });
  return { errors, warnings };
}

// ─── Excel export ────────────────────────────────────────────────────────────

const certText = (c: CertState) => (c === 'unknown' ? 'No date' : c === 'due-soon' ? 'Due soon' : c === 'expired' ? 'Expired' : 'Valid');
const addSheet = (wb: XLSX.WorkBook, name: string, head: string[], body: (string | number)[][], w: number[]) => {
  const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
  ws['!cols'] = w.map(wch => ({ wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: head.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, ws, name);
};

/** Sheets: Suppliers (with every area score) · ASL · Certificates · Buyers · External Audits. */
export function exportSupplierExcel(rows: SupplierRow[], asl: SupplierRow[], audits: ExtAudit[], filename: string): void {
  const wb = XLSX.utils.book_new();

  addSheet(wb, 'Suppliers', ['SL', 'Supplier ID', 'Supplier', 'Category', 'Supplier Type', 'Contact', 'Mobile', 'Assessment Date', 'Method', 'Assessed By',
    ...AREAS.map(a => `${a.label} (/${a.max})`), 'Total (/100)', 'Result', 'Status', 'Remarks'],
  rows.map((r, i) => [i + 1, r.code, r.name, r.category, r.businessType, r.contact, r.phone, formatDMY(r.assessmentDate), r.method, r.assessedBy,
    ...AREAS.map(a => r.scores[a.key] ?? ''), r.pq.scored ? r.pq.total : '', approvalLabel(r.pq.result), r.status, r.findings]),
  [5, 11, 26, 20, 16, 18, 14, 13, 14, 16, ...AREAS.map(() => 16), 11, 14, 15, 36]);

  addSheet(wb, 'ASL', ['Category', 'Supplier ID', 'Supplier', 'Supplier Type', 'Score', 'Approval', 'Assessed By', 'Assessment Date', 'Certificates'],
    asl.map(r => [r.category, r.code, r.name, r.businessType, r.pq.scored ? r.pq.total : '', r.status, r.assessedBy, formatDMY(r.assessmentDate),
      r.certs.map(x => `${x.c.name}${x.state === 'expired' ? ' (expired)' : ''}`).join(', ')]),
    [22, 11, 26, 16, 8, 13, 16, 14, 40]);

  const certBody: (string | number)[][] = [];
  rows.forEach(r => r.certs.forEach(x => certBody.push([r.code, r.name, x.c.name, x.c.number, x.c.issuedBy, formatDMY(x.c.validUntil), certText(x.state)])));
  addSheet(wb, 'Certificates', ['Supplier ID', 'Supplier', 'Certificate', 'Certificate No.', 'Issued By', 'Valid Until', 'Status'], certBody, [11, 26, 26, 18, 22, 13, 11]);

  const buyerBody: (string | number)[][] = [];
  rows.forEach(r => r.buyers.forEach(b => buyerBody.push([r.code, r.name, b.name, b.country, b.products])));
  addSheet(wb, 'Buyers', ['Supplier ID', 'Supplier', 'Buyer', 'Country', 'Products / Items'], buyerBody, [11, 26, 26, 16, 30]);

  addSheet(wb, 'External Audits', ['Site / Supplier', 'Matched Supplier ID', 'Audit Round', 'Audit Date', 'Auditing Areas', 'Auditors', 'Score', 'Rating', 'Critical', 'Major', 'Minor', 'Total NCs', 'NCs Past Timeline'],
    audits.map(a => [a.site, a.supplierCode, a.round, formatDMY(a.auditDate), a.areas.join(', '), a.auditors, a.score, a.rating, a.critical, a.major, a.minor, a.total, a.pastDue]),
    [28, 14, 14, 12, 14, 26, 8, 18, 9, 8, 8, 10, 14]);

  XLSX.writeFile(wb, `${filename}.xlsx`);
}