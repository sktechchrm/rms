// ─────────────────────────────────────────────────────────────────────────────
// SupplierPrintView.tsx — print / PDF (A4 landscape), one component:
//   mode 'suppliers' — the Dashboard table, exactly as sorted / filtered on screen
//   mode 'asl'       — Approved Supplier List (grouped by category when no sort is active)
//   mode 'analysis'  — Assessment Analysis: category summary + audited sites (as sorted / filtered)
//   mode 'summary'   — one supplier's details summary (opened from the ASL)
// Both supplier tables have an Address column (address + mobile + email).
// NO id="printable-area" here — SupplierManager wraps it.
// Path: src/components/modules/supplierAssessment/SupplierPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { formatDMY, todayIso, supplierSummary, approvalLabel, AREAS, MAX_TOTAL } from './types';
import type { SupplierRow, CategoryRow, SiteSummary } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

export type PrintMode = 'suppliers' | 'asl' | 'analysis' | 'summary';

interface Props {
  mode: PrintMode;
  rows: SupplierRow[];                 // suppliers / asl list
  cats: CategoryRow[];                 // analysis
  sites: SiteSummary[];                // analysis
  selected: SupplierRow | null;        // summary
  selectedSite: SiteSummary | null;    // summary
  grouped: boolean;                    // asl: show category group rows
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
  filterText?: string;
}

const TH = 'border border-black px-2 py-1.5 text-left font-bold bg-gray-50 print:bg-white';
const TD = 'border border-black px-2 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const tableStyle: React.CSSProperties = { fontSize: 11, lineHeight: 1.35, tableLayout: 'fixed' };
const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '—' : String(v));
const expireText = (r: SupplierRow) => (r.expireOn ? `${formatDMY(r.expireOn)}${r.status === 'Approved' || r.status === 'Conditional' ? (r.daysLeft !== null && r.daysLeft < 0 ? ' (expired)' : '') : ''}` : '—');

/** Address cell: address, then mobile and email on their own lines. */
const addressCell = (r: SupplierRow): ReactNode => (
  <>
    <div>{dash(r.address)}</div>
    {r.phone && <div>Tel: {r.phone}</div>}
    {r.email && <div>Email: {r.email}</div>}
  </>
);

interface PCol { h: string; w: number; cell: (r: SupplierRow, k: number) => ReactNode }
const COLUMNS: Record<'suppliers' | 'asl', PCol[]> = {
  suppliers: [
    { h: 'SL', w: 3, cell: (_r, k) => k + 1 },
    { h: 'Supplier ID', w: 8, cell: r => r.code },
    { h: 'Supplier', w: 15, cell: r => <strong>{r.name}</strong> },
    { h: 'Category', w: 10, cell: r => dash(r.category) },
    { h: 'Address', w: 24, cell: addressCell },
    { h: 'Score', w: 7, cell: r => (r.overall === null ? '—' : `${r.overall}/100`) },
    { h: 'Status', w: 8, cell: r => <strong>{r.state}</strong> },
    { h: 'Approved by', w: 9, cell: r => dash(r.approvedBy) },
    { h: 'Date of approval', w: 8, cell: r => dash(formatDMY(r.approvalDate)) },
    { h: 'Expire on', w: 8, cell: expireText },
  ],
  asl: [
    { h: 'SL', w: 3, cell: (_r, k) => k + 1 },
    { h: 'Supplier ID', w: 8, cell: r => r.code },
    { h: 'Supplier', w: 15, cell: r => <strong>{r.name}</strong> },
    { h: 'Supplier type', w: 9, cell: r => dash(r.businessType) },
    { h: 'Address', w: 25, cell: addressCell },
    { h: 'Score', w: 7, cell: r => (r.overall === null ? '—' : `${r.overall}/100`) },
    { h: 'Approval', w: 8, cell: r => <strong>{r.state}</strong> },
    { h: 'Approved by', w: 9, cell: r => dash(r.approvedBy) },
    { h: 'Date of approval', w: 8, cell: r => dash(formatDMY(r.approvalDate)) },
    { h: 'Expire on', w: 8, cell: expireText },
  ],
};
const TITLE: Record<PrintMode, string> = {
  suppliers: 'Supplier Assessment Register', asl: 'Approved Supplier List (ASL)', analysis: 'Supplier Assessment Analysis', summary: 'Supplier Details Summary',
};

