// ─────────────────────────────────────────────────────────────────────────────
// auditImport.ts — upload Compliance Audit data by Excel: the template download and the file reader.
//
// One Excel row can carry an AUDITOR and/or a NON-COMPLIANCE. Rows belong to the same audit until the Company Name /
// Site Name / Date of Audit changes — so the audit columns only need to be filled on the first row of an audit, and an
// audit with 3 auditors and 5 NCs is just 5 rows (auditors typed on the first 3).
//   • NC Ref: "A-5" (area letter + point SL — the same as the NC ID prefix), the exact point name, or your OWN text.
//   • NC ID is generated like in the form (A-5-1, A-5-2 …; plain NC-001 … for your own text).
//   • Severity blank → the suggested severity of the point.  Timeline: a date (dd-mm-yyyy).
//   • Auditing Areas: letters, e.g. "A, C, E".   Dates: dd-mm-yyyy.   Pictures: links only (files can be attached with Edit).
// Needs the `exceljs` package (already used by the Excel exports).
// Path: src/components/modules/complianceAudit/auditImport.ts
// ─────────────────────────────────────────────────────────────────────────────

import ExcelJS from 'exceljs';
import { parseImportDate } from '../correctiveAction/capImport';
import {
  AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS, AUDIT_AREAS, CHECKLIST_POINTS, SEVERITY_OPTIONS, ncRefText, findPointByRef, suggestSeverity,
  assignNcIds, blankComplianceAudit, blankAuditorItem, blankCorrectiveActionItem, fixPhone,
} from './types';
import type { ComplianceAuditData, AuditCategory, AuditRound, AuditorItem, CorrectiveActionItem, Severity, ChecklistPoint } from './types';

type Key =
  | 'auditType' | 'companyName' | 'siteName' | 'auditRound' | 'auditDate' | 'siteAddress' | 'siteContactName' | 'siteContactJobTitle'
  | 'sitePhone' | 'siteEmail' | 'remarks' | 'areas' | 'aName' | 'aDesignation' | 'aOrganization'
  | 'ncRef' | 'severity' | 'timeline' | 'details' | 'recommendation' | 'picture' | 'respName' | 'respDesignation';

/** [heading, key, width, required]. */
const COLUMNS: [string, Key, number, boolean][] = [
  ['Audit Type',                      'auditType',          16, false],
  ['Company Name',                    'companyName',        22, true],
  ['Site Name',                       'siteName',           22, true],
  ['Audit Round',                     'auditRound',         14, false],
  ['Date of Audit',                   'auditDate',          14, false],
  ['Site Address',                    'siteAddress',        28, false],
  ['Site Contact Name',               'siteContactName',    18, false],
  ['Job Title',                       'siteContactJobTitle', 16, false],
  ['Site Phone',                      'sitePhone',          15, false],
  ['Site Email',                      'siteEmail',          22, false],
  ['Remarks',                         'remarks',            20, false],
  ['Auditing Areas',                  'areas',              14, false],
  ['Auditor Name',                    'aName',              18, false],
  ['Auditor Designation',             'aDesignation',       18, false],
  ['Auditor Organization',            'aOrganization',      20, false],
  ['NC Ref',                          'ncRef',              26, false],
  ['Severity',                        'severity',           11, false],
  ['Timeline',                        'timeline',           13, false],
  ['Details of Non-Compliance',       'details',            38, false],
  ['Recommendation',                  'recommendation',     34, false],
  ['Non-Compliance Picture (link)',   'picture',            26, false],
  ['Responsible Name',                'respName',           18, false],
  ['Responsible Designation',         'respDesignation',    18, false],
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ঀ-৿]/g, '');
const HEADER_KEYS = new Map<string, Key>();
for (const [h, k] of COLUMNS) HEADER_KEYS.set(norm(h), k);
HEADER_KEYS.set(norm('Date'), 'auditDate'); HEADER_KEYS.set(norm('Audit Date'), 'auditDate');
HEADER_KEYS.set(norm('Job Title of Site Contact'), 'siteContactJobTitle');
HEADER_KEYS.set(norm('Details'), 'details'); HEADER_KEYS.set(norm('Non-Compliance Picture'), 'picture');
HEADER_KEYS.set(norm('NC Ref (standard point)'), 'ncRef'); HEADER_KEYS.set(norm('Timeline (date)'), 'timeline');

const col = (k: Key) => COLUMNS.findIndex(c => c[1] === k) + 1;

