// ─────────────────────────────────────────────────────────────────────────────
// TrainingManager.tsx
// Path: src/components/modules/trainingModule/TrainingManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import TrainingForm from './TrainingForm';
import TrainingStatement from './TrainingStatement';
import TrainingPrintView from './TrainingPrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { TrainingData, ParticipantItem, TrainingStatus } from './types';
import { blankTrainingData, TRAINING_STATUS_OPTIONS } from './types';

const STEPS = [
  { id: 'form', label: 'প্রশিক্ষণ সেশন', icon: 'ti-school', fieldCount: 5 },
];

function recordToFormData(rec: Record<string, unknown>, prev: TrainingData): TrainingData {
  return {
    ...prev,
    trainingTopic:  String(rec.trainingTopic ?? ''),
    customTopic:    String(rec.customTopic ?? ''),
    trainingMonth:  String(rec.trainingMonth ?? prev.trainingMonth),
    trainingYear:   String(rec.trainingYear ?? prev.trainingYear),
    noticeIssueDate: toDateInput(rec.noticeIssueDate) || '',
    noticeDetails:   String(rec.noticeDetails ?? ''),
    trainerName:     String(rec.trainerName ?? ''),
    scheduledDate:   toDateInput(rec.scheduledDate) || '',
    scheduledTime:   String(rec.scheduledTime ?? ''),
    venue:           String(rec.venue ?? ''),
    duration:        String(rec.duration ?? ''),
    status:          (TRAINING_STATUS_OPTIONS.includes(rec.status as TrainingStatus) ? rec.status : 'Planned') as TrainingStatus,
    conductedDate:   toDateInput(rec.conductedDate) || '',
    pictureLink:     String(rec.pictureLink ?? ''),
    participants: (() => {
      try {
        const parsed = JSON.parse(String(rec.participantsJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.participants;
        return parsed.map((p, i): ParticipantItem => ({
          slNo:        Number(p.slNo ?? i + 1),
          name:        String(p.name ?? ''),
          cardNo:      String(p.cardNo ?? ''),
          designation: String(p.designation ?? ''),
          department:  String(p.department ?? ''),
          attended:    Boolean(p.attended),
        }));
      } catch { return prev.participants; }
    })(),
    remarks: String(rec.remarks ?? ''),
    date:    toDateInput(rec.date) || prev.date,
  };
}

export default function TrainingManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('trainingsessions', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'printTracking'>('form');
  const [data,          setData]          = useState<TrainingData>(blankTrainingData());
  const [printRecords,  setPrintRecords]  = useState<DbRecord[]>([]);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankTrainingData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    await exportToPDF({ element: el, filename: `Training_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    trainingTopic:   data.trainingTopic,
    customTopic:     data.customTopic,
    trainingMonth:   data.trainingMonth,
    trainingYear:    data.trainingYear,
    noticeIssueDate: data.noticeIssueDate,
    noticeDetails:   data.noticeDetails,
    trainerName:     data.trainerName,
    scheduledDate:   data.scheduledDate,
    scheduledTime:   data.scheduledTime,
    venue:           data.venue,
    duration:        data.duration,
    status:          data.status,
    conductedDate:   data.conductedDate,
    pictureLink:     data.pictureLink,
    participantsJson: JSON.stringify(data.participants),
    remarks:          data.remarks,
    date:             data.date,
    preparedBy:              authorization.preparedBy,
    preparedByDesignation:   authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'Tracking Dashboard', onClick: () => setActiveStep('tracking') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'printTracking';
  const attendedCount = data.participants.filter(p => p.attended).length;

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
      `}</style>

      <ModuleShell
        moduleName="প্রশিক্ষণ মডিউল"
        moduleNameEn="Training Module"
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
        saveDisabled={!data.trainingTopic}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="trainingsessions"
        updateLabel="প্রশিক্ষণ সেশন খুঁজুন"
        updateSearchPlaceholder="বিষয় বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'বিষয়',        value: (data.trainingTopic === 'অন্যান্য (Other)' ? data.customTopic : data.trainingTopic) || '—' },
          { label: 'স্ট্যাটাস',    value: data.status },
          { label: 'অংশগ্রহণকারী', value: `${attendedCount}/${data.participants.length}` },
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
          <TrainingForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <TrainingStatement
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
            <TrainingPrintView
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
