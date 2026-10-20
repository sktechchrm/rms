// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitManager.tsx
// Path: src/components/modules/auditVisit/AuditVisitManager.tsx
//
// UPDATE (Print Preview follows the Statement filters): the Statement's
// filter state (Visit Date From, Valid Until To, Status, Search) is now
// owned HERE and passed down to AuditVisitStatement. The "প্রিন্ট প্রিভিউ"
// menu item applies the same filterAuditEntries() the Statement table uses,
// so Print Preview shows exactly the list currently selected in the
// Statement — All → everything, Valid → only valid, Delayed → only
// delayed, and so on. The print view also receives the full register
// (contextRecords) so renewal statuses stay correct on a filtered print.
//
// UPDATE (Visit Date range): `visitEndDate` (optional last audit day) is read
// into / saved from the form. An end date equal to (or before) the start is
// saved as '' (= single-day). Save is blocked while end < start. Valid Until
// uses getValidityBase() (last audit day) — see types.ts.
//
// UPDATE (print directly from Statement): the Statement's own "Print List"
// button is gone. `filteredRecords` is now computed here once (useMemo) and
// used by BOTH the visible Print Preview step and a hidden, off-screen print
// copy that stays mounted while the Statement is open. The header Print /
// PDF buttons (handlePrint / handleExportPDF) read #printable-area through
// printAreaRef, so they now print the filtered list straight from the
// Statement — no need to open Print Preview first.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
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
import type { AuditVisitData, ValidityUnit, AuditFilters } from './types';
import {
  INITIAL_AUDIT_VISIT_STATE,
  EMPTY_AUDIT_FILTERS,
  calculateValidUntil,
  getValidityBase,
  buildAuditRenewalChains,
  filterAuditEntries,
} from './types';

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
    visitEndDate:          rec.visitEndDate ? toDateInput(rec.visitEndDate) : '',
  };
}

export default function AuditVisitManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('auditvisits', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'statement' | 'printList'>('form');
  const [data,          setData]          = useState<AuditVisitData>(INITIAL_AUDIT_VISIT_STATE);
  // Statement filters — owned here so Print Preview can follow them.
  const [filters,       setFilters]       = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);

  // Currently filtered list — single source for Statement print + Print Preview.
  const filteredRecords = useMemo(
    () => filterAuditEntries(buildAuditRenewalChains(sheets.records), filters).map(e => e.rec),
    [sheets.records, filters],
  );

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
    visitEndDate:            data.visitEndDate && data.visitEndDate > data.visitDate ? data.visitEndDate : '',
    validityPeriodValue:    data.validityPeriodValue,
    validityPeriodUnit:      data.validityPeriodUnit,
    reportCertificate:      data.reportCertificate,
    preparedBy:              authorization.preparedBy,
    preparedByDesignation:   authorization.preparedByDesignation,
  });

  const billItems = [
    { id: 'statement', label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setActiveStep('statement') },
    {
      id: 'printList',
      label: 'প্রিন্ট প্রিভিউ',
      // Print Preview = exactly what the Statement (তালিকা) is currently
      // showing (filteredRecords: same shared filters, chains built from
      // the full register so renewal-aware statuses stay correct).
      onClick: () => setActiveStep('printList'),
    },
  ];
  const isBillActive = activeStep === 'statement' || activeStep === 'printList';

  // Visit Date may be a range — validity counts from the LAST audit day.
  const rangeInvalid = Boolean(data.visitEndDate) && data.visitEndDate < data.visitDate;
  const validUntil = calculateValidUntil(
    getValidityBase(data.visitDate, data.visitEndDate), data.validityPeriodValue, data.validityPeriodUnit,
  );
  const status = getExpiryStatus(validUntil);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
        @media print {
          .audit-print-offscreen { position: static !important; left: auto !important; width: auto !important; }
        }
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
        activeBillId={isBillActive ? activeStep : null}

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
        saveDisabled={!data.auditCertification || !data.visitDate || rangeInvalid}

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
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onDelete={(id: string) => { sheets.remove(id); }}
          />
        )}

        {/* Hidden print copy of the filtered list, so the header Print / PDF
            buttons work directly from the Statement. Off-screen (not
            display:none) so it still lays out for print/PDF capture. */}
        {activeStep === 'statement' && (
          <div
            className="audit-print-offscreen"
            aria-hidden="true"
            style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}
          >
            <div id="printable-area" ref={printAreaRef}>
              <AuditVisitStatementPrintView
                records={filteredRecords}
                contextRecords={sheets.records}
                factoryName={data.factoryName}
                factoryAddress={data.factoryAddress}
                authorization={authorization}
              />
            </div>
          </div>
        )}

        {activeStep === 'printList' && (
          <div id="printable-area" ref={printAreaRef}>
            <AuditVisitStatementPrintView
              records={filteredRecords}
              contextRecords={sheets.records}
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