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
//
// FIX (4th round — blank page still appeared after the visibility fix):
// visibility:hidden hides content VISUALLY but hidden elements still
// occupy their layout space, so the invisible app shell above this
// component still pushed .envelope-page onto page 2. FIX: `.envelope-page`
// is pulled fully out of normal document flow with `position: absolute;
// top: 0; left: 0` in print, so it no longer cares how tall the (still
// invisible) preceding elements are.
//
// FIX (5th round — text too small to read clearly, and no real,
// guaranteed gap between the FROM and TO blocks): two related problems.
// (1) No element here ever set an explicit font-size at all — only
// `fontWeight: 1000` was set, which isn't even a standard CSS font-weight
// value (the named/legacy scale tops out at 900; while newer engines do
// accept arbitrary 1–1000 values per CSS Fonts Level 4, relying on an
// unusually high non-standard number instead of just picking a real,
// widely-supported weight was fragile and didn't actually make the TEXT
// itself any bigger — bold weight and font SIZE are unrelated). FIX:
// explicit font-size added — a readable base size on the shared row
// wrapper (inherited by every line), with the addressee/company name
// lines bumped larger still so they stand out, and weights clamped to
// standard values (700/800) instead of 1000.
// (2) The FROM/TO gap was produced by `justify-content: space-between`
// across two 42%-width columns — whatever space happens to be LEFT OVER
// after those two columns (about 16% of 220mm, ≈35mm/1.4in, and it shifts
// any time column content or width changes) became the gap, not a real,
// intentional measurement. FIX: switched to `justify-content: flex-start`
// with an explicit `marginRight: '1in'` on the FROM block specifically —
// an exact, guaranteed 1-inch gap regardless of content length. Note on
// which physical direction this ends up being: pre-rotation HORIZONTAL
// spacing between the side-by-side FROM/TO columns (this margin) becomes
// VERTICAL spacing on the final printed page once the whole `.envelope`
// box is rotated 90° for the portrait DL tray (see the 2nd-round fix
// above) — so this 1-inch value is what actually separates the FROM block
// from the TO block on the printed sheet, which is the effect being asked
// for regardless of which axis label ("right" vs "bottom") describes it
// pre- vs post-rotation.
//
// FIX (6th round — print output should not be bold, and FROM→TO distance
// should match standard envelope conventions): (1) every text line here
// carried an explicit bold weight (700/800 after the 5th-round cleanup),
// which is fine for the on-screen preview's legibility but wasn't wanted
// in the actual PRINTED output. Rather than stripping bold from every
// individual inline style (which would also affect the screen preview),
// added a single print-only override — `.envelope, .envelope * {
// font-weight: 400 !important; }` inside `@media print` — so print always
// comes out regular weight regardless of what any individual line
// specifies, while the screen preview is untouched.
// (2) The FROM→TO gap was only 1 inch (from the previous round's fix),
// which reads as cramped compared to a standard mailed envelope — real-
// world convention leaves the sender's address small and near the top
// edge, with generous clear space before the (larger, more prominent)
// recipient address further down. Increased the FROM block's
// `marginRight` from 1in to 3in — pre-rotation horizontal spacing, which
// becomes the vertical FROM→TO distance on the final printed DL sheet
// (220mm / ~8.66in tall) — leaving a proportionally standard-looking gap
// instead of a cramped one.
//
// FIX (7th round — নাম and পিতা/স্বামী printed on two separate lines
// instead of one): নাম was its own <div>, and পিতা/স্বামী was a <p> inside
// a SEPARATE <div> below it — <div> and <p> are both block-level elements
// by default, so each always started its own line regardless of how short
// the combined text actually was. FIX: merged them into a single <div>,
// with the পিতা/স্বামী part rendered as an inline <span> (comma-separated)
// instead of its own block-level <p> — both now share one line, wrapping
// naturally only if the combined text is too long for the column width.
//
// FIX (8th round — REVERTS the 7th round): combining নাম and পিতা/স্বামী
// onto one shared line backfired for longer names — cramming both fields
// into a single line made it MORE likely to overflow the column width,
// and a wrapped line breaks wherever it runs out of room, with no regard
// for word/field boundaries — producing an uglier result than two
// separate lines: "নাম: রমজান আলী" / "মল্লিক" (the surname wrapping onto
// its own line, followed by পিতা wrapping similarly). What's actually
// wanted: নাম and পিতা/স্বামী each get their OWN line, and each of those
// lines should NEVER wrap internally (stay on exactly one line even if
// long) — only ঠিকানা (address) is allowed/expected to wrap across two
// lines. FIX: split নাম and পিতা/স্বামী back into two separate <div>s
// (undoing the 7th round's merge), and added `whiteSpace: 'nowrap'` to
// both of them specifically — ঠিকানা's <p> deliberately has NO nowrap,
// so it keeps wrapping naturally.
//
// FIX (9th round — same problem, mirrored on the FROM block): the company
// name ("এমজি শার্টেক্স লিমিটেড") was wrapping mid-word for the same
// reason নাম/পিতা did — a normal-wrap line at 18pt in a column not quite
// wide enough for the full name at that size. FIX: `whiteSpace: 'nowrap'`
// added to the company name line, same technique as the 8th round. The
// company address line keeps normal wrapping (it's expected to wrap), but
// was fragmenting into 3 lines instead of a clean 2 — nudged its font
// size down from the inherited 16pt to 14pt so more characters fit per
// line, without touching the column's width (avoiding any overflow risk
// from widening it). This doesn't guarantee exactly 2 lines for every
// possible address length, but matches the target wrap for addresses of
// this typical length.
//
// FIX (10th round, REVERTED — attempted a native-portrait, non-rotated
// redesign): briefly replaced the rotated-landscape approach with a
// genuinely portrait-native layout (no CSS rotation at all). REVERTED per
// explicit confirmation: the rotated print-preview appearance (this
// component's actual output — text reading correctly only once the page
// is turned 90°) is the CORRECT and EXPECTED result for this printer's
// physical paper feed, not a bug. The rotated-landscape design (rounds
// 2–9 above) is restored as-is.
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
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          width: '100%',
          marginTop: '15mm',
          fontSize: '16pt',
          boxSizing: 'border-box',
        }}
      >

        {/* FROM */}
        <div
          style={{
            width: '42%',
            marginRight: '75mm',
          }}
        >
          <div style={{ fontWeight: 700 }}>
            হইতে,
          </div>

          <div
            style={{
              fontSize: '18pt',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {employee.companyName || factory.nameEn}
          </div>

          <div
            style={{
              fontSize: '14pt',
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            {employee.companyAddress ||
              '৩২, লক্ষীপুরা, চন্দনা, জয়দেবপুর, গাজীপুর-১৭০০'}
          </div>
        </div>


        {/* TO */}
        <div
          style={{
            width: '42%',
          }}
        >
          <div style={{ fontWeight: 700 }}>
            প্রতি,
          </div>

          <div
            style={{
              fontWeight: 400,
              marginBottom: '3mm',
            }}
          >
            {addressLabel}
          </div>


          <div
            style={{
              fontSize: '18pt',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            নাম: {employee.name || 'Employee Name'}
          </div>


          {(employee.fatherName || employee.husbandName) && (
            <div
              style={{
                fontWeight: 400,
                whiteSpace: 'nowrap',
              }}
            >
              {employee.fatherName
                ? `পিতা: ${employee.fatherName}`
                : `স্বামী: ${employee.husbandName}`}
            </div>
          )}


          {addressLines && (
            <div
              style={{
                fontWeight: 400,
                lineHeight: 1.5,
                marginTop: '3mm',
              }}
            >
              ঠিকানা: {addressLines}
            </div>
          )}

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
             comment. */
          @page { size: 110mm 220mm; margin: 1in 0.75in 1in 0.75in; }

          /* 6th-round fix: print output should never be bold, regardless
             of what any individual line's inline style specifies (the
             screen preview keeps its own bold weights for on-screen
             legibility — this override only applies inside @media
             print). !important is needed since it must outrank the
             inline fontWeight styles set in the JSX above. */
          .envelope, .envelope * { font-weight: 400 !important; }

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