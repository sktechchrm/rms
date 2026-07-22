// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryActionManager.tsx — REBUILT (7th round): "প্রক্রিয়া দেখুন"
// moved from a standalone bordered button above the form content into the
// ফলাফল (billItems) sidebar itself, as a plain text item matching নোটিশ
// ১/২/৩ etc.'s own style, per explicit request. It's unconditional
// (always shown) since it's a read-only reference view, not tied to any
// notice's readiness — opens DisciplinaryProcessFlow.tsx as a full-screen
// overlay, a single-glance printable summary of all 6 steps, their
// outputs, and the জবাবের অবস্থা decision branch. Doesn't touch `data` or
// navigation state, so it can be opened/closed at any point in the
// workflow without losing in-progress form data.
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
      <style>@page{size:A4 portrait;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    iframe.onload = () => {
      const fonts = (doc as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts;
      const doPrint = () => {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
        iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
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
    // "প্রক্রিয়া দেখুন" — moved here (plain text item, matching নোটিশ
    // ১/২/৩ etc.'s own style) from a separate bordered button above the
    // form content, per explicit request. Unconditional (always shown)
    // since it's a read-only reference view, not tied to any notice's
    // readiness.
    items.push({ label: 'প্রক্রিয়া দেখুন', onClick: () => setShowProcessFlow(true) });
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice1Ready, notice2Ready, notice3Ready, evaluationReady, notice4Ready]);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}

        .da-flow-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #fff; color: #1e3a5f;
          border: 1.5px solid #1e3a5f; border-radius: 8px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
        }
        .da-flow-btn:hover { background: #eff6ff; }

        .da-flow-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(15, 23, 42, 0.55);
          display: flex; align-items: flex-start; justify-content: center;
          overflow-y: auto; padding: 32px 16px;
        }
        .da-flow-panel {
          position: relative; width: 100%; max-width: 850px;
        }
        .da-flow-toolbar { display: flex; justify-content: flex-end; margin-bottom: 10px; }
        .da-flow-close {
          position: fixed; top: 20px; right: 24px; z-index: 1001;
          width: 34px; height: 34px; border-radius: 50%;
          border: 1px solid #e2e8f0; background: #fff; color: #475569;
          font-size: 16px; font-weight: 700; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .da-flow-close:hover { background: #f1f5f9; }
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
          <button
            type="button"
            className="da-flow-close"
            onClick={() => setShowProcessFlow(false)}
            aria-label="বন্ধ করুন"
          >
            ✕
          </button>
          <div className="da-flow-panel" onClick={e => e.stopPropagation()}>
            <div className="da-flow-toolbar">
              <button type="button" className="da-flow-btn" onClick={() => handlePrint('process-flow-print-area')}>
                🖨 প্রিন্ট করুন
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