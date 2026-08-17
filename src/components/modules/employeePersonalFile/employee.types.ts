import { FACTORY_NAME_BN, FACTORY_ADDRESS_BN, FACTORY_REGISTRY } from '../../../factories/FactoryRegistry';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { calculateBasicFromGross, calculateHourlyOvertimeRate, DEFAULT_FOOD_ALLOWANCE, DEFAULT_MEDICAL_ALLOWANCE, DEFAULT_TRANSPORT_ALLOWANCE } from '../../../utils/sharedFormulas';
// employee.types.ts (Optimized & Standard)

// ============= INTERFACES =============

/** Central employee record type used throughout the personal file module. */
export const generateEntryId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export interface EducationEntry {
  id: string;
  education: string;
  institution: string;
  educationGroup: string;
  educationResult: string;
  educationBoard: string;
  passingYear: string;
}

export interface PreviousJobEntry {
  id: string;
  prevCompanyName: string;
  prevDesignation: string;
  prevSection: string;
  prevCompanyPhone: string;
  prevServiceYears: string;   // চাকরির বছর
  prevStartDate: string;      // শুরুর তারিখ (auto = endDate - serviceYears)
  prevEndDate: string;
  prevLeaveReason: string;
  prevRefDetails: string;     // রেফারেন্স বিস্তারিত (single field)
}

export interface EmployeeFormData {
  /** Document date — shown/edited via ModuleShell's header date picker */
  date: string;
  // Personal Information
  fullName: string;
  fullNameBengali: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  nid: string;
  
  // Contact Information
  presentAddress: string;
  permanentAddress: string;
  mobile: string;
  email: string;
  onnano: string;           // অন্যান্য যোগাযোগ
  
  // Present Address Details
  presentHouseNo: string;   // বাড়ি / বাড়ি নং / রাস্তা
  presentUnion: string;
  presentVillage: string;
  presentPostOffice: string;
  presentThana: string;
  presentDistrict: string;
  presentDivision: string;
  
  // Permanent Address Details
  permanentHouseNo: string; // বাড়ি / বাড়ি নং / রাস্তা
  permanentUnion: string;
  permanentVillage: string;
  permanentPostOffice: string;
  permanentThana: string;
  permanentDistrict: string;
  permanentDivision: string;
  
  // Employment Information
  employeeId: string;
  designation: string;
  department: string;
  joiningDate: string;
  grossSalary: string;       // মাসিক বেতন (মোট) — বেতন বিভাজন
  attendanceBonus: string;   // হাজিরা বোনাস (হাজিরা বোনাস ৭২৫ টাকা)
  cardNo: string;
  idNo: string;
  proximityNumber: string;
  grade: string;
  /** OT Category — controls whether an OT rate is shown on the appointment letter */
  otCategory: string;      // 'OT' | 'Non OT'
  /** Wages Schedule — তফসিল-ক (RMG worker) vs তফসিল-খ (staff/clerk),
     controls which probation-period clause appears on the appointment
     letter (3+3 months -> শ্রমিক vs flat 6 months -> কর্মচারী). */
  wagesSchedule: string;   // 'Schedule-Ka' | 'Schedule-Kha'
  sectionLine: string;
  fixedSalary: string;
  
  // Salary Components
  basicSalary: string;
  houseRent: string;
  medicalAllowance: string;
  transportAllowance: string;
  foodAllowance: string;
  
  // Physical Information
  height: string;
  weight: string;
  identificationMark: string;
  
  // Documents
  birthRegistrationNo: string;
  passportNumber: string;
  drivingLicense: string;    // ড্রাইভিং লাইসেন্স
  tinNumber: string;
  
  // Spouse Information
  spouseName: string;
  spouseBloodGroup: string;
  spousePhone: string;
  spouseProfession: string;
  spouseDob: string;
  spouseEducation: string;
  numberOfSons: string;
  numberOfDaughters: string;
  
  // Education — multiple entries supported
  educationHistory: EducationEntry[];
  
  // Previous Employment — multiple entries supported
  previousJobs: PreviousJobEntry[];
  
  // Emergency Contact
  emergencyName: string;
  emergencyRelation: string;
  emergencyMobile: string;
  emergencyProfession: string;
  
