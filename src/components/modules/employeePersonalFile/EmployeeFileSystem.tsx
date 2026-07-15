// ─────────────────────────────────────────────────────────────────────────────
// EmployeeFileSystem.tsx
//
// REBUILT on ModuleShell — replaces the hand-rolled sidebar/toggle layout.
//
// CHANGES vs previous version:
//  - No persistence existed at all: useDatabase was imported but
//    sheets.save/update/records/editingId were never used. There was no
//    Save button, no way to load a saved employee, no update-search. Now
//    fully wired via useDatabase, matching every other module.
//  - Removed dead imports (AppButton, SheetsSaveButton, ModuleHeader,
//    AuthorizationBlock, SheetsHistory, EmployeeSearchBar) — all were
//    imported but never rendered in the old file. EmployeeSearchBar is now
//    actually used, for card-no lookup of an existing employee.
//  - The 6 "Generate Documents" buttons are now ModuleShell output items
//    instead of a custom sidebar, reusing the same PrintFiles components
//    unchanged.
//  - 10 real form steps (from the old "All" tab's sections — see
//    EmployeeForm.tsx for why the other 6 tabs were dropped as duplicates).
//  - buildRecord() now saves the FULL ~147-field EmployeeFormData shape.
//    Critically, this also makes toPersonalData() in EmployeePersonalData.ts
//    actually reachable for the first time — every OTHER module's
//    EmployeeSearchBar (card-no auto-fill) depends on this module's saved
//    records, which never existed before since nothing was ever saved here.
//
//  FIX (printable-layout audit, single-page split + PDF-export gap):
//  handlePrint()'s auto-scale used to target `.nl-page, #printable-area > *,
//  #printable-area` and then compensate the horizontal shrink via an inline
//  `width` style. Two real bugs there:
//   1. `.nl-page` is pinned with `position:absolute;inset:0` under print CSS,
//      which forces ITS OWN box to exactly the page size regardless of
//      content height — scaling that element (rather than a normal in-flow
//      child) interacts unpredictably with that forced sizing.
//   2. The inline `width` compensation was silently discarded, because the
//      print stylesheet sets `.nl-page { width: 100% !important }`, and
//      `!important` always wins over an inline style.
//  Also, handleExportPDF() (the "Download PDF" button, a completely
//  separate html2canvas + jsPDF path) had NO shrink-to-fit at all — any
//  content taller than one page's worth was simply cut off by the PDF page
//  boundary rather than moved to a second page, since jsPDF's addImage()
//  doesn't paginate.
//  Both are now fixed by one shared `fitPrintContentToOnePage()` helper,
//  used by both paths, that scales `.nl-wrap` (the safe, normal-flow
//  content root — not `.nl-page`) uniformly so both dimensions fit one A4
//  page's printable area, with `transform-origin: top center` (no width
//  compensation needed since a uniform scale already shrinks width too).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { useFactory } from '../../../hooks/useFactory';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import jsPDF from 'jspdf';
import ModuleShell from '../../shell/ModuleShell';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import { EmployeeFormData, initialFormData } from './employee.types';
import EmployeeForm, { type FormStepId } from './EmployeeForm';
import AppointmentLetter from './PrintFiles/AppointmentLetter';
import NomineeForm from './PrintFiles/NomineeForm';
import AgeEstimation from './PrintFiles/AgeEstimation';
import IdCard from './PrintFiles/IdCard';
import PersonalInfoSheet from './PrintFiles/PersonalInfoSheet';

// ── Print / export fit-to-page ─────────────────────────────────────────────

// Must match the `@page { margin: ... }` set in the print iframe below, and
// the compact `.nl-page` padding used by every PrintFiles/*.tsx component.
const PRINT_PAGE_MARGIN_MM = 8;
const PX_PER_MM = 96 / 25.4;

