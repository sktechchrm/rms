// ─────────────────────────────────────────────────────────────────────────────
// REPORT CONFIG — Config-driven column and filter definitions per module
//
// Adding a new module to reports:
//   1. Add an entry to REPORT_CONFIGS
//   2. Define columns (key maps to Google Sheets column names)
//   3. Define filters (fields shown in the top filter bar)
// ─────────────────────────────────────────────────────────────────────────────

import type { DbModule as SheetModule } from '../../../business/DataUseCases';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'badge';

export interface ReportColumn {
  key:       string;          // Maps to Google Sheets column name
  label:     string;          // Column header displayed
  type:      ColumnType;
  sortable?: boolean;
  width?:    number;          // px hint for table layout
  /** For badge type — maps value → color */
  badgeMap?: Record<string, { bg: string; text: string }>;
  /** Format value before displaying */
  format?:   (val: string | number) => string;
}

export interface ReportFilter {
  key:         string;        // Record field to filter on
  label:       string;
  type:        'text' | 'date' | 'select';
  options?:    { value: string; label: string }[];
}

export interface ReportConfig {
  module:      SheetModule;
  labelBn:     string;        // Bangla label
  labelEn:     string;
  icon:        string;        // Emoji
  /** Which of the 3 confirmed module categories this belongs to — used
     to group the module-picker grid, matching Navigation.tsx/Dashboard.
     Optional so nothing breaks if a future config omits it. */
  category?:   'core' | 'lifecycle' | 'compliance';
  columns:     ReportColumn[];
  filters:     ReportFilter[];
  /** Fields to show in the detail modal — defaults to all columns */
  detailFields?: { key: string; label: string; span?: number }[];
}

// ── Currency formatter ────────────────────────────────────────────────────────

export const formatCurrency = (val: string | number): string => {
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(n)) return '—';
  return `৳ ${n.toLocaleString('en-BD')}`;
};

