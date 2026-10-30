import * as XLSX from 'xlsx';
import type { LivingWageData, GapEntry } from './types';
import { COST_COMPONENTS, computeLivingWage, gapStats, empName, formatDMY, statisticLabel } from './types';

/** One workbook: Calculation, Survey data, Wage gap, Action plan. */
export function exportLivingWageExcel(data: LivingWageData, entries: GapEntry[], datasetLabel: string, filename: string): void {
  const calc = computeLivingWage(data);
  const i = calc.inputs;
  const st = gapStats(entries);
  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: unknown[][], widths: number[]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = widths.map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  const calcRows: unknown[][] = [
    ['Location', data.location], ['Study year', data.studyYear], ['Method', data.method === 'calculator' ? 'Full Calculator' : 'Published Benchmark'], ['Source', data.sourceReference],
  ];
  if (data.method === 'calculator') {
    calcRows.push(['Input source', i.fromSurvey ? `Survey (${i.n} valid of ${calc.derived.total}) — ${statisticLabel(data.surveyStatistic)}` : 'Manual'], []);
    calcRows.push(['Component', 'Entries', 'Monthly family cost (Tk)']);
    COST_COMPONENTS.forEach(c => calcRows.push([c.label, i.counts[c.key], Number(i.costs[c.key].toFixed(2))]));
    calcRows.push(
      ['Housing & utilities', '', Number(calc.housingTotal.toFixed(2))], ['Other essentials subtotal', '', Number(calc.nfnh.toFixed(2))],
      ['Subtotal', '', Number(calc.subtotal.toFixed(2))], [`Contingency margin (${i.contingencyPct}%)`, '', Number(calc.margin.toFixed(2))],
      ['Total family cost', '', Number(calc.totalFamilyCost.toFixed(2))], ['Family size', '', Number(i.familySize.toFixed(2))],
      ['FTE earners per family', '', Number(i.workers.toFixed(2))], ['Net living wage', '', Number(calc.net.toFixed(2))],
      [`Gross living wage (deduction ${i.deductionPct}%)`, '', Number(calc.gross.toFixed(2))],
    );
  }
  calcRows.push([], ['LIVING WAGE USED (Tk / month)', '', Number(calc.amount.toFixed(2))]);
  add('Calculation', calcRows, [38, 12, 24]);

  add('Survey data', [
    ['SL', 'Worker name', 'Worker ID', 'Survey date', 'Family size', 'FTE earners', 'Food', 'Housing', 'Utilities', 'Healthcare', 'Education', 'Transport', 'Clothing', 'Communication', 'Other', 'Surveyor'],
    ...data.surveys.map(s => [
      s.slNo, s.workerName, s.workerId, formatDMY(s.surveyDate), s.actualFamilySize, s.actualEarnersInFamily, s.reportedFoodExpense, s.reportedHousingExpense,
      s.reportedUtilitiesExpense, s.reportedHealthcareExpense, s.reportedEducationExpense, s.reportedTransportExpense, s.reportedClothingExpense,
      s.reportedCommunicationExpense, s.reportedOtherExpense, s.surveyorName,
    ]),
  ], [5, 22, 12, 12, 10, 10, 10, 10, 10, 11, 11, 11, 11, 14, 10, 18]);

  add('Wage gap', [
    ['Compared with', datasetLabel, 'People', st.n, 'Below', st.below, 'Avg gap %', Number(st.avgGapPct.toFixed(1)), 'Cost to close / month', Number(st.shortfallTotal.toFixed(2))], [],
    ['SL', 'Worker ID / Card No', 'Name', 'Designation', 'Department', 'Gross salary', 'Living wage', 'Gap (Tk)', 'Gap %', 'Status'],
    ...entries.map(({ emp, gap }, k) => {
      const r = emp as unknown as Record<string, unknown>;
      return [k + 1, String(r.cardNo ?? ''), empName(emp), String(r.designation ?? ''), String(r.department ?? ''), Number(gap.actualWage.toFixed(2)), Number(gap.livingWage.toFixed(2)),
        Number(gap.gapAmount.toFixed(2)), Number(gap.gapPercent.toFixed(1)), gap.meetsLivingWage ? 'Meets' : 'Below'];
    }),
  ], [6, 14, 24, 20, 18, 13, 13, 12, 9, 9]);

  add('Action plan', [
    ['SL', 'Action item', 'Responsible person', 'Target date', 'Status', 'Remarks'],
    ...data.correctiveActions.map(a => [a.slNo, a.actionItem, a.responsiblePerson, formatDMY(a.targetDate), a.status, a.remarks]),
  ], [5, 50, 22, 12, 13, 30]);

  XLSX.writeFile(wb, `${filename}.xlsx`);
}