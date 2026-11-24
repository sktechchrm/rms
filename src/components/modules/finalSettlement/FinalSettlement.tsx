// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlement.tsx — চূড়ান্ত পাওনা হিসাব (Final Settlement)
// Path: src/components/modules/finalSettlement/FinalSettlement.tsx
//
// Same structure as the Corrective Action Manager:
//   - ONE entry form; every figure comes from computeSettlement() (no calculation effects).
//   - Statement filters / sort are owned HERE; the same filtered rows feed the screen, Print Preview, PDF and Excel.
//   - Outputs: Statement · Payment Bill (Bangla / English, portrait) · Print Preview of the Statement (landscape).
//   - Top-right icons of the form: Excel upload (modal) · multi-employee form (one চাকরি নিষ্পত্তির ধরন → many employees).
//     The multi-employee form has no buttons of its own for output or saving — the page's Save saves every row,
//     and every output still comes from the ফলাফল list.
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
import FinalSettlementMultiForm from './FinalSettlementMultiForm';
import SettlementImportModal from './SettlementImportModal';
import FinalSettlementStatement from './FinalSettlementStatement';
import FinalSettlementListPrintView from './FinalSettlementListPrintView';
import FinalSettlementProposalPrintView from './FinalSettlementProposalPrintView';
import { exportSettlementList, exportSettlementBill, exportSettlementProposal } from './settlementExcel';
import { proposalFromBatch, proposalFromSaved } from './settlementProposal';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { SettlementFilters } from './settlementModel';
import { newGroup, newRow, isBlankRow, evaluateBatch, batchCount, batchHasGroupGap, batchHasErrors, firstBatchErrorField, buildSettlementRecord } from './settlementBatch';
import type { BatchGroup } from './settlementBatch';
import type { ImportResult } from './settlementImport';
import { downloadSettlementTemplate, exportSettlementGroup } from './settlementImportExcel';
import {
  blankSettlement, recordToFormData, computeSettlement, resolveSettlement, validateSettlement, buildSettlementRows, filterRows,
  EMPTY_SETTLEMENT_FILTERS, countActiveFilters, summarize, formatDMY, money, todayIso,
} from './settlementModel';

