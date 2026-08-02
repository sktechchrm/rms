// ─────────────────────────────────────────────────────────────────────────────
// EmployeeNoticeView.tsx
// Path: src/components/LeftEmployeeNotice/EmployeeNoticeView.tsx
//
// REBUILT on ModuleShell — same pattern as requisition / increment / maternity.
//
// CHANGES vs previous version:
//  - localStorage persistence removed → real database persistence via
//    useDatabase('leftnotice', ...), matching every other module.
//  - Custom <nav> tab bar replaced by ModuleShell's steps + billItems.
//  - Added EmployeeSearchBar for card-no auto-fill (was completely absent
//    from the live flow before — only existed in the dead App in
//    EmployeeInfoForm.tsx, which nobody imported).
//  - Fixed the dead-tab bug: clicking পত্র নং-১/২/৩ or খাম in the sidebar
//    now actually renders NoticeLetter / Envelope — previously these were
//    decorative only (children always rendered the data-entry form).
//  - window.confirm() reset replaced by ModuleShell's built-in confirm.
//  - Notice letters' signature block now sourced from the shared
//    Authorization panel (auth/onAuthChange) instead of hardcoded text.
//  - buildRecord()/recordToFormData() persist the FULL Employee shape,
//    including both addresses (as addressesJson) and all three
//    auto-calculated notice dates — previously, if this had ever been
//    wired to save, only 6 of ~16 fields would have been kept.
//
// FIX (সাধারণ তথ্য shows empty right after search, until you leave and
// come back to the tab): EmployeeInfoForm.tsx's PersonalForm/AddressForm
// each call `useForm({ defaultValues: { ...employee } })` — react-hook-
// form only reads `defaultValues` ONCE, at mount. Selecting an employee
// via search updates THIS component's `employee` state correctly, but
// whichever tab is already mounted never re-reads it (no `reset()` was
// ever called), so its inputs kept showing stale/empty values. Switching
// tabs "fixed" it only because switching tabs unmounts the old tab and
// mounts the other one fresh — and switching back re-mounts the
// originally-stale tab, picking up the (by-then correct) employee prop
// for the first time.
// FIX: added `formInstanceKey`, a plain counter bumped every time the
// `employee` state is replaced from an EXTERNAL source (global search
// select, loading a saved record, or reset) — never on ordinary typing,
// since those events call onChange with a full replacement object rather
// than incrementing this counter. `EmployeeForm` below is now keyed on
// `` `${sheets.editingId ?? 'new'}-${formInstanceKey}` `` , so React
// force-remounts it (and whichever child tab is active) at exactly the
// moment new data actually arrives — no more waiting on a tab switch to
// see it. EmployeeInfoForm.tsx itself needed NO changes for this; a
// fresh mount already re-reads `employee` into defaultValues correctly.
//
// FIX (husbandName dropped by employee search): onEmployeeSelect's field
// mapping copied fatherName/motherName/gender/etc. from the selected
// employee record but never husbandName, even though it's a normal part
// of the Employee shape (persisted by buildRecord/recordToFormData just
// like the others). Added below.
//
// FIX (date lost on reset): handleReset only carried companyName/
// companyAddress over from the previous state — `date` fell back to
// initialEmployee's blank value every time, even though the mount effect
// auto-fills it with today's date. Since handleReset also runs
// automatically after every successful save, this meant the date field
// went blank after each save instead of staying pre-filled with today.
// Now carries `date` over the same way the mount effect does.
//
// FIX (gender not showing correctly after Personal File search): the
// গender <Select> in EmployeeInfoForm.tsx only recognizes exactly three
// option values — 'male', 'female', 'third' (see its options list). The
// Personal File record picked up via global employee search stores
// gender in its OWN shape/casing/language, which was being copied
// straight through here as `String(emp.gender ?? prev.gender ?? '')`
// with no translation. Whenever the Personal File's raw value didn't
// exactly match one of those three lowercase codes — capitalized
// ("Male"/"Female"), Bengali ("পুরুষ"/"নারী"), or a different code
// entirely — the <Select> had no matching <option>, so it silently
// showed no selection even though employee.gender DID hold a (just
// non-matching) value. This was a value-mismatch bug, not the same
// stale-defaultValues bug the formInstanceKey fix above already solved.
// FIX: added normalizeGender() below, which maps common casings/
// languages/synonyms for each of the three genders down to this
// module's canonical 'male' | 'female' | 'third' codes, and wired it
// into onEmployeeSelect's gender mapping instead of a raw passthrough.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useAuth }                  from '../../../context/AuthContext';
import { useFactory }                from '../../../hooks/useFactory';
import { useDatabase }             from '../../../hooks/useDatabase';
import { toDateInput }               from '../../../utils/dateUtils';
import ModuleShell                   from '../../shell/ModuleShell';
import { DEFAULT_AUTHORIZATION }     from '../../common/AuthorizationBlock';
import type { AuthorizationState }   from '../../common/AuthorizationBlock';
import { Employee, initialEmployee, toBanglaNumber } from './LeftNoticeDataType';
import { EmployeeForm }              from './EmployeeInfoForm';
import { NoticeLetter }              from './EmployeeNotice';
import { Envelope }                  from './Envelope';
import { exportToPDF }               from '../../../utils/pdfExport';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

