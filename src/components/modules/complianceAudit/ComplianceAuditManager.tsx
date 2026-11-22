// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditManager.tsx
// Path: src/components/modules/complianceAudit/ComplianceAuditManager.tsx
//
// Same structure as the Corrective Action Manager:
//   - Statement filters / sort are owned HERE; `filteredRecords` feeds Excel.
//   - The report (print preview / Print / PDF) is the audit currently in the form,
//     or the one opened with 🖨 in the Statement.
//   - PDF: direct A4-landscape download (pictures via the backend, row-safe pages,
//     thin borders, clickable links). Excel: one row per NC, from the Export menu.
//   - The header date is editable (it is the record's `date` / "Submission Date").
//   - NON-COMPLIANCE PICTURES behave like the Corrective Action evidence:
//       • "Attach file" only keeps the file in the browser; it is uploaded to Drive when Save / Update is clicked
//         (same Drive folder as Corrective Action). Nothing is saved if an upload or the save fails (uploads are undone).
//       • ✕ on an already-uploaded picture is only QUEUED; the file is deleted from Drive after Update succeeds.
//         Cancel / Reset / opening another record drops the queue (Drive untouched).
//       • The same file (same name + content) already in the folder is reused, never uploaded twice.
//       • Deleting a whole audit also deletes its app-uploaded pictures from Drive (unless another audit uses the same file).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
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
import ComplianceAuditDashboard from './ComplianceAuditDashboard';
import { exportAuditExcel } from './auditExcel';
import { resolveUploadConfig, deleteEvidenceFiles, type UploadConfig } from '../correctiveAction/evidenceUpload';
import { uploadPendingPictures, finishPendingPictures, isPendingPicture } from './complianceUpload';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { ComplianceAuditData, AuditCategory, AuditRound, AuditFilters, CorrectiveActionItem } from './types';
import {
  blankComplianceAudit, blankAuditorItem, blankCorrectiveActionItem, AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS,
  EMPTY_AUDIT_FILTERS, buildAuditEntries, filterAuditEntries, computeAuditScore, fixPhone, parseNcItems, parseAuditors, parseAreas, todayIso,
} from './types';

const STEPS = [{ id: 'form', label: 'অডিট বিবরণ', icon: 'ti-clipboard-check', fieldCount: 6 }];
type Step = 'form' | 'tracking' | 'print' | 'dashboard';

/** Drive picture → data URL through the Apps Script backend ('' on failure). */
async function fetchDriveImage(cfg: UploadConfig, src: string): Promise<string> {
  const m = /[?&]id=([a-zA-Z0-9_-]+)/.exec(src) || /\/d\/([a-zA-Z0-9_-]+)/.exec(src);
  if (!m || !cfg.url || !cfg.key) return '';
  try {
    const res = await fetch(cfg.url, { method: 'POST', redirect: 'follow', body: JSON.stringify({ key: cfg.key, action: 'getImage', fileId: m[1] }) });
    const j = await res.json();
    return j && j.ok ? `data:${j.mimeType};base64,${j.data}` : '';
  } catch { return ''; }
}

function recordToFormData(rec: Record<string, unknown>, prev: ComplianceAuditData): ComplianceAuditData {
  const str = (k: string) => String(rec[k] ?? '');
  const auditors = parseAuditors(rec.auditorsJson);
  const ncs = parseNcItems(rec.correctiveActionsJson);
  return {
    ...prev,
    auditType: (AUDIT_CATEGORY_OPTIONS.includes(rec.auditType as AuditCategory) ? rec.auditType : 'Internal') as AuditCategory,
    companyName: str('companyName'), siteName: str('siteName'), siteAddress: str('siteAddress'),
    siteContactName: str('siteContactName'), siteContactJobTitle: str('siteContactJobTitle'),
    sitePhone: fixPhone(rec.sitePhone), siteEmail: str('siteEmail'),
    auditRound: (AUDIT_ROUND_OPTIONS.includes(rec.auditRound as AuditRound) ? rec.auditRound : 'Initial') as AuditRound,
    auditingAreas: parseAreas(rec.auditingAreasJson),
    auditDate: rec.auditDate ? toDateInput(rec.auditDate) || '' : '',
    auditors: auditors.length ? auditors : [blankAuditorItem(1)],
    correctiveActions: ncs.length ? ncs : [blankCorrectiveActionItem(1)],
    remarks: str('remarks'),
    date: rec.date ? toDateInput(rec.date) || prev.date : prev.date,
  };
}

