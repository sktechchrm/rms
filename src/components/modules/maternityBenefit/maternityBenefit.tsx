// ─────────────────────────────────────────────────────────────────────────────
// maternityBenefit.tsx
//
// Sidebar bill dropdown logic (per spec):
//
//  Saved state                                    → BN subItems       EN subItems
//  ─────────────────────────────────────────────────────────────────────────────
//  অধিকারী নয়                                    → no dropdown       no dropdown
//  installment1Status=paid, installment2Status=pending → [১ম কিস্তি]  [1st Inst.]
//  BOTH paid                                      → [১ম কিস্তি][২য়] [1st][2nd]
//  benefitInstallment='১ম+২য় কিস্তি'             → [১ম+২য় কিস্তি]  [1st+2nd Inst.]
//
// Calculate tab formDate editability (per spec):
//
//  Selected option   formDate             salary    others
//  ─────────────────────────────────────────────────────────
//  ১ম কিস্তি        Fixed on first save  Editable  Editable
//  দ্বিতীয় কিস্তি  Blank/editable       Hidden    Hidden
//  ১ম+২য় কিস্তি    Editable             Editable  Editable
//
// Total payable formula (per spec):
//  ১ম কিস্তি    → 60  × dailyGross + salary + others
//  দ্বিতীয়     → 60  × dailyGross only
//  ১ম+২য়       → 120 × dailyGross + salary + others
//  অধিকারী নয় → salary + others only
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useFactory }            from '../../../hooks/useFactory';
import { useAuth }               from '../../../context/AuthContext';
import { useDatabase }         from '../../../hooks/useDatabase';
import { MaternityFormula }      from './MaternityFormula';
import { toDateInput }           from '../../../utils/dateUtils';
import type { MaternityFormData, MaternityInstallment } from './MaternityBenefitTypes';
import {
  INITIAL_FORM_STATE,
  BLANK_EMPLOYEE_FIELDS,
  MATERNITY_CONSTANTS,
  resolveDefaultInstallment,
  buildInstallmentsFromRecord,
  getInstallmentEligibility,
  getActiveInstallmentDraft,
  updateActiveInstallmentField,
} from './MaternityBenefitTypes';
import {
  EmployeeInfoTable,
  ServiceDurationTable,
  WageTable,
  BenefitCalculationTable,
} from './maternityBenefitTable';
import MaternityBenefitBill from './maternityBill';
import type { MaternityBillHandle } from './maternityBill';
import ModuleShell               from '../../shell/ModuleShell';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'employee',  label: 'কর্মীর তথ্য',           icon: 'ti-user-circle',    fieldCount: 5 },
  { id: 'service',   label: 'সেবার মেয়াদ ও যোগ্যতা', icon: 'ti-calendar-stats', fieldCount: 8 },
  { id: 'wage',      label: 'মজুরির বিবরণ',           icon: 'ti-cash',           fieldCount: 3 },
  { id: 'calculate', label: 'সুবিধার হিসাব',          icon: 'ti-calculator',     fieldCount: 5 },
];

// ── recordToFormData ──────────────────────────────────────────────────────────

