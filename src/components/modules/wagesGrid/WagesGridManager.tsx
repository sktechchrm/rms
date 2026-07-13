// ─────────────────────────────────────────────────────────────────────────────
// WagesGridManager.tsx
// Path: src/components/modules/wagesGrid/WagesGridManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import ModuleShell from '../../shell/ModuleShell';
import GradeForm from './GradeForm';
import GradeComplianceReport from './GradeComplianceReport';
import GradePrintView from './GradePrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { GradeDefinitionData, ScheduleType } from './types';
import { blankGradeDefinition, SCHEDULE_TYPE_OPTIONS } from './types';

const STEPS = [
  { id: 'form', label: 'গ্রেড সংজ্ঞা', icon: 'ti-hierarchy', fieldCount: 4 },
];

function recordToFormData(rec: Record<string, unknown>, prev: GradeDefinitionData): GradeDefinitionData {
  return {
    ...prev,
    gradeName:            String(rec.gradeName ?? ''),
    scheduleType:         (SCHEDULE_TYPE_OPTIONS.includes(rec.scheduleType as ScheduleType) ? rec.scheduleType : 'তফসিল-ক (শ্রমিক)') as ScheduleType,
    basicWage:            String(rec.basicWage ?? ''),
    houseRentAllowance:   String(rec.houseRentAllowance ?? ''),
    medicalAllowance:     String(rec.medicalAllowance ?? ''),
    conveyanceAllowance:  String(rec.conveyanceAllowance ?? ''),
    foodAllowance:        String(rec.foodAllowance ?? ''),
    effectiveDate:        toDateInput(rec.effectiveDate) || '',
    gazetteReference:     String(rec.gazetteReference ?? ''),
    remarks:              String(rec.remarks ?? ''),
    date:                 toDateInput(rec.date) || prev.date,
  };
}

export default function WagesGridManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets          = useDatabase('wagesgrid', factory.id, user?.name ?? 'unknown', 200);
  // Compliance checking needs ALL employees, not the default 50-record cap.
  const employeeSheets   = useDatabase('employees', factory.id, user?.name ?? 'unknown', 2000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'compliance' | 'printCompliance'>('form');
  const [data,          setData]          = useState<GradeDefinitionData>(blankGradeDefinition());

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankGradeDefinition(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    await exportToPDF({ element: el, filename: `WagesGrid_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    gradeName:            data.gradeName,
    scheduleType:         data.scheduleType,
    basicWage:            data.basicWage,
    houseRentAllowance:   data.houseRentAllowance,
    medicalAllowance:     data.medicalAllowance,
    conveyanceAllowance:  data.conveyanceAllowance,
    foodAllowance:        data.foodAllowance,
    effectiveDate:        data.effectiveDate,
    gazetteReference:     data.gazetteReference,
    remarks:              data.remarks,
    date:                 data.date,
    preparedBy:            authorization.preparedBy,
    preparedByDesignation: authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'Compliance Report', onClick: () => setActiveStep('compliance') },
    { label: 'প্রিন্ট প্রিভিউ',       onClick: () => setActiveStep('printCompliance') },
  ];
  const isBillActive = activeStep === 'compliance' || activeStep === 'printCompliance';

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
      `}</style>

      <ModuleShell
        moduleName="ওয়েজেস গ্রিড"
        moduleNameEn="Wages Grid"
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
        saveDisabled={!data.gradeName || !data.basicWage}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="wagesgrid"
        updateLabel="গ্রেড খুঁজুন"
        updateSearchPlaceholder="গ্রেডের নাম দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'গ্রেড',    value: data.gradeName || '—' },
          { label: 'তফসিল',   value: data.scheduleType },
          { label: 'কর্মী ডেটা', value: `${employeeSheets.records.length} জন লোড হয়েছে` },
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
          <GradeForm data={data} setData={setData} />
        )}

        {activeStep === 'compliance' && (
          <GradeComplianceReport
            employees={employeeSheets.records}
            gradeRecords={sheets.records}
            isLoading={employeeSheets.isLoading}
          />
        )}

        {activeStep === 'printCompliance' && (
          <div id="printable-area" ref={printAreaRef}>
            <GradePrintView
              employees={employeeSheets.records}
              gradeRecords={sheets.records}
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
