// ─────────────────────────────────────────────────────────────────────────────
// excelKit.ts — shared look of every Excel file of this module (navy header · white bold wrapped text · frozen header · thin lines).
// Uses `exceljs` (npm i exceljs), loaded on demand so it is only downloaded when a download button is pressed.
// Path: src/components/modules/finalSettlement/excelKit.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { Workbook, Row, Cell } from 'exceljs';

export const NAVY = 'FF1F3A5F';
export const SLATE = 'FF475569';
export const LINE = 'FFD5DCE6';
export const SOFT = 'FFF1F5F9';
export const GREEN = 'FF047857';
export const MONEY = '#,##0.00';
export const WHOLE = '#,##0';

export async function newWorkbook(): Promise<Workbook> {
  const mod = await import('exceljs');
  const lib = (mod as unknown as { default?: typeof import('exceljs') }).default ?? mod;
  return new lib.Workbook();
}

export async function download(wb: Workbook, filename: string): Promise<void> {
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/** Header look: solid fill, white bold centred wrapped text, white hairlines between the cells. */
export function styleHeaderRow(row: Row, fill: string = NAVY, height = 34): void {
  row.height = height;
  row.eachCell({ includeEmpty: true }, cell => styleHeaderCell(cell, fill));
}
export function styleHeaderCell(cell: Cell, fill: string = NAVY): void {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = { left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
}
export const thin = { style: 'thin' as const, color: { argb: LINE } };