function recordToFormData(
  rec: Record<string, unknown>,
  prev: MaternityFormData,
): MaternityFormData {
  return {
    ...prev,
    employeeName:              String(rec.employeeName              || ''),
    cardNo:                    String(rec.cardNo                    || ''),
    designation:               String(rec.designation               || ''),
    section:                   String(rec.department                || rec.section || ''),
    aliveChildren:             String(rec.aliveChildren             || ''),
    joiningDate:               toDateInput(rec.joiningDate),
    maternitySymptomDate:      toDateInput(rec.maternitySymptomDate),
    possibleDeliveryDate:      toDateInput(rec.deliveryDate         || rec.possibleDeliveryDate),
    maternityLeavenoticedDate: toDateInput(rec.maternityLeavenoticedDate),
    maternityLeaveStartDate:   toDateInput(rec.leaveStartDate       || rec.maternityLeaveStartDate),
    maternityLeaveEndDate:     toDateInput(rec.leaveEndDate         || rec.maternityLeaveEndDate),
    serviceYears:              String(rec.serviceYears              || '0'),
    serviceMonths:             String(rec.serviceMonths             || '0'),
    serviceDays:               String(rec.serviceDays              || '0'),
    eligibilityStatus:         String(rec.eligibilityStatus         || ''),
    totalMonthlyWage:          String(rec.monthlyWage               || rec.totalMonthlyWage || ''),
    dailyGross:                String(rec.dailyGross               || '0'),
    benifitDays:               String(rec.benifitDays              || '60'),
    benefitAmount:             String(rec.benefitAmount            || '0.00'),
    // REDESIGN (2nd round): currentMonth/currentYear/earnedLeaveDays/
    // otherBenefits* moved into each installments[] entry — not read here
    // anymore, since they're no longer single shared top-level fields.
    latestMonth:               String(rec.latestMonth              || ''),
    latestYear:                String(rec.latestYear               || ''),
    // REDESIGN: replaces the 12 flat installment1*/installment2* fields plus
    // the separate benefitInstallment/activeInstallment duplication.
    // buildInstallmentsFromRecord() reads the new installmentsJson column if
    // present, else reconstructs from the old flat columns (migration
    // support for records saved before this redesign).
    installments:              buildInstallmentsFromRecord(rec),
    // Always the placeholder on load — per explicit request, never
    // auto-select 1st/2nd/combined even when it seems obvious.
    activeInstallmentType:     resolveDefaultInstallment(buildInstallmentsFromRecord(rec)),
    // formDate: restored from saved record only if installment1Status is paid
    // (first save locks it; subsequent edit keeps the original)
    formDate: toDateInput(rec.formDate) || prev.formDate || new Date().toISOString().split('T')[0],
  };
}

// ── Sidebar bill items builder ────────────────────────────────────────────────
// Spec table:
//
//  Saved state                                     BN subItems          EN subItems
//  ──────────────────────────────────────────────────────────────────────────────
//  অধিকারী নয়                                     (no dropdown)        (no dropdown)
//  inst1=paid AND inst2=pending                    [১ম কিস্তি]         [1st Inst.]
//  inst1=paid AND inst2=paid                       [১ম কিস্তি][২য়]    [1st][2nd]
//  benefitInstallment = '১ম+২য় কিস্তি'            [১ম+২য় কিস্তি]     [1st+2nd Inst.]

