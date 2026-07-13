// ─────────────────────────────────────────────────────────────────────────────
// Miscellaneous Bill — types
// Path: src/components/modules/miscBill/types.ts
//
// REQUISITION-STYLE architecture: one document = subject + date + array of
// line items (employees), saved as one record. Three templates — Holiday
// Bill, Adjustment Bill, Festival Holiday Bill. English-only UI (no Bengali
// labels/text anywhere in this module, per explicit request).
//
//   Holiday Bill:          SL, Name, Card No., Designation, Department,
//                          Gross Salary, Basic Salary (dynamic), Count
//                          Holiday, Payable Amount, Signature, Remarks
//                          Payable = daily gross (gross/30) × count
//
//   Festival Holiday Bill: same columns as Holiday, Count Festival Holiday.
//                          Payable = daily basic × 2 × count — Basic Salary
//                          is DYNAMICALLY computed from Gross Salary (not a
//                          separate stored/editable field — see
//                          calculateDynamicBasicSalary below), same value
//                          shown in the Basic Salary column and used by
//                          this formula, so they can never disagree.
//
//   Adjustment Bill:       SL, Particulars, Name, Card No., Designation,
//                          Department, Gross Salary, Basic Salary
//                          (dynamic), Payable Amount, Remarks — Payable is
//                          manual entry, no formula, no Count/Signature.
//
// FIELD NAMING (explicit correction): "Card/ID" and "Dept/Section" were
// ambiguous for Global Search — which employee-record field maps to which?
// Simplified to single, unambiguous concepts: Card No. (-> employee.cardNo
// only) and Department (-> employee.department only).
// ─────────────────────────────────────────────────────────────────────────────

import { calculateBasicFromGross, DEFAULT_BASIC_DIVISOR, DEFAULT_MONTHLY_DAYS } from '../../../utils/sharedFormulas';
import { numberToWordsEN } from '../../../utils/bnEnDate';

export type MiscBillTemplate = 'holiday' | 'adjustment' | 'festival';

/** "In Word" — Grand Total spelled out in English, reusing the same
   numberToWordsEN already used elsewhere (Maternity Bill's English bill),
   not a new implementation. */
export function grandTotalInWords(amount: number): string {
  return `${numberToWordsEN(Math.floor(amount))} Taka Only`;
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
  cardNo: string;
  designation: string;
  department: string;
  grossSalary: string;
  count: string;
  /** Only meaningful for the Adjustment template (manual entry) — Holiday
     and Festival Holiday derive their payable amount live from
     grossSalary + count instead of storing a separately-edited value. */
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
 * Basic Salary — shown dynamically (computed from Gross Salary), NOT a
 * separate stored/editable field. Same value used for display and for the
 * Festival Holiday formula below, so they can never disagree.
 */
export function calculateDynamicBasicSalary(grossSalary: string): number {
  const gross = Number(grossSalary) || 0;
  return calculateBasicFromGross(gross, 0, DEFAULT_BASIC_DIVISOR);
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
  count: string,
  manualPayableAmount: string,
): number {
  const cnt = Number(count) || 0;

  if (template === 'adjustment') {
    return Number(manualPayableAmount) || 0;
  }
  if (template === 'holiday') {
    const gross = Number(grossSalary) || 0;
    const dailyGross = gross / DEFAULT_MONTHLY_DAYS;
    return dailyGross * cnt;
  }
  // festival — dynamic basic salary, same value shown in the Basic Salary column
  const basic = calculateDynamicBasicSalary(grossSalary);
  const dailyBasic = basic / DEFAULT_MONTHLY_DAYS;
  return dailyBasic * 2 * cnt;
}

export function blankItem(slNo: number): MiscBillItem {
  return { slNo, particulars: '', name: '', cardNo: '', designation: '', department: '', grossSalary: '', count: '', manualPayableAmount: '', remarks: '' };
}

export const INITIAL_MISC_BILL_STATE: MiscBillData = {
  template: 'holiday',
  subject: '',
  date: new Date().toISOString().split('T')[0],
  items: [blankItem(1)],
  factoryName: '',
  factoryAddress: '',
};
