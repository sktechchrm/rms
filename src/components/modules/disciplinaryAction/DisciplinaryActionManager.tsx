// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryActionManager.tsx — REBUILT (9th round): print-view standard
// pass — removed duplicated .da-flow-panel/.da-flow-toolbar CSS blocks and
// the unused .da-flow-close-fixed rule left over from an earlier layout
// (Close/Print now live inside the panel's own sticky toolbar, not
// viewport-fixed). Added fitPrintWrapToOnePage(), the same measure-then-
// scale pattern used elsewhere in this app (EmployeeFileSystem.tsx's
// fitPrintContentToOnePage) — every printed view here (notices 1-4,
// evaluation, and the process-flow) has dynamic height, so a fixed
// compact CSS alone can't guarantee single-page fit; this measures the
// actual rendered height inside the print iframe and shrinks only if it
// overflows one A4 page.
//
// FIX (multi-page pagination): fitPrintWrapToOnePage() previously always
// tried to scale ANY overflowing content down to fit exactly one page
// (floor 0.55×). That's fine for content that's only slightly over, but
// for genuinely long content — e.g. the evaluation output (প্রতিবেদন ও
// সুপারিশ) with several witness statements + recommendation + committee
// signatures — squeezing it to 55% is either illegible or, once content
// is long enough, STILL doesn't fit on one page. The result was a
// half-empty page 1 (cut off wherever the forced fit gave up) and a
// mostly-empty page 2. Now the function only engages when content is
// within ~15% of one page's height; past that it leaves scale at 1 and
// lets the content flow across multiple pages naturally, relying on the
// break-avoid rules added to DisciplinaryNoticeLetter.tsx's print CSS
// (.nl-para / .nl-eval-section / .nl-eval-label / .nl-committee-sig-row)
// to keep logical chunks from splitting awkwardly at the page boundary.
// The safety floor was also raised from 0.55 to 0.85 since it's now only
// ever used for a "just barely over" nudge, not a last-resort squeeze.
// Also: the inline @page margin fallback here was updated from 12mm to
// a uniform 15mm to match DisciplinaryNoticeLetter.tsx's own @page rule
// (which wins in practice since it's injected after this one, but kept
// consistent to avoid confusion for anyone reading this file alone).
//
// CARRIED FORWARD (7th/8th rounds): "প্রক্রিয়া দেখুন" lives in the ফলাফল
// (billItems) sidebar as a plain text item, unconditional (always shown)
// since it's a read-only reference view — opens DisciplinaryProcessFlow.tsx
// as a full-screen overlay. Close/Print are icon-only, fixed 36x36px.
// Path: src/components/modules/disciplinaryAction/DisciplinaryActionManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import ModuleShell from '../../shell/ModuleShell';
import ShowCauseForm from './ShowCauseForm';
import ReplyStatusForm from './ReplyStatusForm';
import RepresentativeNominationForm from './RepresentativeNominationForm';
import InvestigationCommitteeForm from './InvestigationCommitteeForm';
import EvaluationForm from './EvaluationForm';
import FinalDecisionForm from './FinalDecisionForm';
import { DisciplinaryNoticeLetter } from './DisciplinaryNoticeLetter';
import { DisciplinaryProcessFlow } from './DisciplinaryProcessFlow';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import type { DisciplinaryActionData, ReplyStatus, CommitteeMember, NoticeSubject } from './types';
import { blankDisciplinaryActionData, SUBJECT_OPTIONS, generateReferenceNo } from './types';

const STEPS = [
  { id: 'showCause',      label: 'কারণ দর্শানো',        icon: 'ti-alert-triangle' },
  { id: 'reply',          label: 'জবাব ও অবস্থা',        icon: 'ti-message-circle' },
  { id: 'nomination',     label: 'প্রতিনিধি মনোনয়ন',     icon: 'ti-users-group' },
  { id: 'committee',      label: 'তদন্ত কমিটি',          icon: 'ti-users' },
  { id: 'evaluation',     label: 'মূল্যায়ন',             icon: 'ti-file-report' },
  { id: 'finalDecision',  label: 'চূড়ান্ত সিদ্ধান্ত',      icon: 'ti-gavel' },
];

