// ─────────────────────────────────────────────────────────────────────────────
// Risk Assessment — types, risk scoring, shared Statement filters
// Path: src/components/modules/riskAssessment/types.ts
//
// One record = one risk entry. Columns (in order): ক্রমিক, সেকশন / বিভাগ,
// ঝুঁকির উৎস / কার্যক্রম, চিহ্নিত বিপদ / ঝুঁকি, সম্ভাব্য প্রভাব / পরিণতি,
// বিদ্যমান নিয়ন্ত্রণ ব্যবস্থা, ঝুঁকি মূল্যায়ন (সম্ভাবনা × তীব্রতা = ঝুঁকির মাত্রা),
// ঝুঁকির মূল কারণ, সংশোধনমূলক / প্রতিরোধমূলক ব্যবস্থা, দায়িত্বপ্রাপ্ত ব্যক্তির নাম ও পদবি.
//
// Score = likelihood (1–5) × severity (1–5). Level: 1–4 নিম্ন, 5–9 মাঝারি,
// 10–16 উচ্চ, 17–25 অত্যন্ত উচ্চ. (Old records saved "মধ্যম" → shown as "মাঝারি".)
//
// Statement filters (shared by the Statement, Print Preview, PDF and Excel):
//   search, levels (multi), action date from/to, column-header filters, sort.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';

export type RiskLevel = '' | 'নিম্ন' | 'মাঝারি' | 'উচ্চ' | 'অত্যন্ত উচ্চ';
export type RiskLevelName = Exclude<RiskLevel, ''>;

export const RISK_LEVEL_OPTIONS: RiskLevelName[] = ['নিম্ন', 'মাঝারি', 'উচ্চ', 'অত্যন্ত উচ্চ'];

export const RISK_LEVEL_STYLE: Record<RiskLevelName, { bg: string; color: string }> = {
  'নিম্ন':        { bg: '#dcfce7', color: '#166534' },
  'মাঝারি':       { bg: '#fef3c7', color: '#92400e' },
  'উচ্চ':         { bg: '#fee2e2', color: '#b91c1c' },
  'অত্যন্ত উচ্চ': { bg: '#7f1d1d', color: '#ffffff' },
};

export const LIKELIHOOD_OPTIONS = ['১ = অত্যন্ত কম', '২ = কম', '৩ = মাঝারি', '৪ = বেশি', '৫ = অত্যন্ত বেশি'];
export const SEVERITY_OPTIONS = [
  '১ = সামান্য', '২ = ছোটখাটো আঘাত', '৩ = চিকিৎসার প্রয়োজন', '৪ = গুরুতর আঘাত', '৫ = মৃত্যু বা একাধিক প্রাণহানির সম্ভাবনা',
];

/** Column headings, in table order (without ক্রমিক and Actions). */
export const RISK_HEADERS = [
  'সেকশন / বিভাগ / অবস্থান',
  'ঝুঁকির উৎস / কার্যক্রম',
  'চিহ্নিত বিপদ / ঝুঁকি',
  'সম্ভাব্য প্রভাব / পরিণতি',
  'বিদ্যমান নিয়ন্ত্রণ ব্যবস্থা',
  'ঝুঁকি মূল্যায়ন (সম্ভাবনা × তীব্রতা = ঝুঁকির মাত্রা)',
  'ঝুঁকির মূল কারণ',
  'সংশোধনমূলক / প্রতিরোধমূলক ব্যবস্থা',
  'দায়িত্বপ্রাপ্ত ব্যক্তির নাম ও পদবি',
];

export interface RiskAssessmentData {
  section: string;
  source: string;
  riskIdentification: string;
  impact: string;
  /** Existing control measures (বিদ্যমান নিয়ন্ত্রণ ব্যবস্থা). */
  remedy: string;
  causeInvestigation: string;
  /** '' or '1'…'5' */
  likelihood: string;
  severity: string;
  /** Calculated at save time from likelihood × severity. */
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Today as local ISO YYYY-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO (YYYY-MM-DD) → DD-MM-YYYY for display; unchanged if not ISO. */
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}

