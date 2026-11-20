// ─────────────────────────────────────────────────────────────────────────────
// capImport.ts — upload CAP data by Excel: the template download and the file reader.
//
// One Excel row = one NC entry. The audit columns (Audited by, Audit Date, Audit Days) only need to be filled on
// the first row of an audit — blank audit cells copy the row above, so one audit with many NCs is easy to type.
// Dates may be dd-mm-yyyy, yyyy-mm-dd, dd/mm/yyyy or a real Excel date. Evidence 1–3 are optional links
// (pictures/files cannot travel inside the Excel — attach them later with Edit, or paste Drive links here).
// Needs the `exceljs` package (already used by capExcel.ts).
// Path: src/components/modules/correctiveAction/capImport.ts
// ─────────────────────────────────────────────────────────────────────────────

import ExcelJS from 'exceljs';
import { CAP_STATUS_OPTIONS, INITIAL_CORRECTIVE_ACTION_STATE, addDaysIso, auditDaysOf } from './types';
import type { CorrectiveActionData } from './types';

/** Template columns: [header, record field, width, required]. */
const COLUMNS: [string, keyof CorrectiveActionData, number, boolean][] = [
  ['Audited by',              'auditConductedBy',  18, true],
  ['Audit Date',              'auditDate',         14, true],
  ['Audit Days (0-5)',        'auditDays',         12, false],
  ['NC ID',                   'ncId',              11, true],
  ['NC Reference',            'ncReference',       18, false],
  ['NC Category / Keyword',   'ncCategory',        20, false],
  ['NC Description',          'ncDescription',     40, true],
  ['Root Cause Analysis',     'rootCause',         32, false],
  ['Corrective Action Plan',  'correctiveAction',  32, false],
  ['Target Completion Date',  'targetDate',        16, false],
  ['Responsible Person(s)',   'responsiblePersons', 22, false],
  ['CAP Status',              'capStatus',         16, false],
  ['Evidence 1 (link)',       'evidence1',         26, false],
  ['Evidence 2 (link)',       'evidence2',         26, false],
  ['Evidence 3 (link)',       'evidence3',         26, false],
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const HEADER_KEYS = new Map<string, keyof CorrectiveActionData>();
for (const [h, f] of COLUMNS) HEADER_KEYS.set(norm(h), f);
// Common alternative headings
HEADER_KEYS.set(norm('Audit Conducted By'), 'auditConductedBy');
HEADER_KEYS.set(norm('Audit Days'), 'auditDays');
HEADER_KEYS.set(norm('Corrective Action Plan (CAP)'), 'correctiveAction');
HEADER_KEYS.set(norm('CAP'), 'correctiveAction');
HEADER_KEYS.set(norm('Target Date'), 'targetDate');
HEADER_KEYS.set(norm('Responsible Person'), 'responsiblePersons');
HEADER_KEYS.set(norm('Evidence 1'), 'evidence1');
HEADER_KEYS.set(norm('Evidence 2'), 'evidence2');
HEADER_KEYS.set(norm('Evidence 3'), 'evidence3');

/** Downloads the ready-to-fill template (.xlsx). */
export async function downloadCapTemplate(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('CAP Import', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNS.map(([h, , w, req]) => ({ header: req ? `${h} *` : h, width: w }));   // * = required

  const head = ws.getRow(1);
  head.height = 30;
  head.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Plain-text date cells so Excel never changes the format.
  const dateCols = [2, 10];
  for (let r = 2; r <= 301; r++) dateCols.forEach(c => { ws.getCell(r, c).numFmt = '@'; });

  ws.addRow(['Primark', '15-11-2026', 2, 'NC-001', '4.2', 'Fire exit', 'Fire exit blocked by stored cartons', 'No housekeeping check', 'Clear the exit and add a daily check', '30-11-2026', 'Mr. Rahim', 'Open', '', '', '']);
  ws.addRow(['', '', '', 'NC-002', '5.1', 'Wages', 'Overtime hours not recorded for 3 workers', '', '', '30-11-2026', 'HR Manager', 'In Progress', '', '', '']);
  ws.getRow(2).font = { italic: true, color: { argb: 'FF64748B' } };
  ws.getRow(3).font = { italic: true, color: { argb: 'FF64748B' } };

  for (let r = 2; r <= 301; r++) {
    ws.getCell(r, 12).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${CAP_STATUS_OPTIONS.join(',')}"`] };
    ws.getCell(r, 3).dataValidation  = { type: 'list', allowBlank: true, formulae: ['"0,1,2,3,4,5"'] };
  }

  const help = wb.addWorksheet('How to fill');
  help.columns = [{ width: 110 }];
  [
    'UPLOAD CAP DATA BY EXCEL — how to fill the "CAP Import" sheet',
    '',
    '1. One row = one NC entry. The two grey sample rows can be deleted or overwritten.',
    '2. Headings marked with * are required: Audited by, Audit Date, NC ID, NC Description.',
    '3. Audit columns (Audited by, Audit Date, Audit Days) are needed on the first row of an audit only — blank cells copy the row above.',
    '4. Dates: dd-mm-yyyy (e.g. 15-11-2026). Audit Days = extra days after the audit date, 0 to 5.',
    `5. CAP Status: ${CAP_STATUS_OPTIONS.join(', ')} (blank = Open).`,
    '6. Evidence 1–3: optional links (Drive / web). Pictures and files cannot be placed inside the Excel — attach them later with Edit.',
    '7. An NC ID that already exists under the same audit (same Audited by + Audit Date) is skipped, never overwritten.',
    '8. Up to 300 rows per upload.',
  ].forEach((t, i) => { const row = help.addRow([t]); if (i === 0) row.font = { bold: true, size: 12 }; });

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'CAP_Import_Template.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Reading ─────────────────────────────────────────────────────────────────

/** Any Excel cell → plain text (rich text, hyperlinks, formulas, dates handled). */
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

/** "15-11-2026" / "15/11/2026" / "2026-11-15" / Excel serial → ISO, or null when not a real date. */
export function parseImportDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return '';
  let y: number, m: number, d: number;
  let mt = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (mt) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else if ((mt = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) { d = +mt[1]; m = +mt[2]; y = +mt[3]; }
  else if (/^\d{5}$/.test(s)) {                                         // Excel serial date
    const dt = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000);
    y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
  } else return null;
  if (y < 1900 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export interface ImportRow {
  /** Excel row number (for messages). */
  row: number;
  data: CorrectiveActionData;
  /** Why this row will NOT be imported ('' = ready). */
  problem: string;
}

export interface ImportParse {
  rows: ImportRow[];
  /** File-level problem (wrong file, no headings, too many rows). */
  fatal: string;
}

const MAX_ROWS = 300;

/** Reads an .xlsx and validates every row. existingKeys = "audited|auditdate|ncid" (lower case) already saved. */
export async function parseCapExcel(file: File, existingKeys: Set<string>): Promise<ImportParse> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    return { rows: [], fatal: 'This is not a readable .xlsx file. Use the template (Excel 2007+ format).' };
  }
  const ws = wb.getWorksheet('CAP Import') ?? wb.worksheets[0];
  if (!ws) return { rows: [], fatal: 'The workbook has no sheet.' };

  // Heading row = first of the top 5 rows that has the NC ID heading
  const colField = new Map<number, keyof CorrectiveActionData>();
  let headRow = 0;
  for (let r = 1; r <= Math.min(5, ws.rowCount) && !headRow; r++) {
    const found = new Map<number, keyof CorrectiveActionData>();
    ws.getRow(r).eachCell((cell, c) => {
      const f = HEADER_KEYS.get(norm(cellText(cell.value)));
      if (f) found.set(c, f);
    });
    if ([...found.values()].includes('ncId')) { headRow = r; found.forEach((f, c) => colField.set(c, f)); }
  }
  if (!headRow) return { rows: [], fatal: 'Headings not found. Download the template and keep its first row (it needs an "NC ID" heading).' };

  const rows: ImportRow[] = [];
  const seen = new Set<string>(existingKeys);
  let last = { by: '', date: '', days: '0' };

  for (let r = headRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw: Partial<Record<keyof CorrectiveActionData, string>> = {};
    colField.forEach((f, c) => { raw[f] = cellText(row.getCell(c).value); });
    if (Object.values(raw).every(v => !v)) continue;                      // empty row
    if (rows.length >= MAX_ROWS) return { rows, fatal: `More than ${MAX_ROWS} rows — split the file and upload it in parts.` };

    // Audit columns copy the row above when blank
    if (raw.auditConductedBy) last = { by: raw.auditConductedBy, date: raw.auditDate || '', days: raw.auditDays || '0' };
    else if (raw.auditDate)   last = { ...last, date: raw.auditDate, days: raw.auditDays || '0' };
    const by       = raw.auditConductedBy || last.by;
    const dateText = raw.auditDate || last.date;
    const daysText = raw.auditDays !== undefined && raw.auditDays !== '' ? raw.auditDays : last.days;

    const problems: string[] = [];
    const auditDate = parseImportDate(dateText);
    const target    = parseImportDate(raw.targetDate ?? '');
    if (!by.trim()) problems.push('Audited by is empty');
    if (auditDate === null || auditDate === '') problems.push(auditDate === '' ? 'Audit Date is empty' : `Audit Date “${dateText}” is not a valid date`);
    if (target === null) problems.push(`Target date “${raw.targetDate}” is not a valid date`);
    if (!raw.ncId?.trim()) problems.push('NC ID is empty');
    if (!raw.ncDescription?.trim()) problems.push('NC Description is empty');
    if (auditDate && target && target < auditDate) problems.push('Target date is before the audit date');

    const days = auditDaysOf({ auditDays: daysText });
    const status = CAP_STATUS_OPTIONS.find(o => norm(o) === norm(raw.capStatus ?? '')) ?? 'Open';

    const key = `${by.trim().toLowerCase()}|${auditDate ?? ''}|${(raw.ncId ?? '').trim().toLowerCase()}`;
    if (!problems.length) {
      if (seen.has(key)) problems.push('NC ID already exists under this audit (skipped)');
      else seen.add(key);
    }

    const data: CorrectiveActionData = {
      ...INITIAL_CORRECTIVE_ACTION_STATE,
      auditConductedBy: by.trim(),
      auditDate: auditDate || '',
      auditDays: String(days),
      auditEndDate: auditDate ? addDaysIso(auditDate, days) : '',
      ncId: (raw.ncId ?? '').trim(),
      ncReference: raw.ncReference ?? '',
      ncCategory: raw.ncCategory ?? '',
      ncDescription: raw.ncDescription ?? '',
      rootCause: raw.rootCause ?? '',
      correctiveAction: raw.correctiveAction ?? '',
      targetDate: target || '',
      responsiblePersons: raw.responsiblePersons ?? '',
      capStatus: status,
      evidence1: raw.evidence1 ?? '', evidence2: raw.evidence2 ?? '', evidence3: raw.evidence3 ?? '',
    };
    rows.push({ row: r, data, problem: problems.join('; ') });
  }
  if (!rows.length) return { rows, fatal: 'No data rows found under the headings.' };
  return { rows, fatal: '' };
}

/** Key used to detect an NC that is already saved under the same audit. */
export function importKey(rec: Record<string, unknown>): string {
  return `${String(rec.auditConductedBy ?? '').trim().toLowerCase()}|${String(rec.auditDate ?? '').slice(0, 10)}|${String(rec.ncId ?? '').trim().toLowerCase()}`;
}