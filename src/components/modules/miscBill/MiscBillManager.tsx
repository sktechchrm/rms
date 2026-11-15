// ─────────────────────────────────────────────────────────────────────────────
// MiscBillManager.tsx — Miscellaneous Bill (English-only UI)
// Path: src/components/modules/miscBill/MiscBillManager.tsx
//
// Steps / outputs:
//   • Bill Details   — the entry form (one bill = subject + date + employee lines), saved as one record.
//   • Statement      — every saved bill: summary, filters, sort, template chips, Print / PDF / Excel.
//   • Bill Preview   — the printable bill (portrait) for the bill in the form or opened from the statement.
//   • Statement Print— the filtered list (landscape).
// Filters are owned here, so the statement, print, PDF and Excel all show the same rows.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import ModuleShell from '../../shell/ModuleShell';
import MiscBillFormComponent from './MiscBillForm';
import MiscBillPrintDispatcher from './MiscBillPrintDispatcher';
import MiscBillStatement from './MiscBillStatement';
import MiscBillListPrintView from './MiscBillListPrintView';
import { exportMiscBillExcel } from './miscBillExcel';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import type { MiscBillData, MiscBillItem } from './types';
import { INITIAL_MISC_BILL_STATE, calculatePayableAmount, TEMPLATE_OPTIONS } from './types';
import type { BillFilters } from './miscBillModel';
import { EMPTY_BILL_FILTERS, buildBillRows, filterRows, rowFromData, parseItems, templateOf, formatDMY, todayIso, countActiveFilters } from './miscBillModel';

type Step = 'form' | 'statement' | 'preview' | 'printList';

const STEPS = [{ id: 'form', label: 'Bill Details', icon: 'ti-file-invoice', fieldCount: 3 }];

/** Saved bill → form state. */
function recordToFormData(rec: Record<string, unknown>, prev: MiscBillData): MiscBillData {
  return {
    ...prev,
    template: templateOf(rec.template),
    subject: String(rec.subject ?? ''),
    date: toDateInput(rec.date) || prev.date,
    items: parseItems(rec.itemsJson),
  };
}

