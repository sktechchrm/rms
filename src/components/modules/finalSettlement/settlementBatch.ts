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
  rows: EvaluatedRow[]; count: number; totalReceivable: number; totalDeductions: number; totalNet: number;
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
        errors: issues.errors.filter(e => e.field !== 'terminationType'),
        warnings: issues.warnings,
      };
    });
    const filled = rows.filter(r => !r.blank);
    return {
      key: g.key,
      typeMissing: filled.length > 0 && !g.terminationType,
      dateMissing: filled.length > 0 && !g.settlementDate,
      rows, count: filled.length,
      totalReceivable: filled.reduce((s, r) => s + r.calc.totalReceivable, 0),
      totalDeductions: filled.reduce((s, r) => s + r.calc.totalDeductions, 0),
      totalNet: filled.reduce((s, r) => s + r.calc.finalTotal, 0),
    };
  });
}

export const batchCount = (ev: EvaluatedGroup[]): number => ev.reduce((s, g) => s + g.count, 0);
export const batchHasGroupGap = (ev: EvaluatedGroup[]): boolean => ev.some(g => g.typeMissing || g.dateMissing);
export const batchHasErrors = (ev: EvaluatedGroup[]): boolean => batchHasGroupGap(ev) || ev.some(g => g.rows.some(r => !r.blank && r.errors.length > 0));

export function firstBatchErrorField(ev: EvaluatedGroup[]): string {
  for (const g of ev) {
    if (g.typeMissing) return `${g.key}:type`;
    if (g.dateMissing) return `${g.key}:date`;
    for (const r of g.rows) if (!r.blank && r.errors.length) return `${r.key}:${r.errors[0].field}`;
  }
  return '';
}

export function buildSettlementRecord(
  data: EmployeeFormData, resolved: EmployeeFormData, calc: Settlement,
  auth: Pick<AuthorizationState, 'preparedBy' | 'preparedByDesignation'>,
) {
  return {
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