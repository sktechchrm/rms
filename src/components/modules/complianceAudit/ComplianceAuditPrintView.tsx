// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditPrintView.tsx — one audit report (A4 landscape): header line,
// Audit Details, Auditors, selected Auditing Areas (grouped), NC table with pictures.
// NO id="printable-area" here — ComplianceAuditManager wraps it.
// Path: src/components/modules/complianceAudit/ComplianceAuditPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment } from 'react';
import type { ComplianceAuditData } from './types';
import { AUDIT_AREAS, AUDIT_ROUND_OPTIONS, findPointByRef, SEVERITY_DEDUCTION, computeAuditScore, fixPhone, formatDMY, timelineDisplay } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import { EvidenceThumb } from '../correctiveAction/EvidenceView';

interface Props { data: ComplianceAuditData; authorization: AuthorizationState; }

const CA_FONT = 11;   // report text size (px)
const th: React.CSSProperties = { border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: CA_FONT, background: '#d9ead3', textAlign: 'left' };
const td: React.CSSProperties = { border: '1px solid #000', padding: '6px 8px', fontSize: CA_FONT, verticalAlign: 'top', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.35 };
const tdLabel: React.CSSProperties = { ...td, fontWeight: 700, background: '#f8fafc', width: '34%' };
const centerTd: React.CSSProperties = { ...td, verticalAlign: 'middle', textAlign: 'center' };

