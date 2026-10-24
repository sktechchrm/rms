// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionManager.tsx
// Path: src/components/modules/correctiveAction/CorrectiveActionManager.tsx
//
// Same structure as the Legal Document / Audit Visit Managers:
//   - Statement filters are owned HERE and passed down to
//     CorrectiveActionStatement. `filteredRecords` is computed once (useMemo) with
//     the shared filterCapEntries() and used by the Print Preview tabs, the Excel
//     export and a hidden, off-screen print copy that stays mounted while the
//     Statement is open (so the header Print / PDF buttons work from the Statement).
//   - PRINT PREVIEW has TWO tabs: "স্টেটমেন্ট" (NC details) and "এভিডেন্স"
//     (evidence). Print / PDF export only the tab you are on; the PDF file name
//     carries _Statement or _Evidence.
//   - EXCEL: the Statement's "⬇ Excel" button exports the filtered list
//     (capExcel.ts, needs `npm install xlsx`).
//   - Save is blocked while the Target Completion Date is before the Audit Date
//     and while an evidence file is still uploading.
//   - Printing is A4 LANDSCAPE.
//
// DATABASE: records are stored under the module key 'correctiveactions'.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import CorrectiveActionFormComponent from './CorrectiveActionForm';
import CorrectiveActionStatementPrintView from './CorrectiveActionStatementPrintView';
import CorrectiveActionStatement from './CorrectiveActionStatement';
import { exportCapExcel } from './capExcel';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { CorrectiveActionData, CapFilters } from './types';
import {
  INITIAL_CORRECTIVE_ACTION_STATE,
  EMPTY_CAP_FILTERS,
  buildCapEntries,
  filterCapEntries,
  getCapState,
  formatDMY,
  todayIso,
  CAP_STATUS_OPTIONS,
} from './types';

const STEPS = [
  { id: 'form', label: 'সিএপি এন্ট্রি', icon: 'ti-clipboard-list', fieldCount: 3 },
];

const STATE_BN: Record<string, string> = {
  'overdue':  'সময় পেরিয়ে গেছে',
  'due-soon': 'শীঘ্রই শেষ',
  'on-track': 'সময়মতো চলমান',
  'done':     'সমাপ্ত',
  'no-date':  '—',
};

type Step = 'form' | 'statement' | 'printList' | 'printEvidence';

// Dropdown values saved by older/other data that aren't in the option lists
// fall back to the first option instead of leaving the <select> blank.
const pick = (value: unknown, options: string[]) =>
  options.includes(String(value ?? '')) ? String(value) : options[0];

function recordToFormData(rec: Record<string, unknown>, prev: CorrectiveActionData): CorrectiveActionData {
  const str = (k: string) => String(rec[k] ?? '');
  const date = (k: string) => (rec[k] ? toDateInput(rec[k]) || '' : '');
  return {
    ...prev,
    auditConductedBy:   str('auditConductedBy'),
    auditDate:          date('auditDate'),
    ncId:               str('ncId'),
    ncDescription:      str('ncDescription'),
    ncReference:        str('ncReference'),
    ncCategory:         str('ncCategory'),
    rootCause:          str('rootCause'),
    correctiveAction:   str('correctiveAction'),
    targetDate:         date('targetDate'),
    responsiblePersons: str('responsiblePersons'),
    capStatus:          pick(rec.capStatus, CAP_STATUS_OPTIONS),
    evidence1: str('evidence1'), evidence1Name: str('evidence1Name'),
    evidence2: str('evidence2'), evidence2Name: str('evidence2Name'),
    evidence3: str('evidence3'), evidence3Name: str('evidence3Name'),
  };
}

