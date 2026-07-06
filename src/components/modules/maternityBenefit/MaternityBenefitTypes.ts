// ─────────────────────────────────────────────────────────────────────────────
// MaternityBenefitTypes.ts
// Global types file — kept at src/types/MaternityBenefitTypes.ts
// DO NOT move or rename: imported by MaternityFormula.ts and legacy code.
//
// Changes:
//  - Added maternityLeavenoticedDate field
//  - MATERNITY_LEAVE_DAYS updated to 120 (law: ধারা ৪৭(৩))
//  - MATERNITY_LEAVE_DAYS_OFFSET: 119 added (date arithmetic offset)
// ─────────────────────────────────────────────────────────────────────────────

import type React from 'react';
import { FACTORY_ADDRESS_EN, FACTORY_ADDRESS_BN, COMPANY_OPTIONS } from '../../../factories/FactoryRegistry';

export interface MaternityFormData {
  formDate:                    string;
  companyName:                 string;
  companyAddress:              string;
  companyNameEn?:               string;
  companyAddressEn?:            string;
  employeeName:                string;
  cardNo:                      string;
  designation:                 string;
  section:                     string;
  aliveChildren:               string;
  joiningDate:                 string;
  maternitySymptomDate:        string;
  possibleDeliveryDate:        string;
  maternityLeavenoticedDate?:  string;   // ← added: ধারা ৪৭(১) notice date
  maternityLeaveStartDate:     string;
  maternityLeaveEndDate:       string;
  serviceYears:                string;
  serviceMonths:               string;
  serviceDays:                 string;
  eligibilityStatus:           string;
  currentMonth:                string;
  currentYear:                 string;
  latestMonth:                 string;
  latestYear:                  string;
  totalMonthlyWage:            string;
  dailyGross:                  string;
  benefitInstallment:          string;
  benifitDays:                 string;
  benefitAmount:               string;
  earnedLeaveDays:             string;
  otherBenefits:               string;
  otherBenefitsType:           string;
  otherBenefitsValue:          string;
  // ── Installment tracking ────────────────────────────────────────────────────
  installment1Date:            string;   // bill date when 1st payment made
  installment1Status:          string;   // 'pending' | 'paid'
  installment1Amount:          string;   // snapshot: benefit amount at time of 1st payment
  installment1Salary:          string;   // snapshot: salary at time of 1st payment
  installment1Others:          string;   // snapshot: others at time of 1st payment
  installment1OthersLabel:     string;   // snapshot: others label
  installment2Date:            string;   // bill date when 2nd payment made
  installment2Status:          string;   // 'pending' | 'paid'
  installment2Amount:          string;   // snapshot: benefit amount at time of 2nd payment
  installment2Salary:          string;   // snapshot: salary (always 0 for 2nd)
  installment2Others:          string;   // snapshot: others (always 0 for 2nd)
  installment2OthersLabel:     string;
  activeInstallment:           string;   // 'প্রথম কিস্তি' | 'দ্বিতীয় কিস্তি'
}

export interface TableProps {
  formData:     MaternityFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}


export interface CalculationTableProps extends TableProps {
  calculateTotalPayable:  () => string;
  /** Called when user confirms edit of a paid installment row. key = 'installment1'|'installment2'|'combined' */
  onInstallmentUpdate:    (key: InstallmentKey, patch: InstallmentPatch) => Promise<void>;
  /** Called when user confirms delete of a paid installment row */
  onInstallmentDelete:    (key: InstallmentKey) => Promise<void>;
}

export type InstallmentKey = 'installment1' | 'installment2' | 'combined';

export interface InstallmentPatch {
  date:        string;
  amount:      string;
  salary:      string;
  others:      string;
  othersLabel: string;
}

export const MATERNITY_CONSTANTS = {
  MATERNITY_LEAVE_DAYS:        120,   // law: 120 days total (ধারা ৪৭(৩))
  MATERNITY_LEAVE_DAYS_OFFSET: 119,   // date arithmetic offset: start + 119 = 120 days inclusive
  MONTHLY_WORKING_DAYS:        26,
  PRE_DELIVERY_DAYS:           60,
  TOTAL_MONTHLY_DAYS:          30,
  ELIGIBILITY_MONTHS:          6,
  ELIGIBILITY_ALIVE_CHILDREN:  1,
};

