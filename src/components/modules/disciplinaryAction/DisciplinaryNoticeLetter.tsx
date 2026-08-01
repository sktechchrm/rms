// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryNoticeLetter.tsx — reuses Left Worker Notice's visual/print
// CSS structure.
//
// FIX (print paragraph-spacing pass): .nl-para had NO explicit
// margin-bottom inside the @media print block, so the print stylesheet's
// only rule for it (font-size + line-height) left margin-bottom to
// whatever the screen rule (12px) resolved to in print units — this
// rendered inconsistently across browsers/print engines and collapsed
// paragraph gaps together (Image 1: cramped). Added an explicit
// print-mode margin-bottom (10pt) on .nl-para so paragraphs keep clear,
// consistent breathing room between them when printed/exported to PDF
// (Image 2: proper spacing). Same explicit margin-bottom added to
// .nl-eval-text for consistency in the evaluation output.
//
// FIX (print-view standard pass): cleaned up CSS — .nl-complaint-inline
// was defined mid-file with inconsistent indentation, breaking the flow
// of the stylesheet; moved next to the other body-content rules. Dead
// classes (.nl-rt-p, .nl-rt-spacer, .nl-rt-list) removed — evaluation/
// complaint/finalDecision rich text now renders via renderRichText()'s
// actual JSX output (<p>/<ul>/<ol> with their OWN classes), so these
// legacy marker-string-era rules were never actually applied.
//
// FIX (complaint → plain single paragraph): Notice 1's অভিযোগ now uses
// stripHtml(data.complaint) — plain text, no renderRichText — so it
// naturally reads as one continuous sentence with no block wrappers or
// <br> to fight with. This SUPERSEDES the earlier DOM-flattening
// useEffect/#nl-complaint-content approach (that code and its CSS have
// been removed; the element they targeted no longer exists in the JSX).
//
// FIX (Notice 3 salute bold): "প্রতি, / তদন্ত কমিটির সদস্যবৃন্দ।" was
// rendering bold because .nl-salute (the CSS class) sets font-weight:600,
// and unlike the evaluation salute block, Notice 3's wrapping <div> never
// carried the fontWeight:400 inline override — so its <p> children
// inherited the class's 600 weight. Added the same inline override here.
//
// FIX (evaluation print normalization): renderRichText()'s output
// elements can carry their own inline `style="...!important"`
// attributes, which always outrank .nl-eval-text's stylesheet rules
// (even !important ones) regardless of selector specificity. Since the
// print pipeline clones the live DOM via outerHTML, whatever inline
// styles exist at that moment are exactly what gets printed — showing
// up as inconsistent font-size/line-height and uneven "dead space"
// between paragraphs/lists. Added a DOM-level normalize pass (real
// inline !important via el.style.setProperty) for both .nl-eval-text
// blocks, using em-relative sizing so it tracks whichever font-size
// .nl-eval-text currently has (screen vs print) automatically, and
// explicitly zeroes the last top-level child's margin-bottom so the
// divider below each section doesn't inherit extra trailing space.
//
// FIX (multi-page pagination + uniform margins — EVALUATION ONLY): .nl-wrap
// previously had a FIXED `height: calc(297mm - 28mm)` plus
// `page-break-inside: avoid` in print — that treats the entire letter as
// one unbreakable box exactly one page tall. For short notices (1–4)
// that's harmless since they always fit on one page anyway, but the
// evaluation output (তদন্ত কমিটির প্রতিবেদন ও সুপারিশ) can genuinely run
// past one page — several witness statements + recommendation +
// committee signatures — and neither the fixed height nor the
// avoid-break can actually be honored once content is taller than that.
// The browser's only option is to reserve a big blank gap at the bottom
// of page 1 (right after wherever it was forced to stop) and push the
// remainder onto a mostly-empty page 2. Combined with
// fitPrintWrapToOnePage() (in DisciplinaryActionManager.tsx) always
// trying to scale the WHOLE thing down to fit one page, genuinely long
// content either got squeezed illegibly or still didn't fit and produced
// this exact broken layout.
// FIX: .nl-wrap now has TWO print variants, chosen per notice type
// instead of one shared rule:
//   - .nl-wrap--flow  (notice === 'evaluation'): min-height only (no
//     fixed height, no page-break-inside:avoid) — free to grow past one
//     page. To keep it from breaking awkwardly mid-content once it does
//     span two pages, break-avoid rules are applied at the section
//     level instead of the whole-letter level: .nl-para, .nl-eval-label
//     (avoid a heading being the last line on a page), and
//     .nl-committee-sig-row (keep the signature block together).
//   - .nl-wrap--single (notices 1, 2, 3, 4): keeps the ORIGINAL fixed
//     height + page-break-inside:avoid behaviour — these are bounded,
//     short-form letters and must always render on exactly one page,
//     with .nl-footer's margin-top:auto still pinning the signature
//     block to the bottom of that single page.
// (Earlier revision of this fix mistakenly applied the flow behaviour to
// ALL notices via a single .nl-wrap rule, which let Notice 4's চূড়ান্ত
// সিদ্ধান্ত spill onto a second page if its content ran long. Splitting
// into --flow/--single restores the one-page guarantee for 1–4 while
// keeping the evaluation report's multi-page fix intact.)
// The corresponding scale-down threshold logic in
// DisciplinaryActionManager.tsx's fitPrintWrapToOnePage() should key off
// the same distinction (notice === 'evaluation' vs not, or the
// nl-wrap--flow/--single class) so Notice 4 still gets scaled down to
// fit if its content is long, rather than overflowing a fixed-height box.
//
// FOLLOW-UP FIX (page 1 left half-empty): break-inside:avoid was
// initially also applied to the WHOLE .nl-eval-section (heading + every
// witness statement together). That's too coarse — once that entire
// block didn't fit in whatever space remained on the current page, the
// browser's only option was to push the ENTIRE section to the next page
// as one atomic unit, leaving roughly half of the previous page blank
// (visible as page 1 ending right after "নিচে তদন্তের বিস্তারিত বিবরণ ও
// সিদ্ধান্ত উপস্থাপন করা হলো:" with the rest of the page empty, and the
// whole তদন্তে প্রাপ্ত জবানবন্দি section starting fresh on page 2).
// break-inside:avoid was moved down to the individual item level
// instead — .nl-eval-text li and .nl-eval-text > p — small enough units
// that avoiding a mid-item split never costs a large blank gap, while
// the list as a whole is still free to break BETWEEN items and actually
// fill each page.
// Also: @page margin was asymmetric (14mm top/bottom, 15mm left/right)
// — changed to a single uniform 15mm on all four sides.
//
// FIX (Notice 4 punishment text hardcoded — this round): the body
// previously always printed the literal string
// "সরাসরি অপসারন/বরখাস্ত" regardless of what was actually decided.
// FinalDecisionForm.tsx's শাস্তি/দণ্ড select wasn't wired to any state
// at all (no value/onChange), so there was never a real value to print
// in the first place — fixed on that side too (data.punishmentType).
// Here, the hardcoded string is replaced with data.punishmentType,
// falling back to the same '_____' placeholder pattern used elsewhere
// in this file (e.g. data.complaint, data.finalDecision) for whenever
// the field hasn't been filled in yet.
//
// CARRIED FORWARD from prior rounds:
// - Notice 4 (চূড়ান্ত সিদ্ধান্ত অবহিতকরণ), structured like Notice 1.
// - সূত্র নং dynamic per notice type (factory code + notice-type code +
//   card serial + date), falling back to data.referenceNo only if set.
// - Evaluation output signs off with the investigation committee's own
//   members, not the standard authority signature.
// - চূড়ান্ত সিদ্ধান্ত (Notice 4) এবং সারাংশ/সুপারিশ (evaluation) render
//   via renderRichText() — RichTextArea's Bold/Italic/Bullet/Numbered
//   markdown-lite output. (অভিযোগ no longer does — see fix above.)
// Path: src/components/modules/disciplinaryAction/DisciplinaryNoticeLetter.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import type { DisciplinaryActionData } from './types';
import { calculateRepresentativeCount, formatDateBn, calculateNotice4Date } from './types';
import { renderRichText } from './richTextRender';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { addDaysSkippingHolidays } from '../../../utils/businessDays';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';

