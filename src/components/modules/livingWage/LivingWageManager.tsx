// ─────────────────────────────────────────────────────────────────────────────
// LivingWageManager.tsx — "Living Wage Assessment & Gap Management" (Anker structure)
// Path: src/components/modules/livingWage/LivingWageManager.tsx
//
// Steps: জরিপ ও তথ্য সংগ্রহ → লিভিং ওয়েজ নির্ধারণ → মজুরি ব্যবধান বিশ্লেষণ →
//        ব্যবস্থাপনা পর্যালোচনা → কর্মপরিকল্পনা ও অঙ্গীকার.
// Outputs: গণনা শিট, মজুরি ব্যবধান রিপোর্ট, কর্মপরিকল্পনা রিপোর্ট, ফাঁকা সার্ভে ফরম (portrait).
// The wage gap compares the living wage with Employees or the custom Workers list.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import ModuleShell from '../../shell/ModuleShell';
import LivingWageForm from './LivingWageForm';
import IndividualSurveyForm from './IndividualSurveyForm';
import WageGapReport from './WageGapReport';
import WorkersManager from './WorkersManager';
import LivingWagePrintView from './LivingWagePrintView';
import SurveyFormPrintView from './SurveyFormPrintView';
import ManagementReviewForm from './ManagementReviewForm';
import CorrectiveActionForm from './CorrectiveActionForm';
import { exportLivingWageExcel } from './livingWageExcel';
import { saveWorkersBatch } from './workersApi';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';
import type { LivingWageData, LivingWageMethod, GapFilters } from './types';
import {
  blankLivingWageData, EMPTY_GAP_FILTERS, computeLivingWage, buildGapEntries, filterGapEntries, describeGap, datasetLabel,
  parseAmount, parseSurveys, parseActions, parseReview, parseCommitment, parseSettings, fmt, money, formatDMY, todayIso,
} from './types';
import { FORM_CSS, toolBtn, font } from './ui';

const STEPS = [
  { id: 'survey',      label: 'জরিপ ও তথ্য সংগ্রহ',          icon: 'ti-clipboard-list', fieldCount: 3 },
  { id: 'calculation', label: 'লিভিং ওয়েজ নির্ধারণ',         icon: 'ti-scale',          fieldCount: 4 },
  { id: 'gapAnalysis', label: 'মজুরি ব্যবধান বিশ্লেষণ',       icon: 'ti-chart-bar',      fieldCount: 1 },
  { id: 'review',      label: 'ব্যবস্থাপনা পর্যালোচনা',        icon: 'ti-checkup-list',   fieldCount: 3 },
  { id: 'action',      label: 'কর্মপরিকল্পনা ও অঙ্গীকার',      icon: 'ti-list-check',     fieldCount: 2 },
];
type View = 'survey' | 'calculation' | 'gapAnalysis' | 'review' | 'action' | 'printCalc' | 'printGap' | 'printPlan' | 'printForm';

function recordToFormData(rec: Record<string, unknown>, prev: LivingWageData): LivingWageData {
  const str = (k: string, d = '') => String(rec[k] ?? d);
  const hasManual = ['foodCost', 'housingCost'].some(k => String(rec[k] ?? '').trim() !== '');
  return {
    ...prev,
    method: (rec.method === 'calculator' ? 'calculator' : 'benchmark') as LivingWageMethod,
    location: str('location', prev.location), studyYear: str('studyYear', prev.studyYear),
    sourceReference: str('sourceReference'), benchmarkAmount: str('benchmarkAmount'),
    foodCost: str('foodCost'), housingCost: str('housingCost'), utilitiesCost: str('utilitiesCost'), healthcareCost: str('healthcareCost'),
    educationCost: str('educationCost'), transportCost: str('transportCost'), clothingCost: str('clothingCost'),
    communicationCost: str('communicationCost'), otherEssentialCost: str('otherEssentialCost'),
    contingencyMarginPercent: str('contingencyMarginPercent', '5'), familySize: str('familySize', '4'),
    workersPerFamily: str('workersPerFamily', '1.58'), payrollDeductionPercent: str('payrollDeductionPercent', '0'),
    ...parseSettings(rec.calcSettingsJson, hasManual),
    surveys: parseSurveys(rec.surveysJson),
    managementReview: parseReview(rec.managementReviewJson),
    correctiveActions: parseActions(rec.correctiveActionsJson),
    commitment: parseCommitment(rec.commitmentJson),
    date: rec.date ? toDateInput(rec.date) || prev.date : prev.date,
  };
}

