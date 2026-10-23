// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionStatementPrintView.tsx — print-friendly version of the
// Statement (list) view: the CURRENTLY FILTERED records, no "Actions" column,
// with the same factory header / authority signature block every other print view
// in this app uses.
// Path: src/components/modules/correctiveAction/CorrectiveActionStatementPrintView.tsx
//
// NOTE: this component deliberately has NO id="printable-area" of its own —
// CorrectiveActionManager wraps it in the one #printable-area element (a second
// element with the same id broke print/PDF targeting).
//
// TWO PAGES over the same records, in the same order, with the same SL No.:
//   Page 1 — SL No., Audit Conducted By, Audit Date, NC ID, NC Description,
//            NC Reference, NC Category / Keyword, Root Cause Analysis, Corrective
//            Action Plan (CAP), Target Completion Date, Responsible Person(s),
//            CAP Status
//   Page 2 — SL No., NC ID, NC Category / Keyword, CAP Status, Evidence 1,
//            Evidence 2, Evidence 3
// Page 2 always starts on a new sheet (break-before: page) and is built from the
// same list, so every NC ID on page 1 reappears on page 2 with its evidence. A
// list longer than one sheet continues onto more sheets with the column header
// repeated; the signature block closes page 2.
//
// Header line under the title: record count on the LEFT ("4 record(s)"), print
// date on the RIGHT ("20-10-2026"). Dates print as DD-MM-YYYY. Evidence prints
// the attached file's name (or the pasted link) as plain text, "—" when empty.
// Overdue is shown under the Target Completion Date ("12 days overdue").
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { formatDMY, todayIso, getCapState } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

const TH = 'border border-black px-1.5 py-1.5 text-left font-bold';
const TD = 'border border-black px-1.5 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };

// (label, width %) — each table sums to 100.
const PAGE1: [string, number][] = [
  ['SL No.', 3], ['Audit Conducted By', 7], ['Audit Date', 7], ['NC ID', 6], ['NC Description', 13],
  ['NC Reference', 6], ['NC Category / Keyword', 7], ['Root Cause Analysis', 12],
  ['Corrective Action Plan (CAP)', 13], ['Target Completion Date', 8], ['Responsible Person(s)', 8], ['CAP Status', 10],
];
const PAGE2: [string, number][] = [
  ['SL No.', 5], ['NC ID', 10], ['NC Category / Keyword', 15], ['CAP Status', 14],
  ['Evidence 1', 19], ['Evidence 2', 19], ['Evidence 3', 18],
];

const dash = (v: unknown) => String(v ?? '') || '—';
/** What to print for an evidence slot: the file name, else the pasted link, else a dash. */
const evidenceText = (url: unknown, name: unknown) => String(name ?? '') || String(url ?? '') || '—';

export default function CorrectiveActionStatementPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = todayIso();

  const colgroup = (cols: [string, number][]) => (
    <colgroup>{cols.map(([label, w]) => <col key={label} style={{ width: `${w}%` }} />)}</colgroup>
  );
  const head = (cols: [string, number][]) => (
    <thead>
      <tr className="bg-gray-50 print:bg-white">
        {cols.map(([label]) => <th key={label} className={TH}>{label}</th>)}
      </tr>
    </thead>
  );
  const empty = (span: number) => (
    <tr>
      <td colSpan={span} className="border border-black px-2 py-4 text-center text-gray-600">
        No records match the selected filter
      </td>
    </tr>
  );

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        {/* ── Page 1 ───────────────────────────────────────────────────── */}
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
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 9, tableLayout: 'fixed' }}>
            {colgroup(PAGE1)}
            {head(PAGE1)}
            <tbody>
              {records.length === 0 && empty(PAGE1.length)}
              {records.map((r, index) => {
                const { state, detail } = getCapState(String(r.targetDate ?? ''), String(r.capStatus ?? ''), today);
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
                    <td className={TD}>
                      {formatDMY(String(r.targetDate ?? '')) || '—'}
                      {state === 'overdue' && <div className="font-semibold" style={{ fontSize: 8 }}>{detail}</div>}
                    </td>
                    <td className={TD} style={wrap}>{dash(r.responsiblePersons)}</td>
                    <td className={`${TD} font-semibold`} style={wrap}>{dash(r.capStatus)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>

        {/* On-screen divider only (hidden when printing) */}
        <div className="no-print" style={{ margin: '18px 0', borderTop: '2px dashed #94a3b8', textAlign: 'center' }}>
          <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 10px', fontSize: 11, color: '#64748b' }}>
            Page 2 — Evidence
          </span>
        </div>

        {/* ── Page 2: same records, evidence ──────────────────────────── */}
        <section style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Corrective Action Plan (CAP) Record — Evidence</h2>
            <div className="text-xs text-gray-600 mt-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>{records.length} record(s)</span>
              <span>{formatDMY(today)}</span>
            </div>
          </div>

          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 9, tableLayout: 'fixed' }}>
            {colgroup(PAGE2)}
            {head(PAGE2)}
            <tbody>
              {records.length === 0 && empty(PAGE2.length)}
              {records.map((r, index) => (
                <tr key={String(r.id)} className="req-item-row">
                  <td className={`${TD} text-center`}>{index + 1}</td>
                  <td className={`${TD} font-semibold`} style={wrap}>{dash(r.ncId)}</td>
                  <td className={TD} style={wrap}>{dash(r.ncCategory)}</td>
                  <td className={`${TD} font-semibold`} style={wrap}>{dash(r.capStatus)}</td>
                  <td className={TD} style={wrap}>{evidenceText(r.evidence1, r.evidence1Name)}</td>
                  <td className={TD} style={wrap}>{evidenceText(r.evidence2, r.evidence2Name)}</td>
                  <td className={TD} style={wrap}>{evidenceText(r.evidence3, r.evidence3Name)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <footer className="print-footer mt-10">
            <PrintSignatureRow value={authorization} lang="en" />
          </footer>
        </section>

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