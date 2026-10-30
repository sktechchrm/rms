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
import { exportAuditExcel } from './auditExcel';
import { resolveUploadConfig, type UploadConfig } from '../correctiveAction/evidenceUpload';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { ComplianceAuditData, AuditCategory, AuditRound, AuditFilters } from './types';
import {
  blankComplianceAudit, blankAuditorItem, blankCorrectiveActionItem, AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS,
  EMPTY_AUDIT_FILTERS, buildAuditEntries, filterAuditEntries, parseNcItems, parseAuditors, parseAreas, todayIso,
} from './types';

const STEPS = [{ id: 'form', label: 'অডিট বিবরণ', icon: 'ti-clipboard-check', fieldCount: 6 }];
type Step = 'form' | 'tracking' | 'print';

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
    sitePhone: str('sitePhone'), siteEmail: str('siteEmail'),
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

  const filteredRecords = useMemo(
    () => filterAuditEntries(buildAuditEntries(sheets.records), filters).map(e => e.rec),
    [sheets.records, filters],
  );

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn, companyName: prev.companyName || factory.nameEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
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

  const buildRecord = () => ({
    auditType: data.auditType, companyName: data.companyName, siteName: data.siteName, siteAddress: data.siteAddress,
    siteContactName: data.siteContactName, siteContactJobTitle: data.siteContactJobTitle,
    sitePhone: data.sitePhone, siteEmail: data.siteEmail, auditRound: data.auditRound,
    auditingAreasJson: JSON.stringify(data.auditingAreas), auditDate: data.auditDate,
    auditorsJson: JSON.stringify(data.auditors), correctiveActionsJson: JSON.stringify(data.correctiveActions),
    remarks: data.remarks, date: data.date,
    preparedBy: authorization.preparedBy, preparedByDesignation: authorization.preparedByDesignation,
  });

  const loadIntoForm = (rec: DbRecord, step: Step) => {
    sheets.setEditingId(String(rec.id ?? ''));
    setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
    setActiveStep(step);
  };

  const billItems = [
    { id: 'tracking', label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setActiveStep('tracking') },
    { id: 'print',    label: 'অডিট রিপোর্ট প্রিভিউ', onClick: () => setActiveStep('print') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'print';

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

        onSave={async () => {
          const record = buildRecord();
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
          if (ok) handleReset();
          return ok;
        }}
        isSaving={sheets.isSaving}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={!data.siteName.trim() || !data.companyName.trim()}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => { sheets.setEditingId(String(rec.id ?? '')); setData(p => recordToFormData(rec, p)); setActiveStep('form'); }}
        updateModule="complianceaudit"
        updateLabel="অডিট খুঁজুন"
        updateSearchPlaceholder="Site বা Company নাম দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'Site',           value: data.siteName || '—' },
          { label: 'অডিট ধরন',       value: data.auditType },
          { label: 'Auditing Areas', value: `${data.auditingAreas.length} টা` },
          { label: 'Non-Compliance', value: `${data.correctiveActions.length} টা` },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => { loadIntoForm(rec as unknown as DbRecord, 'form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onDeleteRecord={async (id: string) => {
          const ok = await sheets.remove(id);
          if (ok && sheets.editingId === id) handleReset();
          return ok;
        }}
        onReload={sheets.reload}
        recordLabel={rec => String(rec.siteName ?? rec.id ?? '—')}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExportExcel}
        lang="bn"
      >
        {activeStep === 'form' && <ComplianceAuditForm data={data} setData={setData} />}

        {activeStep === 'tracking' && (
          <ComplianceAuditStatement
            records={sheets.records}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={rec => loadIntoForm(rec, 'form')}
            onPrintOne={rec => loadIntoForm(rec, 'print')}
            onDelete={(id: string) => { void sheets.remove(id).then(ok => { if (ok && sheets.editingId === id) handleReset(); }); }}
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