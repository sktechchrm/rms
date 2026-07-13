// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditPrintView.tsx — print output matching the reference
// image's exact layout: Audit Details header block + Corrective Action
// Plan-Non-Compliances table.
// Path: src/components/modules/complianceAudit/ComplianceAuditPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ComplianceAuditData } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  data: ComplianceAuditData;
  authorization: AuthorizationState;
}

const th: React.CSSProperties = { border: '1px solid #000', padding: '6px 10px', fontWeight: 700, fontSize: 11, background: '#d9ead3', textAlign: 'left' };
const td: React.CSSProperties = { border: '1px solid #000', padding: '6px 10px', fontSize: 11, verticalAlign: 'top' };
const tdLabel: React.CSSProperties = { ...td, fontWeight: 700, background: '#f8fafc', width: '20%' };

export default function ComplianceAuditPrintView({ data, authorization }: Props) {
  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0" style={{ fontFamily: 'Arial, sans-serif' }}>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
          <tbody>
            <tr><td colSpan={4} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Audit Details</td></tr>
            <tr><td style={tdLabel}>Company Name</td><td style={td} colSpan={3}>: {data.companyName || '—'}</td></tr>
            <tr><td style={tdLabel}>Site Name</td><td style={td} colSpan={3}>: {data.siteName || '—'}</td></tr>
            <tr><td style={tdLabel}>Site Name Address</td><td style={td} colSpan={3}>: {data.siteAddress || '—'}</td></tr>
            <tr><td style={tdLabel}>Site Contact &amp; Job Title</td><td style={td} colSpan={3}>: {data.siteContactName || '—'} {data.siteContactJobTitle ? `(${data.siteContactJobTitle})` : ''}</td></tr>
            <tr><td style={tdLabel}>Site Phone &amp; Email</td><td style={td} colSpan={3}>: {data.sitePhone || '—'} / {data.siteEmail || '—'}</td></tr>
            <tr>
              <td style={tdLabel}>Audit Type</td>
              <td style={td} colSpan={3}>
                {['Initial', '1st Follow-Up', '2nd Follow-Up', '3rd Follow-Up', '4th Follow-Up'].map(r => (
                  <span key={r} style={{ marginRight: 16 }}>{data.auditRound === r ? '☑' : '☐'} {r}</span>
                ))}
              </td>
            </tr>
            <tr>
              <td style={tdLabel}>Auditing Areas</td>
              <td style={td} colSpan={3}>
                {['Labour Standard', 'Health & Safety', 'Wages & Benefits', 'Working Hours', 'Environment', 'Business Ethics', 'Training'].map(a => (
                  <span key={a} style={{ marginRight: 14 }}>{data.auditingAreas.includes(a) ? '☑' : '☐'} {a}</span>
                ))}
              </td>
            </tr>
            <tr><td style={tdLabel}>Date of Audit</td><td style={td} colSpan={3}>: {data.auditDate || '—'}</td></tr>
            <tr>
              <td style={tdLabel}>Auditors Name &amp; Designation</td>
              <td style={td} colSpan={3}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {data.auditors.map((a, i) => (
                    <div key={i} style={{ minWidth: 150 }}>
                      <div style={{ fontWeight: 700 }}>{a.name || '—'}</div>
                      <div>{a.designation}</div>
                      <div>{a.organization}</div>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td colSpan={7} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Corrective Action Plan-Non-Compliances</td></tr>
            <tr>
              <th style={th}>Sl No</th>
              <th style={th}>Non-Compliance Number</th>
              <th style={th}>Details of Non-Compliances</th>
              <th style={th}>Non Compliance Picture</th>
              <th style={th}>Preventive &amp; Corrective Actions</th>
              <th style={th}>TimeLine</th>
              <th style={th}>Agreed By Management &amp; Name of Responsible Person</th>
            </tr>
            {data.correctiveActions.map((c, i) => (
              <tr key={i}>
                <td style={td}>{c.slNo}</td>
                <td style={td}>{c.nonComplianceNumber || '—'}</td>
                <td style={td}>{c.detailsOfNonCompliance || '—'}</td>
                <td style={td}>{c.nonCompliancePictureLink ? '📎 ' + c.nonCompliancePictureLink : '—'}</td>
                <td style={td}>{c.preventiveCorrectiveActions || '—'}</td>
                <td style={td}>{c.timeline || '—'}</td>
                <td style={td}>{c.agreedByManagement || '—'}{c.responsiblePersonName ? ` / ${c.responsiblePersonName}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

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
        }
      `}</style>
    </div>
  );
}