export function blankRiskAssessment(): RiskAssessmentData {
  return {
    section: '', source: '', riskIdentification: '', impact: '', remedy: '', causeInvestigation: '',
    likelihood: '', severity: '', riskLevel: '', correctiveAction: '', correctiveActionDate: '',
    responsiblePersonName: '', responsiblePersonDesignation: '', remarks: '',
    date: todayIso(), factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_RISK_ASSESSMENT_STATE: RiskAssessmentData = blankRiskAssessment();

export const toBn = (v: string | number) => String(v).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);

/** 1–5 as a number, otherwise null. */
export function parseScale(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export function levelFromScore(score: number): RiskLevelName {
  if (score <= 4) return 'নিম্ন';
  if (score <= 9) return 'মাঝারি';
  if (score <= 16) return 'উচ্চ';
  return 'অত্যন্ত উচ্চ';
}

/** Old and new spellings → the current level names ('' if unknown). */
export function normalizeLevel(v: unknown): RiskLevel {
  const s = String(v ?? '').trim();
  if (s === 'মধ্যম') return 'মাঝারি';
  return (RISK_LEVEL_OPTIONS as string[]).includes(s) ? (s as RiskLevelName) : '';
}

/** "৩ × ৪ = ১২ (উচ্চ)" — or just the level when likelihood/severity are missing. */
export function assessmentText(l: number | null, s: number | null, level: RiskLevel): string {
  if (l && s) return `${toBn(l)} × ${toBn(s)} = ${toBn(l * s)}${level ? ` (${level})` : ''}`;
  return level || '—';
}

// ─── Entries + shared filters ────────────────────────────────────────────────

export interface RiskEntry {
  rec: DbRecord;
  level: RiskLevel;
  score: number | null;
  likelihood: number | null;
  severity: number | null;
}

export function buildRiskEntries(records: DbRecord[]): RiskEntry[] {
  return records.map(rec => {
    const likelihood = parseScale(rec.likelihood);
    const severity   = parseScale(rec.severity);
    const score = likelihood && severity ? likelihood * severity : null;
    const level: RiskLevel = score ? levelFromScore(score) : normalizeLevel(rec.riskLevel);
    return { rec, level, score, likelihood, severity };
  });
}

export type RiskSortField = 'section' | 'score' | 'actionDate' | '';

export interface RiskFilters {
  search: string;
  /** Selected levels; [] = all. */
  levels: string[];
  /** ISO — corrective action date on/after. */
  dateFrom: string;
  /** ISO — corrective action date on/before. */
  dateTo: string;
  /** Column-header filters: field → selected values ([] or missing = all). */
  columns: Record<string, string[]>;
  sort: { field: RiskSortField; dir: 'asc' | 'desc' };
}

export const EMPTY_RISK_FILTERS: RiskFilters = {
  search: '', levels: [], dateFrom: '', dateTo: '', columns: {}, sort: { field: '', dir: 'asc' },
};

export function countActiveRiskFilters(f: RiskFilters): number {
  const cols = Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
  return [f.search.trim(), f.levels.length > 0, f.dateFrom, f.dateTo].filter(Boolean).length + cols;
}
export const hasActiveRiskFilters = (f: RiskFilters) => countActiveRiskFilters(f) > 0;

export const BLANK_VALUE = '(Blank)';

/** The value an entry shows in a filterable column (empty → "(Blank)"). */
export function riskColumnValue(e: RiskEntry, field: string): string {
  let raw: string;
  if (field === 'riskLevel') raw = e.level;
  else if (field === 'correctiveActionDate') raw = String(e.rec.correctiveActionDate ?? '').slice(0, 10);
  else raw = String((e.rec as unknown as Record<string, unknown>)[field] ?? '');
  return raw.trim() || BLANK_VALUE;
}

export function filterRiskEntries(entries: RiskEntry[], f: RiskFilters): RiskEntry[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const result = entries.filter(e => {
    const { rec } = e;
    const action = String(rec.correctiveActionDate ?? '').slice(0, 10);

    if (f.dateFrom && (!action || action < f.dateFrom)) return false;
    if (f.dateTo   && (!action || action > f.dateTo))   return false;
    if (f.levels.length && !f.levels.includes(e.level)) return false;

    for (const [field, selected] of Object.entries(f.columns ?? {})) {
      if (selected.length && !selected.includes(riskColumnValue(e, field))) return false;
    }

    if (words.length) {
      const hay = [
        rec.section, rec.source, rec.riskIdentification, rec.impact, rec.remedy, rec.causeInvestigation,
        rec.correctiveAction, rec.responsiblePersonName, rec.responsiblePersonDesignation,
      ].map(v => String(v ?? '').toLowerCase()).join(' ');
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });

  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return result;
  const mult = dir === 'asc' ? 1 : -1;
  const key = (e: RiskEntry): string | number | null => {
    if (field === 'score') return e.score;
    if (field === 'actionDate') return String(e.rec.correctiveActionDate ?? '').slice(0, 10) || null;
    return String(e.rec.section ?? '').trim() || null;
  };
  return [...result].sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (ka === null && kb === null) return 0;
    if (ka === null) return 1;                       // blanks always last
    if (kb === null) return -1;
    if (typeof ka === 'number' && typeof kb === 'number') return mult * (ka - kb);
    return mult * String(ka).localeCompare(String(kb), undefined, { numeric: true, sensitivity: 'base' });
  });
}