  // Nominee Information
  nomineeName: string;
  nomineeRelation: string;
  nomineeNid: string;
  nomineeAddress: string;
  nomineePercentage: string;
  nomineeProfession: string;
  nomineeUnion: string;
  nomineeVillage: string;
  nomineePostOffice: string;
  nomineeThana: string;
  nomineeDistrict: string;
  nomineeDob: string;
  nomineePhone: string;
  nomineeEducation: string;
  nomineeBloodGroup: string;
  
  // Supervisor/Reference
  supervisorName: string;
  supervisorOrg: string;
  supervisorProfession: string;
  supervisorDesignation: string;
  supervisorAddress: string;
  supervisorRelation: string;
  supervisorPhone: string;
  
  // Banking
  bankName: string;
  bankAccountNo: string;
  bankBranch: string;
  
  // Company
  companyName: string;
  companyAddress: string;
  
  // Other
  jobSource: string;
  localRepresentative: string;
  greeting: string;
}

export interface AgeData {
  years: number;
  months: number;
  days: number;
}

export interface DocumentProps {
  formData: EmployeeFormData;
}

export interface SalaryBreakdown {
  basic: string;
  houseRent: string;
  medical: string;
  transport: string;
  food: string;
  total: string;
  /** Formatted hourly overtime rate — (basic/208)×2, RMG standard. Only
     meaningful for display when otCategory === 'OT'. */
  hourlyOvertimeRate: string;
}

export interface WageComponents {
  basicWage: number;
  houseRent: number;
  dailyBasic: number;
  dailyGross: number;
  hourlyOvertimeRate: number;
}

export interface AppointmentCondition {
  id: string | number;
  title: string;
  content: string;
  subConditions?: SubCondition[];
}

export interface SubCondition { 
  key: string; 
  value: string; 
}

export type DocType = 'appointment' | 'nominee' | 'age' | 'idcard' | 'personal' | 'leftnotice' | null;

// ============= CONSTANTS =============

// AUDIT FIX: was DEFAULT_SALARY = 13500 — but this constant only ever
// feeds the `salary` field, which (per its own comment below) actually
// means হাজিরা বোনাস (Attendance Bonus), not monthly salary. 13500 was a
// salary-sized number leaking into a bonus field. Correct value per the
// law-reference note already in this file: 'হাজিরা বোনাস ৭২৫ টাকা।'
// Renamed for clarity so this can't happen again.
const DEFAULT_ATTENDANCE_BONUS = 725;
const DEFAULT_MEDICAL = 750;
const DEFAULT_TRANSPORT = 450;
const DEFAULT_FOOD = 1250;

const WORKING_DAYS_PER_MONTH = 30;
// AUDIT FIX (consolidation): WORKING_HOURS_PER_MONTH, OVERTIME_MULTIPLIER,
// HOUSE_RENT_PERCENTAGE and BASIC_WAGE_DIVISOR used to be local constants
// duplicating utils/sharedFormulas.ts's defaults exactly. Now uses the
// shared calculateBasicFromGross()/calculateHourlyOvertimeRate() directly
// (imported above) instead of reimplementing the same formula here.
const HOUSE_RENT_PERCENTAGE = 0.5;

// ============= INITIAL DATA =============

/** @deprecated Use EmployeeFormData. Kept for internal compatibility. */
export type FormData = EmployeeFormData;