export const BLANK_EMPLOYEE_FIELDS: Partial<MaternityFormData> = {
  employeeName:              '',
  cardNo:                    '',
  designation:               '',
  section:                   '',
  aliveChildren:             '',
  joiningDate:               '',
  maternitySymptomDate:      '',
  possibleDeliveryDate:      '',
  maternityLeavenoticedDate: '',
  maternityLeaveStartDate:   '',
  maternityLeaveEndDate:     '',
  serviceYears:              '0',
  serviceMonths:             '0',
  serviceDays:               '0',
  eligibilityStatus:         '',
  currentMonth:              '',
  currentYear:               '',
  latestMonth:               '',
  latestYear:                '',
  totalMonthlyWage:          '',
  dailyGross:                '0',
  benefitInstallment:        '', // placeholder — কিস্তি নিশ্চিত করুন (forces active choice)
  benifitDays:               '60',
  benefitAmount:             '0.00',
  earnedLeaveDays:           '',
  otherBenefits:             '',
  otherBenefitsType:         'দিন',
  otherBenefitsValue:        '',
  installment1Date:          '',
  installment1Status:        'pending',
  installment1Amount:        '',
  installment1Salary:        '',
  installment1Others:        '',
  installment1OthersLabel:   '',
  installment2Date:          '',
  installment2Status:        'pending',
  installment2Amount:        '',
  installment2Salary:        '',
  installment2Others:        '',
  installment2OthersLabel:   '',
  activeInstallment:         'প্রথম কিস্তি',
};

export const INITIAL_FORM_STATE: MaternityFormData = {
  formDate:                  '',
  companyName:               '',
  companyAddress:            '',
  companyNameEn:             '',
  companyAddressEn:          '',
  employeeName:              '',
  cardNo:                    '',
  designation:               '',
  section:                   '',
  aliveChildren:             '',
  joiningDate:               '',
  maternitySymptomDate:      '',
  possibleDeliveryDate:      '',
  maternityLeavenoticedDate: '',
  maternityLeaveStartDate:   '',
  maternityLeaveEndDate:     '',
  serviceYears:              '0',
  serviceMonths:             '0',
  serviceDays:               '0',
  eligibilityStatus:         '',
  currentMonth:              '',
  currentYear:               '',
  latestMonth:               '',
  latestYear:                '',
  totalMonthlyWage:          '',
  dailyGross:                '0',
  benefitInstallment:        '', // placeholder — কিস্তি নিশ্চিত করুন (forces active choice)
  benifitDays:               '60',
  benefitAmount:             '0.00',
  earnedLeaveDays:           '',
  otherBenefits:             '',
  otherBenefitsType:         'দিন',
  otherBenefitsValue:        '',
  installment1Date:          '',
  installment1Status:        'pending',
  installment1Amount:        '',
  installment1Salary:        '',
  installment1Others:        '',
  installment1OthersLabel:   '',
  installment2Date:          '',
  installment2Status:        'pending',
  installment2Amount:        '',
  installment2Salary:        '',
  installment2Others:        '',
  installment2OthersLabel:   '',
  activeInstallment:         'প্রথম কিস্তি',
};