// ── Steps & output items ───────────────────────────────────────────────────

const STEPS = [
  { id: 'personal', label: 'সাধারণ তথ্য', icon: 'ti-user-circle' },
  { id: 'address',  label: 'ঠিকানা',      icon: 'ti-map-pin' },
];

type FormStepId = 'personal' | 'address';
type ViewId = FormStepId | 'notice1' | 'notice2' | 'notice3' | 'envelope-present' | 'envelope-permanent';

// ── Gender normalization ────────────────────────────────────────────────────
// The গender <Select> in EmployeeInfoForm.tsx only has options with
// value 'male' | 'female' | 'third'. Data coming from the separate
// Personal File / global employee search isn't guaranteed to use those
// exact codes — this maps known casings/languages/synonyms down to them.
// Unrecognized non-empty values are passed through as-is (rather than
// silently dropped) in case they already happen to match a valid code
// this list doesn't know about yet; recognized-but-mismatched values are
// what this specifically fixes.
const GENDER_MAP: Record<string, 'male' | 'female' | 'third'> = {
  male: 'male', m: 'male', পুরুষ: 'male',
  female: 'female', f: 'female', নারী: 'female', মহিলা: 'female',
  third: 'third', other: 'third', others: 'third', trans: 'third', transgender: 'third',
  তৃতীয়: 'third', 'তৃতীয় লিঙ্গ': 'third', 'অ-দ্বৈত': 'third', হিজড়া: 'third',
};
const normalizeGender = (raw: unknown): string => {
  const v = String(raw ?? '').trim();
  if (!v) return '';
  const key = v.toLowerCase();
  return GENDER_MAP[key] ?? GENDER_MAP[v] ?? v;
};

// ── recordToFormData ─────────────────────────────────────────────────────────