export default function ComplianceAuditPrintView({ data, authorization }: Props) {
  const ncs = data.correctiveActions;
  const audit = computeAuditScore(ncs);
  // NCs grouped under the audit area of their NC Ref (A, B, … F); own-text NCs go last (titled "Other" only when areas are shown too).
  // ISA (area F) is further split by its three Parts (shown without the "Part n –" prefix); NCs are ordered by checklist point.
  const subsOf = (code: string, rows: typeof ncs): { sub: string; rows: typeof ncs }[] => {
    if (code !== 'F') return [{ sub: '', rows }];
    const sorted = [...rows].sort((a, b) => (findPointByRef(a.ncRef)?.sl ?? 0) - (findPointByRef(b.ncRef)?.sl ?? 0));
    const out: { sub: string; rows: typeof ncs }[] = [];
    sorted.forEach(c => {
      const sub = (findPointByRef(c.ncRef)?.group ?? '').replace(/^Part\s*\d+\s*[–-]\s*/, '');
      const last = out[out.length - 1];
      if (last && last.sub === sub) last.rows.push(c); else out.push({ sub, rows: [c] });
    });
    return out;
  };
  const groups = [
    ...AUDIT_AREAS.map(a => ({ title: a.label as string, subs: subsOf(a.code, ncs.filter(c => findPointByRef(c.ncRef)?.area === a.code)) })),
    { title: 'Other', subs: [{ sub: '', rows: ncs.filter(c => !findPointByRef(c.ncRef)) }] },
  ].filter(g => g.subs.some(s => s.rows.length));
  const showTitles = groups.length > 0 && !(groups.length === 1 && groups[0].title === 'Other');
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

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6, breakInside: 'avoid' }}>
          <tbody>
            <tr><td colSpan={6} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Audit Score &amp; Non-Compliance Summary</td></tr>
            <tr>
              <td style={{ ...centerTd, fontWeight: 700, fontSize: 15 }}>Score: {audit.score} / 100</td>
              <td style={{ ...centerTd, fontWeight: 700 }}>Rating: {audit.rating}</td>
              <td style={centerTd}>Critical: <strong>{audit.critical}</strong></td>
              <td style={centerTd}>Major: <strong>{audit.major}</strong></td>
              <td style={centerTd}>Minor: <strong>{audit.minor}</strong></td>
              <td style={centerTd}>Total NC: <strong>{audit.total}</strong></td>
            </tr>
            <tr><td colSpan={6} style={{ ...td, fontSize: 9.5, color: '#444' }}>
              Score = 100 − (Critical × {SEVERITY_DEDUCTION.Critical} + Major × {SEVERITY_DEDUCTION.Major} + Minor × {SEVERITY_DEDUCTION.Minor}). Rating: 90+ Good · 75–89 Satisfactory · 60–74 Needs Improvement · below 60 High Risk (any Critical NC caps the rating at Needs Improvement).
            </td></tr>
          </tbody>
        </table>

        {/* Audit Details: two blocks side by side — Site Information | Audit Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, marginBottom: 6, alignItems: 'stretch' }}>
          <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', breakInside: 'avoid' }}>
            <tbody>
              <tr><td colSpan={2} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Site Information</td></tr>
              <tr><td style={tdLabel}>Company Name</td><td style={td}>{data.companyName || '—'}</td></tr>
              <tr><td style={tdLabel}>Site Name</td><td style={td}>{data.siteName || '—'}</td></tr>
              <tr><td style={tdLabel}>Site Address</td><td style={td}>{data.siteAddress || '—'}</td></tr>
              <tr><td style={tdLabel}>Site Contact &amp; Job Title</td><td style={td}>{data.siteContactName || '—'}{data.siteContactJobTitle ? ` (${data.siteContactJobTitle})` : ''}</td></tr>
              <tr><td style={tdLabel}>Site Phone</td><td style={td}>{fixPhone(data.sitePhone) || '—'}</td></tr>
              <tr><td style={tdLabel}>Site Email</td><td style={td}>{data.siteEmail || '—'}</td></tr>
            </tbody>
          </table>
          <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', breakInside: 'avoid' }}>
            <tbody>
              <tr><td colSpan={2} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Audit Information</td></tr>
              <tr><td style={tdLabel}>Date of Audit</td><td style={td}>{formatDMY(data.auditDate) || '—'}</td></tr>
              <tr>
                <td style={tdLabel}>Audit Type</td>
                <td style={td}>{AUDIT_ROUND_OPTIONS.map(r => <span key={r} style={{ marginRight: 12, whiteSpace: 'nowrap' }}>{data.auditRound === r ? '☑' : '☐'} {r}</span>)}</td>
              </tr>
              <tr>
                <td style={tdLabel}>Auditing Areas</td>
                <td style={td}>
                  {AUDIT_AREAS.filter(a => data.auditingAreas.includes(a.label)).map(a => (
                    <div key={a.code} style={{ marginBottom: 3 }}>☑ <strong>{a.code}.</strong> {a.name}</div>
                  ))}
                  {extra.map(a => <div key={a} style={{ marginBottom: 3 }}>☑ {a}</div>)}
                  {data.auditingAreas.length === 0 && '—'}
                </td>
              </tr>
              <tr>
                <td style={tdLabel}>Auditors Name &amp; Designation</td>
                <td style={td}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {data.auditors.map((a, i) => (
                      <div key={i} style={{ minWidth: 120 }}>
                        <div style={{ fontWeight: 700 }}>{a.name || '—'}</div>
                        <div>{a.designation}</div><div>{a.organization}</div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>{[3, 7, 6, 11, 15, 13, 14, 9, 12, 10].map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
          <thead>
            <tr><td colSpan={10} style={{ ...th, textAlign: 'center', fontSize: 13 }}>Corrective Action Plan — Non-Compliances</td></tr>
            <tr>
              <th style={th}>Sl</th><th style={th}>NC ID</th><th style={th}>Severity</th><th style={th}>NC Ref</th><th style={th}>Details of Non-Compliance</th>
              <th style={th}>Non-Compliance Picture</th><th style={th}>Recommendation</th><th style={th}>TimeLine</th>
              <th style={th}>Responsible Person</th><th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <Fragment key={g.title}>
                {showTitles && (
                  <tr style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <td colSpan={10} style={{ ...td, fontWeight: 700, background: '#f1f5f9', fontSize: 12 }}>{g.title}</td>
                  </tr>
                )}
              {g.subs.map(s => (
                <Fragment key={s.sub}>
                  {s.sub && (
                    <tr style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <td colSpan={10} style={{ ...td, fontWeight: 700, background: '#f8fafc', fontStyle: 'italic', paddingLeft: 16 }}>{s.sub}</td>
                    </tr>
                  )}
                  {s.rows.map((c, i) => (
                    <tr key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <td style={{ ...td, textAlign: 'center' }}>{c.slNo}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{c.ncId || '—'}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{c.severity || (c.ncRef || c.detailsOfNonCompliance ? 'Minor' : '—')}</td>
                      <td style={td}>{c.ncRef || '—'}</td>
                      <td style={td}>{c.detailsOfNonCompliance || '—'}</td>
                      <td style={centerTd}>
                        {c.nonCompliancePictureLink
                          ? <EvidenceThumb url={c.nonCompliancePictureLink} name={`${c.ncId || 'NC'} picture`} maxWidth={170} ratio="4 / 3" print />
                          : '—'}
                      </td>
                      <td style={td}>{c.preventiveCorrectiveActions || '—'}</td>
                      <td style={td}>{timelineDisplay(c.timeline, data.auditDate, data.date) || '—'}</td>
                      <td style={td}>{c.agreedByManagement || ''}{c.responsiblePersonName ? `  ${'(' + c.responsiblePersonName + ')'}` : ''}</td>
                      <td style={td}>
                        <div style={{ fontWeight: 700 }}>{c.ncStatus ?? 'Open'}</div>
                        {c.ncStatus === 'Closed' && c.ncStatusDate && <div>{formatDMY(c.ncStatusDate)}</div>}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              </Fragment>
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