// ─────────────────────────────────────────────────────────────────────────────
// EmergencyLogManager.tsx
// Path: src/components/modules/emergencyLog/EmergencyLogManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import EmergencyLogForm from './EmergencyLogForm';
import EmergencyLogStatement from './EmergencyLogStatement';
import EmergencyLogPrintView from './EmergencyLogPrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { EmergencyLogData, LogType, Severity, InvestigationStatus, ResolutionStatus } from './types';
import { blankEmergencyLogData, LOG_TYPE_OPTIONS, SEVERITY_OPTIONS, INVESTIGATION_STATUS_OPTIONS, RESOLUTION_STATUS_OPTIONS } from './types';

const STEPS = [
  { id: 'form', label: 'এন্ট্রি', icon: 'ti-alert-triangle', fieldCount: 4 },
];

function recordToFormData(rec: Record<string, unknown>, prev: EmergencyLogData): EmergencyLogData {
  return {
    ...prev,
    logType:                    (LOG_TYPE_OPTIONS.includes(rec.logType as LogType) ? rec.logType : 'Injury and Accident Log') as LogType,
    employeeName:                String(rec.employeeName ?? ''),
    cardNo:                       String(rec.cardNo ?? ''),
    designation:                  String(rec.designation ?? ''),
    department:                   String(rec.department ?? ''),
    date:                         toDateInput(rec.date) || prev.date,
    remarks:                      String(rec.remarks ?? ''),
    timeOfIncident:               String(rec.timeOfIncident ?? ''),
    locationOfIncident:           String(rec.locationOfIncident ?? ''),
    typeOfInjury:                 String(rec.typeOfInjury ?? ''),
    severity:                     (SEVERITY_OPTIONS.includes(rec.severity as Severity) ? rec.severity : '') as Severity,
    incidentDescription:          String(rec.incidentDescription ?? ''),
    immediateActionTaken:         String(rec.immediateActionTaken ?? ''),
    firstAidGiven:                rec.firstAidGiven === 'true' || rec.firstAidGiven === true,
    medicalTreatmentRequired:     rec.medicalTreatmentRequired === 'true' || rec.medicalTreatmentRequired === true,
    hospitalReferred:             rec.hospitalReferred === 'true' || rec.hospitalReferred === true,
    hospitalName:                 String(rec.hospitalName ?? ''),
    witnessNames:                 String(rec.witnessNames ?? ''),
    reportedBy:                   String(rec.reportedBy ?? ''),
    investigationStatus:          (INVESTIGATION_STATUS_OPTIONS.includes(rec.investigationStatus as InvestigationStatus) ? rec.investigationStatus : '') as InvestigationStatus,
    correctiveAction:             String(rec.correctiveAction ?? ''),
    daysLost:                     String(rec.daysLost ?? ''),
    natureOfGrievance:            String(rec.natureOfGrievance ?? ''),
    grievanceCategory:            String(rec.grievanceCategory ?? ''),
    actionTaken:                  String(rec.actionTaken ?? ''),
    resolutionStatus:             (RESOLUTION_STATUS_OPTIONS.includes(rec.resolutionStatus as ResolutionStatus) ? rec.resolutionStatus : '') as ResolutionStatus,
    resolutionDate:               toDateInput(rec.resolutionDate) || '',
  };
}

export default function EmergencyLogManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('emergencylog', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'printTracking'>('form');
  const [data,          setData]          = useState<EmergencyLogData>(blankEmergencyLogData());
  const [printRecords,  setPrintRecords]  = useState<DbRecord[]>([]);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankEmergencyLogData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    await exportToPDF({ element: el, filename: `EmergencyLog_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    logType:                    data.logType,
    employeeName:                data.employeeName,
    cardNo:                       data.cardNo,
    designation:                  data.designation,
    department:                   data.department,
    date:                         data.date,
    remarks:                      data.remarks,
    timeOfIncident:               data.timeOfIncident,
    locationOfIncident:           data.locationOfIncident,
    typeOfInjury:                 data.typeOfInjury,
    severity:                     data.severity,
    incidentDescription:          data.incidentDescription,
    immediateActionTaken:         data.immediateActionTaken,
    firstAidGiven:                String(data.firstAidGiven),
    medicalTreatmentRequired:     String(data.medicalTreatmentRequired),
    hospitalReferred:             String(data.hospitalReferred),
    hospitalName:                 data.hospitalName,
    witnessNames:                 data.witnessNames,
    reportedBy:                   data.reportedBy,
    investigationStatus:          data.investigationStatus,
    correctiveAction:             data.correctiveAction,
    daysLost:                     data.daysLost,
    natureOfGrievance:            data.natureOfGrievance,
    grievanceCategory:            data.grievanceCategory,
    actionTaken:                  data.actionTaken,
    resolutionStatus:             data.resolutionStatus,
    resolutionDate:               data.resolutionDate,
    preparedBy:                   authorization.preparedBy,
    preparedByDesignation:        authorization.preparedByDesignation,
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
        moduleName="ইমার্জেন্সি লগ"
        moduleNameEn="Emergency Log"
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
        updateModule="emergencylog"
        updateLabel="এন্ট্রি খুঁজুন"
        updateSearchPlaceholder="নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'Log Type', value: data.logType },
          { label: 'কর্মী',    value: data.employeeName || '—' },
          { label: 'অবস্থা',   value: data.logType === 'Injury and Accident Log' ? (data.investigationStatus || '—') : (data.resolutionStatus || '—') },
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
          <EmergencyLogForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <EmergencyLogStatement
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
            <EmergencyLogPrintView
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
