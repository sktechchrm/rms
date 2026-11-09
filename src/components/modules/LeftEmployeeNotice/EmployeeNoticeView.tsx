// ─────────────────────────────────────────────────────────────────────────────
// EmployeeNoticeView.tsx — কর্মী অনুপস্থিতি নোটিশ (Left Worker Notice)
// Path: src/components/modules/LeftEmployeeNotice/EmployeeNoticeView.tsx
//
// Same structure as the Corrective Action / Final Settlement / Maternity Managers:
//   - ONE entry form (plain controlled inputs — no React Hook Form, no sync effects, no remount key).
//   - The three letter dates are derived by computeNotice(); the factory name / address are applied at render.
//   - Statement filters / sort are owned HERE; the same filtered rows feed the screen, Print Preview, PDF and Excel.
//   - Outputs: Statement · পত্র নং-১/২/৩ · খাম (present / permanent) · Print Preview of the Statement (landscape).
//   - A failed Save shows the problem under each field and jumps to the first one; Save is never greyed out.
// EmployeeNotice.tsx (letters) and Envelope.tsx (envelope + printer fixes) are UNCHANGED.
// Saved data format (all columns, addressesJson) is unchanged — old records open normally.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useMemo } from 'react';
import { useAuth }                  from '../../../context/AuthContext';
import { useFactory }               from '../../../hooks/useFactory';
import { useDatabase }              from '../../../hooks/useDatabase';
import { toDateInput }              from '../../../utils/dateUtils';
import ModuleShell                  from '../../shell/ModuleShell';
import { DEFAULT_AUTHORIZATION }    from '../../common/AuthorizationBlock';
import type { AuthorizationState }  from '../../common/AuthorizationBlock';
import type { Address, Employee }    from './LeftNoticeDataType';
import { toBanglaNumber }           from './LeftNoticeDataType';
import { EmployeeForm }             from './EmployeeInfoForm';
import { NoticeLetter }             from './EmployeeNotice';
import { Envelope }                 from './Envelope';
import LeftNoticeStatement          from './LeftNoticeStatement';
import LeftNoticeListPrintView      from './LeftNoticeListPrintView';
import LeftNoticeImportPage         from './LeftNoticeImportPage';
import type { ImportOutcome }       from './LeftNoticeImportPage';
import { exportNoticeList }         from './Leftnoticeexcel';
import type { ImportedNotice }      from './Leftnoticeexcel';
import { exportToPDF }              from '../../../utils/pdfExport';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import type { NoticeFilters }       from './leftNoticeModel';
import {
  blankEmployee, recordToEmployee, computeNotice, resolveEmployee, validateNotice, buildNoticeRows, filterRows,
  EMPTY_NOTICE_FILTERS, countActiveFilters, normalizeGender, formatDMY, todayIso,
} from './leftNoticeModel';

const STEPS = [{ id: 'form', label: 'অনুপস্থিতি নোটিশ এন্ট্রি', icon: 'ti-user-circle', fieldCount: 6 }];
type View = 'form' | 'statement' | 'notice1' | 'notice2' | 'notice3' | 'envelope-present' | 'envelope-permanent' | 'printList';

const isLetterView = (v: View) => v === 'notice1' || v === 'notice2' || v === 'notice3' || v === 'envelope-present' || v === 'envelope-permanent';
const bnDate = (iso: string) => (iso ? toBanglaNumber(formatDMY(iso).replace(/-/g, '/')) : '—');

