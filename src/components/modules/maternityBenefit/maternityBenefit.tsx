// ─────────────────────────────────────────────────────────────────────────────
// maternityBenefit.tsx — মাতৃত্বকালীন সুবিধা (Maternity Benefit)
// Path: src/components/modules/maternityBenefit/maternityBenefit.tsx
//
// Same structure as the Final Settlement Manager:
//   - ONE entry form (MaternityForm); every figure comes from computeMaternity() (no calculation effects).
//   - Statement filters / sort are owned HERE; the same filtered rows feed the screen, Print Preview, PDF and Excel.
//   - Outputs: Statement · Maternity Bill (Bangla / English, per installment, portrait) · Print Preview of the Statement (landscape).
//   - Save is DISABLED until the required fields are filled (name, joining date, delivery date, monthly wage);
//     once enabled, a failed Save still shows the problem under each field and jumps to the first one.
//
// Installments: choose the installment in the form (প্রথম / দ্বিতীয় / ১ম+২য় কিস্তি) and Save — an installment that
// already exists is UPDATED in place from the current inputs, otherwise it is added as paid. After a save the
// Statement opens; to pay the next installment press ✎ on that row, pick the installment, and Save again.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import ModuleShell from '../../shell/ModuleShell';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { MaternityFormData, MaternityInstallment } from './MaternityBenefitTypes';
import { getInstallmentEligibility } from './MaternityBenefitTypes';
import MaternityBenefitBill from './maternityBill';
import type { MaternityBillHandle } from './maternityBill';
import MaternityForm from './MaternityForm';
import MaternityStatement from './MaternityStatement';
import MaternityListPrintView from './MaternityListPrintView';
import { exportMaternityList, exportMaternityBill } from './maternityExcel';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { MaternityFilters } from './maternityModel';
import {
  blankMaternity, recordToForm, computeMaternity, resolveMaternity, validateMaternity, buildMaternityRows, filterRows,
  EMPTY_MATERNITY_FILTERS, countActiveFilters, formatDMY, money, todayIso, text,
} from './maternityModel';

const STEPS = [{ id: 'form', label: 'মাতৃত্বকালীন সুবিধা এন্ট্রি', icon: 'ti-calculator', fieldCount: 8 }];
type View = 'form' | 'statement' | 'billBn' | 'billEn' | 'printList';

const FIRST = 'প্রথম কিস্তি', SECOND = 'দ্বিতীয় কিস্তি', BOTH = '১ম+২য় কিস্তি';
const INST_LABEL: Record<string, { bn: string; en: string }> = {
  [FIRST]:  { bn: '১ম কিস্তি',  en: '1st Inst.' },
  [SECOND]: { bn: '২য় কিস্তি',  en: '2nd Inst.' },
  [BOTH]:   { bn: '১ম+২য় কিস্তি', en: '1st+2nd Inst.' },
};

/** Which installment a bill should show when none is chosen: the combined one, else the first paid one, else the 1st. */
function defaultBillInstallment(installments: MaternityInstallment[]): string {
  const { inst1Paid, inst2Paid, isCombinedPaid } = getInstallmentEligibility(installments);
  return isCombinedPaid ? BOTH : inst1Paid ? FIRST : inst2Paid ? SECOND : FIRST;
}