interface Props {
  data: DisciplinaryActionData;
  notice: 1 | 2 | 3 | 4 | 'evaluation';
  authorization: AuthorizationState;
  festivalHolidays: string[];
}

// ── Bengali-digit helper (kept local/independent of toBanglaNumber so
//    leading zeros and separators in dd-mm-yyyy are preserved exactly). ──
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

// ── Factory code: initials of factoryName words, space-separated,
//    e.g. "মেসার্স জিএমএস লিমিটেড" → "এম জি এস এল" style. ──
const getFactoryCode = (name?: string): string => {
  if (!name || !name.trim()) return '___';
  const code = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join(' ')
    .toUpperCase();
  return code || '___';
};

// ── Per-notice-type short code used inside the reference. ──
const NOTICE_TYPE_CODE: Record<'1' | '2' | '3' | '4' | 'evaluation', string> = {
  '1': 'SC',   // শোকজ / কারণ দর্শানোর নোটিশ
  '2': 'IN',   // তদন্ত সংক্রান্ত নোটিশ
  '3': 'IC',   // তদন্ত কমিটি নোটিশ
  '4': 'FD',   // চূড়ান্ত সিদ্ধান্ত অবহিতকরণ
  evaluation: 'EV', // মূল্যায়ন / প্রতিবেদন
};

// ── Builds সূত্র নং as FactoryCode/TypeCode-CardSerial/DD-MM-YYYY (Bengali digits).
//    Only used when data.referenceNo isn't manually provided, so manual entry
//    still overrides auto-generation if the user fills it in. ──
const buildReferenceNo = (
  data: DisciplinaryActionData,
  notice: 1 | 2 | 3 | 4 | 'evaluation',
  dateStr?: string
): string => {
  const factoryCode = getFactoryCode(data.factoryName);
  const typeCode = NOTICE_TYPE_CODE[String(notice) as '1' | '2' | '3' | '4' | 'evaluation'];
  const serial = data.cardNo ? toBnDigits(String(data.cardNo)) : '___';

  let dateCode = '__-__-____';
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      dateCode = toBnDigits(`${dd}-${mm}-${yyyy}`);
    }
  }

  return `${factoryCode}/${typeCode}-${serial}/${dateCode}`;
};

const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
};

