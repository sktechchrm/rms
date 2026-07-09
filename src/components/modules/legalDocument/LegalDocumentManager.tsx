// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentManager.tsx
// Path: src/components/modules/legalDocument/LegalDocumentManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import LegalDocumentFormComponent from './LegalDocumentForm';
import LegalDocumentPrintView from './LegalDocumentPrintView';
import LegalDocumentStatement from './LegalDocumentStatement';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import type { LegalDocumentData } from './types';
import { INITIAL_LEGAL_DOCUMENT_STATE, getExpiryStatus } from './types';

const STEPS = [
  { id: 'form', label: 'দলিল এন্ট্রি', icon: 'ti-file-certificate', fieldCount: 2 },
];

function recordToFormData(rec: Record<string, unknown>, prev: LegalDocumentData): LegalDocumentData {
  return {
    ...prev,
    documentDetails:   String(rec.documentDetails   ?? ''),
    mentionedCapacity: String(rec.mentionedCapacity ?? ''),
    dateReceived:      toDateInput(rec.dateReceived) || '',
    dateExpire:        toDateInput(rec.dateExpire)   || '',
    authorityBody:     String(rec.authorityBody      ?? ''),
  };
}

export default function LegalDocumentManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('legaldocuments', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'statement' | 'print'>('form');
  const [data,          setData]          = useState<LegalDocumentData>(INITIAL_LEGAL_DOCUMENT_STATE);

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
    const filename = `LegalDocument_${data.documentDetails.replace(/[^a-z0-9]/gi, '_') || 'Record'}`;
    await exportToPDF({ element: el, filename, scale: 2 });
  };

  const buildRecord = () => ({
    documentDetails:       data.documentDetails,
    mentionedCapacity:     data.mentionedCapacity,
    dateReceived:          data.dateReceived,
    dateExpire:            data.dateExpire,
    authorityBody:         data.authorityBody,
    preparedBy:            authorization.preparedBy,
    preparedByDesignation: authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setActiveStep('statement') },
    { label: 'প্রিন্ট প্রিভিউ',      onClick: () => setActiveStep('print') },
  ];
  const isBillActive = activeStep === 'statement' || activeStep === 'print';

  const status = getExpiryStatus(data.dateExpire);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
      `}</style>

      <ModuleShell
        moduleName="আইনি দলিল বৈধতার অবস্থা"
        moduleNameEn="Legal Document Validity Status"
        date={data.dateReceived || new Date().toISOString().split('T')[0]}
        onDateChange={d => setData(p => ({ ...p, dateReceived: d }))}

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
        saveDisabled={!data.documentDetails || !data.dateExpire}

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
        updateSearchPlaceholder="দলিলের নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'দলিল',   value: data.documentDetails || '—' },
          { label: 'মেয়াদ শেষ', value: data.dateExpire || '—' },
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
            onSelect={(rec: DbRecord) => {
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('print');
            }}
          />
        )}

        {activeStep === 'print' && (
          <div id="printable-area" ref={printAreaRef}>
            <LegalDocumentPrintView data={data} authorization={authorization} />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