const STEPS = [{ id: 'form', label: 'চূড়ান্ত পাওনা এন্ট্রি', icon: 'ti-calculator', fieldCount: 8 }];
type View = 'form' | 'multi' | 'statement' | 'billBn' | 'billEn' | 'printList' | 'proposal';

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
  // multi-employee form + Excel import (separate from the single form's `data`, which is kept untouched)
  const [groups, setGroups]       = useState<BatchGroup[]>(() => [newGroup(todayIso())]);
  const [importOpen, setImportOpen] = useState(false);
  const [importNotes, setImportNotes] = useState<string[]>([]);

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

  const evaluated  = useMemo(() => evaluateBatch(groups), [groups]);
  const batchTotal = batchCount(evaluated);
  const batchSaveDisabled = batchTotal === 0 || batchHasGroupGap(evaluated);
  const batchSum = useMemo(() => ({
    receivable: evaluated.reduce((s, g) => s + g.totalReceivable, 0),
    deductions: evaluated.reduce((s, g) => s + g.totalDeductions, 0),
    net: evaluated.reduce((s, g) => s + g.totalNet, 0),
  }), [evaluated]);

  const allRows      = useMemo(() => buildSettlementRows(sheets.records), [sheets.records]);
  const filteredRows = useMemo(() => filterRows(allRows, filters), [allRows, filters]);

  // management proposal sheet: the employees of the multi-employee form; when it is empty, the filtered saved settlements
  const proposalFromForm = useMemo(() => proposalFromBatch(groups, evaluated), [groups, evaluated]);
  const proposalRows     = useMemo(() => (proposalFromForm.length ? proposalFromForm : proposalFromSaved(filteredRows)), [proposalFromForm, filteredRows]);

  const isBill  = view === 'billBn' || view === 'billEn';
  const isMulti = view === 'multi';
  const isStatementOut = view === 'statement' || view === 'printList';
  const filterText = countActiveFilters(filters) > 0 ? `Filtered: ${filteredRows.length} of ${allRows.length} settlements` : '';
  const fileBase = isBill ? `PaymentBill_${data.employeeName || 'employee'}`
    : view === 'proposal' ? `FinalSettlement_Proposal_${todayIso()}`
    : `FinalSettlement_Statement_${todayIso()}`;

  const handleReset = (goto: View = 'form') => {
    setShowErrors(false);
    setData(blankSettlement());
    setView(goto);
    sheets.setEditingId(null);
  };

  const resetBatch = () => { setShowErrors(false); setImportNotes([]); setGroups([newGroup(data.settlementDate || todayIso())]); };

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

  const handlePrint = () => { if (isMulti) return; if (isBill) billRef.current?.print(); else handlePrintList(); };
  const handlePDF   = async () => { if (isMulti) return; if (isBill) await billRef.current?.exportPDF(); else await handleExportListPDF(); };
  const handleExcel = () => { if (isMulti) return; if (view === 'proposal') { void exportSettlementProposal(proposalRows, fileBase); return; } if (isBill) void exportSettlementBill(resolved, calc, fileBase); else void exportSettlementList(filteredRows, fileBase); };

  const buildRecord = () => buildSettlementRecord(data, resolved, calc, authorization);

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

  // ── multi-employee form ──
  const openMulti = () => { setShowErrors(false); setView('multi'); };
  const openExcel = () => setImportOpen(true);

  const handleImport = (res: ImportResult) => {
    // a still-empty starting group is replaced; otherwise the imported groups are added below the existing ones
    const pristine = groups.every(g => !g.terminationType && g.rows.every(r => isBlankRow(r.f)));
    setGroups(pristine ? res.groups : [...groups, ...res.groups]);
    setImportNotes(res.warnings);
    setShowErrors(false);
    setImportOpen(false);
    setView('multi');
  };

  /** Save every filled row. Rows that were saved leave the form; rows that failed stay so Save can be pressed again. */
  const saveBatch = async (): Promise<boolean> => {
    if (batchSaveDisabled) return false;
    if (batchHasErrors(evaluated)) {
      setShowErrors(true);
      const first = firstBatchErrorField(evaluated);
      setTimeout(() => {
        const box = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
        box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (box?.querySelector<HTMLElement>('input, select, textarea, button') ?? box)?.focus({ preventScroll: true });
      }, 60);
      return false;
    }
    const saved = new Set<string>();
    outer: for (const g of evaluated) {
      for (const r of g.rows) {
        if (r.blank) continue;
        const ok = await sheets.save(buildSettlementRecord(r.form, r.resolved, r.calc, authorization));
        if (!ok) break outer;
        saved.add(r.key);
      }
    }
    const left = groups
      .map(g => ({ ...g, rows: g.rows.filter(r => !saved.has(r.key)) }))
      .filter(g => g.rows.some(r => !isBlankRow(r.f)));
    if (left.length === 0) { resetBatch(); setView('statement'); return true; }
    setGroups(left.map(g => ({ ...g, rows: g.rows.length ? g.rows : [newRow()] })));
    return false;
  };

  const billItems = [
    { id: 'statement', label: 'স্টেটমেন্ট (তালিকা)',          onClick: () => setView('statement') },
    { id: 'billBn',    label: 'পেমেন্ট বিল (বাংলা)',          onClick: () => setView('billBn') },
    { id: 'billEn',    label: 'Payment Bill (English)',       onClick: () => setView('billEn') },
    { id: 'printList', label: 'প্রিন্ট প্রিভিউ — স্টেটমেন্ট', onClick: () => setView('printList') },
    { id: 'proposal',  label: 'প্রস্তাবনা শিট (ব্যবস্থাপনা)',   onClick: () => setView('proposal') },
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
        onDateChange={d => { setData(p => ({ ...p, settlementDate: d })); if (isMulti) setGroups(gs => gs.map(g => ({ ...g, settlementDate: d }))); }}

        steps={STEPS}
        activeStep={view === 'form' || isMulti ? 'form' : ''}
        onStepChange={() => setView('form')}

        billItems={billItems}
        isBillActive={view !== 'form' && !isMulti}
        activeBillId={view !== 'form' && !isMulti ? view : null}
        hideBillHeading

        onSave={async () => {
          if (isMulti) return saveBatch();
          // Guard: never save while the required fields are empty (even if triggered some other way).
          if (saveDisabled) return false;
          if (issues.errors.length > 0) { showFirstError(); return false; }
          const record = buildRecord();
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
          if (ok) handleReset('statement');
          return ok;
        }}
        isSaving={sheets.isSaving}
        saveDisabled={isMulti ? batchSaveDisabled : saveDisabled}
        configured={sheets.configured}
        adapterName={sheets.adapterName}

        editingId={sheets.editingId}
        onCancelEdit={() => handleReset('form')}
        onReset={() => (isMulti ? resetBatch() : handleReset('form'))}
        isDirty={isMulti ? batchTotal > 0 : Boolean(data.employeeName.trim() || data.totalMonthlyWage)}

        onUpdate={rec => loadRecord(rec, 'form')}
        updateModule="settlements"
        updateLabel="Settlement রেকর্ড খুঁজুন"

        // Find employee (Personal File) → fills this form; it does not start an "edit" of a saved settlement.
        onEmployeeSelect={emp => {
          if (isMulti) {
            // add the found employee as a row of the last group (reusing its empty row if there is one)
            const row = newRow();
            row.f = {
              ...row.f,
              employeeName: String(emp.fullNameBengali ?? emp.fullName ?? ''), cardNo: String(emp.cardNo ?? ''), designation: String(emp.designation ?? ''),
              section: String(emp.sectionLine ?? emp.department ?? ''), joiningDate: emp.joiningDate ? toDateInput(emp.joiningDate) || '' : '',
              totalMonthlyWage: String(emp.grossSalary ?? ''),
            };
            setGroups(gs => gs.map((g, i) => {
              if (i !== gs.length - 1) return g;
              const k = g.rows.findIndex(r => isBlankRow(r.f));
              return { ...g, rows: k >= 0 ? g.rows.map((r, j) => (j === k ? { ...r, f: row.f } : r)) : [...g.rows, row] };
            }));
            return;
          }
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

        calcRows={isMulti ? [
          { label: 'কর্মী (সারি)', value: String(batchTotal) },
          { label: 'গ্রুপ', value: String(groups.length) },
          { label: 'মোট প্রাপ্য', value: batchSum.receivable > 0 ? `৳ ${money(batchSum.receivable)}` : '—' },
          { label: 'মোট কর্তন', value: batchSum.deductions > 0 ? `৳ ${money(batchSum.deductions)}` : '—', muted: true },
        ] : [
          { label: 'মোট মজুরি',   value: data.totalMonthlyWage ? `৳ ${data.totalMonthlyWage}` : '—' },
          { label: 'সেবার বছর',   value: data.joiningDate && data.lastAttendance ? `${calc.years} বছর ${calc.months} মাস` : '—' },
          { label: 'মোট প্রাপ্য', value: calc.totalReceivable > 0 ? `৳ ${money(calc.totalReceivable)}` : '—' },
          { label: 'মোট কর্তন',   value: calc.totalDeductions > 0 ? `৳ ${money(calc.totalDeductions)}` : '—', muted: true },
          { label: 'পেমেন্ট',      value: data.paymentStatus || '—' },
        ]}
        totalRow={{ label: 'নিট প্রদেয়', value: `৳ ${(isMulti ? batchSum.net : calc.finalTotal).toLocaleString('en-US')}` }}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => { loadRecord(rec as Record<string, unknown>, 'form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        // onDeleteRecord={deleteRecord}
        onReload={sheets.reload}
        recordLabel={rec => `${String(rec.employeeName ?? rec.id ?? '—')}${rec.cardNo ? ` (${String(rec.cardNo)})` : ''} · ${formatDMY(toDateInput(rec.settlementDate) || '')}`}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handlePDF}
        onExcel={handleExcel}
        lang="bn"
      >
        {view === 'form' && (
          <FinalSettlementForm data={data} setData={setData} calc={calc} issues={issues} showErrors={showErrors}
            onOpenExcel={sheets.editingId ? undefined : openExcel} onOpenMulti={sheets.editingId ? undefined : openMulti} />
        )}

        {isMulti && (
          <FinalSettlementMultiForm groups={groups} setGroups={setGroups} evaluated={evaluated} showErrors={showErrors}
            notes={importNotes} onDismissNotes={() => setImportNotes([])} defaultDate={data.settlementDate || todayIso()}
            onOpenExcel={openExcel} onOpenSingle={() => setView('form')}
            onDownloadGroup={gi => { void exportSettlementGroup(groups[gi], evaluated[gi], `FinalSettlement_Group${gi + 1}_${todayIso()}`); }} />
        )}

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

        {view === 'proposal' && (
          <>
            <div style={{ marginBottom: 10, fontSize: 12, color: '#64748b' }}>
              {proposalFromForm.length
                ? `প্রস্তাবনা শিট — “একাধিক কর্মীর হিসাব” ফর্মের ${proposalFromForm.length} জন কর্মী থেকে (ধরন অনুযায়ী আলাদা কলাম)।`
                : `প্রস্তাবনা শিট — সংরক্ষিত স্টেটমেন্টের ${proposalRows.length} জন কর্মী থেকে (ফিল্টার প্রযোজ্য)। ফর্মে কর্মী থাকলে সেগুলো থেকে হবে।`}
            </div>
            <div id="printable-area" ref={printAreaRef}>
              <FinalSettlementProposalPrintView rows={proposalRows} factoryName={factory.nameEn} factoryAddress={factory.addressEn} authorization={authorization} />
            </div>
          </>
        )}

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
      <SettlementImportModal open={importOpen} onClose={() => setImportOpen(false)} onDownloadTemplate={() => { void downloadSettlementTemplate(); }} defaultDate={data.settlementDate || todayIso()} onImport={handleImport} />
      {isStatementOut && sum.count < 0 && null}
    </>
  );
}