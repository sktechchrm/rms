// ─────────────────────────────────────────────────────────────────────────────
// Compliance Audit — types, standards list, shared Statement filters
// Path: src/components/modules/complianceAudit/types.ts
//
// ONE module, TWO audit types ('Internal' | 'External for Supplier').
// Auditing Areas: the 4 sections A–D of the Complete 100-point Code of Conduct checklist.
// NC Ref = a checklist point (+ its standard principles); NC ID is generated from it.
// NC items carry NC ID + NC Ref (the old "Non-Compliance Number" is read as NC ID).
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';

export type AuditCategory = 'Internal' | 'External for Supplier';
export const AUDIT_CATEGORY_OPTIONS: AuditCategory[] = ['Internal', 'External for Supplier'];

export type AuditRound = 'Initial' | '1st Follow-Up' | '2nd Follow-Up' | '3rd Follow-Up' | '4th Follow-Up';
export const AUDIT_ROUND_OPTIONS: AuditRound[] = ['Initial', '1st Follow-Up', '2nd Follow-Up', '3rd Follow-Up', '4th Follow-Up'];

// ─── Auditing areas = the 4 sections (A–D) of the Complete 100-point checklist ──

export interface ChecklistPoint { sl: number; point: string; principle: string; area: string; }
interface ChecklistArea { code: string; name: string; points: [number, string, string][]; }

