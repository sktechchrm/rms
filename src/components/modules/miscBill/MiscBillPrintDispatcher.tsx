// ─────────────────────────────────────────────────────────────────────────────
// MiscBillPrintDispatcher.tsx
// Path: src/components/modules/miscBill/MiscBillPrintDispatcher.tsx
//
// Thin dispatcher matching RequisitionView.tsx's pattern — picks one of the
// 3 template files based on data.template. All 3 currently render
// identically (see MiscBillView.tsx — the table structure genuinely is the
// same for all 3 per the reference image, only the Count label/formula
// differ, which MiscBillView already parameterizes) — kept as 3 separate
// files anyway so each can be given a visually distinct layout later
// without restructuring anything.
// ─────────────────────────────────────────────────────────────────────────────

import type { MiscBillTemplateProps } from './types';
import HolidayBillTemplate from './templates/HolidayBillTemplate';
import AdjustmentBillTemplate from './templates/AdjustmentBillTemplate';
import FestivalHolidayBillTemplate from './templates/FestivalHolidayBillTemplate';

export default function MiscBillPrintDispatcher({ data, authorization }: MiscBillTemplateProps) {
  switch (data.template) {
    case 'adjustment': return <AdjustmentBillTemplate data={data} authorization={authorization} />;
    case 'festival':   return <FestivalHolidayBillTemplate data={data} authorization={authorization} />;
    case 'holiday':
    default:            return <HolidayBillTemplate data={data} authorization={authorization} />;
  }
}
