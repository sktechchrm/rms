// ── Requisition line item ──────────────────────────────────────────────────────
//
// THREE requisition types, switched via `quantityType` at the requisition level:
//
//  Type A — 'quantity' (📦 Item/Material Requisition)
//    Columns: Sl No | Particulars | Quantity | Unit Price (৳) | Remarks
//    Total = Σ (parsed numeric qty × unitPrice)
//
//  Type B — 'taka' (💰 Direct Money / Fee Requisition)
//    Columns: Sl No | Particulars/Purpose | Amount (৳) | Payment To/Vendor | Remarks
//    Total = Σ amount
//
//  Type C — 'manpower' (👥 Manpower Requisition) — added for the Employee
//    Lifecycle & Growth Management system's Recruitment & Onboarding
//    stage, per explicit request to extend THIS module rather than build
//    a separate one.
//    Columns: Sl No | Position (particulars) | Department | Vacancies
//    (quantity) | Reason | Employment Type | Target Joining Date | Remarks
//    Total = Σ vacancies (a headcount, not a monetary sum)
//
// ALL fields are kept on every item regardless of active type, so
// toggling between types does not discard data the user already entered
// — same principle already established for Type A <-> Type B.
export interface RequisitionItem {
  slNo: number;
  particulars: string;
  /** Type A: quantity text, e.g. "10 Ream", "2 Pcs" · Type C: vacancy count, e.g. "2" */
  quantity: string;
  /** Type A: unit price in taka — numeric string */
  unitPrice: string;
  /** Type B: direct amount in taka — numeric string */
  amount: string;
  /** Type B: who/where the payment goes to */
  paymentTo: string;
  remarks: string;
  /** Type C only — department/section the vacancy is for */
  department: string;
  /** Type C only — why the position is open */
  reason: ManpowerReason;
  /** Type C only — nature of the position */
  employmentType: EmploymentType;
  /** Type C only — desired joining date */
  targetJoiningDate: string;
}

export type ManpowerReason = 'Replacement' | 'New Position' | 'Expansion' | 'Other';
export const MANPOWER_REASON_OPTIONS: ManpowerReason[] = ['Replacement', 'New Position', 'Expansion', 'Other'];

export type EmploymentType = 'Permanent' | 'Contract' | 'Temporary';
export const EMPLOYMENT_TYPE_OPTIONS: EmploymentType[] = ['Permanent', 'Contract', 'Temporary'];

export interface RequisitionData {
  subject: string;
  date: string;
  /** 'quantity' = Type A (Item/Material) · 'taka' = Type B (Direct Money/Fee)
     · 'manpower' = Type C (Manpower Requisition) */
  quantityType: 'quantity' | 'taka' | 'manpower';
  items: RequisitionItem[];

  factoryName: string;
  factoryAddress: string;

  // Point 1 (global standard templates): user picks one of three print
  // layouts, differing by how much detail is shown — not just visual
  // style. Defaults to 'standard' (= the original, only template that
  // existed before this) so existing saved requisitions and any code
  // that doesn't set this explicitly keep their exact current output.
  template?: RequisitionTemplate;
}

export type RequisitionTemplate = 'compact' | 'standard' | 'detailed';

export const REQUISITION_TEMPLATE_OPTIONS: { value: RequisitionTemplate; labelBn: string; labelEn: string; descBn: string; descEn: string }[] = [
  {
    value: 'compact', labelBn: 'কম্প্যাক্ট', labelEn: 'Compact',
    descBn: 'সংক্ষিপ্ত — Remarks কলাম ও ঠিকানা ছাড়া, দ্রুত প্রিন্টের জন্য',
    descEn: 'Minimal — no Remarks column or address, for quick printing',
  },
  {
    value: 'standard', labelBn: 'স্ট্যান্ডার্ড', labelEn: 'Standard',
    descBn: 'সাধারণ ব্যবহারের জন্য পূর্ণ ফরম্যাট (ডিফল্ট)',
    descEn: 'Full format for everyday use (default)',
  },
  {
    value: 'detailed', labelBn: 'বিস্তারিত', labelEn: 'Detailed',
    descBn: 'অতিরিক্ত সারাংশ ও লাইন-টোটাল কলাম সহ সম্পূর্ণ বিস্তারিত',
    descEn: 'Full detail with an extra summary box and line-total column',
  },
];


export interface RequisitionFormProps {
  requisition: RequisitionData;
  setRequisition: (data: RequisitionData) => void;
}

export interface RequisitionViewProps {
  requisition: RequisitionData;
}

// ── Total calculation ────────────────────────────────────────────────────────
// Type A: sum of (numeric portion of quantity x unitPrice)
// Type B: sum of amount
// Type C: sum of vacancies (a headcount, not a monetary total)
export function calculateRequisitionTotal(requisition: RequisitionData): number {
  if (requisition.quantityType === 'taka') {
    return requisition.items.reduce((sum, item) => {
      const amt = parseFloat(item.amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }
  if (requisition.quantityType === 'manpower') {
    return requisition.items.reduce((sum, item) => {
      const vacancies = parseFloat(item.quantity);
      return sum + (isNaN(vacancies) ? 0 : vacancies);
    }, 0);
  }
  return requisition.items.reduce((sum, item) => {
    const qtyNum  = parseFloat(item.quantity);   // "10 Ream" -> 10
    const unitNum = parseFloat(item.unitPrice);
    if (isNaN(qtyNum) || isNaN(unitNum)) return sum;
    return sum + qtyNum * unitNum;
  }, 0);
}

export function blankRequisitionItem(slNo: number): RequisitionItem {
  return {
    slNo, particulars: '', quantity: '', unitPrice: '', amount: '', paymentTo: '', remarks: '',
    department: '', reason: 'New Position', employmentType: 'Permanent', targetJoiningDate: '',
  };
}

// ── Initial / blank state ──────────────────────────────────────────────────────
export const INITIAL_REQUISITION_STATE: RequisitionData = {
  subject: "",
  date: new Date().toISOString().split('T')[0],
  quantityType: "quantity",
  items: [blankRequisitionItem(1)],
  factoryName: "",
  factoryAddress: "",
  template: 'standard',
};