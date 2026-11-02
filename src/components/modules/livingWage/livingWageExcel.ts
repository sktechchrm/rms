import * as XLSX from 'xlsx';
import type { LivingWageData, GapEntry, SurveyRow } from './types';
import { COST_COMPONENTS, SURVEY_NUM_FIELDS, computeLivingWage, deriveFromSurveys, gapStats, empName, formatDMY, statisticLabel, parseAmount } from './types';

/** Survey table as sheet rows: header, one row per entry (numbers as numbers), and a statistic row. */
function surveySheetRows(rows: SurveyRow[], data: LivingWageData): unknown[][] {
  const derived = deriveFromSurveys(rows.map(r => r.s), data.surveyStatistic, false);
  const stat = (key: string): number | string => {
    if (!derived.n) return '';
    if (key === 'actualFamilySize') return Number(derived.familySize.toFixed(2));
    if (key === 'actualEarnersInFamily') return Number(derived.workers.toFixed(2));
    const comp = COST_COMPONENTS.find(c => c.entry === key);
    return comp ? Number(derived.costs[comp.key].raw.toFixed(2)) : '';
  };
  return [
    ['SL', 'Worker name', 'Worker ID', 'Survey date', ...SURVEY_NUM_FIELDS.map(f => f.label), 'Surveyor', 'Check'],
    ...rows.map(({ s, issues }, k) => [
      k + 1, s.workerName, s.workerId, formatDMY(s.surveyDate),
      ...SURVEY_NUM_FIELDS.map(f => parseAmount(s[f.key]) ?? ''),
      s.surveyorName, issues.join('; '),
    ]),
    [],
    [`${statisticLabel(data.surveyStatistic)} of the valid records (${derived.n})`, '', '', '', ...SURVEY_NUM_FIELDS.map(f => stat(f.key))],
  ];
}
const SURVEY_COL_WIDTHS = [5, 22, 12, 12, 10, 10, 10, 10, 10, 11, 11, 11, 11, 14, 10, 18, 34];

/** The survey table alone — exactly the rows shown (filtered and sorted) on the survey step. */
export function exportSurveyExcel(rows: SurveyRow[], data: LivingWageData, filename: string): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(surveySheetRows(rows, data));
  ws['!cols'] = SURVEY_COL_WIDTHS.map(wch => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, 'Survey data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** One workbook: Calculation, Survey data, Wage gap, Action plan. */
export function exportLivingWageExcel(data: LivingWageData, records: GapEntry[], datasetLabel: string, filename: string): void {
  const calc = computeLivingWage(data);
  const i = calc.inputs;
  const st = gapStats(records);
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
    calcRows.push(['Component', 'records', 'Monthly family cost (Tk)']);
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

  const allSurveyRows: SurveyRow[] = data.surveys.map((sv, i) => ({ s: sv, i, issues: [] }));
  add('Survey data', surveySheetRows(allSurveyRows, data), SURVEY_COL_WIDTHS);

  const estimated = data.wageBasis === 'estimated';
  const gapHeader = estimated
    ? ['SL', 'Worker ID / Card No', 'Name', 'Designation', 'Department', 'Gross salary', 'Est. overtime', 'Festival bonus provision', 'Est. take-home salary', 'Living wage', 'Gap (Tk)', 'Gap %', 'Status']
    : ['SL', 'Worker ID / Card No', 'Name', 'Designation', 'Department', 'Gross salary', 'Living wage', 'Gap (Tk)', 'Gap %', 'Status'];
  const r2 = (n: number) => Number(n.toFixed(2));
  add('Wage gap', [
    ['Compared with', datasetLabel, 'Salary basis', estimated ? 'Estimated take-home salary (gross + est. overtime + festival bonus provision)' : 'Gross salary',
      'People', st.n, 'Below', st.below, 'Avg gap %', Number(st.avgGapPct.toFixed(1)), 'Cost to close / month', r2(st.shortfallTotal)], [],
    gapHeader,
    ...records.map(({ emp, gap, gross, est }, k) => {
      const r = emp as unknown as Record<string, unknown>;
      const head = [k + 1, String(r.cardNo ?? ''), empName(emp), String(r.designation ?? ''), String(r.department ?? '')];
      const tail = [r2(gap.livingWage), r2(gap.gapAmount), Number(gap.gapPercent.toFixed(1)), gap.meetsLivingWage ? 'Meets' : 'Below'];
      return estimated && est
        ? [...head, r2(gross), r2(est.overtime), r2(est.festivalBonus), r2(est.total), ...tail]
        : [...head, r2(gross), ...tail];
    }),
  ], estimated ? [6, 14, 24, 20, 18, 13, 13, 16, 16, 13, 12, 9, 9] : [6, 14, 24, 20, 18, 13, 13, 12, 9, 9]);

  add('Action plan', [
    ['SL', 'Action item', 'Responsible person', 'Target date', 'Status', 'Remarks'],
    ...data.correctiveActions.map(a => [a.slNo, a.actionItem, a.responsiblePerson, formatDMY(a.targetDate), a.status, a.remarks]),
  ], [5, 50, 22, 12, 13, 30]);

  XLSX.writeFile(wb, `${filename}.xlsx`);
}