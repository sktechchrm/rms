// ─────────────────────────────────────────────────────────────────────────────
// Emergency Log — types
// Path: src/components/modules/emergencyLog/types.ts
//
// ONE module, TWO log types switched via a dropdown (same "all fields
// kept regardless of active type" pattern as Requisition's Material/
// Taka/Manpower types and Miscellaneous Bill's 3 templates):
//   'Injury and Accident Log' — workplace injury/accident register,
//   matching typical EHS (Environment, Health & Safety) audit register
//   requirements (BSCI/Sedex/WRAP audits commonly check an Accident
//   Register alongside a Grievance Register).
//   'Grievance Log' — per explicit confirmation, a SIMPLE register-style
//   entry (date/nature/category/action/resolution), deliberately
//   separate from and NOT connected to the full, existing Grievance
//   module (which has its own complete workflow) — this is a quick
//   logging register, not a replacement for that workflow.
// ─────────────────────────────────────────────────────────────────────────────

export type LogType = 'Injury and Accident Log' | 'Grievance Log';
export const LOG_TYPE_OPTIONS: LogType[] = ['Injury and Accident Log', 'Grievance Log'];

export type Severity = '' | 'Minor' | 'Moderate' | 'Severe' | 'Fatal';
export const SEVERITY_OPTIONS: Severity[] = ['Minor', 'Moderate', 'Severe', 'Fatal'];

export type InvestigationStatus = '' | 'Pending' | 'In Progress' | 'Completed';
export const INVESTIGATION_STATUS_OPTIONS: InvestigationStatus[] = ['Pending', 'In Progress', 'Completed'];

export const GRIEVANCE_CATEGORY_OPTIONS = ['Wage', 'Harassment', 'Working Conditions', 'Discrimination', 'Safety', 'Other'];
export type ResolutionStatus = '' | 'Pending' | 'Resolved' | 'Escalated';
export const RESOLUTION_STATUS_OPTIONS: ResolutionStatus[] = ['Pending', 'Resolved', 'Escalated'];

export interface EmergencyLogData {
  logType: LogType;

  // ── Common ──────────────────────────────────────────────────────────────
  employeeName: string;
  cardNo: string;
  designation: string;
  department: string;
  date: string; // date of incident (injury/accident) or complaint (grievance)
  remarks: string;

  // ── Injury and Accident Log ────────────────────────────────────────────
  timeOfIncident: string;
  locationOfIncident: string;
  typeOfInjury: string;
  severity: Severity;
  incidentDescription: string;
  immediateActionTaken: string;
  firstAidGiven: boolean;
  medicalTreatmentRequired: boolean;
  hospitalReferred: boolean;
  hospitalName: string;
  witnessNames: string;
  reportedBy: string;
  investigationStatus: InvestigationStatus;
  correctiveAction: string;
  daysLost: string;

  // ── Grievance Log (simple register — separate from the full Grievance
  //    module's workflow, per explicit confirmation) ─────────────────────
  natureOfGrievance: string;
  grievanceCategory: string;
  actionTaken: string;
  resolutionStatus: ResolutionStatus;
  resolutionDate: string;

  factoryName: string;
  factoryAddress: string;
}

export function blankEmergencyLogData(): EmergencyLogData {
  return {
    logType: 'Injury and Accident Log',
    employeeName: '', cardNo: '', designation: '', department: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    timeOfIncident: '', locationOfIncident: '', typeOfInjury: '', severity: '',
    incidentDescription: '', immediateActionTaken: '',
    firstAidGiven: false, medicalTreatmentRequired: false, hospitalReferred: false, hospitalName: '',
    witnessNames: '', reportedBy: '', investigationStatus: '', correctiveAction: '', daysLost: '',
    natureOfGrievance: '', grievanceCategory: '', actionTaken: '', resolutionStatus: '', resolutionDate: '',
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_EMERGENCY_LOG_STATE: EmergencyLogData = blankEmergencyLogData();
