// ─────────────────────────────────────────────────────────────────────────────
// SupplierPrintView.tsx — print / PDF (A4 landscape), one component:
//   mode 'suppliers' — Supplier assessments (the Dashboard list, as filtered)
//   mode 'asl'       — Approved Supplier List, grouped by category
//   mode 'audits'    — Assessment Analysis: external supplier audits (from Compliance Audit)
// NO id="printable-area" here — SupplierManager wraps it.
// Path: src/components/modules/supplierAssessment/SupplierPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { formatDMY, todayIso, supplierSummary, summarizeSites, approvalLabel } from './types';
import type { SupplierRow, ExtAudit } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

export type PrintMode = 'suppliers' | 'asl' | 'audits';

interface Props {
  mode: PrintMode;
  rows: SupplierRow[];
  audits: ExtAudit[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
  filterText?: string;
}

const TH = 'border border-black px-2 py-1.5 text-left font-bold bg-gray-50 print:bg-white';
const TD = 'border border-black px-2 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const tableStyle: React.CSSProperties = { fontSize: 11, lineHeight: 1.35, tableLayout: 'fixed' };
const dash = (v: string) => v || '—';
const certText = (r: SupplierRow) => (r.certs.length ? r.certs.map(x => `${x.c.name}${x.c.validUntil ? ` (${formatDMY(x.c.validUntil)})` : ''}${x.state === 'expired' ? ' expired' : ''}`).join(', ') : '—');

interface PCol { h: string; w: number; cell: (r: SupplierRow, k: number) => ReactNode }
const COLUMNS: Record<'suppliers' | 'asl', PCol[]> = {
  suppliers: [
    { h: 'SL', w: 3, cell: (_r, k) => k + 1 },
    { h: 'Supplier ID', w: 8, cell: r => r.code },
    { h: 'Supplier', w: 18, cell: r => <strong>{r.name}</strong> },
    { h: 'Category', w: 11, cell: r => dash(r.category) },
    { h: 'Score', w: 7, cell: r => (r.pq.scored ? `${r.pq.total}/100` : '—') },
    { h: 'Result', w: 9, cell: r => (r.pq.result === 'Pending' ? '—' : approvalLabel(r.pq.result)) },
    { h: 'Status', w: 9, cell: r => <strong>{r.status}</strong> },
    { h: 'Assessed by / date', w: 13, cell: r => `${dash(r.assessedBy)}${r.assessmentDate ? ` · ${formatDMY(r.assessmentDate)}` : ''}` },
    { h: 'Certificates', w: 22, cell: certText },
  ],
  asl: [
    { h: 'SL', w: 3, cell: (_r, k) => k + 1 },
    { h: 'Supplier ID', w: 8, cell: r => r.code },
    { h: 'Supplier', w: 19, cell: r => <strong>{r.name}</strong> },
    { h: 'Supplier type', w: 11, cell: r => dash(r.businessType) },
    { h: 'Score', w: 7, cell: r => `${r.pq.total}/100` },
    { h: 'Approval', w: 9, cell: r => <strong>{r.status}</strong> },
    { h: 'Assessed by / date', w: 14, cell: r => `${dash(r.assessedBy)}${r.assessmentDate ? ` · ${formatDMY(r.assessmentDate)}` : ''}` },
    { h: 'Certificates', w: 29, cell: certText },
  ],
};
const TITLE: Record<PrintMode, string> = { suppliers: 'Supplier Assessment Register', asl: 'Approved Supplier List (ASL)', audits: 'Assessment Analysis — External Supplier Audits' };

export default function SupplierPrintView({ mode, rows, audits, factoryName, factoryAddress, authorization, filterText }: Props) {
  const today = todayIso();
  const sum = supplierSummary(rows);
  const sites = mode === 'audits' ? summarizeSites(audits) : [];
  const cols = mode === 'audits' ? [] : COLUMNS[mode];
  const auditHead = ['SL', 'Site / supplier', 'Audits', 'Latest round', 'Audit date', 'Score', 'Rating', 'Critical', 'Major', 'Minor', 'Past timeline', 'In supplier list'];
  const auditW = [3, 20, 6, 9, 9, 6, 11, 7, 6, 6, 8, 9];

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">{TITLE[mode]}</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                {filterText && <div><strong>View:</strong> {filterText}</div>}
                {mode === 'asl' && <div>Result from the assessment score: 85+ Approved · 70–84 Conditional · below 70 Not Approved.</div>}
                {mode === 'audits' && <div>Source: Compliance Audit module — audit type “External for Supplier”; latest audit per site.</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>{mode === 'asl' ? 'Effective date' : 'Date'}:</strong> {formatDMY(today)}</div>
                {mode === 'audits'
                  ? <div><strong>Audits:</strong> {audits.length} | <strong>Sites:</strong> {sites.length}</div>
                  : <div><strong>Suppliers:</strong> {sum.total} | <strong>Approved:</strong> {sum.approved} | <strong>Conditional:</strong> {sum.conditional}{mode === 'suppliers' && <> | <strong>Not approved:</strong> {sum.notApproved}</>}</div>}
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          {mode !== 'audits' && (
            <table className="w-full border-collapse border border-black req-items-table" style={tableStyle}>
              <colgroup>{cols.map((c, k) => <col key={k} style={{ width: `${c.w}%` }} />)}</colgroup>
              <thead><tr>{cols.map(c => <th key={c.h} className={TH}>{c.h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={cols.length} className="border border-black px-2 py-4 text-center text-gray-600">No suppliers match the selected view</td></tr>}
                {rows.map((r, k) => (
                  <Fragment key={`${r.id}-${k}`}>
                    {mode === 'asl' && (k === 0 || rows[k - 1].category !== r.category) && (
                      <tr><td colSpan={cols.length} className="border border-black px-2 py-1 font-bold bg-gray-100 print:bg-white">{r.category || '(No category)'}</td></tr>
                    )}
                    <tr className="req-item-row">
                      {cols.map((c, j) => <td key={j} className={`${TD}${j === 0 ? ' text-center' : ''}`} style={wrap}>{c.cell(r, k)}</td>)}
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}

          {mode === 'audits' && (
            <table className="w-full border-collapse border border-black req-items-table" style={tableStyle}>
              <colgroup>{auditW.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
              <thead><tr>{auditHead.map(h => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {sites.length === 0 && <tr><td colSpan={auditHead.length} className="border border-black px-2 py-4 text-center text-gray-600">No external supplier audit found</td></tr>}
                {sites.map((s, k) => {
                  const a = s.latest;
                  return (
                    <tr key={s.key} className="req-item-row">
                      <td className={`${TD} text-center`}>{k + 1}</td>
                      <td className={`${TD} font-semibold`} style={wrap}>{s.site}</td>
                      <td className={TD}>{s.audits}</td><td className={TD} style={wrap}>{dash(a.round)}</td><td className={TD}>{dash(formatDMY(a.auditDate))}</td>
                      <td className={`${TD} font-semibold`}>{a.score}</td><td className={TD}>{a.rating}</td>
                      <td className={TD}>{a.critical}</td><td className={TD}>{a.major}</td><td className={TD}>{a.minor}</td><td className={TD}>{a.pastDue}</td>
                      <td className={TD} style={wrap}>{s.supplierCode || 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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