export const initialFormData: EmployeeFormData = {
  date: '',
  // Personal
  fullName: '',
  fullNameBengali: '',
  fatherName: '',
  motherName: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  maritalStatus: '',
  nationality: 'Bangladeshi',
  religion: '',
  nid: '',
  
  // Contact
  presentAddress: '',
  permanentAddress: '',
  mobile: '',
  email: '',
  onnano: '',
  
  // Present Address
  presentHouseNo: '',
  presentUnion: '',
  presentVillage: '',
  presentPostOffice: '',
  presentThana: '',
  presentDistrict: '',
  presentDivision: '',
  
  // Permanent Address
  permanentHouseNo: '',
  permanentUnion: '',
  permanentVillage: '',
  permanentPostOffice: '',
  permanentThana: '',
  permanentDistrict: '',
  permanentDivision: '',
  
  // Employment
  employeeId: '',
  designation: '',
  department: '',
  joiningDate: '',
  grossSalary: '',
  cardNo: '',
  idNo: '',
  proximityNumber: '',
  grade: '',
  otCategory: '',
  wagesSchedule: '',
  sectionLine: '',
  fixedSalary: '',
  attendanceBonus: String(DEFAULT_ATTENDANCE_BONUS),
  // Salary Components
  basicSalary: '',
  houseRent: '',
  medicalAllowance: String(DEFAULT_MEDICAL),
  transportAllowance: String(DEFAULT_TRANSPORT),
  foodAllowance: String(DEFAULT_FOOD),
  
  // Physical
  height: '',
  weight: '',
  identificationMark: '',
  
  // Documents
  birthRegistrationNo: '',
  passportNumber: '',
  drivingLicense: '',
  tinNumber: '',
  
  // Spouse
  spouseName: '',
  spouseBloodGroup: '',
  spousePhone: '',
  spouseProfession: '',
  spouseDob: '',
  spouseEducation: '',
  numberOfSons: '0',
  numberOfDaughters: '0',
  
  // Education — multiple entries supported
  educationHistory: [],
  
  // Previous Employment — multiple entries supported
  previousJobs: [],
  
  // Emergency
  emergencyName: '',
  emergencyRelation: '',
  emergencyMobile: '',
  emergencyProfession: '',
  
  // Nominee
  nomineeName: '',
  nomineeRelation: '',
  nomineeNid: '',
  nomineeAddress: '',
  nomineePercentage: '100',
  nomineeProfession: '',
  nomineeUnion: '',
  nomineeVillage: '',
  nomineePostOffice: '',
  nomineeThana: '',
  nomineeDistrict: '',
  nomineeDob: '',
  nomineePhone: '',
  nomineeEducation: '',
  nomineeBloodGroup: '',
  
  // Supervisor
  supervisorName: '',
  supervisorOrg: '',
  supervisorProfession: '',
  supervisorDesignation: '',
  supervisorAddress: '',
  supervisorRelation: '',
  supervisorPhone: '',
  
  // Banking
  bankName: '',
  bankAccountNo: '',
  bankBranch: '',
  
  // Company
  companyName: FACTORY_NAME_BN,  // from factory config — Bengali, matches this module's fully-Bengali appointment letter
  companyAddress: FACTORY_ADDRESS_BN,
  
  // Other
  jobSource: '',
  localRepresentative: '',
  greeting: 'জনাব/জনাবা,',
};

// ============= UTILITY FUNCTIONS =============

/**
 * Safe number parser with fallback
 */
