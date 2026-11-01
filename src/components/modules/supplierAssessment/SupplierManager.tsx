// ─────────────────────────────────────────────────────────────────────────────
// SupplierManager.tsx — Supplier Assessment
//   ধাপসমূহ:  নতুন অ্যাসেসমেন্ট  (A. Supplier information · B. Assessment details · C. Approval details)
//   ফলাফল:    ড্যাশবোর্ড · অ্যাসেসমেন্ট অ্যানালাইসিস · অনুমোদিত সাপ্লায়ার তালিকা (ASL, click a row for the summary)
// Path: src/components/modules/supplierAssessment/SupplierManager.tsx
//
// Table state (search / sort / column filters) lives HERE: the same sorted + filtered rows feed the screen,
// Print, PDF and Excel. The 'complianceaudit' sheet is read-only (feeds Assessment Analysis).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import ModuleShell from '../../shell/ModuleShell';
import SupplierForm from './SupplierForm';
import SupplierStatement from './SupplierStatement';
import type { SupplierView } from './SupplierStatement';
import SupplierPrintView from './SupplierPrintView';
import type { PrintMode } from './SupplierPrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import {
  blankSupplierData, dataFromRecord, dataToRecord, nextSupplierCode, validateSupplier, buildSupplierRows, aslRows, buildCategoryRows, buildExtAudits,
  summarizeSites, applyTable, scoreFrom, exportSupplierExcel, todayIso, countActiveFilters, INITIAL_TABLES, SUPPLIER_COLS, ASL_COLS, CATEGORY_COLS, SITE_COLS,
} from './types';
import type { SupplierData, TableId, TableState, TablesState } from './types';

const STEPS = [{ id: 'assessment', label: 'নতুন অ্যাসেসমেন্ট', icon: 'ti-clipboard-check', fieldCount: 18 }];
type Step = 'assessment' | SupplierView;

