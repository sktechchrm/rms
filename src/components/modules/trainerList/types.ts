// ─────────────────────────────────────────────────────────────────────────────
// Trainer Master List — types
// Path: src/components/modules/trainerList/types.ts
//
// A reusable list of trainers (per explicit confirmation — a separate
// sub-module rather than a plain text field on each training record),
// referenced by the Training Module. One record = one trainer.
// ─────────────────────────────────────────────────────────────────────────────

export type TrainerType = 'Internal' | 'External';
export const TRAINER_TYPE_OPTIONS: TrainerType[] = ['Internal', 'External'];

export interface TrainerData {
  trainerName: string;
  trainerType: TrainerType;
  designation: string;
  /** Free-text list of topics/subjects this trainer is qualified to
     cover — not constrained to Worker Guideline's list, since a trainer
     may also cover topics outside it (e.g. technical/machine training). */
  specialization: string;
  organization: string;
  contactNumber: string;
  email: string;
  remarks: string;

  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankTrainerData(): TrainerData {
  return {
    trainerName: '', trainerType: 'Internal', designation: '', specialization: '',
    organization: '', contactNumber: '', email: '', remarks: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_TRAINER_STATE: TrainerData = blankTrainerData();
