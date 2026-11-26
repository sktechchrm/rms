// ─────────────────────────────────────────────────────────────────────────────
// settlementImportExcel.ts — styled Excel files for the multi-employee form:
//   • downloadSettlementTemplate()  — the import template (navy header, 2 grey italic example rows)
// Column A (Settlement Type) is a dropdown fed from the "Settlement Types" sheet; Payment Method is a dropdown too.
// A blank group cell means "same as the row above" (shown the same way as in the Corrective Action template).
//
// Uses `exceljs` (styles + data validation; the plain `xlsx` package cannot write either):  npm i exceljs
// It is loaded on demand, so it is only downloaded when someone presses a download button.
// Path: src/components/modules/finalSettlement/settlementImportExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { Worksheet, Workbook } from 'exceljs';
import { blankSettlement, TERMINATION_OPTIONS, NOTICE_PAY_TYPES, NOTICE_DEDUCTION_TYPES, LAYOFF_TYPE } from './settlementModel';
import { IMPORT_COLS, IMPORT_SHEET } from './settlementImport';
import { newWorkbook, download, NAVY, SLATE, LINE } from './excelKit';

type Cell = string | number | undefined;
interface OutRow { cells: Record<string, Cell>; sample?: boolean }
interface ExtraCol { key: string; head: string; width: number }

const REQUIRED = new Set(['type', 'name', 'joining', 'lastAttendance', 'wage']);
const DATE_KEYS = ['settlementDate', 'joining', 'lastAttendance'];
const GREY = 'FF6B7280';
const VALIDATION_ROWS = 500;

function buildImportSheet(wb: Workbook, rows: OutRow[], extra: ExtraCol[] = []): Worksheet {
  const ws = wb.addWorksheet(IMPORT_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
  const cols = [
    ...IMPORT_COLS.map(c => ({ key: c.key, header: REQUIRED.has(c.key) ? `${c.head} *` : c.head, width: c.width, extra: false })),
    ...extra.map(c => ({ key: c.key, header: c.head, width: c.width, extra: true })),
  ];
  ws.columns = cols.map(c => ({ key: c.key, header: c.header, width: c.width }));
  for (const k of DATE_KEYS) ws.getColumn(k).numFmt = '@';              // dd-mm-yyyy stays text — Excel must not turn it into a date

  const head = ws.getRow(1);
  head.height = 34;
  head.eachCell((cell, n) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cols[n - 1]?.extra ? SLATE : NAVY } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
  });

  for (const r of rows) {
    const row = ws.addRow(r.cells);
    row.eachCell({ includeEmpty: true }, (cell, n) => {
      if (n > cols.length) return;
      cell.border = { bottom: { style: 'thin', color: { argb: LINE } }, right: { style: 'thin', color: { argb: LINE } } };
      cell.alignment = { vertical: 'middle', wrapText: false };
      if (r.sample) cell.font = { italic: true, color: { argb: GREY } };
    });
  }

  // dropdowns: Settlement Type (column A) from the "Settlement Types" sheet, Payment Method inline
  const typeCol = cols.findIndex(c => c.key === 'type') + 1;
  const methodCol = cols.findIndex(c => c.key === 'method') + 1;
  const lastType = TERMINATION_OPTIONS.length + 1;
  for (let r = 2; r <= VALIDATION_ROWS + 1; r++) {
    ws.getCell(r, typeCol).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`'Settlement Types'!$A$2:$A$${lastType}`],
      showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Settlement Type', error: 'Choose a settlement type from the list.',
    };
    ws.getCell(r, methodCol).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"compensation,gratuity"'],
      showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Payment Method', error: 'Choose compensation or gratuity.',
    };
  }
  return ws;
}

function addSupportSheets(wb: Workbook): void {
  const d = blankSettlement();
  const types = wb.addWorksheet('Settlement Types');
  types.columns = [{ width: 62 }];
  types.addRow(['Settlement Type']).font = { bold: true };
  TERMINATION_OPTIONS.forEach(o => types.addRow([o.label]));

  const help = wb.addWorksheet('Instructions');
  help.columns = [{ width: 130 }];
  help.addRow(['নির্দেশনা']).font = { bold: true, size: 13 };
  [
    `১. "${IMPORT_SHEET}" শিটে একটি সারি = একজন কর্মী। ধূসর ইটালিক সারি দুটি উদাহরণ — সেগুলো Import-এ বাদ যায়, মুছে ফেলুন বা নিজের তথ্য দিয়ে বদলান।`,
    '২. Settlement Type (কলাম A) ড্রপডাউন থেকে বেছে নিন। Settlement Type ও Settlement Date গ্রুপের প্রথম সারিতে দিন; ফাঁকা ঘর হলে উপরের সারির মান ধরা হবে।',
    '৩. তারিখ dd-mm-yyyy ফরম্যাটে দিন (যেমন 31-10-2026)।',
    '৪. আবশ্যিক (*): Settlement Type, Name, Joining Date, Last Attendance, Total Monthly Wage।',
    `৫. ভাতা ফাঁকা থাকলে ধরা হবে: খাদ্য ${d.foodAllowance}, চিকিৎসা ${d.medicalAllowance}, যাতায়াত ${d.transportAllowance}।`,
    '৬. Payable Days ফাঁকা থাকলে সর্বশেষ উপস্থিতির তারিখের দিন (মাসের কত তারিখ) ধরা হবে। সর্বশেষ মাস = সর্বশেষ উপস্থিতির মাস।',
    `৭. Notice Pay Days — শুধু: ${NOTICE_PAY_TYPES.join(', ')}`,
    `৮. Notice Deduction Days — শুধু: ${NOTICE_DEDUCTION_TYPES.join(', ')}`,
    `৯. Lay-off Days — শুধু: ${LAYOFF_TYPE}`,
    '১০. Payment Method: compensation অথবা gratuity (ফাঁকা = compensation); গ্র্যাচুইটি প্রযোজ্য নয় এমন ধরনে এটি উপেক্ষিত হয়।',
    '১১. Import করলে কিছু সংরক্ষণ হয় না — সারিগুলো ফর্মে আসে, যাচাই করে সংরক্ষণ করুন।',
  ].forEach(t => help.addRow([t]));
}

// ─── Template ────────────────────────────────────────────────────────────────

export async function downloadSettlementTemplate(filename = 'FinalSettlement_Import_Template'): Promise<void> {
  const wb = await newWorkbook();
  const layoff = TERMINATION_OPTIONS.find(o => o.value === 'ছাঁটাই (২০)')?.label ?? TERMINATION_OPTIONS[0].label;
  buildImportSheet(wb, [
    { sample: true, cells: { type: layoff, settlementDate: '30-11-2026', cardNo: '1001', name: '(উদাহরণ) রহিম উদ্দিন', designation: 'Operator', section: 'Sewing', joining: '01-01-2020', lastAttendance: '31-10-2026', wage: 15000, otHours: 20, elDays: 12, noticePayDay: 30, method: 'compensation' } },
    { sample: true, cells: { cardNo: '1002', name: '(উদাহরণ) করিম মিয়া', designation: 'Helper', section: 'Finishing', joining: '15-03-2023', lastAttendance: '31-10-2026', wage: 13000, elDays: 8, noticePayDay: 30, advance: 2000, advanceNote: 'অগ্রিম' } },
  ]);
  addSupportSheets(wb);
  await download(wb, filename);
}