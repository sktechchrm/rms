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
//   - PRINT PREVIEW has TWO tabs: "স্টেটমেন্ট" and "এভিডেন্স". Print / PDF export only
//     the tab you are on; the PDF file name carries _Statement or _Evidence.
//   - PDF: direct A4-LANDSCAPE download through utils/pdfExport.ts (pictures fetched via
//     the Apps Script backend, row-safe pages, thin borders, clickable file links).
//   - EXCEL: through the shell's Export menu (PDF / Excel).
//
// EVIDENCE FILES & GOOGLE DRIVE — everything happens on the Save / Update / Delete clicks:
//   • Attaching a file in the form only keeps it in the browser (`pending`) — nothing is
//     sent to Drive.
//   • SAVE / UPDATE: the pending files are uploaded to the chosen Drive folder, then the
//     record is written to the database. If an upload or the database save fails, the files
//     uploaded in that attempt are removed again, so nothing is left half-saved.
//     (Update) files that were removed with ✕ in the form are deleted from Drive only after
//     the record was updated successfully (`toDeleteRef`).
//   • DELETE a record: the record is deleted from the database AND its app-uploaded
//     evidence files are deleted from Drive (pasted links are never touched).
//   • Cancel / Reset / loading another record: pending files and queued deletions are just
//     discarded — Drive and the database stay as they were.
//   - Save is blocked while the Target Completion Date is before the Audit Date
//     and while the files are being uploaded.
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
import {
  resolveUploadConfig, checkEvidenceFolder, getChosenFolder, uploadEvidenceFile, deleteEvidenceFiles,
  folderErrorText, NO_FOLDER_ATTACH, evidenceFileName,
  type UploadConfig,
} from './evidenceUpload';
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

const NO_PENDING: (File | null)[] = [null, null, null];

// Dropdown values saved by older/other data that aren't in the option lists
// fall back to the first option instead of leaving the <select> blank.
const pick = (value: unknown, options: string[]) =>
  options.includes(String(value ?? '')) ? String(value) : options[0];

/**
 * Fetches a Drive picture as a data URL through the Apps Script backend
 * (Code.gs action 'getImage'). Returns '' on any failure so the original image is kept.
 */
