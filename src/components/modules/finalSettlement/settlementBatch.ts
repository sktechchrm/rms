// ─────────────────────────────────────────────────────────────────────────────
// settlementBatch.ts — multi-employee calculation: one চাকরি নিষ্পত্তির ধরন (group) → many employees.
// Path: src/components/modules/finalSettlement/settlementBatch.ts
//
// A BatchGroup holds the settlement type + settlement date ONCE; every row below it is one employee.
// Each row is evaluated with the SAME computeSettlement / validateSettlement as the single form —
// nothing is calculated twice or stored twice.
//
// Batch rules (kept deliberately simple):
//   • last month / year  = the month of the row's last attendance date;
//   • payable days       = typed value, or (when empty) the day of the month of the last attendance;
//   • a row with no name, card no, dates or wage is "blank" and is ignored (not validated, not saved).
// ─────────────────────────────────────────────────────────────────────────────

import type { EmployeeFormData } from './FinalSettlementDataTypes';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { blankSettlement, computeSettlement, resolveSettlement, validateSettlement, MONTH_NAMES } from './settlementModel';
import type { Settlement, Issue } from './settlementModel';

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export interface BatchRow { key: string; f: EmployeeFormData }
export interface BatchGroup { key: string; terminationType: string; settlementDate: string; rows: BatchRow[] }

export const newRow = (): BatchRow => ({ key: uid(), f: blankSettlement() });
export const newGroup = (settlementDate: string, terminationType = '', rows?: BatchRow[]): BatchGroup =>
  ({ key: uid(), terminationType, settlementDate, rows: rows && rows.length ? rows : [newRow()] });

/**
 * The same employees for another settlement type: every entered row is copied (new keys); the inputs that only make sense
 * for one type (notice days, lay-off days, gratuity choice) are cleared, so the new type starts from clean type-specific values.
 */
export const cloneEmployeeRows = (rows: BatchRow[]): BatchRow[] =>
  rows.filter(r => !isBlankRow(r.f)).map(r => ({
    key: uid(),
    f: { ...r.f, noticePayDay: '', noticeDeductionDay: '', layOffDays: '', paymentMethod: blankSettlement().paymentMethod },
  }));

export const isBlankRow = (f: EmployeeFormData): boolean =>
  !f.employeeName.trim() && !f.cardNo.trim() && !f.joiningDate && !f.lastAttendance && !String(f.totalMonthlyWage ?? '').trim();

/** Row inputs + the group's type / date + the derived last-month fields. */
export function effectiveForm(f: EmployeeFormData, g: BatchGroup): { form: EmployeeFormData; autoPayableDay: string } {
  const form: EmployeeFormData = { ...f, terminationType: g.terminationType, settlementDate: g.settlementDate };
  let autoPayableDay = '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f.lastAttendance || '');
  if (m) {
    form.lastMonthName = MONTH_NAMES[Number(m[2]) - 1] ?? '';
    form.lastMonthYear = m[1];
    autoPayableDay = String(Number(m[3]));
    if (String(f.payableDay ?? '').trim() === '') form.payableDay = autoPayableDay;
  }
  return { form, autoPayableDay };
}

export interface EvaluatedRow {
  key: string; blank: boolean;
  form: EmployeeFormData; resolved: EmployeeFormData; calc: Settlement;
  errors: Issue[]; warnings: string[]; autoPayableDay: string;
}
export interface EvaluatedGroup {
  key: string; typeMissing: boolean; dateMissing: boolean;
  rows: EvaluatedRow[]; count: number; totalGross: number; totalReceivable: number; totalDeductions: number; totalNet: number;
}

export function evaluateBatch(groups: BatchGroup[]): EvaluatedGroup[] {
  return groups.map(g => {
    const rows: EvaluatedRow[] = g.rows.map(r => {
      const { form, autoPayableDay } = effectiveForm(r.f, g);
      const calc = computeSettlement(form);
      const blank = isBlankRow(r.f);
      const issues = blank ? { errors: [], warnings: [] } : validateSettlement(form, calc);
      return {
        key: r.key, blank, form, calc, resolved: resolveSettlement(form, calc), autoPayableDay,
        errors: issues.errors.filter(e => e.field !== 'terminationType'),   // the type is a group-level field here
        warnings: issues.warnings,
      };
    });
    const filled = rows.filter(r => !r.blank);
    return {
      key: g.key,
      typeMissing: filled.length > 0 && !g.terminationType,
      dateMissing: filled.length > 0 && !g.settlementDate,
      rows, count: filled.length,
      totalGross: filled.reduce((s, r) => s + (parseFloat(r.form.totalMonthlyWage) || 0), 0),
      totalReceivable: filled.reduce((s, r) => s + r.calc.totalReceivable, 0),
      totalDeductions: filled.reduce((s, r) => s + r.calc.totalDeductions, 0),
      totalNet: filled.reduce((s, r) => s + r.calc.finalTotal, 0),
    };
  });
}

