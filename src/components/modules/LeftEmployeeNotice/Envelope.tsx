// ─────────────────────────────────────────────────────────────────────────────
// Envelope.tsx
//
// REBUILT to match a real-world envelope reference photo, rather than a
// "designed template" look:
//  - FROM block: top-left, simple stacked lines (name/title, org/street, city)
//  - Reserved blank box top-right for a postage stamp / speed-post sticker
//  - TO block: starts roughly a third down the envelope, flows naturally as
//    wrapped lines (not separate labeled গ্রাম/ডাকঘর/থানা/জেলা fields)
//  - No decorative flap graphic or postal lines — a real envelope doesn't
//    have those printed on it
//
// Still drawn at real DL dimensions (220mm x 110mm) using flexbox flow
// layout (not absolute positioning with magic offsets) so content can never
// overlap regardless of address length — same fix rationale as before.
//
// FIX (printed to actual Envelope-DL paper feed comes out as a tiny shrunk
// cluster in one corner — 1st round): this component draws its own content
// box at the correct real DL size (`.envelope` is `width: 220mm; height:
// 110mm`), but the PAGE itself was never told to be that size — only
// PAGE_A4_PORTRAIT was imported, which sets `@page` to A4 portrait (210mm x
// 297mm). Added an explicit `@page { size: 220mm 110mm; margin: 0; }`.
//
// FIX (printed output comes out ROTATED 90° into a thin vertical strip —
// 2nd round): the previous fix declared `@page { size: 220mm 110mm; }` — a
// LANDSCAPE shape (wider than tall). That's correct for how the envelope is
// DESIGNED, but many printer drivers define their "Envelope DL" paper
// source as physically PORTRAIT — 110mm wide x 220mm tall, fed short-edge-
// first — regardless of how the content inside is laid out. When the page
// CSS declares a landscape shape but the real paper loaded in the tray is
// portrait, the print engine's only way to reconcile that mismatch is to
// auto-rotate the entire layout 90° to fit the actual sheet.
// FIX: stopped fighting the tray's real orientation. `@page` matches it
// directly — `size: 110mm 220mm` (portrait) — and the VISUAL envelope
// content is rotated 90° via CSS instead, so once physically printed onto
// the portrait-fed DL sheet, it reads correctly as a landscape envelope.
// `.envelope-container` is the real page slot (110mm x 220mm, in normal
// flow so page-break-after:always works reliably); `.envelope` (the actual
// 220mm x 110mm landscape design) is an absolutely-positioned child,
// rotated 90° with `transform-origin: top left` and shifted `left: 110mm`
// so its occupied region maps exactly onto the page slot.
//
// FIX (3rd round — extra blank FIRST page, plus unwanted border):
// (1) This component never told the print engine to hide the REST of the
// app around it — no `body * { visibility: hidden }` / `.envelope-page,
// .envelope-page * { visibility: visible }` pair, unlike every sibling
// notice/letter component in this codebase. Without that isolation, the
// entire surrounding app shell — sidebar, the "Skip to main content"
// accessibility skip-link, everything — prints as page 1 in full, BEFORE
// the actual envelope page, exactly matching the reported blank/UI-chrome
// first page. FIX: added that same visibility pair here, scoped to
// `.envelope-page` (the top-level wrapper this component renders).
// (2) `.envelope`'s print rule explicitly set `border: 1px solid #000`,
// producing a visible border around the printed envelope that wasn't
// wanted. FIX: removed — print now explicitly sets `border: none` rather
// than relying on the cascade, so nothing else can reintroduce one.
// ─────────────────────────────────────────────────────────────────────────────

import { useFactory } from '../../../hooks/useFactory';
import React from 'react';
import { Employee, Address } from './LeftNoticeDataType';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

interface Props {
  employee: Employee;
  /** Which envelope(s) to render — defaults to both (present + permanent) */
  addressType?: 'present' | 'permanent' | 'both';
}

interface EnvelopeCardProps {
  employee: Employee;
  address: Address;
  addressLabel: string; // small header above the TO block, e.g. "Speed Post — Present Address"
}

