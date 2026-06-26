// ─────────────────────────────────────────────────────────────────────────────
// FACTORY TYPES — Shared interfaces used by every factory file and the registry.
//
// Committee, CommitteeMember, Gender, and Authority are imported from
// MeetingMinutesTypes so there is only one definition across the whole project.
// ─────────────────────────────────────────────────────────────────────────────

// ── ALL imports first ─────────────────────────────────────────────────────────
import type {
  Committee,
  CommitteeMember,
  Gender,
  Authority,
} from '../components/meeting/MeetingMinutesTypes';

// ── Re-export meeting types so factory files only need to import from here ────
export type { Committee, CommitteeMember, Gender, Authority };

// Authority is also exported as MeetingAuthority — keeps factory files readable
export type MeetingAuthority = Authority;

// ── Worker guideline supporting types ────────────────────────────────────────

export interface WelfareOfficer {
  name:        string;
  designation: string;
}

export interface HotLine {
  label:  string;
  number: string;
}

/**
 * Factory profile data used by the Worker Guideline page (section 1 — কারখানা পরিচিতি).
 */
export interface WorkerProfile {
  establishedYear:   string;
  totalFloors:       number;
  totalWorkers:      number;
  totalShifts:       number;
  totalSewingLines:  number;
  totalBathrooms:    number;
  dailyProduction:   number;
  monthlyProduction: number;
  yearlyProduction:  number;
  welfareOfficers:   WelfareOfficer[];
  hotlines:          HotLine[];
  buyers:            string[];
  productTypes:      string[];
  sections:          string[];
}

// ── HR document authorities (English + Bengali) ───────────────────────────────

export interface AuthorityPerson {
  name:          string;
  nameEn:        string;
  designation:   string;
  designationEn: string;
  email?:        string;
  phone?:        string;
}

export interface FactoryAuthorities {
  /** Group chairman — optional until all factory files define it */
  honorableChairman?: AuthorityPerson;
  /** Managing director — optional until all factory files define it */
  honorableMD?:       AuthorityPerson;
  factoryHead:        AuthorityPerson;
  hrManager:          AuthorityPerson;
  hoHrHead:           AuthorityPerson;
  headOfOperations:   AuthorityPerson;
}

// ── Salary & leave shared types ───────────────────────────────────────────────

export interface SalaryBreakdown {
  basicSalary:      number;
  houseRent:        number;
  medicalAllowance: number;
  transport:        number;
  foodAllowance:    number;
  total:            number;
}

export interface LeaveInfo {
  casualLeave:    number;
  sickLeave:      number;
  annualLeave:    number;
  festivalLeave:  number;
  maternityLeave: number;
  hajjLeave:      number;
}

// ── Worker Guideline HR policy — canonical interface ─────────────────────────

export interface WorkerGuideline {
  salary:                SalaryBreakdown;
  workingHoursPerDay:    string;
  maxOvertimeHours:      string;
  overtimeFormula:       string;
  probationMonthsSkill:  string;
  probationMonthsUnSkill:string;
  noticePeriodDaysOwner: {
    permanent: number;
    temporary: number;
    other:     number;
  };
  noticePeriodDaysWorker: {
    permanent: number;
    temporary: number;
  };
  leave:              LeaveInfo;
  environmentTargets: {
    ghgReductionPct:   number;
    waterReductionPct: number;
    wasteReductionPct: number;
    targetYear:        number;
  };
  salaryPaymentDays:  string;
  lunchScheduleOne:   string;
  lunchScheduleTwo:   string;
}

/**
 * DEPRECATED — use WorkerGuideline instead.
 * Kept so MgFashion, MgApparels, Mohammadi factory files continue to compile
 * until they are migrated. Remove after all three are updated.
 */
export interface WorkerGuidelineConfig {
  salary:             SalaryBreakdown;
  workingHoursPerDay: number;
  maxOvertimeHours:   number;
  overtimeFormula:    string;
  probationMonths:    number;
  noticePeriodDays: {
    permanent: number;
    temporary: number;
    other:     number;
  };
  leave:             LeaveInfo;
  environmentTargets: {
    ghgReductionPct:   number;
    waterReductionPct: number;
    wasteReductionPct: number;
    targetYear:        number;
  };
  salaryPaymentDays: number;
  lunchBreakStart:   string;
  lunchBreakEnd:     string;
}

// ── Per-factory database config ───────────────────────────────────────────────

export type FactoryDbAdapter = 'sheets' | 'mysql' | 'auto';

export interface FactoryDbConfig {
  adapter:       FactoryDbAdapter;
  spreadsheetId?: string;
  sheetsUrl?:    string;
  sheetsKey?:    string;
  mysqlApiUrl?:  string;
  mysqlApiKey?:  string;
}

// ── Full factory definition ───────────────────────────────────────────────────

export interface FactoryConfig {
  id:        string;
  nameEn:    string;
  nameBn:    string;
  addressEn: string;
  addressBn: string;
  active:    boolean;
  /** Google Spreadsheet ID — kept for backward compat with FactoryRegistry helpers.
   *  Prefer setting db.spreadsheetId. This field is read as a fallback only. */
  spreadsheetId?: string;
  db?: FactoryDbConfig;
  /**
   * Optional: sub-factory parent id.
   * Example:
   *   MG_SHIRTEX  → parentFactoryId: undefined   (top-level)
   *   MG_FASHION  → parentFactoryId: 'mg_shirtex' (sub-factory)
   *   MG_APPARELS → parentFactoryId: 'mg_shirtex' (sub-factory)
   */
  parentFactoryId?: string;
  authorities:        FactoryAuthorities;
  meetingAuthorities: MeetingAuthority[];
  committees:         Committee[];
  workerProfile:      WorkerProfile;
  workerGuidelineTopics?: number[];
  /**
   * Canonical HR guideline config — use this for all new and migrated factories.
   * Required for any factory that uses the Worker Guideline module.
   */
  workerGuideline?: WorkerGuideline;
  /**
   * DEPRECATED — use workerGuideline.
   * Still accepted so MgFashion, MgApparels, Mohammadi compile during migration.
   */
  workerGuidelineConfig?: WorkerGuidelineConfig;
}