export const batchCount = (ev: EvaluatedGroup[]): number => ev.reduce((s, g) => s + g.count, 0);
export const batchHasGroupGap = (ev: EvaluatedGroup[]): boolean => ev.some(g => g.typeMissing || g.dateMissing);
export const batchHasErrors = (ev: EvaluatedGroup[]): boolean => batchHasGroupGap(ev) || ev.some(g => g.rows.some(r => !r.blank && r.errors.length > 0));

/** `data-field` value of the first invalid field (for scroll + focus), or ''. */
export function firstBatchErrorField(ev: EvaluatedGroup[]): string {
  for (const g of ev) {
    if (g.typeMissing) return `${g.key}:type`;
    if (g.dateMissing) return `${g.key}:date`;
    for (const r of g.rows) if (!r.blank && r.errors.length) return `${r.key}:${r.errors[0].field}`;
  }
  return '';
}

/** Next batch number of the day: B<yyyymmdd>-01, -02 … (continues after the highest one already saved). */
export function nextBatchNo(existing: string[], iso: string): string {
  const prefix = `B${iso.replace(/-/g, '').slice(0, 8)}-`;
  const top = existing.filter(x => x.startsWith(prefix)).reduce((m, x) => Math.max(m, parseInt(x.slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(top + 1).padStart(2, '0')}`;
}

/** The saved sheet row — used by BOTH the single form and the batch, so the two can never drift apart. */
export function buildSettlementRecord(
  data: EmployeeFormData, resolved: EmployeeFormData, calc: Settlement,
  auth: Pick<AuthorizationState, 'preparedBy' | 'preparedByDesignation'>,
  /** Set by the multi-employee Save: every employee saved together carries the same batch, so the Statement can show them as one set. */
  batch?: { id: string; no: string },
) {
  return {
    ...(batch ? { batchId: batch.id, batchNo: batch.no } : {}),
    employeeName: data.employeeName.trim(), cardNo: data.cardNo, designation: data.designation, section: data.section,
    joiningDate: data.joiningDate, lastAttendance: data.lastAttendance, settlementDate: data.settlementDate, terminationType: data.terminationType,
    serviceYears: resolved.serviceYears, serviceMonths: resolved.serviceMonths, serviceDays: resolved.serviceDays, benefitYears: resolved.benefitYears,
    totalDays: resolved.totalDays, absentDays: data.absentDays,
    totalWage: data.totalMonthlyWage, basicWage: resolved.basicWage, houseRent: resolved.houseRent,
    foodAllowance: data.foodAllowance, medicalAllowance: data.medicalAllowance, transportAllowance: data.transportAllowance,
    dailyBasic: resolved.dailyBasic, dailyGross: resolved.dailyGross,
    elQty: data.elQty, noticePayDay: data.noticePayDay, noticeDeductionDay: data.noticeDeductionDay, payableDay: data.payableDay, payableHours: data.payableHours,
    lastMonthName: data.lastMonthName, lastMonthYear: data.lastMonthYear,
    earnedLeave: resolved.earnedLeave, serviceCompensation: resolved.serviceCompensation, deathCompensation: resolved.deathCompensation,
    layOffDays: data.layOffDays ?? '', layOffCompensation: resolved.layOffCompensation, gratuityAmount: resolved.gratuityAmount,
    gratuityDaysPerYear: resolved.gratuityDaysPerYear, paymentMethod: resolved.paymentMethod,
    noticePay: resolved.noticePay, lastMonthSalary: resolved.lastMonthSalary, lastMonthOvertime: resolved.lastMonthOvertime,
    others: data.others, otherBenefits: data.otherBenefits ?? '', serviceCompDaysPerYear: resolved.serviceCompDaysPerYear, DeathCompensationDaysPerYear: resolved.DeathCompensationDaysPerYear,
    advanceDeduction: data.advanceDeduction, deductionForAdvance: data.deductionForAdvance ?? '', noticeDeduction: resolved.noticeDeduction,
    otherDeduction: data.otherDeduction, deductionParticularsB: data.deductionParticularsB ?? '', totalDeductions: resolved.totalDeductions,
    totalReceivable: calc.totalReceivable.toFixed(2), finalTotal: String(calc.finalTotal),
    paymentStatus: data.paymentStatus ?? '', paymentDate: data.paymentDate || calc.otherDueDate || '',
    salaryPaymentDate: data.salaryPaymentDate || calc.salaryDueDate || '',
    preparedBy: auth.preparedBy, preparedByDesignation: auth.preparedByDesignation,
  };
}