// ─────────────────────────────────────────────────────────────────────────────
// OnboardingManager.tsx
// Path: src/components/modules/onboardingChecklist/OnboardingManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import OnboardingForm from './OnboardingForm';
import OnboardingStatement from './OnboardingStatement';
import OnboardingPrintView from './OnboardingPrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { OnboardingChecklistData, ChecklistItem, ProbationStatus } from './types';
import { blankOnboardingData, blankChecklistItem, CHECKLIST_ITEM_KEYS, PROBATION_STATUS_OPTIONS, calculateProgress } from './types';

const STEPS = [
  { id: 'form', label: 'অনবোর্ডিং তথ্য', icon: 'ti-user-check', fieldCount: 4 },
];

function recordToFormData(rec: Record<string, unknown>, prev: OnboardingChecklistData): OnboardingChecklistData {
  const loadItem = (key: string): ChecklistItem => {
    try {
      const parsed = JSON.parse(String(rec[`${key}Json`] ?? '{}'));
      return {
        completed: Boolean(parsed.completed),
        completedDate: String(parsed.completedDate ?? ''),
        notes: String(parsed.notes ?? ''),
      };
    } catch { return blankChecklistItem(); }
  };

  return {
    ...prev,
    employeeName:        String(rec.employeeName ?? ''),
    cardNo:               String(rec.cardNo ?? ''),
    designation:          String(rec.designation ?? ''),
    department:           String(rec.department ?? ''),
    joiningDate:          toDateInput(rec.joiningDate) || prev.joiningDate,
    candidateReference:   String(rec.candidateReference ?? ''),
    mentorName:            String(rec.mentorName ?? ''),
    probationStartDate:   toDateInput(rec.probationStartDate) || '',
    probationEndDate:     toDateInput(rec.probationEndDate) || '',
    probationStatus:      (PROBATION_STATUS_OPTIONS.includes(rec.probationStatus as ProbationStatus) ? rec.probationStatus : '') as ProbationStatus,
    documentVerification:  loadItem('documentVerification'),
    idCardIssued:           loadItem('idCardIssued'),
    bankAccountSetup:       loadItem('bankAccountSetup'),
    inductionTraining:      loadItem('inductionTraining'),
    departmentIntroduction: loadItem('departmentIntroduction'),
    equipmentUniformIssued: loadItem('equipmentUniformIssued'),
    policyAcknowledgment:   loadItem('policyAcknowledgment'),
    remarks:               String(rec.remarks ?? ''),
    date:                   toDateInput(rec.date) || prev.date,
  };
}

export default function OnboardingManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('onboarding', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'printTracking'>('form');
  const [data,          setData]          = useState<OnboardingChecklistData>(blankOnboardingData());
  const [printRecords,  setPrintRecords]  = useState<DbRecord[]>([]);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankOnboardingData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    await exportToPDF({ element: el, filename: `Onboarding_${data.date}`, scale: 2 });
  };

  const buildRecord = () => {
    const itemFields: Record<string, string> = {};
    for (const key of CHECKLIST_ITEM_KEYS) {
      itemFields[`${key}Json`] = JSON.stringify(data[key]);
    }
    return {
      employeeName:        data.employeeName,
      cardNo:               data.cardNo,
      designation:          data.designation,
      department:           data.department,
      joiningDate:          data.joiningDate,
      candidateReference:   data.candidateReference,
      mentorName:            data.mentorName,
      probationStartDate:   data.probationStartDate,
      probationEndDate:     data.probationEndDate,
      probationStatus:      data.probationStatus,
      ...itemFields,
      remarks:               data.remarks,
      date:                   data.date,
      preparedBy:             authorization.preparedBy,
      preparedByDesignation: authorization.preparedByDesignation,
    };
  };

  const billItems = [
    { label: 'Tracking Dashboard', onClick: () => setActiveStep('tracking') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'printTracking';
  const progress = calculateProgress(data);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
      `}</style>

      <ModuleShell
        moduleName="অনবোর্ডিং চেকলিস্ট"
        moduleNameEn="Onboarding Checklist"
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
        saveDisabled={!data.employeeName || !data.cardNo}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="onboarding"
        updateLabel="অনবোর্ডিং রেকর্ড খুঁজুন"
        updateSearchPlaceholder="নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'কর্মী',    value: data.employeeName || '—' },
          { label: 'অগ্রগতি',  value: `${progress.done}/${progress.total} (${progress.percent}%)` },
          { label: 'প্রবেশনকাল', value: data.probationStatus || '—' },
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
          <OnboardingForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <OnboardingStatement
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
            <OnboardingPrintView
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
