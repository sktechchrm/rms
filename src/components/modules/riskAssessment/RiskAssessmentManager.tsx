// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentManager.tsx
// Path: src/components/modules/riskAssessment/RiskAssessmentManager.tsx
//
// Same structure as the Corrective Action Manager:
//   - Statement filters / sort are owned HERE; `filteredRecords` (shared
//     filterRiskEntries) feeds the Print Preview, PDF, Excel and a hidden print copy.
//   - Likelihood × Severity → riskLevel / riskScore are calculated when saving.
//   - PDF: direct A4-landscape download (row-safe pages, thin borders); Print: landscape.
//   - The header date is editable; it is the "Submission Date" on the print pages.
//   - PRINT PREVIEW has TWO pages: "তালিকা" (register) and "সেকশন চার্ট" (section-wise
//     risk bar chart). Print / PDF export only the page you are on.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import RiskAssessmentForm from './RiskAssessmentForm';
import RiskAssessmentStatement from './RiskAssessmentStatement';
import RiskAssessmentPrintView from './RiskAssessmentPrintView';
import RiskAssessmentChartPrintView from './RiskAssessmentChartPrintView';
import RiskAssessmentTeamPrintView from './RiskAssessmentTeamPrintView';
import { exportRiskExcel } from './riskExcel';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { RiskAssessmentData, RiskFilters } from './types';
import {
  blankRiskAssessment, EMPTY_RISK_FILTERS, buildRiskEntries, filterRiskEntries,
  parseScale, levelFromScore, normalizeLevel, todayIso,
} from './types';

const STEPS = [
  { id: 'form', label: 'ঝুঁকি এন্ট্রি', icon: 'ti-alert-triangle', fieldCount: 4 },
];

type Step = 'form' | 'tracking' | 'printList' | 'printChart' | 'printTeam';

function recordToFormData(rec: Record<string, unknown>, prev: RiskAssessmentData): RiskAssessmentData {
  const str = (k: string) => String(rec[k] ?? '');
  return {
    ...prev,
    section:                      str('section'),
    source:                       str('source'),
    riskIdentification:           str('riskIdentification'),
    impact:                       str('impact'),
    remedy:                       str('remedy'),
    causeInvestigation:           str('causeInvestigation'),
    likelihood:                   String(parseScale(rec.likelihood) ?? ''),
    severity:                     String(parseScale(rec.severity) ?? ''),
    riskLevel:                    normalizeLevel(rec.riskLevel),
    correctiveAction:             str('correctiveAction'),
    correctiveActionDate:         rec.correctiveActionDate ? toDateInput(rec.correctiveActionDate) || '' : '',
    responsiblePersonName:        str('responsiblePersonName'),
    responsiblePersonDesignation: str('responsiblePersonDesignation'),
    remarks:                      str('remarks'),
    date:                         rec.date ? toDateInput(rec.date) || prev.date : prev.date,
  };
}

