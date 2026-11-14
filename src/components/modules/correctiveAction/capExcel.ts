// ─────────────────────────────────────────────────────────────────────────────
// capExcel.ts — Excel export for the CAP Statement.
// Two export modes:
//   'image' — Evidence 1–3 are PICTURES inside their cells (fetched from Drive through the
//             backend's 'getImage' action). If a file has no picture or the fetch fails, that
//             cell falls back to the file name as a clickable link.
//   'link'  — Evidence 1–3 are clickable FILE-NAME LINKS only (no picture download).
//
// Needs the `exceljs` package: the SheetJS (xlsx) library used before cannot embed pictures.
// Path: src/components/modules/correctiveAction/capExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import ExcelJS from 'exceljs';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { formatDMY, getCapState, todayIso } from './types';
import { fetchEvidenceImage } from './evidenceUpload';
import type { EvidenceImageResult, UploadConfig } from './evidenceUpload';

/** What the export did: how many pictures went in, how many fell back to links, and the first reason. */
export interface CapExcelResult { pictures: number; links: number; firstError: string }

const HEADER = [
  'SL No.', 'Audit Conducted By', 'Audit Date', 'NC ID', 'NC Description', 'NC Reference',
  'NC Category / Keyword', 'Root Cause Analysis', 'Corrective Action Plan (CAP)',
  'Target Completion Date', 'Responsible Person(s)', 'CAP Status', 'Deadline / Overdue',
  'Evidence 1', 'Evidence 2', 'Evidence 3',
];
const WIDTHS = [7, 20, 13, 12, 36, 16, 18, 32, 36, 14, 20, 16, 16, 26, 26, 26];
const EVIDENCE = [
  { url: 'evidence1', name: 'evidence1Name' },
  { url: 'evidence2', name: 'evidence2Name' },
  { url: 'evidence3', name: 'evidence3Name' },
];
const EVIDENCE_COL = [13, 14, 15];   // zero-based column index of Evidence 1–3

const IMG_W = 170;          // picture size in pixels
const IMG_H = 210;
const ROW_HEIGHT_PT = 160;  // row height (points) when the row has evidence, so the picture fits
const FETCH_BATCH = 4;      // how many pictures are fetched from Drive at the same time

/**
 * Exports the given CAP records to an .xlsx file.
 *   mode 'image' (default) — evidence files are written as PICTURES (needs `cfg`).
 *   mode 'link'            — evidence cells are clickable FILE-NAME LINKS only; no Drive
 *                            download, so `cfg` is not needed.
 * `cfg` is the backend address and key (resolveUploadConfig(factory)).
 */
export async function exportCapExcel(
  records: DbRecord[],
  filename: string,
  cfg?: UploadConfig,
  mode: 'image' | 'link' = 'image',
): Promise<CapExcelResult> {
  const today = todayIso();
  const configMissing = mode === 'image' && (!cfg || !cfg.url || !cfg.key);
  let pictures = 0;
  let links = 0;
  let firstError = '';
  const rowsWithPicture = new Set<number>();   // Excel row numbers (1-based) that got a picture
  const get = (r: DbRecord, k: string) => String((r as Record<string, unknown>)[k] ?? '');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'RMS';
  const ws = wb.addWorksheet('CAP Record');

  ws.columns = HEADER.map((h, i) => ({ header: h, key: `c${i}`, width: WIDTHS[i] }));

  const headRow = ws.getRow(1);
  headRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  headRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headRow.height = 32;

  records.forEach((r, i) => {
    const { state, detail } = getCapState(get(r, 'targetDate'), get(r, 'capStatus'), today);
    const row = ws.addRow([
      i + 1, get(r, 'auditConductedBy'), formatDMY(get(r, 'auditDate')), get(r, 'ncId'),
      get(r, 'ncDescription'), get(r, 'ncReference'), get(r, 'ncCategory'), get(r, 'rootCause'),
      get(r, 'correctiveAction'), formatDMY(get(r, 'targetDate')), get(r, 'responsiblePersons'),
      get(r, 'capStatus'), state === 'done' ? 'Done' : detail,
      '', '', '',
    ]);
    row.alignment = { vertical: 'top', wrapText: true };
  });

  // Pictures (or link fallbacks) for the evidence cells
  const jobs: { row: number; col: number; url: string; name: string }[] = [];
  records.forEach((r, i) => {
    EVIDENCE.forEach((e, j) => {
      const url = get(r, e.url);
      if (url) jobs.push({ row: i + 2, col: EVIDENCE_COL[j], url, name: get(r, e.name) });
    });
  });

  for (let k = 0; k < jobs.length; k += FETCH_BATCH) {
    const batch = jobs.slice(k, k + FETCH_BATCH);
    const results: EvidenceImageResult[] = mode === 'image' && cfg
      ? await Promise.all(batch.map(job => fetchEvidenceImage(cfg, job.url)))
      : batch.map(() => ({ error: configMissing ? 'Upload settings were not passed to the export.' : '' }));

    batch.forEach((job, idx) => {
      const res = results[idx];
      if ('base64' in res) {
        pictures++;
        rowsWithPicture.add(job.row);
        const imageId = wb.addImage({ base64: res.base64, extension: res.extension });
        ws.addImage(imageId, {
          tl: { col: job.col + 0.08, row: job.row - 1 + 0.08 },   // zero-based anchor, small inset
          ext: { width: IMG_W, height: IMG_H },
        });
      } else {
        links++;
        if (!firstError && res.error) firstError = res.error;
        const cell = ws.getCell(job.row, job.col + 1);
        cell.value = { text: job.name || 'Linked file', hyperlink: job.url };
        cell.font = { color: { argb: 'FF2563EB' }, underline: true };
      }
    });
  }

  // Tall rows only where a picture was actually placed; everything else stays compact.
  records.forEach((_, i) => {
    ws.getRow(i + 2).height = mode === 'image' && rowsWithPicture.has(i + 2) ? ROW_HEIGHT_PT : 30;
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: records.length + 1, column: HEADER.length },
  };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { pictures, links, firstError };
}