export default function ComplianceAuditManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('complianceaudit', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<Step>('form');
  const [data,          setData]          = useState<ComplianceAuditData>(blankComplianceAudit());
  const [filters,       setFilters]       = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
  const [uploading,     setUploading]     = useState(false);   // Save is uploading pictures / writing the record
  const [saveError,     setSaveError]     = useState('');
  const toDeleteRef = useRef<string[]>([]);                      // uploaded pictures removed with ✕ — deleted from Drive after Update succeeds

  const filteredRecords = useMemo(
    () => filterAuditEntries(buildAuditEntries(sheets.records), filters).map(e => e.rec),
    [sheets.records, filters],
  );

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn, companyName: prev.companyName || factory.nameEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  // Forgets pictures waiting for Save and queued Drive deletions (Drive is not touched).
  const clearPictureWork = () => {
    finishPendingPictures(data.correctiveActions);
    toDeleteRef.current = [];
    setSaveError('');
  };

  const handleReset = () => {
    clearPictureWork();
    setData(prev => ({ ...blankComplianceAudit(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress, companyName: factory.nameEn }));
    setActiveStep('form');
    sheets.setEditingId(null);
  };

  const fileBase = `ComplianceAudit_${(data.siteName || 'report').replace(/[\\/:*?"<>|\s]+/g, '_')}_${todayIso()}`;

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
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase}</title>
      <style>@page{size:A4 landscape;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    const win = iframe.contentWindow!;
    win.addEventListener('afterprint', () => { if (iframe.parentNode) document.body.removeChild(iframe); });
    const ready = Promise.all(Array.from(doc.images).map(img => (img.complete ? Promise.resolve() : new Promise<void>(res => { img.onload = img.onerror = () => res(); }))));
    void Promise.race([ready, new Promise<void>(res => setTimeout(res, 8000))]).then(() => { win.focus(); win.print(); });
  };

  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    const cfg = resolveUploadConfig(factory);
    await exportToPDF({
      element: el, filename: fileBase, orientation: 'landscape', scale: 3,
      resolveImage: src => fetchDriveImage(cfg, src), rowSafeBreaks: true, printStyle: true, addLinks: true,
    });
  };

  const handleExportExcel = () => exportAuditExcel(filteredRecords, `ComplianceAudit_${todayIso()}`);

  // The report / preview shows saved pictures only — a picture still waiting for Save has no link yet.
  const printData = useMemo<ComplianceAuditData>(() => ({
    ...data,
    correctiveActions: data.correctiveActions.map(c => (isPendingPicture(c.nonCompliancePictureLink) ? { ...c, nonCompliancePictureLink: '' } : c)),
  }), [data]);

  /** True when another saved audit still points at this Drive file (so it must not be deleted). */
  const usedByOtherRecord = (url: string, exceptId: string) =>
    sheets.records.some(r => String(r.id) !== exceptId && String(r.correctiveActionsJson ?? '').includes(url));

  /** Drive links of the pictures this app uploaded for a saved audit (they carry a file name). */
  const uploadedPicturesOf = (rec: Record<string, unknown>): string[] =>
    parseNcItems(rec.correctiveActionsJson).filter(c => c.nonCompliancePictureLink && c.nonCompliancePictureName).map(c => c.nonCompliancePictureLink);

  const buildRecordOf = (data: ComplianceAuditData, items: CorrectiveActionItem[] = data.correctiveActions) => ({
    auditType: data.auditType, companyName: data.companyName, siteName: data.siteName, siteAddress: data.siteAddress,
    siteContactName: data.siteContactName, siteContactJobTitle: data.siteContactJobTitle,
    sitePhone: data.sitePhone, siteEmail: data.siteEmail, auditRound: data.auditRound,
    auditingAreasJson: JSON.stringify(data.auditingAreas), auditDate: data.auditDate,
    auditorsJson: JSON.stringify(data.auditors), correctiveActionsJson: JSON.stringify(items),
    remarks: data.remarks, date: data.date,
    preparedBy: authorization.preparedBy, preparedByDesignation: authorization.preparedByDesignation,
  });
  const buildRecord = (items: CorrectiveActionItem[] = data.correctiveActions) => buildRecordOf(data, items);

  // EXCEL UPLOAD: each imported audit is saved as its own record (pictures stay links only).
  const handleImportAudits = async (audits: ComplianceAuditData[]): Promise<{ saved: number; failed: number }> => {
    let saved = 0, failed = 0;
    for (const a of audits) {
      try {
        const ok = await sheets.save(buildRecordOf(a));
        if (ok) saved++; else failed++;
      } catch { failed++; }
    }
    return { saved, failed };
  };

  // SAVE / UPDATE: upload the waiting pictures → write the record → (update) delete the removed pictures from Drive.
  const handleSave = async (): Promise<boolean> => {
    setSaveError('');
    const cfg = resolveUploadConfig(factory);
    setUploading(true);
    try {
      const up = await uploadPendingPictures(cfg, data.correctiveActions);
      if (!up.ok) { setSaveError(up.error); return false; }

      const record = buildRecord(up.items);
      const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
      if (!ok) {
        if (up.uploaded.length) await deleteEvidenceFiles(cfg, up.uploaded);   // no orphan files in Drive
        setSaveError('The audit could not be saved, so the uploaded pictures were removed from Drive again. Try again.');
        return false;
      }

      // Pictures removed with ✕: delete them now — except any still used by this audit or by another audit.
      const keep = new Set(up.items.map(i => i.nonCompliancePictureLink));
      const removed = toDeleteRef.current.filter(u => !keep.has(u) && !usedByOtherRecord(u, String(sheets.editingId ?? '')));
      handleReset();
      if (removed.length) {
        const r = await deleteEvidenceFiles(cfg, removed);
        if (!r.ok) window.alert(`The audit was saved, but the removed pictures could not be deleted from Drive: ${r.error}`);
      }
      return true;
    } finally {
      setUploading(false);
    }
  };

  // Deletes the audit AND its app-uploaded pictures from Drive.
  const deleteAudit = async (id: string): Promise<boolean> => {
    const rec = sheets.records.find(r => String(r.id) === id) as unknown as Record<string, unknown> | undefined;
    const urls = rec ? uploadedPicturesOf(rec).filter(u => !usedByOtherRecord(u, id)) : [];
    const ok = await sheets.remove(id);
    if (ok) {
      if (sheets.editingId === id) handleReset();
      if (urls.length) {
        const r = await deleteEvidenceFiles(resolveUploadConfig(factory), urls);
        if (!r.ok) window.alert(`The audit was deleted, but its pictures could not be deleted from Drive: ${r.error}`);
      }
    }
    return ok;
  };

  const loadIntoForm = (rec: DbRecord, step: Step) => {
    clearPictureWork();
    sheets.setEditingId(String(rec.id ?? ''));
    setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
    setActiveStep(step);
  };

  const billItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', onClick: () => setActiveStep('dashboard') },
    { id: 'tracking', label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setActiveStep('tracking') },
    { id: 'print',    label: 'অডিট রিপোর্ট প্রিভিউ', onClick: () => setActiveStep('print') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'print' || activeStep === 'dashboard';

  return (
    <>
      <style>{BASE_PRINT_CSS}</style>

      <ModuleShell
        moduleName="কমপ্লায়েন্স অডিট"
        moduleNameEn="Compliance Audit"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={activeStep === 'form' ? 'form' : ''}
        onStepChange={id => setActiveStep(id as Step)}

        billItems={billItems}
        isBillActive={isBillActive}
        activeBillId={isBillActive ? activeStep : null}
        hideBillHeading

        onSave={handleSave}
        isSaving={sheets.isSaving || uploading}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={!data.siteName.trim() || !data.companyName.trim() || uploading}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => { clearPictureWork(); sheets.setEditingId(String(rec.id ?? '')); setData(p => recordToFormData(rec, p)); setActiveStep('form'); }}
        updateModule="complianceaudit"
        updateLabel="অডিট খুঁজুন"
        updateSearchPlaceholder="Site বা Company নাম দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'Site',           value: data.siteName || '—' },
          { label: 'অডিট ধরন',       value: data.auditType },
          { label: 'Auditing Areas', value: `${data.auditingAreas.length} টা` },
          { label: 'Non-Compliance', value: `${data.correctiveActions.length} টা` },
          { label: 'Audit Score',    value: `${computeAuditScore(data.correctiveActions).score} / 100` },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => { loadIntoForm(rec as unknown as DbRecord, 'form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onDeleteRecord={deleteAudit}
        onReload={sheets.reload}
        recordLabel={rec => String(rec.siteName ?? rec.id ?? '—')}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExportExcel}
        lang="bn"
      >
        {activeStep === 'form' && (
          <ComplianceAuditForm
            data={data}
            setData={setData}
            deferUploads
            onSavedFileRemoved={url => { if (!toDeleteRef.current.includes(url)) toDeleteRef.current.push(url); }}
            saveError={saveError}
            existingRecords={sheets.records as unknown as Record<string, unknown>[]}
            onImport={sheets.editingId ? undefined : handleImportAudits}
          />
        )}

        {activeStep === 'dashboard' && <ComplianceAuditDashboard records={sheets.records} current={data} printRef={printAreaRef} />}

        {activeStep === 'tracking' && (
          <ComplianceAuditStatement
            records={sheets.records}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={rec => loadIntoForm(rec, 'form')}
            onPrintOne={rec => loadIntoForm(rec, 'print')}
            onDelete={(id: string) => { void deleteAudit(id); }}
          />
        )}

        {activeStep === 'print' && (
          <div id="printable-area" ref={printAreaRef}>
            <ComplianceAuditPrintView data={printData} authorization={authorization} />
          </div>
        )}
      </ModuleShell>
    </>
  );
}