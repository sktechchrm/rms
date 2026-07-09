// ─────────────────────────────────────────────────────────────────────────────
// INCREMENT BILL — types, factory options & initial state
// Factory identity imported from src/factories/FactoryRegistry.ts (single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

import {
  FACTORY_NAME_EN,
  FACTORY_ADDRESS_EN,
  FACTORY_OPTIONS as CONFIG_FACTORY_OPTIONS,
} from '../../../factories/FactoryRegistry';
// AUDIT FIX: calculateBasicSalary() used to hardcode "- 2450" instead of
// subtracting the employee's real food+medical+transport allowances,
// silently diverging from Final Settlement's correct formula for anyone
// whose allowances differ from the factory default. Now uses the single
// shared formula (see utils/sharedFormulas.ts). The three DEFAULT_* values
// below (750+450+1250=2450) are the SAME numbers the old hardcoded "2450"
// assumed — kept as fallback defaults so today's output doesn't change
// for any row that doesn't have real allowance data attached yet.
import { calculateBasicFromGross } from '../../../utils/sharedFormulas';

const DEFAULT_FOOD_ALLOWANCE = 1250;
const DEFAULT_MEDICAL_ALLOWANCE = 750;
const DEFAULT_TRANSPORT_ALLOWANCE = 450;
// Authority names are NOT set in INITIAL_INCREMENT_STATE.
// IncrementManager.tsx populates them reactively via useFactoryAuthorities()
// in its factory-lock useEffect, so the correct per-factory names always apply.

// ==================== TYPES ====================

export interface EmployeeIncrement {
  slNo: number;
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  serviceAge: string;
  basicSalary: string;
  grossSalary: string;
  // Optional — populated by Global Employee Search from the Employee
  // Personal File when available. Falls back to DEFAULT_*_ALLOWANCE in
  // calculateBasicSalary() below when not set (manual row entry).
  foodAllowance?: string;
  medicalAllowance?: string;
  transportAllowance?: string;
  lastIncrementDate: string;
  lastIncrementAmount: string;
  proposedIncrement: string;
  proposedSalary: string;
  effectiveFrom: string;
  recommendPromotion?: string;
  remarks: string;
}


export interface IncrementData {
  subject: string;
  date: string;
  employees: EmployeeIncrement[];
  factoryName: string;
  factoryAddress: string;
}

export interface IncrementManagerProps { setCurrentPage?: (page: string) => void; }
export interface IncrementFormProps    { increment: IncrementData; setIncrement: (data: IncrementData) => void; }
export interface IncrementViewProps    { increment: IncrementData; }

// ==================== FACTORY OPTIONS ====================
// Derived from central config — edit src/factories/MgShirtex.ts (or the relevant factory file), not here.

export interface FactoryOption {
  name: string;
  address: string;
  active: boolean;
}

export const FACTORY_OPTIONS: FactoryOption[] = CONFIG_FACTORY_OPTIONS.map(f => ({
  name:    f.name,
  address: f.address,
  active:  f.active,
}));

/** Only active factories shown in the form dropdown */
export const ACTIVE_FACTORY_OPTIONS = FACTORY_OPTIONS.filter(f => f.active);

// ==================== INITIAL STATE ====================

export const INITIAL_INCREMENT_STATE: IncrementData = {
  subject:  '',
  date:     new Date().toISOString().split('T')[0],
  employees: [
    {
      slNo: 1, employeeName: '', employeeId: '', designation: '',
      department: '', dateOfJoining: '', serviceAge: '', basicSalary: '',
      grossSalary: '', lastIncrementDate: '', lastIncrementAmount: '',
      proposedIncrement: '', proposedSalary: '', effectiveFrom: '',
      recommendPromotion: '', remarks: '',
    },
  ],
  factoryName:    FACTORY_NAME_EN,
  factoryAddress: FACTORY_ADDRESS_EN,
};

// ==================== UTILITY FUNCTIONS ====================

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day   = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year  = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const calculateServiceAge = (joiningDate: string): string => {
  if (!joiningDate) return '';
  const joining = new Date(joiningDate);
  const today   = new Date();
  let years  = today.getFullYear() - joining.getFullYear();
  let months = today.getMonth()   - joining.getMonth();
  if (months < 0) { years -= 1; months = 12 + months; }
  return `${years}Y ${months}M`;
};

export const calculateBasicSalary = (
  grossSalary: string,
  foodAllowance?: string,
  medicalAllowance?: string,
  transportAllowance?: string,
): string => {
  const gross = parseFloat(grossSalary) || 0;
  if (gross <= 0) return '';
  const food     = foodAllowance      !== undefined ? (parseFloat(foodAllowance)      || 0) : DEFAULT_FOOD_ALLOWANCE;
  const medical  = medicalAllowance   !== undefined ? (parseFloat(medicalAllowance)   || 0) : DEFAULT_MEDICAL_ALLOWANCE;
  const transport= transportAllowance !== undefined ? (parseFloat(transportAllowance) || 0) : DEFAULT_TRANSPORT_ALLOWANCE;
  return calculateBasicFromGross(gross, food + medical + transport).toFixed(2);
};

export const calculateProposedSalary = (grossSalary: string, proposedIncrement: string): string => {
  return ((parseFloat(grossSalary) || 0) + (parseFloat(proposedIncrement) || 0)).toFixed(2);
};

export interface IncrementTotals {
  totalBasic: string; totalGross: string;
  totalProposedInc: string; totalProposedSal: string;
}

export const calculateTotals = (employees: EmployeeIncrement[]): IncrementTotals => {
  // Check if any employee has a zero or missing increment
  const hasZeroIncrement = employees.some(e => parseFloat(e.proposedIncrement || '0') === 0);

  return {
    totalBasic:       employees.reduce((s, e) => s + (parseFloat(e.basicSalary)       || 0), 0).toFixed(2),
    totalGross:       employees.reduce((s, e) => s + (parseFloat(e.grossSalary)       || 0), 0).toFixed(2),
    totalProposedInc: employees.reduce((s, e) => s + (parseFloat(e.proposedIncrement) || 0), 0).toFixed(2),
    
    // If hasZeroIncrement is true, we return an empty string (blank) for the total
    totalProposedSal: hasZeroIncrement 
      ? "" 
      : employees.reduce((s, e) => s + (parseFloat(e.proposedSalary) || 0), 0).toFixed(2),
  };
};