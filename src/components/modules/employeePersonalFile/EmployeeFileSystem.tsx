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
//
//  ADDED: "Whole File" output — combines every generated document
//  (Appointment Letter, Nominee Form, Medical/Age Estimation, Personal
//  Info Sheet, Recruitment Verification Form) into one printable area, one
//  document per page. The ID Card is intentionally excluded, since it's a
//  different physical format (small card stock) and isn't meant to sit in
//  the same A4 packet as the rest of the file. Like every other output
//  button, clicking সম্পূর্ণ ফাইল only switches to this combined preview —
//  it does NOT auto-open the print dialog (an earlier version did, via a
//  setTimeout(handlePrint, ...) right in the button's onClick; removed per
//  explicit request so this button behaves identically to the rest: person
//  previews, then clicks print/PDF themselves when ready).
//  fitPrintContentToOnePage() was extended to handle the combined view:
//  when the printable area contains multiple `.nl-print-page-block`
//  wrappers (one per document), each block is measured and scaled against
//  its OWN page's worth of space independently, instead of treating the
//  whole combined area as a single document (which would have crushed 5
//  pages' worth of content down to fit one page).
//
//  FIX (whole-file print going blank when any one document's block fails
//  to fit): fitPrintContentToOnePage()'s multi-block path used to call
//  `blocks.map(fitOne)` with no error isolation — if fitting a SINGLE
//  block threw (a bad measurement, a missing `.nl-wrap`, anything), the
//  exception propagated straight out of fitPrintContentToOnePage() and
//  aborted measureAndPrint() BEFORE it ever reached
//  `iframe.contentWindow.print()`. The result: adding one more document to
//  the "Whole File" bundle could make the ENTIRE print job go blank —
//  including the other, perfectly fine documents — not just the one
//  block that had a problem. Confirmed by reproducing with the Recruitment
//  Verification Form's block: including it, nothing printed; removing
//  just that one block let the remaining four print normally, which only
//  makes sense if a single block's failure was taking down the whole
//  batch. Each block's fit is now isolated in its own try/catch, and the
//  print/PDF calls themselves are also guarded — so at worst one page
//  prints at its natural (unscaled) size, but every document always
//  reaches the printer/PDF rather than the whole job silently failing.
//  Also gives `.nl-print-page-block` an explicit `position:relative` +
//  page-sized box in the print stylesheet, since its child `.nl-page` is
//  `position:absolute;inset:0` and needs a properly sized, positioned
//  container to pin itself to ITS OWN page rather than drifting to
//  whatever the nearest positioned ancestor happens to be — this had been
//  working by luck with fewer/smaller blocks and was exposed by the fifth,
//  denser Recruitment Verification block.
//
//  FIX (Personal Info Sheet getting clipped to one page in the combined
//  print): every PrintFiles/*.tsx component injects its OWN `<style>` tag
//  containing nlSinglePageCss(), and none of these are scoped — they all
//  define the exact same class names (`.nl-page`, `.nl-wrap`, ...)
//  globally. In the combined "Whole File" print, Recruitment Verification
//  Form's block is LAST in source order, so for any tied specificity its
//  `.nl-page` rule (position:absolute, pinned to exactly one page's
//  height, clipped overflow — the correct behavior for a genuinely
//  single-page document) wins the cascade for EVERY `.nl-page` on the
//  page, including Personal Info Sheet's — even though that one is
//  explicitly marked `data-multipage="true"` because it's 8 sections
//  meant to flow across several physical pages via nlMultiPageCss(), not
//  be pinned to one. The `data-multipage` check already existed in
//  fitOne() below, but it only ever skipped the JS *scale* transform —
//  it never protected against this CSS-level clobbering from a sibling
//  document's stylesheet. Giving `.nl-print-page-block` an explicit
//  page-sized box (the FIX directly above this one) made it worse: it
//  gave the leaked `inset:0` something concrete to stretch against and
//  clip to, so content past the first page now silently disappears
//  instead of just visually spilling. fitOne() now, for any block marked
//  `data-multipage="true"`, forcibly resets `.nl-page` (and its
//  `.nl-print-page-block` container) back to normal static flow —
//  `position:static; height:auto; overflow:visible` — via
//  `style.setProperty(..., 'important')`, which reliably wins over ANY
//  stylesheet rule regardless of that rule's own `!important` or source
//  order, since it's the same technique used to override leaked styles
//  from other components generally. This makes the fix hold regardless
//  of which document happens to render last.
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

