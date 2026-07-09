import React from 'react';
import { Employee, formatDateBengali, toBanglaNumber } from './LeftNoticeDataType';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS } from '../../../utils/printCSS';

interface Props {
  employee:         Employee;
  title:            string;
  content?:         React.ReactNode;
  hideDefaultFooter?: boolean;
  noticeType?:      'notice1' | 'notice2' | 'notice3';
  authorization?:   AuthorizationState;
}

export const NoticeLetter: React.FC<Props> = ({
  employee, title, content, authorization, noticeType,
}) => {

  const copyList = ['শ্রমিকের ব্যক্তিগত নথি।', 'সংশ্লিষ্ট ব্যক্তি।'];

  const getNoticeDates = () => {
    switch (noticeType) {
      case 'notice1': return {
        absenceDate: formatDateBengali(employee.absenceStartDate || ''),
        noticeDate:  formatDateBengali(employee.firstNoticeDate  || ''),
      };
      case 'notice2': return {
        absenceDate:     formatDateBengali(employee.absenceStartDate || ''),
        firstNoticeDate: formatDateBengali(employee.firstNoticeDate  || ''),
        noticeDate:      formatDateBengali(employee.secondNoticeDate || ''),
      };
      case 'notice3': return {
        absenceDate:      formatDateBengali(employee.absenceStartDate  || ''),
        firstNoticeDate:  formatDateBengali(employee.firstNoticeDate   || ''),
        secondNoticeDate: formatDateBengali(employee.secondNoticeDate  || ''),
        noticeDate:       formatDateBengali(employee.thirdNoticeDate   || ''),
      };
      default: return {};
    }
  };

  const dates = getNoticeDates();

  const getDynamicContent = () => {
    if (content) return content;
    switch (noticeType) {
      case 'notice1': return (
        <>
          <p className="nl-subject">বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক ব্যাখ্যা প্রদান সহ চাকুরীতে যোগদানের জন্য নোটিশ।</p>
          <p className="nl-salute">জনাব/জনাবা,</p>
          <p className="nl-para">আপনি গত <u><strong>{dates.absenceDate}</strong></u> ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। আপনার এরূপ অনুপস্থিতি বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারার আওতায় পড়ে।</p>
          <p className="nl-para">সুতরাং অত্র পত্র প্রাপ্তির ১০ (দশ) দিনের মধ্যে আপনার অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য আপনাকে নির্দেশ দেয়া হলো।</p>
          <p className="nl-para">আপনার লিখিত জবাব উক্ত সময়ের মধ্যে নিম্নস্বাক্ষরকারীর নিকট অবশ্যই পৌঁছাতে হবে। অন্যথায় কর্তৃপক্ষ আপনার বিরুদ্ধে প্রয়োজনীয় আইনানুগ ব্যবস্থা নিতে বাধ্য হবে।</p>
        </>
      );
      case 'notice2': return (
        <>
          <p className="nl-subject">বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক আত্মপক্ষ সমর্থনের সুযোগ প্রদান প্রসঙ্গে।</p>
          <p className="nl-salute">জনাব/জনাবা,</p>
          <p className="nl-para">আপনি গত <u><strong>{dates.absenceDate}</strong></u> ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। এ প্রেক্ষিতে কারখানা কর্তৃপক্ষ আপনার স্থায়ী ও বর্তমান ঠিকানায় রেজিস্ট্রি ডাকযোগে গত <u><strong>{dates.firstNoticeDate}</strong></u> ইং তারিখে বিনানুমতিতে চাকুরীতে অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য পত্র প্রেরণ করা হয়। কিন্তু অদ্যবধি আপনি উপরোক্ত বিষয়ে কোন ধরণের লিখিত ব্যাখ্যা প্রদান করেন নাই অথবা চাকুরীতেও যোগদান করেন নাই।</p>
          <p className="nl-para">অতএব, অত্র পত্র প্রাপ্তির ০৭ (সাত) দিনের মধ্যে আত্মপক্ষ সমর্থন সহ কাজে যোগদান করিতে আপনাকে নির্দেশ দেয়া গেল।</p>
          <p className="nl-para">উক্ত সময়ের মধ্যে আপনি আত্মপক্ষ সমর্থনের জবাব সহ কাজে যোগদান করতে ব্যর্থ হলে বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী আপনি স্বেচ্ছায় চাকুরী থেকে ইস্তফা গ্রহণ করেছেন বলে গণ্য হবে।</p>
        </>
      );
      case 'notice3': return (
        <>
          <p className="nl-subject">বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক শ্রমিক কর্তৃক স্বেচ্ছায় চাকুরী হইতে ইস্তফা প্রসঙ্গে।</p>
          <p className="nl-salute">জনাব/জনাবা,</p>
          <p className="nl-para">আপনি গত <u><strong>{dates.absenceDate}</strong></u> ইং তারিখ হতে অদ্যবধি পর্যন্ত কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত থাকার আপনাকে গত <u><strong>{dates.firstNoticeDate}</strong></u> ইং তারিখে একটি পত্রের মাধ্যমে ১০ (দশ) দিনের সময় দিয়ে চাকুরীতে যোগদান সহ ব্যাখ্যা প্রদান করতে বলা হয়েছিল। কিন্তু আপনি নির্ধারিত সময়ের মধ্যে কর্মস্থলে উপস্থিত হননি এবং কোন ব্যাখ্যা প্রদান করেননি।</p>
          <p className="nl-para">তথাপি কর্তৃপক্ষ গত <u><strong>{dates.secondNoticeDate}</strong></u> ইং তারিখে আর একটি পত্রের মাধ্যমে আপনাকে আরো ৭ (সাত) দিনের সময় দিয়ে আত্মপক্ষ সমর্থন সহ চাকুরীতে যোগদানের জন্য পুনরায় নির্দেশ প্রদান করেন। তৎসত্ত্বেও আপনি নির্ধারিত সময়ের মধ্যে আত্মপক্ষ করেননি এবং যোগদান করেননি।</p>
          <p className="nl-para">সুতরাং বাংলাদেশ শ্রম আইন, ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী অনুপস্থিত দিন থেকে আপনি চাকুরী হতে স্বেচ্ছায় ইস্তফা গ্রহণ করেছেন বলে গণ্য করা হলো।</p>
          <p className="nl-para">অতএব, আপনার বকেয়া মজুরী ও আইনানুগ পাওনা (যদি থাকে) যে কোন কর্মদিবসে অফিস চলাকালীন সময়ে কারখানার হিসাব শাখা থেকে গ্রহণ করার জন্য নির্দেশ দেয়া গেল।</p>
        </>
      );
      default: return null;
    }
  };

  return (
    <div className="nl-page">
      {/* ── Full-page flex column — stretches to fill A4 ── */}
      <div className="nl-wrap">

        {/* ══ HEADER ══════════════════════════════════════ */}
        <div className="nl-header">
          {employee.companyName && (
            <h1 className="nl-co-name">{employee.companyName}</h1>
          )}
          {employee.companyAddress && (
            <p className="nl-co-addr">{employee.companyAddress}</p>
          )}
        </div>

        {/* ══ TITLE BAR ════════════════════════════════════ */}
        <div className="nl-title-bar">
          <h2 className="nl-title">"রেজিস্টার্ড ডাকযোগে প্রেরিত"</h2>
          {dates.noticeDate && (
            <div className="nl-meta">
              <span className="nl-meta-type">({title})</span>
              <span className="nl-meta-date">তারিখ :&nbsp;<strong>{toBanglaNumber(dates.noticeDate)} ইং</strong></span>
            </div>
          )}
        </div>

        {/* ══ TO ══════════════════════════════════════════ */}
        <p className="nl-to">প্রতি,</p>

        {/* ══ EMPLOYEE INFO BOX ════════════════════════════ */}
        <div className="nl-emp-box">
          <div className="nl-emp-col">
            <div className="nl-emp-head">ব্যক্তিগত তথ্য</div>
            <table className="nl-emp-tbl"><tbody>
              <tr><td>নাম</td><td>{employee.name || '—'}</td></tr>
              <tr><td>পিতার নাম</td><td>{employee.fatherName || '—'}</td></tr>
              {employee.motherName && <tr><td>মাতার নাম</td><td>{employee.motherName}</td></tr>}
              <tr><td>পদবী</td><td>{employee.designation || '—'}</td></tr>
              <tr><td>কার্ড নং</td><td>{employee.cardNo || '—'}</td></tr>
              <tr><td>সেকশন</td><td>{employee.section || '—'}</td></tr>
              {employee.joiningDate && <tr><td>যোগদান</td><td>{formatDateBengali(employee.joiningDate)}</td></tr>}
            </tbody></table>
          </div>
          <div className="nl-emp-divider" />
          <div className="nl-emp-col">
            <div className="nl-emp-head">বর্তমান ঠিকানা</div>
            <table className="nl-emp-tbl"><tbody>
              {employee.presentAddress.houseNo    && <tr><td>বাড়ি</td><td>{employee.presentAddress.houseNo}</td></tr>}
              {employee.presentAddress.village    && <tr><td>গ্রাম</td><td>{employee.presentAddress.village}</td></tr>}
              {employee.presentAddress.postOffice && <tr><td>ডাকঘর</td><td>{employee.presentAddress.postOffice}</td></tr>}
              {employee.presentAddress.thana      && <tr><td>থানা</td><td>{employee.presentAddress.thana}</td></tr>}
              {employee.presentAddress.district   && <tr><td>জেলা</td><td>{employee.presentAddress.district}</td></tr>}
            </tbody></table>
          </div>
          <div className="nl-emp-divider" />
          <div className="nl-emp-col">
            <div className="nl-emp-head">স্থায়ী ঠিকানা</div>
            <table className="nl-emp-tbl"><tbody>
              {employee.permanentAddress.houseNo    && <tr><td>বাড়ি</td><td>{employee.permanentAddress.houseNo}</td></tr>}
              {employee.permanentAddress.village    && <tr><td>গ্রাম</td><td>{employee.permanentAddress.village}</td></tr>}
              {employee.permanentAddress.postOffice && <tr><td>ডাকঘর</td><td>{employee.permanentAddress.postOffice}</td></tr>}
              {employee.permanentAddress.thana      && <tr><td>থানা</td><td>{employee.permanentAddress.thana}</td></tr>}
              {employee.permanentAddress.district   && <tr><td>জেলা</td><td>{employee.permanentAddress.district}</td></tr>}
            </tbody></table>
          </div>
        </div>

        {/* ══ NOTICE BODY — flex-grow fills remaining space ═ */}
        <div className="nl-body">
          {getDynamicContent()}
        </div>

        {/* ══ COPY LIST ════════════════════════════════════ */}
        {noticeType && (
          <div className="nl-copy">
            <p><strong><u>অনুলিপি :</u></strong></p>
            <ol>
              {copyList.map((item, i) => (
                <li key={i}><span>{toBanglaNumber(String(i + 1))}.</span>{item}</li>
              ))}
            </ol>
          </div>
        )}

        {/* ══ AUTHORITY + SIGNATURE ════════════════════════ */}
        {noticeType && (
          <div className="nl-footer">
            <p className="nl-authority">কর্তৃপক্ষের নির্দেশক্রমে</p>
            {authorization && (
              <PrintSignatureRow value={authorization} lang="bn" hidePrepared hideTopBorder />
            )}
          </div>
        )}

      </div>{/* /.nl-wrap */}

      {/* ══════════════ STYLES ══════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        /* ─── Shared font ─────────────────────────────────── */
        .nl-page, .nl-page * {
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
          box-sizing: border-box;
        }

        /* ─── Screen: A4 card preview ─────────────────────── */
        .nl-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          border-radius: 6px;
          padding: 18mm 16mm;
        }

        /* Full-height flex column so body grows to fill page */
        .nl-wrap {
          display: flex;
          flex-direction: column;
          min-height: calc(297mm - 36mm); /* page height minus paddings */
          gap: 0;
        }

        /* ─── Header ──────────────────────────────────────── */
        .nl-header {
          text-align: center;
          border-bottom: 2.5px solid #1d4ed8;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .nl-co-name {
          font-size: 20px;
          font-weight: 700;
          color: #1e3a5f;
          letter-spacing: 0.5px;
          margin: 0 0 3px;
          text-transform: uppercase;
        }
        .nl-co-addr { font-size: 13px; color: #374151; margin: 0; }

        /* ─── Title bar ────────────────────────────────────── */
        .nl-title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 6px;
          border-bottom: 1px dashed #d1d5db;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }
        .nl-title {
          font-size: 15px;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
          margin: 0;
          color: #111827;
        }
        .nl-meta { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; gap: 2px; }
        .nl-meta-type { color: #1d4ed8; font-weight: 600; }
        .nl-meta-date { color: #374151; }

        /* ─── To ───────────────────────────────────────────── */
        .nl-to { font-size: 14px; font-weight: 600; margin: 4px 0 6px; }

        /* ─── Employee info box ────────────────────────────── */
        .nl-emp-box {
          display: flex;
          gap: 0;
          border: 1.5px solid #374151;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .nl-emp-col { flex: 1; padding: 10px 12px; }
        .nl-emp-divider { width: 1.5px; background: #374151; flex-shrink: 0; }
        .nl-emp-head {
          font-size: 12.5px;
          font-weight: 700;
          border-bottom: 1.5px solid #374151;
          padding-bottom: 5px;
          margin-bottom: 6px;
          color: #111827;
          letter-spacing: 0.2px;
        }
        .nl-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .nl-emp-tbl td { padding: 2px 4px 2px 0; vertical-align: top; line-height: 1.5; }
        .nl-emp-tbl td:first-child { font-weight: 600; white-space: nowrap; padding-right: 6px; width: 38%; }
        .nl-emp-tbl td:first-child::after { content: ':'; }

        /* ─── Notice body — grows to fill available space ─── */
        .nl-body {
          flex: 1;                    /* ← key: push footer to bottom    */
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 0;
          margin-bottom: 14px;
        }
        .nl-subject {
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-size: 13.5px;
          line-height: 1.7;
          margin: 0 0 10px;
        }
        .nl-salute { font-size: 14px; font-weight: 600; margin: 0 0 10px; }
        .nl-para {
          font-size: 13.5px;
          line-height: 1.85;
          text-align: justify;
          margin: 0 0 12px;
        }

        /* ─── Copy list ────────────────────────────────────── */
        .nl-copy { font-size: 13px; margin-bottom: 12px; }
        .nl-copy p { margin: 0 0 4px; }
        .nl-copy ol { list-style: none; padding: 0; margin: 0; }
        .nl-copy li { display: flex; gap: 6px; margin-bottom: 2px; }
        .nl-copy li span { font-weight: 600; flex-shrink: 0; }

        /* ─── Footer ───────────────────────────────────────── */
        .nl-footer { margin-top: auto; padding-top: 8px; }
        .nl-authority { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; }

        /* ════════════════════════════════════════════════════
           PRINT — single A4 page, dynamically fills the sheet
           ════════════════════════════════════════════════════ */
        ${BASE_PRINT_CSS}

        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 15mm 14mm 15mm;
          }

          /* Hide everything except this notice */
          body * { visibility: hidden !important; }
          .nl-page, .nl-page * { visibility: visible !important; }

          /* Reset screen decoration */
          .nl-page {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-height: unset !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }

          /* nl-wrap fills the full printed page height so space
             is distributed — flex-grow on nl-body spreads the
             notice paragraphs to occupy any leftover whitespace */
          .nl-wrap {
            min-height: calc(297mm - 28mm) !important; /* A4 - margins */
            height:     calc(297mm - 28mm) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Scale everything to 10.5pt base */
          .nl-co-name    { font-size: 13.5pt !important; margin-bottom: 2pt !important; }
          .nl-co-addr    { font-size: 9pt !important; }
          .nl-header     { border-bottom-width: 2pt !important; padding-bottom: 6pt !important; margin-bottom: 7pt !important; border-color: #000 !important; }

          .nl-title-bar  { padding: 5pt 0 4pt !important; margin-bottom: 6pt !important; border-color: #555 !important; }
          .nl-title      { font-size: 11.5pt !important; }
          .nl-meta       { font-size: 9.5pt !important; }
          .nl-meta-type  { color: #000 !important; }

          .nl-to         { font-size: 10pt !important; margin: 3pt 0 4pt !important; }

          /* Employee box */
          .nl-emp-box    { margin-bottom: 10pt !important; border-color: #000 !important; border-radius: 0 !important; }
          .nl-emp-col    { padding: 7pt 9pt !important; }
          .nl-emp-divider{ background: #000 !important; }
          .nl-emp-head   { font-size: 9.5pt !important; padding-bottom: 3pt !important; margin-bottom: 4pt !important; border-color: #000 !important; }
          .nl-emp-tbl    { font-size: 8.8pt !important; }
          .nl-emp-tbl td { padding: 1.5pt 3pt 1.5pt 0 !important; line-height: 1.45 !important; }

          /* Body — flex-grow + justify-content: space-between
             distributes paragraph spacing to fill the page     */
          .nl-body {
            flex: 1 !important;
            justify-content: space-between !important;
            margin-bottom: 10pt !important;
          }
          .nl-subject  { font-size: 9.5pt !important; line-height: 1.55 !important; margin-bottom: 8pt !important; }
          .nl-salute   { font-size: 10pt !important; margin-bottom: 8pt !important; }
          .nl-para     {
            font-size: 10pt !important;
            line-height: 1.75 !important;
            margin-bottom: 0 !important; /* space-between handles gaps */
          }

          .nl-copy       { font-size: 9pt !important; margin-bottom: 8pt !important; }
          .nl-copy li    { margin-bottom: 1.5pt !important; }

          .nl-footer     { padding-top: 6pt !important; }
          .nl-authority  { font-size: 10pt !important; margin-bottom: 3pt !important; }

          /* Prevent footer from ever splitting */
          .nl-footer {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};