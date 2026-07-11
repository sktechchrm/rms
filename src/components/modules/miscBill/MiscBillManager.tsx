// ─────────────────────────────────────────────────────────────────────────────
// MiscBillManager.tsx
// Path: src/components/modules/miscBill/MiscBillManager.tsx
//
// English-only UI (lang="en", no Bengali labels anywhere in this module).
// Global Employee Search now maps to ONLY employee.cardNo (not idNo) and
// ONLY employee.department (not sectionLine) — the previous OR-fallback
// mapping was exactly what caused the Card/ID and Dept/Section ambiguity.
// Basic Salary is no longer part of the item shape at all — it's computed
// dynamically from Gross Salary wherever it's shown (see types.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import ModuleShell from '../../shell/ModuleShell';
import MiscBillFormComponent from './MiscBillForm';
import MiscBillPrintDispatcher from './MiscBillPrintDispatcher';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import type { MiscBillData, MiscBillItem, MiscBillTemplate } from './types';
import { INITIAL_MISC_BILL_STATE, calculatePayableAmount } from './types';

const STEPS = [
  { id: 'form', label: 'Bill Details', icon: 'ti-file-invoice', fieldCount: 3 },
];

function recordToFormData(rec: Record<string, unknown>, prev: MiscBillData): MiscBillData {
  const template: MiscBillTemplate =
    (rec.template === 'adjustment' || rec.template === 'festival') ? rec.template : 'holiday';
  return {
    ...prev,
    template,
    subject:  String(rec.subject ?? ''),
    date:     toDateInput(rec.date) || prev.date,
    items: (() => {
      try {
        const parsed = JSON.parse(String(rec.itemsJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.items;
        return parsed.map((it, i): MiscBillItem => ({
          slNo:                Number(it.slNo ?? i + 1),
          particulars:         String(it.particulars ?? ''),
          name:                String(it.name ?? ''),
          cardNo:              String(it.cardNo ?? it.cardId ?? ''), // cardId fallback: read old-shape records saved before this rename
          designation:         String(it.designation ?? ''),
          department:          String(it.department ?? it.deptSection ?? ''), // deptSection fallback: same reason
          grossSalary:         String(it.grossSalary ?? ''),
          count:               String(it.count ?? ''),
          manualPayableAmount: String(it.manualPayableAmount ?? ''),
          remarks:             String(it.remarks ?? ''),
        }));
      } catch { return prev.items; }
    })(),
  };
}

export default function MiscBillManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('miscbills', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'preview'>('form');
  const [data,          setData]          = useState<MiscBillData>(INITIAL_MISC_BILL_STATE);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...INITIAL_MISC_BILL_STATE, factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep('form');
    sheets.setEditingId(null);
  };

  const handlePrint = () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) { window.print(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.styleSheets)
      .map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 portrait;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
    };
  };

  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    const filename = `MiscBill_${data.template}_${data.subject.replace(/[^a-z0-9]/gi, '_') || 'Bill'}_${new Date().toISOString().split('T')[0]}`;
    await exportToPDF({ element: el, filename, scale: 2 });
  };

  const buildRecord = () => ({
    template:              data.template,
    subject:               data.subject,
    date:                  data.date,
    preparedBy:            authorization.preparedBy,
    preparedByDesignation: authorization.preparedByDesignation,
    itemsJson:             JSON.stringify(data.items),
    totalItems:            String(data.items?.length ?? 0),
    totalAmount:           data.items.reduce((s, it) => s + calculatePayableAmount(data.template, it.grossSalary, it.count, it.manualPayableAmount), 0).toFixed(2),
  });

  const billItems = [{ label: 'Preview', onClick: () => setActiveStep('preview') }];
  const isPreview = activeStep === 'preview';

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
      `}</style>

      <ModuleShell
        moduleName="Miscellaneous Bill"
        moduleNameEn="Miscellaneous Bill"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={activeStep}
        onStepChange={id => setActiveStep(id as 'form')}

        billItems={billItems}
        isBillActive={isPreview}

        onSave={async () => {
          const record = buildRecord();
          const ok = sheets.editingId
            ? await sheets.update(sheets.editingId, record)
            : await sheets.save(record);
          if (ok) handleReset();
          return ok;
        }}
        isSaving={sheets.isSaving}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={!data.subject}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="miscbills"
        updateLabel="Search Miscellaneous Bill"
        updateSearchPlaceholder="Search by subject or ID..."

        // Global Employee Search: prepends a new row (same convention as
        // the existing "+ Add Employee" button) rather than overwriting
        // "the form". Maps to cardNo/department ONLY — no more idNo/
        // sectionLine OR-fallback, which was the actual source of the
        // Card/ID vs Dept/Section ambiguity. Basic Salary isn't filled
        // here at all — it's computed dynamically from Gross Salary.
        onEmployeeSelect={emp => {
          setData(p => {
            const newItem: MiscBillItem = {
              slNo: 1,
              particulars: '',
              name:        String(emp.fullNameBengali ?? emp.fullName ?? ''),
              cardNo:      String(emp.cardNo ?? ''),
              designation: String(emp.designation ?? ''),
              department:  String(emp.department ?? ''),
              grossSalary: String(emp.grossSalary ?? ''),
              count: '',
              manualPayableAmount: '',
              remarks: '',
            };
            const reNumbered = [newItem, ...p.items].map((it, i) => ({ ...it, slNo: i + 1 }));
            return { ...p, items: reNumbered };
          });
        }}

        calcRows={[
          { label: 'Template',    value: data.template === 'holiday' ? 'Holiday Bill' : data.template === 'festival' ? 'Festival Holiday Bill' : 'Adjustment Bill' },
          { label: 'Total Entries', value: `${data.items?.length ?? 0}` },
          { label: 'Grand Total',  value: `Tk ${data.items.reduce((s, it) => s + calculatePayableAmount(data.template, it.grossSalary, it.count, it.manualPayableAmount), 0).toFixed(2)}` },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec as Record<string, unknown>, p));
          setActiveStep('form');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={sheets.remove}
        onReload={sheets.reload}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        lang="en"
      >
        {activeStep === 'form' && (
          <MiscBillFormComponent data={data} setData={setData} />
        )}

        {activeStep === 'preview' && (
          <div id="printable-area" ref={printAreaRef}>
            <MiscBillPrintDispatcher data={data} authorization={authorization} />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
