// ─────────────────────────────────────────────────────────────────────────────
// disciplinaryExcel.ts — Excel export of the Disciplinary Action Statement (same structure as Leftnoticeexcel.ts'
// exportNoticeList): the filtered list, one row per case, with the dates, deadlines, stage and the decision.
// Needs the `xlsx` package (already used by the Left Notice module).
// Path: src/components/modules/disciplinaryAction/disciplinaryExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { CaseRow } from './disciplinaryStatementModel';
import { STAGE_STYLE, formatDMY, summarize } from './disciplinaryStatementModel';

/** The filtered Statement: one row per case. Dates are dd-mm-yyyy; long texts are plain text (rich-text formatting removed). */
export function exportDisciplinaryList(rows: CaseRow[], filename: string): void {
  const head = ['SL', 'Ref No', 'Card No', 'Name', 'Designation', 'Section', 'Subject', 'Complaint',
    'Show-cause Date', 'Reply Due', 'Reply Date', 'Reply Status', 'Notice-2 Date', 'Committee (persons)', 'Committee Members', 'Notice-3 Date', 'Enquiry Limit',
    'Report Date', 'Report Summary', 'Recommendation', 'Final Decision', 'Punishment', 'Stage', 'Days Open', 'Alert'];
  const body = rows.map((r, i) => [
    i + 1, r.referenceNo, r.cardNo, r.name, r.designation, r.section, r.subject, r.complaint,
    formatDMY(r.showCause), formatDMY(r.replyDue.date), formatDMY(r.replyDate), r.replyStatus,
    formatDMY(r.notice2), r.memberCount || '', r.memberNames, formatDMY(r.notice3), formatDMY(r.enquiry.date),
    formatDMY(r.evaluationDate), r.reportSummary, r.recommendation, r.finalDecision, r.punishment,
    STAGE_STYLE[r.stage].label, r.daysOpen ?? '', r.overdue ? 'মেয়াদোত্তীর্ণ' : r.soon ? 'সময়সীমা ঘনিয়ে এসেছে' : '',
  ]);
  const s = summarize(rows);
  const foot: (string | number)[] = new Array(head.length).fill('');
  foot[3] = `Total ${s.count}`;
  foot[20] = `Decided: ${s.decided}`;
  foot[22] = `Closed: ${s.closed}`;
  foot[24] = `Overdue: ${s.overdue}`;
  const ws = XLSX.utils.aoa_to_sheet([head, ...body, [], foot]);
  ws['!cols'] = [5, 24, 10, 22, 18, 16, 26, 44, 13, 13, 13, 13, 13, 10, 30, 13, 13, 13, 44, 36, 36, 26, 22, 9, 22].map(wch => ({ wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: head.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Disciplinary');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
