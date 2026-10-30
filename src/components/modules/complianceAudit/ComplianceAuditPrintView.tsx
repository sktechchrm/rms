// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditPrintView.tsx — one audit report (A4 landscape): header line,
// Audit Details, Auditors, selected Auditing Areas (grouped), NC table with pictures.
// NO id="printable-area" here — ComplianceAuditManager wraps it.
// Path: src/components/modules/complianceAudit/ComplianceAuditPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ComplianceAuditData } from './types';
import { AUDIT_AREAS, AUDIT_ROUND_OPTIONS, formatDMY, timelineDisplay } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import { EvidenceThumb } from '../correctiveAction/EvidenceView';

interface Props { data: ComplianceAuditData; authorization: AuthorizationState; }

const CA_FONT = 11;   // report text size (px)
const th: React.CSSProperties = { border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: CA_FONT, background: '#d9ead3', textAlign: 'left' };
const td: React.CSSProperties = { border: '1px solid #000', padding: '6px 8px', fontSize: CA_FONT, verticalAlign: 'top', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.35 };
const tdLabel: React.CSSProperties = { ...td, fontWeight: 700, background: '#f8fafc', width: '20%' };
const centerTd: React.CSSProperties = { ...td, verticalAlign: 'middle', textAlign: 'center' };

export default function ComplianceAuditPrintView({ data, authorization }: Props) {
  const ncs = data.correctiveActions;
  const extra = data.auditingAreas.filter(a => !AUDIT_AREAS.some(x => x.label === a)); // areas saved by older versions

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0" style={{ fontFamily: 'Arial, sans-serif' }}>

        <div className="text-center pb-2 border-b-2 border-black">
          <h1 className="text-xl font-bold text-black uppercase tracking-wide">{data.factoryName || 'FACTORY NAME'}</h1>
          <p className="text-xs text-black">{data.factoryAddress}</p>
          <h2 className="text-lg font-bold underline decoration-2 underline-offset-2 mt-2">Compliance Audit Report — {data.auditType}</h2>
        </div>
        <div className="text-xs text-gray-700 mt-2 mb-2" style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div><strong>Audit Type:</strong> {data.auditRound} &nbsp;|&nbsp; <strong>Date of Audit:</strong> {formatDMY(data.auditDate) || '—'}</div>
          <div style={{ textAlign: 'right' }}><strong>Submission Date:</strong> {formatDMY(data.date)} &nbsp;|&nbsp; <strong>No. of NC:</strong> {ncs.length}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
          <tbody>
            <tr><td colSpan={2} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Audit Details</td></tr>
            <tr><td style={tdLabel}>Company Name</td><td style={td}>: {data.companyName || '—'}</td></tr>
            <tr><td style={tdLabel}>Site Name</td><td style={td}>: {data.siteName || '—'}</td></tr>
            <tr><td style={tdLabel}>Site Address</td><td style={td}>: {data.siteAddress || '—'}</td></tr>
            <tr><td style={tdLabel}>Site Contact &amp; Job Title</td><td style={td}>: {data.siteContactName || '—'}{data.siteContactJobTitle ? ` (${data.siteContactJobTitle})` : ''}</td></tr>
            <tr><td style={tdLabel}>Site Phone &amp; Email</td><td style={td}>: {data.sitePhone || '—'} / {data.siteEmail || '—'}</td></tr>
            <tr>
              <td style={tdLabel}>Audit Type</td>
              <td style={td}>{AUDIT_ROUND_OPTIONS.map(r => <span key={r} style={{ marginRight: 16 }}>{data.auditRound === r ? '☑' : '☐'} {r}</span>)}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Auditing Areas</td>
              <td style={td}>
                {AUDIT_AREAS.map(a => (
                  <div key={a.code} style={{ marginBottom: 3 }}>{data.auditingAreas.includes(a.label) ? '☑' : '☐'} <strong>{a.code}.</strong> {a.name}</div>
                ))}
                {extra.length > 0 && <div>{extra.map(a => `☑ ${a}`).join('   ')}</div>}
              </td>
            </tr>
            <tr>
              <td style={tdLabel}>Auditors Name &amp; Designation</td>
              <td style={td}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {data.auditors.map((a, i) => (
                    <div key={i} style={{ minWidth: 150 }}>
                      <div style={{ fontWeight: 700 }}>{a.name || '—'}</div>
                      <div>{a.designation}</div><div>{a.organization}</div>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>{[4, 7, 14, 17, 14, 17, 9, 18].map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
          <thead>
            <tr><td colSpan={8} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Corrective Action Plan — Non-Compliances</td></tr>
            <tr>
              <th style={th}>Sl</th><th style={th}>NC ID</th><th style={th}>NC Ref</th><th style={th}>Details of Non-Compliance</th>
              <th style={th}>Non-Compliance Picture</th><th style={th}>Preventive &amp; Corrective Actions</th><th style={th}>TimeLine</th>
              <th style={th}>Agreed By Management &amp; Responsible Person</th>
            </tr>
          </thead>
          <tbody>
            {ncs.map((c, i) => (
              <tr key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <td style={{ ...td, textAlign: 'center' }}>{c.slNo}</td>
                <td style={{ ...td, fontWeight: 700 }}>{c.ncId || '—'}</td>
                <td style={td}>{c.ncRef || '—'}</td>
                <td style={td}>{c.detailsOfNonCompliance || '—'}</td>
                <td style={centerTd}>
                  {c.nonCompliancePictureLink
                    ? <EvidenceThumb url={c.nonCompliancePictureLink} name={`${c.ncId || 'NC'} picture`} maxWidth={170} ratio="4 / 3" print />
                    : '—'}
                </td>
                <td style={td}>{c.preventiveCorrectiveActions || '—'}</td>
                <td style={td}>{timelineDisplay(c.timeline, data.auditDate, data.date) || '—'}</td>
                <td style={td}>{c.agreedByManagement || '—'}{c.responsiblePersonName ? ` / ${c.responsiblePersonName}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.remarks && <p style={{ fontSize: CA_FONT, marginTop: 8 }}><strong>মন্তব্য:</strong> {data.remarks}</p>}

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
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}