export const formatDate = (val: string | number): string => {
  if (!val) return '—';
  try {
    return new Date(String(val)).toLocaleDateString('en-BD', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return String(val); }
};

// ── Configs ───────────────────────────────────────────────────────────────────

export const REPORT_CONFIGS: ReportConfig[] = [
  // ── Employees ─────────────────────────────────────────────────────────────
  {
    module:  'employees',
    category: 'core',
    labelBn: 'কর্মী ব্যক্তিগত ফাইল',
    labelEn: 'Employee Personal File',
    icon:    '👤',
    columns: [
      { key: 'cardNo',      label: 'কার্ড নং',   type: 'text',     sortable: true,  width: 90  },
      { key: 'fullName',    label: 'নাম',         type: 'text',     sortable: true,  width: 160 },
      { key: 'designation', label: 'পদবী',        type: 'text',     sortable: true,  width: 140 },
      { key: 'department',  label: 'বিভাগ',       type: 'text',     sortable: true,  width: 120 },
      { key: 'joiningDate', label: 'যোগদানের তারিখ', type: 'date',  sortable: true,  width: 120, format: formatDate },
      { key: 'grossSalary', label: 'মোট বেতন',   type: 'currency', sortable: true,  width: 110, format: formatCurrency },
      { key: 'mobile',      label: 'মোবাইল',      type: 'text',                      width: 120 },
      {
        key: 'status', label: 'অবস্থা', type: 'badge', sortable: true, width: 90,
        badgeMap: {
          Active:   { bg: '#dcfce7', text: '#15803d' },
          Inactive: { bg: '#fee2e2', text: '#dc2626' },
          Left:     { bg: '#fef9c3', text: '#a16207' },
        },
      },
      { key: 'savedAt',   label: 'সংরক্ষণ তারিখ', type: 'date', format: formatDate, width: 130 },
    ],
    filters: [
      { key: 'cardNo',      label: 'কার্ড নং',    type: 'text' },
      { key: 'fullName',    label: 'নাম',          type: 'text' },
      { key: 'designation', label: 'পদবী',         type: 'text' },
      { key: 'department',  label: 'বিভাগ',        type: 'text' },
      { key: 'joiningDate', label: 'যোগদান তারিখ', type: 'date' },
      { key: 'status',      label: 'অবস্থা',       type: 'select', options: [
        { value: 'Active',   label: 'Active'   },
        { value: 'Inactive', label: 'Inactive' },
        { value: 'Left',     label: 'Left'     },
      ]},
    ],
    detailFields: [
      { key: 'cardNo',           label: 'কার্ড নং'      },
      { key: 'fullName',         label: 'নাম (ইংরেজি)', span: 2 },
      { key: 'fullNameBengali',  label: 'নাম (বাংলা)',  span: 2 },
      { key: 'designation',      label: 'পদবী'          },
      { key: 'department',       label: 'বিভাগ'         },
      { key: 'joiningDate',      label: 'যোগদানের তারিখ'},
      { key: 'dateOfBirth',      label: 'জন্ম তারিখ'    },
      { key: 'mobile',           label: 'মোবাইল'        },
      { key: 'nid',              label: 'জাতীয় পরিচয়পত্র' },
      { key: 'fatherName',       label: 'পিতার নাম'     },
      { key: 'motherName',       label: 'মাতার নাম'     },
      { key: 'presentAddress',   label: 'বর্তমান ঠিকানা', span: 3 },
      { key: 'basicSalary',      label: 'মূল বেতন'      },
      { key: 'houseRent',        label: 'বাড়িভাড়া'     },
      { key: 'medicalAllowance', label: 'চিকিৎসা ভাতা'  },
      { key: 'transportAllowance',label:'যাতায়াত ভাতা' },
      { key: 'foodAllowance',    label: 'খাদ্য ভাতা'    },
      { key: 'grossSalary',      label: 'মোট বেতন'      },
    ],
  },

  // ── Final Settlement ───────────────────────────────────────────────────────
  {
    module:  'settlements',
    category: 'core',
    labelBn: 'চূড়ান্ত পাওনা',
    labelEn: 'Final Settlement',
    icon:    '📋',
    columns: [
      { key: 'cardNo',          label: 'কার্ড নং',       type: 'text',     sortable: true, width: 90  },
      { key: 'employeeName',    label: 'নাম',             type: 'text',     sortable: true, width: 160 },
      { key: 'designation',     label: 'পদবী',            type: 'text',                    width: 140 },
      { key: 'terminationType', label: 'বিচ্ছেদের ধরন',  type: 'badge',    sortable: true, width: 150,
        badgeMap: {
          'চাকুরী অবসান (২৬)': { bg: '#fee2e2', text: '#dc2626' },
          'ছাঁটাই (২০)':        { bg: '#ffedd5', text: '#ea580c' },
          'অবসর (২৮)':          { bg: '#dbeafe', text: '#1d4ed8' },
          'ইস্তফা (২৭)':        { bg: '#fef9c3', text: '#a16207' },
          'মৃত্যু (১৯)':        { bg: '#f3f4f6', text: '#374151' },
        },
      },
      { key: 'settlementDate',  label: 'তারিখ',           type: 'date',     sortable: true, width: 110, format: formatDate },
      { key: 'serviceYears',    label: 'চাকরি (বছর)',     type: 'number',   sortable: true, width: 100 },
      { key: 'totalWage',       label: 'মোট বেতন',        type: 'currency',                 width: 110, format: formatCurrency },
      { key: 'finalTotal',      label: 'চূড়ান্ত পাওনা',  type: 'currency', sortable: true, width: 120, format: formatCurrency },
      { key: 'savedBy',         label: 'সংরক্ষণকারী',     type: 'text',                    width: 110 },
    ],
    filters: [
      { key: 'cardNo',          label: 'কার্ড নং',       type: 'text'   },
      { key: 'employeeName',    label: 'নাম',             type: 'text'   },
      { key: 'terminationType', label: 'বিচ্ছেদের ধরন',  type: 'select', options: [
        { value: 'চাকুরী অবসান (২৬)', label: 'চাকুরী অবসান'  },
        { value: 'ছাঁটাই (২০)',        label: 'ছাঁটাই'          },
        { value: 'অবসর (২৮)',          label: 'অবসর'            },
        { value: 'ইস্তফা (২৭)',        label: 'ইস্তফা'          },
      ]},
      { key: 'settlementDate',  label: 'তারিখ',           type: 'date'   },
    ],
    detailFields: [
      { key: 'cardNo',              label: 'কার্ড নং'         },
      { key: 'employeeName',        label: 'নাম',        span: 2 },
      { key: 'designation',         label: 'পদবী'              },
      { key: 'joiningDate',         label: 'যোগদানের তারিখ'   },
      { key: 'lastAttendance',      label: 'শেষ উপস্থিতি'     },
      { key: 'settlementDate',      label: 'নিষ্পত্তির তারিখ' },
      { key: 'terminationType',     label: 'বিচ্ছেদের ধরন'    },
      { key: 'serviceYears',        label: 'চাকরির মেয়াদ'    },
      { key: 'basicWage',           label: 'মূল মজুরি'         },
      { key: 'totalWage',           label: 'মোট মজুরি'         },
      { key: 'earnedLeave',         label: 'অর্জিত ছুটি'      },
      { key: 'serviceCompensation', label: 'চাকরি ক্ষতিপূরণ'  },
      { key: 'noticePay',           label: 'নোটিশ পে'          },
      { key: 'advanceDeduction',    label: 'অগ্রিম কর্তন'     },
      { key: 'finalTotal',          label: 'সর্বমোট পাওনা', span: 3 },
    ],
  },

  // ── Maternity ─────────────────────────────────────────────────────────────
  {
    module:  'maternity',
    category: 'core',
    labelBn: 'মাতৃত্ব সুবিধা',
    labelEn: 'Maternity Benefit',
    icon:    '🤱',
    columns: [
      { key: 'cardNo',        label: 'কার্ড নং',         type: 'text',     sortable: true, width: 90  },
      { key: 'employeeName',  label: 'নাম',               type: 'text',     sortable: true, width: 160 },
      { key: 'designation',   label: 'পদবী',              type: 'text',                    width: 140 },
      { key: 'department',    label: 'বিভাগ',             type: 'text',                    width: 110 },
      { key: 'deliveryDate',  label: 'প্রসবের তারিখ',    type: 'date',     sortable: true, width: 120, format: formatDate },
      { key: 'installment',   label: 'কিস্তি',            type: 'badge',    sortable: true, width: 110,
        badgeMap: {
          'প্রথম কিস্তি':  { bg: '#dbeafe', text: '#1d4ed8' },
          'দ্বিতীয় কিস্তি': { bg: '#dcfce7', text: '#15803d' },
        },
      },
      { key: 'monthlyWage',   label: 'মাসিক মজুরি',      type: 'currency',                width: 110, format: formatCurrency },
      { key: 'totalBenefit',  label: 'মোট সুবিধা',       type: 'currency', sortable: true, width: 120, format: formatCurrency },
    ],
    filters: [
      { key: 'cardNo',       label: 'কার্ড নং',          type: 'text' },
      { key: 'employeeName', label: 'নাম',                type: 'text' },
      { key: 'installment',  label: 'কিস্তি',             type: 'select', options: [
        { value: 'প্রথম কিস্তি',    label: 'প্রথম কিস্তি'    },
        { value: 'দ্বিতীয় কিস্তি', label: 'দ্বিতীয় কিস্তি' },
      ]},
      { key: 'deliveryDate', label: 'প্রসবের তারিখ',     type: 'date' },
    ],
    detailFields: [
      { key: 'cardNo',       label: 'কার্ড নং'         },
      { key: 'employeeName', label: 'নাম',        span: 2 },
      { key: 'designation',  label: 'পদবী'              },
      { key: 'department',   label: 'বিভাগ'             },
      { key: 'joiningDate',  label: 'যোগদানের তারিখ'   },
      { key: 'deliveryDate', label: 'প্রসবের তারিখ'    },
      { key: 'children',     label: 'জীবিত সন্তান'     },
      { key: 'monthlyWage',  label: 'মাসিক মজুরি'      },
      { key: 'dailyWage',    label: 'দৈনিক মজুরি'      },
      { key: 'preBenefit',   label: '১ম কিস্তি (৬০ দিন)' },
      { key: 'postBenefit',  label: '২য় কিস্তি (৫৯ দিন)' },
      { key: 'totalBenefit', label: 'মোট সুবিধা', span: 3 },
    ],
  },

  // ── Left Worker Notice ─────────────────────────────────────────────────────
  {
    module:  'leftnotice',
    category: 'core',
    labelBn: 'অনুপস্থিতির নোটিশ',
    labelEn: 'Left Worker Notice',
    icon:    '📝',
    columns: [
      { key: 'cardNo',         label: 'কার্ড নং',      type: 'text',  sortable: true, width: 90  },
      { key: 'employeeName',   label: 'নাম',            type: 'text',  sortable: true, width: 160 },
      { key: 'designation',    label: 'পদবী',           type: 'text',                 width: 140 },
      { key: 'department',     label: 'বিভাগ',          type: 'text',                 width: 110 },
      { key: 'absentFrom',     label: 'অনুপস্থিত থেকে', type: 'date', sortable: true, width: 130, format: formatDate },
      { key: 'totalAbsentDays',label: 'মোট দিন',        type: 'number',sortable: true, width: 90  },
      { key: 'noticeType',     label: 'নোটিশ ধরন',     type: 'badge', sortable: true, width: 110,
        badgeMap: {
          notice1: { bg: '#fef9c3', text: '#a16207' },
          notice2: { bg: '#ffedd5', text: '#ea580c' },
          notice3: { bg: '#fee2e2', text: '#dc2626' },
        },
      },
      { key: 'savedAt',        label: 'তারিখ',          type: 'date',  sortable: true, width: 110, format: formatDate },
    ],
    filters: [
      { key: 'cardNo',       label: 'কার্ড নং',    type: 'text'   },
      { key: 'employeeName', label: 'নাম',          type: 'text'   },
      { key: 'noticeType',   label: 'নোটিশ ধরন',   type: 'select', options: [
        { value: 'notice1', label: '১ম নোটিশ' },
        { value: 'notice2', label: '২য় নোটিশ' },
        { value: 'notice3', label: 'চূড়ান্ত নোটিশ' },
      ]},
      { key: 'absentFrom',   label: 'অনুপস্থিতির তারিখ', type: 'date' },
    ],
    detailFields: [
      { key: 'cardNo',         label: 'কার্ড নং'       },
      { key: 'employeeName',   label: 'নাম',      span: 2 },
      { key: 'designation',    label: 'পদবী'            },
      { key: 'department',     label: 'বিভাগ'           },
      { key: 'absentFrom',     label: 'অনুপস্থিতি শুরু'},
      { key: 'absentTo',       label: 'অনুপস্থিতি শেষ' },
      { key: 'totalAbsentDays',label: 'মোট অনুপস্থিত'  },
      { key: 'noticeType',     label: 'নোটিশ ধরন'      },
      { key: 'notes',          label: 'মন্তব্য',  span: 3 },
    ],
  },

  // ── Requisitions ──────────────────────────────────────────────────────────
  {
    module:  'requisitions',
    category: 'lifecycle',
    labelBn: 'রিকুইজিশন',
    labelEn: 'Staff Requisition',
    icon:    '📦',
    columns: [
      { key: 'id',          label: 'আইডি',          type: 'text',  sortable: true, width: 130 },
      { key: 'subject',     label: 'বিষয়',           type: 'text',  sortable: true, width: 200 },
      { key: 'date',        label: 'তারিখ',           type: 'date',  sortable: true, width: 110, format: formatDate },
      { key: 'preparedBy',  label: 'প্রস্তুতকারী',   type: 'text',                 width: 130 },
      { key: 'department',  label: 'বিভাগ',           type: 'text',                 width: 110 },
      { key: 'totalItems',  label: 'আইটেম সংখ্যা',   type: 'number',sortable: true, width: 100 },
      { key: 'status',      label: 'অবস্থা',          type: 'badge', sortable: true, width: 100,
        badgeMap: {
          Pending:  { bg: '#fef9c3', text: '#a16207' },
          Approved: { bg: '#dcfce7', text: '#15803d' },
          Rejected: { bg: '#fee2e2', text: '#dc2626' },
        },
      },
    ],
    filters: [
      { key: 'subject',    label: 'বিষয়',    type: 'text'   },
      { key: 'preparedBy', label: 'প্রস্তুতকারী', type: 'text' },
      { key: 'date',       label: 'তারিখ',    type: 'date'   },
      { key: 'status',     label: 'অবস্থা',   type: 'select', options: [
        { value: 'Pending',  label: 'Pending'  },
        { value: 'Approved', label: 'Approved' },
        { value: 'Rejected', label: 'Rejected' },
      ]},
    ],
    detailFields: [
      { key: 'id',         label: 'আইডি'              },
      { key: 'subject',    label: 'বিষয়',       span: 2 },
      { key: 'date',       label: 'তারিখ'              },
      { key: 'preparedBy', label: 'প্রস্তুতকারী'      },
      { key: 'approvedBy', label: 'অনুমোদনকারী'       },
      { key: 'department', label: 'বিভাগ'              },
      { key: 'purpose',    label: 'উদ্দেশ্য',    span: 3 },
      { key: 'status',     label: 'অবস্থা'             },
    ],
  },

  // ── Salary Increments ──────────────────────────────────────────────────────
  {
    module:  'increments',
    category: 'core',
    labelBn: 'বেতন বৃদ্ধি',
    labelEn: 'Salary Increment',
    icon:    '💰',
    columns: [
      { key: 'cardNo',          label: 'কার্ড নং',       type: 'text',     sortable: true, width: 90  },
      { key: 'employeeName',    label: 'নাম',             type: 'text',     sortable: true, width: 160 },
      { key: 'designation',     label: 'পদবী',            type: 'text',                    width: 140 },
      { key: 'effectiveDate',   label: 'কার্যকর তারিখ',  type: 'date',     sortable: true, width: 120, format: formatDate },
      { key: 'oldTotal',        label: 'পূর্বের বেতন',   type: 'currency',                width: 110, format: formatCurrency },
      { key: 'newTotal',        label: 'নতুন বেতন',      type: 'currency',                width: 110, format: formatCurrency },
      { key: 'incrementAmount', label: 'বৃদ্ধির পরিমাণ', type: 'currency', sortable: true, width: 120, format: formatCurrency },
      { key: 'incrementPercent',label: 'বৃদ্ধি %',        type: 'number',   sortable: true, width: 80  },
    ],
    filters: [
      { key: 'cardNo',        label: 'কার্ড নং',       type: 'text' },
      { key: 'employeeName',  label: 'নাম',             type: 'text' },
      { key: 'effectiveDate', label: 'কার্যকর তারিখ',  type: 'date' },
    ],
    detailFields: [
      { key: 'cardNo',           label: 'কার্ড নং'         },
      { key: 'employeeName',     label: 'নাম',        span: 2 },
      { key: 'designation',      label: 'পদবী'              },
      { key: 'department',       label: 'বিভাগ'             },
      { key: 'effectiveDate',    label: 'কার্যকর তারিখ'    },
      { key: 'oldBasic',         label: 'পূর্বের মূল'      },
      { key: 'oldTotal',         label: 'পূর্বের মোট'      },
      { key: 'newBasic',         label: 'নতুন মূল'         },
      { key: 'newTotal',         label: 'নতুন মোট'         },
      { key: 'incrementAmount',  label: 'বৃদ্ধির পরিমাণ'  },
      { key: 'incrementPercent', label: 'বৃদ্ধি %'          },
      { key: 'reason',           label: 'কারণ',       span: 3 },
    ],
  },

  // ── Meeting Minutes ────────────────────────────────────────────────────────
  {
    module:  'meetings',
    category: 'lifecycle',
    labelBn: 'সভার কার্যবিবরণী',
    labelEn: 'Meeting Minutes',
    icon:    '🤝',
    columns: [
      { key: 'id',            label: 'আইডি',            type: 'text',  sortable: true, width: 130 },
      { key: 'meetingTitle',  label: 'সভার শিরোনাম',   type: 'text',  sortable: true, width: 200 },
      { key: 'meetingDate',   label: 'সভার তারিখ',      type: 'date',  sortable: true, width: 120, format: formatDate },
      { key: 'venue',         label: 'স্থান',            type: 'text',                 width: 140 },
      { key: 'chairperson',   label: 'সভাপতি',          type: 'text',  sortable: true, width: 140 },
      { key: 'attendeeCount', label: 'উপস্থিত',         type: 'number',sortable: true, width: 80  },
      { key: 'language',      label: 'ভাষা',             type: 'badge',                width: 80,
        badgeMap: {
          বাংলা:   { bg: '#dbeafe', text: '#1d4ed8' },
          English: { bg: '#f3f4f6', text: '#374151' },
        },
      },
    ],
    filters: [
      { key: 'meetingTitle', label: 'সভার শিরোনাম', type: 'text' },
      { key: 'chairperson',  label: 'সভাপতি',       type: 'text' },
      { key: 'meetingDate',  label: 'সভার তারিখ',   type: 'date' },
    ],
    detailFields: [
      { key: 'meetingTitle',    label: 'সভার শিরোনাম', span: 3 },
      { key: 'meetingDate',     label: 'সভার তারিখ'          },
      { key: 'venue',           label: 'স্থান'                },
      { key: 'language',        label: 'ভাষা'                 },
      { key: 'chairperson',     label: 'সভাপতি'               },
      { key: 'secretary',       label: 'সম্পাদক'              },
      { key: 'attendeeCount',   label: 'উপস্থিত সংখ্যা'     },
      { key: 'nextMeetingDate', label: 'পরবর্তী সভার তারিখ'  },
    ],
  },

  // ── Audit/Visit Record ───────────────────────────────────────────────────────
  {
    module:  'auditvisits',
    category: 'compliance',
    labelBn: 'নিরীক্ষা/পরিদর্শন রেকর্ড',
    labelEn: 'Audit/Visit Record',
    icon:    '📋',
    columns: [
      { key: 'auditCertification',  label: 'অডিট/সার্টিফিকেশন', type: 'text', sortable: true, width: 160 },
      { key: 'standardBuyer',        label: 'স্ট্যান্ডার্ড/বায়ার', type: 'text', sortable: true, width: 140 },
      { key: 'auditorOrganization',  label: 'অডিটর সংস্থা',       type: 'text', width: 160 },
      { key: 'visitDate',            label: 'পরিদর্শনের তারিখ',   type: 'date', sortable: true, width: 120, format: formatDate },
      { key: 'validityPeriodValue',  label: 'মেয়াদ',              type: 'text', width: 80 },
      { key: 'validityPeriodUnit',   label: 'একক',                type: 'text', width: 70 },
    ],
    filters: [
      { key: 'auditCertification', label: 'অডিট/সার্টিফিকেশন', type: 'text' },
      { key: 'standardBuyer',      label: 'স্ট্যান্ডার্ড/বায়ার', type: 'text' },
      { key: 'visitDate',          label: 'পরিদর্শনের তারিখ',   type: 'date' },
    ],
  },

  // ── Legal Document Validity ───────────────────────────────────────────────────
  {
    module:  'legaldocuments',
    category: 'compliance',
    labelBn: 'আইনি দলিলের বৈধতা',
    labelEn: 'Legal Document Validity',
    icon:    '📄',
    columns: [
      { key: 'documentTitle',    label: 'দলিলের শিরোনাম', type: 'text', sortable: true, width: 180 },
      { key: 'category',         label: 'বিভাগ',           type: 'text', sortable: true, width: 130 },
      { key: 'documentNo',       label: 'দলিল নং',         type: 'text', width: 120 },
      { key: 'issuingAuthority', label: 'ইস্যুকারী কর্তৃপক্ষ', type: 'text', width: 160 },
      { key: 'issueDate',        label: 'ইস্যুর তারিখ',     type: 'date', sortable: true, width: 120, format: formatDate },
      { key: 'expiryDate',       label: 'মেয়াদোত্তীর্ণ তারিখ', type: 'date', sortable: true, width: 130, format: formatDate },
    ],
    filters: [
      { key: 'documentTitle', label: 'দলিলের শিরোনাম', type: 'text' },
      { key: 'category',      label: 'বিভাগ',           type: 'text' },
      { key: 'expiryDate',    label: 'মেয়াদোত্তীর্ণ তারিখ', type: 'date' },
    ],
  },

  // ── Miscellaneous Bill ───────────────────────────────────────────────────────
  {
    module:  'miscbills',
    category: 'core',
    labelBn: 'বিবিধ বিল',
    labelEn: 'Miscellaneous Bill',
    icon:    '🧾',
    columns: [
      { key: 'template',       label: 'টেমপ্লেট',    type: 'badge', sortable: true, width: 120,
        badgeMap: {
          holiday:    { bg: '#dbeafe', text: '#1d4ed8' },
          adjustment: { bg: '#fef3c7', text: '#92400e' },
          festival:   { bg: '#dcfce7', text: '#15803d' },
        },
      },
      { key: 'subject',        label: 'বিষয়',        type: 'text',     sortable: true, width: 180 },
      { key: 'date',           label: 'তারিখ',        type: 'date',     sortable: true, width: 120, format: formatDate },
      { key: 'totalItems',     label: 'মোট আইটেম',   type: 'number',   width: 90 },
      { key: 'totalAmount',    label: 'মোট পরিমাণ',  type: 'currency', sortable: true, width: 120, format: formatCurrency },
    ],
    filters: [
      { key: 'subject',  label: 'বিষয়',   type: 'text' },
      { key: 'template', label: 'টেমপ্লেট', type: 'select', options: [
        { value: 'holiday',    label: 'Holiday Bill'    },
        { value: 'adjustment', label: 'Adjustment Bill' },
        { value: 'festival',   label: 'Festival Holiday Bill' },
      ]},
      { key: 'date',      label: 'তারিখ',   type: 'date' },
    ],
  },

  // ── Living Wage Assessment ────────────────────────────────────────────────────
  {
    module:  'livingwage',
    category: 'compliance',
    labelBn: 'জীবনযাপন মজুরি মূল্যায়ন',
    labelEn: 'Living Wage Assessment',
    icon:    '⚖️',
    columns: [
      { key: 'method',           label: 'পদ্ধতি',        type: 'badge', sortable: true, width: 130,
        badgeMap: {
          benchmark:  { bg: '#dbeafe', text: '#1d4ed8' },
          calculator: { bg: '#dcfce7', text: '#15803d' },
        },
      },
      { key: 'location',         label: 'অবস্থান',       type: 'text', width: 140 },
      { key: 'studyYear',        label: 'গবেষণা বছর',   type: 'text', width: 100 },
      { key: 'benchmarkAmount',  label: 'বেঞ্চমার্ক (৳)', type: 'currency', width: 120, format: formatCurrency },
      { key: 'totalSurveys',     label: 'সার্ভে সংখ্যা', type: 'number', width: 100 },
      { key: 'date',             label: 'তারিখ',         type: 'date', sortable: true, width: 120, format: formatDate },
    ],
    filters: [
      { key: 'location',  label: 'অবস্থান',  type: 'text' },
      { key: 'studyYear', label: 'গবেষণা বছর', type: 'text' },
      { key: 'date',      label: 'তারিখ',    type: 'date' },
    ],
  },

  // ── Supplier Assessment ───────────────────────────────────────────────────────
  {
    module:  'suppliers',
    category: 'compliance',
    labelBn: 'সরবরাহকারী মূল্যায়ন',
    labelEn: 'Supplier Assessment',
    icon:    '🚚',
    columns: [
      { key: 'supplierName',      label: 'সরবরাহকারীর নাম', type: 'text', sortable: true, width: 180 },
      { key: 'businessType',      label: 'ব্যবসার ধরন',      type: 'text', sortable: true, width: 150 },
      { key: 'productCategory',   label: 'পণ্য/সেবা',         type: 'text', width: 150 },
      { key: 'contactPerson',     label: 'যোগাযোগ ব্যক্তি',   type: 'text', width: 140 },
      { key: 'phone',             label: 'ফোন',              type: 'text', width: 120 },
      { key: 'totalAssessments',  label: 'মূল্যায়ন সংখ্যা',   type: 'number', width: 100 },
    ],
    filters: [
      { key: 'supplierName', label: 'সরবরাহকারীর নাম', type: 'text' },
      { key: 'businessType', label: 'ব্যবসার ধরন',      type: 'text' },
    ],
  },

  // ── Disciplinary Action ───────────────────────────────────────────────────────
  {
    module:  'disciplinaryactions',
    category: 'lifecycle',
    labelBn: 'শৃঙ্খলামূলক ব্যবস্থা',
    labelEn: 'Disciplinary Action',
    icon:    '⚠️',
    columns: [
      { key: 'referenceNo',   label: 'সূত্র নং',       type: 'text', width: 140 },
      { key: 'employeeName',  label: 'কর্মীর নাম',     type: 'text', sortable: true, width: 160 },
      { key: 'cardNo',        label: 'কার্ড নং',       type: 'text', sortable: true, width: 100 },
      { key: 'showCauseDate', label: 'কারণ দর্শানোর তারিখ', type: 'date', sortable: true, width: 150, format: formatDate },
      {
        key: 'replyStatus', label: 'জবাবের অবস্থা', type: 'badge', sortable: true, width: 120,
        badgeMap: {
          সন্তোষজনক:   { bg: '#dcfce7', text: '#15803d' },
          অসন্তোষজনক: { bg: '#fee2e2', text: '#dc2626' },
        },
      },
    ],
    filters: [
      { key: 'employeeName',  label: 'কর্মীর নাম',       type: 'text' },
      { key: 'showCauseDate', label: 'কারণ দর্শানোর তারিখ', type: 'date' },
    ],
  },

  // ── Candidate Pipeline ───────────────────────────────────────────────────────
  {
    module:  'candidates',
    category: 'lifecycle',
    labelBn: 'প্রার্থী ট্র্যাকিং',
    labelEn: 'Candidate Pipeline',
    icon:    '🧑‍💼',
    columns: [
      { key: 'candidateName',       label: 'প্রার্থীর নাম', type: 'text', sortable: true, width: 160 },
      { key: 'positionAppliedFor',  label: 'আবেদনের পদ',   type: 'text', sortable: true, width: 150 },
      { key: 'department',          label: 'বিভাগ',         type: 'text', width: 120 },
      { key: 'source',              label: 'Source',        type: 'text', width: 110 },
      { key: 'applicationDate',     label: 'আবেদনের তারিখ', type: 'date', sortable: true, width: 130, format: formatDate },
      {
        key: 'stage', label: 'Stage', type: 'badge', sortable: true, width: 130,
        badgeMap: {
          Applied:              { bg: '#f1f5f9', text: '#64748b' },
          Shortlisted:          { bg: '#dbeafe', text: '#1d4ed8' },
          'Interview Scheduled':{ bg: '#fef3c7', text: '#92400e' },
          Interviewed:          { bg: '#fef3c7', text: '#92400e' },
          Selected:             { bg: '#dcfce7', text: '#047857' },
          'Offer Sent':         { bg: '#dcfce7', text: '#047857' },
          'Offer Accepted':     { bg: '#dcfce7', text: '#15803d' },
          Joined:               { bg: '#dcfce7', text: '#15803d' },
          Rejected:             { bg: '#fee2e2', text: '#b91c1c' },
          Withdrawn:            { bg: '#f1f5f9', text: '#64748b' },
        },
      },
    ],
    filters: [
      { key: 'candidateName',      label: 'প্রার্থীর নাম', type: 'text' },
      { key: 'positionAppliedFor', label: 'আবেদনের পদ',   type: 'text' },
      { key: 'applicationDate',    label: 'আবেদনের তারিখ', type: 'date' },
    ],
  },

  // ── Onboarding Checklist ──────────────────────────────────────────────────────
  {
    module:  'onboarding',
    category: 'lifecycle',
    labelBn: 'অনবোর্ডিং চেকলিস্ট',
    labelEn: 'Onboarding Checklist',
    icon:    '✅',
    columns: [
      { key: 'employeeName',       label: 'কর্মীর নাম', type: 'text', sortable: true, width: 160 },
      { key: 'department',         label: 'বিভাগ',       type: 'text', width: 130 },
      { key: 'designation',        label: 'পদবী',        type: 'text', width: 130 },
      { key: 'joiningDate',        label: 'যোগদানের তারিখ', type: 'date', sortable: true, width: 130, format: formatDate },
      { key: 'mentorName',         label: 'মেন্টর',       type: 'text', width: 130 },
      {
        key: 'probationStatus', label: 'প্রবেশনকাল', type: 'badge', sortable: true, width: 110,
        badgeMap: {
          চলমান: { bg: '#dbeafe', text: '#1d4ed8' },
          সম্পন্ন: { bg: '#dcfce7', text: '#15803d' },
          বর্ধিত: { bg: '#fef3c7', text: '#92400e' },
          ব্যর্থ: { bg: '#fee2e2', text: '#dc2626' },
        },
      },
    ],
    filters: [
      { key: 'employeeName',    label: 'কর্মীর নাম',   type: 'text' },
      { key: 'joiningDate',     label: 'যোগদানের তারিখ', type: 'date' },
      { key: 'probationStatus', label: 'প্রবেশনকাল',    type: 'select', options: [
        { value: 'চলমান',  label: 'চলমান'  },
        { value: 'সম্পন্ন', label: 'সম্পন্ন' },
        { value: 'বর্ধিত',  label: 'বর্ধিত'  },
        { value: 'ব্যর্থ',  label: 'ব্যর্থ'  },
      ]},
    ],
  },

  // ── Wages Grid ────────────────────────────────────────────────────────────────
  {
    module:  'wagesgrid',
    category: 'core',
    labelBn: 'ওয়েজেস গ্রিড',
    labelEn: 'Wages Grid',
    icon:    '🏗️',
    columns: [
      { key: 'gradeName',    label: 'গ্রেড',        type: 'text', sortable: true, width: 120 },
      { key: 'scheduleType', label: 'তফসিল',       type: 'text', sortable: true, width: 150 },
      { key: 'basicWage',    label: 'মূল মজুরি',    type: 'currency', width: 110, format: formatCurrency },
      { key: 'effectiveDate',label: 'কার্যকর তারিখ', type: 'date', sortable: true, width: 130, format: formatDate },
      { key: 'gazetteReference', label: 'গেজেট রেফারেন্স', type: 'text', width: 180 },
    ],
    filters: [
      { key: 'gradeName',    label: 'গ্রেড',  type: 'text' },
      { key: 'scheduleType', label: 'তফসিল', type: 'select', options: [
        { value: 'তফসিল-ক (শ্রমিক)', label: 'তফসিল-ক (শ্রমিক)' },
        { value: 'তফসিল-খ (করণিক)',  label: 'তফসিল-খ (করণিক)'  },
      ]},
    ],
  },

  // ── Employee Performance ─────────────────────────────────────────────────────
  {
    module:  'performance',
    category: 'lifecycle',
    labelBn: 'কর্মী পারফরম্যান্স',
    labelEn: 'Employee Performance',
    icon:    '📈',
    columns: [
      { key: 'employeeName', label: 'কর্মীর নাম', type: 'text', sortable: true, width: 160 },
      { key: 'department',   label: 'বিভাগ',       type: 'text', width: 130 },
      { key: 'reviewCycle',  label: 'পর্যালোচনা চক্র', type: 'text', sortable: true, width: 140 },
      { key: 'reviewDate',   label: 'পর্যালোচনার তারিখ', type: 'date', sortable: true, width: 140, format: formatDate },
      {
        key: 'ratingCategory', label: 'রেটিং', type: 'badge', sortable: true, width: 140,
        badgeMap: {
          Excellent:            { bg: '#dcfce7', text: '#15803d' },
          Good:                  { bg: '#d1fae5', text: '#047857' },
          Satisfactory:          { bg: '#dbeafe', text: '#1d4ed8' },
          'Needs Improvement':   { bg: '#fef3c7', text: '#92400e' },
          Unsatisfactory:        { bg: '#fee2e2', text: '#b91c1c' },
        },
      },
      { key: 'recommendedIncrementPercent', label: 'প্রস্তাবিত ইনক্রিমেন্ট', type: 'text', width: 130 },
    ],
    filters: [
      { key: 'employeeName', label: 'কর্মীর নাম', type: 'text' },
      { key: 'reviewCycle',  label: 'পর্যালোচনা চক্র', type: 'text' },
      { key: 'ratingCategory', label: 'রেটিং', type: 'select', options: [
        { value: 'Excellent',           label: 'Excellent'           },
        { value: 'Good',                label: 'Good'                },
        { value: 'Satisfactory',        label: 'Satisfactory'        },
        { value: 'Needs Improvement',   label: 'Needs Improvement'   },
        { value: 'Unsatisfactory',      label: 'Unsatisfactory'      },
      ]},
    ],
  },

  // ── Emergency Log ────────────────────────────────────────────────────────────
  {
    module:  'emergencylog',
    category: 'compliance',
    labelBn: 'ইমার্জেন্সি লগ',
    labelEn: 'Emergency Log',
    icon:    '🚑',
    columns: [
      {
        key: 'logType', label: 'Log Type', type: 'badge', sortable: true, width: 170,
        badgeMap: {
          'Injury and Accident Log': { bg: '#fee2e2', text: '#b91c1c' },
          'Grievance Log':            { bg: '#fef3c7', text: '#92400e' },
        },
      },
      { key: 'employeeName', label: 'কর্মীর নাম', type: 'text', sortable: true, width: 160 },
      { key: 'department',   label: 'বিভাগ',       type: 'text', width: 130 },
      { key: 'date',         label: 'তারিখ',       type: 'date', sortable: true, width: 120, format: formatDate },
      { key: 'severity',     label: 'তীব্রতা',      type: 'text', width: 100 },
      { key: 'investigationStatus', label: 'তদন্ত অবস্থা', type: 'text', width: 120 },
      { key: 'resolutionStatus',    label: 'সমাধান অবস্থা', type: 'text', width: 120 },
    ],
    filters: [
      { key: 'logType',     label: 'Log Type', type: 'select', options: [
        { value: 'Injury and Accident Log', label: 'Injury and Accident Log' },
        { value: 'Grievance Log',            label: 'Grievance Log'          },
      ]},
      { key: 'employeeName', label: 'কর্মীর নাম', type: 'text' },
      { key: 'date',          label: 'তারিখ',      type: 'date' },
    ],
  },

  // ── Trainer List ──────────────────────────────────────────────────────────────
  {
    module:  'trainers',
    category: 'lifecycle',
    labelBn: 'প্রশিক্ষক তালিকা',
    labelEn: 'Trainer List',
    icon:    '🧑‍🏫',
    columns: [
      { key: 'trainerName',    label: 'প্রশিক্ষকের নাম', type: 'text', sortable: true, width: 160 },
      { key: 'trainerType',    label: 'ধরন',             type: 'text', sortable: true, width: 100 },
      { key: 'specialization', label: 'বিশেষজ্ঞতা',       type: 'text', width: 200 },
      { key: 'organization',   label: 'প্রতিষ্ঠান',        type: 'text', width: 160 },
      { key: 'contactNumber',  label: 'যোগাযোগ',          type: 'text', width: 120 },
    ],
    filters: [
      { key: 'trainerName', label: 'প্রশিক্ষকের নাম', type: 'text' },
      { key: 'trainerType', label: 'ধরন', type: 'select', options: [
        { value: 'Internal', label: 'Internal' },
        { value: 'External', label: 'External' },
      ]},
    ],
  },

  // ── Training Module ───────────────────────────────────────────────────────────
  {
    module:  'trainingsessions',
    category: 'lifecycle',
    labelBn: 'প্রশিক্ষণ মডিউল',
    labelEn: 'Training Module',
    icon:    '🎓',
    columns: [
      { key: 'trainingTopic', label: 'বিষয়',        type: 'text', sortable: true, width: 200 },
      { key: 'trainingMonth', label: 'মাস',          type: 'text', width: 80 },
      { key: 'trainingYear',  label: 'বছর',          type: 'text', width: 80 },
      { key: 'trainerName',   label: 'প্রশিক্ষক',     type: 'text', width: 150 },
      { key: 'venue',         label: 'স্থান',         type: 'text', width: 130 },
      { key: 'scheduledDate', label: 'নির্ধারিত তারিখ', type: 'date', sortable: true, width: 130, format: formatDate },
      {
        key: 'status', label: 'স্ট্যাটাস', type: 'badge', sortable: true, width: 120,
        badgeMap: {
          Planned:       { bg: '#f1f5f9', text: '#64748b' },
          'Notice Sent': { bg: '#fef3c7', text: '#92400e' },
          Conducted:     { bg: '#dcfce7', text: '#15803d' },
          Cancelled:     { bg: '#fee2e2', text: '#b91c1c' },
        },
      },
    ],
    filters: [
      { key: 'trainingTopic', label: 'বিষয়', type: 'text' },
      { key: 'status', label: 'স্ট্যাটাস', type: 'select', options: [
        { value: 'Planned',      label: 'Planned'      },
        { value: 'Notice Sent',  label: 'Notice Sent'  },
        { value: 'Conducted',    label: 'Conducted'    },
        { value: 'Cancelled',    label: 'Cancelled'    },
      ]},
    ],
  },

  // ── Risk Assessment ───────────────────────────────────────────────────────────
  {
    module:  'riskassessment',
    category: 'compliance',
    labelBn: 'ঝুঁকি মূল্যায়ন',
    labelEn: 'Risk Assessment',
    icon:    '⚠️',
    columns: [
      { key: 'section',            label: 'সেকশন', type: 'text', sortable: true, width: 150 },
      { key: 'source',             label: 'উৎস',    type: 'text', width: 150 },
      { key: 'riskIdentification', label: 'ঝুঁকি সনাক্তকরণ', type: 'text', width: 250 },
      {
        key: 'riskLevel', label: 'ঝুঁকির মাত্রা', type: 'badge', sortable: true, width: 100,
        badgeMap: {
          উচ্চ:  { bg: '#fee2e2', text: '#b91c1c' },
          মধ্যম: { bg: '#fef3c7', text: '#92400e' },
          নিম্ন:  { bg: '#dcfce7', text: '#15803d' },
        },
      },
      { key: 'responsiblePersonName', label: 'দায়িত্বপ্রাপ্ত ব্যক্তি', type: 'text', width: 160 },
    ],
    filters: [
      { key: 'section', label: 'সেকশন', type: 'text' },
      { key: 'riskLevel', label: 'ঝুঁকির মাত্রা', type: 'select', options: [
        { value: 'উচ্চ',  label: 'উচ্চ'  },
        { value: 'মধ্যম', label: 'মধ্যম' },
        { value: 'নিম্ন',  label: 'নিম্ন'  },
      ]},
    ],
  },

  // ── Compliance Audit ──────────────────────────────────────────────────────────
  {
    module:  'complianceaudit',
    category: 'compliance',
    labelBn: 'কমপ্লায়েন্স অডিট',
    labelEn: 'Compliance Audit',
    icon:    '✅',
    columns: [
      { key: 'siteName',    label: 'Site Name', type: 'text', sortable: true, width: 170 },
      { key: 'companyName', label: 'Company',   type: 'text', width: 160 },
      {
        key: 'auditType', label: 'অডিট ধরন', type: 'badge', sortable: true, width: 150,
        badgeMap: {
          Internal:                { bg: '#dbeafe', text: '#1d4ed8' },
          'External for Supplier': { bg: '#f3e8ff', text: '#7c3aed' },
        },
      },
      { key: 'auditRound', label: 'Audit Round', type: 'text', width: 130 },
      { key: 'auditDate',  label: 'Audit Date',  type: 'date', sortable: true, width: 120, format: formatDate },
    ],
    filters: [
      { key: 'siteName',  label: 'Site Name', type: 'text' },
      { key: 'auditType', label: 'অডিট ধরন', type: 'select', options: [
        { value: 'Internal',                label: 'Internal'                },
        { value: 'External for Supplier',   label: 'External for Supplier'   },
      ]},
    ],
  },
];

/** Look up a config by module name */
export const getReportConfig = (module: string): ReportConfig | undefined =>
  REPORT_CONFIGS.find(c => c.module === module);