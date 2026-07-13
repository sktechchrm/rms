// ─────────────────────────────────────────────────────────────────────────────
// notesStyle.ts — shared visual/print CSS extracted from Left Worker
// Notice's NoticeLetter component (.nl-page/.nl-wrap/...), per explicit
// request to make every Employee Personal File print view "follow this
// module's print view like left worker notice".
//
// Left Worker Notice's own CSS forces the WHOLE letter into a single A4
// page (page-break-inside: avoid on .nl-wrap) — appropriate for a short
// notice, but several of these print views (Appointment Letter's ~16
// numbered clauses, Age Estimation, Personal Info Sheet) are naturally
// longer than one page. Two variants are exported:
//   NL_BASE_CSS       — the shared visual language (fonts, header, title
//                        bar, info-box, body typography, footer) with NO
//                        page-count assumption.
//   nlSinglePageCss()  — adds the single-page constraint, for genuinely
//                        short documents (Nominee Form fits this).
//   nlMultiPageCss()   — allows natural page flow for longer documents
//                        (Appointment Letter, Age Estimation, Personal
//                        Info Sheet) — same visual language, without
//                        forcing everything onto one sheet.
// Path: src/components/modules/employeePersonalFile/PrintFiles/notesStyle.ts
// ─────────────────────────────────────────────────────────────────────────────

export const NL_BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

  .nl-page, .nl-page * { font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif; box-sizing: border-box; }

  .nl-page {
    width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 18mm 16mm;
  }
  .nl-wrap { display: flex; flex-direction: column; gap: 0; }

  .nl-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 10px; }
  .nl-co-name { font-size: 20px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
  .nl-co-addr { font-size: 13px; color: #374151; margin: 0; }

  .nl-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 6px; border-bottom: 1px dashed #d1d5db; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
  .nl-title { font-size: 15px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; margin: 0; color: #111827; }
  .nl-meta { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; gap: 2px; }
  .nl-meta-type { color: #1d4ed8; font-weight: 600; }
  .nl-meta-date { color: #374151; }

  .nl-to { font-size: 14px; font-weight: 600; margin: 4px 0 6px; }
  .nl-salute { font-size: 14px; font-weight: 600; margin: 8px 0 10px; }

  .nl-emp-box { display: flex; gap: 0; border: 1.5px solid #374151; border-radius: 5px; overflow: hidden; margin-bottom: 14px; }
  .nl-emp-col { flex: 1; padding: 10px 12px; }
  .nl-emp-divider { width: 1.5px; background: #374151; flex-shrink: 0; }
  .nl-emp-head { font-size: 12.5px; font-weight: 700; border-bottom: 1.5px solid #374151; padding-bottom: 5px; margin-bottom: 6px; color: #111827; letter-spacing: 0.2px; }
  .nl-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
  .nl-emp-tbl td { padding: 2px 4px 2px 0; vertical-align: top; line-height: 1.5; }
  .nl-emp-tbl td:first-child { font-weight: 600; white-space: nowrap; padding-right: 6px; width: 38%; }
  .nl-emp-tbl td:first-child::after { content: ':'; }

  .nl-subject { font-weight: 700; text-decoration: underline; text-underline-offset: 2px; font-size: 13.5px; line-height: 1.7; margin: 0 0 10px; }

  .nl-body { display: flex; flex-direction: column; gap: 0; margin-bottom: 14px; }
  .nl-para { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 12px; }
  .nl-clause-title { font-weight: 700; font-size: 13.5px; margin: 0 0 4px; }

  .nl-copy { font-size: 13px; margin-bottom: 12px; }
  .nl-copy p { margin: 0 0 4px; }
  .nl-copy ol { list-style: none; padding: 0; margin: 0; }
  .nl-copy li { display: flex; gap: 6px; margin-bottom: 2px; }
  .nl-copy li span { font-weight: 600; flex-shrink: 0; }

  .nl-footer { margin-top: auto; padding-top: 8px; }
  .nl-authority { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; }

  @media print {
    body * { visibility: hidden !important; }
    .nl-page, .nl-page * { visibility: visible !important; }
    .nl-page {
      position: relative !important; width: 100% !important;
      min-height: unset !important; padding: 0 !important; margin: 0 !important;
      box-shadow: none !important; border-radius: 0 !important; background: white !important;
    }
    html, body { background: #fff !important; color: #000 !important; }
  }
`;

/** Single-page variant — forces the whole document onto one A4 sheet,
   same as Left Worker Notice's own letters. Use for genuinely short
   documents only (Nominee Form). */
export function nlSinglePageCss(): string {
  return `
    ${NL_BASE_CSS}
    .nl-wrap { min-height: calc(297mm - 36mm); }
    @media print {
      @page { size: A4 portrait; margin: 14mm 15mm; }
      .nl-page { position: absolute !important; inset: 0 !important; }
      .nl-wrap { min-height: calc(297mm - 28mm) !important; height: calc(297mm - 28mm) !important; page-break-inside: avoid !important; }
      .nl-footer { page-break-inside: avoid !important; }
    }
  `;
}

/** Multi-page variant — same visual language, but content is allowed to
   flow naturally across pages (no forced single-sheet height/page-break-
   avoid on the whole wrapper). Use for longer documents (Appointment
   Letter, Age Estimation, Personal Info Sheet). */
export function nlMultiPageCss(): string {
  return `
    ${NL_BASE_CSS}
    @media print {
      @page { size: A4 portrait; margin: 14mm 15mm; }
      .nl-emp-box, .nl-clause-title, .nl-copy { break-inside: avoid; page-break-inside: avoid; }
      .nl-footer { break-inside: avoid; page-break-inside: avoid; }
    }
  `;
}
