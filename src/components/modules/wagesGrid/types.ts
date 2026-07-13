// ─────────────────────────────────────────────────────────────────────────────
// Wages Grid — types
// Path: src/components/modules/wagesGrid/types.ts
//
// Tracks the OFFICIAL, government-gazetted grade wage structure (per the
// earlier verified research: Bangladesh RMG minimum wage gazette, 2023 —
// তফসিল-ক for শ্রমিক/workers, 4 grades; তফসিল-খ for করণিক/staff, 4
// separate grades), and checks actual employee wages against it.
//
// This is NOT the same thing as the RegulatoryBundle system (which holds
// the CALCULATION constants — basicDivisor, houseRentPercentage etc. —
// used by formulas across the app). This module is the actual GRADE
// TABLE itself (each grade's specific basic/allowances/gross) plus a
// compliance check against real employee records — matching Living
// Wage's Wage Gap Report pattern, not duplicating its logic.
//
// One record = one grade definition (fixed form, matches Left Employee
// Notice's / Legal Document's save model).
// ─────────────────────────────────────────────────────────────────────────────

export type ScheduleType = 'তফসিল-ক (শ্রমিক)' | 'তফসিল-খ (করণিক)';
export const SCHEDULE_TYPE_OPTIONS: ScheduleType[] = ['তফসিল-ক (শ্রমিক)', 'তফসিল-খ (করণিক)'];

export interface GradeDefinitionData {
  gradeName: string;
  scheduleType: ScheduleType;
  basicWage: string;
  houseRentAllowance: string;
  medicalAllowance: string;
  conveyanceAllowance: string;
  foodAllowance: string;
  effectiveDate: string;
  gazetteReference: string;
  remarks: string;

  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankGradeDefinition(): GradeDefinitionData {
  return {
    gradeName: '', scheduleType: 'তফসিল-ক (শ্রমিক)',
    basicWage: '', houseRentAllowance: '', medicalAllowance: '750', conveyanceAllowance: '450', foodAllowance: '1250',
    effectiveDate: '', gazetteReference: '',
    remarks: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_GRADE_STATE: GradeDefinitionData = blankGradeDefinition();

/** Gross = basic + house rent + medical + conveyance + food. */
export function calculateGrossFromGrade(data: GradeDefinitionData): number {
  return (Number(data.basicWage) || 0)
    + (Number(data.houseRentAllowance) || 0)
    + (Number(data.medicalAllowance) || 0)
    + (Number(data.conveyanceAllowance) || 0)
    + (Number(data.foodAllowance) || 0);
}

/** House rent auto-suggestion — 50% of basic, matching the RMG_BUNDLE's
   houseRentPercentage (0.5) already established elsewhere in this app.
   A suggestion only — the field itself stays freely editable, since a
   factory's actual gazette-matching figure should always win over an
   auto-calc if they differ. */
export function suggestHouseRent(basicWage: string): string {
  const basic = Number(basicWage) || 0;
  if (basic <= 0) return '';
  return (basic * 0.5).toFixed(2);
}

export interface WageComplianceResult {
  employeeName: string;
  cardNo: string;
  grade: string;
  actualGross: number;
  gridGross: number;
  gapAmount: number;    // gridGross - actualGross; positive = shortfall
  gapPercent: number;
  isCompliant: boolean; // actualGross >= gridGross
  gradeFound: boolean;  // false if the employee's grade has no matching grid entry
}

export function calculateCompliance(
  employeeName: string, cardNo: string, grade: string, actualGross: number,
  gridGross: number | null,
): WageComplianceResult {
  if (gridGross === null) {
    return { employeeName, cardNo, grade, actualGross, gridGross: 0, gapAmount: 0, gapPercent: 0, isCompliant: true, gradeFound: false };
  }
  const gapAmount = gridGross - actualGross;
  const gapPercent = gridGross > 0 ? (gapAmount / gridGross) * 100 : 0;
  return {
    employeeName, cardNo, grade, actualGross, gridGross, gapAmount, gapPercent,
    isCompliant: actualGross >= gridGross,
    gradeFound: true,
  };
}
