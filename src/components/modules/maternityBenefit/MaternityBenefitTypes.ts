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
  // REDESIGN (2nd round): currentMonth/currentYear/earnedLeaveDays/
  // otherBenefits/otherBenefitsType/otherBenefitsValue moved INTO
  // MaternityInstallment (see below) — these used to be single shared
  // fields here, meaning whatever was entered while on প্রথম কিস্তি was
  // still sitting there when switching to দ্বিতীয় কিস্তি. Now each
  // installment has its own independent copy. latestMonth/latestYear
  // stay here — that's the wage-history section, a genuinely shared,
  // not-installment-specific concept.
  latestMonth:                 string;
  latestYear:                  string;
  totalMonthlyWage:            string;
  dailyGross:                  string;
  benifitDays:                 string;
  benefitAmount:               string;
  // ── Installment tracking (REDESIGN) ─────────────────────────────────────────
  // Replaces the old installment1*/installment2* flat-field pairs (12 fields)
  // plus the separate benefitInstallment/activeInstallment duplication — the
  // exact source of several bugs fixed earlier in this module (stale dropdown
  // defaults, mismatched tab/content, duplicated 2nd-installment amounts,
  // "()" showing empty). One array, one active-type field, single source of
  // truth. Matches the array-of-objects pattern already used by Requisition
  // (items[]) and Increment Bill (employees[]).
  installments:                MaternityInstallment[];
  // Unified dropdown-selection + display-driver field (was two separate
  // fields: benefitInstallment for the dropdown, activeInstallment for
  // display — kept in sync by an effect that was itself a source of bugs).
  // Empty string = placeholder ("কিস্তি নিশ্চিত করুন") — always the default
  // on load, per the "always require active confirmation" rule.
  activeInstallmentType:       string;
}

export interface MaternityInstallment {
  type:        'প্রথম কিস্তি' | 'দ্বিতীয় কিস্তি' | '১ম+২য় কিস্তি';
  status:      'pending' | 'paid';
  date:        string;
  amount:      string;
  salary:      string;
  others:      string;
  othersLabel: string;
  // REDESIGN (2nd round, explicit request): these raw inputs used to be
  // single SHARED fields at the top level of MaternityFormData — meaning
  // whatever was entered while working on প্রথম কিস্তি would still be
  // sitting there if you switched to দ্বিতীয় কিস্তি, effectively
  // "inheriting" values across installments. Now each installment has its
  // own independent copy: selecting a different installment that has no
  // entry yet starts genuinely empty, since salary/others is a per-
  // installment management decision, not fixed to always be 1st-only.
  earnedLeaveDays:    string;
  currentMonth:       string;
  currentYear:        string;
  otherBenefitsValue: string;
  otherBenefitsType:  string;
  // AUDIT FIX (correction): "প্রাপ্য অর্জিত ছুটি" was WRONGLY bound to the
  // SAME earnedLeaveDays field used by বর্তমান মাস — meaning typing in
  // either row filled the other, which is not what was asked for. This is
  // a genuinely SEPARATE, independent value — its own field entirely.
  payableEarnedLeaveDays: string;
}

export interface TableProps {
  formData:     MaternityFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}


export interface CalculationTableProps extends TableProps {
  calculateTotalPayable:  () => string;
  // REDESIGN (2nd round, explicit request): onInstallmentUpdate/
  // onInstallmentDelete removed — কিস্তি ব্যবস্থাপনা no longer has ✏️/🗑
  // buttons; it's a read-only history log now. All edits go through the
  // main form fields below, saved via the main Save button.
  /** Updates one field of whichever installment is CURRENTLY selected
     (formData.activeInstallmentType) — creates a draft entry if none
     exists yet for that type. */
  onInstallmentFieldChange: (field: keyof MaternityInstallment, value: string) => void;
}

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
  latestMonth:               '',
  latestYear:                '',
  totalMonthlyWage:          '',
  dailyGross:                '0',
  benifitDays:               '60',
  benefitAmount:             '0.00',
  // REDESIGN: replaces all 12 installment1*/installment2* flat fields,
  // plus currentMonth/currentYear/earnedLeaveDays/otherBenefits* (now
  // per-installment) — starts empty; populated once an installment is
  // actually saved (or as soon as the user starts editing its fields).
  installments:              [],
  // placeholder — কিস্তি নিশ্চিত করুন (forces active choice, replaces both
  // the old benefitInstallment and activeInstallment fields)
  activeInstallmentType:     '',
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
  latestMonth:               '',
  latestYear:                '',
  totalMonthlyWage:          '',
  dailyGross:                '0',
  benifitDays:               '60',
  benefitAmount:             '0.00',
  // REDESIGN: replaces all 12 installment1*/installment2* flat fields,
  // plus currentMonth/currentYear/earnedLeaveDays/otherBenefits* (now
  // per-installment) — starts empty; populated once an installment is
  // actually saved (or as soon as the user starts editing its fields).
  installments:              [],
  // placeholder — কিস্তি নিশ্চিত করুন (forces active choice, replaces both
  // the old benefitInstallment and activeInstallment fields)
  activeInstallmentType:     '',
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
// Installment tracking — SINGLE SOURCE OF TRUTH.
//
// REDESIGN (2nd round, explicit request): the dropdown no longer hides
// already-paid options. Editing now happens by selecting ANY installment
// (paid or not) — its existing data (if any) loads into the সুবিধার হিসাব
// form fields directly, editable there, saved via the main Save button.
// কিস্তি ব্যবস্থাপনা becomes a read-only history log (no ✏️/🗑 there
// anymore) — see maternityBenefitTable.tsx.
// ─────────────────────────────────────────────────────────────────────────────

