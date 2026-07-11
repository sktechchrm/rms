// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitManager.tsx
// Path: src/components/modules/auditVisit/AuditVisitManager.tsx
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
import AuditVisitStatementPrintView from './AuditVisitStatementPrintView';
import AuditVisitStatement from './AuditVisitStatement';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import { getExpiryStatus } from '../../../utils/expiryStatus';
import type { AuditVisitData, ValidityUnit } from './types';
import { INITIAL_AUDIT_VISIT_STATE, calculateValidUntil } from './types';

const STEPS = [
  { id: 'form', label: 'অডিট/ভিজিট এন্ট্রি', icon: 'ti-clipboard-check', fieldCount: 3 },
];

function recordToFormData(rec: Record<string, unknown>, prev: AuditVisitData): AuditVisitData {
  return {
    ...prev,
    auditCertification:  String(rec.auditCertification  ?? ''),
    standardBuyer:        String(rec.standardBuyer        ?? ''),
    auditorOrganization:  String(rec.auditorOrganization  ?? ''),
    visitDate:             toDateInput(rec.visitDate)     || prev.visitDate,
    validityPeriodValue:   String(rec.validityPeriodValue ?? ''),
    validityPeriodUnit:    (rec.validityPeriodUnit === 'year' ? 'year' : 'month') as ValidityUnit,
    reportCertificate:     String(rec.reportCertificate   ?? ''),
  };
}

export default function AuditVisitManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('auditvisits', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'statement' | 'printList'>('form');
  const [printListRecords, setPrintListRecords] = useState<DbRecord[]>([]);
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
    const filename = `AuditVisit_${data.visitDate || 'Record'}`;
    await exportToPDF({ element: el, filename, scale: 2 });
  };

  const buildRecord = () => ({
    auditCertification:    data.auditCertification,
    standardBuyer:          data.standardBuyer,
    auditorOrganization:    data.auditorOrganization,
    visitDate:               data.visitDate,
    validityPeriodValue:    data.validityPeriodValue,
    validityPeriodUnit:      data.validityPeriodUnit,
    reportCertificate:      data.reportCertificate,
    preparedBy:              authorization.preparedBy,
    preparedByDesignation:   authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setActiveStep('statement') },
    {
      label: 'প্রিন্ট প্রিভিউ',
      onClick: () => {
        // Per explicit request: Print Preview now shows the list/statement
        // print view directly (all currently saved records) — the old
        // single-record vertical print view is no longer used anywhere.
        setPrintListRecords(sheets.records);
        setActiveStep('printList');
      },
    },
  ];
  const isBillActive = activeStep === 'statement' || activeStep === 'printList';

  const validUntil = calculateValidUntil(data.visitDate, data.validityPeriodValue, data.validityPeriodUnit);
  const status = getExpiryStatus(validUntil);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
      `}</style>

      <ModuleShell
        moduleName="অডিট/ভিজিট/সার্টিফিকেশন বৈধতা রেকর্ড"
        moduleNameEn="Audit/Visit/Certification Validity Record"
        date={data.visitDate}
        onDateChange={d => setData(p => ({ ...p, visitDate: d }))}

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
        saveDisabled={!data.auditCertification || !data.visitDate}

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
        updateSearchPlaceholder="অডিট বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'অডিট/সার্টিফিকেশন', value: data.auditCertification || '—' },
          { label: 'Valid Until',        value: validUntil || '—' },
          { label: 'অবস্থা',              value: status === 'expired' ? 'মেয়াদোত্তীর্ণ' : status === 'due-soon' ? 'শীঘ্রই মেয়াদ শেষ' : status === 'valid' ? 'বৈধ' : '—' },
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
            onEdit={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onDelete={(id: string) => { sheets.remove(id); }}
            onPrintList={(filteredRecords: DbRecord[]) => {
              setPrintListRecords(filteredRecords);
              setActiveStep('printList');
            }}
          />
        )}

        {activeStep === 'printList' && (
          <div id="printable-area" ref={printAreaRef}>
            <AuditVisitStatementPrintView
              records={printListRecords}
              factoryName={data.factoryName}
              factoryAddress={data.factoryAddress}
              authorization={authorization}
            />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
