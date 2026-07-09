// ─────────────────────────────────────────────────────────────────────────────
// RequisitionView.tsx
// Path: src/components/requisition/RequisitionView.tsx
//
// Point 1 (Global Standard Templates): this file used to BE the print
// layout directly. It's now a thin dispatcher — the actual layouts live
// in ./templates/{Compact,Standard,Detailed}Template.tsx. Picks one based
// on requisition.template (set via the selector in RequisitionForm.tsx),
// defaulting to 'standard' for any requisition saved before this feature
// existed (template field absent) or where it's unset for any other reason.
// ─────────────────────────────────────────────────────────────────────────────

import type { RequisitionViewProps } from "./types";
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import CompactTemplate from './templates/CompactTemplate';
import StandardTemplate from './templates/StandardTemplate';
import DetailedTemplate from './templates/DetailedTemplate';

export default function RequisitionViewComponent({
  requisition, authorization,
}: RequisitionViewProps & { authorization: AuthorizationState }) {
  switch (requisition.template) {
    case 'compact':  return <CompactTemplate  requisition={requisition} authorization={authorization} />;
    case 'detailed': return <DetailedTemplate requisition={requisition} authorization={authorization} />;
    case 'standard':
    default:         return <StandardTemplate requisition={requisition} authorization={authorization} />;
  }
}
