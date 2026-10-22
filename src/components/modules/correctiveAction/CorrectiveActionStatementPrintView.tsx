// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionStatementPrintView.tsx — print-friendly version of the
// Statement (list) view: the CURRENTLY FILTERED records, no "Actions" column,
// with the same factory header / authority signature block every other print view
// in this app uses.
// Path: src/components/modules/correctiveAction/CorrectiveActionStatementPrintView.tsx
//
// Header line under the title: record count on the LEFT ("4 record(s)"), print
// date on the RIGHT ("20-10-2026"). Dates print as DD-MM-YYYY. Evidence links mean
// nothing on paper, so Evidence 1–3 print "Yes" when attached and "—" otherwise.
// Overdue prints "12 days" for an overdue record, "—" otherwise. The table is
// fixed-layout so all 16 columns fit on landscape A4 (small print, long text wraps).
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { formatDMY, todayIso, getCapState, plural } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

const TH = 'border border-black px-1 py-1 text-left font-bold';
const TD = 'border border-black px-1 py-1 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };

const COLUMNS: [string, number][] = [
  ['SL No.', 3], ['Audit Conducted By', 6], ['Audit Date', 6], ['NC ID', 5], ['NC Description', 12],
  ['NC Reference', 6], ['NC Category / Keyword', 6], ['Root Cause Analysis', 11],
  ['Corrective Action Plan (CAP)', 12], ['Target Completion Date', 6], ['Responsible Person(s)', 7],
  ['CAP Status', 6], ['Evidence 1', 3], ['Evidence 2', 3], ['Evidence 3', 3], ['Overdue', 5],
];

export default function CorrectiveActionStatementPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = todayIso();

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Corrective Action Plan (CAP) Record</h2>
            <div className="text-xs text-gray-600 mt-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>{records.length} record(s)</span>
              <span>{formatDMY(today)}</span>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 8, tableLayout: 'fixed' }}>
            <colgroup>
              {COLUMNS.map(([label, w]) => <col key={label} style={{ width: `${w}%` }} />)}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                {COLUMNS.map(([label]) => <th key={label} className={TH}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="border border-black px-2 py-4 text-center text-gray-600">
                    No records match the selected filter
                  </td>
                </tr>
              )}
              {records.map((r, index) => {
                const { overdueDays } = getCapState(String(r.targetDate ?? ''), String(r.capStatus ?? ''), today);
                const dash = (v: unknown) => String(v ?? '') || '—';
                return (
                  <tr key={String(r.id)} className="req-item-row">
                    <td className={`${TD} text-center`}>{index + 1}</td>
                    <td className={TD} style={wrap}>{dash(r.auditConductedBy)}</td>
                    <td className={TD}>{formatDMY(String(r.auditDate ?? '')) || '—'}</td>
                    <td className={`${TD} font-semibold`} style={wrap}>{dash(r.ncId)}</td>
                    <td className={TD} style={wrap}>{dash(r.ncDescription)}</td>
                    <td className={TD} style={wrap}>{dash(r.ncReference)}</td>
                    <td className={TD} style={wrap}>{dash(r.ncCategory)}</td>
                    <td className={TD} style={wrap}>{dash(r.rootCause)}</td>
                    <td className={TD} style={wrap}>{dash(r.correctiveAction)}</td>
                    <td className={TD}>{formatDMY(String(r.targetDate ?? '')) || '—'}</td>
                    <td className={TD} style={wrap}>{dash(r.responsiblePersons)}</td>
                    <td className={`${TD} font-semibold`} style={wrap}>{dash(r.capStatus)}</td>
                    <td className={TD}>{r.evidence1 ? 'Yes' : '—'}</td>
                    <td className={TD}>{r.evidence2 ? 'Yes' : '—'}</td>
                    <td className={TD}>{r.evidence3 ? 'Yes' : '—'}</td>
                    <td className={`${TD} font-semibold`}>{overdueDays ? plural(overdueDays) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>

        <footer className="print-footer mt-10">
          <PrintSignatureRow value={authorization} lang="en" />
        </footer>

      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * { visibility: visible !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; background: white !important; }
          .print-content { font-size: 10pt !important; }
          .req-items-table thead { display: table-header-group; }
          .req-item-row { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}