async function fetchDriveImage(cfg: UploadConfig, src: string): Promise<string> {
  const m = /[?&]id=([a-zA-Z0-9_-]+)/.exec(src) || /\/d\/([a-zA-Z0-9_-]+)/.exec(src);
  if (!m || !cfg.url || !cfg.key) return '';
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ key: cfg.key, action: 'getImage', fileId: m[1] }),
    });
    const j = await res.json();
    return j && j.ok ? `data:${j.mimeType};base64,${j.data}` : '';
  } catch {
    return '';
  }
}

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
  const [uploading,     setUploading]     = useState(false);   // Save is uploading files / writing the record
  const [saveError,     setSaveError]     = useState('');
  const [submissionDate, setSubmissionDate] = useState(todayIso());
  // Files chosen in the form that are NOT in Drive yet (one entry per evidence slot).
  const [pending,       setPending]       = useState<(File | null)[]>(NO_PENDING);
  // Drive links of saved files removed with ✕ — deleted from Drive after a successful Update.
  const toDeleteRef = useRef<string[]>([]);
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

  // Forgets unsaved attachments and queued Drive deletions (Drive is not touched).
  const clearEvidenceWork = () => {
    setPending(NO_PENDING);
    toDeleteRef.current = [];
    setSaveError('');
  };

  const handleReset = () => {
    setData(prev => ({ ...INITIAL_CORRECTIVE_ACTION_STATE, factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    clearEvidenceWork();
    setActiveStep('form');
    sheets.setEditingId(null);
  };

  const loadIntoForm = (rec: Record<string, unknown>) => {
    sheets.setEditingId(String(rec.id ?? ''));
    clearEvidenceWork();
    setData(p => recordToFormData(rec, p));
    setActiveStep('form');
  };

  // Deletes the record from the database AND its app-uploaded evidence files from Drive.
  const deleteRecord = async (id: string): Promise<boolean> => {
    const rec = sheets.records.find(r => String(r.id) === id) as unknown as Record<string, unknown> | undefined;
    const urls: string[] = [];
    (['evidence1', 'evidence2', 'evidence3'] as const).forEach(k => {
      const url = String(rec?.[k] ?? '');
      if (url && String(rec?.[`${k}Name`] ?? '')) urls.push(url);     // has a file name = uploaded by the app
    });
    const ok = await sheets.remove(id);
    if (ok) {
      if (sheets.editingId === id) handleReset();
      if (urls.length) {
        const r = await deleteEvidenceFiles(resolveUploadConfig(factory), urls);
        if (!r.ok) window.alert(`The record was deleted, but its files could not be deleted from Drive: ${r.error}`);
      }
    }
    return ok;
  };

  const printFilename = () => {
    const suffix = activeStep === 'printEvidence' ? '_Evidence' : activeStep === 'printList' ? '_Statement' : '';
    return `CorrectiveActionPlan${suffix}_${todayIso()}`;
  };

  // Prints the current area as A4 LANDSCAPE after every picture has loaded.
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
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${printFilename()}</title>
      <style>@page{size:A4 landscape;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();

    const win = iframe.contentWindow!;
    win.addEventListener('afterprint', () => { if (iframe.parentNode) document.body.removeChild(iframe); });

    const imagesReady = Promise.all(
      Array.from(doc.images).map(img =>
        img.complete ? Promise.resolve() : new Promise<void>(res => { img.onload = img.onerror = () => res(); }),
      ),
    );
    // Never wait longer than 8 seconds for slow pictures.
    void Promise.race([imagesReady, new Promise<void>(res => setTimeout(res, 8000))]).then(() => {
      win.focus();
      win.print();
    });
  };

  // Direct PDF download — A4 landscape, pictures via the backend, row-safe pages, thin borders, links.
  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    const cfg = resolveUploadConfig(factory);
    await exportToPDF({
      element: el,
      filename: printFilename(),
      orientation: 'landscape',
      scale: 3,
      resolveImage: src => fetchDriveImage(cfg, src),
      rowSafeBreaks: true,
      printStyle: true,
      addLinks: true,
    });
  };

  const handleExportExcel = () => void exportCapExcel(filteredRecords, `CorrectiveActionPlan_${todayIso()}`);

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

  // SAVE / UPDATE: upload the pending files → write the record → (update) delete removed files from Drive.
  const handleSave = async (): Promise<boolean> => {
    setSaveError('');
    const cfg    = resolveUploadConfig(factory);
    const record = { ...buildRecord() } as Record<string, string>;
    const uploadedNow: string[] = [];                                   // files uploaded in THIS attempt
    const undoUploads = async () => { if (uploadedNow.length) await deleteEvidenceFiles(cfg, uploadedNow); };
    const fail = (msg: string) => { setSaveError(msg); setActiveStep('form'); return false; };

    setUploading(true);
    try {
      if (pending.some(Boolean)) {
        // Check the Drive folder BEFORE sending any file.
        const chosen = getChosenFolder().input;
        try {
          await checkEvidenceFolder(cfg, chosen);
        } catch (err) {
          return fail(folderErrorText(err, chosen, NO_FOLDER_ATTACH));
        }

        for (let i = 0; i < pending.length; i++) {
          const file = pending[i];
          if (!file) continue;
          try {
            const renamed = new File([file], evidenceFileName(data.ncId, i, file.name), { type: file.type });
            const up = await uploadEvidenceFile(cfg, renamed);
            uploadedNow.push(up.url);
            record[`evidence${i + 1}`]     = up.url;
            record[`evidence${i + 1}Name`] = up.name;
          } catch (err) {
            await undoUploads();
            return fail(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed.'} Nothing was saved.`);
          }
        }
      }

      const ok = sheets.editingId
        ? await sheets.update(sheets.editingId, record)
        : await sheets.save(record);
      if (!ok) {
        await undoUploads();                                            // don't leave orphan files in Drive
        return fail('The record could not be saved, so the uploaded files were removed from Drive again. Try again.');
      }

      const removedFiles = toDeleteRef.current.slice();                 // files the user removed with ✕ while editing
      handleReset();                                                    // clears the form, pending files and the queue
      if (removedFiles.length) {
        const r = await deleteEvidenceFiles(cfg, removedFiles);
        if (!r.ok) window.alert(`The record was saved, but the removed files could not be deleted from Drive: ${r.error}`);
      }
      return true;
    } finally {
      setUploading(false);
    }
  };

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
        date={submissionDate}
        onDateChange={d => setSubmissionDate(d || todayIso())}

        steps={STEPS}
        activeStep={activeStep}
        onStepChange={id => setActiveStep(id as Step)}

        billItems={billItems}
        isBillActive={isBillActive}
        activeBillId={isBillActive ? activeStep : null}
        hideBillHeading

        onSave={handleSave}
        isSaving={sheets.isSaving || uploading}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={!data.ncId.trim() || !data.ncDescription.trim() || rangeInvalid || uploading}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => loadIntoForm(rec)}
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
          loadIntoForm(rec as Record<string, unknown>);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={deleteRecord}
        onReload={sheets.reload}
        recordLabel={rec => String(rec.ncId ?? rec.id ?? '—')}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExportExcel}
        lang="bn"
      >
        {activeStep === 'form' && (
          <CorrectiveActionFormComponent
            data={data}
            setData={setData}
            pending={pending}
            onPendingChange={(i, file) => setPending(prev => prev.map((f, idx) => (idx === i ? file : f)))}
            onSavedFileRemoved={url => { if (!toDeleteRef.current.includes(url)) toDeleteRef.current.push(url); }}
            saveError={saveError}
          />
        )}

        {activeStep === 'statement' && (
          <CorrectiveActionStatement
            records={sheets.records}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={(rec: DbRecord) => loadIntoForm(rec as unknown as Record<string, unknown>)}
            onDelete={(id: string) => { void deleteRecord(id); }}
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
                submissionDate={submissionDate}
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
              submissionDate={submissionDate}
              part={activeStep === 'printEvidence' ? 'evidence' : 'statement'}
            />
          </div>
        )}
      </ModuleShell>
    </>
  );
}