/** Downloads the ready-to-fill template (.xlsx). */
export async function downloadAuditTemplate(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Audit Import', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNS.map(([h, , w, req]) => ({ header: req ? `${h} *` : h, width: w }));
  const head = ws.getRow(1);
  head.height = 32;
  head.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Text cells for dates / phone (Excel must not reformat them) and drop-down lists.
  for (let r = 2; r <= 401; r++) {
    [col('auditDate'), col('timeline'), col('sitePhone')].forEach(c => { ws.getCell(r, c).numFmt = '@'; });
    ws.getCell(r, col('auditType')).dataValidation  = { type: 'list', allowBlank: true, formulae: [`"${AUDIT_CATEGORY_OPTIONS.join(',')}"`] };
    ws.getCell(r, col('auditRound')).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${AUDIT_ROUND_OPTIONS.join(',')}"`] };
    ws.getCell(r, col('severity')).dataValidation   = { type: 'list', allowBlank: true, formulae: [`"${SEVERITY_OPTIONS.join(',')}"`] };
  }

  const sample: Partial<Record<Key, string>>[] = [
    { auditType: 'Internal', companyName: 'MG Shirtex Ltd.', siteName: 'Factory Unit 1', auditRound: 'Initial', auditDate: '15-11-2026', siteAddress: 'Gazipur, Dhaka', siteContactName: 'Mr. Rahim', siteContactJobTitle: 'HR Manager', sitePhone: '01711000000', siteEmail: 'hr@example.com', areas: 'A, B',
      aName: 'Karim', aDesignation: 'Auditor', aOrganization: 'Compliance Dept.', ncRef: 'A-5', severity: '', timeline: '30-11-2026', details: 'Union election records not available', recommendation: 'Keep election records', respName: 'Mr. Rahim', respDesignation: 'HR Manager' },
    { aName: 'Salma', aDesignation: 'Co-auditor', aOrganization: 'Compliance Dept.', ncRef: 'B-36', severity: 'Major', timeline: '30-11-2026', details: 'Fire exit blocked by cartons', recommendation: 'Clear the exit and add a daily check' },
    { ncRef: 'Own wording for a point that is not in the checklist', severity: 'Minor', details: 'Example of an NC with your own NC Ref' },
  ];
  // Written into rows 2-4 explicitly (addRow would append AFTER the pre-formatted rows, i.e. at row 402).
  sample.forEach((row, i) => {
    COLUMNS.forEach(([, k], c) => {
      const cell = ws.getCell(i + 2, c + 1);
      cell.value = row[k] ?? '';
      cell.font = { italic: true, color: { argb: 'FF64748B' } };
    });
  });

  const help = wb.addWorksheet('How to fill');
  help.columns = [{ width: 120 }];
  [
    'UPLOAD COMPLIANCE AUDIT DATA BY EXCEL — how to fill the "Audit Import" sheet',
    '',
    '1. One row = one auditor and/or one non-compliance (NC). The 3 grey sample rows can be deleted or overwritten.',
    '2. Headings marked * are required: Company Name, Site Name (on the first row of each audit).',
    '3. Rows belong to the SAME audit until the Company Name, Site Name or Date of Audit changes. Leave the audit columns blank on the following rows of that audit.',
    '4. Auditors: fill Auditor Name / Designation / Organization on as many rows as the audit has auditors (one per row).',
    '5. NC Ref: area letter + point number, e.g. A-5 or B-36 (Fire Safety) — the area letter and point number shown in the checklist / NC ID (A-5-1). Point numbers run on across areas (A 1-33, B 34-49 …). You can also write the exact point name, or your OWN text.',
    '   NC ID is created automatically: A-5-1, A-5-2 … for standard points; NC-001, NC-002 … for your own text.',
    `6. Severity: ${SEVERITY_OPTIONS.join(', ')} (blank = the suggested severity of the point).`,
    '7. Audit Type: Internal or External for Supplier (blank = Internal).  Audit Round: ' + AUDIT_ROUND_OPTIONS.join(', ') + ' (blank = Initial).',
    '8. Auditing Areas: area letters, e.g. "A, C, E".   ' + AUDIT_AREAS.map(a => `${a.code} = ${a.name}`).join('; '),
    '9. Dates (Date of Audit, Timeline): dd-mm-yyyy, e.g. 15-11-2026.',
    '10. Non-Compliance Picture: a link only (Drive / web). A picture file can be attached later with Edit.',
    '11. An audit with the same Company + Site + Date of Audit + Audit Round that is already saved (or appears twice in the file) is skipped — never overwritten.',
    '12. Up to 400 rows per upload.',
  ].forEach((t, i) => { const row = help.addRow([t]); if (i === 0) row.font = { bold: true, size: 12 }; });

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'Compliance_Audit_Import_Template.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Reading ─────────────────────────────────────────────────────────────────

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as unknown as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map(t => t.text).join('').trim();
    if ('result' in o) return cellText(o.result as ExcelJS.CellValue);
    if (typeof o.text === 'string') return o.text.trim();
    if (typeof o.hyperlink === 'string') return o.hyperlink.trim();
    return '';
  }
  return String(v).trim();
}

