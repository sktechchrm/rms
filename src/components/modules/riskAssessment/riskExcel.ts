import * as XLSX from 'xlsx';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { RISK_HEADERS, buildRiskEntries, assessmentText, formatDMY } from './types';

export function exportRiskExcel(records: DbRecord[], filename: string): void {
  const str = (v: unknown) => String(v ?? '');
  const header = [
    'ক্রমিক', ...RISK_HEADERS, 'সম্ভাবনা', 'তীব্রতা', 'স্কোর', 'ঝুঁকির মাত্রা', 'ব্যবস্থা গ্রহণের তারিখ', 'মন্তব্য',
  ];
  const rows = buildRiskEntries(records).map((e, i) => {
    const r = e.rec;
    return [
      i + 1, str(r.section), str(r.source), str(r.riskIdentification), str(r.impact), str(r.remedy),
      assessmentText(e.likelihood, e.severity, e.level), str(r.causeInvestigation), str(r.correctiveAction),
      `${str(r.responsiblePersonName)}${r.responsiblePersonDesignation ? `, ${str(r.responsiblePersonDesignation)}` : ''}`,
      e.likelihood ?? '', e.severity ?? '', e.score ?? '', e.level,
      formatDMY(str(r.correctiveActionDate).slice(0, 10)), str(r.remarks),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [6, 16, 22, 28, 24, 28, 22, 24, 30, 24, 10, 10, 8, 14, 16, 24].map(wch => ({ wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Risk Assessment');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}