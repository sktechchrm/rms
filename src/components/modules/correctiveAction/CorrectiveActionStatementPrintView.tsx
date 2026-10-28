// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionStatementPrintView.tsx — print-friendly version of the
// Statement (list) view: the CURRENTLY FILTERED records, no "Actions" column,
// with the same factory header / authority signature block every other print view
// in this app uses.
// Path: src/components/modules/correctiveAction/CorrectiveActionStatementPrintView.tsx
//
// NOTE: this component deliberately has NO id="printable-area" of its own —
// CorrectiveActionManager wraps it in the one #printable-area element.
//
// `part` chooses what is shown:
//   'statement' — NC details table only (Print Preview — Statement tab)
//   'evidence'  — Evidence table only   (Print Preview — Evidence tab)
//   'all'       — both, evidence starting on a new sheet (default; used by the
//                 hidden print copy under the Statement list)
//
//   Statement — SL No., Audit Conducted By, Audit Date, NC ID, NC Description,
//               NC Reference, NC Category / Keyword, Root Cause Analysis,
//               Corrective Action Plan (CAP), Target Completion Date,
//               Responsible Person(s), CAP Status
//   Evidence  — SL No., NC ID, NC Category / Keyword, CAP Status,
//               Evidence 1, Evidence 2, Evidence 3 (previews centred in cells)
//
// Header line under each title: record count LEFT, print date RIGHT (DD-MM-YYYY).
// Overdue is shown under the Target Completion Date ("12 days overdue").
// The signature block closes the last part shown.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { formatDMY, todayIso, getCapState } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import { EvidenceThumb } from './EvidenceView';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
  /** Which part to show: the NC details table, the evidence table, or both (default). */
  part?: 'statement' | 'evidence' | 'all';
  /** Date shown as "Submission Date" (ISO). Defaults to today. */
  submissionDate?: string;
}

const TH = 'border border-black px-1.5 py-1.5 text-left font-bold';
const TD = 'border border-black px-1.5 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const centerCell: React.CSSProperties = { ...wrap, verticalAlign: 'middle', textAlign: 'center' };
const EV_FONT = 12;   // evidence table text size (px) — change here to make it bigger or smaller

// (label, width %) — each table sums to 100.
const PAGE1: [string, number][] = [
  ['SL No.', 3], ['Audit Conducted By', 7], ['Audit Date', 7], ['NC ID', 6], ['NC Description', 13],
  ['NC Reference', 6], ['NC Category / Keyword', 7], ['Root Cause Analysis', 12],
  ['Corrective Action Plan (CAP)', 13], ['Target Completion Date', 8], ['Responsible Person(s)', 8], ['CAP Status', 10],
];
const PAGE2: [string, number][] = [
  ['SL No.', 5], ['NC ID', 8], ['NC Category / Keyword', 15], ['CAP Status', 12],
  ['Evidence 1', 20], ['Evidence 2', 20], ['Evidence 3', 20],
];

const dash = (v: unknown) => String(v ?? '') || '—';