function recordToFormData(rec: Record<string, unknown>, prev: Employee): Employee {
  let addresses: { present?: Employee['presentAddress']; permanent?: Employee['permanentAddress'] } = {};
  try {
    addresses = JSON.parse(String(rec.addressesJson ?? '{}')) ?? {};
  } catch { /* ignore malformed JSON */ }

  return {
    ...prev,
    name:              String(rec.employeeName ?? ''),
    fatherName:        String(rec.fatherName    ?? ''),
    motherName:        String(rec.motherName    ?? ''),
    gender:            String(rec.gender        ?? ''),
    husbandName:       String(rec.husbandName   ?? ''),
    cardNo:            String(rec.cardNo        ?? ''),
    designation:       String(rec.designation   ?? ''),
    section:           String(rec.department    ?? ''),
    date:              toDateInput(rec.date),
    joiningDate:       toDateInput(rec.joiningDate),
    absenceStartDate:  toDateInput(rec.absentFrom),
    firstNoticeDate:   toDateInput(rec.firstNoticeDate),
    secondNoticeDate:  toDateInput(rec.secondNoticeDate),
    thirdNoticeDate:   toDateInput(rec.thirdNoticeDate),
    presentAddress:    addresses.present   ?? prev.presentAddress,
    permanentAddress:  addresses.permanent ?? prev.permanentAddress,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

function NoticeView() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets  = useDatabase('leftnotice', factory.id, user?.name ?? 'unknown');
  const viewRef = useRef<HTMLDivElement>(null);

  // "Prepared By" is always hidden for this module (hidePrepared on
  // PrintSignatureRow). The other 4 authority rows (Authorized 1/2,
  // Approved 1/2) remain fully user-selectable via the same visibility
  // checkboxes every other module uses — the user can show just one (it
  // sits left-aligned), two (spread left/right), or all four.
  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [touched,   setTouched]   = useState(false);
  const [activeView,    setActiveView]    = useState<ViewId>('personal');
  const [employee,      setEmployee]      = useState<Employee>(initialEmployee);

  // Bumped every time `employee` is replaced wholesale from an EXTERNAL
  // source (search select / record load / reset) — see file-header FIX
  // comment. Used purely as part of EmployeeForm's `key` below to force
  // a clean remount exactly when it's actually needed, never on regular
  // per-field typing (which goes through onChange, not this counter).
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const bumpFormInstance = () => setFormInstanceKey(k => k + 1);

  // ── Auto-fill factory info + today's date from session ────────────────────
  useEffect(() => {
    setEmployee(prev => ({
      ...prev,
      companyName:    factory.nameBn,
      companyAddress: factory.addressBn,
      date:           prev.date || new Date().toISOString().split('T')[0],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const isDataReady     = !!(employee.name && employee.cardNo && employee.companyName);
  const noticesGenerated = !!employee.absenceStartDate;

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setTouched(false);
    setEmployee(prev => ({
      ...initialEmployee,
      // Keep factory data from session
      companyName:    prev.companyName,
      companyAddress: prev.companyAddress,
      // FIX: date was previously dropped back to blank on every reset
      // (including the automatic reset after a successful save) even
      // though the mount effect above auto-fills it with today's date.
      // Carry it over the same way, so it doesn't have to be re-typed
      // after every save.
      date:           prev.date || new Date().toISOString().split('T')[0],
    }));
    setActiveView('personal');
    sheets.setEditingId(null);
    bumpFormInstance();
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    const el = viewRef.current;
    if (!el) return;
    await exportToPDF({ element: el, filename: `LeftNotice_${employee.name || 'document'}`, scale: 2 });
  };

  // ── Build DB record ───────────────────────────────────────────────────────
  const buildRecord = () => ({
    employeeName:     employee.name,
    cardNo:           employee.cardNo,
    designation:      employee.designation,
    department:       employee.section,
    fatherName:       employee.fatherName ?? '',
    motherName:       employee.motherName ?? '',
    gender:           employee.gender ?? '',
    husbandName:      employee.husbandName ?? '',
    date:             employee.date ?? '',
    joiningDate:      employee.joiningDate ?? '',
    absentFrom:       employee.absenceStartDate ?? '',
    firstNoticeDate:  employee.firstNoticeDate ?? '',
    secondNoticeDate: employee.secondNoticeDate ?? '',
    thirdNoticeDate:  employee.thirdNoticeDate ?? '',
    noticeType:       'notice1',
    addressesJson:    JSON.stringify({
      present:   employee.presentAddress,
      permanent: employee.permanentAddress,
    }),
  });

  // ── Sidebar output items ──────────────────────────────────────────────────
  const billItems = [
    { label: 'পত্র নং-১', onClick: () => noticesGenerated && setActiveView('notice1') },
    { label: 'পত্র নং-২', onClick: () => noticesGenerated && setActiveView('notice2') },
    { label: 'পত্র নং-৩', onClick: () => noticesGenerated && setActiveView('notice3') },
    {
      label: 'খাম',
      // NOTE: ModuleShell calls both sub.onClick() AND this parent onClick()
      // together whenever a sub-item is clicked — so this must stay a no-op,
      // otherwise it would override whichever sub-item (present/permanent)
      // was just selected back to a single default every time.
      onClick: () => {},
      subItems: [
        { label: 'বর্তমান ঠিকানা',  onClick: () => noticesGenerated && setActiveView('envelope-present'),   active: activeView === 'envelope-present' },
        { label: 'স্থায়ী ঠিকানা',   onClick: () => noticesGenerated && setActiveView('envelope-permanent'), active: activeView === 'envelope-permanent' },
      ],
    },
  ];

  const isOutputView = activeView !== 'personal' && activeView !== 'address';
  const activeFormStep: FormStepId = (activeView === 'personal' || activeView === 'address') ? activeView : 'personal';

  // ── Render ────────────────────────────────────────────────────────────────
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
        }
      `}</style>

      <ModuleShell
        moduleName="কর্মী অনুপস্থিতি নোটিশ"
        moduleNameEn="Left Worker Notice"
        date={employee.date}
        onDateChange={d => setEmployee(prev => ({ ...prev, date: d }))}

        steps={STEPS}
        activeStep={activeFormStep}
        onStepChange={id => setActiveView(id as FormStepId)}

        billItems={billItems}
        isBillActive={isOutputView}

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
        saveDisabled={!isDataReady}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        isDirty={touched}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setEmployee(prev => recordToFormData(rec, prev));
          setActiveView('personal');
          bumpFormInstance();
        }}
        updateModule="leftnotice"
        updateLabel="Left Notice রেকর্ড খুঁজুন"
        updateSearchPlaceholder="নাম, কার্ড নং বা পদবী দিয়ে খুঁজুন..."

        // Point 3 — Global Employee Search: this module's Employee interface
        // uses `name` (not `employeeName`) and `section` (not `department`),
        // so the mapping differs from other modules. Also pulls fatherName/
        // motherName/gender/husbandName since the Personal File already has
        // them.
        onEmployeeSelect={emp => {
          setEmployee(prev => ({
            ...prev,
            name:        String(emp.fullNameBengali ?? emp.fullName ?? prev.name),
            fatherName:  String(emp.fatherName ?? prev.fatherName),
            motherName:  String(emp.motherName ?? prev.motherName ?? ''),
            // FIX: raw passthrough here meant the গender <Select> (which
            // only recognizes 'male' | 'female' | 'third') often had no
            // matching option for whatever casing/language the Personal
            // File actually stores gender in — see file-header FIX note.
            // normalizeGender() maps it down to this module's own codes.
            gender:      normalizeGender(emp.gender) || prev.gender || '',
            // FIX: husbandName was never picked up from the searched
            // employee record, unlike every other personal-info field —
            // left the user having to re-type it by hand each time.
            husbandName: String(emp.husbandName ?? prev.husbandName ?? ''),
            designation: String(emp.designation ?? prev.designation),
            cardNo:      String(emp.cardNo ?? prev.cardNo),
            section:     String(emp.sectionLine ?? emp.department ?? prev.section),
            joiningDate: String(emp.joiningDate ?? prev.joiningDate ?? ''),
            presentAddress: {
              houseNo:    String(emp.presentHouseNo    ?? prev.presentAddress.houseNo),
              village:    String(emp.presentVillage    ?? prev.presentAddress.village),
              postOffice: String(emp.presentPostOffice ?? prev.presentAddress.postOffice),
              thana:      String(emp.presentThana      ?? prev.presentAddress.thana),
              district:   String(emp.presentDistrict   ?? prev.presentAddress.district),
            },
            permanentAddress: {
              houseNo:    String(emp.permanentHouseNo    ?? prev.permanentAddress.houseNo),
              village:    String(emp.permanentVillage    ?? prev.permanentAddress.village),
              postOffice: String(emp.permanentPostOffice ?? prev.permanentAddress.postOffice),
              thana:      String(emp.permanentThana      ?? prev.permanentAddress.thana),
              district:   String(emp.permanentDistrict   ?? prev.permanentAddress.district),
            },
          }));
          setTouched(true);
          // FIX: this is the actual fix for "সাধারণ তথ্য shows empty right
          // after search" — see file-header comment. Forces EmployeeForm
          // (and whichever tab is currently active) to remount with the
          // freshly-selected employee's data, instead of silently keeping
          // whatever react-hook-form's defaultValues captured at its
          // original (stale) mount time.
          bumpFormInstance();
        }}

        calcRows={[
          { label: '১ম নোটিশ',     value: employee.firstNoticeDate  ? toBanglaNumber(employee.firstNoticeDate.split('-').reverse().join('/'))  : '—' },
          { label: '২য় নোটিশ',     value: employee.secondNoticeDate ? toBanglaNumber(employee.secondNoticeDate.split('-').reverse().join('/')) : '—' },
          { label: 'চূড়ান্ত নোটিশ', value: employee.thirdNoticeDate  ? toBanglaNumber(employee.thirdNoticeDate.split('-').reverse().join('/'))  : '—' },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setEmployee(prev => recordToFormData(rec as Record<string, unknown>, prev));
          setActiveView('personal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          bumpFormInstance();
        }}
        onDeleteRecord={sheets.remove}
        onReload={sheets.reload}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        lang="bn"
      >
        {(activeView === 'personal' || activeView === 'address') && (
          <>
            <EmployeeForm
              // FIX: previously keyed ONLY on sheets.editingId, so a
              // global employee search (which never touches editingId)
              // never forced a remount — the active tab kept whatever
              // stale react-hook-form defaultValues it captured at its
              // own original mount, until the user happened to switch
              // tabs and back. formInstanceKey now also bumps on search
              // select and on reset (see bumpFormInstance() calls above),
              // so this key changes at exactly the moments new employee
              // data actually needs to be picked up — never on ordinary
              // per-keystroke typing, since typing only calls onChange,
              // not bumpFormInstance().
              key={`${sheets.editingId ?? 'new'}-${formInstanceKey}`}
              employee={employee}
              onChange={data => { setTouched(true); setEmployee(data); }}
              activeTab={activeView}
              onDirtyChange={dirty => { if (dirty) setTouched(true); }}
            />
          </>
        )}

        {(activeView === 'envelope-present' || activeView === 'envelope-permanent') && (
          <div id="printable-area" ref={viewRef}>
            <Envelope employee={employee} addressType={activeView === 'envelope-present' ? 'present' : 'permanent'} />
          </div>
        )}

        {(['notice1', 'notice2', 'notice3'] as const).map((type, idx) => (
          activeView === type && (
            <div id="printable-area" ref={viewRef} key={type}>
              <NoticeLetter
                employee={employee}
                title={`পত্র নং-${toBanglaNumber(idx + 1)}`}
                noticeType={type}
                authorization={authorization}
              />
            </div>
          )
        ))}
      </ModuleShell>
    </>
  );
}

export default NoticeView;