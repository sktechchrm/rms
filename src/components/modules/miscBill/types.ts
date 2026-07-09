// ─────────────────────────────────────────────────────────────────────────────
// Miscellaneous Bill — types
// Path: src/components/modules/miscBill/types.ts
//
// REQUISITION-STYLE architecture (per explicit confirmation): one document
// = subject + date + array of line items (employees), saved as one record.
// Three templates — Holiday Bill, Adjustment Bill, Festival Holiday Bill.
//
// UPDATE (explicit request): Adjustment Bill's column set is now DIFFERENT
// from Holiday/Festival — it drops Count and Signature, adds Particulars
// (a text-area description of what's being adjusted). Holiday and Festival
// keep their original columns, with Basic Salary added to ALL THREE.
//
//   Holiday Bill:          SL, Name, Card/ID, Designation, Dept/Section,
//                          Gross Salary, Basic Salary, Count Holiday,
//                          Payable Amount, Signature, Remarks
//                          Payable = daily gross (gross/30) × count
//
//   Festival Holiday Bill: same columns as Holiday, Count Festival Holiday.
//                          Payable = daily basic × 2 × count — uses the
//                          REAL basicSalary field now (from Global Search
//                          or manual entry) instead of estimating from
//                          gross, falling back to the gross-based estimate
//                          only if basicSalary wasn't provided.
//
//   Adjustment Bill:       SL, Particulars, Name, Card/ID, Designation,
//                          Dept/Section, Gross Salary, Basic Salary,
//                          Payable Amount, Remarks — Payable is manual
//                          entry, no formula, no Count/Signature columns.
// ─────────────────────────────────────────────────────────────────────────────

import { calculateBasicFromGross, DEFAULT_BASIC_DIVISOR, DEFAULT_MONTHLY_DAYS } from '../../../utils/sharedFormulas';
import { numberToWordsBN } from '../../../utils/bnEnDate';

export type MiscBillTemplate = 'holiday' | 'adjustment' | 'festival';

/** "In Word" — Grand Total spelled out, reusing the same numberToWordsBN
   already used by Maternity Bill/Final Settlement, not a new implementation. */
export function grandTotalInWords(amount: number): string {
  return `${numberToWordsBN(Math.floor(amount))} টাকা মাত্র`;
}

export const TEMPLATE_OPTIONS: { value: MiscBillTemplate; label: string }[] = [
  { value: 'holiday',    label: 'Holiday Bill' },
  { value: 'adjustment', label: 'Adjustment Bill' },
  { value: 'festival',   label: 'Festival Holiday Bill' },
];

/** The "Count [X]" column label per template. */
export const COUNT_LABEL: Record<MiscBillTemplate, string> = {
  holiday:    'Count Holiday',
  adjustment: 'Count Adjustment',
  festival:   'Count Festival Holiday',
};

export interface MiscBillItem {
  slNo: number;
  /** Only used/shown for the Adjustment template — description of what's
     being adjusted. */
  particulars: string;
  name: string;
  cardId: string;
  designation: string;
  deptSection: string;
  grossSalary: string;
  /** Real basic salary — auto-filled by Global Search when available
     (employee.basicSalary), or entered manually. Used directly by the
     Festival Holiday formula; falls back to an estimate from grossSalary
     only if left blank. */
  basicSalary: string;
  count: string;
  /** Only meaningful for the Adjustment template (manual entry) — Holiday
     and Festival Holiday derive their payable amount live from
     grossSalary/basicSalary + count instead of storing a separately-edited
     value. */
  manualPayableAmount: string;
  remarks: string;
}

export interface MiscBillData {
  template: MiscBillTemplate;
  subject: string;
  date: string;
  items: MiscBillItem[];
  factoryName: string;
  factoryAddress: string;
}

export interface MiscBillFormProps {
  data: MiscBillData;
  setData: (data: MiscBillData) => void;
}

export interface MiscBillTemplateProps {
  data: MiscBillData;
  authorization: import('../../common/AuthorizationBlock').AuthorizationState;
}

/**
 * Payable amount for one line item, per the template's formula.
 *   Holiday:    daily gross (gross / 30)        × count
 *   Festival:   daily basic (basic / 30) × 2     × count
 *   Adjustment: manual entry, untouched by any formula
 */
export function calculatePayableAmount(
  template: MiscBillTemplate,
  grossSalary: string,
  basicSalary: string,
  count: string,
  manualPayableAmount: string,
): number {
  const gross = Number(grossSalary) || 0;
  const cnt   = Number(count)       || 0;

  if (template === 'adjustment') {
    return Number(manualPayableAmount) || 0;
  }
  if (template === 'holiday') {
    const dailyGross = gross / DEFAULT_MONTHLY_DAYS;
    return dailyGross * cnt;
  }
  // festival — use the REAL basicSalary if provided; otherwise fall back
  // to the gross-based estimate (same ratio already used elsewhere in
  // this app for gross->basic conversion when a real figure isn't known).
  const basic = Number(basicSalary) > 0
    ? Number(basicSalary)
    : calculateBasicFromGross(gross, 0, DEFAULT_BASIC_DIVISOR);
  const dailyBasic = basic / DEFAULT_MONTHLY_DAYS;
  return dailyBasic * 2 * cnt;
}

export function blankItem(slNo: number): MiscBillItem {
  return { slNo, particulars: '', name: '', cardId: '', designation: '', deptSection: '', grossSalary: '', basicSalary: '', count: '', manualPayableAmount: '', remarks: '' };
}

export const INITIAL_MISC_BILL_STATE: MiscBillData = {
  template: 'holiday',
  subject: '',
  date: new Date().toISOString().split('T')[0],
  items: [blankItem(1)],
  factoryName: '',
  factoryAddress: '',
};