export default function SupplierPrintView({ mode, rows, cats, sites, selected, selectedSite, grouped, factoryName, factoryAddress, authorization, filterText }: Props) {
  const today = todayIso();
  const sum = supplierSummary(rows);
  const cols = mode === 'suppliers' || mode === 'asl' ? COLUMNS[mode] : [];
  const catHead = ['Category', 'Suppliers', 'Avg score', 'Approved', 'Conditional', 'Not approved', 'Pending', 'Expiring ≤90d', 'Expired'];
  const siteHead = ['SL', 'Site / supplier', 'In supplier list', 'Audits', 'Latest round', 'Audit date', 'Score', 'Rating', 'Critical', 'Major', 'Minor', 'Past timeline'];
  const siteW = [3, 19, 10, 6, 10, 9, 6, 12, 6, 6, 6, 8];
  const kvRow = (a: string, av: ReactNode, b: string, bv: ReactNode) => (
    <tr><th className={TH} style={{ width: '17%' }}>{a}</th><td className={TD} style={{ width: '33%', ...wrap }}>{av || '—'}</td><th className={TH} style={{ width: '17%' }}>{b}</th><td className={TD} style={{ width: '33%', ...wrap }}>{bv || '—'}</td></tr>
  );

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">{TITLE[mode]}{mode === 'summary' && selected ? ` — ${selected.name}` : ''}</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                {filterText && <div><strong>View:</strong> {filterText}</div>}
                {mode === 'asl' && <div>Approved and Conditional suppliers with a valid approval. Result: 85+ Approved · 70–84 Conditional · below 70 Not Approved.</div>}
                {mode === 'analysis' && <div>Audited sites: Compliance Audit module, audit type “External for Supplier”, latest audit per site.</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>{mode === 'asl' ? 'Effective date' : 'Date'}:</strong> {formatDMY(today)}</div>
                {(mode === 'suppliers' || mode === 'asl') && <div><strong>Suppliers:</strong> {sum.total} | <strong>Approved:</strong> {sum.approved} | <strong>Conditional:</strong> {sum.conditional}</div>}
                {mode === 'summary' && selected && <div><strong>Supplier ID:</strong> {selected.code}</div>}
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          {(mode === 'suppliers' || mode === 'asl') && (
            <table className="w-full border-collapse border border-black req-items-table" style={tableStyle}>
              <colgroup>{cols.map((c, k) => <col key={k} style={{ width: `${c.w}%` }} />)}</colgroup>
              <thead><tr>{cols.map(c => <th key={c.h} className={TH}>{c.h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={cols.length} className="border border-black px-2 py-4 text-center text-gray-600">No suppliers match the selected view</td></tr>}
                {rows.map((r, k) => (
                  <Fragment key={`${r.id}-${k}`}>
                    {mode === 'asl' && grouped && (k === 0 || rows[k - 1].category !== r.category) && (
                      <tr><td colSpan={cols.length} className="border border-black px-2 py-1 font-bold bg-gray-100 print:bg-white">{r.category || '(No category)'}</td></tr>
                    )}
                    <tr className="req-item-row">{cols.map((c, j) => <td key={j} className={`${TD}${j === 0 ? ' text-center' : ''}`} style={wrap}>{c.cell(r, k)}</td>)}</tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}

          {mode === 'analysis' && (<>
            <table className="w-full border-collapse border border-black req-items-table" style={{ ...tableStyle, marginBottom: 12 }}>
              <thead><tr>{catHead.map(h => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {cats.length === 0 && <tr><td colSpan={catHead.length} className="border border-black px-2 py-4 text-center text-gray-600">No supplier data</td></tr>}
                {cats.map(c => (
                  <tr key={c.category} className="req-item-row">
                    <td className={`${TD} font-semibold`} style={wrap}>{c.category}</td><td className={TD}>{c.suppliers}</td><td className={TD}>{dash(c.avgScore)}</td><td className={TD}>{c.approved}</td>
                    <td className={TD}>{c.conditional}</td><td className={TD}>{c.notApproved}</td><td className={TD}>{c.pending}</td><td className={TD}>{c.soon}</td><td className={TD}>{c.expired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full border-collapse border border-black req-items-table" style={tableStyle}>
              <colgroup>{siteW.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
              <thead><tr>{siteHead.map(h => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {sites.length === 0 && <tr><td colSpan={siteHead.length} className="border border-black px-2 py-4 text-center text-gray-600">No external supplier audit found</td></tr>}
                {sites.map((s, k) => (
                  <tr key={s.key} className="req-item-row">
                    <td className={`${TD} text-center`}>{k + 1}</td><td className={`${TD} font-semibold`} style={wrap}>{s.site}</td><td className={TD}>{s.supplierCode || 'No'}</td><td className={TD}>{s.audits}</td>
                    <td className={TD} style={wrap}>{dash(s.latest.round)}</td><td className={TD}>{dash(formatDMY(s.latest.auditDate))}</td><td className={`${TD} font-semibold`}>{s.latest.score}</td>
                    <td className={TD}>{s.latest.rating}</td><td className={TD}>{s.latest.critical}</td><td className={TD}>{s.latest.major}</td><td className={TD}>{s.latest.minor}</td><td className={TD}>{s.latest.pastDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>)}

          {mode === 'summary' && selected && (<>
            <h3 className="font-bold text-sm mb-1">A. Supplier information</h3>
            <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginBottom: 10 }}><tbody>
              {kvRow('Supplier', selected.name, 'Supplier ID', selected.code)}
              {kvRow('Category', selected.category, 'Supplier type', selected.businessType)}
              {kvRow('Product / service', selected.product, 'Contact person', selected.contact)}
              {kvRow('Mobile', selected.phone, 'Email', selected.email)}
              <tr><th className={TH}>Factory address</th><td className={TD} colSpan={3} style={wrap}>{dash(selected.address)}</td></tr>
              <tr><th className={TH}>Audit certification list</th><td className={TD} colSpan={3} style={{ ...wrap, whiteSpace: 'pre-wrap' }}>{dash(selected.certificationList)}</td></tr>
              <tr><th className={TH}>Brand / buyer list</th><td className={TD} colSpan={3} style={{ ...wrap, whiteSpace: 'pre-wrap' }}>{dash(selected.buyerList)}</td></tr>
            </tbody></table>

            <h3 className="font-bold text-sm mb-1">B. Assessment details</h3>
            <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginBottom: 6 }}><tbody>
              {kvRow('Assessment date', formatDMY(selected.assessmentDate), 'Method', selected.method)}
              {kvRow('Assessed by', selected.assessedBy, 'Overall compliance score', selected.overall === null ? '' : `${selected.overall} / ${MAX_TOTAL} — ${approvalLabel(selected.result)} (grade ${selected.grade})`)}
            </tbody></table>
            <table className="w-full border-collapse border border-black req-items-table" style={{ ...tableStyle, marginBottom: 10 }}>
              <thead><tr><th className={TH}>Assessment area</th><th className={TH} style={{ width: '10%' }}>Max</th><th className={TH} style={{ width: '12%' }}>Score</th><th className={TH} style={{ width: '30%' }}>Remark</th></tr></thead>
              <tbody>{AREAS.map(a => (
                <tr key={a.key} className="req-item-row"><td className={TD}>{a.label}</td><td className={TD}>{a.max}</td><td className={`${TD} font-semibold`}>{dash(selected.areas[a.key])}</td><td className={TD} style={wrap}>{dash(selected.remarks[a.key])}</td></tr>
              ))}</tbody>
            </table>

            <h3 className="font-bold text-sm mb-1">C. Approval details</h3>
            <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginBottom: 10 }}><tbody>
              {kvRow('Status', selected.state, 'Approved by', selected.approvedBy)}
              {kvRow('Date of approval', formatDMY(selected.approvalDate), 'Validity', selected.validityYears === null ? '' : `${selected.validityYears} year(s)`)}
              {kvRow('Expire on', expireText(selected), 'Days left', selected.daysLeft === null ? '' : selected.daysLeft < 0 ? `Expired ${-selected.daysLeft} day(s) ago` : `${selected.daysLeft}`)}
            </tbody></table>

            <h3 className="font-bold text-sm mb-1">External audit (Compliance Audit module)</h3>
            <table className="w-full border-collapse border border-black" style={tableStyle}><tbody>
              {selectedSite
                ? <>{kvRow('Audits on record', selectedSite.audits, 'Latest round / date', `${dash(selectedSite.latest.round)} · ${dash(formatDMY(selectedSite.latest.auditDate))}`)}
                  {kvRow('Score / rating', `${selectedSite.latest.score} — ${selectedSite.latest.rating}`, 'Critical / Major / Minor', `${selectedSite.latest.critical} / ${selectedSite.latest.major} / ${selectedSite.latest.minor}`)}</>
                : <tr><td className={TD} colSpan={4}>No external audit matches this supplier name.</td></tr>}
            </tbody></table>
          </>)}
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