function buildBillItems(
  formData: MaternityFormData,
  activeInstallment: string,
  setActiveInstallment: (v: string) => void,
  setBillLang: (l: 'bn' | 'en') => void,
  setActiveStep: (s: string) => void,
) {
  const isEligible   = formData.eligibilityStatus === 'অধিকারী';
  const { inst1Paid, inst2Paid } = getInstallmentEligibility(formData.installments);
  // isCombined reflects the CURRENT dropdown selection (activeInstallmentType),
  // not just already-paid status — this lets the sidebar preview the combined
  // layout even before saving, same as the original behavior (which read the
  // old benefitInstallment field for the same purpose).
  const isCombined   = formData.activeInstallmentType === '১ম+২য় কিস্তি'
    || formData.installments.some(i => i.type === '১ম+২য় কিস্তি' && i.status === 'paid');

  // অধিকারী নয় — direct click, no dropdown
  if (!isEligible) {
    return [
      {
        label:   'বাংলা বিল',
        onClick: () => { setBillLang('bn'); setActiveStep('bill-bn'); },
      },
      {
        label:   'English Bill',
        onClick: () => { setBillLang('en'); setActiveStep('bill-en'); },
      },
    ];
  }

  // Combined bill — one sub-item each
  if (isCombined) {
    return [
      {
        label:   'বাংলা বিল',
        onClick: () => { setBillLang('bn'); setActiveStep('bill-bn'); },
        subItems: [
          {
            label:   '১ম+২য় কিস্তি',
            active:  activeInstallment === '১ম+২য় কিস্তি',
            onClick: () => setActiveInstallment('১ম+২য় কিস্তি'),
          },
        ],
      },
      {
        label:   'English Bill',
        onClick: () => { setBillLang('en'); setActiveStep('bill-en'); },
        subItems: [
          {
            label:   '1st+2nd Inst.',
            active:  activeInstallment === '১ম+২য় কিস্তি',
            onClick: () => setActiveInstallment('১ম+২য় কিস্তি'),
          },
        ],
      },
    ];
  }

  // inst1 paid + inst2 pending → show only 1st installment sub-item
  if (inst1Paid && !inst2Paid) {
    return [
      {
        label:   'বাংলা বিল',
        onClick: () => { setBillLang('bn'); setActiveStep('bill-bn'); },
        subItems: [
          {
            label:   '১ম কিস্তি',
            active:  activeInstallment === 'প্রথম কিস্তি',
            onClick: () => setActiveInstallment('প্রথম কিস্তি'),
          },
        ],
      },
      {
        label:   'English Bill',
        onClick: () => { setBillLang('en'); setActiveStep('bill-en'); },
        subItems: [
          {
            label:   '1st Inst.',
            active:  activeInstallment === 'প্রথম কিস্তি',
            onClick: () => setActiveInstallment('প্রথম কিস্তি'),
          },
        ],
      },
    ];
  }

  // Both paid → show both sub-items
  if (inst1Paid && inst2Paid) {
    return [
      {
        label:   'বাংলা বিল',
        onClick: () => { setBillLang('bn'); setActiveStep('bill-bn'); },
        subItems: [
          {
            label:   '১ম কিস্তি',
            active:  activeInstallment === 'প্রথম কিস্তি',
            onClick: () => setActiveInstallment('প্রথম কিস্তি'),
          },
          {
            label:   '২য় কিস্তি',
            active:  activeInstallment === 'দ্বিতীয় কিস্তি',
            onClick: () => setActiveInstallment('দ্বিতীয় কিস্তি'),
          },
        ],
      },
      {
        label:   'English Bill',
        onClick: () => { setBillLang('en'); setActiveStep('bill-en'); },
        subItems: [
          {
            label:   '1st Inst.',
            active:  activeInstallment === 'প্রথম কিস্তি',
            onClick: () => setActiveInstallment('প্রথম কিস্তি'),
          },
          {
            label:   '2nd Inst.',
            active:  activeInstallment === 'দ্বিতীয় কিস্তি',
            onClick: () => setActiveInstallment('দ্বিতীয় কিস্তি'),
          },
        ],
      },
    ];
  }

  // Default (nothing paid yet) — both sub-items
  return [
    {
      label:   'বাংলা বিল',
      onClick: () => { setBillLang('bn'); setActiveStep('bill-bn'); },
      subItems: [
        {
          label:   '১ম কিস্তি',
          active:  activeInstallment === 'প্রথম কিস্তি',
          onClick: () => setActiveInstallment('প্রথম কিস্তি'),
        },
        {
          label:   '২য় কিস্তি',
          active:  activeInstallment === 'দ্বিতীয় কিস্তি',
          onClick: () => setActiveInstallment('দ্বিতীয় কিস্তি'),
        },
      ],
    },
    {
      label:   'English Bill',
      onClick: () => { setBillLang('en'); setActiveStep('bill-en'); },
      subItems: [
        {
          label:   '1st Inst.',
          active:  activeInstallment === 'প্রথম কিস্তি',
          onClick: () => setActiveInstallment('প্রথম কিস্তি'),
        },
        {
          label:   '2nd Inst.',
          active:  activeInstallment === 'দ্বিতীয় কিস্তি',
          onClick: () => setActiveInstallment('দ্বিতীয় কিস্তি'),
        },
      ],
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

const DisplayMaternityBenefit: React.FC = () => {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets  = useDatabase('maternity', factory.id, user?.name ?? 'unknown');
  const billRef = useRef<MaternityBillHandle>(null);

  const [auth,              setAuth]              = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,        setActiveStep]        = useState('employee');
  const [billLang,          setBillLang]          = useState<'bn' | 'en'>('bn');
  // REDESIGN: the separate activeInstallment local state (kept in sync with
  // formData.benefitInstallment by an effect below) is GONE — it was the
  // structural cause of the "১ম কিস্তি tab active but ২য় কিস্তি content
  // shown" bug: two pieces of state meaning almost the same thing, updated
  // through two different paths, that could drift apart. Now there's only
  // formData.activeInstallmentType — the sidebar tab and the bill content
  // both read this one field directly, so they can't disagree.

  const [formData, setFormData] = useState<MaternityFormData>({
    ...INITIAL_FORM_STATE,
    formDate: new Date().toISOString().split('T')[0],
  });

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setFormData(p => ({
      ...INITIAL_FORM_STATE,
      ...BLANK_EMPLOYEE_FIELDS,
      companyName:      p.companyName,
      companyAddress:   p.companyAddress,
      companyNameEn:    p.companyNameEn,
      companyAddressEn: p.companyAddressEn,
      formDate:       new Date().toISOString().split('T')[0],
    }));
    setActiveStep('employee');
    sheets.setEditingId(null);
  };

  // ── Auto-fill factory ─────────────────────────────────────────────────────
  useEffect(() => {
    setFormData(p => ({
      ...p,
      companyName:      factory.nameBn,
      companyAddress:   factory.addressBn,
      companyNameEn:    factory.nameEn,
      companyAddressEn: factory.addressEn,
      formDate:       p.formDate || new Date().toISOString().split('T')[0],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  // ── activeInstallmentType → benifitDays sync ──────────────────────────────
  // REDESIGN: this used to ALSO sync a separate activeInstallment state
  // (see removal note above) — that part is gone. Only benifitDays (a
  // genuinely derived value: 120 for combined, 60 otherwise) still needs
  // deriving from the selection.
  useEffect(() => {
    const inst = formData.activeInstallmentType;
    const days = inst === '১ম+২য় কিস্তি' ? '120' : '60';
    setFormData(p => ({ ...p, benifitDays: days }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.activeInstallmentType]);

  // ── Auto-calculations ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!formData.possibleDeliveryDate) return;
    const delivery = new Date(formData.possibleDeliveryDate);
    if (isNaN(delivery.getTime())) return;

    const start = new Date(delivery);
    start.setDate(start.getDate() - (MATERNITY_CONSTANTS.PRE_DELIVERY_DAYS - 1));
    const startStr = start.toISOString().split('T')[0];

    const end = new Date(start);
    end.setDate(end.getDate() + MATERNITY_CONSTANTS.MATERNITY_LEAVE_DAYS_OFFSET);
    const endStr = end.toISOString().split('T')[0];

    setFormData(p => ({
      ...p,
      maternityLeaveStartDate: startStr,
      maternityLeaveEndDate:   endStr,
    }));
  }, [formData.possibleDeliveryDate]);

  useEffect(() => {
    if (formData.joiningDate && formData.possibleDeliveryDate) {
      const { years, months, days } = MaternityFormula.calculateServiceDuration(
        formData.joiningDate, formData.possibleDeliveryDate,
      );
      setFormData(p => ({
        ...p,
        serviceYears:      String(years),
        serviceMonths:     String(months),
        serviceDays:       String(days),
        eligibilityStatus: MaternityFormula.checkCombinedEligibility(
          years, months, parseInt(formData.aliveChildren) || 0
        ),
      }));
    }
  }, [formData.joiningDate, formData.possibleDeliveryDate, formData.aliveChildren]);

  useEffect(() => {
    setFormData(p => ({ ...p, dailyGross: MaternityFormula.calculateDailyGross(p.totalMonthlyWage) }));
  }, [formData.totalMonthlyWage]);

  // benefitAmount = benifitDays × dailyGross (used in calc table display)
  useEffect(() => {
    setFormData(p => ({ ...p, benefitAmount: MaternityFormula.calculateBenefitAmount(p.benifitDays, p.dailyGross) }));
  }, [formData.benifitDays, formData.dailyGross]);

  // ── Derived total ─────────────────────────────────────────────────────────
  const totalPayable = () => MaternityFormula.calculateTotalPayable(formData);

  // ── Build DB record ───────────────────────────────────────────────────────
  const buildRecord = () => ({
    employeeName:              formData.employeeName,
    cardNo:                    formData.cardNo,
    designation:               formData.designation,
    department:                formData.section,
    joiningDate:               formData.joiningDate,
    deliveryDate:              formData.possibleDeliveryDate,
    leaveStartDate:            formData.maternityLeaveStartDate,
    leaveEndDate:              formData.maternityLeaveEndDate,
    maternitySymptomDate:      formData.maternitySymptomDate,
    maternityLeavenoticedDate: formData.maternityLeavenoticedDate,
    aliveChildren:             formData.aliveChildren,
    serviceYears:              formData.serviceYears,
    serviceMonths:             formData.serviceMonths,
    serviceDays:               formData.serviceDays,
    eligibilityStatus:         formData.eligibilityStatus,
    monthlyWage:               formData.totalMonthlyWage,
    dailyGross:                formData.dailyGross,
    benifitDays:               formData.benifitDays,
    benefitAmount:             formData.benefitAmount,
    latestMonth:               formData.latestMonth,
    latestYear:                formData.latestYear,
    // REDESIGN (2nd round): replaces the 12 flat installment1*/installment2*
    // fields AND currentMonth/currentYear/earnedLeaveDays/otherBenefits* —
    // same JSON-blob pattern already used by Requisition (itemsJson) and
    // Increment Bill (employeesJson). Per explicit request, no legacy-field
    // fallback is needed (existing pre-redesign data doesn't need to carry
    // forward) — only this JSON column is written or read going forward.
    installmentsJson:          JSON.stringify(formData.installments),
    activeInstallmentType:     formData.activeInstallmentType,
    totalPayable:              totalPayable(),
    formDate:                  formData.formDate,
  });

  const isBill = activeStep.startsWith('bill');

  // ── Installment update handler ────────────────────────────────────────────
  // Inline-edit a paid installment row → partial update to the same DB record
  // REDESIGN (2nd round, explicit request): handleInstallmentUpdate/
  // handleInstallmentDelete and resetAfterInstallmentAction are REMOVED —
  // কিস্তি ব্যবস্থাপনা no longer has ✏️/🗑 buttons. All edits now go
  // through the main form (select the installment from the dropdown,
  // edit any section, click the main Save button) — see the unified
  // find-or-update logic in onSave below.

  // ── Sidebar bill items ────────────────────────────────────────────────────
  const billItems = buildBillItems(
    formData,
    formData.activeInstallmentType,
    (v: string) => setFormData(p => ({ ...p, activeInstallmentType: v })),
    setBillLang, setActiveStep,
  );

  // ── calcRows — live calc panel on the right ───────────────────────────────
  const calcRows = (() => {
    const currentInst = formData.activeInstallmentType;
    const dailyG   = Number(formData.dailyGross || 0);
    // AUDIT FIX (noticed while doing the installments[] redesign — same
    // pattern already fixed in maternityBenefitTable.tsx's "সুবিধার হিসাব"
    // table, this is a separate occurrence in this right-sidebar widget):
    // was `currentInst === '১ম+২য় কিস্তি' ? 120 : 60` — defaulted to a
    // real 60-day figure even with the placeholder (nothing confirmed yet).
    const days     = currentInst === '' ? 0 : (currentInst === '১ম+২য় কিস্তি' ? 120 : 60);
    const benefit  = (days * dailyG).toFixed(2);
    const isElig   = formData.eligibilityStatus === 'অধিকারী';

    const rows = [
      { label: 'মাসিক মজুরি', value: formData.totalMonthlyWage ? `৳ ${formData.totalMonthlyWage}` : '—' },
      { label: 'দৈনিক মজুরি', value: dailyG ? `৳ ${formData.dailyGross}` : '—' },
      { label: 'সুবিধার দিন', value: `${days} দিন` },
    ];
    if (isElig) {
      rows.push({ label: currentInst === '১ম+২য় কিস্তি' ? '১২০ দিনের সুবিধা' : '৬০ দিনের সুবিধা', value: `৳ ${benefit}` });
    }
    // REDESIGN (2nd round): earnedLeaveDays now lives inside the currently-
    // selected installment's draft — and salary applies to EVERY
    // installment type now (no more excluding দ্বিতীয় কিস্তি).
    const activeDraft = getActiveInstallmentDraft(formData.installments, currentInst);
    if (activeDraft.earnedLeaveDays) {
      rows.push({ label: 'অর্জিত ছুটি', value: `${activeDraft.earnedLeaveDays} দিন` });
    }
    return rows;
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ModuleShell
      moduleName="মাতৃত্বকালীন সুবিধা"
      moduleNameEn="Maternity Benefit"
      date={formData.formDate}
      onDateChange={d => setFormData(p => ({ ...p, formDate: d }))}
      steps={STEPS}
      activeStep={activeStep}
      onStepChange={id => setActiveStep(id)}
      billItems={billItems}
      isBillActive={isBill}

      onSave={async () => {
        const record = buildRecord();
        const inst   = formData.activeInstallmentType;
        let   newInstallments = [...formData.installments];

        // REDESIGN (2nd round): replaces the 3 duplicated if-blocks
        // (প্রথম/দ্বিতীয়/১ম+২য়, each only ever CREATING a new entry) with
        // one unified find-OR-update. Selecting an installment that
        // ALREADY has a saved entry now UPDATES that entry in place using
        // whatever is currently in the form (wage details, this
        // installment's own earnedLeaveDays/otherBenefits* draft fields)
        // — this is what makes "edit designation, then edit wage, and the
        // installment amount updates accordingly" work: there's no more
        // frozen/snapshot-only path, every save recomputes from current
        // inputs and writes the result into that installment's entry.
        if (inst === 'প্রথম কিস্তি' || inst === 'দ্বিতীয় কিস্তি' || inst === '১ম+২য় কিস্তি') {
          const draft  = getActiveInstallmentDraft(formData.installments, inst);
          const dailyG = Number(formData.dailyGross || 0);
          const days   = inst === '১ম+২য় কিস্তি' ? 120 : 60;
          const newEntry: MaternityInstallment = {
            ...draft,
            type: inst,
            status: 'paid',
            date: formData.formDate,
            amount: (days * dailyG).toFixed(0),
            salary: MaternityFormula.calculateEarnedWage(draft.earnedLeaveDays, formData.dailyGross, draft.currentMonth, draft.currentYear).toFixed(0),
            others: MaternityFormula.calculateOtherBenefits(draft.otherBenefitsValue, draft.otherBenefitsType, formData.totalMonthlyWage).toFixed(0),
          };
          const idx = newInstallments.findIndex(i => i.type === inst);
          if (idx >= 0) newInstallments[idx] = newEntry;
          else newInstallments = [...newInstallments, newEntry];
        }
        record.installmentsJson = JSON.stringify(newInstallments);

        const existingId = sheets.editingId;
        let restoredId: string | null = existingId;
        let ok: boolean;

        if (existingId) {
          ok = await sheets.update(existingId, record);
        } else {
          const newId = await sheets.save(record);
          ok = !!newId;
          if (newId) restoredId = newId;
        }

        if (ok) {
          // Keep editingId pointing at this record (so the NEXT installment
          // save updates it too, rather than creating a duplicate) — do
          // NOT run the full handleReset(), which would wipe the
          // just-saved installments array and employee info. Just apply
          // the saved installments array and reset the dropdown back to
          // the placeholder, ready for the next active choice.
          if (restoredId) sheets.setEditingId(restoredId);
          setFormData(p => ({
            ...p,
            installments: newInstallments,
            activeInstallmentType: '',
          }));
        }
        return ok;
      }}
      isSaving={sheets.isSaving}
      saveDisabled={!formData.employeeName}
      configured={sheets.configured}
      adapterName={sheets.adapterName}
      editingId={sheets.editingId}
      onCancelEdit={handleReset}
      onReset={handleReset}

      onUpdate={rec => {
        sheets.setEditingId(String(rec.id ?? ''));
        setFormData(p => recordToFormData(rec, p));
        setActiveStep('employee');
      }}
      updateModule="maternity"
      updateLabel="মাতৃত্ব রেকর্ড খুঁজুন"

      // Point 3 — Global Employee Search: maps Employee Personal File
      // fields onto this module's own field names for a NEW record
      // (does not touch sheets.editingId — that's only for loading an
      // existing maternity record via updateModule above).
      onEmployeeSelect={emp => {
        setFormData(p => ({
          ...p,
          employeeName: String(emp.fullNameBengali ?? emp.fullName ?? p.employeeName),
          cardNo:       String(emp.cardNo ?? p.cardNo),
          designation:  String(emp.designation ?? p.designation),
          section:      String(emp.sectionLine ?? emp.department ?? p.section),
          joiningDate:  String(emp.joiningDate ?? p.joiningDate),
          totalMonthlyWage: String(emp.grossSalary ?? p.totalMonthlyWage),
        }));
      }}

      calcRows={calcRows}
      totalRow={{ label: 'মোট প্রদেয়', value: `৳ ${totalPayable()}` }}

      records={sheets.records}
      isLoading={sheets.isLoading}

      onLoadRecord={rec => {
        sheets.setEditingId(String(rec.id ?? ''));
        setFormData(p => recordToFormData(rec as Record<string, unknown>, p));
        setActiveStep('employee');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      onDeleteRecord={sheets.remove}
      onReload={sheets.reload}

      auth={auth}
      onAuthChange={setAuth}
      onPrint={() => billRef.current?.print()}
      onPDF={() => billRef.current?.exportPDF() ?? Promise.resolve()}
      onExcel={async () => {
        const { exportToExcel } = await import('../../../utils/excelExport');
        exportToExcel({
          filename:  `MaternityBenefit_${formData.employeeName || 'export'}`,
          sheetName: 'Maternity Benefit',
          headerInfo: [
            { label: 'Employee', value: formData.employeeName },
            { label: 'Card No',  value: formData.cardNo       },
            { label: 'Date',     value: formData.formDate     },
            { label: 'Payable',  value: totalPayable()        },
          ],
          sections: [{ title: 'Maternity Benefit', columns: [], rows: [] }],
        });
      }}
      lang="bn"
    >
      {activeStep === 'employee'  && <EmployeeInfoTable      formData={formData} handleChange={set} />}
      {activeStep === 'service'   && <ServiceDurationTable   formData={formData} handleChange={set} />}
      {activeStep === 'wage'      && <WageTable              formData={formData} handleChange={set} />}
      {activeStep === 'calculate' && (
        <BenefitCalculationTable
          formData={formData}
          handleChange={set}
          calculateTotalPayable={totalPayable}
          onInstallmentFieldChange={(field, value) => setFormData(p => ({
            ...p,
            installments: updateActiveInstallmentField(p.installments, p.activeInstallmentType, field, value),
          }))}
        />
      )}
      {isBill && (
        <MaternityBenefitBill
          ref={billRef}
          formData={formData}
          totalPayable={totalPayable()}
          lang={billLang}
          authorization={auth}
        />
      )}
    </ModuleShell>
  );
};

export default DisplayMaternityBenefit;