function NoticeView() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('leftnotice', factory.id, user?.name ?? 'unknown');
  const viewRef      = useRef<HTMLDivElement>(null);   // letters / envelope (print + PDF)
  const printAreaRef = useRef<HTMLDivElement>(null);   // the Statement list (print + PDF)

  // "Prepared By" is always hidden for this module (hidePrepared on PrintSignatureRow).
  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [view, setViewRaw]      = useState<View>('form');
  const [importOpen, setImportOpen] = useState(false);          // the bulk "Excel থেকে ইমপোর্ট" page (shown instead of the current view)
  // EVERY navigation goes through here, so the import page can never stay on top of the page the user just chose.
  const setView = (v: View) => { setImportOpen(false); setViewRaw(v); };
  const [employee, setEmployee] = useState<Employee>(blankEmployee());
  const [filters, setFilters]   = useState<NoticeFilters>(EMPTY_NOTICE_FILTERS);
  const [showErrors, setShowErrors] = useState(false);

  // ── everything calculated comes from the inputs, in one place ──
  const calc   = useMemo(() => computeNotice(employee), [employee]);
  const issues = useMemo(() => validateNotice(employee, calc), [employee, calc]);
  // Factory name/address and the derived dates are applied here, not stored in state — what the letters, envelope and record use.
  const emp = useMemo(
    () => resolveEmployee(employee, calc, { name: factory.nameBn, address: factory.addressBn }),
    [employee, calc, factory],
  );

  const allRows      = useMemo(() => buildNoticeRows(sheets.records), [sheets.records]);
  const filteredRows = useMemo(() => filterRows(allRows, filters), [allRows, filters]);

  // Save stays disabled until all four আবশ্যক তথ্য (name · card no · designation · absence start date) are filled.
  const saveDisabled = !(employee.name.trim() && employee.cardNo.trim() && employee.designation.trim() && (employee.absenceStartDate ?? '').trim());

  const filterText = countActiveFilters(filters) > 0 ? `Filtered: ${filteredRows.length} of ${allRows.length} records` : '';
  const fileBase = isLetterView(view) ? `LeftNotice_${employee.name || 'document'}` : `LeftNotice_Statement_${todayIso()}`;

  const handleReset = (goto: View = 'form') => {
    setShowErrors(false);
    setEmployee(blankEmployee());
    setView(goto);
    sheets.setEditingId(null);
  };

  // ── Print / PDF ───────────────────────────────────────────────────────────
  // Letters + envelope keep their proven window.print() path (see EmployeeNotice.tsx / Envelope.tsx).
  // The Statement list prints landscape through a hidden iframe.
  const handlePrintList = () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) { window.print(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:297mm;height:210mm;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.styleSheets)
      .map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    // The landscape @page rule comes AFTER the copied styles, because this page's own portrait @page rule is among them.
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase}</title>
      <style>body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      <style>@page{size:A4 landscape;margin:12mm;}@media print{@page{size:A4 landscape;margin:12mm;}}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    const win = iframe.contentWindow!;
    win.addEventListener('afterprint', () => { if (iframe.parentNode) document.body.removeChild(iframe); });
    setTimeout(() => { win.focus(); win.print(); }, 250);
  };
  const handlePrint = () => { if (isLetterView(view)) window.print(); else handlePrintList(); };

  const handleExportPDF = async () => {
    if (isLetterView(view)) {
      const el = viewRef.current;
      if (!el) return;
      await exportToPDF({ element: el, filename: fileBase, scale: 2 });
      return;
    }
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({ element: el, filename: fileBase, orientation: 'landscape', scale: 3, rowSafeBreaks: true, printStyle: true });
  };
  const handleExcel = () => exportNoticeList(filteredRows, fileBase);

  // ── DB record (all columns unchanged) ─────────────────────────────────────
  const recordOf = (emp: Employee) => ({
    employeeName:     emp.name.trim(),
    cardNo:           emp.cardNo,
    designation:      emp.designation,
    department:       emp.section,
    fatherName:       emp.fatherName ?? '',
    motherName:       emp.motherName ?? '',
    gender:           emp.gender ?? '',
    husbandName:      emp.husbandName ?? '',
    date:             emp.date ?? '',
    joiningDate:      emp.joiningDate ?? '',
    absentFrom:       emp.absenceStartDate ?? '',
    firstNoticeDate:  emp.firstNoticeDate ?? '',
    secondNoticeDate: emp.secondNoticeDate ?? '',
    thirdNoticeDate:  emp.thirdNoticeDate ?? '',
    noticeType:       'notice1',
    addressesJson:    JSON.stringify({ present: emp.presentAddress, permanent: emp.permanentAddress }),
  });
  const buildRecord = () => recordOf(emp);

  /** Bulk import: every valid row becomes a saved record (notice dates calculated exactly like the form does). */
  const importNotices = async (items: ImportedNotice[]): Promise<ImportOutcome> => {
    let saved = 0, failed = 0;
    for (const it of items) {
      const v = it.values, base = blankEmployee();
      const addr = (p: 'present' | 'permanent'): Address => ({
        houseNo: v[`${p}HouseNo`] ?? '', village: v[`${p}Village`] ?? '', postOffice: v[`${p}PostOffice`] ?? '', thana: v[`${p}Thana`] ?? '', district: v[`${p}District`] ?? '',
      });
      const e: Employee = {
        ...base, name: v.name ?? '', cardNo: v.cardNo ?? '', designation: v.designation ?? '', section: v.section ?? '', gender: v.gender ?? '',
        fatherName: v.fatherName ?? '', motherName: v.motherName ?? '', husbandName: v.husbandName ?? '',
        joiningDate: v.joiningDate ?? '', absenceStartDate: v.absenceStartDate ?? '', presentAddress: addr('present'), permanentAddress: addr('permanent'),
      };
      const full = resolveEmployee(e, computeNotice(e), { name: factory.nameBn, address: factory.addressBn });
      try { if (await sheets.save(recordOf(full))) saved++; else failed++; } catch { failed++; }
    }
    return { saved, failed };
  };

  const loadRecord = (rec: Record<string, unknown>, goto: View) => {
    sheets.setEditingId(String(rec.id ?? ''));
    setShowErrors(false);
    setEmployee(p => recordToEmployee(rec, p));
    setView(goto);
  };
  const byId = (id: string) => sheets.records.find(r => String(r.id ?? '') === id) as unknown as Record<string, unknown> | undefined;
  const editById = (id: string) => { const r = byId(id); if (r) loadRecord(r, 'form'); };
  /** 🖨 in the Statement: open the letter that matches the worker's current stage. */
  const letterById = (id: string) => {
    const r = byId(id), row = allRows.find(x => x.id === id);
    if (!r || !row) return;
    loadRecord(r, row.stage === 'Final' ? 'notice3' : row.stage === 'N2' ? 'notice2' : 'notice1');
  };

  const deleteRecord = async (id: string): Promise<boolean> => {
    const ok = await sheets.remove(id);
    if (ok && sheets.editingId === id) handleReset('statement');
    return ok;
  };

  /** Failed Save / blocked letter: reveal the messages, jump to and focus the first invalid field. */
  const showFirstError = () => {
    setShowErrors(true);
    setView('form');
    const first = issues.errors[0]?.field;
    if (!first) return;
    setTimeout(() => {
      const box = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (box?.querySelector<HTMLElement>('input, select, textarea, button') ?? box)?.focus({ preventScroll: true });
    }, 60);
  };
  /** Letters need a complete record — otherwise go back to the form and show what is missing. */
  const goLetter = (v: View) => { if (issues.errors.length > 0) showFirstError(); else setView(v); };

  const billItems = [
    { id: 'statement', label: 'স্টেটমেন্ট (তালিকা)', onClick: () => setView('statement') },
    { id: 'notice1', label: 'পত্র নং-১', onClick: () => goLetter('notice1') },
    { id: 'notice2', label: 'পত্র নং-২', onClick: () => goLetter('notice2') },
    { id: 'notice3', label: 'পত্র নং-৩', onClick: () => goLetter('notice3') },
    {
      id: 'envelope',
      label: 'খাম',
      // NOTE: ModuleShell calls both sub.onClick() AND this parent onClick() together whenever a sub-item is
      // clicked — so this must stay a no-op, otherwise it would override whichever sub-item was just selected.
      onClick: () => {},
      subItems: [
        { label: 'বর্তমান ঠিকানা', onClick: () => goLetter('envelope-present'),   active: view === 'envelope-present' },
        { label: 'স্থায়ী ঠিকানা',  onClick: () => goLetter('envelope-permanent'), active: view === 'envelope-permanent' },
      ],
    },
    { id: 'printList', label: 'প্রিন্ট প্রিভিউ — স্টেটমেন্ট', onClick: () => setView('printList') },
  ];
  const activeBillId = view === 'form' ? null : (view === 'envelope-present' || view === 'envelope-permanent') ? 'envelope' : view;

  const listView = (
    <LeftNoticeListPrintView rows={filteredRows} factoryName={factory.nameEn} factoryAddress={factory.addressEn} authorization={authorization} filterText={filterText} />
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700&display=swap');

        /* Force Noto Sans Bengali on ALL notice/envelope output */
        .print-content,
        .print-content *,
        .envelope-wrap,
        .envelope-wrap * {
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif !important;
          color: #000 !important;
          text-decoration: none !important;
        }
        /* Company name — unified with the app-wide font (was serif) */
        .company-name, .company-name * {
          font-family: 'Noto Sans Bengali', 'Segoe UI', system-ui, sans-serif !important;
        }

        ${BASE_PRINT_CSS}${PAGE_A4_PORTRAIT}

        @media print {
          @page { size: A4 portrait; margin: 25mm 20mm 20mm 25mm; }
          body { font-family: 'Noto Sans Bengali', Arial, sans-serif !important; }
          .print-content, .print-content * {
            font-family: 'Noto Sans Bengali', Arial, sans-serif !important;
            color: #000 !important;
          }
          .ln-print-offscreen { position: static !important; left: auto !important; width: auto !important; }
        }
      `}</style>

      <ModuleShell
        moduleName="কর্মী অনুপস্থিতি নোটিশ"
        moduleNameEn="Left Worker Notice"
        date={employee.date}
        onDateChange={d => setEmployee(prev => ({ ...prev, date: d }))}

        steps={STEPS}
        activeStep={view === 'form' ? 'form' : ''}
        onStepChange={() => setView('form')}

        billItems={billItems}
        isBillActive={view !== 'form'}
        activeBillId={activeBillId}
        hideBillHeading

        saveDisabled={saveDisabled}
        onSave={async () => {
          if (saveDisabled) return false;
          if (issues.errors.length > 0) { showFirstError(); return false; }
          const record = buildRecord();
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
          if (ok) handleReset('statement');
          return ok;
        }}
        isSaving={sheets.isSaving}
        configured={sheets.configured}
        adapterName={sheets.adapterName}

        editingId={sheets.editingId}
        onCancelEdit={() => handleReset('form')}
        onReset={() => handleReset('form')}
        isDirty={Boolean(employee.name.trim() || employee.cardNo.trim())}

        onUpdate={rec => loadRecord(rec, 'form')}
        updateModule="leftnotice"
        updateLabel="Left Notice রেকর্ড খুঁজুন"
        updateSearchPlaceholder="নাম, কার্ড নং বা পদবী দিয়ে খুঁজুন..."

        // Global Employee Search: this module's Employee uses `name` (not `employeeName`) and `section` (not
        // `department`). Gender is normalised to 'male' | 'female' | 'third'. Fills the form; it does not start
        // an "edit" of a saved record.
        onEmployeeSelect={e => {
          setEmployee(prev => ({
            ...prev,
            name:        String(e.fullNameBengali ?? e.fullName ?? prev.name),
            fatherName:  String(e.fatherName ?? prev.fatherName),
            motherName:  String(e.motherName ?? prev.motherName ?? ''),
            gender:      normalizeGender(e.gender) || prev.gender || '',
            husbandName: String(e.husbandName ?? prev.husbandName ?? ''),
            designation: String(e.designation ?? prev.designation),
            cardNo:      String(e.cardNo ?? prev.cardNo),
            section:     String(e.sectionLine ?? e.department ?? prev.section),
            joiningDate: e.joiningDate ? toDateInput(e.joiningDate) || prev.joiningDate || '' : prev.joiningDate || '',
            presentAddress: {
              houseNo:    String(e.presentHouseNo    ?? prev.presentAddress.houseNo),
              village:    String(e.presentVillage    ?? prev.presentAddress.village),
              postOffice: String(e.presentPostOffice ?? prev.presentAddress.postOffice),
              thana:      String(e.presentThana      ?? prev.presentAddress.thana),
              district:   String(e.presentDistrict   ?? prev.presentAddress.district),
            },
            permanentAddress: {
              houseNo:    String(e.permanentHouseNo    ?? prev.permanentAddress.houseNo),
              village:    String(e.permanentVillage    ?? prev.permanentAddress.village),
              postOffice: String(e.permanentPostOffice ?? prev.permanentAddress.postOffice),
              thana:      String(e.permanentThana      ?? prev.permanentAddress.thana),
              district:   String(e.permanentDistrict   ?? prev.permanentAddress.district),
            },
          }));
          setView('form');
        }}

        calcRows={[
          { label: 'কর্মী',           value: employee.name || '—' },
          { label: '১ম নোটিশ',       value: bnDate(calc.first) },
          { label: '২য় নোটিশ',       value: bnDate(calc.second) },
          { label: 'চূড়ান্ত নোটিশ',   value: bnDate(calc.third) },
          { label: 'অনুপস্থিত',       value: calc.daysAbsent !== null && calc.daysAbsent >= 0 ? `${toBanglaNumber(calc.daysAbsent)} দিন` : '—', muted: true },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => { loadRecord(rec as Record<string, unknown>, 'form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onDeleteRecord={deleteRecord}
        onReload={sheets.reload}
        recordLabel={rec => `${String(rec.employeeName ?? rec.id ?? '—')}${rec.cardNo ? ` (${String(rec.cardNo)})` : ''}`}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExcel}
        lang="bn"
      >
        {importOpen && (
          <LeftNoticeImportPage
            existing={allRows.map(r => ({ cardNo: r.cardNo, absence: r.absence }))}
            onImport={importNotices}
            onClose={() => { void sheets.reload(); handleReset('statement'); }}
          />
        )}

        {!importOpen && view === 'form' && <EmployeeForm employee={employee} setEmployee={setEmployee} calc={calc} issues={issues} showErrors={showErrors} onBulkImport={() => setImportOpen(true)} />}

        {!importOpen && view === 'statement' && (
          <LeftNoticeStatement rows={allRows} filters={filters} onFiltersChange={setFilters}
            onEdit={editById} onLetter={letterById} onDelete={id => { void deleteRecord(id); }} onAdd={() => handleReset('form')} />
        )}

        {/* Hidden print copy so the header Print / PDF buttons work from the Statement. */}
        {!importOpen && view === 'statement' && (
          <div className="ln-print-offscreen" aria-hidden="true" style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}>
            <div id="printable-area" ref={printAreaRef}>{listView}</div>
          </div>
        )}

        {view === 'printList' && <div id="printable-area" ref={printAreaRef}>{listView}</div>}

        {(view === 'envelope-present' || view === 'envelope-permanent') && (
          <div id="printable-area" ref={viewRef}>
            <Envelope employee={emp} addressType={view === 'envelope-present' ? 'present' : 'permanent'} />
          </div>
        )}

        {(['notice1', 'notice2', 'notice3'] as const).map((type, idx) => (
          view === type && (
            <div id="printable-area" ref={viewRef} key={type}>
              <NoticeLetter employee={emp} title={`পত্র নং-${toBanglaNumber(idx + 1)}`} noticeType={type} authorization={authorization} />
            </div>
          )
        ))}
      </ModuleShell>
    </>
  );
}

export default NoticeView;