// ── Single envelope — fixed DL dimensions (220mm x 110mm), flow layout ───────
function EnvelopeCard({ employee, address, addressLabel }: EnvelopeCardProps) {
  const factory = useFactory();

  const addressLines = [address.houseNo, address.village, address.postOffice, address.thana, address.district]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="envelope-container">
      <div className="envelope">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: '15mm',
          }}
        >
          {/* FROM */}
          <div style={{ width: '42%' }}>
            <div style={{ fontWeight: 1000 }}>হইতে,</div>

            <div style={{ fontWeight: 1000 }}>
              {employee.companyName || factory.nameEn}
            </div>

            <div style={{ fontWeight: 1000 }}>
              {employee.companyAddress || '৩২, লক্ষীপুরা, চন্দনা, জয়দেবপুর, গাজীপুর-১৭০০'}
            </div>
          </div>

          {/* TO */}
          <div style={{ width: '42%' }}>
            <div style={{ fontWeight: 1000 }}>
              প্রতি,
            </div>

            <div style={{ fontWeight: 1000 }}>
              {addressLabel}
            </div>

            <div style={{ fontWeight: 1000 }}>
              {employee.name || 'Employee Name'}
            </div>

            <div style={{ fontWeight: 1000 }}>
                {(employee.fatherName || employee.husbandName) && (
                  <p>
                    {employee.fatherName ? `son/daughter of ${employee.fatherName}` : `wife of ${employee.husbandName}`}
                  </p>
                )}
                {addressLines && (
                  <p >
                    {addressLines}
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export const Envelope: React.FC<Props> = ({ employee, addressType = 'both' }) => {
  const showPresent   = addressType === 'present'   || addressType === 'both';
  const showPermanent = addressType === 'permanent' || addressType === 'both';

  return (
    <div className="envelope-page">
      {showPresent && (
        <EnvelopeCard
          employee={employee}
          address={employee.presentAddress}
          addressLabel="(বর্তমান ঠিকানা)"
        />
      )}

      {showPermanent && (
        <EnvelopeCard
          employee={employee}
          address={employee.permanentAddress}
          addressLabel="(স্থায়ী ঠিকানা)"
        />
      )}

      {/* Styles — envelope is drawn at real DL dimensions (220mm x 110mm)
          on SCREEN (landscape, matches how a real envelope actually
          looks). PRINT is different: the physical paper tray is portrait
          (110mm x 220mm), so print-mode rotates the visual box — see the
          file-header FIX comment above for the full reasoning. */}
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}

        .envelope-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 24px 0;
          width: 100%;
          overflow-x: auto;
        }

        .envelope-container {
          width: 220mm;
          flex-shrink: 0;
        }

        .envelope {
          position: relative;
          width: 220mm;
          height: 110mm;
          background: #fff;
          border: 1px solid #d1d5db;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          box-sizing: border-box;
          padding: 10mm 12mm;
        }

        @media print {
          /* Matches the tray's actual PORTRAIT orientation (110mm wide x
             220mm tall) instead of fighting it — see file-header FIX
             comment. margin:0 since the rotated .envelope box's own
             padding (10mm 12mm, unchanged from screen) already provides
             the safe printable margin from the true paper edge. */
          @page { size: 110mm 220mm; margin: 1in 0.75in 1in 0.75in; }

          /* ISOLATION (3rd round fix): hide EVERYTHING else in the app —
             sidebar, the "Skip to main content" accessibility skip-link,
             all of it — and reveal only this component's own output.
             Without this pair, the whole surrounding app shell prints as
             its own full page BEFORE the actual envelope page, which is
             exactly the reported extra blank/UI-chrome first page. This
             mirrors the same visibility pair every sibling notice/letter
             component in this codebase already uses (e.g. .nl-page,
             .nl-page * { visibility: visible } in
             DisciplinaryNoticeLetter.tsx) — this component was simply
             missing its own version of it until now. */
          body * { visibility: hidden !important; }
          .envelope-page, .envelope-page * { visibility: visible !important; }

          /* ModuleShell's root container (and other ancestors) carry
             overflow:hidden as an inline style which clips its rendered
             content box regardless of child positioning. Since this is a
             shared component we can't edit, force every ancestor to
             overflow:visible in print so our positioned envelope content
             isn't clipped to a tiny visible region. */
          html, body, body * {
            overflow: visible !important;
          }

          /* Width now matches the page's REAL print width (110mm
             portrait), not the 220mm landscape design width — that 220mm
             value was correct for the OLD (landscape @page) approach but
             is wrong now that @page itself is portrait. */
          html, body { width: 110mm; height: auto; }

          /* ISOLATION (4th round fix — blank page still appeared after
             the visibility fix above): visibility:hidden hides content
             VISUALLY but the hidden elements still occupy their full
             layout space. So the entire app shell above this component
             (navbar, sidebar, the skip-link, etc.) was invisible but
             still reserved its full height in the document's normal
             flow — pushing .envelope-page down far enough that it
             spilled onto a second page, with the first page showing
             nothing but that reserved blank space. FIX: pull
             .envelope-page OUT of normal document flow entirely with
             position: absolute; top: 0; left: 0, so it no longer cares
             how much space the (still invisible) preceding elements
             take up — same technique the sibling notice/letter
             components in this codebase use (e.g. .nl-page { position:
             absolute; inset: 0 } in DisciplinaryNoticeLetter.tsx).
             .envelope-container below stays in NORMAL flow relative to
             THIS element (its own containing block once positioned), so
             page-break-after between the two envelopes is unaffected. */
          .envelope-page {
            position: absolute;
            top: 0;
            left: 0;
            display: block;
            width: 110mm;
            padding: 0;
            gap: 0;
            overflow: visible;
          }

          .envelope-container {
            /* This IS the physical page slot now: sized to match the
               real portrait page (110mm x 220mm) exactly, one per
               printed sheet. The actual landscape-shaped envelope design
               lives inside it, rotated — see .envelope below. */
            width: 110mm;
            height: 220mm;
            position: relative;
            margin: 0;
            overflow: hidden;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .envelope-container:last-child { page-break-after: avoid; }

          .envelope {
            /* The real 220mm x 110mm landscape design, rotated 90° to
               fit inside the 110mm x 220mm portrait page slot above.
               Standard landscape-in-portrait technique: position the
               unrotated box's top-left corner at (110mm, 0) in page
               coordinates, then rotate 90° around that same corner
               (transform-origin: top left) — the box's occupied region
               then maps exactly onto the 0–110mm / 0–220mm page area.
               Once physically printed on the portrait-fed sheet and the
               envelope is picked up and read normally, this appears
               correctly oriented as a landscape envelope. */
            position: absolute;
            top: 0;
            left: 110mm;
            width: 220mm;
            height: 110mm;
            transform: rotate(90deg);
            transform-origin: top left;
            box-shadow: none;
            /* No border in print (3rd round fix) — the screen-only
               preview border above (#d1d5db) is a visual aid for the
               in-app preview; the printed envelope itself should be
               border-free. Explicitly set here rather than relying on
               the cascade, so nothing else can reintroduce one. */
            border: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Envelope;