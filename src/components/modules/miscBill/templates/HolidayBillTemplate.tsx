// ─────────────────────────────────────────────────────────────────────────────
// HolidayBillTemplate.tsx — thin wrapper matching Requisition's per-template
// file convention. All 3 templates share the same table structure (per the
// reference image), parameterized in MiscBillView — this file exists for
// discoverability/consistency with that convention, not to duplicate logic.
// Path: src/components/modules/miscBill/templates/HolidayBillTemplate.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { MiscBillTemplateProps } from '../types';
import MiscBillView from '../MiscBillView';

export default function HolidayBillTemplate(props: MiscBillTemplateProps) {
  return <MiscBillView {...props} />;
}