export default function CorrectiveActionStatementPrintView({
  records, factoryName, factoryAddress, authorization, part = 'all', submissionDate,
}: Props) {
  const today = todayIso();
  const submitted = submissionDate || today;
  const showStatement = part !== 'evidence';
  const showEvidence  = part !== 'statement';

  const colgroup = (cols: [string, number][]) => (
    <colgroup>{cols.map(([label, w]) => <col key={label} style={{ width: `${w}%` }} />)}</colgroup>
  );
  const head = (cols: [string, number][]) => (
    <thead>
      <tr className="bg-gray-50 print:bg-white">
        {cols.map(([label]) => (
          <th key={label} className={`${TH} text-center align-middle`}>
            {label}
          </th>
        ))}
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

  const signature = (
    <footer className="print-footer mt-10">
      <PrintSignatureRow value={authorization} lang="en" />
    </footer>
  );

  // Distinct, non-empty values joined with " | "
  const joinUnique = (values: string[]) => {
    const list = Array.from(new Set(values.map(v => v.trim()).filter(Boolean)));
    return list.length ? list.join(' | ') : '—';
  };
  const buyers = joinUnique(records.map(r => String(r.auditConductedBy ?? '')));
  const auditDates = joinUnique(
    records
      .map(r => String(r.auditDate ?? '').slice(0, 10))
      .filter(Boolean)
      .sort()
      .map(d => formatDMY(d)),
  );
  const closedCount = records.filter(r => String(r.capStatus ?? '').trim().toLowerCase() === 'closed').length;

  const countLine = (
    <div
      className="text-xs text-gray-700 mt-2"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}
    >
      <div>
        <div>
          <strong>Name of Buyer:</strong>{' '}
          <strong><em>{buyers}</em></strong>
        </div>
        <div>
          <strong>Date of Audit:</strong>{' '}
          <strong><em>{auditDates}</em></strong>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div>
          <strong>Submission Date:</strong>{' '}
          <strong><em>{formatDMY(submitted)}</em></strong>
        </div>
        <div>
          <strong>Total NCs:</strong>{' '}
          <strong><em>{records.length}</em></strong>
          {' | '}
          <strong>Closed:</strong>{' '}
          <strong><em>{closedCount}</em></strong>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        {/* Factory header — on every tab */}
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
        </header>

        {/* ── Statement (NC details) ───────────────────────────────────── */}
        {showStatement && (
          <>
            <div className="text-center mt-3 mb-2">
              <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Corrective Action Plan (CAP)</h2>
              {countLine}
            </div>

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
                        <td className={`${TD} text-center`} style={wrap}>{dash(r.auditConductedBy)}</td>
                        <td className={`${TD} text-center`}>{formatDMY(String(r.auditDate ?? '')) || '—'}</td>
                        <td className={`${TD} text-center font-semibold`} style={wrap}>{dash(r.ncId)}</td>
                        <td className={TD} style={wrap}>{dash(r.ncDescription)}</td>
                        <td className={TD} style={wrap}>{dash(r.ncReference)}</td>
                        <td className={`${TD} text-center`} style={wrap}>{dash(r.ncCategory)}</td>
                        <td className={TD} style={wrap}>{dash(r.rootCause)}</td>
                        <td className={TD} style={wrap}>{dash(r.correctiveAction)}</td>
                        <td className={`${TD} text-center`}>
                          {formatDMY(String(r.targetDate ?? '')) || '—'}
                          {state === 'overdue' && <div className="font-semibold" style={{ fontSize: 8 }}>{detail}</div>} 
                        </td>
                        <td className={`${TD} text-center`} style={wrap}>{dash(r.responsiblePersons)}</td>
                        <td className={`${TD} text-center font-semibold`} style={wrap}>{dash(r.capStatus)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </main>

            {/* Signature closes the statement only when it is the last part shown */}
            {!showEvidence && signature}
          </>
        )}

        {/* On-screen divider (only when both parts are shown together) */}
        {showStatement && showEvidence && (
          <div className="no-print" style={{ margin: '18px 0', borderTop: '2px dashed #94a3b8', textAlign: 'center' }}>
            <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 10px', fontSize: 11, color: '#64748b' }}>
              Page 2 — Evidence
            </span>
          </div>
        )}

        {/* ── Evidence ─────────────────────────────────────────────────── */}
        {showEvidence && (
          <section style={showStatement ? { breakBefore: 'page', pageBreakBefore: 'always' } : undefined}>
            <div className="text-center mt-3 mb-2">
              <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Pictorial Evidence</h2>
              {countLine}
            </div>

            <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: EV_FONT, lineHeight: 1.35, tableLayout: 'fixed' }}>
              {colgroup(PAGE2)}
              {head(PAGE2)}
              <tbody>
                {records.length === 0 && empty(PAGE2.length)}
                {records.map((r, index) => (
                  <tr key={String(r.id)} className="req-item-row">
                    <td className={`${TD} text-center`}>{index + 1}</td>
                    <td className={`${TD} text-center`} style={wrap}>{dash(r.ncId)}</td>
                    <td className={TD} style={wrap}>{dash(r.ncCategory)}</td>
                    <td className={`${TD} text-center font-semibold`} style={wrap}>{dash(r.capStatus)}</td>
                    <td className={TD} style={centerCell}><EvidenceThumb url={r.evidence1} name={r.evidence1Name} maxWidth={220} ratio="4 / 4" print /></td>
                    <td className={TD} style={centerCell}><EvidenceThumb url={r.evidence2} name={r.evidence2Name} maxWidth={220} ratio="4 / 4" print /></td>
                    <td className={TD} style={centerCell}><EvidenceThumb url={r.evidence3} name={r.evidence3Name} maxWidth={220} ratio="4 / 4" print /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {signature}
          </section>
        )}

      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * { visibility: visible !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; background: white !important; }
          .print-content { font-size: 10pt !important; }
          .req-items-table { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .req-item-row { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}