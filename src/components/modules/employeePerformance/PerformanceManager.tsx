// ─────────────────────────────────────────────────────────────────────────────
// PerformanceManager.tsx
// Path: src/components/modules/employeePerformance/PerformanceManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import ModuleShell from '../../shell/ModuleShell';
import PerformanceForm from './PerformanceForm';
import PerformanceStatement from './PerformanceStatement';
import PerformancePrintView from './PerformancePrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import type { PerformanceReviewData, KPIItem, RatingCategory } from './types';
import { blankPerformanceReview, blankKPIItem, RATING_CATEGORY_OPTIONS, getOverallScore } from './types';

const STEPS = [
  { id: 'form', label: 'পারফরম্যান্স রিভিউ', icon: 'ti-chart-line', fieldCount: 5 },
];

function recordToFormData(rec: Record<string, unknown>, prev: PerformanceReviewData): PerformanceReviewData {
  return {
    ...prev,
    employeeName:          String(rec.employeeName ?? ''),
    cardNo:                 String(rec.cardNo ?? ''),
    designation:            String(rec.designation ?? ''),
    department:             String(rec.department ?? ''),
    reviewCycle:            String(rec.reviewCycle ?? ''),
    reviewPeriodStart:      toDateInput(rec.reviewPeriodStart) || '',
    reviewPeriodEnd:        toDateInput(rec.reviewPeriodEnd) || '',
    kpiItems: (() => {
      try {
        const parsed = JSON.parse(String(rec.kpiItemsJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.kpiItems;
        return parsed.map((k, i): KPIItem => ({
          slNo:        Number(k.slNo ?? i + 1),
          description: String(k.description ?? ''),
          target:      String(k.target ?? ''),
          achieved:    String(k.achieved ?? ''),
          weight:      String(k.weight ?? ''),
          score:       String(k.score ?? ''),
        }));
      } catch { return prev.kpiItems; }
    })(),
    selfAssessment:          String(rec.selfAssessment ?? ''),
    supervisorAssessment:    String(rec.supervisorAssessment ?? ''),
    ratingCategory:          (RATING_CATEGORY_OPTIONS.includes(rec.ratingCategory as RatingCategory) ? rec.ratingCategory : '') as RatingCategory,
    overallScoreOverride:    String(rec.overallScoreOverride ?? ''),
    reviewerName:            String(rec.reviewerName ?? ''),
    reviewerDesignation:     String(rec.reviewerDesignation ?? ''),
    reviewDate:              toDateInput(rec.reviewDate) || '',
    recommendedIncrementPercent: String(rec.recommendedIncrementPercent ?? ''),
    comments:                String(rec.comments ?? ''),
    date:                    toDateInput(rec.date) || prev.date,
  };
}

export default function PerformanceManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('performance', factory.id, user?.name ?? 'unknown', 1000);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'tracking' | 'printTracking'>('form');
  const [data,          setData]          = useState<PerformanceReviewData>(blankPerformanceReview());
  const [printRecords,  setPrintRecords]  = useState<DbRecord[]>([]);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankPerformanceReview(), kpiItems: [blankKPIItem(1)], factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep('form');
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
    // Black-box print fix (see other modules for the fuller explanation):
    // forces html/body to plain white/black, placed AFTER the copied
    // stylesheets so it wins the cascade.
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
    await exportToPDF({ element: el, filename: `Performance_${data.date}`, scale: 2 });
  };

  const buildRecord = () => ({
    employeeName:          data.employeeName,
    cardNo:                 data.cardNo,
    designation:            data.designation,
    department:             data.department,
    reviewCycle:            data.reviewCycle,
    reviewPeriodStart:      data.reviewPeriodStart,
    reviewPeriodEnd:        data.reviewPeriodEnd,
    kpiItemsJson:           JSON.stringify(data.kpiItems),
    selfAssessment:          data.selfAssessment,
    supervisorAssessment:    data.supervisorAssessment,
    ratingCategory:          data.ratingCategory,
    overallScoreOverride:    data.overallScoreOverride,
    reviewerName:            data.reviewerName,
    reviewerDesignation:     data.reviewerDesignation,
    reviewDate:              data.reviewDate,
    recommendedIncrementPercent: data.recommendedIncrementPercent,
    comments:                data.comments,
    date:                    data.date,
    preparedBy:              authorization.preparedBy,
    preparedByDesignation:   authorization.preparedByDesignation,
  });

  const billItems = [
    { label: 'Tracking Dashboard', onClick: () => setActiveStep('tracking') },
  ];
  const isBillActive = activeStep === 'tracking' || activeStep === 'printTracking';
  const overallScore = getOverallScore(data);

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
      `}</style>

      <ModuleShell
        moduleName="কর্মী পারফরম্যান্স ব্যবস্থাপনা"
        moduleNameEn="Employee Performance"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={activeStep === 'form' ? 'form' : ''}
        onStepChange={id => setActiveStep(id as 'form')}

        billItems={billItems}
        isBillActive={isBillActive}

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
        saveDisabled={!data.employeeName || !data.cardNo || !data.reviewCycle}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="performance"
        updateLabel="পারফরম্যান্স রিভিউ খুঁজুন"
        updateSearchPlaceholder="নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'কর্মী',   value: data.employeeName || '—' },
          { label: 'চক্র',    value: data.reviewCycle || '—' },
          { label: 'স্কোর',    value: `${overallScore.toFixed(2)} / ৫` },
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

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        lang="bn"
      >
        {activeStep === 'form' && (
          <PerformanceForm data={data} setData={setData} />
        )}

        {activeStep === 'tracking' && (
          <PerformanceStatement
            records={sheets.records}
            onEdit={(rec: DbRecord) => {
              sheets.setEditingId(String(rec.id ?? ''));
              setData(p => recordToFormData(rec as unknown as Record<string, unknown>, p));
              setActiveStep('form');
            }}
            onDelete={(id: string) => { sheets.remove(id); }}
            onPrintFiltered={(filtered: DbRecord[]) => {
              setPrintRecords(filtered);
              setActiveStep('printTracking');
            }}
          />
        )}

        {activeStep === 'printTracking' && (
          <div id="printable-area" ref={printAreaRef}>
            <PerformancePrintView
              records={printRecords}
              factoryName={data.factoryName}
              factoryAddress={data.factoryAddress}
              authorization={authorization}
            />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
