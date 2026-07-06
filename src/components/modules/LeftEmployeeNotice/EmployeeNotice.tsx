import React from 'react';
import { Employee, formatDateBengali, toBanglaNumber } from './LeftNoticeDataType';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

interface Props {
  employee: Employee;
  title: string;
  content?: React.ReactNode;
  hideDefaultFooter?: boolean;
  noticeType?: 'notice1' | 'notice2' | 'notice3';
  authorization?: AuthorizationState;
}

export const NoticeLetter: React.FC<Props> = ({
  employee,
  title,
  content,
  hideDefaultFooter = false,
  authorization,
  noticeType
}) => {

  const copyList = [
    'শ্রমিকের ব্যক্তিগত নথি।',
    'সংশ্লিষ্ট ব্যক্তি।'
  ];

  const getNoticeDates = () => {
    switch (noticeType) {
      case 'notice1':
        return {
          absenceDate: formatDateBengali(employee.absenceStartDate || ''),
          noticeDate:  formatDateBengali(employee.firstNoticeDate  || '')
        };
      case 'notice2':
        return {
          absenceDate:     formatDateBengali(employee.absenceStartDate  || ''),
          firstNoticeDate: formatDateBengali(employee.firstNoticeDate   || ''),
          noticeDate:      formatDateBengali(employee.secondNoticeDate  || '')
        };
      case 'notice3':
        return {
          absenceDate:      formatDateBengali(employee.absenceStartDate  || ''),
          firstNoticeDate:  formatDateBengali(employee.firstNoticeDate   || ''),
          secondNoticeDate: formatDateBengali(employee.secondNoticeDate  || ''),
          noticeDate:       formatDateBengali(employee.thirdNoticeDate   || '')
        };
      default:
        return {};
    }
  };

  const dates = getNoticeDates();

  const getDynamicContent = () => {
    if (content) return content;

    switch (noticeType) {
      case 'notice1':
        return (
          <div className="notice-body">
            <p className="font-bold underline">বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক ব্যাখ্যা প্রদান সহ চাকুরীতে যোগদানের জন্য নোটিশ।</p>
            <p>জনাব/জনাবা,</p>
            <p className="text-justify">
              আপনি গত <span className="font-bold underline">{dates.absenceDate}</span> ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। আপনার এরূপ অনুপস্থিতি বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারার আওতায় পড়ে।
            </p>
            <p className="text-justify">
              সুতরাং অত্র পত্র প্রাপ্তির ১০ (দশ) দিনের মধ্যে আপনার অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য আপনাকে নির্দেশ দেয়া হলো।
            </p>
            <p className="text-justify">
              আপনার লিখিত জবাব উক্ত সময়ের মধ্যে নিম্নস্বাক্ষরকারীর নিকট অবশ্যই পৌঁছাতে হবে। অন্যথায় কর্তৃপক্ষ আপনার বিরুদ্ধে প্রয়োজনীয় আইনানুগ ব্যবস্থা নিতে বাধ্য হবে।
            </p>
          </div>
        );

      case 'notice2':
        return (
          <div className="notice-body">
            <p className="font-bold underline">বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক আত্মপক্ষ সমর্থনের সুযোগ প্রদান প্রসঙ্গে।</p>
            <p>জনাব/জনাবা,</p>
            <p className="text-justify">
              আপনি গত <span className="font-bold underline">{dates.absenceDate}</span> ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। এ প্রেক্ষিতে কারখানা কর্তৃপক্ষ আপনার স্থায়ী ও বর্তমান ঠিকানায় রেজিস্ট্রি ডাকযোগে গত <span className="font-bold underline">{dates.firstNoticeDate}</span> ইং তারিখে বিনানুমতিতে চাকুরীতে অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য পত্র প্রেরণ করা হয়। কিন্তু অদ্যবধি আপনি উপরোক্ত বিষয়ে কোন ধরণের লিখিত ব্যাখ্যা প্রদান করেন নাই অথবা চাকুরীতেও যোগদান করেন নাই।
            </p>
            <p className="text-justify">
              অতএব, অত্র পত্র প্রাপ্তির ০৭ (সাত) দিনের মধ্যে আত্মপক্ষ সমর্থন সহ কাজে যোগদান করিতে আপনাকে নির্দেশ দেয়া গেল।
            </p>
            <p className="text-justify">
              উক্ত সময়ের মধ্যে আপনি আত্মপক্ষ সমর্থনের জবাব সহ কাজে যোগদান করতে ব্যর্থ হলে বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী আপনি স্বেচ্ছায় চাকুরী থেকে ইস্তফা গ্রহণ করেছেন বলে গণ্য হবে।
            </p>
          </div>
        );

      case 'notice3':
        return (
          <div className="notice-body">
            <p className="font-bold underline">বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক শ্রমিক কর্তৃক স্বেচ্ছায় চাকুরী হইতে ইস্তফা প্রসঙ্গে।</p>
            <p>জনাব/জনাবা,</p>
            <p className="text-justify">
              আপনি গত <span className="font-bold underline">{dates.absenceDate}</span> ইং তারিখ হতে অদ্যবধি পর্যন্ত কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত থাকার আপনাকে গত <span className="font-bold underline">{dates.firstNoticeDate}</span> ইং তারিখে একটি পত্রের মাধ্যমে ১০ (দশ) দিনের সময় দিয়ে চাকুরীতে যোগদান সহ ব্যাখ্যা প্রদান করতে বলা হয়েছিল। কিন্তু আপনি নির্ধারিত সময়ের মধ্যে কর্মস্থলে উপস্থিত হননি এবং কোন ব্যাখ্যা প্রদান করেননি।
            </p>
            <p className="text-justify">
              তথাপি কর্তৃপক্ষ গত <span className="font-bold underline">{dates.secondNoticeDate}</span> ইং তারিখে আর একটি পত্রের মাধ্যমে আপনাকে আরো ৭ (সাত) দিনের সময় দিয়ে আত্মপক্ষ সমর্থন সহ চাকুরীতে যোগদানের জন্য পুনরায় নির্দেশ প্রদান করেন। তৎসত্ত্বেও আপনি নির্ধারিত সময়ের মধ্যে আত্মপক্ষ করেননি এবং যোগদান করেননি।
            </p>
            <p className="text-justify">
              সুতরাং বাংলাদেশ শ্রম আইন, ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী অনুপস্থিত দিন থেকে আপনি চাকুরী হতে স্বেচ্ছায় ইস্তফা গ্রহণ করেছেন বলে গণ্য করা হলো।
            </p>
            <p className="text-justify">
              অতএব, আপনার বকেয়া মজুরী ও আইনানুগ পাওনা (যদি থাকে) যে কোন কর্মদিবসে অফিস চলাকালীন সময়ে কারখানার হিসাব শাখা থেকে গ্রহণ করার জন্য নির্দেশ দেয়া গেল।
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-content">

        {/* ── Header ─────────────────────────────────────────────── */}
        {(employee.companyName || employee.companyAddress) && (
          <div className="notice-company">
            {employee.companyName && (
              <h1 className="notice-company-name">{employee.companyName}</h1>
            )}
            {employee.companyAddress && (
              <p className="notice-company-address">{employee.companyAddress}</p>
            )}
          </div>
        )}

        {/* ── Title ──────────────────────────────────────────────── */}
        <h2 className="notice-title">"রেজিস্টার্ড ডাকযোগে প্রেরিত"</h2>

        {/* ── Notice date & type ─────────────────────────────────── */}
        {dates.noticeDate && (
          <div className="notice-date-row">
            <span className="notice-type-label">({title})</span>
            <span className="notice-date-label">তারিখ: <strong>{toBanglaNumber(dates.noticeDate)} ইং</strong></span>
          </div>
        )}

        <p className="notice-to">প্রতি,</p>

        {/* ── Employee info grid ─────────────────────────────────── */}
        <div className="notice-emp-grid">
          {/* Col 1 */}
          <div className="notice-emp-col">
            <div className="notice-emp-col-title">ব্যক্তিগত তথ্য</div>
            <p><span>নাম:</span> {employee.name || '-'}</p>
            <p><span>পিতার নাম:</span> {employee.fatherName || '-'}</p>
            {employee.motherName && <p><span>মাতার নাম:</span> {employee.motherName}</p>}
            <p><span>পদবী:</span> {employee.designation || '-'}</p>
            <p><span>কার্ড নং:</span> {employee.cardNo || '-'}</p>
            <p><span>সেকশন:</span> {employee.section || '-'}</p>
            {employee.joiningDate && <p><span>যোগদান:</span> {formatDateBengali(employee.joiningDate)}</p>}
          </div>
          {/* Col 2 */}
          <div className="notice-emp-col">
            <div className="notice-emp-col-title">বর্তমান ঠিকানা</div>
            {employee.presentAddress.houseNo    && <p>বাড়ি: {employee.presentAddress.houseNo}</p>}
            {employee.presentAddress.village    && <p>গ্রাম: {employee.presentAddress.village}</p>}
            {employee.presentAddress.postOffice && <p>ডাকঘর: {employee.presentAddress.postOffice}</p>}
            {employee.presentAddress.thana      && <p>থানা: {employee.presentAddress.thana}</p>}
            {employee.presentAddress.district   && <p>জেলা: {employee.presentAddress.district}</p>}
          </div>
          {/* Col 3 */}
          <div className="notice-emp-col">
            <div className="notice-emp-col-title">স্থায়ী ঠিকানা</div>
            {employee.permanentAddress.houseNo    && <p>বাড়ি: {employee.permanentAddress.houseNo}</p>}
            {employee.permanentAddress.village    && <p>গ্রাম: {employee.permanentAddress.village}</p>}
            {employee.permanentAddress.postOffice && <p>ডাকঘর: {employee.permanentAddress.postOffice}</p>}
            {employee.permanentAddress.thana      && <p>থানা: {employee.permanentAddress.thana}</p>}
            {employee.permanentAddress.district   && <p>জেলা: {employee.permanentAddress.district}</p>}
          </div>
        </div>

        {/* ── Notice body ────────────────────────────────────────── */}
        <div className="notice-body-wrap">
          {getDynamicContent()}
        </div>

        {/* ── Copy list ──────────────────────────────────────────── */}
        {noticeType && (
          <div className="notice-copy">
            <p className="font-bold underline">অনুলিপি:</p>
            <ol>
              {copyList.map((item, i) => (
                <li key={i}><span>{toBanglaNumber(String(i + 1))}.</span> {item}</li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Authority & signature ──────────────────────────────── */}
        {noticeType && (
          <div className="notice-authority">
            <p className="font-bold">কর্তৃপক্ষের নির্দেশক্রমে</p>
          </div>
        )}

        {noticeType && authorization && (
          <div className="notice-sig">
            <PrintSignatureRow value={authorization} lang="bn" hidePrepared hideTopBorder />
          </div>
        )}

      </div>

      {/* ── Styles ─────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        /* ── Screen styles ─────────────────────────────────────── */
        .notice-page {
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          background: #fff;
          padding: 24px 32px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
          border-radius: 8px;
        }
        .notice-content { font-size: 14px; line-height: 1.7; color: #111; }
        .notice-company { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 10px; }
        .notice-company-name { font-size: 18px; font-weight: 700; color: #1e3a5f; margin-bottom: 2px; }
        .notice-company-address { font-size: 13px; color: #374151; }
        .notice-title { text-align: center; font-size: 16px; font-weight: 700; text-decoration: underline; margin: 8px 0; }
        .notice-date-row { display: flex; justify-content: flex-end; gap: 12px; font-size: 13px; margin-bottom: 6px; flex-wrap: wrap; }
        .notice-type-label { color: #1d4ed8; font-weight: 600; }
        .notice-date-label { color: #374151; }
        .notice-to { font-weight: 600; margin: 4px 0; }
        .notice-emp-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 8px 0; }
        .notice-emp-col { font-size: 12.5px; line-height: 1.55; }
        .notice-emp-col-title { font-weight: 700; font-size: 13px; border-bottom: 1.5px solid #111; padding-bottom: 3px; margin-bottom: 4px; }
        .notice-emp-col p { margin: 1px 0; }
        .notice-emp-col span { font-weight: 600; }
        .notice-body-wrap { margin: 10px 0; }
        .notice-body { display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; }
        .notice-body p { margin: 0; line-height: 1.65; }
        .notice-copy { margin-top: 10px; font-size: 13px; }
        .notice-copy ol { list-style: none; padding: 0; margin: 4px 0; }
        .notice-copy li { display: flex; gap: 6px; margin: 2px 0; }
        .notice-authority { margin-top: 12px; font-size: 13px; }
        .notice-sig { margin-top: 4px; }

        /* ── Print styles — force single A4 page ──────────────── */
        ${BASE_PRINT_CSS}

        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 16mm 14mm 16mm;
          }

          /* Hide everything except the notice */
          body * { visibility: hidden !important; }
          .notice-page,
          .notice-page * { visibility: visible !important; }

          /* Reset screen decorations */
          .notice-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }

          /* ── Single-page enforcement ─────────────────────────
             The entire notice-content is treated as one atomic
             block — page-break-inside: avoid forces the browser /
             print engine to never split it across pages.
             Combined with compact font/spacing below, everything
             fits on one A4 sheet for all three notice types.    */
          .notice-content {
            font-size: 9.5pt !important;
            line-height: 1.45 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .notice-company {
            border-bottom: 1.5pt solid #000 !important;
            padding-bottom: 5pt !important;
            margin-bottom: 5pt !important;
          }
          .notice-company-name { font-size: 13pt !important; color: #000 !important; margin-bottom: 1pt !important; }
          .notice-company-address { font-size: 9pt !important; color: #000 !important; }

          .notice-title { font-size: 11pt !important; margin: 4pt 0 !important; }

          .notice-date-row { font-size: 9pt !important; margin-bottom: 3pt !important; }
          .notice-type-label { color: #000 !important; }

          .notice-to { margin: 2pt 0 !important; }

          /* Employee info grid — always 3 columns in print */
          .notice-emp-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6pt !important;
            margin: 5pt 0 !important;
          }
          .notice-emp-col { font-size: 8.5pt !important; line-height: 1.4 !important; }
          .notice-emp-col-title { font-size: 9pt !important; padding-bottom: 2pt !important; margin-bottom: 3pt !important; }
          .notice-emp-col p { margin: 0 !important; }

          .notice-body-wrap { margin: 6pt 0 !important; }
          .notice-body { gap: 5pt !important; font-size: 9.5pt !important; }
          .notice-body p { line-height: 1.5 !important; }

          .notice-copy { margin-top: 6pt !important; font-size: 9pt !important; }
          .notice-copy ol { margin: 2pt 0 !important; }
          .notice-copy li { margin: 1pt 0 !important; }

          .notice-authority { margin-top: 8pt !important; font-size: 9pt !important; }
          .notice-sig { margin-top: 2pt !important; }

          /* Keep signature block together with authority line */
          .notice-authority,
          .notice-sig {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};