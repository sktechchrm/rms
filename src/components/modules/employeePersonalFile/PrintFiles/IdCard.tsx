// IdCard.tsx — REBUILT to use Left Worker Notice's visual language
// (Bengali font, colour scheme, border style), per explicit request —
// but NOT stretched to A4 like the letter-format print views. An ID
// card is a physically small, wallet-sized format; forcing it into the
// full .nl-page/.nl-wrap A4-letter structure would produce a broken
// layout. Instead: the SAME font/colours/border language is applied to
// the card's own natural compact size, printed centered on an A4 sheet
// (matching how ID cards are conventionally printed — a small card
// positioned on a full page for cutting out, not stretched to fill it).

import React from 'react';
import { FaUser } from 'react-icons/fa';
import { EmployeeFormData } from '../employee.types';

interface DocumentProps {
  formData: EmployeeFormData;
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const IdCard: React.FC<DocumentProps> = ({ formData }) => (
  <div className="nl-idcard-page">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
      .nl-idcard-page, .nl-idcard-page * { font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif; box-sizing: border-box; }
      .nl-idcard-page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 40mm 20mm; display: flex; justify-content: center; }
      .nl-idcard { width: 340px; border: 2.5px solid #1d4ed8; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
      .nl-idcard-header { background: #1e3a5f; padding: 18px; text-align: center; color: #fff; }
      .nl-idcard-co-name { font-size: 16px; font-weight: 700; margin: 0 0 2px; letter-spacing: 0.5px; text-transform: uppercase; }
      .nl-idcard-subtitle { font-size: 10px; margin: 0; opacity: 0.85; }
      @media print {
        body * { visibility: hidden !important; }
        .nl-idcard-page, .nl-idcard-page * { visibility: visible !important; }
        .nl-idcard-page { position: absolute !important; left: 0 !important; top: 0 !important; box-shadow: none !important; }
        @page { size: A4 portrait; margin: 0; }
        html, body { background: #fff !important; color: #000 !important; }
      }
    `}</style>

    <div className="nl-idcard">
      <div className="nl-idcard-header">
        <h2 className="nl-idcard-co-name">{formData.companyName}</h2>
        <p className="nl-idcard-subtitle">EMPLOYEE IDENTITY CARD</p>
      </div>

      <div style={{ background: '#fff', padding: 16, color: '#1f2937' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 88, height: 88, background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FaUser size={44} color="#94a3b8" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{formData.fullName}</p>
            <p style={{ fontSize: 12.5, margin: '2px 0' }}><strong>ID:</strong> {formData.employeeId}</p>
            <p style={{ fontSize: 12.5, margin: '2px 0' }}><strong>Designation:</strong> {formData.designation}</p>
            <p style={{ fontSize: 12.5, margin: '2px 0' }}><strong>Department:</strong> {formData.department}</p>
            <p style={{ fontSize: 12.5, margin: '2px 0' }}><strong>Blood Group:</strong> {formData.bloodGroup}</p>
          </div>
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 11, margin: 0 }}><strong>Issue Date:</strong> {formatDate(formData.joiningDate)}</p>
          <div style={{ marginTop: 12, borderTop: '1px solid #94a3b8', width: 130 }}>
            <p style={{ fontSize: 11, marginTop: 4 }}>Authorized Signature</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 16, borderTop: '3px solid #1d4ed8' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 10, textAlign: 'center', fontSize: 13, color: '#1e3a5f' }}>Emergency Contact</h3>
        <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}><strong>Name:</strong> {formData.emergencyName}</p>
          <p style={{ margin: 0 }}><strong>Relation:</strong> {formData.emergencyRelation}</p>
          <p style={{ margin: 0 }}><strong>Mobile:</strong> {formData.emergencyMobile}</p>
        </div>

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 11, margin: 0 }}><strong>Address:</strong> {formData.companyAddress}</p>
          <p style={{ fontSize: 11, marginTop: 6 }}><strong>Contact:</strong> {formData.mobile}</p>
        </div>

        <p style={{ fontSize: 10.5, textAlign: 'center', marginTop: 14, color: '#6b7280' }}>
          If found, please return to the above address
        </p>
      </div>
    </div>
  </div>
);

export default IdCard;