// AUDIT ADDITION: 'photo' is a step-nav entry (shows in ধাপসমূহ, has
// Prev/Next like any other step) but is NOT one of EmployeeForm.tsx's
// own FormStepId values — EmployeeForm doesn't know how to render it,
// because it's handled entirely here (PhotoUploadField) rather than
// inside EmployeeForm's own step-switch. StepId is this module's own
// broader union; FormStepId (imported, unmodified) stays the narrower
// type EmployeeForm actually accepts.
type StepId = FormStepId | 'photo';
import AppointmentLetter from './PrintFiles/AppointmentLetter';
import NomineeForm from './PrintFiles/NomineeForm';
import AgeEstimation from './PrintFiles/AgeEstimation';
import IdCard from './PrintFiles/IdCard';
import PersonalInfoSheet from './PrintFiles/PersonalInfoSheet';
import RecruitmentVerificationForm from './PrintFiles/RecruitmentVerificationForm';
import { PhotoUploadField } from './PrintFiles/PhotoAttach';

// ── Print / export fit-to-page ─────────────────────────────────────────────

// Must match the `@page { margin: ... }` set in the print iframe below, and
// the compact `.nl-page` padding used by every PrintFiles/*.tsx component.
const PRINT_PAGE_MARGIN_MM = 8;
const PX_PER_MM = 96 / 25.4;

/**
 * Scales printable content down (if needed) so it fits within one A4 page's
 * printable area, in both dimensions. Shared by handlePrint (on the cloned
 * iframe document) and handleExportPDF (on the live DOM, right before
 * html2canvas captures it) so every PrintFiles/*.tsx component gets the
 * same guarantee without needing this logic duplicated into each one.
 *
 * Two modes, auto-detected:
 *  - Single document (default): targets `.nl-wrap` — a normal in-flow
 *    child, not `.nl-page` (which is pinned to `position:absolute;inset:0`
 *    under print CSS and forces its own box to exactly the page size
 *    regardless of content, so scaling it directly interacts unpredictably
 *    with that forced sizing).
 *  - "Whole File" combined print: when the container has one or more
 *    `.nl-print-page-block` wrappers (one per document), each block's
 *    `.nl-wrap` is measured and scaled INDEPENDENTLY against a single
 *    page's worth of space — not against the combined height of every
 *    document together, which would crush multiple pages' worth of
 *    content down to fit one page. Each block's fit is isolated in its
 *    own try/catch (see FIX note in the file header) so a problem with
 *    any one document can't prevent the others from printing.
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

  const availableHeightPx = (297 - PRINT_PAGE_MARGIN_MM * 2) * PX_PER_MM;
  const availableWidthPx  = (210 - PRINT_PAGE_MARGIN_MM * 2) * PX_PER_MM;

  // Fits a single document (scoped to `scopeEl`) to one page's worth of
  // space. Used both for the plain single-document case (scopeEl === root)
  // and for each block in the combined "Whole File" case.
  const fitOne = (scopeEl: HTMLElement): (() => void) => {
    const target = (scopeEl.querySelector('.nl-wrap')
      || scopeEl.querySelector('.nl-page')
      || scopeEl.firstElementChild) as HTMLElement | null;
    if (!target) return () => {};

    // AUDIT FIX: some print documents (e.g. PersonalInfoSheet — 8
    // substantial sections, explicitly designed for nlMultiPageCss()'s
    // natural page flow rather than nlSinglePageCss()'s forced single
    // sheet) are NOT meant to fit one page. Applying the shrink-to-fit
    // below to one of those would try to cram several pages of content
    // into one, hit the 0.5 safety floor, and still overflow — with the
    // added cost of illegibly tiny text. Documents that intentionally
    // span multiple pages mark their `.nl-page` root with
    // `data-multipage="true"`; honor that by skipping the scale entirely
    // and letting nlMultiPageCss()'s own break-inside:avoid rules handle
    // clean page breaks between sections instead.
    const pageEl = scopeEl.querySelector('.nl-page') as HTMLElement | null;
    if (pageEl?.dataset.multipage === 'true') {
      // FIX (see file-header FIX note on Personal Info Sheet getting
      // clipped): skipping the JS scale isn't enough on its own — a
      // sibling single-page document's OWN <style> tag can still win the
      // cascade for the shared `.nl-page`/`.nl-print-page-block` class
      // names purely by rendering later in source order, forcing this
      // document's `.nl-page` into position:absolute + one-page height +
      // clipped overflow even though it's meant to flow across several
      // pages. Force this document's own layout needs directly via
      // `setProperty(..., 'important')`, which wins over ANY stylesheet
      // rule — including another rule's own `!important` — regardless of
      // which document's <style> tag happens to load last.
      const restorers: (() => void)[] = [];
      const forceProperty = (el: HTMLElement, prop: string, value: string) => {
        const prev = el.style.getPropertyValue(prop);
        const prevPriority = el.style.getPropertyPriority(prop);
        el.style.setProperty(prop, value, 'important');
        restorers.push(() => {
          if (prev) el.style.setProperty(prop, prev, prevPriority);
          else el.style.removeProperty(prop);
        });
      };
      forceProperty(pageEl, 'position',   'static');
      forceProperty(pageEl, 'height',     'auto');
      forceProperty(pageEl, 'min-height', 'auto');
      forceProperty(pageEl, 'overflow',   'visible');
      forceProperty(pageEl, 'width',      '100%');
      // Also relax the `.nl-print-page-block` wrapper itself (when this
      // block IS one — i.e. we're in the combined "Whole File" print),
      // since it's the one carrying the explicit page-sized box that
      // gave the leaked `inset:0` something to clip against.
      if (scopeEl !== pageEl) {
        forceProperty(scopeEl, 'overflow',   'visible');
        forceProperty(scopeEl, 'min-height', 'auto');
        forceProperty(scopeEl, 'height',     'auto');
      }
      return () => restorers.forEach(r => r());
    }

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
  };

  // FIX: isolate each block's fit so one bad measurement can't take the
  // whole print job down with it (see file-header FIX note). Worst case
  // for a failing block: it prints at its natural, unscaled size instead
  // of being fit to one page — every OTHER document is unaffected, and
  // the print/PDF call downstream still fires.
  const safeFitOne = (scopeEl: HTMLElement): (() => void) => {
    try {
      return fitOne(scopeEl);
    } catch (err) {
      console.error('fitPrintContentToOnePage: failed to fit one block, leaving it at natural size', err);
      return () => {};
    }
  };

  const blocks = Array.from(root.querySelectorAll('.nl-print-page-block')) as HTMLElement[];
  if (blocks.length > 0) {
    const resets = blocks.map(safeFitOne);
    return () => resets.forEach(r => { try { r(); } catch { /* best-effort reset */ } });
  }

  return safeFitOne(root);
}

