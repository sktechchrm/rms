// ─────────────────────────────────────────────────────────────────────────────
// SupplierManager.tsx
// Path: src/components/modules/supplierAssessment/SupplierManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import SupplierForm from './SupplierForm';
import SupplierStatement from './SupplierStatement';
import SupplierPrintView from './SupplierPrintView';
import type { FlatRow } from './SupplierStatement';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { SupplierData, SupplierAssessmentEntry, ApprovalStatus, SupplierAssessmentStandard } from './types';
import { blankSupplierData } from './types';

const STEPS = [
  { id: 'form', label: 'সাপ্লায়ার তথ্য ও অ্যাসেসমেন্ট', icon: 'ti-clipboard-check', fieldCount: 4 },
];

function recordToFormData(rec: Record<string, unknown>, prev: SupplierData): SupplierData {
  return {
    ...prev,
    supplierName:    String(rec.supplierName    ?? ''),
    address:         String(rec.address         ?? ''),
    contactPerson:   String(rec.contactPerson   ?? ''),
    phone:           String(rec.phone           ?? ''),
    email:           String(rec.email           ?? ''),
    businessType:    String(rec.businessType    ?? 'Manufacturer'),
    productCategory: String(rec.productCategory ?? ''),
    tradeLicenseNo:  String(rec.tradeLicenseNo  ?? ''),
    assessments: (() => {
      try {
        const parsed = JSON.parse(String(rec.assessmentsJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.assessments;
        return parsed.map((a, i): SupplierAssessmentEntry => ({
          slNo:                   Number(a.slNo ?? i + 1),
          standard:               (['BSCI', 'Sedex SMETA', 'WRAP', 'Other'].includes(a.standard) ? a.standard : 'BSCI') as SupplierAssessmentStandard,
          auditType:              String(a.auditType ?? ''),
          auditDate:              String(a.auditDate ?? ''),
          auditorBody:            String(a.auditorBody ?? ''),
          score:                  String(a.score ?? ''),
          keyFindings:            String(a.keyFindings ?? ''),
          nonConformities:        String(a.nonConformities ?? ''),
          certificateValidUntil:  String(a.certificateValidUntil ?? ''),
          reportLink:             String(a.reportLink ?? ''),
          approvalStatus:         (['Pending', 'Approved', 'Conditional', 'Rejected'].includes(a.approvalStatus) ? a.approvalStatus : 'Pending') as ApprovalStatus,
          approvalConditions:     String(a.approvalConditions ?? ''),
          approvedBy:             String(a.approvedBy ?? ''),
          approvalDate:           String(a.approvalDate ?? ''),
          nextReviewDate:         String(a.nextReviewDate ?? ''),
        }));
      } catch { return prev.assessments; }
    })(),
    date: toDateInput(rec.date) || prev.date,
  };
}

export default function SupplierManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('suppliers', factory.id, user?.name ?? 'unknown', 500);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'printTracking'>('form');
  const [data,          setData]          = useState<SupplierData>(blankSupplierData());
  const [printRows,     setPrintRows]     = useState<FlatRow[]>([]);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankSupplierData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep('form');
    sheets.setEditingId(null);
  };

  const handlePrint = () => {
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
    // Black-box print fix (see other modules for the fuller explanation):
    // forces html/body to plain white/black, placed AFTER the copied
    // stylesheets so it wins the cascade.
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 landscape;margin:10mm 12mm;}body{margin:0;}${styles}</style>
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
    await exportToPDF({ element: el, filename: `SupplierAssessment_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    supplierName:    data.supplierName,
    address:         data.address,
    contactPerson:   data.contactPerson,
    phone:           data.phone,
    email:           data.email,
    businessType:    data.businessType,
    productCategory: data.productCategory,
    tradeLicenseNo:  data.tradeLicenseNo,
    assessmentsJson: JSON.stringify(data.assessments),
    totalAssessments: String(data.assessments?.length ?? 0),
    date:            data.date,
    preparedBy:            authorization.preparedBy,
    preparedByDesignation: authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'Tracking Dashboard', onClick: () => setActiveStep('tracking') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'printTracking';

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
      `}</style>

      <ModuleShell
        moduleName="সাপ্লায়ার অ্যাসেসমেন্ট, অনুমোদন ও ট্র্যাকিং"
        moduleNameEn="Supplier Assessment, Approval & Tracking"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={activeStep === 'form' ? 'form' : ''}
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
        saveDisabled={!data.supplierName}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="suppliers"
        updateLabel="সাপ্লায়ার খুঁজুন"
        updateSearchPlaceholder="নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'সাপ্লায়ার', value: data.supplierName || '—' },
          { label: 'মোট Assessment', value: `${data.assessments?.length ?? 0} টি` },
          { label: 'ব্যবসার ধরন', value: data.businessType || '—' },
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
          <SupplierForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <SupplierStatement
            records={sheets.records}
            onEditSupplier={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onPrintFiltered={(rows: FlatRow[]) => {
              setPrintRows(rows);
              setActiveStep('printTracking');
            }}
          />
        )}

        {activeStep === 'printTracking' && (
          <div id="printable-area" ref={printAreaRef}>
            <SupplierPrintView
              rows={printRows}
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