/** Key that identifies an audit: company | site | date | round (lower case). */
export const auditKey = (company: string, site: string, isoDate: string, round: string): string =>
  [company, site, isoDate, round].map(s => String(s ?? '').trim().toLowerCase()).join('|');

/** NC Ref cell → a standard point ("A-5", "A5", exact point name, full NC ref text) or the user's own text. */
function resolveNcRef(text: string): { ref: string; point?: ChecklistPoint; badCode?: boolean } {
  const t = text.trim();
  if (!t) return { ref: '' };
  const m = /^([A-Fa-f])[\s\-.:_]*(\d{1,3})$/.exec(t);
  if (m) {
    const p = CHECKLIST_POINTS.find(x => x.area === m[1].toUpperCase() && x.sl === Number(m[2]));
    if (p) return { ref: ncRefText(p), point: p };
  }
  const exact = findPointByRef(t);
  if (exact) return { ref: t, point: exact };
  const byName = CHECKLIST_POINTS.filter(x => x.point.trim().toLowerCase() === t.toLowerCase());
  if (byName.length === 1) return { ref: ncRefText(byName[0]), point: byName[0] };
  return { ref: t, badCode: m !== null };                    // the user's own wording (or a code that is not in the checklist)
}

export interface ImportAudit {
  /** Excel row where this audit starts. */
  row: number;
  data: ComplianceAuditData;
  /** Why this audit will NOT be imported ('' = ready). */
  problem: string;
}
export interface AuditParse { audits: ImportAudit[]; fatal: string }

const MAX_ROWS = 400;