export const STATIC_DATA = {
  companyOptions: COMPANY_OPTIONS.filter(c => c.active).map(c => c.label),
  addressOptions: [FACTORY_ADDRESS_EN, FACTORY_ADDRESS_BN],
  bengaliMonths: [
    'জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
    'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর',
  ],
  benefitInstallments: [
    // Placeholder — forces an active choice instead of silently defaulting
    // to প্রথম কিস্তি. Empty value so it's programmatically distinguishable
    // from a real selection.
    { value: '',                label: 'কিস্তি নিশ্চিত করুন' },
    { value: 'প্রথম কিস্তি',    label: 'প্রথম কিস্তি (প্রসব পূর্ববর্তী ৬০ দিন)'  },
    { value: 'দ্বিতীয় কিস্তি', label: 'দ্বিতীয় কিস্তি (প্রসব পরবর্তী ৬০ দিন)' },
    { value: '১ম+২য় কিস্তি',   label: '১ম+২য় কিস্তি (একসাথে ১২০ দিন)'          },
  ],
  benefitTypes: [
    { value: 'দিন',  label: 'দিন'  },
    { value: 'টাকা', label: 'টাকা' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Installment eligibility — SINGLE SOURCE OF TRUTH.
//
// AUDIT FIX: this logic used to live only inline inside
// maternityBenefitTable.tsx's availableOptions filter. maternityBenefit.tsx's
// recordToFormData() separately just copied the raw stored benefitInstallment
// value forward with no awareness of paid status — so after the 1st
// installment was saved (installment1Status='paid'), reloading the record
// left formData.benefitInstallment = 'প্রথম কিস্তি', a value the dropdown's
// OWN filter had already hidden. Since React's <select value=...> doesn't
// force-select a hidden option, the browser fell back to showing whatever
// option happened to be first in the list — while the underlying state
// silently still held the stale, already-paid value. Clicking Save without
// touching the dropdown then matched neither the "1st" nor "2nd" save
// branch, so nothing happened at all.
//
// Both files now call these two functions instead of each keeping their own
// copy of the eligibility rules, so they can't drift apart again.
// ─────────────────────────────────────────────────────────────────────────────

export interface InstallmentEligibility {
  inst1Paid: boolean;
  inst2Paid: boolean;
  /** Both paid AND saved as one combined ১ম+২য় bill (not two separate saves). */
  isCombinedPaid: boolean;
  /** Both paid, but as two separate individual saves — nothing left to pick. */
  bothPaidIndividually: boolean;
}

export function getInstallmentEligibility(
  installment1Status: string,
  installment2Status: string,
  benefitInstallment: string,
): InstallmentEligibility {
  const inst1Paid = installment1Status === 'paid';
  const inst2Paid = installment2Status === 'paid';
  const isCombinedPaid = inst1Paid && inst2Paid && benefitInstallment === '১ম+২য় কিস্তি';
  const bothPaidIndividually = inst1Paid && inst2Paid && !isCombinedPaid;
  return { inst1Paid, inst2Paid, isCombinedPaid, bothPaidIndividually };
}

/**
 * Which benefitInstallments dropdown options should actually be shown,
 * given current paid statuses. Mirrors the exact rules previously inlined
 * in maternityBenefitTable.tsx.
 */
export function filterAvailableInstallments(
  installment1Status: string,
  installment2Status: string,
  benefitInstallment: string,
): typeof STATIC_DATA.benefitInstallments[number][] {
  const { isCombinedPaid, bothPaidIndividually } =
    getInstallmentEligibility(installment1Status, installment2Status, benefitInstallment);

  return STATIC_DATA.benefitInstallments.filter(o => {
    if (bothPaidIndividually) return false;                                     // both done individually -> hide all
    if (isCombinedPaid) return false;                                           // combined done -> hide all
    if (o.value === 'প্রথম কিস্তি' && installment1Status === 'paid'
        && installment2Status !== 'paid') return false;                        // 1st paid separately
    if (o.value === 'দ্বিতীয় কিস্তি' && installment2Status === 'paid') return false; // 2nd paid
    return true;
  });
}

/**
 * Resolves the value that should actually be pre-selected in the
 * benefitInstallment dropdown when a record is loaded — NOT just the raw
 * stored value, which may no longer be a valid choice (see the bug
 * explanation above). If the raw value is still valid given current paid
 * statuses, it's kept as-is; otherwise this advances to the correct next
 * step (currently: 1st paid + 2nd pending -> defaults to 'দ্বিতীয় কিস্তি').
 */
export function resolveDefaultInstallment(
  rawBenefitInstallment: string,
  installment1Status: string,
  installment2Status: string,
): string {
  const { isCombinedPaid, bothPaidIndividually } =
    getInstallmentEligibility(installment1Status, installment2Status, rawBenefitInstallment);

  if (bothPaidIndividually || isCombinedPaid) {
    // Nothing left to select — the dropdown itself won't be shown at all
    // (caller gates on isEligible && availableOptions.length > 0). The
    // value is moot at that point; keep the raw value for record-keeping.
    return rawBenefitInstallment;
  }
  // AUDIT FIX (explicit request, supersedes the earlier auto-advance
  // behavior below): in every other situation — brand new record, 1st
  // just paid, anything — always resolve to the placeholder ('কিস্তি
  // নিশ্চিত করুন') rather than guessing 1st/2nd/combined. The user must
  // always actively pick from the dropdown themselves.
  //
  // This also closes a real save bug: programmatically pre-setting
  // benefitInstallment (bypassing the dropdown's own onChange path) left
  // the form in a state where clicking Save silently did nothing.
  // Forcing every load through the placeholder means the ONLY way
  // benefitInstallment ever becomes a real value is via the user's own
  // onChange — the one path already confirmed to save correctly.
  //
  // Previous (now removed) auto-advance logic, kept here for reference:
  //   if (inst1Paid && !inst2Paid) return 'দ্বিতীয় কিস্তি';
  //   return rawBenefitInstallment || 'প্রথম কিস্তি';
  return '';
}