export default function CorrectiveActionManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('correctiveactions', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<Step>('form');
  const [data,          setData]          = useState<CorrectiveActionData>(INITIAL_CORRECTIVE_ACTION_STATE);
  const [uploading,     setUploading]     = useState(false);   // an evidence file is being uploaded
  // Statement filters — owned here so Print Preview / print / Excel can follow them.
  const [filters,       setFilters]       = useState<CapFilters>(EMPTY_CAP_FILTERS);

  // Currently filtered list — single source for Statement print, Print Preview and Excel.
  const filteredRecords = useMemo(
    () => filterCapEntries(buildCapEntries(sheets.records), filters).map(e => e.rec),
    [sheets.records, filters],
  );

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...INITIAL_CORRECTIVE_ACTION_STATE, factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
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
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 landscape;margin:12mm;}body{margin:0;}${styles}</style>
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
    const suffix = activeStep === 'printEvidence' ? '_Evidence' : activeStep === 'printList' ? '_Statement' : '';
    const filename = `CorrectiveActionPlan${suffix}_${todayIso()}`;
    await exportToPDF({ element: el, filename, scale: 2 });
  };

  const buildRecord = () => ({
    auditConductedBy:       data.auditConductedBy,
    auditDate:              data.auditDate,
    ncId:                   data.ncId,
    ncDescription:          data.ncDescription,
    ncReference:            data.ncReference,
    ncCategory:             data.ncCategory,
    rootCause:              data.rootCause,
    correctiveAction:       data.correctiveAction,
    targetDate:             data.targetDate,
    responsiblePersons:     data.responsiblePersons,
    capStatus:              data.capStatus,
    evidence1: data.evidence1, evidence1Name: data.evidence1Name,
    evidence2: data.evidence2, evidence2Name: data.evidence2Name,
    evidence3: data.evidence3, evidence3Name: data.evidence3Name,
    preparedBy:             authorization.preparedBy,
    preparedByDesignation:  authorization.preparedByDesignation,
  });

  const billItems = [
    { id: 'statement',     label: 'স্টেটমেন্ট (তালিকা)',          onClick: () => setActiveStep('statement') },
    { id: 'printList',     label: 'প্রিন্ট প্রিভিউ — স্টেটমেন্ট', onClick: () => setActiveStep('printList') },
    { id: 'printEvidence', label: 'প্রিন্ট প্রিভিউ — এভিডেন্স',   onClick: () => setActiveStep('printEvidence') },
  ];
  const isBillActive = activeStep === 'statement' || activeStep === 'printList' || activeStep === 'printEvidence';

  const { state, detail } = getCapState(data.targetDate, data.capStatus);
  const rangeInvalid = Boolean(data.auditDate && data.targetDate && data.targetDate < data.auditDate);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        @media print {
          .cap-print-offscreen { position: static !important; left: auto !important; width: auto !important; }
        }
      `}</style>

      <ModuleShell
        moduleName="সংশোধনমূলক কর্মপরিকল্পনা (CAP) রেকর্ড"
        moduleNameEn="Corrective Action Plan (CAP) Record"
        date={formatDMY(todayIso())}

        steps={STEPS}
        activeStep={activeStep}
        onStepChange={id => setActiveStep(id as Step)}

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
        saveDisabled={!data.ncId.trim() || !data.ncDescription.trim() || rangeInvalid || uploading}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="correctiveactions"
        updateLabel="CAP রেকর্ড খুঁজুন"
        updateSearchPlaceholder="এনসি আইডি বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'এনসি আইডি',  value: data.ncId || '—' },
          { label: 'লক্ষ্য তারিখ', value: formatDMY(data.targetDate) || '—' },
          { label: 'অবস্থা',       value: `${STATE_BN[state]}${detail ? ` (${detail})` : ''}` },
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
        recordLabel={rec => String(rec.ncId ?? rec.id ?? '—')}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        lang="bn"
      >
        {activeStep === 'form' && (
          <CorrectiveActionFormComponent data={data} setData={setData} onUploadingChange={setUploading} />
        )}

        {activeStep === 'statement' && (
          <CorrectiveActionStatement
            records={sheets.records}
            filters={filters}
            onFiltersChange={setFilters}
            onExportExcel={() => void exportCapExcel(filteredRecords, `CorrectiveActionPlan_${todayIso()}`)}
            onEdit={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onDelete={(id: string) => { sheets.remove(id); }}
          />
        )}

        {/* Hidden print copy of the filtered list (both parts), so the header
            Print / PDF buttons work directly from the Statement. Off-screen
            (not display:none) so it still lays out for print/PDF capture. */}
        {activeStep === 'statement' && (
          <div
            className="cap-print-offscreen"
            aria-hidden="true"
            style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}
          >
            <div id="printable-area" ref={printAreaRef}>
              <CorrectiveActionStatementPrintView
                records={filteredRecords}
                factoryName={data.factoryName}
                factoryAddress={data.factoryAddress}
                authorization={authorization}
                part="all"
              />
            </div>
          </div>
        )}

        {/* Print Preview — two tabs: Statement and Evidence */}
        {(activeStep === 'printList' || activeStep === 'printEvidence') && (
          <div id="printable-area" ref={printAreaRef}>
            <CorrectiveActionStatementPrintView
              records={filteredRecords}
              factoryName={data.factoryName}
              factoryAddress={data.factoryAddress}
              authorization={authorization}
              part={activeStep === 'printEvidence' ? 'evidence' : 'statement'}
            />
          </div>
        )}
      </ModuleShell>
    </>
  );
}