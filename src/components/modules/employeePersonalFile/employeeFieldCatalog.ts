// ─────────────────────────────────────────────────────────────────────────────
// employeeFieldCatalog.ts — every single-value field of the Employee Personal File, grouped like the form.
// Path: src/components/modules/employeePersonalFile/employeeFieldCatalog.ts
//
// Used by EmployeeExcelImport.tsx so people can tick exactly the columns that exist in their Excel sheet.
// The education and experience tables (form sections 6 and 7) are NOT here — they are lists of rows, not single fields.
// Fields that are filled automatically in the form (attendance bonus, allowances, basic wage, house rent, the
// nominee full-address line) are not here either; the nominee address line is composed during import.
// ─────────────────────────────────────────────────────────────────────────────

export type CatalogSection = 'personal' | 'family' | 'contact' | 'employment' | 'salary' | 'nominee' | 'reference';
export type FieldKind = 'text' | 'date' | 'number' | 'select';

export interface CatalogOption { value: string; label: string; aliases?: string[] }
export interface CatalogField {
  key: string;
  label: string;
  section: CatalogSection;
  kind: FieldKind;
  required?: boolean;                // the "*" fields of the form (needed by the print documents)
  options?: CatalogOption[];
  aliases?: string[];                // other column titles that should map to this field (matched case-insensitively)
}

export const CATALOG_SECTIONS: { id: CatalogSection; title: string }[] = [
  { id: 'personal',   title: 'ব্যক্তিগত তথ্য' },
  { id: 'family',     title: 'পরিবার ও সন্তান' },
  { id: 'contact',    title: 'যোগাযোগ ও ঠিকানা' },
  { id: 'employment', title: 'চাকরির তথ্য' },
  { id: 'salary',     title: 'বেতন ও ব্যাংক' },
  { id: 'nominee',    title: 'নমিনি' },
  { id: 'reference',  title: 'সুপারিশকারী / রেফারেন্স' },
];

/** These three must always be present: the card no identifies the person, the name and joining date make the record usable. */
export const LOCKED_KEYS = ['cardNo', 'fullName', 'joiningDate'];

const GENDER: CatalogOption[] = [
  { value: 'Male', label: 'পুরুষ', aliases: ['male', 'm', 'man'] },
  { value: 'Female', label: 'নারী', aliases: ['female', 'f', 'woman', 'মহিলা'] },
  { value: 'Other', label: 'তৃতীয় লিঙ্গ', aliases: ['other', 'others'] },
];
const MARITAL: CatalogOption[] = [
  { value: 'Single', label: 'অবিবাহিত', aliases: ['single', 'unmarried'] },
  { value: 'Married', label: 'বিবাহিত', aliases: ['married'] },
  { value: 'Divorced', label: 'তালাকপ্রাপ্ত', aliases: ['divorced'] },
];
const BLOOD: CatalogOption[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => {
  const letters = g.replace(/[+-]/g, '').toLowerCase();
  const words = g.endsWith('+') ? ['positive', '+ve', '(+)'] : ['negative', '-ve', '(-)'];
  return { value: g, label: g, aliases: words.map(w => letters + w) };
});
const OT_CAT: CatalogOption[] = [
  { value: 'Elegible', label: 'Elegible', aliases: ['eligible'] },
  { value: 'নন ওভারটাইম', label: 'নন ওভারটাইম', aliases: ['nonovertime', 'non overtime', 'non-ot', 'nonot'] },
];
const SCHEDULE: CatalogOption[] = [
  { value: 'তফসিল-ক', label: 'তফসিল-ক', aliases: ['ক', 'a', 'schedulea'] },
  { value: 'তফসিল-খ', label: 'তফসিল-খ', aliases: ['খ', 'b', 'scheduleb'] },
  { value: 'তফসিল-বহির্ভূত', label: 'তফসিল-বহির্ভূত', aliases: ['বহির্ভূত', 'other', 'excluded'] },
];

const f = (section: CatalogSection, key: string, label: string, kind: FieldKind = 'text', extra: Partial<CatalogField> = {}): CatalogField =>
  ({ key, label, section, kind, ...extra });

