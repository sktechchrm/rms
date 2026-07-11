// ─────────────────────────────────────────────────────────────────────────────
// LivingWageManager.tsx — "Living Wage Assessment & Gap Management"
// Path: src/components/modules/livingWage/LivingWageManager.tsx
//
// REORGANIZED (explicit request) into the formal 5-stage workflow:
//   1. Survey & Assessment
//   2. Living Wage Calculation
//   3. Wage Gap Analysis
//   4. Management Review & Recommendations
//   5. Corrective Action & Commitment
// All 5 are now proper sequential ModuleShell steps (was split between
// steps + billItems before) — print remains a separate billItems action,
// since it's an output, not a workflow stage.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import LivingWageFormComponent from './LivingWageForm';
import IndividualSurveyForm from './IndividualSurveyForm';
import WageGapReport from './WageGapReport';
import WageGapPrintView from './WageGapPrintView';
import ManagementReviewForm from './ManagementReviewForm';
import CorrectiveActionForm from './CorrectiveActionForm';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { LivingWageData, LivingWageMethod, IndividualSurveyEntry, CorrectiveActionItem } from './types';
import {
  INITIAL_LIVING_WAGE_STATE, getLivingWageAmount, calculateWageGap,
  blankManagementReview, blankCommitment,
} from './types';

const STEPS = [
  { id: 'survey',      label: '১. Survey & Assessment',                    icon: 'ti-clipboard-list', fieldCount: 3 },
  { id: 'calculation', label: '২. Living Wage Calculation',                icon: 'ti-scale',          fieldCount: 4 },
  { id: 'gapAnalysis', label: '৩. Wage Gap Analysis',                      icon: 'ti-chart-bar',      fieldCount: 1 },
  { id: 'review',      label: '৪. Management Review & Recommendations',    icon: 'ti-checkup-list',   fieldCount: 3 },
  { id: 'action',      label: '৫. Corrective Action & Commitment',         icon: 'ti-list-check',     fieldCount: 2 },
];