export default function RiskAssessmentManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('riskassessment', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<Step>('form');
  const [data,          setData]          = useState<RiskAssessmentData>(blankRiskAssessment());
  const [filters,       setFilters]       = useState<RiskFilters>(EMPTY_RISK_FILTERS);
  const [submissionDate, setSubmissionDate] = useState(todayIso());   // ISO yyyy-mm-dd

  // Currently filtered + sorted list — single source for Statement print, Print Preview, PDF and Excel.
  const filteredRecords = useMemo(
    () => filterRiskEntries(buildRiskEntries(sheets.records), filters).map(e => e.rec),
    [sheets.records, filters],
  );

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankRiskAssessment(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep('form');
    sheets.setEditingId(null);
  };

  // File / print-job name: the chart page gets its own suffix.
  const fileBase = () => `RiskAssessment${activeStep === 'printChart' ? '_Chart' : activeStep === 'printTeam' ? '_Team' : ''}_${todayIso()}`;
  
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
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase()}</title>
      <style>@page{size:A4 landscape;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
    };
  };

  // Direct landscape PDF — row-safe pages, thin print-style borders.
  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({
      element: el,
      filename: fileBase(),
      orientation: 'landscape',
      scale: 3,
      rowSafeBreaks: true,
      printStyle: true,
    });
  };

  const buildRecord = () => {
    const l = parseScale(data.likelihood);
    const s = parseScale(data.severity);
    const score = l && s ? l * s : null;
    return {
      section:                      data.section,
      source:                       data.source,
      riskIdentification:           data.riskIdentification,
      impact:                       data.impact,
      remedy:                       data.remedy,
      causeInvestigation:           data.causeInvestigation,
      likelihood:                   l ? String(l) : '',
      severity:                     s ? String(s) : '',
      riskScore:                    score ? String(score) : '',
      riskLevel:                    score ? levelFromScore(score) : '',
      correctiveAction:             data.correctiveAction,
      correctiveActionDate:         data.correctiveActionDate,
      responsiblePersonName:        data.responsiblePersonName,
      responsiblePersonDesignation: data.responsiblePersonDesignation,
      remarks:                      data.remarks,
      date:                         data.date,
      preparedBy:                   authorization.preparedBy,
      preparedByDesignation:        authorization.preparedByDesignation,
    };
  };

  const billItems = [
    { id: 'tracking',   label: 'স্টেটমেন্ট (তালিকা)',          onClick: () => setActiveStep('tracking') },
    { id: 'printList',  label: 'প্রিন্ট প্রিভিউ — তালিকা',      onClick: () => setActiveStep('printList') },
    { id: 'printChart', label: 'প্রিন্ট প্রিভিউ — সেকশন চার্ট', onClick: () => setActiveStep('printChart') },
    { id: 'printTeam',  label: 'প্রিন্ট প্রিভিউ — দলীয় রিপোর্ট',  onClick: () => setActiveStep('printTeam') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'printList' || activeStep === 'printChart' || activeStep === 'printTeam';

  const l = parseScale(data.likelihood);
  const s = parseScale(data.severity);
  const level = l && s ? levelFromScore(l * s) : '';
  const handleExportExcel = () => exportRiskExcel(filteredRecords, `RiskAssessment_${todayIso()}`);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        @media print {
          .ra-print-offscreen { position: static !important; left: auto !important; width: auto !important; }
        }
      `}</style>

      <ModuleShell
        moduleName="ঝুঁকি মূল্যায়ন"
        moduleNameEn="Risk Assessment"
        date={submissionDate}
        onDateChange={d => setSubmissionDate(d || todayIso())}

        steps={STEPS}
        activeStep={activeStep === 'form' ? 'form' : ''}
        onStepChange={id => setActiveStep(id as Step)}

        billItems={billItems}
        isBillActive={isBillActive}
        activeBillId={isBillActive ? activeStep : null}
        hideBillHeading

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
        saveDisabled={!data.section.trim() || !data.riskIdentification.trim() || !l || !s}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="riskassessment"
        updateLabel="ঝুঁকি এন্ট্রি খুঁজুন"
        updateSearchPlaceholder="সেকশন বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'সেকশন',        value: data.section || '—' },
          { label: 'ঝুঁকির উৎস',   value: data.source || '—' },
          { label: 'ঝুঁকির মাত্রা', value: l && s ? `${l * s} (${level})` : '—' },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec as Record<string, unknown>, p));
          setActiveStep('form');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={sheets.remove}
        onReload={sheets.reload}
        recordLabel={rec => String(rec.section ?? rec.id ?? '—')}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExportExcel}
        lang="bn"
      >
        {activeStep === 'form' && (
          <RiskAssessmentForm
            data={data}
            setData={setData}
            savedSections={sheets.records.map(r => String(r.section ?? ''))}
          />
        )}

        {activeStep === 'tracking' && (
          <RiskAssessmentStatement
            records={sheets.records}
            filters={filters}
            onFiltersChange={setFilters}
            onExportExcel={() => exportRiskExcel(filteredRecords, `RiskAssessment_${todayIso()}`)}
            onEdit={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onDelete={(id: string) => { sheets.remove(id); }}
          />
        )}

        {/* Hidden print copy so the header Print / PDF buttons work from the Statement. */}
        {activeStep === 'tracking' && (
          <div
            className="ra-print-offscreen"
            aria-hidden="true"
            style={{ position: 'absolute', left: -10000, top: 0, width: '297mm', pointerEvents: 'none' }}
          >
            <div id="printable-area" ref={printAreaRef}>
              <RiskAssessmentPrintView
                records={filteredRecords}
                factoryName={data.factoryName}
                factoryAddress={data.factoryAddress}
                authorization={authorization}
                submissionDate={submissionDate}
              />
            </div>
          </div>
        )}

        {/* Print Preview — two pages: register (তালিকা) and section-wise chart */}
        {(activeStep === 'printList' || activeStep === 'printChart' || activeStep === 'printTeam') && (
          <div id="printable-area" ref={printAreaRef}>
            {activeStep === 'printChart' ? (
              <RiskAssessmentChartPrintView
                records={filteredRecords}
                factoryName={data.factoryName}
                factoryAddress={data.factoryAddress}
                authorization={authorization}
                submissionDate={submissionDate}
              />
            ) : activeStep === 'printTeam' ? (
              <RiskAssessmentTeamPrintView
                records={filteredRecords}
                factoryName={data.factoryName}
                factoryAddress={data.factoryAddress}
                authorization={authorization}
                submissionDate={submissionDate}
              />
            ) : (
              <RiskAssessmentPrintView
                records={filteredRecords}
                factoryName={data.factoryName}
                factoryAddress={data.factoryAddress}
                authorization={authorization}
                submissionDate={submissionDate}
              />
            )}
          </div>
        )}
      </ModuleShell>
    </>
  );
}