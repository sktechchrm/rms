// ─────────────────────────────────────────────────────────────────────────────
// WORKER GUIDELINE DATA — helpers only
//
// All HR policy data (salary, leave, overtime, environment targets) now lives
// in the factory files under `workerGuideline:`.
//
// getGuidelineConfig(id) reads factory.workerGuideline directly.
// One change in a factory file updates every Worker Guideline page automatically.
//
// Types re-exported from FactoryTypes so callers have a single import path.
// ─────────────────────────────────────────────────────────────────────────────

import type { FactoryConfig, WorkerGuideline, SalaryBreakdown, LeaveInfo } from '../../factories/FactoryTypes';
import { getFactoryById } from '../../factories/FactoryRegistry';

// Re-export types so page components can import from this file
export type { WorkerGuideline, SalaryBreakdown, LeaveInfo };

// Backward-compat alias — existing imports of WorkerGuidelineConfig still compile
export type WorkerGuidelineConfig = WorkerGuideline & { factoryId: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the HR guideline config for a factory.
 * Reads from factory.workerGuideline (canonical new field).
 * Non-null assertion is safe: every factory using the Worker Guideline module
 * must define workerGuideline. The field is optional in FactoryConfig only so
 * that legacy factories that haven't migrated yet still compile.
 */
export function getGuidelineConfig(factoryId: string): WorkerGuidelineConfig {
  const factory = getFactoryById(factoryId);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { ...factory.workerGuideline!, factoryId: factory.id };
}

/**
 * Returns the set of active topic numbers (1–36) for a factory.
 * If FactoryConfig has workerGuidelineTopics defined, only those are returned.
 * If undefined, all 36 are returned (default — MG Shirtex).
 */
export function getActiveTopics(factory: FactoryConfig): Set<number> {
  if (factory.workerGuidelineTopics) {
    return new Set(factory.workerGuidelineTopics);
  }
  return new Set(Array.from({ length: 36 }, (_, i) => i + 1));
}