export const FIELD_CATALOG: CatalogField[] = [
  // personal
  f('personal', 'fullName', 'পূর্ণ নাম (ইংরেজি)', 'text', { required: true, aliases: ['name', 'full name', 'employee name', 'নাম'] }),
  f('personal', 'fullNameBengali', 'পূর্ণ নাম (বাংলা)', 'text', { required: true, aliases: ['bangla name', 'নাম (বাংলা)'] }),
  f('personal', 'fatherName', 'পিতার নাম', 'text', { required: true, aliases: ['father', "father's name", 'father name'] }),
  f('personal', 'motherName', 'মাতার নাম', 'text', { required: true, aliases: ['mother', "mother's name", 'mother name'] }),
  f('personal', 'dateOfBirth', 'জন্ম তারিখ', 'date', { required: true, aliases: ['dob', 'date of birth', 'birth date'] }),
  f('personal', 'gender', 'লিঙ্গ', 'select', { required: true, options: GENDER, aliases: ['sex'] }),
  f('personal', 'bloodGroup', 'রক্তের গ্রুপ', 'select', { required: true, options: BLOOD, aliases: ['blood group', 'blood'] }),
  f('personal', 'maritalStatus', 'বৈবাহিক অবস্থা', 'select', { options: MARITAL, aliases: ['marital status'] }),
  f('personal', 'nationality', 'জাতীয়তা'),
  f('personal', 'religion', 'ধর্ম'),
  f('personal', 'height', 'উচ্চতা', 'text', { required: true }),
  f('personal', 'weight', 'ওজন', 'text', { required: true }),
  f('personal', 'nid', 'জাতীয় পরিচয়পত্র নং', 'text', { aliases: ['nid', 'nid no', 'national id'] }),
  f('personal', 'birthRegistrationNo', 'জন্ম নিবন্ধন নং', 'text', { aliases: ['birth registration'] }),
  f('personal', 'passportNumber', 'পাসপোর্ট নং', 'text', { aliases: ['passport'] }),
  f('personal', 'drivingLicense', 'ড্রাইভিং লাইসেন্স নং', 'text', { aliases: ['driving license'] }),
  f('personal', 'identificationMark', 'সনাক্তকরণ চিহ্ন', 'text', { required: true }),
  // family
  f('family', 'spouseName', 'স্বামী/স্ত্রীর নাম', 'text', { required: true, aliases: ['spouse', 'spouse name'] }),
  f('family', 'spouseDob', 'স্বামী/স্ত্রীর জন্ম তারিখ', 'date'),
  f('family', 'spouseBloodGroup', 'স্বামী/স্ত্রীর রক্তের গ্রুপ'),
  f('family', 'spouseProfession', 'স্বামী/স্ত্রীর পেশা'),
  f('family', 'spousePhone', 'স্বামী/স্ত্রীর মোবাইল'),
  f('family', 'spouseEducation', 'স্বামী/স্ত্রীর শিক্ষাগত যোগ্যতা'),
  f('family', 'numberOfSons', 'পুত্র সন্তান', 'number'),
  f('family', 'numberOfDaughters', 'কন্যা সন্তান', 'number'),
  // contact
  f('contact', 'mobile', 'মোবাইল নম্বর', 'text', { aliases: ['mobile', 'phone', 'mobile no', 'cell'] }),
  f('contact', 'email', 'ইমেইল ঠিকানা', 'text', { aliases: ['email', 'e-mail'] }),
  f('contact', 'onnano', 'অন্যান্য যোগাযোগ'),
  f('contact', 'presentHouseNo', 'বর্তমান: বাড়ি/রাস্তা', 'text', { required: true }),
  f('contact', 'presentUnion', 'বর্তমান: ইউনিয়ন/পৌরসভা'),
  f('contact', 'presentVillage', 'বর্তমান: গ্রাম', 'text', { required: true }),
  f('contact', 'presentPostOffice', 'বর্তমান: ডাকঘর', 'text', { required: true }),
  f('contact', 'presentThana', 'বর্তমান: থানা', 'text', { required: true }),
  f('contact', 'presentDistrict', 'বর্তমান: জেলা', 'text', { required: true }),
  f('contact', 'presentDivision', 'বর্তমান: বিভাগ'),
  f('contact', 'permanentHouseNo', 'স্থায়ী: বাড়ি/রাস্তা', 'text', { required: true }),
  f('contact', 'permanentUnion', 'স্থায়ী: ইউনিয়ন/পৌরসভা'),
  f('contact', 'permanentVillage', 'স্থায়ী: গ্রাম', 'text', { required: true }),
  f('contact', 'permanentPostOffice', 'স্থায়ী: ডাকঘর', 'text', { required: true }),
  f('contact', 'permanentThana', 'স্থায়ী: থানা', 'text', { required: true }),
  f('contact', 'permanentDistrict', 'স্থায়ী: জেলা', 'text', { required: true }),
  f('contact', 'permanentDivision', 'স্থায়ী: বিভাগ'),
  f('contact', 'emergencyName', 'জরুরি যোগাযোগ: নাম'),
  f('contact', 'emergencyRelation', 'জরুরি যোগাযোগ: সম্পর্ক'),
  f('contact', 'emergencyMobile', 'জরুরি যোগাযোগ: মোবাইল'),
  f('contact', 'emergencyProfession', 'জরুরি যোগাযোগ: পেশা'),
  // employment
  f('employment', 'idNo', 'আইডি নং', 'text', { required: true, aliases: ['id', 'id no', 'employee id'] }),
  f('employment', 'cardNo', 'কার্ড নং', 'text', { required: true, aliases: ['card', 'card no', 'card number'] }),
  f('employment', 'proximityNumber', 'প্রক্সিমিটি নম্বর', 'text', { required: true, aliases: ['proximity', 'proximity no'] }),
  f('employment', 'grade', 'গ্রেড', 'text', { required: true, aliases: ['grade'] }),
  f('employment', 'otCategory', 'ওভারটাইম ক্যাটাগরি', 'select', { required: true, options: OT_CAT, aliases: ['ot category'] }),
  f('employment', 'wagesSchedule', 'মজুরি তফসিল', 'select', { required: true, options: SCHEDULE, aliases: ['wages schedule', 'schedule'] }),
  f('employment', 'sectionLine', 'সেকশন/লাইন', 'text', { required: true, aliases: ['section', 'line', 'section/line'] }),
  f('employment', 'designation', 'পদবি', 'text', { required: true, aliases: ['designation'] }),
  f('employment', 'department', 'বিভাগ', 'text', { required: true, aliases: ['department', 'dept'] }),
  f('employment', 'joiningDate', 'যোগদানের তারিখ', 'date', { required: true, aliases: ['joining date', 'doj', 'date of joining'] }),
  f('employment', 'jobSource', 'নিয়োগ সূত্র', 'text', { aliases: ['job source'] }),
  // salary
  f('salary', 'grossSalary', 'মাসিক বেতন (মোট)', 'number', { required: true, aliases: ['gross', 'gross salary', 'salary'] }),
  f('salary', 'tinNumber', 'টিন নম্বর', 'text', { aliases: ['tin'] }),
  f('salary', 'bankName', 'ব্যাংকের নাম', 'text', { aliases: ['bank', 'bank name'] }),
  f('salary', 'bankAccountNo', 'ব্যাংক হিসাব নম্বর', 'text', { aliases: ['account no', 'bank account'] }),
  f('salary', 'bankBranch', 'শাখার নাম', 'text', { aliases: ['branch'] }),
  // nominee
  f('nominee', 'nomineeName', 'নমিনির নাম', 'text', { required: true, aliases: ['nominee', 'nominee name'] }),
  f('nominee', 'nomineeRelation', 'নমিনির সম্পর্ক', 'text', { required: true, aliases: ['nominee relation'] }),
  f('nominee', 'nomineePercentage', 'নমিনির অংশের শতাংশ', 'number', { required: true }),
  f('nominee', 'nomineeNid', 'নমিনির এনআইডি', 'text', { required: true }),
  f('nominee', 'nomineeDob', 'নমিনির জন্ম তারিখ', 'date', { required: true }),
  f('nominee', 'nomineeEducation', 'নমিনির শিক্ষা', 'text', { required: true }),
  f('nominee', 'nomineeProfession', 'নমিনির পেশা', 'text', { required: true }),
  f('nominee', 'nomineePhone', 'নমিনির মোবাইল', 'text', { required: true }),
  f('nominee', 'nomineeBloodGroup', 'নমিনির রক্তের গ্রুপ'),
  f('nominee', 'nomineeVillage', 'নমিনি: গ্রাম', 'text', { required: true }),
  f('nominee', 'nomineePostOffice', 'নমিনি: ডাকঘর', 'text', { required: true }),
  f('nominee', 'nomineeThana', 'নমিনি: থানা', 'text', { required: true }),
  f('nominee', 'nomineeDistrict', 'নমিনি: জেলা', 'text', { required: true }),
  // reference
  f('reference', 'supervisorName', 'সুপারিশকারীর নাম'),
  f('reference', 'supervisorOrg', 'সুপারিশকারীর প্রতিষ্ঠান'),
  f('reference', 'supervisorDesignation', 'সুপারিশকারীর পদবি'),
  f('reference', 'supervisorProfession', 'সুপারিশকারীর পেশা'),
  f('reference', 'supervisorPhone', 'সুপারিশকারীর মোবাইল'),
  f('reference', 'supervisorRelation', 'সুপারিশকারীর সম্পর্ক'),
  f('reference', 'supervisorAddress', 'সুপারিশকারীর ঠিকানা'),
];

export const FIELD_BY_KEY: Record<string, CatalogField> = Object.fromEntries(FIELD_CATALOG.map(x => [x.key, x]));