const parseNumber = (value: string | number, fallback: number = 0): number => {
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Format number to 2 decimal places
 */
const formatCurrency = (value: number): string => {
  return value.toFixed(2);
};

// AUDIT FIX: formatCurrency()'s output gets re-parsed via parseFloat()
// inside calculateWageComponents() below (for rounding) — parseFloat
// cannot read Bengali-script digits (returns NaN), so formatCurrency
// itself MUST stay English. This separate wrapper is for the FINAL
// display values only (getSalaryBreakdown()'s return), never fed back
// into parseFloat.
const formatCurrencyBn = (value: number): string => toBanglaNumber(formatCurrency(value));

/**
 * Calculate wage components from total monthly wage
 */
export const calculateWageComponents = (
  totalMonthlyWage: number,
  foodAllowance: number,
  medicalAllowance: number,
  transportAllowance: number
): WageComponents => {
  if (totalMonthlyWage <= 0) {
    return {
      basicWage: 0,
      houseRent: 0,
      dailyBasic: 0,
      dailyGross: 0,
      hourlyOvertimeRate: 0
    };
  }

  const totalAllowances = foodAllowance + medicalAllowance + transportAllowance;
  const basic = calculateBasicFromGross(totalMonthlyWage, totalAllowances);
  const house = basic * HOUSE_RENT_PERCENTAGE;
  const dailyBasic = basic / WORKING_DAYS_PER_MONTH;
  const dailyGross = totalMonthlyWage / WORKING_DAYS_PER_MONTH;
  const hourlyOvertimeRate = calculateHourlyOvertimeRate(basic);

  return {
    basicWage: parseFloat(formatCurrency(basic)),
    houseRent: parseFloat(formatCurrency(house)),
    dailyBasic: parseFloat(formatCurrency(dailyBasic)),
    dailyGross: parseFloat(formatCurrency(dailyGross)),
    hourlyOvertimeRate: parseFloat(formatCurrency(hourlyOvertimeRate))
  };
};

/**
 * Get calculated salary breakdown
 */
export const getSalaryBreakdown = (formData: EmployeeFormData): SalaryBreakdown => {
  // grossSalary is the new বেতন বিভাজন field; fall back to salary if not set
  const totalSalary = parseNumber((formData as any).grossSalary || 0);
  const food = parseNumber(formData.foodAllowance);
  const medical = parseNumber(formData.medicalAllowance);
  const transport = parseNumber(formData.transportAllowance);

  const components = calculateWageComponents(totalSalary, food, medical, transport);

  // AUDIT FIX: calculateWageComponents() -> calculateBasicFromGross()
  // already falls back to DEFAULT_TOTAL_ALLOWANCES (2450) internally
  // when food+medical+transport are all 0/empty, so the computed basic
  // salary correctly assumes 2450 was deducted — but the DISPLAYED
  // itemized lines (গ/ঘ/ঙ) were showing the raw 0 values regardless,
  // so the printed breakdown didn't sum to মোট (confirmed against a
  // real exported appointment letter: basic+houseRent = 13,080 but মোট
  // showed 15,530 — a silent 2,450 gap). Same fallback now applied to
  // what's actually displayed, so the breakdown is internally consistent.
  const hasAnyAllowance = food > 0 || medical > 0 || transport > 0;
  const displayFood      = hasAnyAllowance ? food      : DEFAULT_FOOD_ALLOWANCE;
  const displayMedical   = hasAnyAllowance ? medical   : DEFAULT_MEDICAL_ALLOWANCE;
  const displayTransport = hasAnyAllowance ? transport : DEFAULT_TRANSPORT_ALLOWANCE;

  return {
    basic: formatCurrencyBn(components.basicWage),
    houseRent: formatCurrencyBn(components.houseRent),
    medical: formatCurrencyBn(displayMedical),
    transport: formatCurrencyBn(displayTransport),
    food: formatCurrencyBn(displayFood),
    total: formatCurrencyBn(totalSalary),
    hourlyOvertimeRate: formatCurrencyBn(components.hourlyOvertimeRate)
  };
};

/**
 * Adds N months to a date and returns it formatted DD/MM/YYYY — used for
 * both the 3-month and 6-month probation milestones (Schedule-Ka needs
 * both, Schedule-Kha needs only the 6-month one).
 */
const addMonthsFormatted = (joiningDate: string, months: number): string => {
  if (!joiningDate) return '';
  const date = new Date(joiningDate);
  date.setMonth(date.getMonth() + months);
  return toBanglaNumber(date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }));
};

