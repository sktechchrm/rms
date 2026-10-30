import * as XLSX from 'xlsx';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { parseNcItems, parseAuditors, parseAreas, formatDMY } from './types';

/** One row per non-compliance (an audit with none still gets one row). */
export function exportAuditExcel(records: DbRecord[], filename: string): void {
  const s = (v: unknown) => String(v ?? '');
  const header = [
    'SL', 'Site Name', 'Company', 'Audit Type', 'Audit Round', 'Audit Date', 'Auditing Areas', 'Auditors',
    'NC ID', 'NC Ref', 'Details of Non-Compliance', 'Preventive & Corrective Actions', 'TimeLine',
    'Agreed By Management', 'Responsible Person', 'Picture',
  ];
  const rows: unknown[][] = [];
  records.forEach((r, i) => {
    const areas = parseAreas(r.auditingAreasJson).join(' | ');
    const auditors = parseAuditors(r.auditorsJson).map(a => [a.name, a.designation].filter(Boolean).join(', ')).join(' | ');
    const base = [i + 1, s(r.siteName), s(r.companyName), s(r.auditType), s(r.auditRound), formatDMY(s(r.auditDate).slice(0, 10)), areas, auditors];
    const ncs = parseNcItems(r.correctiveActionsJson);
    if (!ncs.length) rows.push([...base, '', '', '', '', '', '', '', '']);
    ncs.forEach(c => rows.push([...base, c.ncId, c.ncRef, c.detailsOfNonCompliance, c.preventiveCorrectiveActions, c.timeline, c.agreedByManagement, c.responsiblePersonName, c.nonCompliancePictureLink]));
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [5, 20, 20, 16, 14, 12, 36, 26, 10, 30, 36, 36, 14, 20, 20, 30].map(wch => ({ wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Compliance Audit');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}