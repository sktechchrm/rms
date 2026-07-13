// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditManager.tsx
// Path: src/components/modules/complianceAudit/ComplianceAuditManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import ComplianceAuditForm from './ComplianceAuditForm';
import ComplianceAuditStatement from './ComplianceAuditStatement';
import ComplianceAuditPrintView from './ComplianceAuditPrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { ComplianceAuditData, AuditorItem, CorrectiveActionItem, AuditCategory, AuditRound } from './types';
import { blankComplianceAudit, blankAuditorItem, blankCorrectiveActionItem, AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS } from './types';

const STEPS = [
  { id: 'form', label: 'অডিট বিবরণ', icon: 'ti-clipboard-check', fieldCount: 6 },
];

function recordToFormData(rec: Record<string, unknown>, prev: ComplianceAuditData): ComplianceAuditData {
  return {
    ...prev,
    auditType:            (AUDIT_CATEGORY_OPTIONS.includes(rec.auditType as AuditCategory) ? rec.auditType : 'Internal') as AuditCategory,
    companyName:          String(rec.companyName ?? ''),
    siteName:              String(rec.siteName ?? ''),
    siteAddress:           String(rec.siteAddress ?? ''),
    siteContactName:       String(rec.siteContactName ?? ''),
    siteContactJobTitle:   String(rec.siteContactJobTitle ?? ''),
    sitePhone:              String(rec.sitePhone ?? ''),
    siteEmail:              String(rec.siteEmail ?? ''),
    auditRound:            (AUDIT_ROUND_OPTIONS.includes(rec.auditRound as AuditRound) ? rec.auditRound : 'Initial') as AuditRound,
    auditingAreas: (() => {
      try {
        const parsed = JSON.parse(String(rec.auditingAreasJson ?? '[]'));
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch { return []; }
    })(),
    auditDate:             toDateInput(rec.auditDate) || '',
    auditors: (() => {
      try {
        const parsed = JSON.parse(String(rec.auditorsJson ?? '[]'));
        if (!Array.isArray(parsed) || parsed.length === 0) return [blankAuditorItem(1)];
        return parsed.map((a, i): AuditorItem => ({
          slNo:        Number(a.slNo ?? i + 1),
          name:        String(a.name ?? ''),
          designation: String(a.designation ?? ''),
          organization: String(a.organization ?? ''),
        }));
      } catch { return [blankAuditorItem(1)]; }
    })(),
    correctiveActions: (() => {
      try {
        const parsed = JSON.parse(String(rec.correctiveActionsJson ?? '[]'));
        if (!Array.isArray(parsed) || parsed.length === 0) return [blankCorrectiveActionItem(1)];
        return parsed.map((c, i): CorrectiveActionItem => ({
          slNo:                        Number(c.slNo ?? i + 1),
          nonComplianceNumber:         String(c.nonComplianceNumber ?? ''),
          detailsOfNonCompliance:      String(c.detailsOfNonCompliance ?? ''),
          nonCompliancePictureLink:    String(c.nonCompliancePictureLink ?? ''),
          preventiveCorrectiveActions: String(c.preventiveCorrectiveActions ?? ''),
          timeline:                    String(c.timeline ?? ''),
          agreedByManagement:          String(c.agreedByManagement ?? ''),
          responsiblePersonName:       String(c.responsiblePersonName ?? ''),
        }));
      } catch { return [blankCorrectiveActionItem(1)]; }
    })(),
    remarks: String(rec.remarks ?? ''),
    date:    toDateInput(rec.date) || prev.date,
  };
}

export default function ComplianceAuditManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('complianceaudit', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'print'>('form');
  const [data,          setData]          = useState<ComplianceAuditData>(blankComplianceAudit());

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn, companyName: prev.companyName || factory.nameEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankComplianceAudit(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    await exportToPDF({ element: el, filename: `ComplianceAudit_${data.siteName || data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    auditType:             data.auditType,
    companyName:           data.companyName,
    siteName:               data.siteName,
    siteAddress:            data.siteAddress,
    siteContactName:        data.siteContactName,
    siteContactJobTitle:    data.siteContactJobTitle,
    sitePhone:               data.sitePhone,
    siteEmail:               data.siteEmail,
    auditRound:             data.auditRound,
    auditingAreasJson:      JSON.stringify(data.auditingAreas),
    auditDate:              data.auditDate,
    auditorsJson:           JSON.stringify(data.auditors),
    correctiveActionsJson:  JSON.stringify(data.correctiveActions),
    remarks:                 data.remarks,
    date:                    data.date,
    preparedBy:              authorization.preparedBy,
    preparedByDesignation:   authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'Tracking Dashboard', onClick: () => setActiveStep('tracking') },
    { label: 'Audit Report প্রিন্ট', onClick: () => setActiveStep('print') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'print';

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
      `}</style>

      <ModuleShell
        moduleName="কমপ্লায়েন্স অডিট"
        moduleNameEn="Compliance Audit"
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
        saveDisabled={!data.siteName || !data.companyName}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="complianceaudit"
        updateLabel="অডিট খুঁজুন"
        updateSearchPlaceholder="Site বা Company নাম দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'Site',        value: data.siteName || '—' },
          { label: 'অডিট ধরন',    value: data.auditType },
          { label: 'Non-Compliance', value: `${data.correctiveActions.length} টা` },
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
          <ComplianceAuditForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <ComplianceAuditStatement
            records={sheets.records}
            onEdit={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onDelete={(id: string) => { sheets.remove(id); }}
            onPrintFiltered={() => setActiveStep('print')}
          />
        )}

        {activeStep === 'print' && (
          <div id="printable-area" ref={printAreaRef}>
            <ComplianceAuditPrintView data={data} authorization={authorization} />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