function recordToFormData(rec: Record<string, unknown>, prev: LivingWageData): LivingWageData {
  const managementReview = (() => {
    try {
      const parsed = JSON.parse(String(rec.managementReviewJson ?? '{}'));
      return { ...blankManagementReview(), ...parsed };
    } catch { return prev.managementReview; }
  })();
  const commitment = (() => {
    try {
      const parsed = JSON.parse(String(rec.commitmentJson ?? '{}'));
      return { ...blankCommitment(), ...parsed };
    } catch { return prev.commitment; }
  })();

  return {
    ...prev,
    method:                    (rec.method === 'calculator' ? 'calculator' : 'benchmark') as LivingWageMethod,
    location:                  String(rec.location ?? prev.location),
    studyYear:                 String(rec.studyYear ?? prev.studyYear),
    sourceReference:           String(rec.sourceReference ?? ''),
    benchmarkAmount:           String(rec.benchmarkAmount ?? ''),
    foodCost:                  String(rec.foodCost ?? ''),
    housingCost:               String(rec.housingCost ?? ''),
    healthcareCost:            String(rec.healthcareCost ?? ''),
    educationCost:             String(rec.educationCost ?? ''),
    transportCost:             String(rec.transportCost ?? ''),
    clothingCost:              String(rec.clothingCost ?? ''),
    communicationCost:         String(rec.communicationCost ?? ''),
    otherEssentialCost:        String(rec.otherEssentialCost ?? ''),
    contingencyMarginPercent:  String(rec.contingencyMarginPercent ?? '5'),
    familySize:                String(rec.familySize ?? '4'),
    workersPerFamily:          String(rec.workersPerFamily ?? '1.58'),
    payrollDeductionPercent:   String(rec.payrollDeductionPercent ?? '0'),
    surveys: (() => {
      try {
        const parsed = JSON.parse(String(rec.surveysJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.surveys;
        return parsed.map((s, i): IndividualSurveyEntry => ({
          slNo:                    Number(s.slNo ?? i + 1),
          workerName:              String(s.workerName ?? ''),
          workerId:                String(s.workerId ?? ''),
          surveyDate:              String(s.surveyDate ?? ''),
          actualFamilySize:        String(s.actualFamilySize ?? ''),
          actualEarnersInFamily:   String(s.actualEarnersInFamily ?? ''),
          reportedFoodExpense:     String(s.reportedFoodExpense ?? ''),
          reportedHousingExpense:  String(s.reportedHousingExpense ?? ''),
          reportedOtherExpense:    String(s.reportedOtherExpense ?? ''),
          surveyorName:            String(s.surveyorName ?? ''),
          notes:                   String(s.notes ?? ''),
        }));
      } catch { return prev.surveys; }
    })(),
    managementReview,
    correctiveActions: (() => {
      try {
        const parsed = JSON.parse(String(rec.correctiveActionsJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.correctiveActions;
        return parsed.map((a, i): CorrectiveActionItem => ({
          slNo:              Number(a.slNo ?? i + 1),
          actionItem:        String(a.actionItem ?? ''),
          responsiblePerson: String(a.responsiblePerson ?? ''),
          targetDate:        String(a.targetDate ?? ''),
          status:            (a.status === 'In Progress' || a.status === 'Completed') ? a.status : 'Not Started',
          remarks:           String(a.remarks ?? ''),
        }));
      } catch { return prev.correctiveActions; }
    })(),
    commitment,
    date:                      toDateInput(rec.date) || prev.date,
  };
}

export default function LivingWageManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('livingwage', factory.id, user?.name ?? 'unknown');
  // Employee data for wage-gap comparison needs ALL employees, not the
  // default 50-record cap — useDatabase's optional 4th param (added for
  // this module) passes a higher limit through to the adapter.
  const employeeSheets = useDatabase('employees', factory.id, user?.name ?? 'unknown', 2000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<string>('survey');
  const [showPrint,     setShowPrint]     = useState(false);
  const [data,          setData]          = useState<LivingWageData>(INITIAL_LIVING_WAGE_STATE);
  const [printEmployees, setPrintEmployees]   = useState<DbRecord[]>([]);
  const [printDepartment, setPrintDepartment] = useState('');

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...INITIAL_LIVING_WAGE_STATE, factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep('survey');
    setShowPrint(false);
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
    // AUDIT FIX (carried over): forces html/body to plain white/black,
    // placed AFTER the copied stylesheets so it wins the cascade — see
    // the fuller explanation in this same function's earlier version.
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 landscape;margin:10mm 12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
    };
  };

  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({ element: el, filename: `LivingWage_GapAnalysis_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    method:                    data.method,
    location:                  data.location,
    studyYear:                 data.studyYear,
    sourceReference:           data.sourceReference,
    benchmarkAmount:           data.benchmarkAmount,
    foodCost:                  data.foodCost,
    housingCost:               data.housingCost,
    healthcareCost:            data.healthcareCost,
    educationCost:             data.educationCost,
    transportCost:             data.transportCost,
    clothingCost:              data.clothingCost,
    communicationCost:         data.communicationCost,
    otherEssentialCost:        data.otherEssentialCost,
    contingencyMarginPercent:  data.contingencyMarginPercent,
    familySize:                data.familySize,
    workersPerFamily:          data.workersPerFamily,
    payrollDeductionPercent:   data.payrollDeductionPercent,
    surveysJson:               JSON.stringify(data.surveys),
    totalSurveys:              String(data.surveys?.length ?? 0),
    managementReviewJson:      JSON.stringify(data.managementReview),
    correctiveActionsJson:     JSON.stringify(data.correctiveActions),
    commitmentJson:            JSON.stringify(data.commitment),
    date:                      data.date,
    preparedBy:                authorization.preparedBy,
    preparedByDesignation:     authorization.preparedByDesignation,
  });

  const livingWage = getLivingWageAmount(data);

  // Auto-suggested summary text for Step 4, derived from the wage-gap
  // numbers already computed — editable, not forced.
  const gapSummaryText = (() => {
    const rows = employeeSheets.records
      .filter(e => Number(e.grossSalary) > 0)
      .map(e => calculateWageGap(Number(e.grossSalary) || 0, livingWage));
    if (rows.length === 0) return 'No employee wage data available yet.';
    const below = rows.filter(r => !r.meetsLivingWage).length;
    const avgGapPct = rows.reduce((s, r) => s + r.gapPercent, 0) / rows.length;
    return `Living wage set at Tk ${livingWage.toFixed(2)}/month. ${below} of ${rows.length} employees (${((below / rows.length) * 100).toFixed(1)}%) fall below this figure, with an average gap of ${avgGapPct.toFixed(1)}%.`;
  })();

  const billItems = [
    { label: 'প্রিন্ট প্রিভিউ', onClick: () => {
        setPrintEmployees(employeeSheets.records);
        setPrintDepartment('');
        setShowPrint(true);
      } },
  ];

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
      `}</style>

      <ModuleShell
        moduleName="লিভিং ওয়েজ অ্যাসেসমেন্ট ও গ্যাপ ম্যানেজমেন্ট"
        moduleNameEn="Living Wage Assessment & Gap Management"
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
        saveDisabled={data.method === 'benchmark' ? !data.benchmarkAmount : !data.foodCost || !data.housingCost}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('survey');
          setShowPrint(false);
        }}
        updateModule="livingwage"
        updateLabel="লিভিং ওয়েজ স্টাডি খুঁজুন"
        updateSearchPlaceholder="বছর বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'পদ্ধতি', value: data.method === 'benchmark' ? 'Published Benchmark' : 'Full Calculator' },
          { label: 'Living Wage', value: `৳ ${livingWage.toFixed(2)}` },
          { label: 'Corrective Actions', value: `${data.correctiveActions?.length ?? 0} টি` },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec as Record<string, unknown>, p));
          setActiveStep('survey');
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
        {!showPrint && activeStep === 'survey' && (
          <IndividualSurveyForm
            surveys={data.surveys}
            setSurveys={surveys => setData(p => ({ ...p, surveys }))}
            calculatorFamilySize={data.familySize}
            calculatorWorkersPerFamily={data.workersPerFamily}
          />
        )}

        {!showPrint && activeStep === 'calculation' && (
          <LivingWageFormComponent data={data} setData={setData} />
        )}

        {!showPrint && activeStep === 'gapAnalysis' && (
          <WageGapReport
            employees={employeeSheets.records}
            livingWage={livingWage}
            isLoading={employeeSheets.isLoading}
            onPrintFiltered={(filtered, department) => {
              setPrintEmployees(filtered);
              setPrintDepartment(department);
              setShowPrint(true);
            }}
          />
        )}

        {!showPrint && activeStep === 'review' && (
          <ManagementReviewForm
            review={data.managementReview}
            setReview={managementReview => setData(p => ({ ...p, managementReview }))}
            gapSummaryText={gapSummaryText}
          />
        )}

        {!showPrint && activeStep === 'action' && (
          <CorrectiveActionForm
            actions={data.correctiveActions}
            setActions={correctiveActions => setData(p => ({ ...p, correctiveActions }))}
            commitment={data.commitment}
            setCommitment={commitment => setData(p => ({ ...p, commitment }))}
          />
        )}

        {showPrint && (
          <div id="printable-area" ref={printAreaRef}>
            <WageGapPrintView
              employees={printEmployees}
              livingWageData={data}
              authorization={authorization}
              departmentFilter={printDepartment}
            />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