/** Reads an .xlsx and validates it. existingKeys = auditKey(...) of the audits already saved. */
export async function parseAuditExcel(file: File, existingKeys: Set<string>, base: ComplianceAuditData): Promise<AuditParse> {
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(await file.arrayBuffer()); }
  catch { return { audits: [], fatal: 'This is not a readable .xlsx file. Use the template (Excel 2007+ format).' }; }
  const ws = wb.getWorksheet('Audit Import') ?? wb.worksheets[0];
  if (!ws) return { audits: [], fatal: 'The workbook has no sheet.' };

  const colKey = new Map<number, Key>();
  let headRow = 0;
  for (let r = 1; r <= Math.min(5, ws.rowCount) && !headRow; r++) {
    const found = new Map<number, Key>();
    ws.getRow(r).eachCell((cell, c) => { const k = HEADER_KEYS.get(norm(cellText(cell.value))); if (k) found.set(c, k); });
    const keys = [...found.values()];
    if (keys.includes('siteName') && keys.includes('companyName')) { headRow = r; found.forEach((k, c) => colKey.set(c, k)); }
  }
  if (!headRow) return { audits: [], fatal: 'Headings not found. Download the template and keep its first row (it needs "Company Name" and "Site Name").' };

  interface Draft { row: number; d: ComplianceAuditData; auditors: AuditorItem[]; ncs: CorrectiveActionItem[]; problems: string[]; dateText: string }
  const drafts: Draft[] = [];
  let cur: Draft | null = null;
  let rowsRead = 0;

  const pick = <T extends string>(text: string, options: readonly T[], fallback: T): T | null => {
    if (!text) return fallback;
    return options.find(o => norm(o) === norm(text)) ?? options.find(o => norm(o).startsWith(norm(text))) ?? null;
  };

  for (let r = headRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const v: Partial<Record<Key, string>> = {};
    colKey.forEach((k, c) => { v[k] = cellText(row.getCell(c).value); });
    if (Object.values(v).every(x => !x)) continue;
    if (++rowsRead > MAX_ROWS) return { audits: finish(drafts, existingKeys), fatal: `More than ${MAX_ROWS} rows — split the file and upload it in parts.` };

    // Does this row start a new audit? (Company / Site / Date filled and different from the current audit.)
    const dateIso = parseImportDate(v.auditDate ?? '');
    const differs = (a: string | undefined, b: string) => Boolean(a && a.trim().toLowerCase() !== b.trim().toLowerCase());
    const startsNew = !cur
      || differs(v.siteName, cur.d.siteName) || differs(v.companyName, cur.d.companyName)
      || (Boolean(v.auditDate) && dateIso !== null && dateIso !== cur.d.auditDate);

    if (startsNew) {
      const d: ComplianceAuditData = { ...blankComplianceAudit(), factoryName: base.factoryName, factoryAddress: base.factoryAddress, date: base.date };
      cur = { row: r, d, auditors: [], ncs: [], problems: [], dateText: v.auditDate ?? '' };
      drafts.push(cur);
    }
    const a = cur as Draft;
    const d = a.d;

    // Audit columns: take the value when the audit does not have it yet.
    const fill = (k: 'companyName' | 'siteName' | 'siteAddress' | 'siteContactName' | 'siteContactJobTitle' | 'siteEmail' | 'remarks') => { if (v[k] && !d[k]) d[k] = v[k]!; };
    (['companyName', 'siteName', 'siteAddress', 'siteContactName', 'siteContactJobTitle', 'siteEmail', 'remarks'] as const).forEach(fill);
    if (v.sitePhone && !d.sitePhone) d.sitePhone = fixPhone(v.sitePhone);
    if (v.auditDate && !d.auditDate) {
      if (dateIso === null || dateIso === '') a.problems.push(`Row ${r}: Date of Audit “${v.auditDate}” is not a valid date`);
      else d.auditDate = dateIso;
    }
    if (v.auditType) { const t = pick<AuditCategory>(v.auditType, AUDIT_CATEGORY_OPTIONS, 'Internal'); if (t) d.auditType = t; else a.problems.push(`Row ${r}: Audit Type “${v.auditType}” is not Internal / External for Supplier`); }
    if (v.auditRound) { const t = pick<AuditRound>(v.auditRound, AUDIT_ROUND_OPTIONS, 'Initial'); if (t) d.auditRound = t; else a.problems.push(`Row ${r}: Audit Round “${v.auditRound}” is not valid`); }
    if (v.areas) {
      const letters = Array.from(new Set((v.areas.toUpperCase().match(/[A-F]/g) ?? [])));
      d.auditingAreas = AUDIT_AREAS.filter(x => letters.includes(x.code)).map(x => x.label);
    }

    // Auditor on this row
    if (v.aName || v.aDesignation || v.aOrganization) {
      a.auditors.push({ ...blankAuditorItem(a.auditors.length + 1), name: v.aName ?? '', designation: v.aDesignation ?? '', organization: v.aOrganization ?? '' });
    }

    // Non-compliance on this row
    if (v.ncRef || v.severity || v.timeline || v.details || v.recommendation || v.picture || v.respName || v.respDesignation) {
      const { ref, point, badCode } = resolveNcRef(v.ncRef ?? '');
      if (badCode) a.problems.push(`Row ${r}: NC Ref “${ref}” is not a point in the checklist (use e.g. A-5, B-36, or write your own text)`);
      const sev = v.severity ? SEVERITY_OPTIONS.find(o => norm(o) === norm(v.severity!)) : (point ? suggestSeverity(point) : undefined);
      if (v.severity && !sev) a.problems.push(`Row ${r}: Severity “${v.severity}” is not Minor / Major / Critical`);
      const tl = parseImportDate(v.timeline ?? '');
      if (tl === null) a.problems.push(`Row ${r}: Timeline “${v.timeline}” is not a valid date`);
      a.ncs.push({
        ...blankCorrectiveActionItem(a.ncs.length + 1),
        ncRef: ref, severity: (sev ?? '') as Severity | '', timeline: tl || '',
        detailsOfNonCompliance: v.details ?? '', preventiveCorrectiveActions: v.recommendation ?? '', nonCompliancePictureLink: v.picture ?? '',
        responsiblePersonName: v.respName ?? '', agreedByManagement: v.respDesignation ?? '',
      });
    }
  }
  if (!drafts.length) return { audits: [], fatal: 'No data rows found under the headings.' };
  return { audits: finish(drafts, existingKeys), fatal: '' };

  function finish(list: Draft[], existing: Set<string>): ImportAudit[] {
    const seen = new Set(existing);
    return list.map(a => {
      const d = a.d;
      d.auditors = a.auditors.length ? a.auditors : [blankAuditorItem(1)];
      d.correctiveActions = a.ncs.length ? assignNcIds(a.ncs) : [blankCorrectiveActionItem(1)];
      const problems = [...a.problems];
      if (!d.companyName.trim()) problems.push('Company Name is empty');
      if (!d.siteName.trim()) problems.push('Site Name is empty');
      if (d.auditDate && d.correctiveActions.some(c => c.timeline && c.timeline < d.auditDate)) problems.push('A Timeline is before the Date of Audit');
      if (!problems.length) {
        const key = auditKey(d.companyName, d.siteName, d.auditDate, d.auditRound);
        if (seen.has(key)) problems.push('This audit already exists (skipped)'); else seen.add(key);
      }
      return { row: a.row, data: d, problem: problems.join('; ') };
    });
  }
}