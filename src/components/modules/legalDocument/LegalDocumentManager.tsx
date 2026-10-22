// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentManager.tsx
// Path: src/components/modules/legalDocument/LegalDocumentManager.tsx
//
// UPDATE (same behaviour as the Audit/Visit Manager):
//   - Statement filters (Issue Date From, Expiry Date To, Month-Year, Category,
//     Status, Search) are owned HERE and passed down to LegalDocumentStatement.
//     "প্রিন্ট প্রিভিউ" prints exactly the list the Statement is showing:
//     `filteredRecords` is computed once (useMemo) with the shared
//     filterLegalEntries() and used by both Print Preview and a hidden,
//     off-screen print copy that stays mounted while the Statement is open, so
//     the header Print / PDF buttons (handlePrint / handleExportPDF read
//     #printable-area through printAreaRef) work directly from the Statement.
//     The Statement's own "Print List" button is gone.
//   - Expiry Date can't be before Issue Date: Save is blocked while it is
//     (the form shows the error). The "মেয়াদ শেষ" calc row shows DD-MM-YYYY.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import LegalDocumentFormComponent from './LegalDocumentForm';
import LegalDocumentStatementPrintView from './LegalDocumentStatementPrintView';
import LegalDocumentStatement from './LegalDocumentStatement';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import { getExpiryStatus } from '../../../utils/expiryStatus';
import type { LegalDocumentData, LegalFilters } from './types';
import {
  INITIAL_LEGAL_DOCUMENT_STATE,
  EMPTY_LEGAL_FILTERS,
  buildLegalEntries,
  filterLegalEntries,
  formatDMY,
} from './types';

const STEPS = [
  { id: 'form', label: 'দলিল এন্ট্রি', icon: 'ti-file-certificate', fieldCount: 3 },
];

function recordToFormData(rec: Record<string, unknown>, prev: LegalDocumentData): LegalDocumentData {
  return {
    ...prev,
    documentTitle:    String(rec.documentTitle    ?? ''),
    category:         String(rec.category         ?? 'License'),
    documentNo:       String(rec.documentNo        ?? ''),
    issuingAuthority: String(rec.issuingAuthority  ?? ''),
    issueDate:        toDateInput(rec.issueDate)   || '',
    expiryDate:       toDateInput(rec.expiryDate)  || '',
    attachment:       String(rec.attachment        ?? ''),
  };
}

export default function LegalDocumentManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('legaldocuments', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'statement' | 'printList'>('form');
  const [data,          setData]          = useState<LegalDocumentData>(INITIAL_LEGAL_DOCUMENT_STATE);
  // Statement filters — owned here so Print Preview / print can follow them.
  const [filters,       setFilters]       = useState<LegalFilters>(EMPTY_LEGAL_FILTERS);

  // Currently filtered list — single source for Statement print + Print Preview.
  const filteredRecords = useMemo(
    () => filterLegalEntries(buildLegalEntries(sheets.records), filters).map(e => e.rec),
    [sheets.records, filters],
  );

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...INITIAL_LEGAL_DOCUMENT_STATE, factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    const filename = `LegalDocument_${data.documentTitle.replace(/[^a-z0-9]/gi, '_') || 'Record'}`;
    await exportToPDF({ element: el, filename, scale: 2 });
  };

  const buildRecord = () => ({
    documentTitle:         data.documentTitle,
    category:               data.category,
    documentNo:             data.documentNo,
    issuingAuthority:       data.issuingAuthority,
    issueDate:              data.issueDate,
    expiryDate:             data.expiryDate,
    attachment:             data.attachment,
    preparedBy:             authorization.preparedBy,
    preparedByDesignation:  authorization.preparedByDesignation,
  });

  const billItems = [
    { id: 'statement', label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setActiveStep('statement') },
    {
      id: 'printList',
      label: 'প্রিন্ট প্রিভিউ',
      // Print Preview = exactly what the Statement (তালিকা) is currently
      // showing (filteredRecords: same shared filters).
      onClick: () => setActiveStep('printList'),
    },
  ];
  const isBillActive = activeStep === 'statement' || activeStep === 'printList';

  const status = getExpiryStatus(data.expiryDate);
  const rangeInvalid = Boolean(data.issueDate && data.expiryDate && data.expiryDate < data.issueDate);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
        @media print {
          .legal-print-offscreen { position: static !important; left: auto !important; width: auto !important; }
        }
      `}</style>

      <ModuleShell
        moduleName="আইনি দলিল/লাইসেন্স/সার্টিফিকেট/চুক্তি রেকর্ড"
        moduleNameEn="Legal Document/License/Certificate/Agreement Record"
        date={data.issueDate || new Date().toISOString().split('T')[0]}
        onDateChange={d => setData(p => ({ ...p, issueDate: d }))}

        steps={STEPS}
        activeStep={activeStep}
        onStepChange={id => setActiveStep(id as 'form')}

        billItems={billItems}
        isBillActive={isBillActive}
        activeBillId={isBillActive ? activeStep : null}
        hideBillHeading

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
        saveDisabled={!data.documentTitle || !data.expiryDate || rangeInvalid}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="legaldocuments"
        updateLabel="দলিল রেকর্ড খুঁজুন"
        updateSearchPlaceholder="শিরোনাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'দলিল',   value: data.documentTitle || '—' },
          { label: 'মেয়াদ শেষ', value: formatDMY(data.expiryDate) || '—' },
          { label: 'অবস্থা',  value: status === 'expired' ? 'মেয়াদোত্তীর্ণ' : status === 'due-soon' ? 'শীঘ্রই মেয়াদ শেষ' : status === 'valid' ? 'বৈধ' : '—' },
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
          <LegalDocumentFormComponent data={data} setData={setData} />
        )}

        {activeStep === 'statement' && (
          <LegalDocumentStatement
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
            className="legal-print-offscreen"
            aria-hidden="true"
            style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}
          >
            <div id="printable-area" ref={printAreaRef}>
              <LegalDocumentStatementPrintView
                records={filteredRecords}
                factoryName={data.factoryName}
                factoryAddress={data.factoryAddress}
                authorization={authorization}
              />
            </div>
          </div>
        )}

        {activeStep === 'printList' && (
          <div id="printable-area" ref={printAreaRef}>
            <LegalDocumentStatementPrintView
              records={filteredRecords}
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