export const DisciplinaryNoticeLetter: React.FC<Props> = ({ data, notice, authorization, festivalHolidays }) => {
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const repCount     = calculateRepresentativeCount(memberCount);
  const deadline     = addDaysSkippingHolidays(data.showCauseDate, 50, festivalHolidays);
  const isSuspension = data.subject === 'অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।';
  // Notice 4's issue date — next business day after evaluationDate,
  // never manually entered.
  const notice4Date  = calculateNotice4Date(data.evaluationDate, festivalHolidays);

  const copyList = ['শ্রমিকের ব্যক্তিগত নথি।', 'সংশ্লিষ্ট ব্যক্তি।'];

  // MANUAL notice dates now (confirmed) — never auto-filled from today,
  // EXCEPT Notice 4, which is always derived (see notice4Date above).
  // Notice 1 uses কারণ দর্শানোর তারিখ directly (confirmed identical to
  // the old, now-removed separate নোটিশ ১ ইস্যু তারিখ field).
  const noticeDate =
    notice === 1 ? data.showCauseDate :
    notice === 2 ? data.notice2Date :
    notice === 3 ? data.notice3Date :
    notice === 4 ? notice4Date :
    data.evaluationDate;

  // Dynamic সূত্র নং: auto-generated per notice type (factory code +
  // notice-type code + card serial + date), falls back to manual
  // data.referenceNo if that's been explicitly filled in.
  const referenceNo = data.referenceNo || buildReferenceNo(data, notice, noticeDate);

  // Which print/layout mode this notice's .nl-wrap should use:
  //   - 'flow'   → evaluation report only; allowed to grow past one page
  //   - 'single' → notices 1, 2, 3, 4; always locked to exactly one page
  const wrapMode: 'flow' | 'single' = notice === 'evaluation' ? 'flow' : 'single';

  // ── DOM-level normalization for evaluation output (তদন্তে প্রাপ্ত
  // জবানবন্দি ও সাক্ষ্য-প্রমাণ / তদন্ত কমিটির মতামত ও সুপারিশ) ──
  // WHY THIS EXISTS: the print pipeline (DisciplinaryActionManager's
  // handlePrint) clones the LIVE DOM via `el.outerHTML` into a fresh
  // iframe and separately copies document.styleSheets rules into that
  // iframe's <head>. If renderRichText()/RichTextArea embeds inline
  // `style="...!important"` on its output tags (common for rich-text
  // renderers meant to survive arbitrary host CSS), that inline
  // !important always outranks .nl-eval-text's stylesheet rules — no
  // CSS-only fix can beat that, regardless of selector specificity.
  // Uses em-relative sizing so every nested element automatically
  // tracks whichever font-size .nl-eval-text currently has — 13.5px on
  // screen, 10pt once @media print takes over in the cloned iframe —
  // without needing separate screen/print logic.
  useEffect(() => {
    if (notice !== 'evaluation') return;
    const containers = document.querySelectorAll<HTMLElement>('.nl-eval-text');
    if (!containers.length) return;

    const BLOCK_MARGIN_BOTTOM = '0.45em';
    const LIST_MARGIN_BOTTOM  = '0.55em';
    const LIST_PADDING_LEFT   = '1.5em';
    const ITEM_MARGIN_BOTTOM  = '0.2em';

    const normalize = (el: HTMLElement) => {
      el.style.setProperty('font-size', '1em', 'important');
      el.style.setProperty('line-height', 'inherit', 'important');
      el.style.setProperty('font-family', 'inherit', 'important');
      el.style.setProperty('width', 'auto', 'important');
      el.style.setProperty('max-width', 'none', 'important');

      const tag = el.tagName;
      if (tag === 'P' || tag === 'DIV') {
        el.style.setProperty('margin', `0 0 ${BLOCK_MARGIN_BOTTOM}`, 'important');
        el.style.setProperty('padding', '0', 'important');
      } else if (tag === 'UL' || tag === 'OL') {
        el.style.setProperty('margin', `0 0 ${LIST_MARGIN_BOTTOM}`, 'important');
        el.style.setProperty('padding', `0 0 0 ${LIST_PADDING_LEFT}`, 'important');
      } else if (tag === 'LI') {
        el.style.setProperty('margin', `0 0 ${ITEM_MARGIN_BOTTOM}`, 'important');
        el.style.setProperty('padding', '0', 'important');
      } else if (!['STRONG', 'B', 'EM', 'I', 'U'].includes(tag)) {
        el.style.setProperty('margin', '0', 'important');
        el.style.setProperty('padding', '0', 'important');
      }
    };

    containers.forEach((container) => {
      normalize(container);
      container.querySelectorAll<HTMLElement>('*').forEach(normalize);

      // Zero the bottom margin of the LAST top-level block so the
      // divider directly below this section doesn't inherit extra
      // trailing space from the rich-text output itself — the
      // section's own margin-bottom (set in CSS) already provides the
      // gap to the next section.
      const topLevel = Array.from(container.children) as HTMLElement[];
      const last = topLevel[topLevel.length - 1];
      if (last) last.style.setProperty('margin-bottom', '0', 'important');
    });
  }, [notice, data.investigationReportSummary, data.recommendation]);


  return (
    <div className="nl-page">
      <div
        className={`nl-wrap ${wrapMode === 'flow' ? 'nl-wrap--flow' : 'nl-wrap--single'}`}
        data-wrap-mode={wrapMode}
      >

        {/* ══ HEADER ══════════════════════════════════════ */}
        <div className="nl-header">
          {data.factoryName && <h1 className="nl-co-name">{data.factoryName}</h1>}
          {data.factoryAddress && <p className="nl-co-addr">{data.factoryAddress}</p>}
        </div>

        {/* ══ REFERENCE + DATE (Bengali digits) ═══════════════════════════════ */}
        <div className="nl-title-bar">
          <h2 className="nl-title">সূত্রঃ {referenceNo}</h2>
          <div className="nl-meta">
            <span className="nl-meta-date">তারিখ :&nbsp;<strong>{formatDateBn(noticeDate)} ইং</strong></span>
          </div>
        </div>

        {/* ══ EMPLOYEE INFO (Notice 1, 2 & 4) ══════════════ */}
        {(notice === 1 || notice === 2 || notice === 4) && (
          <div className="nl-emp-box">
            <div className="nl-emp-col">
              <table className="nl-emp-tbl"><tbody>
                <tr><td>নাম</td><td>{data.employeeName || '—'}</td></tr>
                <tr><td>পদবী</td><td>{data.designation || '—'}</td></tr>
                <tr><td>কার্ড নং</td><td>{data.cardNo || '—'}</td></tr>
                <tr><td>সেকশন</td><td>{data.section || '—'}</td></tr>
              </tbody></table>
            </div>
          </div>
        )}

        {/* ══ TO (above subject — Notice 3 & প্রতিবেদন ও সুপারিশ only) ══════ */}
        {notice === 3 && (
          <div className="nl-salute" style={{ fontWeight: 400 }}>
            <p style={{ margin: 0 }}>প্রতি,</p>
            <p style={{ margin: 0 }}>তদন্ত কমিটির সদস্যবৃন্দ।</p>
          </div>
        )}
        {notice === 'evaluation' && (
          <div className="nl-salute" style={{ fontWeight: 400 }}>
            <p style={{ margin: 0 }}>প্রতি,</p>
            <p style={{ margin: 0 }}>ব্যবস্থাপনা কর্তৃপক্ষ।</p>
          </div>
        )}

        {/* ══ SUBJECT ═════════════════════════════════════════ */}
        <p className="nl-subject">
          বিষয়ঃ {notice === 1 && ( <u><strong>{data.subject}</strong></u>)}
          {notice === 2 && ( <u><strong>নিরপেক্ষ তদন্ত কমিটি গঠন এবং প্রতিনিধি মনোনয়ন প্রসঙ্গে।</strong></u>)}
          {notice === 3 && ( <u><strong>তদন্ত কমিটিতে সদস্য মনোনীতকরণ ও নিরপেক্ষ তদন্ত পরিচালনার আদেশ।</strong></u>)}
          {notice === 4 && ( <u><strong>শৃঙ্খলামূলক ব্যবস্থা গ্রহণ সংক্রান্ত চূড়ান্ত সিদ্ধান্ত অবহিতকরণ।</strong></u>)}
          {notice === 'evaluation' && (
            <u>
              অভিযোগের <u style={{ whiteSpace: 'nowrap' }}>(সূত্র:{buildReferenceNo(data, 1, data.showCauseDate)})</u>{' '}
              <strong>নিরপেক্ষ তদন্ত প্রতিবেদন দাখিল প্রসঙ্গে।</strong>
            </u>
          )}
        </p>

        {/* ══ TO (below subject — all notices) ══════════════ */}
        <p className="nl-salute" style={{ fontWeight: 400 }}>জনাব/জনাবা,</p>

        <div className="nl-gap" />

        {/* ══ NOTICE BODY ═════════════════════════════════════ */}
        <div className="nl-body">
          {notice === 1 && (
            <>
              <p className="nl-para">
                আপনার বিরুদ্ধে অভিযোগ এই যে,{' '}
                {data.complaint ? stripHtml(data.complaint) : '_____'}
              </p>

              <div className="nl-gap" />

              <p className="nl-para">
                আপনার এহেন কর্মকাণ্ড প্রতিষ্ঠানের শৃঙ্খলা ও নীতিমালার সম্পূর্ণ পরিপন্থী এবং বাংলাদেশ শ্রম আইন, ২০০৬ অনুযায়ী গুরুতর অসদাচরণের শামিল।
              </p>

              <p className="nl-para">
                অতএব, আনীত অভিযোগের প্রেক্ষিতে আপনাকে আত্মপক্ষ সমর্থনের সুযোগ প্রদান করা হলো। কেন আপনার বিরুদ্ধে উপযুক্ত আইনানুগ ও শৃঙ্খলামূলক ব্যবস্থা গ্রহণ করা হবে না, তার লিখিত জবাব আগামী <strong>০৭ (সাত) কর্মদিবসের</strong> মধ্যে নিম্নস্বাক্ষরকারীর নিকট দাখিল করার জন্য নির্দেশ প্রদান করা হলো।
              </p>

              <div className="nl-gap" />

              <p className="nl-para">
                নির্ধারিত সময়ের মধ্যে সন্তোষজনক লিখিত জবাব দাখিল করতে ব্যর্থ হলে ধরে নেওয়া হবে যে আপনার স্বপক্ষে কোনো যুক্তি বা ব্যাখ্যা নেই। সেক্ষেত্রে কর্তৃপক্ষ আপনার বিরুদ্ধে একতরফা ও আইনানুগ সিদ্ধান্ত গ্রহণ করবে।
              </p>

              {isSuspension && (
                <>
                  <div className="nl-gap" />
                  <p className="nl-para nl-suspension">
                    উল্লেখ্য যে, এ বিষয়ে পরবর্তী সিদ্ধান্ত না দেওয়া পর্যন্ত আপনাকে কাজ থেকে সাময়িকভাবে বরখাস্ত রাখা হলো।
                  </p>
                </>
              )}
            </>
          )}

          {notice === 2 && (
            <>
              <p className="nl-para">
                আপনার অবগতির জন্য জানানো যাচ্ছে যে, গত <strong>{formatDateBn(data.showCauseDate)}</strong> ইং তারিখে আপনার বিরুদ্ধে আনীত অভিযোগের প্রেক্ষিতে প্রদানকৃত
                {' '}<strong>{formatDateBn(data.replyDate)}</strong> ইং তারিখের লিখিত ব্যাখ্যাটি ব্যবস্থাপনা কর্তৃপক্ষের নিকট সন্তোষজনক বিবেচিত হয়নি।
              </p>
              <p className="nl-para">
                ফলশ্রুতিতে, আনীত অভিযোগের সঠিক ও নিরপেক্ষ তদন্ত পরিচালনার স্বার্থে একটি তদন্ত কমিটি গঠনের সিদ্ধান্ত গ্রহণ করা হয়েছে।
              </p>
              <p className="nl-para">
                উক্ত তদন্ত কার্যক্রমে আপনার পক্ষ সমর্থনের জন্য আপনার সমপদস্থ বা উর্ধ্বতন পর্যায়ের <strong>{toBanglaNumber(repCount)}</strong> জন
                প্রতিনিধির নাম ও পরিচয়, অত্র নোটিশ প্রাপ্তির ৪ (চার) দিনের মধ্যে নিম্নস্বাক্ষরকারী কর্তৃপক্ষের নিকট লিখিতভাবে জমা দেওয়ার জন্য নির্দেশ প্রদান করা হলো।
              </p>
              <p className="nl-para">উল্লেখ্য যে নির্ধারিত সময়ের মধ্যে প্রতিনিধি মনোনয়নে ব্যর্থ হলে, বিষয়টি তদন্তে আপনার অনিচ্ছা হিসেবে গণ্য হবে এবং আইনানুগভাবে তদন্ত কার্যক্রমটি একতরফাভাবে সম্পন্ন করা হবে।</p>
            </>
          )}

          {notice === 3 && (
            <>
              <p className="nl-para">
                আপনাদের অবগতির জন্য জানানো যাচ্ছে যে, গত <strong>{formatDateBn(data.showCauseDate)}</strong> ইং তারিখে
                জনাব/জনাবা <strong>{data.employeeName || '—'}</strong> (কার্ড নং: {data.cardNo || '—'}, {data.designation || '—'},
                {' '}{data.section || '—'})-এর বিরুদ্ধে আনীত অভিযোগের নিরপেক্ষ তদন্ত পরিচালনার লক্ষ্যে আপনাদের উক্ত তদন্ত কমিটিতে সদস্য হিসেবে মনোনীত করা হলো।
              </p>
              <p className="nl-para">
                এমতাবস্থায়, আগামী <strong>{formatDateBn(deadline)}</strong> ইং তারিখের মধ্যে কোনো প্রকার স্বার্থের দ্বন্দ্ব 
                (Conflict of Interest) ব্যতীত, সম্পূর্ণ নিরপেক্ষতা ও পেশাদারিত্বের সাথে উক্ত তদন্ত কার্যক্রমটি সম্পন্ন করে একটি সুনির্দিষ্ট তদন্ত প্রতিবেদন কর্তৃপক্ষের নিকট দাখিল করার জন্য নির্দেশ প্রদান করা হলো।
              </p>

              <p className="nl-para" style={{ fontWeight: 700, textDecoration: 'underline', marginTop: 14 }}>কমিটির তালিকাঃ</p>
              <table className="nl-committee-tbl">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>ক্রমিক</th>
                    <th style={{ width: '25%' }}>নাম</th>
                    <th style={{ width: '20%' }}>কার্ড নং</th>
                    <th style={{ width: '20%' }}>পদবী</th>
                    <th style={{ width: '20%' }}>সেকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {data.committeeMembers.map((m, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{toBanglaNumber(m.slNo)}</td>
                      <td>{m.name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{m.cardNo || '—'}</td>
                      <td>{m.designation || '—'}</td>
                      <td>{m.section || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {notice === 4 && (
            <>
              <p className="nl-para">
                আপনাকে জানানো যাচ্ছে যে, আপনার বিরুদ্ধে উত্থাপিত অভিযোগের প্রেক্ষিতে গঠিত তদন্ত কমিটি নিরপেক্ষ ও বিস্তারিত তদন্ত সম্পন্ন করেছে। 
              </p>
              <p className="nl-para">
                উক্ত তদন্ত কার্যক্রমের বিবরণী ও ফলাফল নিম্নরূপ:
                <div className="nl-para">{data.finalDecision ? renderRichText(data.finalDecision, 'fd4') : '_____'}</div>
              </p>
              <p className="nl-para">
                উপরে উল্লেখিত তদন্ত কমিটির দাখিলকৃত রিপোর্ট, প্রমাণাদি এবং সার্বিক পর্যালোচনা করে ব্যবস্থাপনা কর্তৃপক্ষ নিশ্চিত হয়েছে যে, আনীত অভিযোগসমূহ শতভাগ সত্য এবং প্রমাণিত। আপনার এহেন আচরণ প্রতিষ্ঠানের নিয়মনীতি ও কর্মক্ষেত্রের শৃঙ্খলাবিধির মারাত্মক লঙ্ঘন।
              </p>
              <p className="nl-para">
                অতএব, তদন্ত কমিটির সুপারিশ ও অপরাধের গুরুত্ব বিবেচনা করে ব্যবস্থাপনা কর্তৃপক্ষ আপনাকে চাকরি থেকে <strong>"{data.punishmentType || '_____'}"</strong>{' '}করার চূড়ান্ত সিদ্ধান্ত গ্রহণ করেছে।
              </p>
              <p className="nl-para">
                উক্ত সিদ্ধান্ত অত্র পত্র প্রাপ্তির তারিখ থেকে কার্যকর হবে। আপনার হিসাব সংক্রান্ত চূড়ান্ত পাওনাদী নিষ্পত্তির জন্য নিয়ম অনুযায়ী আগামী ১৫ দিনের মধ্যে মানবসম্পদ ও হিসাব বিভাগের সাথে যোগাযোগ করার জন্য নির্দেশ প্রদান করা হলো।
              </p>
            </>
          )}

          {notice === 'evaluation' && (
            <>
              <p className="nl-para">
                গত {formatDateBn(data.notice3Date)} ইং তারিখে জারিকৃত নোটিশের আলোকে আমরা নিম্নস্বাক্ষরকারীগণ অভিযুক্ত {data.designation}{' '}
                <strong>{data.employeeName}-{data.cardNo}</strong> এর বিরুদ্ধে আনীত অভিযোগের নিরপেক্ষ তদন্তের জন্য কমিটি সদস্য হিসেবে দায়িত্ব প্রাপ্ত হই।
                দায়িত্ব গ্রহণের পর কালক্ষেপণ না করে তদন্ত কমিটি ঘটনার সার্বিক সত্যতা উদঘাটনে প্রাপ্ত লিখিত ও মৌখিক সাক্ষ্য, সিস্টেম ভিত্তিক তথ্য সংগ্রহ এবং সংশ্লিষ্ট অন্যান্য
                আলামত সূক্ষ্মভাবে পর্যবেক্ষণ করে আজ {formatDateBn(data.evaluationDate)} ইং তারিখে তদন্ত কার্যক্রম সম্পন্ন করেছে।
                <br /><br />
                <strong>নিচে তদন্তের বিস্তারিত বিবরণ ও সিদ্ধান্ত উপস্থাপন করা হলো:</strong>
              </p>

              <div className="nl-eval-section">
                <p className="nl-eval-label"><strong><u>তদন্তে প্রাপ্ত জবানবন্দি ও সাক্ষ্য-প্রমাণ:</u></strong></p>
                <div className="nl-eval-text">{data.investigationReportSummary ? renderRichText(data.investigationReportSummary, 'sum') : '—'}</div>
                <hr className="nl-eval-divider" />
              </div>

              <div className="nl-eval-section">
                <p className="nl-eval-label"><strong><u>মতামত ও সুপারিশ:</u></strong></p>
                <div className="nl-eval-text">{data.recommendation ? renderRichText(data.recommendation, 'rec') : '—'}</div>
                <hr className="nl-eval-divider" />
              </div>
            </>
          )}
        </div>

        {/* ══ COPY LIST (Notice 1, 2 & 4) ══ */}
        {(notice === 1 || notice === 2 || notice === 4) && (
          <div className="nl-copy">
            <p><strong><u>অনুলিপি :</u></strong></p>
            <ol>
              {copyList.map((item, i) => <li key={i}><span>{toBanglaNumber(i + 1)}.</span>{item}</li>)}
            </ol>
          </div>
        )}

        {/* ══ SIGNATURE ═══════════════════════════════════════ */}
        <div className="nl-footer">
          {notice === 'evaluation' ? (
            // Evaluation output signs off with the INVESTIGATION
            // COMMITTEE's own members, not the standard authority
            // signature block — the committee is the body that produced
            // this report/recommendation, so their names (from ধাপ ৪
            // তদন্ত কমিটি) appear here, each as its own signature column
            // with name + designation, matching the reference layout.
            // No "নির্দেশক্রমে," heading — the committee is reporting
            // its own findings, not issuing an order.
            <>
              {data.committeeMembers.length > 0 && (
                <div className="nl-committee-sig-row">
                  {data.committeeMembers.map((m, i) => (
                    <div className="nl-committee-sig-col" key={i}>
                      <div className="nl-committee-sig-name">{m.name || '—'}</div>
                      <div className="nl-committee-sig-desig">
                        {m.designation || '—'}
                        {m.section ? ` (${m.section})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Notices 1, 2, 3, and 4 all use the standard authority
            // signature — Notice 4 communicates the FINAL DECISION as
            // issued by the authority (per the committee's report), not
            // the committee itself signing off.
            <>
              <p className="nl-authority">নির্দেশক্রমে,</p>
              <div className="nl-auth-sig-wrap">
                <PrintSignatureRow value={authorization} lang="bn" hidePrepared hideTopBorder />
              </div>
            </>
          )}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        .nl-page, .nl-page * { font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif; box-sizing: border-box; }

        .nl-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 18mm 16mm;
        }
        .nl-wrap { display: flex; flex-direction: column; min-height: calc(297mm - 36mm); gap: 0; }

        .nl-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 10px; }
        .nl-co-name { font-size: 20px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
        .nl-co-addr { font-size: 13px; color: #374151; margin: 0; }

        .nl-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 6px; border-bottom: 1px dashed #d1d5db; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
        .nl-title { font-size: 13px; font-weight: 600; margin: 0; color: #111827; }
        .nl-meta { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; gap: 2px; }
        .nl-meta-date { color: #374151; }

        .nl-salute { font-size: 14px; font-weight: 600; margin: 8px 0 10px; }

        /* Standard/equal-length top signature line when the authority
           block renders 2+ signers side by side (PrintSignatureRow,
           defined in ../../common/AuthorizationBlock — not part of this
           file). This forces every direct signer column inside that
           block onto an equal-width flex track, so the border-top
           "signature line" above each name is the same length for every
           signer regardless of how long any individual name/designation
           text is (matches reference layout, Image 2). If
           AuthorizationBlock renders its own internal flex/grid with a
           different structure than a flat row of equal-width children,
           this override may need to target its actual class names
           instead — share AuthorizationBlock.tsx for a precise fix. */
        .nl-auth-sig-wrap { width: 100%; }
        .nl-auth-sig-wrap > * { display: flex !important; width: 100% !important; }
        .nl-auth-sig-wrap > * > * { flex: 1 1 0 !important; min-width: 0 !important; text-align: center !important; }

        .nl-emp-box { display: flex; gap: 0; border: 1.5px solid #374151; border-radius: 5px; overflow: hidden; margin-bottom: 14px; max-width: 320px; }
        .nl-emp-col { flex: 1; padding: 10px 12px; }
        .nl-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .nl-emp-tbl td { padding: 2px 4px 2px 0; vertical-align: top; line-height: 1.5; }
        .nl-emp-tbl td:first-child { font-weight: 600; white-space: nowrap; padding-right: 6px; width: 38%; }
        .nl-emp-tbl td:first-child::after { content: ':'; }

        .nl-subject { font-weight: 700; font-size: 13.5px; line-height: 1.7; margin: 0 0 6px; }

        /* কমিটির তালিকাঃ (Notice 3 committee list) — bordered, striped,
           professional table distinct from the plain nl-emp-tbl used for
           the employee-info box. */
        .nl-committee-tbl {
          width: 100%; border-collapse: collapse; table-layout: fixed;
          margin: 8px 0 14px; font-size: 12.5px;
          border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;
        }
        .nl-committee-tbl thead tr { background: #1e3a5f; }
        .nl-committee-tbl th {
          padding: 8px 10px; font-weight: 700; font-size: 12px; color: #fff;
          text-align: left; letter-spacing: 0.2px; border-right: 1px solid rgba(255,255,255,0.15);
        }
        .nl-committee-tbl th:last-child { border-right: none; }
        .nl-committee-tbl td {
          padding: 7px 10px; border-right: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0;
          vertical-align: middle; color: #1f2937;
        }
        .nl-committee-tbl td:last-child { border-right: none; }
        .nl-committee-tbl tbody tr:nth-child(even) { background: #f8fafc; }
        .nl-committee-tbl tbody tr:hover { background: #eff6ff; }

        .nl-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 0; margin-bottom: 14px; }
        .nl-para { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0; padding: 0 0 12px; }
        /* Dedicated spacer element (not a <p>, no shared class with
           .nl-para) inserted BETWEEN paragraphs as a bulletproof gap —
           immune to any margin/padding reset rule that might target
           p tags or .nl-para specifically inside .nl-body (e.g. from
           the imported BASE_PRINT_CSS). */
        .nl-gap { display: block; width: 100%; height: 10px; }

        /* Evaluation output (প্রতিবেদন ও সুপারিশ) — label + rich-text
           content (renderRichText()'s actual <p>/<ul>/<ol> output), each
           section closed off with a dashed divider. The base rules here
           are a fallback; the normalize useEffect above forces real
           inline !important values on the actual rendered elements,
           since inline !important from renderRichText()'s own output
           can otherwise outrank these stylesheet rules in the cloned
           print DOM. */
        .nl-eval-section { margin-bottom: 10px; }
        .nl-eval-label { font-size: 13.5px; font-weight: 400; margin: 0 0 4px; color: #111827; }
        .nl-eval-text { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 8px; }
        .nl-eval-text p, .nl-eval-text div { margin: 0 0 6px; }
        .nl-eval-text ul, .nl-eval-text ol { margin: 0 0 8px; padding-left: 22px; }
        .nl-eval-text li { margin-bottom: 3px; }
        .nl-eval-divider { border: none; border-top: 1px dashed #9ca3af; margin: 0; }

        .nl-copy { font-size: 13px; margin-bottom: 12px; }
        .nl-copy p { margin: 0 0 4px; }
        .nl-copy ol { list-style: none; padding: 0; margin: 0; }
        .nl-copy li { display: flex; gap: 6px; margin-bottom: 2px; }
        .nl-copy li span { font-weight: 600; flex-shrink: 0; }

        .nl-footer { margin-top: auto; padding-top: 8px; }
        .nl-authority { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; }

        /* Investigation-committee signature row (evaluation output only) —
           each member gets a bordered column with name (bold) + role,
           matching the reference layout's multi-column authority block. */
        .nl-committee-sig-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin-top: 34px;
        }
        .nl-committee-sig-col {
          border-top: 1.5px solid #1e3a5f;
          padding-top: 6px;
          text-align: center;
        }
        .nl-committee-sig-name { font-size: 12.5px; font-weight: 700; color: #1e3a5f; margin-bottom: 2px; }
        .nl-committee-sig-desig { font-size: 11px; color: #374151; line-height: 1.4; }

        ${BASE_PRINT_CSS}

        @media print {
          /* Uniform 15mm margin on all four sides (was 14mm top/bottom,
             15mm left/right — asymmetric). */
          @page { size: A4 portrait; margin: 15mm; }
          body * { visibility: hidden !important; }
          .nl-page, .nl-page * { visibility: visible !important; }
          .nl-page {
            position: absolute !important; inset: 0 !important; width: 100% !important;
            min-height: unset !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border-radius: 0 !important; background: white !important;
          }

          /* .nl-wrap--flow (EVALUATION ONLY): min-height ONLY — no fixed
             height, no page-break-inside:avoid. A fixed one-page height
             + avoid-break treated the WHOLE letter as a single
             unbreakable box; content that's genuinely longer than one
             page (the evaluation report) can't honor that, so the
             browser was forced to reserve a big blank gap at the bottom
             of page 1 and push everything else onto a mostly-empty page
             2. min-height alone still guarantees a full-page-tall flex
             column, so .nl-footer's margin-top:auto still pins the
             committee signature block to the bottom of the LAST page —
             while letting genuinely long content grow past one page and
             break at the finer, section-level boundaries set below
             (.nl-para / .nl-eval-section / .nl-eval-label /
             .nl-committee-sig-row) instead of wherever it happens to
             overflow. */
          .nl-wrap--flow { min-height: calc(297mm - 30mm) !important; }

          /* .nl-wrap--single (Notices 1, 2, 3, 4): these are always
             bounded, short-form letters and must render on EXACTLY one
             page — restores the original fixed-height +
             page-break-inside:avoid behaviour so Notice 4's চূড়ান্ত
             সিদ্ধান্ত (and 1–3) never spill onto a second page. */
          .nl-wrap--single {
            height: calc(297mm - 30mm) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .nl-body { flex: 1 !important; justify-content: flex-start !important; margin-bottom: 10pt !important; }
          .nl-salute { margin: 6pt 0 8pt !important; }
          /* Spacing switched from margin to padding for print — padding
             cannot collapse and is not touched by common print-reset
             rules (e.g. "p { margin: 0 }") that may live in the imported
             BASE_PRINT_CSS. This guarantees visible gaps between every
             .nl-para in the notice body, including right after the
             অভিযোগ/complaint paragraph, matching the reference layout's
             clear paragraph spacing (Image 2). break-inside:avoid keeps
             a single paragraph from splitting mid-sentence across the
             page boundary. */
          .nl-para {
            font-size: 10pt !important; line-height: 1.75 !important; margin: 0 !important; padding: 0 0 10pt !important;
            break-inside: avoid !important; page-break-inside: avoid !important;
          }
          .nl-gap { display: block !important; width: 100% !important; height: 8pt !important; }
          /* break-after:avoid — a section heading is never left as the
             last line on a page with its own content starting fresh on
             the next (the exact orphaning this was written to fix). */
          .nl-eval-label {
            font-size: 10pt !important; margin: 0 0 4pt !important;
            break-after: avoid !important; page-break-after: avoid !important;
          }
          .nl-eval-text { font-size: 10pt !important; line-height: 1.75 !important; margin: 0 0 8pt !important; }
          /* NOT break-inside:avoid here — .nl-eval-section can wrap a
             LARGE block (a heading plus every witness statement in the
             investigation summary). Marking the whole section
             unbreakable meant that once it didn't fit in whatever space
             was left on the current page, the ENTIRE section — heading
             and all six items — had to jump to the next page together,
             leaving roughly half the previous page blank. Break control
             is applied at the individual item/paragraph level instead
             (.nl-eval-text li / .nl-eval-text > p below), so the list
             can break BETWEEN items and fill each page properly, while
             never splitting in the middle of a single item. */
          .nl-eval-section { margin-bottom: 8pt !important; }
          .nl-eval-divider { margin: 0 !important; }
          /* Each witness statement / recommendation paragraph is a small
             atomic unit — safe to keep from splitting mid-item without
             risking a big page-1 gap, unlike the whole section above. */
          .nl-eval-text li, .nl-eval-text > p {
            break-inside: avoid !important; page-break-inside: avoid !important;
          }
          /* Keep the investigation-committee signature block together —
             columns shouldn't split across a page boundary. */
          .nl-committee-sig-row { break-inside: avoid !important; page-break-inside: avoid !important; }
          .nl-committee-sig-name { font-size: 10pt !important; }
          .nl-committee-sig-desig { font-size: 8.5pt !important; }
          .nl-committee-tbl { font-size: 9.5pt !important; }
          .nl-auth-sig-wrap > * { display: flex !important; width: 100% !important; }
          .nl-auth-sig-wrap > * > * { flex: 1 1 0 !important; min-width: 0 !important; text-align: center !important; }
          .nl-committee-tbl thead tr, .nl-committee-tbl th {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            background: #1e3a5f !important; color: #fff !important;
          }
          .nl-footer { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
};