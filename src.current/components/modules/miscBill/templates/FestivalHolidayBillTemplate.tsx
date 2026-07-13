// ─────────────────────────────────────────────────────────────────────────────
// FestivalHolidayBillTemplate.tsx — thin wrapper, see HolidayBillTemplate.tsx
// for the rationale (shared MiscBillView, parameterized by data.template).
// Path: src/components/modules/miscBill/templates/FestivalHolidayBillTemplate.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { MiscBillTemplateProps } from '../types';
import MiscBillView from '../MiscBillView';

export default function FestivalHolidayBillTemplate(props: MiscBillTemplateProps) {
  return <MiscBillView {...props} />;
}
