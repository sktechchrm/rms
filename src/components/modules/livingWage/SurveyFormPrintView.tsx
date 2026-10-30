// ─────────────────────────────────────────────────────────────────────────────
// SurveyFormPrintView.tsx — blank Individual Worker Survey Form (A4 portrait, Bangla + English).
// One worker per page; `copies` pages. The expense rows follow the same order as the
// "Paste from Excel" columns, so entering the paper forms is quick.
// NO id="printable-area" here — LivingWageManager wraps it.
// Path: src/components/modules/livingWage/SurveyFormPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { BASE_PRINT_CSS } from '../../../utils/printCSS';

interface Props { factoryName: string; factoryAddress: string; location: string; studyYear: string; copies: number; }

const FONT = "'Noto Sans Bengali', Arial, sans-serif";
const line: React.CSSProperties = { borderBottom: '1px solid #000', height: 26 };
const cellB: React.CSSProperties = { border: '1px solid #000', padding: '5px 8px', fontSize: 12, verticalAlign: 'middle' };
const secTitle: React.CSSProperties = { fontWeight: 700, fontSize: 13, background: '#e5e7eb', border: '1px solid #000', padding: '4px 8px', marginTop: 10 };

const EXPENSES: { bn: string; en: string; eg: string }[] = [
  { bn: 'খাদ্য', en: 'Food', eg: 'Rice, pulses, fish / meat, vegetables, oil, spices, milk, fruit' },
  { bn: 'বাসা ভাড়া', en: 'Housing (rent)', eg: 'House rent, repairs and maintenance' },
  { bn: 'ইউটিলিটি', en: 'Utilities', eg: 'Electricity, water, gas / cooking fuel' },
  { bn: 'চিকিৎসা', en: 'Healthcare', eg: 'Doctor, medicine, tests, hospital' },
  { bn: 'শিক্ষা', en: 'Education', eg: 'School fees, books, uniform, tuition' },
  { bn: 'যাতায়াত', en: 'Transport', eg: 'Travel to work and other travel' },
  { bn: 'পোশাক', en: 'Clothing', eg: 'Clothes, shoes, bedding' },
  { bn: 'যোগাযোগ', en: 'Communication', eg: 'Mobile phone, internet' },
  { bn: 'অন্যান্য প্রয়োজনীয় খরচ', en: 'Other essentials', eg: 'Soap, personal care, household goods, festivals' },
];

export default function SurveyFormPrintView({ factoryName, factoryAddress, location, studyYear, copies }: Props) {
  const pages = Array.from({ length: Math.max(1, Math.min(100, copies)) }, (_, k) => k);

  return (
    <div className="bg-white max-w-full mx-auto" style={{ fontFamily: FONT, color: '#000' }}>
      {pages.map(k => (
        <section key={k} className="print-content p-8 print:p-0" style={{ breakAfter: k < pages.length - 1 ? 'page' : 'auto', pageBreakAfter: k < pages.length - 1 ? 'always' : 'auto' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>{factoryName || 'FACTORY NAME'}</div>
            <div style={{ fontSize: 11 }}>{factoryAddress}</div>
          </div>
          <div style={{ textAlign: 'center', margin: '8px 0 4px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, textDecoration: 'underline' }}>ব্যক্তিগত কর্মী জরিপ ফরম / Individual Worker Survey Form</div>
            <div style={{ fontSize: 11 }}>Living Wage Assessment (Anker Methodology) · {location} · {studyYear}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, margin: '4px 0' }}>
            <span>ক্রমিক নং / Serial No: ____________</span><span>এই ফরমের তথ্য শুধু লিভিং ওয়েজ নির্ণয়ের কাজে ব্যবহৃত হবে।</span>
          </div>

          <div style={secTitle}>১. কর্মীর তথ্য / Worker information</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
            {[['কর্মীর নাম / Worker name', 'কর্মী আইডি / Worker ID'], ['বিভাগ / Department', 'পদবি / Designation'], ['জরিপের তারিখ / Survey date', 'জরিপকারীর নাম / Surveyor name']].map(([a, b], r) => (
              <tr key={r}>
                <td style={{ ...cellB, width: '25%', fontWeight: 600 }}>{a}</td><td style={{ ...cellB, width: '25%' }}>&nbsp;</td>
                <td style={{ ...cellB, width: '25%', fontWeight: 600 }}>{b}</td><td style={{ ...cellB, width: '25%' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody></table>

          <div style={secTitle}>২. পরিবারের তথ্য / Household</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
            <tr>
              <td style={{ ...cellB, width: '62%', fontWeight: 600 }}>পরিবারের মোট সদস্য (একসাথে থাকেন ও খরচ ভাগ করেন) / Total family members living together and sharing expenses</td>
              <td style={cellB}>&nbsp;</td>
            </tr>
            <tr>
              <td style={{ ...cellB, fontWeight: 600 }}>উপার্জনকারী সদস্য (পূর্ণ-সময়ের সমতুল্য; একটি পূর্ণ-সময়ের চাকরি = ১) / Earners in the family, full-time equivalent (one full-time job = 1)</td>
              <td style={cellB}>&nbsp;</td>
            </tr>
          </tbody></table>

          <div style={secTitle}>৩. মাসিক পারিবারিক খরচ (টাকা) / Monthly household expenses (Tk)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ ...cellB, width: '5%' }}>#</th><th style={{ ...cellB, width: '27%', textAlign: 'left' }}>খরচের খাত / Item</th>
              <th style={{ ...cellB, textAlign: 'left' }}>কী কী ধরা হবে / Include</th><th style={{ ...cellB, width: '20%' }}>টাকা / Amount (Tk)</th>
            </tr></thead>
            <tbody>
              {EXPENSES.map((e, n) => (
                <tr key={e.en} style={{ height: 34 }}>
                  <td style={{ ...cellB, textAlign: 'center' }}>{n + 1}</td>
                  <td style={{ ...cellB, fontWeight: 600 }}>{e.bn} / {e.en}</td>
                  <td style={{ ...cellB, fontSize: 10.5 }}>{e.eg}</td>
                  <td style={cellB}>&nbsp;</td>
                </tr>
              ))}
              <tr style={{ height: 34 }}><td style={cellB} colSpan={3}><b>মোট (যাচাইয়ের জন্য) / Total (for checking)</b></td><td style={cellB}>&nbsp;</td></tr>
            </tbody>
          </table>

          <div style={{ fontSize: 11.5, margin: '12px 0 6px' }}>ঘোষণা: আমি নিশ্চিত করছি যে উপরের তথ্য আমার জানামতে সঠিক। / I confirm the information above is correct to the best of my knowledge.</div>
          <div style={{ display: 'flex', gap: 28, marginTop: 30, fontSize: 11.5 }}>
            {['কর্মীর স্বাক্ষর / Worker signature', 'জরিপকারীর স্বাক্ষর / Surveyor signature', 'যাচাইকারীর স্বাক্ষর / Verified by'].map(t => (
              <div key={t} style={{ flex: 1, textAlign: 'center' }}><div style={line} />{t}</div>
            ))}
          </div>
        </section>
      ))}

      <style>{`
        ${BASE_PRINT_CSS}
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * { visibility: visible !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; background: white !important; }
        }
      `}</style>
    </div>
  );
}