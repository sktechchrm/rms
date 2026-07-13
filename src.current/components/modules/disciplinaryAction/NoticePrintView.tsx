// ─────────────────────────────────────────────────────────────────────────────
// NoticePrintView.tsx — one component, 3 notice types (parameterized by
// `notice`), since all 3 share the same factory header / signature footer
// structure and only the body content differs.
// Path: src/components/modules/disciplinaryAction/NoticePrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DisciplinaryActionData } from './types';
import { calculateRepresentativeCount, calculateInvestigationDeadline } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

interface Props {
  data: DisciplinaryActionData;
  notice: 1 | 2 | 3;
  authorization: AuthorizationState;
}

export default function NoticePrintView({ data, notice, authorization }: Props) {
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const repCount     = calculateRepresentativeCount(memberCount);
  const deadline     = calculateInvestigationDeadline(data.notice1Date);

  const title =
    notice === 1 ? 'Show Cause / Temporary Suspension Notice' :
    notice === 2 ? 'Representative Nomination Notice' :
    'Notice to Start Investigation Process';

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{data.factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{data.factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-4">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">{title}</h2>
          </div>
          <div className="flex justify-end text-sm mb-3">
            <p><span className="font-bold">Date:</span> {notice === 1 ? data.notice1Date : data.date}</p>
          </div>
        </header>

        <main className="print-body" style={{ fontSize: 13, lineHeight: 1.8 }}>

          {notice === 1 && (
            <>
              <table className="w-full border-collapse border border-black mb-6" style={{ fontSize: 12.5 }}>
                <tbody>
                  <tr><td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white" style={{ width: '35%' }}>কর্মীর নাম</td><td className="border border-black px-3 py-2">{data.employeeName || '—'}</td></tr>
                  <tr><td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white">কার্ড নং</td><td className="border border-black px-3 py-2">{data.cardNo || '—'}</td></tr>
                  <tr><td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white">পদবী</td><td className="border border-black px-3 py-2">{data.designation || '—'}</td></tr>
                  <tr><td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white">সেকশন</td><td className="border border-black px-3 py-2">{data.section || '—'}</td></tr>
                  <tr><td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white">যোগদানের তারিখ</td><td className="border border-black px-3 py-2">{data.joiningDate || '—'}</td></tr>
                </tbody>
              </table>
              <p className="mb-4">
                You are hereby directed to show cause, in writing, within 3 (three) working days of receipt
                of this notice, as to why disciplinary action should not be taken against you. Pending
                the outcome of this matter, you are placed under temporary suspension with effect from
                the date of this notice, in accordance with the applicable provisions of the Bangladesh
                Labour Act, 2006.
              </p>
              <p>Please submit your written explanation to the HR Department at the earliest.</p>
            </>
          )}

          {notice === 2 && (
            <>
              <p className="mb-4">
                Reference is made to the Show Cause Notice dated <b>{data.notice1Date}</b> issued to
                <b> {data.employeeName}</b> (Card No: {data.cardNo}). As the reply received was found to be
                <b> not satisfactory</b>, an investigation committee is being constituted to look into the matter.
              </p>
              <table className="w-full border-collapse border border-black" style={{ fontSize: 12.5 }}>
                <tbody>
                  <tr><td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white" style={{ width: '55%' }}>Total Number of Committee Members</td><td className="border border-black px-3 py-2">{memberCount}</td></tr>
                  <tr><td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white">Worker Representatives Required (50%, rounded up)</td><td className="border border-black px-3 py-2 font-semibold">{repCount}</td></tr>
                </tbody>
              </table>
              <p className="mt-4">
                The Workers' Participation Committee / CBA is requested to nominate <b>{repCount}</b> worker
                representative(s) out of the total {memberCount} committee members within 5 (five) working days
                of receipt of this notice.
              </p>
            </>
          )}

          {notice === 3 && (
            <>
              <p className="mb-4">
                This is to notify that the investigation committee constituted in connection with the
                disciplinary matter of <b>{data.employeeName}</b> (Card No: {data.cardNo}, {data.designation},
                {' '}{data.section}) is hereby directed to commence the investigation process. The investigation
                must be concluded and a report submitted within the timeline stated below.
              </p>
              <table className="w-full border-collapse border border-black mb-4" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr className="bg-gray-50 print:bg-white">
                    <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                    <th className="border border-black px-2 py-1.5 text-left font-bold">কর্মীর নাম</th>
                    <th className="border border-black px-2 py-1.5 text-left font-bold">কার্ড নং</th>
                    <th className="border border-black px-2 py-1.5 text-left font-bold">পদবী</th>
                    <th className="border border-black px-2 py-1.5 text-left font-bold">সেকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {data.committeeMembers.map((m, i) => (
                    <tr key={i}>
                      <td className="border border-black px-2 py-1.5 text-center">{m.slNo}</td>
                      <td className="border border-black px-2 py-1.5">{m.name || '—'}</td>
                      <td className="border border-black px-2 py-1.5">{m.cardNo || '—'}</td>
                      <td className="border border-black px-2 py-1.5">{m.designation || '—'}</td>
                      <td className="border border-black px-2 py-1.5">{m.section || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <b>Timeline:</b> The investigation shall be completed within 50 (fifty) days from the date of
                the original Show Cause Notice (<b>{data.notice1Date}</b>), i.e. by <b>{deadline}</b>.
              </p>
            </>
          )}

        </main>

        <footer className="print-footer mt-10">
          <PrintSignatureRow value={authorization} lang="en" />
        </footer>

      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
      `}</style>
    </div>
  );
}