/**
 * Scales the printable content's root element down (if needed) so its
 * natural size fits within one A4 page's printable area, in both
 * dimensions. Shared by both handlePrint (on the cloned iframe document)
 * and handleExportPDF (on the live DOM, right before html2canvas captures
 * it) so every PrintFiles/*.tsx component gets the same guarantee without
 * needing this logic duplicated into each one.
 *
 * Targets `.nl-wrap` specifically, not `.nl-page`: `.nl-page` is pinned to
 * `position:absolute;inset:0` under print CSS, forcing its own box to
 * exactly the page size regardless of content — scaling that element
 * interacts unpredictably with the forced sizing. `.nl-wrap` is a normal
 * in-flow child, so a transform scale on it behaves predictably and is
 * what actually needs to shrink.
 *
 * Returns a reset function. Callers operating on a throwaway iframe
 * document (handlePrint) can ignore it; callers operating on the live page
 * (handleExportPDF) must call it after capture so the on-screen view isn't
 * left shrunk.
 */
function fitPrintContentToOnePage(containerEl: Document | HTMLElement): () => void {
  // Duck-typed check instead of `instanceof Document` — a same-origin
  // iframe's Document comes from a different JS realm than the parent
  // window's, so `instanceof` against the parent's Document constructor
  // would incorrectly return false.
  const root: HTMLElement = 'body' in containerEl
    ? (containerEl as Document).body
    : (containerEl as HTMLElement);

  const target = (root.querySelector('.nl-wrap')
    || root.querySelector('.nl-page')
    || root.firstElementChild) as HTMLElement | null;
  if (!target) return () => {};

  const availableHeightPx = (297 - PRINT_PAGE_MARGIN_MM * 2) * PX_PER_MM;
  const availableWidthPx  = (210 - PRINT_PAGE_MARGIN_MM * 2) * PX_PER_MM;
  const naturalHeight = target.scrollHeight;
  const naturalWidth  = target.scrollWidth;

  const heightRatio = naturalHeight > availableHeightPx ? availableHeightPx / naturalHeight : 1;
  const widthRatio  = naturalWidth  > availableWidthPx  ? availableWidthPx  / naturalWidth  : 1;
  // A floor purely as a safety net against a measurement glitch producing
  // an absurd ratio (e.g. text rendered unreadably tiny) — not a normal
  // operating point for a single letter's worth of content.
  const scale = Math.max(0.5, Math.min(heightRatio, widthRatio));

  const prevTransform = target.style.transform;
  const prevOrigin = target.style.transformOrigin;

  if (scale < 1) {
    target.style.transform = `scale(${scale})`;
    target.style.transformOrigin = 'top center';
  }

  return () => {
    target.style.transform = prevTransform;
    target.style.transformOrigin = prevOrigin;
  };
}

// ── Steps & output items ───────────────────────────────────────────────────

const STEPS: { id: FormStepId; label: string; icon: string }[] = [
  { id: 'identity',   label: 'ব্যক্তিগত তথ্য',     icon: 'ti-user'           },
  { id: 'employment', label: 'চাকরির তথ্য',         icon: 'ti-briefcase'      },
  { id: 'contact',    label: 'যোগাযোগ',            icon: 'ti-map-pin'        },
  { id: 'education',  label: 'শিক্ষাগত যোগ্যতা',     icon: 'ti-school'         },
  { id: 'previous',   label: 'পূর্ববর্তী অভিজ্ঞতা',  icon: 'ti-history'        },
  { id: 'nominee',    label: 'নমিনি তথ্য',          icon: 'ti-users'          },
  { id: 'supervisor', label: 'সুপারিশকারী',         icon: 'ti-user-shield'    },
];

type OutputId = 'appointment' | 'nominee_doc' | 'age' | 'idcard' | 'personal_doc';