export default function SupplierManager() {
  const factory  = useFactory();
  const { user } = useAuth();
  const userName = user?.name ?? 'unknown';

  const sheets       = useDatabase('suppliers', factory.id, userName, 500);
  const auditSheets  = useDatabase('complianceaudit', factory.id, userName, 500);   // read-only
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep, setActiveStep] = useState<Step>('dashboard');
  const [data, setData]       = useState<SupplierData>(blankSupplierData());
  const [tables, setTables]   = useState<TablesState>(INITIAL_TABLES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onTable = (id: TableId, st: TableState) => setTables(t => ({ ...t, [id]: st }));

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  // A new supplier gets the next Supplier ID (SUP-001, SUP-002 …)
  useEffect(() => {
    if (!sheets.editingId && !data.supplierCode) setData(p => ({ ...p, supplierCode: nextSupplierCode(sheets.records) }));
  }, [sheets.editingId, sheets.records, data.supplierCode]);

  // ── rows + the same sorted / filtered views the screen shows ──
  const allRows   = useMemo(() => buildSupplierRows(sheets.records), [sheets.records]);
  const aslList   = useMemo(() => aslRows(allRows), [allRows]);
  const extAudits = useMemo(() => buildExtAudits(auditSheets.records, allRows), [auditSheets.records, allRows]);
  const catRows   = useMemo(() => buildCategoryRows(allRows), [allRows]);
  const siteRows  = useMemo(() => summarizeSites(extAudits), [extAudits]);

  const shownDash  = useMemo(() => applyTable(allRows, SUPPLIER_COLS, tables.dashboard), [allRows, tables.dashboard]);
  const shownAsl   = useMemo(() => applyTable(aslList, ASL_COLS, tables.asl), [aslList, tables.asl]);
  const shownCats  = useMemo(() => applyTable(catRows, CATEGORY_COLS, tables.category), [catRows, tables.category]);
  const shownSites = useMemo(() => applyTable(siteRows, SITE_COLS, tables.sites), [siteRows, tables.sites]);

  const issues = useMemo(
    () => validateSupplier(data, sheets.records.filter(r => String(r.id) !== sheets.editingId).map(r => String(r.supplierName ?? ''))),
    [data, sheets.records, sheets.editingId],
  );
  const sc = scoreFrom(data.prequal.overallScore);

  const isForm   = activeStep === 'assessment';
  const selected = selectedId ? allRows.find(r => r.id === selectedId) ?? null : null;
  const selectedSite = selected ? siteRows.find(s => s.supplierCode === selected.code) ?? null : null;
  const printMode: PrintMode = activeStep === 'analysis' ? 'analysis' : activeStep === 'asl' ? (selected ? 'summary' : 'asl') : 'suppliers';
  const printRows = printMode === 'asl' ? shownAsl : shownDash;
  const names: Record<PrintMode, string> = { suppliers: 'Assessments', asl: 'ASL', analysis: 'Analysis', summary: `Summary_${selected?.code ?? ''}` };
  const fileBase = `Supplier_${names[printMode]}_${todayIso()}`;
  const filterText = printMode === 'suppliers' && countActiveFilters(tables.dashboard) > 0 ? `Filtered: ${shownDash.length} of ${allRows.length} suppliers`
    : printMode === 'asl' && countActiveFilters(tables.asl) > 0 ? `Filtered: ${shownAsl.length} of ${aslList.length} suppliers` : '';

  const handleReset = (goto: Step = 'assessment') => {
    setData(prev => ({ ...blankSupplierData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep(goto);
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
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase}</title>
      <style>@page{size:A4 landscape;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    const win = iframe.contentWindow!;
    win.addEventListener('afterprint', () => { if (iframe.parentNode) document.body.removeChild(iframe); });
    setTimeout(() => { win.focus(); win.print(); }, 250);
  };

  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({ element: el, filename: fileBase, orientation: 'landscape', scale: 3, rowSafeBreaks: true, printStyle: true, addLinks: true });
  };

  const handleExportExcel = () => exportSupplierExcel({ rows: shownDash, asl: shownAsl, cats: shownCats, sites: shownSites, audits: extAudits }, fileBase);

  const buildRecord = () => ({
    ...dataToRecord(data, data.supplierCode.trim() || nextSupplierCode(sheets.records)),
    preparedBy: authorization.preparedBy, preparedByDesignation: authorization.preparedByDesignation,
  });

  const editSupplier = (supplierId: string) => {
    const rec = sheets.records.find(r => String(r.id ?? '') === supplierId);
    if (!rec) return;
    sheets.setEditingId(supplierId);
    setData(p => dataFromRecord(rec as unknown as Record<string, unknown>, p));
    setActiveStep('assessment');
  };

  const go = (s: Step) => { setSelectedId(null); setActiveStep(s); };
  const billItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড',                       onClick: () => go('analysis') },
    { id: 'analysis',  label: 'অ্যাসেসমেন্ট অ্যানালাইসিস',         onClick: () => go('analysis') },
    { id: 'asl',       label: 'অনুমোদিত সাপ্লায়ার তালিকা (ASL)',  onClick: () => go('asl') },
  ];

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        @media print { .sup-print-offscreen { position: static !important; left: auto !important; width: auto !important; } }
      `}</style>

      <ModuleShell
        moduleName="সাপ্লায়ার অ্যাসেসমেন্ট"
        moduleNameEn="Supplier Assessment"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={isForm ? 'assessment' : ''}
        onStepChange={() => setActiveStep('assessment')}

        billItems={billItems}
        isBillActive={!isForm}
        activeBillId={!isForm ? activeStep : null}

        onSave={async () => {
          const record = buildRecord();
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
          if (ok) { setSelectedId(null); handleReset('dashboard'); }
          return ok;
        }}
        isSaving={sheets.isSaving}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={issues.errors.length > 0}

        editingId={sheets.editingId}
        onCancelEdit={() => handleReset('assessment')}
        onReset={() => handleReset('assessment')}

        onUpdate={rec => { sheets.setEditingId(String(rec.id ?? '')); setData(p => dataFromRecord(rec, p)); setActiveStep('assessment'); }}
        updateModule="suppliers"
        updateLabel="সাপ্লায়ার খুঁজুন"
        updateSearchPlaceholder="নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'সাপ্লায়ার',     value: data.supplierName || '—' },
          { label: 'Supplier ID',    value: data.supplierCode || '—' },
          { label: 'Category',       value: data.category || '—' },
          { label: 'Overall score',  value: sc.total === null ? '—' : `${sc.total}/100` },
          { label: 'Status',         value: data.approval.status },
          { label: 'ত্রুটি / সতর্কতা',  value: `${issues.errors.length} / ${issues.warnings.length}` },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => dataFromRecord(rec as Record<string, unknown>, p));
          setActiveStep('assessment');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={async (id: string) => {
          const ok = await sheets.remove(id);
          if (ok && sheets.editingId === id) handleReset('dashboard');
          if (ok && selectedId === id) setSelectedId(null);
          return ok;
        }}
        onReload={sheets.reload}
        recordLabel={rec => String(rec.supplierName ?? rec.id ?? '—')}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExportExcel}
        lang="bn"
      >
        {isForm
          ? <SupplierForm data={data} setData={setData} issues={issues} />
          : <SupplierStatement view={activeStep as SupplierView} rows={allRows} audits={extAudits} tables={tables} onTable={onTable}
              selectedId={selectedId} onSelect={setSelectedId} onEdit={editSupplier} onAdd={() => handleReset('assessment')} />}

        {/* Hidden print copy so the header Print / PDF buttons work from the result pages. */}
        {!isForm && (
          <div className="sup-print-offscreen" aria-hidden="true" style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}>
            <div id="printable-area" ref={printAreaRef}>
              <SupplierPrintView mode={printMode} rows={printRows} cats={shownCats} sites={shownSites} selected={selected} selectedSite={selectedSite}
                grouped={tables.asl.sort.key === ''} factoryName={data.factoryName} factoryAddress={data.factoryAddress} authorization={authorization} filterText={filterText} />
            </div>
          </div>
        )}
      </ModuleShell>
    </>
  );
}