export default function MiscBillManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('miscbills', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep, setActiveStep]       = useState<Step>('form');
  const [data, setData]                   = useState<MiscBillData>(INITIAL_MISC_BILL_STATE);
  const [filters, setFilters]             = useState<BillFilters>(EMPTY_BILL_FILTERS);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  // ── statement rows (same rows feed the screen, the print list, PDF and Excel) ──
  const allRows      = useMemo(() => buildBillRows(sheets.records), [sheets.records]);
  const filteredRows = useMemo(() => filterRows(allRows, filters), [allRows, filters]);
  const grandTotal   = useMemo(() => data.items.reduce((s, it) => s + calculatePayableAmount(data.template, it.grossSalary, it.count, it.manualPayableAmount), 0), [data]);

  const isPreview   = activeStep === 'preview';
  const isList      = activeStep === 'statement' || activeStep === 'printList';
  const filterText  = countActiveFilters(filters) > 0 ? `Filtered: ${filteredRows.length} of ${allRows.length} bills` : '';
  const fileBase    = `MiscBill_${isPreview ? `${data.template}_${data.subject.replace(/[^a-z0-9]/gi, '_') || 'Bill'}` : 'Statement'}_${todayIso()}`;

  const handleReset = (goto: Step = 'form') => {
    setData(prev => ({ ...INITIAL_MISC_BILL_STATE, factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep(goto);
    sheets.setEditingId(null);
  };

  // ── print: bill → portrait, statement list → landscape ──
  const handlePrint = () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) { window.print(); return; }
    const landscape = isList;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${landscape ? '297mm' : '210mm'};height:${landscape ? '210mm' : '297mm'};border:none;`;
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.styleSheets)
      .map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase}</title>
      <style>@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    const win = iframe.contentWindow!;
    win.addEventListener('afterprint', () => { if (iframe.parentNode) document.body.removeChild(iframe); });
    setTimeout(() => { win.focus(); win.print(); }, 250);
  };

  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({
      element: el, filename: fileBase, scale: 3, rowSafeBreaks: true, printStyle: true,
      orientation: isList ? 'landscape' : 'portrait',
    });
  };

  // ── Excel: statement → every filtered bill; preview → the bill in the form ──
  const handleExportExcel = () => {
    if (isPreview) exportMiscBillExcel([rowFromData(data)], fileBase);
    else exportMiscBillExcel(filteredRows, fileBase);
  };

  const buildRecord = () => ({
    template:              data.template,
    subject:               data.subject,
    date:                  data.date,
    preparedBy:            authorization.preparedBy,
    preparedByDesignation: authorization.preparedByDesignation,
    itemsJson:             JSON.stringify(data.items),
    totalItems:            String(data.items?.length ?? 0),
    totalAmount:           grandTotal.toFixed(2),
  });

  const loadRecord = (rec: Record<string, unknown>, goto: Step) => {
    sheets.setEditingId(String(rec.id ?? ''));
    setData(p => recordToFormData(rec, p));
    setActiveStep(goto);
  };
  const byId = (id: string) => sheets.records.find(r => String(r.id ?? '') === id) as unknown as Record<string, unknown> | undefined;

  const billItems = [
    { id: 'statement',  label: 'Statement (saved bills)', onClick: () => setActiveStep('statement') },
    { id: 'preview',    label: 'Bill Preview',            onClick: () => setActiveStep('preview') },
    { id: 'printList',  label: 'Statement Print Preview', onClick: () => setActiveStep('printList') },
  ];

  const listView = (
    <MiscBillListPrintView rows={filteredRows} factoryName={factory.nameEn} factoryAddress={factory.addressEn} authorization={authorization} filterText={filterText} />
  );

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
        @media print { .mb-offscreen { position: static !important; left: auto !important; width: auto !important; } }
      `}</style>

      <ModuleShell
        moduleName="Miscellaneous Bill"
        moduleNameEn="Miscellaneous Bill"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={activeStep === 'form' ? 'form' : ''}
        onStepChange={() => setActiveStep('form')}

        billItems={billItems}
        isBillActive={activeStep !== 'form'}
        activeBillId={activeStep !== 'form' ? activeStep : null}
        hideBillHeading

        onSave={async () => {
          const record = buildRecord();
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
          if (ok) handleReset('statement');
          return ok;
        }}
        isSaving={sheets.isSaving}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={!data.subject.trim()}

        editingId={sheets.editingId}
        onCancelEdit={() => handleReset('form')}
        onReset={() => handleReset('form')}
        isDirty={Boolean(data.subject.trim() || data.items.some(it => it.name.trim()))}

        onUpdate={rec => loadRecord(rec, 'form')}
        updateModule="miscbills"
        updateLabel="Search Miscellaneous Bill"
        updateSearchPlaceholder="Search by subject or ID..."

        // Global Employee Search: adds the employee as a new first line (same as "+ Add Employee").
        // Maps to cardNo and department only.
        onEmployeeSelect={emp => {
          setData(p => {
            const newItem: MiscBillItem = {
              slNo: 1, particulars: '',
              name: String(emp.fullNameBengali ?? emp.fullName ?? ''),
              cardNo: String(emp.cardNo ?? ''),
              designation: String(emp.designation ?? ''),
              department: String(emp.department ?? ''),
              grossSalary: String(emp.grossSalary ?? ''),
              count: '', manualPayableAmount: '', remarks: '',
            };
            return { ...p, items: [newItem, ...p.items].map((it, i) => ({ ...it, slNo: i + 1 })) };
          });
          setActiveStep('form');
        }}

        calcRows={[
          { label: 'Template',      value: TEMPLATE_OPTIONS.find(t => t.value === data.template)?.label ?? '—' },
          { label: 'Bill date',     value: formatDMY(data.date) || '—' },
          { label: 'Entries',       value: `${data.items.length}` },
          { label: 'Grand Total',   value: `Tk ${grandTotal.toFixed(2)}` },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => { loadRecord(rec as Record<string, unknown>, 'form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onDeleteRecord={async (id: string) => {
          const ok = await sheets.remove(id);
          if (ok && sheets.editingId === id) handleReset('statement');
          return ok;
        }}
        onReload={sheets.reload}
        recordLabel={rec => `${String(rec.subject ?? rec.id ?? '—')} · ${formatDMY(toDateInput(rec.date) || '')}`}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExportExcel}
        lang="en"
      >
        {activeStep === 'form' && (
          <MiscBillFormComponent data={data} setData={setData} />
        )}

        {activeStep === 'statement' && (
          <MiscBillStatement
            rows={allRows}
            filters={filters}
            onFiltersChange={setFilters}
            onPreview={id => { const r = byId(id); if (r) loadRecord(r, 'preview'); }}
            onEdit={id => { const r = byId(id); if (r) loadRecord(r, 'form'); }}
            onDelete={id => { void sheets.remove(id); }}
            onAdd={() => handleReset('form')}
          />
        )}

        {/* Hidden print copy so the header Print / PDF buttons work from the statement. */}
        {activeStep === 'statement' && (
          <div className="mb-offscreen" aria-hidden="true" style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}>
            <div id="printable-area" ref={printAreaRef}>{listView}</div>
          </div>
        )}

        {activeStep === 'printList' && (
          <div id="printable-area" ref={printAreaRef}>{listView}</div>
        )}

        {isPreview && (
          <div id="printable-area" ref={printAreaRef}>
            <MiscBillPrintDispatcher data={data} authorization={authorization} />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