function EmployeeFileSystem() {
  const factory  = useFactory();
  const { user } = useAuth();
  const sheets   = useDatabase('employees', factory.id, user?.name ?? 'unknown');

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [touched,   setTouched]   = useState(false);
  const [formData,   setFormData]   = useState<EmployeeFormData>(initialFormData);
  const [activeView, setActiveView] = useState<FormStepId | OutputId>('employment');

  // Auto-fill factory info + today's date from session
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      companyName:    factory.nameBn,
      companyAddress: factory.addressBn,
      date:           prev.date || new Date().toISOString().split('T')[0],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const isFormStep = (v: string): v is FormStepId => STEPS.some(s => s.id === v);
  const isOutputView = !isFormStep(activeView);
  const activeFormStep: FormStepId = isFormStep(activeView) ? activeView : 'employment';

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setTouched(false);
    setFormData(prev => ({
      ...initialFormData,
      companyName:    prev.companyName,
      companyAddress: prev.companyAddress,
      date:           new Date().toISOString().split('T')[0],
    }));
    setActiveView('identity');
    sheets.setEditingId(null);
  };

  const viewRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const doPrint = () => {
      const el = document.getElementById('printable-area');
      if (!el) return;
      // Collect page styles
      const styles = Array.from(document.styleSheets).map(ss => {
        try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); }
        catch { return ''; }
      }).join('\n');
      // AUDIT FIX: was window.open('', '_blank', ...) — opened a genuine
      // new browser tab/window for print preview, unlike every other
      // module in this app (which uses a hidden iframe, no tab/window
      // ever appears). Switched to the same hidden-iframe pattern —
      // per explicit request to stop the new-tab behavior — including
      // the black-box print fix already established elsewhere (forces
      // html/body to white/black, placed AFTER the copied stylesheets
      // so it wins the cascade regardless of the app's current theme).
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument;
      if (!doc) { document.body.removeChild(iframe); return; }
      doc.open();
      doc.write(
        '<!DOCTYPE html><html lang="bn"><head>' +
        '<meta charset="UTF-8">' +
        // AUDIT FIX: the Bengali font was only ever loaded via the
        // `@import url(fonts.googleapis.com/...)` buried inside the
        // copied CSS. `document.fonts.ready` only reliably reflects
        // fonts that are already REGISTERED — if that @import hasn't
        // finished fetching by the time fonts.ready is checked, it can
        // resolve prematurely (no matching FontFace registered yet), so
        // the fit measurement below would run against fallback-font
        // metrics, and the real Bengali font would swap in — silently
        // invalidating the computed scale — only after print() had
        // already been invoked. An explicit <link> gives us a real,
        // waitable load/error event to anchor on before ever checking
        // fonts.ready.
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap">' +
        '<title>' + (formData.fullName || 'কর্মী ফাইল') + '</title>' +
        '<style>' + styles +
        '@media print{@page{size:A4 portrait;margin:' + PRINT_PAGE_MARGIN_MM + 'mm;}body{margin:0;padding:0;background:#fff;}}' +
        'body{font-family:"Noto Sans Bengali","Segoe UI",system-ui,sans-serif;background:#fff;}' +
        '</style><style>html,body{background:#fff !important;color:#000 !important;}</style></head><body>' +
        el.innerHTML +
        '</body></html>'
      );
      doc.close();
      iframe.onload = () => {
        // AUDIT FIX: hand-tuned CSS point-sizes were a rough ESTIMATE of
        // whether content fits one A4 page (confirmed by the person as
        // "close, not guaranteed" in an earlier round) — different
        // employees have different name/address lengths, so a fixed
        // font-size can't guarantee fit for everyone. This measures the
        // ACTUAL rendered content height in the print iframe and, only
        // if it doesn't already fit, applies a uniform shrink via
        // fitPrintContentToOnePage() so the whole letter scales down
        // together — guarantees nothing is cut off, at the cost of
        // slightly smaller text only when truly needed.
        //
        // Waiting for fonts is a two-step process (see the AUDIT FIX
        // note by the <link> tag above): first the explicit <link>'s own
        // load/error event (meaning the @font-face rules are now
        // actually registered), with a timeout fallback in case that
        // event is ever missed entirely; only then does fonts.ready mean
        // what we want it to mean.
        const waitForFontsThenMeasure = () => {
          const fonts = (doc as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts;
          const proceed = () => {
            if (fonts?.ready) {
              fonts.ready.then(() => setTimeout(measureAndPrint, 100)).catch(() => setTimeout(measureAndPrint, 150));
            } else {
              setTimeout(measureAndPrint, 300);
            }
          };
          const fontLink = doc.querySelector('link[href*="fonts.googleapis.com"]') as HTMLLinkElement | null;
          if (fontLink) {
            let settled = false;
            const onSettle = () => { if (!settled) { settled = true; proceed(); } };
            fontLink.addEventListener('load', onSettle, { once: true });
            fontLink.addEventListener('error', onSettle, { once: true });
            // Fallback in case the link's load/error event is somehow
            // never fired (e.g. it was already cached and resolved
            // before listeners attached).
            setTimeout(onSettle, 1200);
          } else {
            proceed();
          }
        };

        const measureAndPrint = () => {
          fitPrintContentToOnePage(doc);
          // Defensive second pass: a scale computed just before a very
          // late reflow (a straggling font swap, image decode, etc.)
          // can be stale. Re-measuring one frame later and re-applying
          // is cheap insurance — fitPrintContentToOnePage always
          // measures the natural (unscaled) height fresh, so this
          // simply corrects the scale if anything shifted.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              fitPrintContentToOnePage(doc);
              iframe.contentWindow!.focus();
              iframe.contentWindow!.print();
              iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
            });
          });
        };

        waitForFontsThenMeasure();
      };
    };
    if (!document.getElementById('printable-area')) {
      setActiveView('personal_doc' as any);
      setTimeout(doPrint, 500);
    } else {
      doPrint();
    }
  };

  const handleExportPDF = async () => {
    // If in form step, switch to print view first
    if (!document.getElementById('printable-area')) {
      setActiveView('personal_doc' as any);
      await new Promise(r => setTimeout(r, 400));
    }
    const el = document.getElementById('printable-area');
    if (!el) return;
    // AUDIT FIX: this path previously had no shrink-to-fit at all — it
    // just captured whatever height the content naturally rendered at and
    // stretched an image to that height in the PDF. jsPDF's addImage()
    // doesn't paginate, so any content taller than one page was silently
    // cut off by the PDF page boundary rather than flowing to a second
    // page. Reusing the same fitPrintContentToOnePage() helper as
    // handlePrint() closes that gap, and resetting it in `finally` makes
    // sure the on-screen view isn't left visually shrunk afterward.
    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch { /* proceed with current metrics */ }
    }
    const resetFit = fitPrintContentToOnePage(el);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF('p', 'mm', 'a4');
      const pageW   = pdf.internal.pageSize.getWidth();
      const imgH    = (canvas.height * pageW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
      const name = formData.fullName?.replace(/\s+/g, '_') || 'Employee';
      pdf.save(`${name}_PersonalFile.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      resetFit();
    }
  };

  // ── Build DB record — full EmployeeFormData shape ─────────────────────────
  const buildRecord = (): Record<string, string> => {
    const { educationHistory, previousJobs, ...flat } = formData;
    return {
      ...(flat as unknown as Record<string, string>),
      educationHistoryJson: JSON.stringify(educationHistory ?? []),
      previousJobsJson:     JSON.stringify(previousJobs ?? []),
    };
  };

  const recordToFormData = (rec: Record<string, unknown>): EmployeeFormData => {
    const next = { ...initialFormData };
    // Load known fields from initialFormData keys
    (Object.keys(initialFormData) as (keyof EmployeeFormData)[]).forEach(key => {
      if (key === 'educationHistory' || key === 'previousJobs') return;
      if (rec[key] !== undefined) {
        (next as unknown as Record<string, string>)[key as string] = String(rec[key] ?? '');
      }
    });
    // Also load any extra fields from the record that may not be in initialFormData
    // (e.g. grossSalary, onnano, presentHouseNo, permanentHouseNo, drivingLicense)
    Object.keys(rec).forEach(key => {
      if (key === 'educationHistory' || key === 'previousJobs') return;
      if (key === 'educationHistoryJson' || key === 'previousJobsJson') return;
      if (!(key in next) && rec[key] !== undefined) {
        (next as unknown as Record<string, string>)[key] = String(rec[key] ?? '');
      }
    });
    try { next.educationHistory = JSON.parse(String(rec.educationHistoryJson ?? '[]')); } catch { next.educationHistory = []; }
    try { next.previousJobs     = JSON.parse(String(rec.previousJobsJson     ?? '[]')); } catch { next.previousJobs     = []; }
    // AUDIT FIX: legacy/older records can have companyName/companyAddress
    // saved as an empty string (e.g. records created before the mount-time
    // auto-fill existed, or saved mid-session before it ran). The generic
    // field-copy loop above treats '' as a real value ('' !== undefined)
    // and overwrites whatever the factory-context auto-fill had just set,
    // leaving the print views (Appointment Letter etc.) showing the
    // "Company Name" placeholder fallback instead of the actual factory
    // name — confirmed via a real exported PDF. Falls back to the CURRENT
    // factory's name/address when the loaded record's own value is blank.
    if (!next.companyName)    next.companyName    = factory.nameBn;
    if (!next.companyAddress) next.companyAddress = factory.addressBn;
    return next;
  };

  const loadRecord = (rec: Record<string, unknown>) => {
    sheets.setEditingId(String(rec.id ?? ''));
    setFormData(recordToFormData(rec));
    setActiveView('identity');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Sidebar output items ──────────────────────────────────────────────────
  const billItems = [
    { label: 'নিয়োগপত্র',          onClick: () => setActiveView('appointment')  },
    { label: 'নমিনি ফরম',           onClick: () => setActiveView('nominee_doc')  },
    { label: 'মেডিকেল ফিটনেস',      onClick: () => setActiveView('age')          },
    { label: 'আইডি কার্ড',          onClick: () => setActiveView('idcard')       },
    { label: 'ব্যক্তিগত তথ্য শিট',   onClick: () => setActiveView('personal_doc') },
  ];

  const isDataReady = !!(formData.fullName && formData.employeeId);

  return (
    <>
      <style>{`${BASE_PRINT_CSS}${PAGE_A4_PORTRAIT}`}</style>

      <ModuleShell
        moduleName="কর্মীর ব্যক্তিগত ফাইল"
        moduleNameEn="Employee Personal File"
        date={formData.date}
        onDateChange={d => setFormData(prev => ({ ...prev, date: d }))}

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
        // saveDisabled={!isDataReady}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        isDirty={touched}
        onReset={handleReset}

        onUpdate={loadRecord}
        updateModule="employees"
        updateLabel="কর্মী রেকর্ড খুঁজুন"
        updateSearchPlaceholder="নাম বা কার্ড নং দিয়ে খুঁজুন..."

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => loadRecord(rec as Record<string, unknown>)}
        onDeleteRecord={sheets.remove}
        onReload={sheets.reload}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        lang="bn"
      >
        {isFormStep(activeView) && (
          <>
            <EmployeeForm formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} activeStep={activeFormStep} onDirtyChange={dirty => { if (dirty) setTouched(true); }} />
          </>
        )}

        {activeView === 'appointment' && (
          <div id="printable-area"><AppointmentLetter formData={formData} /></div>
        )}
        {activeView === 'nominee_doc' && (
          <div id="printable-area"><NomineeForm formData={formData} /></div>
        )}
        {activeView === 'age' && (
          <div id="printable-area"><AgeEstimation formData={formData} /></div>
        )}
        {activeView === 'idcard' && (
          <div id="printable-area"><IdCard formData={formData} /></div>
        )}
        {activeView === 'personal_doc' && (
          <div id="printable-area"><PersonalInfoSheet formData={formData} /></div>
        )}
      </ModuleShell>
    </>
  );
}

export default EmployeeFileSystem;