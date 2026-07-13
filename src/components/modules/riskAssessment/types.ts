// ─────────────────────────────────────────────────────────────────────────────
// Risk Assessment — types
// Path: src/components/modules/riskAssessment/types.ts
//
// Standard hazard/risk register, matching the reference image's exact
// column structure (সেকশন/উৎস/ঝুঁকি সনাক্তকরণ/প্রভাব/প্রতিকার/ঝুঁকির
// কারণ অনুসন্ধান/ঝুঁকির মাত্রা/সংশোধনমূলক-প্রতিষেধক কার্য/দায়িত্বপ্রাপ্ত
// ব্যক্তি) — not invented, followed exactly. One record = one risk
// entry (fixed form, matches Legal Document/Audit-Visit's flat
// register-tracked-in-a-list model — each row in the reference image is
// its own distinct entry, even within the same section, e.g. কাটিং
// মেশিন has 2 separate risk rows for 2 separate hazard sources).
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = '' | 'উচ্চ' | 'মধ্যম' | 'নিম্ন';
export const RISK_LEVEL_OPTIONS: RiskLevel[] = ['উচ্চ', 'মধ্যম', 'নিম্ন'];

export const RISK_LEVEL_STYLE: Record<Exclude<RiskLevel, ''>, { bg: string; color: string }> = {
  উচ্চ:  { bg: '#fee2e2', color: '#b91c1c' },
  মধ্যম: { bg: '#fef3c7', color: '#92400e' },
  নিম্ন:  { bg: '#f0fdf4', color: '#15803d' },
};

export interface RiskAssessmentData {
  section: string;
  source: string;
  riskIdentification: string;
  impact: string;
  remedy: string;
  causeInvestigation: string;
  riskLevel: RiskLevel;
  correctiveAction: string;
  correctiveActionDate: string;
  responsiblePersonName: string;
  responsiblePersonDesignation: string;

  remarks: string;
  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankRiskAssessment(): RiskAssessmentData {
  return {
    section: '', source: '', riskIdentification: '', impact: '', remedy: '',
    causeInvestigation: '', riskLevel: '', correctiveAction: '', correctiveActionDate: '',
    responsiblePersonName: '', responsiblePersonDesignation: '',
    remarks: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_RISK_ASSESSMENT_STATE: RiskAssessmentData = blankRiskAssessment();