// ── Print single-page fit ─────────────────────────────────────────────
// Measures the ACTUAL rendered height of a print view (.nl-wrap for
// notices, .pf-wrap for the process flow) inside the print iframe and,
// only if it's JUST barely over one A4 page, applies a small uniform
// shrink so a stray line or two doesn't spill onto its own near-empty
// second page.
const PRINT_PAGE_MARGIN_MM = 15;
const PX_PER_MM = 96 / 25.4;
// Only shrink-to-fit within this margin above one page's height. Content
// genuinely longer than this (e.g. a long evaluation report with several
// witness statements) is left at scale 1 and allowed to flow across
// multiple pages naturally — see the comment above fitPrintWrapToOnePage
// for why forcing a single-page squeeze on that content backfires.
const NEAR_ONE_PAGE_THRESHOLD = 1.15;

function fitPrintWrapToOnePage(doc: Document): void {
  const target = doc.querySelector('.pf-wrap, .nl-wrap') as HTMLElement | null;
  if (!target) return;

  const availableHeightPx = (297 - PRINT_PAGE_MARGIN_MM * 2) * PX_PER_MM;
  const availableWidthPx  = (210 - PRINT_PAGE_MARGIN_MM * 2) * PX_PER_MM;
  const naturalHeight = target.scrollHeight;
  const naturalWidth  = target.scrollWidth;

  // Genuinely multi-page content: skip scaling entirely and let it flow
  // across pages naturally (break-avoid rules in the notice's own print
  // CSS handle where it breaks).
  if (naturalHeight > availableHeightPx * NEAR_ONE_PAGE_THRESHOLD) return;

  const heightRatio = naturalHeight > availableHeightPx ? availableHeightPx / naturalHeight : 1;
  const widthRatio  = naturalWidth  > availableWidthPx  ? availableWidthPx  / naturalWidth  : 1;
  // Safety floor — now only ever applied to a "just barely over one
  // page" nudge, so a small shrink (never below 85%) is enough and
  // stays comfortably legible.
  const scale = Math.max(0.85, Math.min(heightRatio, widthRatio));

  if (scale < 1) {
    target.style.transform = `scale(${scale})`;
    target.style.transformOrigin = 'top center';
  }
}

