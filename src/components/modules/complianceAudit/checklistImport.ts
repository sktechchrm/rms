// ─────────────────────────────────────────────────────────────────────────────
// checklistImport.ts — upload a CUSTOM CHECKLIST by Excel into the Auditing Areas (template download + file reader).
//
// One Excel row = one Code of Conduct point.  Columns: Area Name * · Sub-group · Code of Conduct Point * · Principle No. of
// Standard · Severity (Minor / Major / Critical; blank = Minor).  Rows with a blank Area Name continue the area above.
// Every different Area Name becomes a new Auditing Area (letters G, H, … after the built-in A–F); points are numbered 1, 2, 3 …
// in file order, so NC IDs read like G-4-1.
// Needs the `exceljs` package (already used by the other Excel upload).
// Path: src/components/modules/complianceAudit/checklistImport.ts
// ─────────────────────────────────────────────────────────────────────────────

import ExcelJS from 'exceljs';
import { SEVERITY_OPTIONS, MAX_CUSTOM_AREAS, MAX_CUSTOM_POINTS } from './types';
import type { CustomChecklistArea, Severity } from './types';

const HEAD = ['Area Name *', 'Sub-group', 'Code of Conduct Point *', 'Principle No. of Standard', 'Severity'];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ঀ-৿]/g, '');

export async function downloadChecklistTemplate(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Checklist', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [30, 24, 52, 40, 12].map(width => ({ width }));
  HEAD.forEach((h, i) => { ws.getCell(1, i + 1).value = h; });
  ws.getRow(1).height = 30;
  ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  for (let r = 2; r <= 501; r++) {
    ws.getCell(r, 5).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${SEVERITY_OPTIONS.join(',')}"`] };
  }

  // The examples live on their own sheet, so nothing has to be deleted before uploading.
  const ex = wb.addWorksheet('Example');
  ex.columns = [30, 24, 52, 40, 12].map(width => ({ width }));
  const rows: string[][] = [
    HEAD,
    ['Buyer Code of Conduct', 'Workplace safety', 'Fire exits are unobstructed and signed', 'Buyer CoC 4.1', 'Critical'],
    ['', 'Workplace safety', 'Fire drill held every six months', 'Buyer CoC 4.2', 'Major'],
    ['', 'Wages', 'Wage slips given to every worker', 'Buyer CoC 6.3', 'Minor'],
    ['Customer Audit 2026', '', 'Sub-contractors approved in writing', 'Customer manual 2.5', ''],
  ];
  rows.forEach((row, i) => row.forEach((v, c) => {
    const cell = ex.getCell(i + 1, c + 1);
    cell.value = v;
    if (i === 0) { cell.font = { bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; }
  }));

  const help = wb.addWorksheet('How to fill');
  help.getColumn(1).width = 110;
  [
    'UPLOAD A CUSTOM CHECKLIST — how to fill the "Checklist" sheet',
    '1. One row = one Code of Conduct point. Area Name and Code of Conduct Point are required.',
    '2. Each different Area Name becomes a new Auditing Area (next free letter after A–F). Leave Area Name blank to continue the area above.',
    '3. Sub-group (optional) is a heading inside the area, shown above its points.',
    '4. Principle No. of Standard (optional) — the standard / clause the point comes from.',
    '5. Severity (optional): Minor, Major or Critical. It is only the suggested default; the auditor can change it on each NC. Blank = Minor.',
    '6. Points are numbered 1, 2, 3 … in the order of the rows, so the NC ID reads like G-4-1.',
    '7. See the "Example" sheet for a filled sample. Up to ' + MAX_CUSTOM_AREAS + ' custom areas and ' + MAX_CUSTOM_POINTS + ' points in total.',
  ].forEach((t, i) => { const row = help.addRow([t]); if (i === 0) row.font = { bold: true, size: 12 }; });

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'Compliance_Checklist_Template.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as unknown as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map(t => t.text).join('').trim();
    if ('result' in o) return cellText(o.result as ExcelJS.CellValue);
    if (typeof o.text === 'string') return o.text.trim();
    return '';
  }
  return String(v).trim();
}

export interface ChecklistParse {
  /** Areas read from the file (no letters yet — the dialog assigns them). */
  areas: { name: string; points: CustomChecklistArea['points'] }[];
  problems: string[];
  fatal: string;
}

export async function parseChecklistExcel(file: File): Promise<ChecklistParse> {
  const none = (fatal: string): ChecklistParse => ({ areas: [], problems: [], fatal });
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(await file.arrayBuffer()); }
  catch { return none('This is not a readable .xlsx file. Use the template (Excel 2007+ format).'); }
  const ws = wb.getWorksheet('Checklist') ?? wb.worksheets[0];
  if (!ws) return none('The workbook has no sheet.');

  const idx = { area: 0, group: 0, point: 0, principle: 0, severity: 0 };
  let headRow = 0;
  for (let r = 1; r <= Math.min(5, ws.rowCount) && !headRow; r++) {
    const f = { area: 0, group: 0, point: 0, principle: 0, severity: 0 };
    ws.getRow(r).eachCell((cell, c) => {
      const h = norm(cellText(cell.value));
      if (h === 'areaname' || h === 'area') f.area = c;
      else if (h === 'subgroup' || h === 'group') f.group = c;
      else if (h === 'codeofconductpoint' || h === 'point') f.point = c;
      else if (h === 'principlenoofstandard' || h === 'principle' || h === 'standard') f.principle = c;
      else if (h === 'severity') f.severity = c;
    });
    if (f.area && f.point) { headRow = r; Object.assign(idx, f); }
  }
  if (!headRow) return none('Headings not found. Download the template and keep its first row (it needs "Area Name" and "Code of Conduct Point").');

  const areas: ChecklistParse['areas'] = [];
  const problems: string[] = [];
  let current = '';
  let total = 0;
  for (let r = headRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (c: number) => (c ? cellText(row.getCell(c).value) : '');
    const area = get(idx.area), group = get(idx.group), point = get(idx.point), principle = get(idx.principle), sevText = get(idx.severity);
    if (!area && !group && !point && !principle && !sevText) continue;
    if (area) current = area;
    if (!point) { problems.push(`Row ${r}: Code of Conduct Point is empty — skipped`); continue; }
    if (!current) { problems.push(`Row ${r}: no Area Name (first rows need one) — skipped`); continue; }
    let severity: Severity | undefined;
    if (sevText) {
      severity = SEVERITY_OPTIONS.find(o => norm(o) === norm(sevText));
      if (!severity) { problems.push(`Row ${r}: Severity “${sevText}” is not Minor / Major / Critical — Minor used`); }
    }
    if (++total > MAX_CUSTOM_POINTS) { problems.push(`More than ${MAX_CUSTOM_POINTS} points — the rest were not read`); break; }
    let a = areas.find(x => norm(x.name) === norm(current));
    if (!a) { a = { name: current, points: [] }; areas.push(a); }
    a.points.push({ point, principle, group: group || undefined, severity: severity ?? 'Minor' });
  }
  if (!areas.length) return { areas, problems, fatal: 'No checklist points found in the file.' };
  return { areas, problems, fatal: '' };
}