export default function LivingWageManager() {
  const factory  = useFactory();
  const { user } = useAuth();
  const userName = user?.name ?? 'unknown';

  const sheets         = useDatabase('livingwage', factory.id, userName);
  const employeeSheets = useDatabase('employees', factory.id, userName, 2000);
  const workerSheets   = useDatabase('workers', factory.id, userName, 2000);
  const printAreaRef   = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [view, setView]             = useState<View>('survey');
  const [data, setData]             = useState<LivingWageData>(blankLivingWageData());
  const [gapFilters, setGapFilters] = useState<GapFilters>(EMPTY_GAP_FILTERS);
  const [formCopies, setFormCopies] = useState(1);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const calc       = useMemo(() => computeLivingWage(data), [data]);
  const useWorkers = data.gapDataset === 'workers';
  const wageRecords = useWorkers ? workerSheets.records : employeeSheets.records;
  const wageLoading = useWorkers ? workerSheets.isLoading : employeeSheets.isLoading;
  const dsLabel    = datasetLabel(data.gapDataset);
  const allEntries = useMemo(() => buildGapEntries(wageRecords, calc.amount), [wageRecords, calc.amount]);
  const gapEntries = useMemo(() => filterGapEntries(allEntries, gapFilters), [allEntries, gapFilters]);
  const gapInfo    = useMemo(() => describeGap(allEntries, calc.amount), [allEntries, calc.amount]);

  const isPrint  = view === 'printCalc' || view === 'printGap' || view === 'printPlan' || view === 'printForm';
  const portrait = view === 'printForm';
  const part     = view === 'printGap' ? 'gap' : view === 'printPlan' ? 'plan' : 'calculation';
  const fileBase = `LivingWage_${view === 'printGap' ? 'WageGap' : view === 'printPlan' ? 'ActionPlan' : view === 'printForm' ? 'SurveyForm' : 'Calculation'}_${todayIso()}`;

  const handleReset = () => {
    setData(prev => ({ ...blankLivingWageData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setView('survey');
    sheets.setEditingId(null);
  };

  const handlePrint = () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) { window.print(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${portrait ? '210mm' : '297mm'};height:${portrait ? '297mm' : '210mm'};border:none;`;
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.styleSheets)
      .map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase}</title>
      <style>@page{size:A4 ${portrait ? 'portrait' : 'landscape'};margin:12mm;}body{margin:0;}${styles}</style>
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
    await exportToPDF({ element: el, filename: fileBase, orientation: portrait ? 'portrait' : 'landscape', scale: 3, rowSafeBreaks: true, printStyle: true });
  };

  const handleExportExcel = () => exportLivingWageExcel(data, gapEntries, dsLabel, `LivingWage_${todayIso()}`);

  const buildRecord = () => {
    const isCalc = data.method === 'calculator';
    const c = calc.inputs.costs;
    return {
      method: data.method, location: data.location, studyYear: data.studyYear, sourceReference: data.sourceReference,
      benchmarkAmount: data.benchmarkAmount,
      foodCost: isCalc ? fmt(c.food) : data.foodCost, housingCost: isCalc ? fmt(c.housing) : data.housingCost,
      utilitiesCost: isCalc ? fmt(c.utilities) : data.utilitiesCost,
      healthcareCost: isCalc ? fmt(c.healthcare) : data.healthcareCost, educationCost: isCalc ? fmt(c.education) : data.educationCost,
      transportCost: isCalc ? fmt(c.transport) : data.transportCost, clothingCost: isCalc ? fmt(c.clothing) : data.clothingCost,
      communicationCost: isCalc ? fmt(c.communication) : data.communicationCost, otherEssentialCost: isCalc ? fmt(c.other) : data.otherEssentialCost,
      contingencyMarginPercent: data.contingencyMarginPercent,
      familySize: isCalc ? fmt(calc.inputs.familySize) : data.familySize,
      workersPerFamily: isCalc ? fmt(calc.inputs.workers) : data.workersPerFamily,
      payrollDeductionPercent: data.payrollDeductionPercent,
      surveysJson: JSON.stringify(data.surveys), totalSurveys: String(data.surveys.length),
      managementReviewJson: JSON.stringify(data.managementReview),
      correctiveActionsJson: JSON.stringify(data.correctiveActions),
      commitmentJson: JSON.stringify(data.commitment),
      calcSettingsJson: JSON.stringify({ useSurveyData: data.useSurveyData, surveyStatistic: data.surveyStatistic, normalizePerCapita: data.normalizePerCapita, gapDataset: data.gapDataset }),
      livingWageAmount: fmt(calc.amount),
      date: data.date, preparedBy: authorization.preparedBy, preparedByDesignation: authorization.preparedByDesignation,
    };
  };

  const billItems = [
    { id: 'printCalc', label: 'গণনা শিট',            onClick: () => setView('printCalc') },
    { id: 'printGap',  label: 'মজুরি ব্যবধান রিপোর্ট', onClick: () => setView('printGap') },
    { id: 'printPlan', label: 'কর্মপরিকল্পনা রিপোর্ট',  onClick: () => setView('printPlan') },
    // { id: 'printForm', label: 'ফাঁকা সার্ভে ফরম',       onClick: () => setView('printForm') },
  ];

  const filterText = gapEntries.length !== allEntries.length ? `Filtered list: ${gapEntries.length} of ${allEntries.length}` : '';

  return (
    <>
      <style>{BASE_PRINT_CSS}</style>

      <ModuleShell
        moduleName="লিভিং ওয়েজ অ্যাসেসমেন্ট ও গ্যাপ ম্যানেজমেন্ট"
        moduleNameEn="Living Wage Assessment & Gap Management"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={isPrint ? '' : view}
        onStepChange={id => setView(id as View)}

        billItems={billItems}
        isBillActive={isPrint}
        activeBillId={isPrint ? view : null}

        onSave={async () => {
          const record = buildRecord();
          const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
          if (ok) handleReset();
          return ok;
        }}
        isSaving={sheets.isSaving}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={data.method === 'benchmark' ? !parseAmount(data.benchmarkAmount) : calc.amount <= 0}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => { sheets.setEditingId(String(rec.id ?? '')); setData(p => recordToFormData(rec, p)); setView('survey'); }}
        updateModule="livingwage"
        updateLabel="লিভিং ওয়েজ স্টাডি খুঁজুন"
        updateSearchPlaceholder="বছর বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'পদ্ধতি',            value: data.method === 'benchmark' ? 'Published Benchmark' : (calc.inputs.fromSurvey ? 'Survey-based' : 'Manual') },
          { label: 'Survey entries',    value: `${calc.derived.n} / ${data.surveys.length}` },
          { label: 'Living Wage',       value: `৳ ${money(calc.amount)}` },
          { label: 'তুলনার তথ্য',        value: useWorkers ? 'Workers' : 'Employees' },
          { label: 'Below living wage', value: allEntries.length ? `${allEntries.filter(e => !e.gap.meetsLivingWage).length} / ${allEntries.length}` : '—' },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec as Record<string, unknown>, p));
          setView('survey');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={async (id: string) => {
          const ok = await sheets.remove(id);
          if (ok && sheets.editingId === id) handleReset();
          return ok;
        }}
        onReload={sheets.reload}
        recordLabel={rec => `${String(rec.location ?? '')} ${String(rec.studyYear ?? '')} ${formatDMY(String(rec.date ?? '').slice(0, 10))}`.trim() || String(rec.id ?? '—')}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        onExcel={handleExportExcel}
        lang="bn"
      >
        {view === 'survey' && (
          <IndividualSurveyForm
            surveys={data.surveys}
            setSurveys={surveys => setData(p => ({ ...p, surveys }))}
            statistic={data.surveyStatistic}
            normalize={data.normalizePerCapita}
            onPrintForm={() => setView('printForm')}
          />
        )}

        {view === 'calculation' && <LivingWageForm data={data} setData={setData} />}

        {view === 'gapAnalysis' && (
          <>
            {useWorkers && (
              <div className="lw-form" style={{ width: '100%' }}>
                <style>{FORM_CSS}</style>
                <WorkersManager
                  records={workerSheets.records}
                  onAdd={async rec => (await workerSheets.save(rec)) !== null}
                  onUpdate={(id, rec) => workerSheets.update(id, rec)}
                  onDelete={id => workerSheets.remove(id)}
                  onImport={async rows => {
                    const r = await saveWorkersBatch(factory, factory.id, userName, rows);
                    workerSheets.reload();
                    return r;
                  }}
                />
              </div>
            )}
            <WageGapReport
              employees={wageRecords}
              livingWage={calc.amount}
              isLoading={wageLoading}
              filters={gapFilters}
              onFiltersChange={setGapFilters}
              datasetLabel={dsLabel}
            />
          </>
        )}

        {view === 'review' && (
          <ManagementReviewForm
            review={data.managementReview}
            setReview={managementReview => setData(p => ({ ...p, managementReview }))}
            suggestedSummary={gapInfo.text}
            suggestedRecommendation={gapInfo.recommendation}
            suggestedPriority={gapInfo.priority}
          />
        )}

        {view === 'action' && (
          <CorrectiveActionForm
            actions={data.correctiveActions}
            setActions={correctiveActions => setData(p => ({ ...p, correctiveActions }))}
            commitment={data.commitment}
            setCommitment={commitment => setData(p => ({ ...p, commitment }))}
          />
        )}

        {isPrint && (
          <>
            {view === 'printForm' && (
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontFamily: font, fontSize: 12.5 }}>
                <button type="button" onClick={() => setView('survey')} style={toolBtn('secondary')}>← Back to survey</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Copies (one worker per page)
                  <input type="number" min={1} max={100} value={formCopies} onChange={e => setFormCopies(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    style={{ width: 70, padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12.5 }} />
                </label>
                {/* <button type="button" onClick={handlePrint} style={{ ...toolBtn('primary'), marginLeft: 'auto' }}>🖨 Print form</button> */}
              </div>
            )}
            <div id="printable-area" ref={printAreaRef}>
              {view === 'printForm'
                ? <SurveyFormPrintView factoryName={data.factoryName} factoryAddress={data.factoryAddress} location={data.location} studyYear={data.studyYear} copies={formCopies} />
                : <LivingWagePrintView part={part} data={data} entries={gapEntries} authorization={authorization} filterText={filterText} datasetLabel={dsLabel} />}
            </div>
          </>
        )}
      </ModuleShell>
    </>
  );
}