export default function MaternityBenefit() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('maternity', factory.id, user?.name ?? 'unknown');
  const billRef      = useRef<MaternityBillHandle>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [view, setView]       = useState<View>('form');
  const [data, setData]       = useState<MaternityFormData>(blankMaternity());
  const [filters, setFilters] = useState<MaternityFilters>(EMPTY_MATERNITY_FILTERS);
  const [showErrors, setShowErrors] = useState(false);

  // ── everything calculated comes from the inputs, in one place ──
  const calc     = useMemo(() => computeMaternity(data), [data]);
  const resolved = useMemo(() => resolveMaternity(data, calc), [data, calc]);
  const issues   = useMemo(() => validateMaternity(data, calc), [data, calc]);
  const bill = useMemo<MaternityFormData>(() => ({
    ...resolved, companyName: factory.nameBn, companyAddress: factory.addressBn, companyNameEn: factory.nameEn, companyAddressEn: factory.addressEn,
  }), [resolved, factory]);

  // ── Save is disabled while the required fields are empty ──
  const saveDisabled = useMemo(() => {
    const filled = (v: unknown) => String(v ?? '').trim() !== '';
    return !(filled(data.employeeName) && filled(data.joiningDate) && filled(data.possibleDeliveryDate) && filled(data.totalMonthlyWage));
  }, [data]);

  const allRows      = useMemo(() => buildMaternityRows(sheets.records), [sheets.records]);
  const filteredRows = useMemo(() => filterRows(allRows, filters), [allRows, filters]);

  const isBill = view === 'billBn' || view === 'billEn';
  const filterText = countActiveFilters(filters) > 0 ? `Filtered: ${filteredRows.length} of ${allRows.length} records` : '';
  const fileBase = isBill ? `MaternityBill_${data.employeeName || 'employee'}` : `MaternityBenefit_Statement_${todayIso()}`;

  const handleReset = (goto: View = 'form') => {
    setShowErrors(false);
    setData(blankMaternity());
    setView(goto);
    sheets.setEditingId(null);
  };

  // Statement print: A4 landscape through a hidden iframe.
  const handlePrintList = () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) { window.print(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:297mm;height:210mm;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.styleSheets)
      .map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase}</title>
      <style>@page{size:A4 landscape;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    const win = iframe.contentWindow!;
    win.addEventListener('afterprint', () => { if (iframe.parentNode) document.body.removeChild(iframe); });
    setTimeout(() => { win.focus(); win.print(); }, 250);
  };
  const handleExportListPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({ element: el, filename: fileBase, orientation: 'landscape', scale: 3, rowSafeBreaks: true, printStyle: true });
  };

  const handlePrint = () => { if (isBill) billRef.current?.print(); else handlePrintList(); };
  const handlePDF   = async () => { if (isBill) await billRef.current?.exportPDF(); else await handleExportListPDF(); };
  const handleExcel = () => { if (isBill) exportMaternityBill(resolved, calc, fileBase); else exportMaternityList(filteredRows, fileBase); };

  const buildRecord = () => ({
    employeeName: data.employeeName.trim(), cardNo: data.cardNo, designation: data.designation, department: data.section,
    joiningDate: data.joiningDate, deliveryDate: data.possibleDeliveryDate,
    leaveStartDate: resolved.maternityLeaveStartDate, leaveEndDate: resolved.maternityLeaveEndDate,
    maternitySymptomDate: data.maternitySymptomDate, maternityLeavenoticedDate: data.maternityLeavenoticedDate ?? '',
    aliveChildren: data.aliveChildren,
    serviceYears: resolved.serviceYears, serviceMonths: resolved.serviceMonths, serviceDays: resolved.serviceDays,
    eligibilityStatus: resolved.eligibilityStatus,
    monthlyWage: data.totalMonthlyWage, dailyGross: resolved.dailyGross, benifitDays: resolved.benifitDays, benefitAmount: resolved.benefitAmount,
    latestMonth: data.latestMonth, latestYear: data.latestYear,
    installmentsJson: JSON.stringify(data.installments), activeInstallmentType: data.activeInstallmentType,
    totalPayable: calc.total.toFixed(2), formDate: data.formDate,
    preparedBy: authorization.preparedBy, preparedByDesignation: authorization.preparedByDesignation,
  });

  /** The installments array after saving: the selected installment is updated in place from the current inputs, or added as paid. */
  const installmentsAfterSave = (): MaternityInstallment[] => {
    const inst = data.activeInstallmentType;
    if (inst !== FIRST && inst !== SECOND && inst !== BOTH) return data.installments;
    const draft = data.installments.find(i => i.type === inst);
    const base = draft ?? { type: inst, status: 'pending', date: '', amount: '', salary: '', others: '', othersLabel: '', earnedLeaveDays: '', currentMonth: '', currentYear: '', otherBenefitsValue: '', otherBenefitsType: 'দিন', payableEarnedLeaveDays: '' } as MaternityInstallment;
    const entry: MaternityInstallment = {
      ...base, type: inst, status: 'paid', date: data.formDate,
      amount: (calc.benefitDays * calc.daily).toFixed(0), salary: calc.salary.toFixed(0), others: calc.others.toFixed(0),
    };
    const list = [...data.installments];
    const idx = list.findIndex(i => i.type === inst);
    if (idx >= 0) list[idx] = entry; else list.push(entry);
    return list;
  };

  const loadRecord = (rec: Record<string, unknown>, goto: View, installment?: boolean) => {
    sheets.setEditingId(String(rec.id ?? ''));
    setShowErrors(false);
    setData(p => {
      const f = recordToForm(rec, p);
      return installment ? { ...f, activeInstallmentType: defaultBillInstallment(f.installments) } : f;
    });
    setView(goto);
  };
  const byId = (id: string) => sheets.records.find(r => String(r.id ?? '') === id) as unknown as Record<string, unknown> | undefined;
  const editById = (id: string) => { const r = byId(id); if (r) loadRecord(r, 'form'); };
  const billById = (id: string) => { const r = byId(id); if (r) loadRecord(r, 'billBn', true); };

  const deleteRecord = async (id: string): Promise<boolean> => {
    const ok = await sheets.remove(id);
    if (ok && sheets.editingId === id) handleReset('statement');
    return ok;
  };

  /** Failed Save: reveal the messages, jump to and focus the first invalid field. */
  const showFirstError = () => {
    setShowErrors(true);
    setView('form');
    const first = issues.errors[0]?.field;
    if (!first) return;
    setTimeout(() => {
      const box = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (box?.querySelector<HTMLElement>('input, select, textarea, button') ?? box)?.focus({ preventScroll: true });
    }, 60);
  };

  // ── Sidebar: Statement · Bill (BN / EN, one sub-item per installment) · Print preview ──
  const eligible = calc.eligible;
  const { inst1Paid, inst2Paid, isCombinedPaid } = getInstallmentEligibility(data.installments);
  const combined = data.activeInstallmentType === BOTH || isCombinedPaid;
  const choices = !eligible ? [] : combined ? [BOTH] : inst1Paid && !inst2Paid ? [FIRST] : [FIRST, SECOND];
  const openBill = (v: 'billBn' | 'billEn', inst?: string) => {
    setData(p => ({ ...p, activeInstallmentType: inst ?? (p.activeInstallmentType || defaultBillInstallment(p.installments)) }));
    setView(v);
  };
  const billItem = (id: 'billBn' | 'billEn', label: string, lang: 'bn' | 'en') => ({
    id, label, onClick: () => openBill(id),
    ...(choices.length ? { subItems: choices.map(c => ({ label: INST_LABEL[c][lang], active: view === id && data.activeInstallmentType === c, onClick: () => openBill(id, c) })) } : {}),
  });
  const billItems = [
    { id: 'statement', label: 'স্টেটমেন্ট (তালিকা)',          onClick: () => setView('statement') },
    billItem('billBn', 'মাতৃত্ব বিল (বাংলা)', 'bn'),
    billItem('billEn', 'Maternity Bill (English)', 'en'),
    { id: 'printList', label: 'প্রিন্ট প্রিভিউ — স্টেটমেন্ট', onClick: () => setView('printList') },
  ];

  const listView = (
    <MaternityListPrintView rows={filteredRows} factoryName={factory.nameEn} factoryAddress={factory.addressEn} authorization={authorization} filterText={filterText} />
  );

  const pickedDays = data.activeInstallmentType === '' ? 0 : calc.benefitDays;
  const calcRows = [
    { label: 'মাসিক মজুরি', value: data.totalMonthlyWage ? `৳ ${data.totalMonthlyWage}` : '—' },
    { label: 'দৈনিক মজুরি', value: calc.daily ? `৳ ${money(calc.daily)}` : '—' },
    { label: 'সেবার মেয়াদ', value: data.joiningDate && data.possibleDeliveryDate ? `${calc.years} বছর ${calc.months} মাস` : '—' },
    { label: 'যোগ্যতা',      value: calc.eligibility || '—' },
    { label: 'সুবিধার দিন', value: `${pickedDays} দিন`, muted: true },
  ];

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        @media print { .ms-print-offscreen { position: static !important; left: auto !important; width: auto !important; } }
      `}</style>

      <ModuleShell
        moduleName="মাতৃত্বকালীন সুবিধা"
        moduleNameEn="Maternity Benefit"
        date={data.formDate}
        onDateChange={d => setData(p => ({ ...p, formDate: d }))}

        steps={STEPS}
        activeStep={view === 'form' ? 'form' : ''}
        onStepChange={() => setView('form')}

        billItems={billItems}
        isBillActive={view !== 'form'}
        activeBillId={view !== 'form' ? view : null}
        hideBillHeading

        onSave={async () => {
          // Guard: never save while the required fields are empty (even if triggered some other way).
          if (saveDisabled) return false;
          if (issues.errors.length > 0) { showFirstError(); return false; }
          const record = { ...buildRecord(), installmentsJson: JSON.stringify(installmentsAfterSave()) };
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : Boolean(await sheets.save(record));
          if (ok) handleReset('statement');
          return ok;
        }}
        isSaving={sheets.isSaving}
        saveDisabled={saveDisabled}
        configured={sheets.configured}
        adapterName={sheets.adapterName}

        editingId={sheets.editingId}
        onCancelEdit={() => handleReset('form')}
        onReset={() => handleReset('form')}
        isDirty={Boolean(data.employeeName.trim() || data.totalMonthlyWage)}

        onUpdate={rec => loadRecord(rec, 'form')}
        updateModule="maternity"
        updateLabel="মাতৃত্ব রেকর্ড খুঁজুন"

        // Find employee (Personal File) → fills this form; it does not start an "edit" of a saved record.
        onEmployeeSelect={emp => {
          setData(prev => ({
            ...prev,
            employeeName: String(emp.fullNameBengali ?? emp.fullName ?? prev.employeeName),
            cardNo: String(emp.cardNo ?? prev.cardNo),
            designation: String(emp.designation ?? prev.designation),
            section: String(emp.sectionLine ?? emp.department ?? prev.section),
            joiningDate: emp.joiningDate ? toDateInput(emp.joiningDate) || prev.joiningDate : prev.joiningDate,
            totalMonthlyWage: String(emp.grossSalary ?? prev.totalMonthlyWage),
          }));
          setView('form');
        }}

        calcRows={calcRows}
        totalRow={{ label: 'মোট প্রদেয়', value: `৳ ${money(calc.total)}` }}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => { loadRecord(rec as Record<string, unknown>, 'form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onReload={sheets.reload}
        recordLabel={rec => `${text(rec.employeeName) || text(rec.id) || '—'}${text(rec.cardNo) ? ` (${text(rec.cardNo)})` : ''} · ${formatDMY(toDateInput(rec.deliveryDate ?? rec.possibleDeliveryDate) || '')}`}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handlePDF}
        onExcel={handleExcel}
        lang="bn"
      >
        {view === 'form' && <MaternityForm data={data} setData={setData} calc={calc} issues={issues} showErrors={showErrors} />}

        {view === 'statement' && (
          <MaternityStatement rows={allRows} filters={filters} onFiltersChange={setFilters}
            onEdit={editById} onBill={billById} onDelete={id => { void deleteRecord(id); }} onAdd={() => handleReset('form')} />
        )}

        {/* Hidden print copy so the header Print / PDF buttons work from the Statement. */}
        {view === 'statement' && (
          <div className="ms-print-offscreen" aria-hidden="true" style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}>
            <div id="printable-area" ref={printAreaRef}>{listView}</div>
          </div>
        )}

        {view === 'printList' && <div id="printable-area" ref={printAreaRef}>{listView}</div>}

        {isBill && (
          <MaternityBenefitBill
            ref={billRef}
            formData={bill}
            totalPayable={calc.total.toFixed(2)}
            lang={view === 'billEn' ? 'en' : 'bn'}
            authorization={authorization}
          />
        )}
      </ModuleShell>
    </>
  );
}