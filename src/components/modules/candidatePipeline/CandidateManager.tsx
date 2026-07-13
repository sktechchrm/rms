// ─────────────────────────────────────────────────────────────────────────────
// CandidateManager.tsx
// Path: src/components/modules/candidatePipeline/CandidateManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import CandidateForm from './CandidateForm';
import CandidateStatement from './CandidateStatement';
import CandidatePrintView from './CandidatePrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { CandidateData, CandidateStage } from './types';
import { blankCandidateData, STAGE_OPTIONS } from './types';

const STEPS = [
  { id: 'form', label: 'প্রার্থীর তথ্য', icon: 'ti-user-plus', fieldCount: 4 },
];

function recordToFormData(rec: Record<string, unknown>, prev: CandidateData): CandidateData {
  return {
    ...prev,
    candidateName:         String(rec.candidateName ?? ''),
    phone:                  String(rec.phone ?? ''),
    email:                  String(rec.email ?? ''),
    positionAppliedFor:    String(rec.positionAppliedFor ?? ''),
    department:             String(rec.department ?? ''),
    requisitionReference:  String(rec.requisitionReference ?? ''),
    applicationDate:        toDateInput(rec.applicationDate) || prev.applicationDate,
    source:                  String(rec.source ?? 'Job Portal'),
    stage:                   (STAGE_OPTIONS.includes(rec.stage as CandidateStage) ? rec.stage : 'Applied') as CandidateStage,
    interviewDate:           toDateInput(rec.interviewDate) || '',
    interviewFeedback:      String(rec.interviewFeedback ?? ''),
    expectedSalary:          String(rec.expectedSalary ?? ''),
    offeredSalary:           String(rec.offeredSalary ?? ''),
    joiningDate:             toDateInput(rec.joiningDate) || '',
    remarks:                 String(rec.remarks ?? ''),
    date:                    toDateInput(rec.date) || prev.date,
  };
}

export default function CandidateManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('candidates', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'printTracking'>('form');
  const [data,          setData]          = useState<CandidateData>(blankCandidateData());
  const [printRecords,  setPrintRecords]  = useState<DbRecord[]>([]);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankCandidateData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    await exportToPDF({ element: el, filename: `CandidatePipeline_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    candidateName:         data.candidateName,
    phone:                  data.phone,
    email:                  data.email,
    positionAppliedFor:    data.positionAppliedFor,
    department:             data.department,
    requisitionReference:  data.requisitionReference,
    applicationDate:        data.applicationDate,
    source:                  data.source,
    stage:                   data.stage,
    interviewDate:           data.interviewDate,
    interviewFeedback:      data.interviewFeedback,
    expectedSalary:          data.expectedSalary,
    offeredSalary:           data.offeredSalary,
    joiningDate:             data.joiningDate,
    remarks:                 data.remarks,
    date:                    data.date,
    preparedBy:              authorization.preparedBy,
    preparedByDesignation:   authorization.preparedByDesignation,
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
        moduleName="প্রার্থী ট্র্যাকিং (Candidate Pipeline)"
        moduleNameEn="Candidate Pipeline"
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
        saveDisabled={!data.candidateName || !data.positionAppliedFor}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="candidates"
        updateLabel="প্রার্থী খুঁজুন"
        updateSearchPlaceholder="নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'প্রার্থী', value: data.candidateName || '—' },
          { label: 'পদ',       value: data.positionAppliedFor || '—' },
          { label: 'Stage',    value: data.stage },
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
          <CandidateForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <CandidateStatement
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
            <CandidatePrintView
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
