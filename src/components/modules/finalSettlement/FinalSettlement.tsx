// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlement.tsx — চূড়ান্ত পাওনা হিসাব (Final Settlement)
// Path: src/components/modules/finalSettlement/FinalSettlement.tsx
//
// Same structure as the Corrective Action Manager:
//   - ONE entry form; every figure comes from computeSettlement() (no calculation effects).
//   - Statement filters / sort are owned HERE; the same filtered rows feed the screen, Print Preview, PDF and Excel.
//   - Outputs: Statement · Payment Bill (Bangla / English, portrait) · Print Preview of the Statement (landscape).
//   - Save is DISABLED until both sections are filled:
//       Section 1: কর্মীর তথ্য, চাকরিকাল ও নিষ্পত্তির ধরন
//       Section 2: সর্বশেষ ধার্যকৃত মাসিক মোট মজুরির বিবরণ
//     Once enabled, a failed Save still shows the problem under each field and jumps to the first one.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import ModuleShell from '../../shell/ModuleShell';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { EmployeeFormData } from './FinalSettlementDataTypes';
import PaymentBill from './PaymentBill';
import type { PaymentBillHandle } from './PaymentBill';
import FinalSettlementForm from './FinalSettlementForm';
import FinalSettlementStatement from './FinalSettlementStatement';
import FinalSettlementListPrintView from './FinalSettlementListPrintView';
import { exportSettlementList, exportSettlementBill } from './settlementExcel';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { SettlementFilters } from './settlementModel';
import {
  blankSettlement, recordToFormData, computeSettlement, resolveSettlement, validateSettlement, buildSettlementRows, filterRows,
  EMPTY_SETTLEMENT_FILTERS, countActiveFilters, summarize, formatDMY, money, todayIso,
} from './settlementModel';

const STEPS = [{ id: 'form', label: 'চূড়ান্ত পাওনা এন্ট্রি', icon: 'ti-calculator', fieldCount: 8 }];
type View = 'form' | 'statement' | 'billBn' | 'billEn' | 'printList';