/**
 * Format date to DD/MM/YYYY
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return toBanglaNumber(date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }));
};

// ============= APPOINTMENT CONDITIONS =============

export const getAppointmentConditions = (formData: EmployeeFormData): AppointmentCondition[] => {
  const salary = getSalaryBreakdown(formData);
  const joiningDateFormatted = formatDate(formData.joiningDate);
  const plus3Months = addMonthsFormatted(formData.joiningDate, 3);
  const plus6Months = addMonthsFormatted(formData.joiningDate, 6);

  // তফসিল-ক (RMG শ্রমিক): 3 months, extendable to 6 if not proven
  // competent, becomes permanent শ্রমিক.
  // তফসিল-খ (staff/কর্মচারী): flat 6 months, becomes permanent কর্মচারী.
  // Exact wording confirmed against the reference text, not paraphrased.
let probationClause = '';

  switch (formData.wagesSchedule) {
    case 'তফসিল-ক':
      probationClause = `আপনার শিক্ষানবিশকাল ${joiningDateFormatted} ইং থেকে ${plus3Months} ইং তারিখ পর্যন্ত ৩ (তিন) মাস। অধিকন্তু, দক্ষতা প্রমান না করিতে পারিলে কর্তৃপক্ষ আরও ৩ (তিন) মাস সময় শিক্ষানবীশকাল হিসাবে বৃদ্ধি করে ${plus6Months} ইং তারিখ পর্যন্ত করিতে পারিবেন। উল্লেখ্য যে শিক্ষানবিশকাল সন্তোষজনকভাবে শেষ করতে পারলে আপনি সংশ্লিষ্ট গ্রেড এর স্থায়ী শ্রমিক হিসাবে নিযুক্ত হবেন।`;
      break;

    case 'তফসিল-খ':
      probationClause = `আপনার শিক্ষানবিশকাল ${joiningDateFormatted} ইং থেকে ${plus6Months} ইং তারিখ পর্যন্ত ৬ (ছয়) মাস। উল্লেখ্য যে শিক্ষানবিশকাল সন্তোষজনকভাবে শেষ করতে পারলে আপনি সংশ্লিষ্ট গ্রেড এর স্থায়ী কর্মচারী হিসাবে নিযুক্ত হবেন।`;
      break;

    case 'তফসিল-বহির্ভূত':
    default: // Falls back here if none of the above matches
      probationClause = `আপনার শিক্ষানবিশকাল ${joiningDateFormatted} ইং থেকে ${plus6Months} ইং তারিখ পর্যন্ত ৬ (ছয়) মাস। উল্লেখ্য যে শিক্ষানবিশকাল সন্তোষজনকভাবে শেষ করতে পারলে আপনি সংশ্লিষ্ট পদে স্থায়ী হিসাবে নিযুক্ত হবেন।`;
      break;
  }
  let overtimeContent = '';

    switch (formData.otCategory) {
      case 'Elegible':
        default:
        overtimeContent = `মূল মজুরির দ্বিগুন [গণনা: (মূল মজুরী / ২০৮) × ২] হারে সমন্বয় করা হবে। আপনার ওভারটাইমের হার: ${salary.hourlyOvertimeRate} টাকা।`;
        break;

      case 'নন ওভারটাইম':
        overtimeContent = 'প্রযোজ্য নয়।';
        break;
    }
let incrementContent = '';

switch (formData.wagesSchedule) {
  case 'তফসিল-ক':
  case 'তফসিল-খ':
    incrementContent = 'মূল বেতনের ৯% হারে প্রতি বৎসরে একবার বেতন বৃদ্ধি করা হয়।';
    break;

  case 'তফসিল-বহির্ভূত':
  default:
    incrementContent = 'কোম্পানী নীতিমালা অনুযায়ী।';
    break;
}
  return [
    {
      id: 'greeting',
      title: 'জনাব/জনাবা,',
      content: ''
    },
    {
      id: 'recruit',
      title: '',
      content: `আপনার আবেদন ও কর্তৃপক্ষের সাথে সাক্ষাৎকারের ভিত্তিতে আপনাকে ${formData.companyName} এ ${formData.department} বিভাগে ${formData.designation} পদে ${toBanglaNumber(formData.grade)} নং গ্রেড এ ${joiningDateFormatted} ইং তারিখ থেকে নিম্নোক্ত শর্তে নিয়োগ প্রদান করা হল।`
    },
    {
      id: 'terms-header',
      title: 'শর্তাবলী :',
      content: ''

    },
{
      id: 1,
      title: '১. শিক্ষানবিশকাল :',
      content: probationClause
    },
    {
      id: 2,
      title: '২. মাসিক বেতন বিবরণ ',
      content: '',
      subConditions: [
        { key: 'ক) মূল বেতন', value: `${salary.basic} টাকা` },
        { key: 'খ) বাড়ী ভাড়া ভাতা ৫০%', value: `${salary.houseRent} টাকা` },
        { key: 'গ) চিকিৎসা ভাতা', value: `${salary.medical} টাকা` },
        { key: 'ঘ) যাতায়াত ভাতা', value: `${salary.transport} টাকা` },
        { key: 'ঙ) খাদ্য ভাতা', value: `${salary.food} টাকা` },
        { key: 'মোট', value: `${salary.total} টাকা।` },
      ]
    },

// array element
{
  id: 3,
  title: '৩. ওভারটাইম :',
  content: overtimeContent
},
{
  id: 4,
  title: '৪. বাৎসরিক বেতন বৃদ্ধি :',
  content: incrementContent
},
    {
      id: 5,
      title: '৫. কর্ম সময় ও মধ্যাহ্ন বিরতি :',
      content: '(ক) সাধারণ কর্ম সময় দৈনিক ০৮ (আট) ঘন্টা, (খ) মধ্যাহ্ন বিরতি ১ ঘন্টা, স্ব-স্ব অফিস ব্যবস্থাপনা অনুযায়ী।'
    },
    {
      id: 6,
      title: '৬. ছুটি :',
      content: '(ক) সাপ্তাহিক ছুটি: শুক্রবার, (খ) নৈমিত্তিক ছুটি: পূর্ণ বেতনে বছরে ১০ (দশ) দিন, (গ) অসুস্থতা ছুটি: পূর্ণ বেতনে বছরে ১৪ (চৌদ্দ) দিন, (ঘ) অর্জিত ছুটি: প্রতি ১৮ (আঠারো) কর্মদিবসের জন্য ০১ (এক) দিন, (ঙ) উৎসব ছুটি: কমপক্ষে বছরে ১৩ (তেরো) দিন, (চ) মাতৃকল্যাণ ছুটি: প্রসবের পূর্বে ৬০ (ষাট) দিন এবং প্রসবের দিন সহ প্রসব পরবর্তী ৬০ (ষাট) দিন, মোট ১২০ (এক শত বিশ দিন)। আরো শর্ত থাকে যে, প্রসূতি কল্যাণ ছুটিতে যাইবার নির্ধারিত তারিখের পূর্বে কোনো নারী শ্রমিকের গর্ভপাত ঘটিলে তিনি স্বাস্থ্যগত কারণে পরবর্তী ৪ (চার) সপ্তাহ ছুটি ভোগ করিতে পারিবেন।'
    },
    {
      id: 7,
      title: '৭. বোনাস :',
      content: formData.otCategory === 'ওভারটাইম'
      ?'(ক) হাজিরা বোনাস ৭২৫ (সাতশত পঁচিশ টাকা) টাকা। তবে দুইদিনের অধিক লেট, কারখানায় অনুপস্থিত থাকিলে ইহা প্রাপ্য হইবে না। (খ) বছরে দুটি উৎসব বোনাস প্রদান করা হয় (মোট বেতনের ৫০%), যা চাকুরীর বয়স ছয় মাস পূর্ণ হইলে প্রাপ্য হইবে।'
      : 'বছরে দুটি উৎসব বোনাস প্রদান করা হয় (মোট বেতনের ৫০%), যা চাকুরীর বয়স ছয় মাস পূর্ণ হইলে প্রাপ্য হইবে।'
    },
    {
      id: 8,
      title: '৮. বেতন পরিশোধ :',
      content: 'মজুরী মাস শেষ হওয়ার পরবর্তী ০৭ (সাত) কর্মদিবসের মধ্যে পরিশোধ করা হয়।'
    },
    {
      id: 9,
      title: '৯. অভিযোগ :',
      content: 'আপনার অভিযোগ কোম্পানী নীতিমালা অনুযায়ী অভিযোগ বাক্স, হট লাইন বা ওপেন ডোর নীতির মাধ্যমে মৌখিক/লিখিতভাবে জানাইতে পারেন।'
    },
  {
      id: 10,
      title: '১০. চাকুরীর অবসান :',
      content: formData.otCategory === 'ওভারটাইম'
        ? '(ক) মালিক কর্তৃক চাকুরীর অবসান: মাসিক মজুরীর ভিত্তিতে নিয়োজিত স্থায়ী শ্রমিকের ক্ষেত্রে ১২০ (একশত বিশ) দিনের নোটিশ এবং অস্থায়ী শ্রমিকের ক্ষেত্রে ৩০ (ত্রিশ) দিনের নোটিশ প্রদান করা হইবে। অন্যথায় নোটিশ মেয়াদের সমপরিমাণ মজুরী প্রদান করিতে বাধ্য থাকিবেন। (খ) শ্রমিক কর্তৃক চাকুরীর অবসান: স্থায়ী শ্রমিক ৬০ (ষাট) দিনের নোটিশ এবং অস্থায়ী শ্রমিক ৩০ (ত্রিশ) দিনের নোটিশ নিয়োগকর্তাকে প্রদান করিবেন। অন্যথায় নোটিশ মেয়াদের সমপরিমাণ মজুরী ফেরৎ দিতে বাধ্য থাকিবেন।'
        : '(ক) মালিক কর্তৃক চাকুরীর অবসান: মাসিক মজুরীর ভিত্তিতে নিয়োজিত স্থায়ী কর্মচারীর ক্ষেত্রে এক মাসের লিখিত নোটিশ অথবা এক মাসের বেতন প্রদান করবেন। (খ) কর্মচারী কর্তৃক চাকুরীর অবসান: এক মাসের লিখিত নোটিশ প্রদান করিবেন অথবা কোম্পানীর নিকট এক মাসের বেতন প্রদান করিবেন।'
    },
    {
      id: 11,
      title: '১১. অসদাচরণ :',
      content: 'আদেশ অমান্য ও অবাধ্যতা, চুরি, প্রতারণা ও অসাধুতা, ঘুষ লেনদেন, অননুমোদিত অনুপস্থিতি, অভ্যাসগত বিলম্বে উপস্থিতি, আইন ও আচরণবিধি লঙ্ঘন, উচ্ছৃঙ্খলা ও ভাঙচুর, কাজে গাফিলতি, রেকর্ড জালিয়াতি ও রদবদল, হয়রানিমূলক আচরণ ইত্যাদি।'
    },
    {
      id: 12,
      title: '১২. শাস্তি :',
      content: 'কর্তৃপক্ষ বিশেষ অবস্থার পরিপ্রেক্ষিতে নিম্নলিখিত যে কোন শাস্তি প্রদান করিতে পারেঃ (ক) অপসারণ, (খ) অনধিক এক বৎসরের জন্য নীচের পদে, গ্রেডে বা বেতন স্কেলে আনয়ন, (গ) অনধিক এক বৎসরের জন্য পদোন্নতি বন্ধ, (ঘ) অনধিক এক বৎসরের জন্য মজুরী বৃদ্ধি বন্ধ, (ঙ) জরিমানা, (চ) অনধিক সাত দিন পর্যন্ত বিনা মজুরীতে বা বিনা খোরাকীতে সাময়িক বরখাস্ত, (ছ) ভর্ৎসনা ও সতর্কীকরণ।'
    },
    {
      id: 13,
      title: '১৩. বিবিধ :',
      content: '(ক) বদলী: কোম্পানীর প্রয়োজনে অন্য যে কোন কারখানায় বদলী করিতে পারিবে, (খ) ঠিকানা পরিবর্তন: আপনার ঠিকানা পরিবর্তন করিলে ০৭ (সাত) দিনের মধ্যে অফিসকে লিখিতভাবে জানাইতে হইবে।'
    },
    {
      id: 14,
      title: '১৪. চাকরি বিধি :',
      content: 'নিয়োগের যাবতীয় শর্ত প্রতিষ্ঠানে বিদ্যমান চাকরি বিধি ও প্রচলিত শ্রম আইন অনুযায়ী পরিচালিত হইবে।'
    },
    {
      id: 15,
      title: '** সম্মতি :',
      content: 'আমি সুস্থ ও সজ্ঞানে উল্লেখিত শর্তে সম্মত হয়ে নিয়োগ পত্রে স্বাক্ষর করিলাম এবং ১ (এক) কপি অনুলিপি গ্রহণ করিলাম।'
    }
  ];
};

// ============= STATIC DATA =============

export const STATIC_DATA = {
  // Dynamically built from FACTORY_REGISTRY — all active factories included automatically.
  // Adding a new factory file updates this list with no changes required here.
  companyOptions: FACTORY_REGISTRY
    .filter(f => f.active)
    .flatMap(f => [f.nameEn, f.nameBn]),
  addressOptions: FACTORY_REGISTRY
    .filter(f => f.active)
    .flatMap(f => [f.addressEn, f.addressBn]),
  bengaliMonths: [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ],
  benefitInstallments: [
    { value: 'প্রথম কিস্তি', label: 'প্রথম কিস্তি' },
    { value: 'দ্বিতীয় কিস্তি', label: 'দ্বিতীয় কিস্তি' },
  ],
  benefitTypes: [
    { value: 'দিন', label: 'দিন' },
    { value: 'টাকা', label: 'টাকা' },
  ],
} as const;