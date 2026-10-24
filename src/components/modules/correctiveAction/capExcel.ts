import * as XLSX from 'xlsx';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { formatDMY, getCapState, todayIso } from './types';

const HEADER = [
  'SL No.', 'Audit Conducted By', 'Audit Date', 'NC ID', 'NC Description', 'NC Reference',
  'NC Category / Keyword', 'Root Cause Analysis', 'Corrective Action Plan (CAP)',
  'Target Completion Date', 'Responsible Person(s)', 'CAP Status', 'Deadline / Overdue',
  'Evidence 1', 'Evidence 2', 'Evidence 3',
];
const EVIDENCE = [
  { url: 'evidence1', name: 'evidence1Name' },
  { url: 'evidence2', name: 'evidence2Name' },
  { url: 'evidence3', name: 'evidence3Name' },
];

export async function exportCapExcel(records: DbRecord[], filename: string): Promise<void> {
  const today = todayIso();
  const get = (r: DbRecord, k: string) => String((r as Record<string, unknown>)[k] ?? '');

  const rows = records.map((r, i) => {
    const { state, detail } = getCapState(get(r, 'targetDate'), get(r, 'capStatus'), today);
    return [
      i + 1, get(r, 'auditConductedBy'), formatDMY(get(r, 'auditDate')), get(r, 'ncId'),
      get(r, 'ncDescription'), get(r, 'ncReference'), get(r, 'ncCategory'), get(r, 'rootCause'),
      get(r, 'correctiveAction'), formatDMY(get(r, 'targetDate')), get(r, 'responsiblePersons'),
      get(r, 'capStatus'), state === 'done' ? 'Done' : detail,
      '', '', '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([HEADER, ...rows]);

  // Evidence cells: file name as a clickable link to the file.
  records.forEach((r, i) => {
    EVIDENCE.forEach((e, j) => {
      const url = get(r, e.url);
      if (!url) return;
      ws[XLSX.utils.encode_cell({ r: i + 1, c: 13 + j })] = {
        t: 's', v: get(r, e.name) || 'Linked file', l: { Target: url },
      };
    });
  });

  ws['!cols'] = [6, 20, 12, 12, 36, 16, 18, 32, 36, 14, 20, 16, 16, 24, 24, 24].map(wch => ({ wch }));
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: HEADER.length - 1 } }),
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CAP Record');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}