// ─────────────────────────────────────────────────────────────────────────────
// Employee Performance — types
// Path: src/components/modules/employeePerformance/types.ts
//
// Performance Management System (per the Wages Grid / Performance
// discussion much earlier in this project) — goal/KPI setting per review
// cycle, self + supervisor assessment, and an overall rating. This is
// the "growth engine" half of the earlier Wages Grid + Performance pair
// (Wages Grid is the compensation-floor/compliance half).
//
// One record = one review (fixed form, matches Left Employee Notice's
// save model), with a DYNAMIC array of KPI items — unlike Onboarding's
// fixed 7-item checklist, the number of KPIs genuinely varies per
// employee/role/cycle, so this follows the committee-member/requisition-
// item resizable-array pattern instead.
// ─────────────────────────────────────────────────────────────────────────────

export interface KPIItem {
  slNo: number;
  description: string;
  target: string;
  achieved: string;
  /** % weight this KPI carries toward the overall score — all KPIs'
     weights should sum to 100, but this isn't enforced rigidly (a
     reviewer mid-cycle may not have finalized every weight yet). */
  weight: string;
  /** Score out of 5 for this specific KPI. */
  score: string;
}

export function blankKPIItem(slNo: number): KPIItem {
  return { slNo, description: '', target: '', achieved: '', weight: '', score: '' };
}

export type RatingCategory = '' | 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Unsatisfactory';
export const RATING_CATEGORY_OPTIONS: RatingCategory[] = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'];

export const RATING_STYLE: Record<Exclude<RatingCategory, ''>, { bg: string; color: string }> = {
  Excellent:           { bg: '#f0fdf4', color: '#15803d' },
  Good:                { bg: '#ecfdf5', color: '#047857' },
  Satisfactory:        { bg: '#eff6ff', color: '#1d4ed8' },
  'Needs Improvement': { bg: '#fef3c7', color: '#92400e' },
  Unsatisfactory:      { bg: '#fee2e2', color: '#b91c1c' },
};

export interface PerformanceReviewData {
  employeeName: string;
  cardNo: string;
  designation: string;
  department: string;
  reviewCycle: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;

  kpiItems: KPIItem[];

  selfAssessment: string;
  supervisorAssessment: string;
  ratingCategory: RatingCategory;
  /** Manual override — if left blank, the weighted-average of KPI
     scores is used for display instead (see calculateOverallScore()). */
  overallScoreOverride: string;

  reviewerName: string;
  reviewerDesignation: string;
  reviewDate: string;

  recommendedIncrementPercent: string;
  comments: string;

  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankPerformanceReview(): PerformanceReviewData {
  return {
    employeeName: '', cardNo: '', designation: '', department: '',
    reviewCycle: '', reviewPeriodStart: '', reviewPeriodEnd: '',
    kpiItems: [blankKPIItem(1)],
    selfAssessment: '', supervisorAssessment: '', ratingCategory: '', overallScoreOverride: '',
    reviewerName: '', reviewerDesignation: '', reviewDate: '',
    recommendedIncrementPercent: '', comments: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_PERFORMANCE_STATE: PerformanceReviewData = blankPerformanceReview();

/**
 * Weighted-average KPI score, out of 5 — Σ(score × weight) / Σ(weight).
 * If no KPI has a usable weight+score pair, returns 0. Falls back to a
 * plain (unweighted) average across scored KPIs if every weight is 0/
 * blank — a partially-filled-in review shouldn't produce a 0 score just
 * because weights haven't been assigned yet.
 */
export function calculateWeightedScore(items: KPIItem[]): number {
  const scored = items.filter(i => Number(i.score) > 0);
  if (scored.length === 0) return 0;

  const totalWeight = scored.reduce((sum, i) => sum + (Number(i.weight) || 0), 0);
  if (totalWeight <= 0) {
    // No weights assigned yet — plain average of whatever scores exist.
    return scored.reduce((sum, i) => sum + Number(i.score), 0) / scored.length;
  }
  const weightedSum = scored.reduce((sum, i) => sum + (Number(i.score) * (Number(i.weight) || 0)), 0);
  return weightedSum / totalWeight;
}

/** The final score to actually show — manual override wins if set,
   otherwise the calculated weighted average. */
export function getOverallScore(data: PerformanceReviewData): number {
  const override = Number(data.overallScoreOverride);
  if (data.overallScoreOverride && !isNaN(override)) return override;
  return calculateWeightedScore(data.kpiItems);
}

/**
 * Resizes the kpiItems array to a target count — same pattern already
 * established for committee members (Disciplinary Action) and requisition
 * items, preserving already-entered rows and blanking/dropping the rest.
 */
export function resizeKPIItems(current: KPIItem[], targetCount: number): KPIItem[] {
  const count = Math.max(1, targetCount);
  const resized: KPIItem[] = [];
  for (let i = 0; i < count; i++) {
    resized.push(current[i] ? { ...current[i], slNo: i + 1 } : blankKPIItem(i + 1));
  }
  return resized;
}
