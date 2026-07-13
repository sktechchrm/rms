// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentManager.tsx
// Path: src/components/modules/riskAssessment/RiskAssessmentManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import RiskAssessmentForm from './RiskAssessmentForm';
import RiskAssessmentStatement from './RiskAssessmentStatement';
import RiskAssessmentPrintView from './RiskAssessmentPrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { RiskAssessmentData, RiskLevel } from './types';
import { blankRiskAssessment, RISK_LEVEL_OPTIONS } from './types';

const STEPS = [
  { id: 'form', label: 'ঝুঁকি এন্ট্রি', icon: 'ti-alert-triangle', fieldCount: 4 },
];

function recordToFormData(rec: Record<string, unknown>, prev: RiskAssessmentData): RiskAssessmentData {
  return {
    ...prev,
    section:                       String(rec.section ?? ''),
    source:                        String(rec.source ?? ''),
    riskIdentification:            String(rec.riskIdentification ?? ''),
    impact:                        String(rec.impact ?? ''),
    remedy:                        String(rec.remedy ?? ''),
    causeInvestigation:            String(rec.causeInvestigation ?? ''),
    riskLevel:                     (RISK_LEVEL_OPTIONS.includes(rec.riskLevel as RiskLevel) ? rec.riskLevel : '') as RiskLevel,
    correctiveAction:              String(rec.correctiveAction ?? ''),
    correctiveActionDate:          toDateInput(rec.correctiveActionDate) || '',
    responsiblePersonName:         String(rec.responsiblePersonName ?? ''),
    responsiblePersonDesignation:  String(rec.responsiblePersonDesignation ?? ''),
    remarks:                       String(rec.remarks ?? ''),
    date:                          toDateInput(rec.date) || prev.date,
  };
}

export default function RiskAssessmentManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('riskassessment', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'printTracking'>('form');
  const [data,          setData]          = useState<RiskAssessmentData>(blankRiskAssessment());
  const [printRecords,  setPrintRecords]  = useState<DbRecord[]>([]);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankRiskAssessment(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    await exportToPDF({ element: el, filename: `RiskAssessment_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    section:                       data.section,
    source:                        data.source,
    riskIdentification:            data.riskIdentification,
    impact:                        data.impact,
    remedy:                        data.remedy,
    causeInvestigation:            data.causeInvestigation,
    riskLevel:                     data.riskLevel,
    correctiveAction:              data.correctiveAction,
    correctiveActionDate:          data.correctiveActionDate,
    responsiblePersonName:         data.responsiblePersonName,
    responsiblePersonDesignation:  data.responsiblePersonDesignation,
    remarks:                       data.remarks,
    date:                          data.date,
    preparedBy:                    authorization.preparedBy,
    preparedByDesignation:         authorization.preparedByDesignation,
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
        moduleName="ঝুঁকি মূল্যায়ন"
        moduleNameEn="Risk Assessment"
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
        saveDisabled={!data.section || !data.riskIdentification || !data.riskLevel}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="riskassessment"
        updateLabel="ঝুঁকি এন্ট্রি খুঁজুন"
        updateSearchPlaceholder="সেকশন বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'সেকশন',      value: data.section || '—' },
          { label: 'উৎস',        value: data.source || '—' },
          { label: 'ঝুঁকির মাত্রা', value: data.riskLevel || '—' },
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
          <RiskAssessmentForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <RiskAssessmentStatement
            records={sheets.records}
            onEdit={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onDelete={(id: string) => { sheets.remove(id); }}
            onPrintFiltered={(filtered: DbRecord[]) => {
              setPrintRecords(filtered);
              setActiveStep('printTracking');
            }}
          />
        )}

        {activeStep === 'printTracking' && (
          <div id="printable-area" ref={printAreaRef}>
            <RiskAssessmentPrintView
              records={printRecords}
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
