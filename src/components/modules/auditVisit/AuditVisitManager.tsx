// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitManager.tsx
// Path: src/components/modules/auditVisit/AuditVisitManager.tsx
//
// REDESIGN: one saved record per audit/visit entry (fixed form, matches
// Left Employee Notice's save model) — NOT one document containing many
// line items (that was the earlier, incorrect Requisition-style design).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import AuditVisitFormComponent from './AuditVisitForm';
import AuditVisitPrintView from './AuditVisitPrintView';
import AuditVisitStatement from './AuditVisitStatement';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import type { AuditVisitData } from './types';
import { INITIAL_AUDIT_VISIT_STATE } from './types';

const STEPS = [
  { id: 'form', label: 'অডিট/ভিজিট এন্ট্রি', icon: 'ti-clipboard-check', fieldCount: 3 },
];

function recordToFormData(rec: Record<string, unknown>, prev: AuditVisitData): AuditVisitData {
  return {
    ...prev,
    date:             toDateInput(rec.date) || prev.date,
    type:             rec.type === 'Visit' ? 'Visit' : 'Audit',
    duration:         String(rec.duration ?? '1 day'),
    certificationFor: String(rec.certificationFor ?? ''),
    auditFirm:        String(rec.auditFirm ?? ''),
    auditorName:      String(rec.auditorName ?? ''),
    auditMode:        rec.auditMode === 'Un-announced' ? 'Un-announced' : 'Announced',
    resultsScore:     String(rec.resultsScore ?? ''),
    validityMonths:   String(rec.validityMonths ?? ''),
    validityYears:    String(rec.validityYears ?? ''),
  };
}

export default function AuditVisitManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('auditvisits', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'statement' | 'print'>('form');
  const [data,          setData]          = useState<AuditVisitData>(INITIAL_AUDIT_VISIT_STATE);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...INITIAL_AUDIT_VISIT_STATE, factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    const filename = `AuditVisit_${data.date || 'Record'}`;
    await exportToPDF({ element: el, filename, scale: 2 });
  };

  const buildRecord = () => ({
    date:                  data.date,
    type:                  data.type,
    duration:              data.duration,
    certificationFor:      data.certificationFor,
    auditFirm:             data.auditFirm,
    auditorName:           data.auditorName,
    auditMode:             data.auditMode,
    resultsScore:          data.resultsScore,
    validityMonths:        data.validityMonths,
    validityYears:         data.validityYears,
    preparedBy:            authorization.preparedBy,
    preparedByDesignation: authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setActiveStep('statement') },
    { label: 'প্রিন্ট প্রিভিউ',      onClick: () => setActiveStep('print') },
  ];
  const isBillActive = activeStep === 'statement' || activeStep === 'print';

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
      `}</style>

      <ModuleShell
        moduleName="অডিট/ভিজিট রেকর্ড"
        moduleNameEn="Audit/Visit Record"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={activeStep}
        onStepChange={id => setActiveStep(id as 'form')}

        billItems={billItems}
        isBillActive={isBillActive}

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
        saveDisabled={!data.date}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="auditvisits"
        updateLabel="অডিট/ভিজিট রেকর্ড খুঁজুন"
        updateSearchPlaceholder="অডিট ফার্ম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'ধরন',    value: data.type },
          { label: 'সময়কাল', value: data.duration },
          { label: 'তারিখ',   value: data.date || '—' },
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
        lang="bn"
      >
        {activeStep === 'form' && (
          <AuditVisitFormComponent data={data} setData={setData} />
        )}

        {activeStep === 'statement' && (
          <AuditVisitStatement
            records={sheets.records}
            onSelect={(rec: DbRecord) => {
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('print');
            }}
          />
        )}

        {activeStep === 'print' && (
          <div id="printable-area" ref={printAreaRef}>
            <AuditVisitPrintView data={data} authorization={authorization} />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