function recordToFormData(rec: Record<string, unknown>, prev: DisciplinaryActionData): DisciplinaryActionData {
  return {
    ...prev,
    referenceNo:   String(rec.referenceNo ?? ''),
    employeeName:  String(rec.employeeName ?? ''),
    cardNo:        String(rec.cardNo ?? ''),
    designation:   String(rec.designation ?? ''),
    section:       String(rec.section ?? ''),
    joiningDate:   toDateInput(rec.joiningDate) || '',
    showCauseDate: toDateInput(rec.showCauseDate) || '',
    subject:       (SUBJECT_OPTIONS.includes(rec.subject as NoticeSubject) ? rec.subject : 'কারণ দর্শানোর নোটিশ।') as NoticeSubject,
    complaint:     String(rec.complaint ?? ''),
    replyDate:     toDateInput(rec.replyDate) || '',
    replyStatus:   (rec.replyStatus === 'সন্তোষজনক' || rec.replyStatus === 'অসন্তোষজনক' ? rec.replyStatus : '') as ReplyStatus,
    numberOfCommitteeMembers: String(rec.numberOfCommitteeMembers ?? ''),
    notice2Date:   toDateInput(rec.notice2Date) || '',
    committeeMembers: (() => {
      try {
        const parsed = JSON.parse(String(rec.committeeMembersJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.committeeMembers;
        return parsed.map((m, i): CommitteeMember => ({
          slNo:        Number(m.slNo ?? i + 1),
          name:        String(m.name ?? ''),
          cardNo:      String(m.cardNo ?? ''),
          designation: String(m.designation ?? ''),
          section:     String(m.section ?? ''),
        }));
      } catch { return prev.committeeMembers; }
    })(),
    notice3Date:   toDateInput(rec.notice3Date) || '',
    investigationReportSummary: String(rec.investigationReportSummary ?? ''),
    recommendation:             String(rec.recommendation ?? ''),
    finalDecision:               String(rec.finalDecision ?? ''),
    evaluationDate:              toDateInput(rec.evaluationDate) || '',
    date: toDateInput(rec.date) || prev.date,
  };
}

export default function DisciplinaryActionManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('disciplinaryactions', factory.id, user?.name ?? 'unknown', 1500);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<string>('showCause');
  const [showPrint,     setShowPrint]     = useState(false);
  const [data,          setData]          = useState<DisciplinaryActionData>(blankDisciplinaryActionData());
  const [printingNotice, setPrintingNotice] = useState<1 | 2 | 3 | 4 | 'evaluation'>(1);
  // Read-only "প্রক্রিয়া দেখুন" overlay — independent of activeStep/showPrint
  // so it can be opened from anywhere without disturbing in-progress work.
  const [showProcessFlow, setShowProcessFlow] = useState(false);

  const festivalHolidays = factory.festivalHolidays ?? [];

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  // সূত্র নং — dynamically generated once, when the employee/complaint are
  // first filled in (not regenerated on every keystroke — once assigned,
  // it stays fixed for this record, matching how a real memo number would
  // behave). Re-generation only happens for genuinely NEW records; loaded/
  // edited records keep whatever সূত্র নং they were saved with.
  useEffect(() => {
    if (sheets.editingId) return; // don't touch an existing record's number
    if (data.referenceNo) return; // already assigned for this new record
    if (!data.employeeName || !data.complaint) return; // not enough to justify assigning yet
    const year = String(new Date().getFullYear());
    const existingThisYear = sheets.records.filter(r => String(r.date ?? '').startsWith(year.slice(0, 4))).length;
    const code = factory.referenceCode || '';
    setData(prev => ({ ...prev, referenceNo: generateReferenceNo(code, existingThisYear, toBanglaNumber(year)) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.employeeName, data.complaint, sheets.editingId]);

  // Close the process-flow overlay with Escape, same convention as most
  // modal/overlay UI in the app.
  useEffect(() => {
    if (!showProcessFlow) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowProcessFlow(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showProcessFlow]);

  const handleReset = () => {
    setData(prev => ({ ...blankDisciplinaryActionData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep('showCause');
    setShowPrint(false);
    sheets.setEditingId(null);
  };

  const handlePrint = (targetId?: string) => {
    const el = (targetId ? document.getElementById(targetId) : null)
      ?? printAreaRef.current
      ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) { window.print(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.styleSheets)
      .map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 portrait;margin:15mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    iframe.onload = () => {
      const fonts = (doc as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts;
      const doPrint = () => {
        // Measure actual rendered content and shrink to fit one A4 page
        // if it overflows — applied right before print(), and again one
        // frame later as a defensive re-check in case a late font swap
        // or reflow shifted the natural height after the first measure.
        fitPrintWrapToOnePage(doc);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            fitPrintWrapToOnePage(doc);
            iframe.contentWindow!.focus();
            iframe.contentWindow!.print();
            iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
          });
        });
      };
      // Wait for Noto Sans Bengali to actually finish loading before
      // printing — printing immediately can capture a fallback font on
      // the first print of a session (font not yet fetched).
      if (fonts?.ready) {
        fonts.ready.then(() => setTimeout(doPrint, 150)).catch(() => setTimeout(doPrint, 200));
      } else {
        setTimeout(doPrint, 300);
      }
    };
  };

  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({ element: el, filename: `শৃঙ্খলামূলক_ব্যবস্থা_${printingNotice}_${data.employeeName.replace(/[^a-z0-9]/gi, '_') || 'রেকর্ড'}`, scale: 2 });
  };

  const buildRecord = () => ({
    referenceNo:               data.referenceNo,
    employeeName:              data.employeeName,
    cardNo:                    data.cardNo,
    designation:               data.designation,
    section:                   data.section,
    joiningDate:               data.joiningDate,
    showCauseDate:             data.showCauseDate,
    subject:                   data.subject,
    complaint:                 data.complaint,
    replyDate:                 data.replyDate,
    replyStatus:               data.replyStatus,
    numberOfCommitteeMembers:  data.numberOfCommitteeMembers,
    notice2Date:               data.notice2Date,
    committeeMembersJson:      JSON.stringify(data.committeeMembers),
    notice3Date:               data.notice3Date,
    investigationReportSummary: data.investigationReportSummary,
    recommendation:             data.recommendation,
    finalDecision:               data.finalDecision,
    evaluationDate:              data.evaluationDate,
    date:                        data.date,
    preparedBy:                  authorization.preparedBy,
    preparedByDesignation:       authorization.preparedByDesignation,
  });

  const handleGenerateNotice = (notice: 1 | 2 | 3 | 4 | 'evaluation') => {
    setPrintingNotice(notice);
    setShowPrint(true);
  };

  // ── Dynamic ফলাফল: a notice only appears once its own required fields
  // are actually filled in — not always all 3 (+evaluation, +notice 4)
  // regardless of readiness.
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const notice1Ready = !!(data.employeeName && data.cardNo && data.complaint && data.showCauseDate);
  const notice2Ready = memberCount > 0 && !!data.notice2Date;
  const notice3Ready = data.committeeMembers.length === memberCount && memberCount > 0
    && data.committeeMembers.every(m => m.name.trim() !== '') && !!data.notice3Date;
  const evaluationReady = !!(data.investigationReportSummary && data.recommendation && data.evaluationDate);
  // Notice 4 (চূড়ান্ত সিদ্ধান্ত অবহিতকরণ) needs a decided finalDecision;
  // its date is auto-derived from evaluationDate, so evaluationDate must
  // also be set for that date to be computable.
  const notice4Ready = !!(data.finalDecision && data.evaluationDate);

  const billItems = useMemo(() => {
    const items: { label: string; onClick: () => void }[] = [];
    if (notice1Ready)    items.push({ label: 'নোটিশ ১', onClick: () => handleGenerateNotice(1) });
    if (notice2Ready)    items.push({ label: 'নোটিশ ২', onClick: () => handleGenerateNotice(2) });
    if (notice3Ready)    items.push({ label: 'নোটিশ ৩', onClick: () => handleGenerateNotice(3) });
    if (evaluationReady) items.push({ label: 'প্রতিবেদন ও সুপারিশ', onClick: () => handleGenerateNotice('evaluation') });
    if (notice4Ready)    items.push({ label: 'নোটিশ ৪', onClick: () => handleGenerateNotice(4) });
    // "প্রক্রিয়া দেখুন" — plain text item, matching নোটিশ ১/২/৩ etc.'s own
    // style. Unconditional (always shown) since it's a read-only
    // reference view, not tied to any notice's readiness.
    items.push({ label: 'প্রক্রিয়া দেখুন', onClick: () => setShowProcessFlow(true) });
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice1Ready, notice2Ready, notice3Ready, evaluationReady, notice4Ready]);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}

        /* Icon-only buttons for the process-flow overlay — fixed
           square size so text length never causes overflow, unlike
           label+icon buttons which could wrap/overflow their container
           on narrow viewports. */
        .da-flow-icon-btn {
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; width: 36px; height: 36px;
          background: #fff; color: #1e3a5f;
          border: 1.5px solid #1e3a5f; border-radius: 8px;
          font-size: 15px; cursor: pointer;
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
        }
        .da-flow-icon-btn:hover { background: #eff6ff; }

        .da-flow-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(15, 23, 42, 0.55);
          display: flex; align-items: flex-start; justify-content: center;
          overflow-y: auto; padding: 32px 16px;
        }
        .da-flow-panel {
          position: relative; width: 100%; max-width: 850px;
        }
        /* Sticky toolbar INSIDE the panel — stays pinned to the top of
           the scrollable overlay as the user scrolls the long flowchart,
           without ever leaving the overlay's own bounds (fixes an
           earlier overlap with the app's top navbar when Close was
           position:fixed against the whole viewport). */
        .da-flow-toolbar {
          position: sticky; top: 0; z-index: 5;
          display: flex; justify-content: flex-end; gap: 8px;
          margin-bottom: 10px; padding: 4px 0;
        }
      `}</style>

      <ModuleShell
        moduleName="শৃঙ্খলামূলক ব্যবস্থা"
        moduleNameEn="Disciplinary Action"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={showPrint ? '' : activeStep}
        onStepChange={id => { setShowPrint(false); setActiveStep(id); }}

        billItems={billItems}
        isBillActive={showPrint}

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
        saveDisabled={!data.employeeName || !data.cardNo}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('showCause');
          setShowPrint(false);
        }}
        updateModule="disciplinaryactions"
        updateLabel="শৃঙ্খলামূলক ব্যবস্থা খুঁজুন"
        updateSearchPlaceholder="কর্মীর নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'কর্মী',       value: data.employeeName || '—' },
          { label: 'জবাবের অবস্থা', value: data.replyStatus || '—' },
          { label: 'কমিটি সদস্য',   value: data.replyStatus === 'অসন্তোষজনক' ? `${data.numberOfCommitteeMembers || 0} জন` : '—' },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec as Record<string, unknown>, p));
          setActiveStep('showCause');
          setShowPrint(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={sheets.remove}
        onReload={sheets.reload}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        lang="bn"
      >
        {!showPrint && activeStep === 'showCause' && (
          <ShowCauseForm data={data} setData={setData} onGenerateNotice={() => handleGenerateNotice(1)} />
        )}

        {!showPrint && activeStep === 'reply' && (
          <ReplyStatusForm data={data} setData={setData} />
        )}

        {!showPrint && activeStep === 'nomination' && (
          <RepresentativeNominationForm data={data} setData={setData} onGenerateNotice={() => handleGenerateNotice(2)} />
        )}

        {!showPrint && activeStep === 'committee' && (
          <InvestigationCommitteeForm
            data={data}
            setData={setData}
            festivalHolidays={festivalHolidays}
            onGenerateNotice={() => handleGenerateNotice(3)}
          />
        )}

        {!showPrint && activeStep === 'evaluation' && (
          <EvaluationForm
            data={data}
            setData={setData}
            onGenerateOutput={() => handleGenerateNotice('evaluation')}
          />
        )}

        {!showPrint && activeStep === 'finalDecision' && (
          <FinalDecisionForm
            data={data}
            setData={setData}
            festivalHolidays={festivalHolidays}
            onGenerateNotice4={() => handleGenerateNotice(4)}
          />
        )}

        {showPrint && (
          <div id="printable-area" ref={printAreaRef}>
            <DisciplinaryNoticeLetter data={data} notice={printingNotice} authorization={authorization} festivalHolidays={festivalHolidays} />
          </div>
        )}
      </ModuleShell>

      {/* ══ প্রক্রিয়া দেখুন — read-only overlay, doesn't affect activeStep/data ══ */}
      {showProcessFlow && (
        <div className="da-flow-overlay" onClick={() => setShowProcessFlow(false)}>
          <div className="da-flow-panel" onClick={e => e.stopPropagation()}>
            <div className="da-flow-toolbar">
              <button
                type="button"
                className="da-flow-icon-btn"
                onClick={() => handlePrint('process-flow-print-area')}
                title="প্রিন্ট করুন"
                aria-label="প্রিন্ট করুন"
              >
                🖨
              </button>
              <button
                type="button"
                className="da-flow-icon-btn"
                onClick={() => setShowProcessFlow(false)}
                title="বন্ধ করুন"
                aria-label="বন্ধ করুন"
              >
                ✕
              </button>
            </div>
            <div id="process-flow-print-area">
              <DisciplinaryProcessFlow data={data} festivalHolidays={festivalHolidays} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}