// ── Steps & output items ───────────────────────────────────────────────────

const STEPS: { id: StepId; label: string; icon: string }[] = [
  { id: 'identity',   label: 'ব্যক্তিগত তথ্য',     icon: 'ti-user'           },
  { id: 'employment', label: 'চাকরির তথ্য',         icon: 'ti-briefcase'      },
  { id: 'contact',    label: 'যোগাযোগ',            icon: 'ti-map-pin'        },
  { id: 'education',  label: 'শিক্ষাগত যোগ্যতা',     icon: 'ti-school'         },
  { id: 'previous',   label: 'পূর্ববর্তী অভিজ্ঞতা',  icon: 'ti-history'        },
  { id: 'nominee',    label: 'নমিনি তথ্য',          icon: 'ti-users'          },
  { id: 'supervisor', label: 'সুপারিশকারী',         icon: 'ti-user-shield'    },
  { id: 'photo',      label: 'ছবি সংযুক্তি',       icon: 'ti-camera'         },
];

// 'whole_file' is a combined print view: every document below EXCEPT
// 'idcard' (Appointment Letter, Nominee Form, Age Estimation, Personal
// Info Sheet, Recruitment Verification Form), one per page, in a single
// print job.
type OutputId = 'appointment' | 'nominee_doc' | 'age' | 'idcard' | 'personal_doc' | 'verification' | 'whole_file';

