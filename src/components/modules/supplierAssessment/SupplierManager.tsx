// ─────────────────────────────────────────────────────────────────────────────
// SupplierManager.tsx — Supplier Assessment
//   ধাপসমূহ:  নতুন অ্যাসেসমেন্ট  (supplier information · assessment details · assessment score · additional)
//   ফলাফল:    ড্যাশবোর্ড · অ্যাসেসমেন্ট অ্যানালাইসিস (external audits from Compliance Audit) · অনুমোদিত সাপ্লায়ার তালিকা (ASL)
// Path: src/components/modules/supplierAssessment/SupplierManager.tsx
//
// The header Print / PDF / Excel buttons act on the result page you are viewing.
// Save is blocked by validateSupplier() errors; warnings show in the form.
// The 'complianceaudit' sheet is read-only here.
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
  blankSupplierData, dataFromRecord, dataToRecord, nextSupplierCode, validateSupplier, buildSupplierRows, filterSuppliers, aslRows, buildExtAudits,
  scorePrequal, statusOf, exportSupplierExcel, todayIso,
} from './types';
import type { SupplierData } from './types';

const STEPS = [{ id: 'assessment', label: 'নতুন অ্যাসেসমেন্ট', icon: 'ti-clipboard-check', fieldCount: 24 }];
type Step = 'assessment' | SupplierView;

export default function SupplierManager() {
  const factory  = useFactory();
  const { user } = useAuth();
  const userName = user?.name ?? 'unknown';

  const sheets       = useDatabase('suppliers', factory.id, userName, 500);
  const auditSheets  = useDatabase('complianceaudit', factory.id, userName, 500);   // read-only: feeds Assessment Analysis
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep, setActiveStep] = useState<Step>('dashboard');
  const [data, setData]     = useState<SupplierData>(blankSupplierData());
  const [search, setSearch] = useState('');

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  // A new supplier gets the next Supplier ID (SUP-001, SUP-002 …)
  useEffect(() => {
    if (!sheets.editingId && !data.supplierCode) setData(p => ({ ...p, supplierCode: nextSupplierCode(sheets.records) }));
  }, [sheets.editingId, sheets.records, data.supplierCode]);

  const allRows      = useMemo(() => buildSupplierRows(sheets.records), [sheets.records]);
  const shownRows    = useMemo(() => filterSuppliers(allRows, search), [allRows, search]);
  const aslList      = useMemo(() => aslRows(allRows), [allRows]);
  const extAudits    = useMemo(() => buildExtAudits(auditSheets.records, allRows), [auditSheets.records, allRows]);

  const issues = useMemo(
    () => validateSupplier(data, sheets.records.filter(r => String(r.id) !== sheets.editingId).map(r => String(r.supplierName ?? ''))),
    [data, sheets.records, sheets.editingId],
  );
  const pq = useMemo(() => scorePrequal(data.prequal), [data.prequal]);

  const isForm = activeStep === 'assessment';
  const printMode: PrintMode = activeStep === 'asl' ? 'asl' : activeStep === 'analysis' ? 'audits' : 'suppliers';
  const printRows = printMode === 'asl' ? aslList : shownRows;
  const fileBase = `Supplier_${printMode === 'asl' ? 'ASL' : printMode === 'audits' ? 'ExternalAudits' : 'Assessments'}_${todayIso()}`;
  const filterText = printMode === 'suppliers' && shownRows.length !== allRows.length ? `Filtered: ${shownRows.length} of ${allRows.length} suppliers` : '';

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

  const handleExportExcel = () => exportSupplierExcel(printMode === 'asl' ? aslList : shownRows, aslList, extAudits, fileBase);

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

  const billItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড',                       onClick: () => setActiveStep('dashboard') },
    { id: 'analysis',  label: 'অ্যাসেসমেন্ট অ্যানালাইসিস',         onClick: () => setActiveStep('analysis') },
    { id: 'asl',       label: 'অনুমোদিত সাপ্লায়ার তালিকা (ASL)',  onClick: () => setActiveStep('asl') },
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
          if (ok) handleReset('dashboard');
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
          { label: 'সাপ্লায়ার',       value: data.supplierName || '—' },
          { label: 'Supplier ID',      value: data.supplierCode || '—' },
          { label: 'Category',         value: data.category || '—' },
          { label: 'Score',            value: pq.scored ? `${pq.total}/100` : '—' },
          { label: 'Status',           value: statusOf(pq) },
          { label: 'সার্টিফিকেট / বায়ার', value: `${data.certificates.length} / ${data.buyers.length}` },
          { label: 'ত্রুটি / সতর্কতা',    value: `${issues.errors.length} / ${issues.warnings.length}` },
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
          : <SupplierStatement view={activeStep as SupplierView} rows={allRows} asl={aslList} audits={extAudits} search={search} onSearch={setSearch} onEdit={editSupplier} onAdd={() => handleReset('assessment')} />}

        {/* Hidden print copy so the header Print / PDF buttons work from the result pages. */}
        {!isForm && (
          <div className="sup-print-offscreen" aria-hidden="true" style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}>
            <div id="printable-area" ref={printAreaRef}>
              <SupplierPrintView mode={printMode} rows={printRows} audits={extAudits} factoryName={data.factoryName} factoryAddress={data.factoryAddress}
                authorization={authorization} filterText={filterText} />
            </div>
          </div>
        )}
      </ModuleShell>
    </>
  );
}