export default function FinalSettlement() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('settlements', factory.id, user?.name ?? 'unknown');
  const billRef      = useRef<PaymentBillHandle>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [view, setView]       = useState<View>('form');
  const [data, setData]       = useState<EmployeeFormData>(blankSettlement());
  const [filters, setFilters] = useState<SettlementFilters>(EMPTY_SETTLEMENT_FILTERS);
  const [showErrors, setShowErrors] = useState(false);

  // ── everything calculated comes from the inputs, in one place ──
  const calc     = useMemo(() => computeSettlement(data), [data]);
  const resolved = useMemo(() => resolveSettlement(data, calc), [data, calc]);
  const issues   = useMemo(() => validateSettlement(data, calc), [data, calc]);
  const bill = useMemo<EmployeeFormData>(() => ({
    ...resolved, companyName: factory.nameBn, companyAddress: factory.addressBn, companyNameEn: factory.nameEn, companyAddressEn: factory.addressEn,
  }), [resolved, factory]);

  // ── Save is disabled while the core fields of the two sections are empty ──
  //   Section 1 (কর্মীর তথ্য, চাকরিকাল ও নিষ্পত্তির ধরন):
  //     employeeName, joiningDate, lastAttendance, settlementDate, terminationType
  //   Section 2 (সর্বশেষ ধার্যকৃত মাসিক মোট মজুরির বিবরণ):
  //     totalMonthlyWage
  const saveDisabled = useMemo(() => {
    const filled = (v: unknown) => String(v ?? '').trim() !== '';
    return !(
      filled(data.employeeName) &&
      filled(data.joiningDate) &&
      filled(data.lastAttendance) &&
      filled(data.settlementDate) &&
      filled(data.terminationType) &&
      filled(data.totalMonthlyWage)
    );
  }, [data]);

  const allRows      = useMemo(() => buildSettlementRows(sheets.records), [sheets.records]);
  const filteredRows = useMemo(() => filterRows(allRows, filters), [allRows, filters]);

  const isBill  = view === 'billBn' || view === 'billEn';
  const isStatementOut = view === 'statement' || view === 'printList';
  const filterText = countActiveFilters(filters) > 0 ? `Filtered: ${filteredRows.length} of ${allRows.length} settlements` : '';
  const fileBase = isBill ? `PaymentBill_${data.employeeName || 'employee'}` : `FinalSettlement_Statement_${todayIso()}`;

  const handleReset = (goto: View = 'form') => {
    setShowErrors(false);
    setData(blankSettlement());
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
  const handleExcel = () => { if (isBill) exportSettlementBill(resolved, calc, fileBase); else exportSettlementList(filteredRows, fileBase); };

  const buildRecord = () => ({
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
    paymentStatus: data.paymentStatus ?? '', paymentDate: data.paymentDate ?? '',
    preparedBy: authorization.preparedBy, preparedByDesignation: authorization.preparedByDesignation,
  });

  const loadRecord = (rec: Record<string, unknown>, goto: View) => {
    sheets.setEditingId(String(rec.id ?? ''));
    setShowErrors(false);
    setData(p => recordToFormData(rec, p));
    setView(goto);
  };
  const byId = (id: string) => sheets.records.find(r => String(r.id ?? '') === id) as unknown as Record<string, unknown> | undefined;
  const editById = (id: string) => { const r = byId(id); if (r) loadRecord(r, 'form'); };
  const billById = (id: string) => { const r = byId(id); if (r) loadRecord(r, 'billBn'); };
  const markPaid = async (id: string) => { await sheets.update(id, { paymentStatus: 'Paid', paymentDate: todayIso() }); };

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

  const billItems = [
    { id: 'statement', label: 'স্টেটমেন্ট (তালিকা)',          onClick: () => setView('statement') },
    { id: 'billBn',    label: 'পেমেন্ট বিল (বাংলা)',          onClick: () => setView('billBn') },
    { id: 'billEn',    label: 'Payment Bill (English)',       onClick: () => setView('billEn') },
    { id: 'printList', label: 'প্রিন্ট প্রিভিউ — স্টেটমেন্ট', onClick: () => setView('printList') },
  ];
  const sum = summarize(filteredRows);
  const listView = (
    <FinalSettlementListPrintView rows={filteredRows} factoryName={factory.nameEn} factoryAddress={factory.addressEn} authorization={authorization} filterText={filterText} />
  );

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        @media print { .fs-print-offscreen { position: static !important; left: auto !important; width: auto !important; } }
      `}</style>

      <ModuleShell
        moduleName="চূড়ান্ত পাওনা হিসাব"
        moduleNameEn="Final Settlement"
        date={data.settlementDate}
        onDateChange={d => setData(p => ({ ...p, settlementDate: d }))}

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
          const record = buildRecord();
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
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
        updateModule="settlements"
        updateLabel="Settlement রেকর্ড খুঁজুন"

        // Find employee (Personal File) → fills this form; it does not start an "edit" of a saved settlement.
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

        calcRows={[
          { label: 'মোট মজুরি',   value: data.totalMonthlyWage ? `৳ ${data.totalMonthlyWage}` : '—' },
          { label: 'সেবার বছর',   value: data.joiningDate && data.lastAttendance ? `${calc.years} বছর ${calc.months} মাস` : '—' },
          { label: 'মোট প্রাপ্য', value: calc.totalReceivable > 0 ? `৳ ${money(calc.totalReceivable)}` : '—' },
          { label: 'মোট কর্তন',   value: calc.totalDeductions > 0 ? `৳ ${money(calc.totalDeductions)}` : '—', muted: true },
          { label: 'পেমেন্ট',      value: data.paymentStatus || '—' },
        ]}
        totalRow={{ label: 'নিট প্রদেয়', value: `৳ ${calc.finalTotal.toLocaleString('en-US')}` }}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => { loadRecord(rec as Record<string, unknown>, 'form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onDeleteRecord={deleteRecord}
        onReload={sheets.reload}
        recordLabel={rec => `${String(rec.employeeName ?? rec.id ?? '—')}${rec.cardNo ? ` (${String(rec.cardNo)})` : ''} · ${formatDMY(toDateInput(rec.settlementDate) || '')}`}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handlePDF}
        onExcel={handleExcel}
        lang="bn"
      >
        {view === 'form' && <FinalSettlementForm data={data} setData={setData} calc={calc} issues={issues} showErrors={showErrors} />}

        {view === 'statement' && (
          <FinalSettlementStatement rows={allRows} filters={filters} onFiltersChange={setFilters}
            onEdit={editById} onBill={billById} onDelete={id => { void deleteRecord(id); }} onMarkPaid={id => { void markPaid(id); }} onAdd={() => handleReset('form')} />
        )}

        {/* Hidden print copy so the header Print / PDF buttons work from the Statement. */}
        {view === 'statement' && (
          <div className="fs-print-offscreen" aria-hidden="true" style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}>
            <div id="printable-area" ref={printAreaRef}>{listView}</div>
          </div>
        )}

        {view === 'printList' && <div id="printable-area" ref={printAreaRef}>{listView}</div>}

        {isBill && (
          <PaymentBill
            ref={billRef}
            formData={bill}
            totalReceivable={calc.totalReceivable.toFixed(2)}
            totalDeductions={calc.totalDeductions.toFixed(2)}
            netPayable={String(calc.finalTotal)}
            lang={view === 'billEn' ? 'en' : 'bn'}
            authorization={authorization}
          />
        )}
      </ModuleShell>
      {isStatementOut && sum.count < 0 && null}
    </>
  );
}