export interface InstallmentEligibility {
  inst1Paid: boolean;
  inst2Paid: boolean;
  isCombinedPaid: boolean;
}

export function getInstallmentEligibility(installments: MaternityInstallment[]): InstallmentEligibility {
  const inst1Paid = installments.some(i => i.type === 'প্রথম কিস্তি' && i.status === 'paid');
  const inst2Paid = installments.some(i => i.type === 'দ্বিতীয় কিস্তি' && i.status === 'paid');
  const isCombinedPaid = installments.some(i => i.type === '১ম+২য় কিস্তি' && i.status === 'paid');
  return { inst1Paid, inst2Paid, isCombinedPaid };
}

/**
 * REDESIGN: the dropdown now ALWAYS shows all options — no more hiding
 * based on paid status, since revisiting an already-paid installment to
 * edit it is now the intended flow (via the main form + Save, not কিস্তি
 * ব্যবস্থাপনা). Kept as a named function (rather than inlining
 * STATIC_DATA.benefitInstallments directly at each call site) purely for
 * discoverability / a single place to change this rule again later.
 */
export function filterAvailableInstallments(
  _installments: MaternityInstallment[],
): typeof STATIC_DATA.benefitInstallments[number][] {
  return STATIC_DATA.benefitInstallments;
}

/**
 * Always resolves to the placeholder ('কিস্তি নিশ্চিত করুন') — per explicit
 * request, the dropdown must NEVER auto-select 1st/2nd/combined, even when
 * the next logical step seems obvious. The user always actively picks.
 */
export function resolveDefaultInstallment(_installments: MaternityInstallment[]): string {
  return '';
}

/**
 * Builds installments[] from a raw saved record's installmentsJson column.
 * Per explicit request, no legacy-field migration is needed (existing
 * pre-redesign data doesn't need to carry forward) — this simply parses
 * the JSON, defaulting to an empty array for anything malformed/missing.
 */
export function buildInstallmentsFromRecord(rec: Record<string, unknown>): MaternityInstallment[] {
  const rawJson = rec.installmentsJson;
  if (typeof rawJson === 'string' && rawJson.trim()) {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) return parsed as MaternityInstallment[];
    } catch {
      // malformed JSON — fall through to empty array
    }
  }
  return [];
}

/** A blank draft — used whenever the currently-selected installment type
 *  has no saved entry yet, so its fields start genuinely empty rather than
 *  inheriting anything from another installment. */
export function blankInstallmentDraft(type: string): MaternityInstallment {
  return {
    type: type as MaternityInstallment['type'],
    status: 'pending',
    date: '', amount: '', salary: '', others: '', othersLabel: '',
    earnedLeaveDays: '', currentMonth: '', currentYear: '',
    otherBenefitsValue: '', otherBenefitsType: 'দিন',
    payableEarnedLeaveDays: '',
  };
}

/**
 * Returns the data for whichever installment type is CURRENTLY selected —
 * either its existing saved/draft entry, or a fresh blank draft if none
 * exists yet. This is what the সুবিধার হিসাব form fields read from.
 */
export function getActiveInstallmentDraft(
  installments: MaternityInstallment[],
  activeType: string,
): MaternityInstallment {
  const existing = installments.find(i => i.type === activeType);
  return existing || blankInstallmentDraft(activeType);
}

/**
 * Updates ONE field of the currently-active installment — finds the
 * existing array entry for activeType and patches it, or creates a new
 * draft entry (from blankInstallmentDraft) if none exists yet. Returns a
 * NEW array (does not mutate the input), matching the immutable-update
 * pattern already used by Requisition/Increment Bill's per-item edits.
 */
export function updateActiveInstallmentField(
  installments: MaternityInstallment[],
  activeType: string,
  field: keyof MaternityInstallment,
  value: string,
): MaternityInstallment[] {
  const idx = installments.findIndex(i => i.type === activeType);
  if (idx >= 0) {
    const updated = [...installments];
    updated[idx] = { ...updated[idx], [field]: value };
    return updated;
  }
  const draft = blankInstallmentDraft(activeType);
  return [...installments, { ...draft, [field]: value }];
}
