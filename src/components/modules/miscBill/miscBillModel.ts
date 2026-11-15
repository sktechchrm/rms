// ─────────────────────────────────────────────────────────────────────────────
// miscBillModel.ts — saved Miscellaneous Bills → statement rows, filters, sort and summary.
// Everything on the statement is DERIVED from the saved record (totals are recalculated from the lines),
// so the statement, the print list and the Excel file always agree with the bill itself.
// Path: src/components/modules/miscBill/miscBillModel.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import type { MiscBillItem, MiscBillTemplate, MiscBillData } from './types';
import { TEMPLATE_OPTIONS, calculatePayableAmount } from './types';
import { toDateInput } from '../../../utils/dateUtils';

// ─── Dates ───────────────────────────────────────────────────────────────────

const pad2 = (x: number) => String(x).padStart(2, '0');
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** ISO (YYYY-MM-DD) → DD-MM-YYYY. */
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}
export const money = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Parsing saved data ──────────────────────────────────────────────────────

/** Saved lines → form lines. Reads older field names too (cardId, deptSection). */
export function parseItems(raw: unknown): MiscBillItem[] {
  try {
    const parsed = JSON.parse(String(raw ?? '[]'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it, i): MiscBillItem => ({
      slNo: Number(it.slNo ?? i + 1),
      particulars: String(it.particulars ?? ''),
      name: String(it.name ?? ''),
      cardNo: String(it.cardNo ?? it.cardId ?? ''),
      designation: String(it.designation ?? ''),
      department: String(it.department ?? it.deptSection ?? ''),
      grossSalary: String(it.grossSalary ?? ''),
      count: String(it.count ?? ''),
      manualPayableAmount: String(it.manualPayableAmount ?? ''),
      remarks: String(it.remarks ?? ''),
    }));
  } catch { return []; }
}

export const templateOf = (v: unknown): MiscBillTemplate => (v === 'adjustment' || v === 'festival' ? v : 'holiday');
export const templateLabel = (t: MiscBillTemplate) => TEMPLATE_OPTIONS.find(o => o.value === t)?.label ?? t;

// ─── Statement rows ──────────────────────────────────────────────────────────

export interface BillRow {
  id: string;
  savedAt: string;
  template: MiscBillTemplate;
  templateLabel: string;
  subject: string;
  date: string;          // ISO
  items: MiscBillItem[];
  entries: number;
  total: number;
  preparedBy: string;
}

/** One bill's statement row, computed from its lines. */
export function rowFromData(d: Pick<MiscBillData, 'template' | 'subject' | 'date' | 'items'>, meta: { id?: string; savedAt?: string; preparedBy?: string } = {}): BillRow {
  const total = d.items.reduce((s, it) => s + calculatePayableAmount(d.template, it.grossSalary, it.count, it.manualPayableAmount), 0);
  return {
    id: meta.id ?? '', savedAt: meta.savedAt ?? '', template: d.template, templateLabel: templateLabel(d.template),
    subject: d.subject, date: d.date, items: d.items, entries: d.items.length, total, preparedBy: meta.preparedBy ?? '',
  };
}

export function buildBillRows(records: DbRecord[]): BillRow[] {
  return records.map(rc => {
    const r = rc as unknown as Record<string, unknown>;
    return rowFromData(
      { template: templateOf(r.template), subject: String(r.subject ?? ''), date: toDateInput(r.date) || '', items: parseItems(r.itemsJson) },
      { id: String(r.id ?? ''), savedAt: String(r.savedAt ?? ''), preparedBy: String(r.preparedBy ?? '') },
    );
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Every line of every bill, flattened — used by the entries sheet and the entries count. */
export interface EntryRow { bill: BillRow; item: MiscBillItem; payable: number }
export function flattenEntries(rows: BillRow[]): EntryRow[] {
  return rows.flatMap(bill => bill.items.map(item => ({
    bill, item, payable: calculatePayableAmount(bill.template, item.grossSalary, item.count, item.manualPayableAmount),
  })));
}

// ─── Filters / sort / summary ────────────────────────────────────────────────

export type BillSortField = 'date' | 'subject' | 'total' | '';
export interface BillFilters {
  search: string;
  templates: string[];                    // template values; [] = all
  dateFrom: string; dateTo: string;       // bill date range (ISO)
  columns: Record<string, string[]>;      // templateLabel / preparedBy
  sort: { field: BillSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_BILL_FILTERS: BillFilters = { search: '', templates: [], dateFrom: '', dateTo: '', columns: {}, sort: { field: '', dir: 'asc' } };
export const BLANK_VALUE = '(Blank)';

export function columnValue(r: BillRow, field: string): string {
  const v = field === 'templateLabel' ? r.templateLabel : field === 'preparedBy' ? r.preparedBy : '';
  return v.trim() || BLANK_VALUE;
}

export function countActiveFilters(f: BillFilters): number {
  return [f.search.trim(), f.templates.length > 0, f.dateFrom, f.dateTo].filter(Boolean).length + Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
}

export function filterRows(rows: BillRow[], f: BillFilters): BillRow[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter(r => {
    if (f.dateFrom && (!r.date || r.date < f.dateFrom)) return false;
    if (f.dateTo && (!r.date || r.date > f.dateTo)) return false;
    if (f.templates.length && !f.templates.includes(r.template)) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) if (sel.length && !sel.includes(columnValue(r, field))) return false;
    if (words.length) {
      const people = r.items.map(i => `${i.name} ${i.cardNo} ${i.department} ${i.designation}`).join(' ');
      const hay = `${r.subject} ${r.templateLabel} ${r.preparedBy} ${people}`.toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return out;
  const m = dir === 'asc' ? 1 : -1;
  return [...out].sort((a, b) => {
    if (field === 'total') return m * (a.total - b.total);
    const x = field === 'subject' ? a.subject : a.date, y = field === 'subject' ? b.subject : b.date;
    if (!x && !y) return 0;
    if (!x) return 1;                      // blanks always last
    if (!y) return -1;
    return m * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function summarize(rows: BillRow[]) {
  const by = (t: MiscBillTemplate) => {
    const list = rows.filter(r => r.template === t);
    return { count: list.length, total: list.reduce((s, r) => s + r.total, 0) };
  };
  const dates = rows.map(r => r.date).filter(Boolean).sort();
  return {
    bills: rows.length,
    entries: rows.reduce((s, r) => s + r.entries, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
    holiday: by('holiday'), festival: by('festival'), adjustment: by('adjustment'),
    from: dates[0] ?? '', to: dates[dates.length - 1] ?? '',
  };
}