// [SL, Code of Conduct Point, Principle No. of Standard]
export const CHECKLIST_AREAS: ChecklistArea[] = [
  { code: 'A', name: "Legal compliance, management and worker rights", points: [
    [1, "Legal Compliance", "BW: Cross-cutting; BSCI PA1; WRAP P1; ETI applicable clauses"],
    [2, "Social Compliance Management System", "BSCI PA1; SA8000 Management System; ISO 9001/14001/45001"],
    [3, "Management Commitment", "BSCI PA1; SA8000 Management System; ISO Clause 5"],
    [4, "Worker Involvement", "BW C4/C7; ILO C87/C98/C155; BSCI PA2; SA8000"],
    [5, "Freedom of Association", "BW C4; ILO C87; BSCI PA3; WRAP P6; ETI C2"],
    [6, "Union Operations and Protection of Representatives", "BW C4; ILO C87/C98; BSCI PA3; ETI C2"],
    [7, "Collective Bargaining", "BW C4; ILO C98; BSCI PA3; WRAP P6; ETI C2"],
    [8, "No Child Labour", "BW C1; ILO C138/C182; BSCI PA8; WRAP P3; ETI C4"],
    [9, "Young Worker Protection", "BW C1; ILO C138/C182; BSCI PA9; WRAP P3; ETI C4"],
    [10, "No Forced Labour", "BW C3; ILO C29/C105/P029; BSCI PA11; WRAP P2; ETI C1"],
    [11, "No Human Trafficking", "BW C3; ILO C29/P029; BSCI PA11; WRAP P2; ETI C1"],
    [12, "No Bonded Labour", "BW C3; ILO C29/C105; BSCI PA11; WRAP P2; ETI C1"],
    [13, "No Prison Labour or Coercion", "BW C3; ILO C29/C105; BSCI PA11; WRAP P2"],
    [14, "No Discrimination", "BW C2; ILO C111; BSCI PA4; WRAP P7; ETI C7"],
    [15, "Equal Remuneration", "BW C2/C5; ILO C100; BSCI PA4/PA5; ETI C5/C7"],
    [16, "No Harassment or Abuse", "BW C2/C6; ILO C190; BSCI PA4; WRAP P4; ETI C9"],
    [17, "Fair Recruitment", "BW C3/C6; ILO C29/P029; BSCI PA10/PA11; SA8000"],
    [18, "Employment Contracts", "BW C6; BSCI PA10; WRAP P1; ETI C8"],
    [19, "Accurate Personnel Records", "BW C6; BSCI PA1/PA10; WRAP P1; ETI C8"],
    [20, "Wages and Benefits", "BW C5; ILO C95/C131; BSCI PA5; WRAP P5; ETI C5"],
    [21, "Minimum Wage Compliance", "BW C5; ILO C131; applicable Bangladesh minimum-wage orders; BSCI PA5; WRAP P5"],
    [22, "Overtime Payment", "BW C5/C8; applicable Bangladesh labour law; BSCI PA5/PA6; WRAP P5/P6; ETI C5/C6"],
    [23, "Timely Wage Payment", "BW C5; ILO C95; BSCI PA5; WRAP P5; ETI C5"],
    [24, "Wage Information, Payslips and Deductions", "BW C5; ILO C95; BSCI PA5; WRAP P5; ETI C5"],
    [25, "Premium Pay and Other Benefits", "BW C5; applicable Bangladesh labour law; BSCI PA5; WRAP P5"],
    [26, "Working Hours", "BW C8; ILO C1, where applicable; BSCI PA6; WRAP P6; ETI C6"],
    [27, "Weekly Rest and Holidays", "BW C8; ILO C14, where applicable; BSCI PA6; WRAP P6; ETI C6"],
    [28, "Leave Entitlements", "BW C5/C8; applicable Bangladesh labour law; BSCI PA5/PA6; ETI C5/C6"],
    [29, "Maternity Protection", "BW C2/C5/C6; ILO C183 as a reference; applicable Bangladesh labour law"],
    [30, "Social Security and Statutory Benefits", "BW C5; applicable Bangladesh labour law; BSCI PA5; WRAP P5"],
    [31, "Termination and Final Settlement", "BW C6; ILO C158 as a reference; applicable Bangladesh labour law; BSCI PA10; ETI C8"],
    [32, "Grievance Mechanism", "BW C6; ILO C190 as applicable; BSCI PA2; SA8000 Management System"],
    [33, "Disciplinary Procedure", "BW C6; applicable Bangladesh labour law; WRAP P4; ETI C9"],
  ] },
  { code: 'B', name: "Occupational health and safety", points: [
    [34, "Occupational Health and Safety Management", "BW C7; ILO C155/C187; BSCI PA7; WRAP P8; ETI C3; ISO 45001"],
    [35, "Hazard Identification and Risk Assessment", "BW C7; ILO C155/C187; BSCI PA7; ISO 45001 Clauses 6 and 8"],
    [36, "Fire Safety and Firefighting Equipment", "BW C7; ILO C155; BSCI PA7; WRAP P8; ETI C3"],
    [37, "Building and Structural Safety", "BW C7; ILO C155; BSCI PA7; WRAP P8; applicable building laws"],
    [38, "Electrical Safety", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
    [39, "Machinery Safety and Machine Guards", "BW C7; ILO C119; BSCI PA7; WRAP P8; ISO 45001"],
    [40, "Chemical Management and SDS", "BW C7; ILO C170; BSCI PA7/PA12; WRAP P8/P9; ISO 14001"],
    [41, "Personal Protective Equipment", "BW C7; ILO C155; BSCI PA7; WRAP P8; ISO 45001"],
    [42, "First Aid and Medical Facilities", "BW C7; ILO C161; BSCI PA7; WRAP P8"],
    [43, "Drinking Water and Sanitation", "BW C7; ILO C155; BSCI PA7; WRAP P8"],
    [44, "Ventilation, Lighting and Thermal Conditions", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
    [45, "Ergonomics and Workplace Welfare", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
    [46, "Emergency Preparedness and Evacuation", "BW C7; ILO C155/C187; BSCI PA7; WRAP P8; ISO 45001"],
    [47, "Worker Accommodation, Where Provided", "BW C7; applicable ILO guidance and national law; BSCI PA7; WRAP P8"],
    [48, "Occupational Accident and Incident Reporting", "BW C7; ILO C155/C187; BSCI PA7; ISO 45001"],
    [49, "Worker Consultation on Safety", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
  ] },
  { code: 'C', name: "Environment, ethics and responsible business", points: [
    [50, "Environmental Management", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [51, "Waste Segregation and Disposal", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [52, "Wastewater and ETP Management", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [53, "Air Emissions and Energy Management", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001/50001"],
    [54, "Water Management and Conservation", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [55, "Business Ethics", "BSCI PA13; WRAP P10; SMETA Business Ethics Pillar"],
    [56, "Anti-Bribery and Corruption", "BSCI PA13; WRAP P10; SMETA Business Ethics Pillar; ISO 37301"],
    [57, "Accurate Records and Transparency", "BSCI PA1/PA13; WRAP P1/P10/P11; buyer requirements"],
    [58, "Subcontracting and Supply-Chain Control", "BSCI PA1; WRAP P1; ETI C8; buyer requirements"],
    [59, "Confidentiality and Data Protection", "Applicable privacy laws; SA8000 privacy requirements; buyer requirements"],
    [60, "Business Continuity and Risk Management", "ISO 9001/14001/45001; applicable CTPAT risk-assessment criteria"],
    [61, "Worker Training and Awareness", "BSCI PA1/PA7; WRAP P8; ETI C3; ISO 45001 Clause 7"],
    [62, "Monitoring and Corrective Action", "BSCI PA1; SMETA corrective-action process; ISO Clauses 9\u201310"],
    [63, "Document Control and Record Retention", "BSCI PA1; ISO 9001/14001/45001 Clause 7.5"],
    [64, "Continual Improvement and Management Review", "BSCI PA1; SA8000 Management System; ISO Clauses 9\u201310"],
    [65, "Pregnancy and Nursing Worker Protection", "BW C2/C7; ILO C183 as a reference; applicable Bangladesh labour law"],
    [66, "Workplace Violence and Harassment Prevention", "BW C2/C6; ILO C190; WRAP P4; buyer requirements"],
    [67, "Recruitment Fees and Worker-Paid Costs", "BW C3/C6; ILO C29/P029; BSCI PA11; SA8000"],
    [68, "Responsible Purchasing Practices", "OECD Responsible Business Conduct Guidance; buyer requirements; applicable BSCI supply-chain expectations"],
    [69, "Product Safety and Restricted Substances", "Buyer requirements; ZDHC; OEKO-TEX requirements where adopted"],
    [70, "Traceability and Material Claims", "GOTS; GRS; RCS; OCS, where applicable; buyer requirements"],
    [71, "Energy, Carbon and Climate Reporting", "ISO 14001/50001; buyer environmental requirements"],
    [72, "Supplier Evaluation and Monitoring", "BSCI PA1; WRAP P1; ISO 9001 supplier-control requirements"],
    [73, "Audit Integrity and Non-Retaliation", "BSCI PA1/PA2; SA8000 Management System; buyer requirements"],
  ] },
  { code: 'D', name: "CTPAT \u2014 Supply-chain and cargo security", points: [
    [74, "Supply Chain Security Risk Assessment", "CTPAT \u2014 Risk Assessment; WRAP P12"],
    [75, "Written Security Procedures and Responsibilities", "CTPAT \u2014 Security Management; WRAP P12"],
    [76, "Business Partner Security Verification", "CTPAT \u2014 Business Partners"],
    [77, "Container and Trailer Inspection", "CTPAT \u2014 Conveyance and Instruments of International Traffic Security"],
    [78, "Container Seal Control and Seal Verification", "CTPAT \u2014 Procedural Security; applicable seal requirements"],
    [79, "Container Loading Supervision and Documentation", "CTPAT \u2014 Procedural Security"],
    [80, "Physical Security of Buildings and Perimeters", "CTPAT \u2014 Physical Security; WRAP P12"],
    [81, "Access Control for Employees and Visitors", "CTPAT \u2014 Physical Access Controls"],
    [82, "Visitor Identification and Escort", "CTPAT \u2014 Physical Access Controls"],
    [83, "Employee Identification and Access Privileges", "CTPAT \u2014 Physical Access Controls"],
    [84, "CCTV Coverage and Footage Retention", "CTPAT \u2014 Physical Security; WRAP P12"],
    [85, "Security of Cargo Handling and Storage Areas", "CTPAT \u2014 Physical Security and Procedural Security"],
    [86, "Protection Against Unauthorized Cargo or Contraband", "CTPAT \u2014 Procedural Security"],
    [87, "Shipping Documents and Manifest Accuracy", "CTPAT \u2014 Procedural Security"],
    [88, "Export Shipment Reconciliation", "CTPAT \u2014 Procedural Security"],
    [89, "Security of Empty Containers and Trailers", "CTPAT \u2014 Conveyance and Instruments of International Traffic Security"],
    [90, "Security Awareness Training", "CTPAT \u2014 Security Training and Threat Awareness"],
    [91, "Employee Screening and Personnel Security", "CTPAT \u2014 Personnel Security"],
    [92, "Reporting and Investigating Security Incidents", "CTPAT \u2014 Security Management and Incident Reporting"],
    [93, "Cybersecurity and Protection of Information Systems", "CTPAT \u2014 Cybersecurity"],
    [94, "Security of Keys, Locks, Seals and Access Devices", "CTPAT \u2014 Physical Access Controls and Procedural Security"],
    [95, "Security of Loading Docks and Dispatch Areas", "CTPAT \u2014 Physical Security and Procedural Security"],
    [96, "Security of Subcontractors and Logistics Providers", "CTPAT \u2014 Business Partners"],
    [97, "Security Corrective Action and Periodic Review", "CTPAT \u2014 Risk Assessment and Security Management"],
    [98, "Container/Trailer Tampering Detection and Escalation", "CTPAT \u2014 Conveyance Security and Procedural Security"],
    [99, "Security Incident Response and Emergency Communication", "CTPAT \u2014 Security Management; Incident Reporting"],
    [100, "Security Programme Review and Continuous Improvement", "CTPAT \u2014 Risk Assessment and Security Management; WRAP P12"],
  ] },
];

export const AREA_CODES = CHECKLIST_AREAS.map(a => a.code);
/** Stored value of an Auditing Area, e.g. "A. Legal compliance, management and worker rights". */
export const areaLabel = (a: { code: string; name: string }) => `${a.code}. ${a.name}`;
export const AUDIT_AREAS = CHECKLIST_AREAS.map(a => ({ code: a.code, name: a.name, label: areaLabel(a), count: a.points.length }));
/** Letter (A–D) of a stored Auditing Area value ('' if it is not one of the four). */
export const areaCodeOf = (value: string) => /^([A-D])\. /.exec(value)?.[1] ?? '';

export const CHECKLIST_POINTS: ChecklistPoint[] = CHECKLIST_AREAS.flatMap(a =>
  a.points.map(([sl, point, principle]) => ({ sl, point, principle, area: a.code })));

/** Stored NC Ref text: "<Code of Conduct Point> — <Principle No. of Standard>". */
export const ncRefText = (p: ChecklistPoint) => `${p.point} \u2014 ${p.principle}`;
const POINT_BY_REF = new Map(CHECKLIST_POINTS.map(p => [ncRefText(p), p]));
export const findPointByRef = (ncRef: string) => POINT_BY_REF.get(ncRef);

// Compatibility exports (grouped list used by older code): one group per area.
export const AREA_GROUPS: { standard: string; items: string[] }[] =
  CHECKLIST_AREAS.map(a => ({ standard: areaLabel(a), items: a.points.map(p => p[1]) }));
export const areaValue = (standard: string, item: string) => (standard ? `${standard}: ${item}` : item);
export const ALL_AREA_VALUES: string[] = AUDIT_AREAS.map(a => a.label);

// ─── Items ───────────────────────────────────────────────────────────────────

export interface AuditorItem { slNo: number; name: string; designation: string; organization: string; }
export const blankAuditorItem = (slNo: number): AuditorItem => ({ slNo, name: '', designation: '', organization: '' });

export interface CorrectiveActionItem {
  slNo: number;
  ncId: string;
  ncRef: string;
  detailsOfNonCompliance: string;
  nonCompliancePictureLink: string;
  preventiveCorrectiveActions: string;
  timeline: string;
  agreedByManagement: string;
  responsiblePersonName: string;
}
export const blankCorrectiveActionItem = (slNo: number): CorrectiveActionItem => ({
  slNo, ncId: `NC-${String(slNo).padStart(3, '0')}`, ncRef: '', detailsOfNonCompliance: '', nonCompliancePictureLink: '',
  preventiveCorrectiveActions: '', timeline: '', agreedByManagement: '', responsiblePersonName: '',
});


// ─── Timeline ────────────────────────────────────────────────────────────────
// The form stores a plain DATE (yyyy-mm-dd). The report shows both: "dd-mm-yyyy | N days",
// where N = days from the audit date (submission date when no audit date is set).

const CRITICAL_POINTS = new Set([8, 9, 10, 11, 12, 13, 16, 36, 37, 38, 46]); // child/forced labour, abuse, fire, structure, electrical, evacuation
const AREA_DAYS: Record<string, number> = { A: 60, B: 30, C: 90, D: 45 };
/** Suggested correction period (days) for a checklist point: critical points 15, otherwise by area. */
export const suggestedDays = (p: ChecklistPoint): number => (CRITICAL_POINTS.has(p.sl) ? 15 : AREA_DAYS[p.area] ?? 30);

const isoParts = (iso: string) => /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
const toIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** ISO date + n days → ISO date ('' if the input is not valid). */
export function addDaysIso(iso: string, n: number): string {
  const m = isoParts(iso);
  return m && Number.isFinite(n) ? toIsoDate(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n)) : '';
}
/** Whole days from one ISO date to another (null if either is invalid). */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const a = isoParts(fromIso), b = isoParts(toIso);
  if (!a || !b) return null;
  return Math.round((Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86400000);
}
/** Stored timeline → ISO date. Also reads older values: "dd-mm-yyyy" and "30 days" (needs a base date). */
export function timelineIso(t: string, baseIso: string): string {
  const s = (t ?? '').trim();
  if (isoParts(s)) return s.slice(0, 10);
  const d = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (d) return `${d[3]}-${d[2]}-${d[1]}`;
  const n = /^(\d+)\s*days?$/i.exec(s);
  return n && baseIso ? addDaysIso(baseIso, Number(n[1])) : '';
}
/** Report text: "dd-mm-yyyy | N days" (free text from old records is shown as it was typed). */
export function timelineDisplay(t: string, auditIso: string, submissionIso: string): string {
  const base = auditIso || submissionIso;
  const iso = timelineIso(t, base);
  if (!iso) return (t ?? '').trim();
  const days = daysBetween(base, iso);
  return days === null ? formatDMY(iso) : `${formatDMY(iso)} | ${days} days`;
}

/**
 * NC ID = <Area A–D>-<SL of the Code of Conduct point>-<running no. for that point>,
 * e.g. the 1st NC on point 5 (Freedom of Association) → "A-5-1", the 2nd → "A-5-2".
 * An NC whose NC Ref is not (yet) a checklist point keeps its current NC ID.
 */
export function assignNcIds(items: CorrectiveActionItem[]): CorrectiveActionItem[] {
  const seen: Record<string, number> = {};
  return items.map(c => {
    const p = findPointByRef(c.ncRef);
    if (!p) return c;
    const key = `${p.area}-${p.sl}`;
    seen[key] = (seen[key] ?? 0) + 1;
    const ncId = `${key}-${seen[key]}`;
    return ncId === c.ncId ? c : { ...c, ncId };
  });
}

export interface ComplianceAuditData {
  auditType: AuditCategory;
  companyName: string;
  siteName: string;
  siteAddress: string;
  siteContactName: string;
  siteContactJobTitle: string;
  sitePhone: string;
  siteEmail: string;
  auditRound: AuditRound;
  auditingAreas: string[];
  auditDate: string;
  auditors: AuditorItem[];
  correctiveActions: CorrectiveActionItem[];
  remarks: string;
  date: string;
  factoryName: string;
  factoryAddress: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}

export function blankComplianceAudit(): ComplianceAuditData {
  return {
    auditType: 'Internal', companyName: '', siteName: '', siteAddress: '',
    siteContactName: '', siteContactJobTitle: '', sitePhone: '', siteEmail: '',
    auditRound: 'Initial', auditingAreas: [], auditDate: '',
    auditors: [blankAuditorItem(1)], correctiveActions: [blankCorrectiveActionItem(1)],
    remarks: '', date: todayIso(), factoryName: '', factoryAddress: '',
  };
}
export const INITIAL_COMPLIANCE_AUDIT_STATE: ComplianceAuditData = blankComplianceAudit();

export function resizeAuditors(current: AuditorItem[], target: number): AuditorItem[] {
  return Array.from({ length: Math.max(1, target) }, (_, i) => (current[i] ? { ...current[i], slNo: i + 1 } : blankAuditorItem(i + 1)));
}
export function resizeCorrectiveActions(current: CorrectiveActionItem[], target: number): CorrectiveActionItem[] {
  return assignNcIds(Array.from({ length: Math.max(1, target) }, (_, i) => (current[i] ? { ...current[i], slNo: i + 1 } : blankCorrectiveActionItem(i + 1))));
}

function parseArray(raw: unknown): Record<string, unknown>[] {
  try { const a = JSON.parse(String(raw ?? '[]')); return Array.isArray(a) ? a : []; } catch { return []; }
}
export function parseNcItems(raw: unknown): CorrectiveActionItem[] {
  return parseArray(raw).map((c, i) => ({
    slNo: Number(c.slNo ?? i + 1),
    ncId: String(c.ncId ?? c.nonComplianceNumber ?? ''),
    ncRef: String(c.ncRef ?? ''),
    detailsOfNonCompliance: String(c.detailsOfNonCompliance ?? ''),
    nonCompliancePictureLink: String(c.nonCompliancePictureLink ?? ''),
    preventiveCorrectiveActions: String(c.preventiveCorrectiveActions ?? ''),
    timeline: String(c.timeline ?? ''),
    agreedByManagement: String(c.agreedByManagement ?? ''),
    responsiblePersonName: String(c.responsiblePersonName ?? ''),
  }));
}
export function parseAuditors(raw: unknown): AuditorItem[] {
  return parseArray(raw).map((a, i) => ({
    slNo: Number(a.slNo ?? i + 1), name: String(a.name ?? ''), designation: String(a.designation ?? ''), organization: String(a.organization ?? ''),
  }));
}
export function parseAreas(raw: unknown): string[] {
  try { const a = JSON.parse(String(raw ?? '[]')); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}

// ─── Entries + shared filters ────────────────────────────────────────────────

export interface AuditEntry { rec: DbRecord; ncCount: number; }
export const buildAuditEntries = (records: DbRecord[]): AuditEntry[] =>
  records.map(rec => ({ rec, ncCount: parseNcItems(rec.correctiveActionsJson).length }));

export type AuditSortField = 'auditDate' | 'siteName' | '';

export interface AuditFilters {
  search: string;
  types: string[];
  round: string;
  dateFrom: string;
  dateTo: string;
  columns: Record<string, string[]>;
  sort: { field: AuditSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  search: '', types: [], round: '', dateFrom: '', dateTo: '', columns: {}, sort: { field: '', dir: 'asc' },
};
export function countActiveAuditFilters(f: AuditFilters): number {
  const cols = Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
  return [f.search.trim(), f.types.length > 0, f.round, f.dateFrom, f.dateTo].filter(Boolean).length + cols;
}
export const hasActiveAuditFilters = (f: AuditFilters) => countActiveAuditFilters(f) > 0;

export const BLANK_VALUE = '(Blank)';
export function auditColumnValue(rec: DbRecord, field: string): string {
  const raw = String((rec as unknown as Record<string, unknown>)[field] ?? '').trim();
  return (field === 'auditDate' ? raw.slice(0, 10) : raw) || BLANK_VALUE;
}

export function filterAuditEntries(entries: AuditEntry[], f: AuditFilters): AuditEntry[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = entries.filter(({ rec }) => {
    const d = String(rec.auditDate ?? '').slice(0, 10);
    if (f.dateFrom && (!d || d < f.dateFrom)) return false;
    if (f.dateTo && (!d || d > f.dateTo)) return false;
    if (f.types.length && !f.types.includes(String(rec.auditType ?? ''))) return false;
    if (f.round && String(rec.auditRound ?? '') !== f.round) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) {
      if (sel.length && !sel.includes(auditColumnValue(rec, field))) return false;
    }
    if (words.length) {
      const nc = parseNcItems(rec.correctiveActionsJson).map(c => `${c.ncId} ${c.ncRef} ${c.detailsOfNonCompliance}`).join(' ');
      const hay = [rec.siteName, rec.companyName, rec.siteContactName, nc, rec.auditingAreasJson].map(v => String(v ?? '').toLowerCase()).join(' ');
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return result;
  const mult = dir === 'asc' ? 1 : -1;
  const key = (e: AuditEntry) => (field === 'auditDate' ? String(e.rec.auditDate ?? '').slice(0, 10) : String(e.rec.siteName ?? '').trim());
  return [...result].sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (!ka && !kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return mult * ka.localeCompare(kb, undefined, { numeric: true, sensitivity: 'base' });
  });
}