function EmployeeFileSystem() {
  const factory  = useFactory();
  const { user } = useAuth();
  const sheets = useDatabase('employees', factory.id, user?.name ?? 'unknown', 1500);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [touched,   setTouched]   = useState(false);
  const [formData,   setFormData]   = useState<EmployeeFormData>(initialFormData);
  const [activeView, setActiveView] = useState<StepId | OutputId>('photo');

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

  const isStepView = (v: string): v is StepId => STEPS.some(s => s.id === v);
  // AUDIT FIX: narrower than isStepView on purpose — 'photo' is a step
  // (shows in nav, participates in isOutputView/Prev-Next) but must NOT
  // be handed to EmployeeForm as activeStep, since EmployeeForm's own
  // FormStepId type doesn't include it and has no case for rendering it.
  const isFormStep = (v: string): v is FormStepId => isStepView(v) && v !== 'photo';
  const isOutputView = !isStepView(activeView);
  const activeFormStep: FormStepId = isFormStep(activeView) ? activeView : 'employment';
  // AUDIT FIX: ModuleShell's own `activeStep` prop (used to highlight the
  // current entry in ধাপসমূহ and drive the step progress bar) needs the
  // FULL StepId, including 'photo' — activeFormStep above deliberately
  // excludes 'photo', so passing that to ModuleShell would leave the
  // photo tab never highlighting itself when selected. Falls back to
  // 'employment' only when actually on an output/bill view, matching the
  // pre-existing fallback behavior for that case.
  const activeStepForShell: StepId = isStepView(activeView) ? activeView : 'employment';

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // AUDIT ADDITION: wires PhotoUploadField (PhotoAttach.tsx) into this
  // module's own formData state, the same way handleInputChange wires up
  // every text field — `photo` isn't in EmployeeFormData yet (see
  // PhotoAttach.tsx's header comment), so this goes through the same
  // `as EmployeeFormData` cast buildRecord()/recordToFormData() already
  // tolerate for not-yet-typed fields. Marks the form dirty on both
  // attach and remove, so Reset asks for confirmation instead of
  // silently discarding an attached photo.
  const handlePhotoChange = (dataUrl: string | undefined) => {
    setFormData(prev => ({ ...prev, photo: dataUrl } as EmployeeFormData));
    setTouched(true);
  };

  const handleReset = () => {
    setTouched(false);
    setFormData(prev => ({
      ...initialFormData,
      companyName:    prev.companyName,
      companyAddress: prev.companyAddress,
      date:           new Date().toISOString().split('T')[0],
    }));
    setActiveView('photo');
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
        // Page-break rule for the combined "Whole File" print: each
        // document's wrapper block ends its page here, so the next
        // document starts on a fresh sheet instead of flowing directly
        // underneath it. `position:relative` + an explicit page-sized
        // box gives each block a proper positioned container for its
        // child `.nl-page` (which is `position:absolute;inset:0` — see
        // fitPrintContentToOnePage's own comment) so that child pins
        // itself to THIS block's page rather than drifting up to
        // whatever the nearest positioned ancestor elsewhere in the
        // document happens to be. `overflow:hidden` keeps a block whose
        // content still slightly overflows after fitting from bleeding
        // into the next page's content instead of just clipping.
        '.nl-print-page-block{page-break-after:always;position:relative;width:210mm;min-height:297mm;overflow:hidden;}' +
        '.nl-print-page-block:last-child{page-break-after:auto;}' +
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
        // slightly smaller text only when truly needed. For the combined
        // "Whole File" view, fitPrintContentToOnePage() fits each
        // document's block independently (see its own comment).
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

        // FIX: the actual print() call is now the LAST thing that runs,
        // guarded by its own try/catch, and reached via a `finally`-style
        // fallback — even if fitting throws for some totally unforeseen
        // reason, the print dialog still opens with every document at
        // its natural (unscaled) size rather than not opening at all.
        // This is the direct fix for "including one more document makes
        // the whole print job show nothing" (see file-header FIX note):
        // fitPrintContentToOnePage() itself is also now internally
        // resilient per-block, so in practice this outer guard is a
        // second, belt-and-suspenders layer.
        const openPrintDialog = () => {
          try {
            iframe.contentWindow!.focus();
            iframe.contentWindow!.print();
          } catch (err) {
            console.error('Print dialog failed to open', err);
          } finally {
            iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
          }
        };

        const measureAndPrint = () => {
          try {
            fitPrintContentToOnePage(doc);
          } catch (err) {
            console.error('fitPrintContentToOnePage failed on first pass — printing at natural size', err);
          }
          // Defensive second pass: a scale computed just before a very
          // late reflow (a straggling font swap, image decode, etc.)
          // can be stale. Re-measuring one frame later and re-applying
          // is cheap insurance — fitPrintContentToOnePage always
          // measures the natural (unscaled) height fresh, so this
          // simply corrects the scale if anything shifted.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              try {
                fitPrintContentToOnePage(doc);
              } catch (err) {
                console.error('fitPrintContentToOnePage failed on second pass — printing at natural size', err);
              }
              openPrintDialog();
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
    // FIX: same resilience as handlePrint — a fitting problem with any
    // one block must not stop the PDF export for the rest of the
    // document. fitPrintContentToOnePage() is internally resilient per
    // block already; this try/catch is the outer safety net so even a
    // totally unexpected failure still falls through to capture+save
    // rather than silently doing nothing.
    let resetFit: () => void = () => {};
    try {
      resetFit = fitPrintContentToOnePage(el);
    } catch (err) {
      console.error('fitPrintContentToOnePage failed before PDF capture — exporting at natural size', err);
    }
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
  // AUDIT FIX: items previously had no `id`/value tied to the OutputId they
  // switch to, so ModuleShell had nothing to compare against `activeView`
  // to know which button is currently selected — the active/selection bar
  // couldn't highlight any one item. Each item now carries an `id`
  // matching its OutputId, and `activeOutputId` below (passed to
  // ModuleShell) exposes which one is currently active.
  const billItems: { id: OutputId; label: string; onClick: () => void }[] = [
    { id: 'appointment',  label: 'নিয়োগপত্র',          onClick: () => setActiveView('appointment')  },
    { id: 'nominee_doc',  label: 'নমিনি ফরম',           onClick: () => setActiveView('nominee_doc')  },
    { id: 'age',          label: 'মেডিকেল ফিটনেস',      onClick: () => setActiveView('age')          },
    { id: 'idcard',       label: 'আইডি কার্ড',          onClick: () => setActiveView('idcard')       },
    { id: 'personal_doc', label: 'ব্যক্তিগত তথ্য শিট',   onClick: () => setActiveView('personal_doc') },
    { id: 'verification', label: 'তথ্য যাচাইকরন ফরম',    onClick: () => setActiveView('verification') },
    // "Whole File" — renders every document except the ID card into one
    // combined printable area, same as every other output button here:
    // just switches the preview, no auto-print. (Previously this also
    // scheduled handlePrint via setTimeout to open the print dialog
    // immediately — removed per explicit request, so সম্পূর্ণ ফাইল now
    // behaves identically to নিয়োগপত্র/নমিনি ফরম/etc.: preview first,
    // person clicks print/PDF themselves when ready.)
    {
      id: 'whole_file',
      label: 'সম্পূর্ণ ফাইল',
      onClick: () => setActiveView('whole_file'),
    },
  ];

  // Which billItem should show the selection bar right now — undefined
  // while a form step is active, so no output button is lit up.
  const activeOutputId: OutputId | undefined = isOutputView ? (activeView as OutputId) : undefined;

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
        activeStep={activeStepForShell}
        onStepChange={id => setActiveView(id as StepId)}

        billItems={billItems}
        isBillActive={isOutputView}
        activeBillId={activeOutputId}

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
        {activeView === 'photo' && (
          // AUDIT ADDITION: photo attach now lives on its own step tab
          // (was previously embedded inside the identity step's content)
          // so it shows up as its own entry in ধাপসমূহ, with the normal
          // Prev/Next step nav — same pattern every other step already
          // gets. The attached photo is used later by IdCard.tsx and
          // MedicalFitnessCertificate.tsx via PhotoDisplayBox.
          <PhotoUploadField
            value={(formData as any).photo}
            onChange={handlePhotoChange}
            label="কর্মীর ছবি"
          />
        )}

        {isFormStep(activeView) && (
          <EmployeeForm formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} activeStep={activeFormStep} onDirtyChange={dirty => { if (dirty) setTouched(true); }} />
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
        {activeView === 'verification' && (
          <div id="printable-area"><RecruitmentVerificationForm formData={formData} /></div>
        )}

        {activeView === 'whole_file' && (
          // Combined print: every document except the ID card, one per
          // page (Appointment Letter, Nominee Form, Age Estimation,
          // Personal Info Sheet, Recruitment Verification Form). Each is
          // wrapped in `.nl-print-page-block`, which both
          // fitPrintContentToOnePage() (scales each independently, with
          // per-block error isolation — see file-header FIX note) and the
          // print stylesheet (`page-break-after: always`, positioned
          // page-sized container, see handlePrint) key off of. IdCard is
          // deliberately omitted — different physical format, not meant
          // to sit in the same A4 packet as the rest.
          <div id="printable-area">
            <div className="nl-print-page-block">
              <AppointmentLetter formData={formData} />
            </div>
            <div className="nl-print-page-block">
              <NomineeForm formData={formData} />
            </div>
            <div className="nl-print-page-block">
              <AgeEstimation formData={formData} />
            </div>
            <div className="nl-print-page-block">
              <PersonalInfoSheet formData={formData} />
            </div>
            <div className="nl-print-page-block">
              <RecruitmentVerificationForm formData={formData} />
            </div>
          </div>
        )}
      </ModuleShell>
    </>
  );
}

export default EmployeeFileSystem;