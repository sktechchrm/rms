// NomineeForm.tsx — REBUILT to follow Left Worker Notice's visual/print
// CSS structure (.nl-page/.nl-wrap/...), per explicit request. Short,
// single-page declaration — uses the single-page variant (same
// page-break-avoid treatment Left Notice's own letters use).

import React from 'react';
import { EmployeeFormData } from '../employee.types';
import { nlSinglePageCss } from './notesStyle';

interface DocumentProps {
  formData: EmployeeFormData;
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const NomineeForm: React.FC<DocumentProps> = ({ formData }) => (
  <div className="nl-page">
    <div className="nl-wrap">

      {/* ══ HEADER ══════════════════════════════════════ */}
      <div className="nl-header">
        <h1 className="nl-co-name">{formData.companyName}</h1>
        <p className="nl-co-addr">{formData.companyAddress}</p>
      </div>

      {/* ══ TITLE ═══════════════════════════════════════ */}
      <div className="nl-title-bar" style={{ justifyContent: 'center' }}>
        <h2 className="nl-title">NOMINEE FORM</h2>
      </div>

      {/* ══ EMPLOYEE INFO BOX ═══════════════════════════ */}
      <div className="nl-emp-box" style={{ maxWidth: 'none' }}>
        <div className="nl-emp-col" style={{ flex: 1 }}>
          <div className="nl-emp-head">Employee Information</div>
          <table className="nl-emp-tbl"><tbody>
            <tr><td>Employee Name</td><td>{formData.fullName}</td></tr>
            <tr><td>Employee ID</td><td>{formData.employeeId}</td></tr>
            <tr><td>Designation</td><td>{formData.designation}</td></tr>
            <tr><td>Department</td><td>{formData.department}</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* ══ NOMINEE DETAILS BOX ═════════════════════════ */}
      <div className="nl-emp-box" style={{ maxWidth: 'none' }}>
        <div className="nl-emp-col" style={{ flex: 1 }}>
          <div className="nl-emp-head">Nominee Details</div>
          <table className="nl-emp-tbl"><tbody>
            <tr><td>Nominee Name</td><td>{formData.nomineeName}</td></tr>
            <tr><td>Relation with Employee</td><td>{formData.nomineeRelation}</td></tr>
            <tr><td>NID Number</td><td>{formData.nomineeNid}</td></tr>
            <tr><td>Address</td><td>{formData.nomineeAddress}</td></tr>
            <tr><td>Percentage of Share</td><td>{formData.nomineePercentage}%</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* ══ DECLARATION ═════════════════════════════════ */}
      <div className="nl-body">
        <p className="nl-para">I hereby nominate the above-mentioned person as my nominee for all benefits and claims.</p>
        <p className="nl-para">Date: {formatDate(formData.joiningDate)}</p>
      </div>

      {/* ══ SIGNATURE ═══════════════════════════════════ */}
      <div className="nl-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24 }}>
          <div>
            <div style={{ borderTop: '1.5px solid #374151', width: 180, marginBottom: 4 }} />
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>Employee Signature</p>
            <p style={{ fontSize: 12, margin: 0 }}>{formData.fullName}</p>
          </div>
          <div>
            <div style={{ borderTop: '1.5px solid #374151', width: 180, marginBottom: 4 }} />
            <p style={{ fontSize: 12, margin: '4px 0 0' }}>Nominee Signature</p>
            <p style={{ fontSize: 12, margin: 0 }}>{formData.nomineeName}</p>
          </div>
        </div>
      </div>

    </div>

    <style>{nlSinglePageCss()}</style>
  </div>
);

export default NomineeForm;
