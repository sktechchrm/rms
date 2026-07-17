// PersonalInfoSheet.tsx

import React from 'react';
import { EmployeeFormData } from '../employee.types';

interface DocumentProps {
  formData: EmployeeFormData;
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const PersonalInfoSheet: React.FC<DocumentProps> = ({ formData }) => (
  <div className="nl-page-embed bg-white p-8 max-w-4xl mx-auto text-gray-900 print:p-0">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
      .nl-page-embed { font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif; }
      .nl-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 16px; }
      .nl-co-name { font-size: 20px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
      .nl-co-addr { font-size: 13px; color: #374151; margin: 0; }
      .nl-section-box { border: 1.5px solid #374151; border-radius: 5px; overflow: hidden; }
      .nl-section-head { font-weight: 700; background: #f8fafc; padding: 5px 10px; font-size: 12.5px; border-bottom: 1.5px solid #374151; color: #111827; }
    `}</style>
    <div className="nl-header">
      <h1 className="nl-co-name">{formData.companyName}</h1>
      <p className="nl-co-addr">{formData.companyAddress}</p>
      <h2 className="text-xl font-bold mt-4 underline decoration-2 underline-offset-4">PERSONAL INFORMATION SHEET</h2>
    </div>

    <div className="space-y-4">
      {/* 1. Office Identification */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">OFFICE IDENTIFICATION</h3>
        <div className="grid grid-cols-3 gap-y-2 text-sm">
          <div><strong>Employee ID:</strong> {formData.employeeId}</div>
          <div><strong>Card No:</strong> {formData.cardNo}</div>
          <div><strong>ID No:</strong> {formData.idNo}</div>
          <div><strong>Proximity No:</strong> {formData.proximityNumber}</div>
          <div><strong>Grade:</strong> {formData.grade}</div>
          <div><strong>Section/Line:</strong> {formData.sectionLine}</div>
        </div>
      </div>

      {/* 2. Personal Information */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">PERSONAL INFORMATION</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="col-span-2"><strong>Full Name (Eng):</strong> {formData.fullName}</div>
          <div className="col-span-2"><strong>Full Name (Ben):</strong> {formData.fullNameBengali}</div>
          <div><strong>Father's Name:</strong> {formData.fatherName}</div>
          <div><strong>Mother's Name:</strong> {formData.motherName}</div>
          <div><strong>Date of Birth:</strong> {formatDate(formData.dateOfBirth)}</div>
          <div><strong>Gender:</strong> {formData.gender}</div>
          <div><strong>Blood Group:</strong> {formData.bloodGroup}</div>
          <div><strong>Marital Status:</strong> {formData.maritalStatus}</div>
          <div><strong>Nationality:</strong> {formData.nationality}</div>
          <div><strong>Religion:</strong> {formData.religion}</div>
          <div><strong>National ID:</strong> {formData.nid}</div>
          <div><strong>Birth Reg. No:</strong> {formData.birthRegistrationNo}</div>
          <div><strong>Passport No:</strong> {formData.passportNumber}</div>
          <div><strong>TIN Number:</strong> {formData.tinNumber}</div>
          <div><strong>Height:</strong> {formData.height}</div>
          <div><strong>Weight:</strong> {formData.weight}</div>
          <div className="col-span-2"><strong>Identification Mark:</strong> {formData.identificationMark}</div>
        </div>
      </div>

      {/* 3. Spouse & Family */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">SPOUSE & FAMILY DETAILS</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div><strong>Spouse Name:</strong> {formData.spouseName}</div>
          <div><strong>Spouse Phone:</strong> {formData.spousePhone}</div>
          <div><strong>Profession:</strong> {formData.spouseProfession}</div>
          <div><strong>Education:</strong> {formData.spouseEducation}</div>
          <div><strong>Spouse DOB:</strong> {formatDate(formData.spouseDob)}</div>
          <div><strong>Spouse Blood:</strong> {formData.spouseBloodGroup}</div>
          <div><strong>No. of Sons:</strong> {formData.numberOfSons}</div>
          <div><strong>No. of Daughters:</strong> {formData.numberOfDaughters}</div>
        </div>
      </div>

      {/* 4. Contact Information */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">CONTACT INFORMATION</h3>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Mobile:</strong> {formData.mobile}</div>
            <div><strong>Email:</strong> {formData.email}</div>
          </div>
          <div className="border-t pt-2">
            <p className="font-semibold mb-1 italic">Present Address:</p>
            <p>{formData.presentAddress}</p>
            <p className="text-xs text-gray-600">
              Union: {formData.presentUnion}, Village: {formData.presentVillage}, P.O: {formData.presentPostOffice}, 
              Thana: {formData.presentThana}, Dist: {formData.presentDistrict}, Div: {formData.presentDivision}
            </p>
          </div>
          <div className="border-t pt-2">
            <p className="font-semibold mb-1 italic">Permanent Address:</p>
            <p>{formData.permanentAddress}</p>
            <p className="text-xs text-gray-600">
              Union: {formData.permanentUnion}, Village: {formData.permanentVillage}, P.O: {formData.permanentPostOffice}, 
              Thana: {formData.permanentThana}, Dist: {formData.permanentDistrict}, Div: {formData.permanentDivision}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Employment & Education */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">EMPLOYMENT & EDUCATION</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
          <div><strong>Designation:</strong> {formData.designation}</div>
          <div><strong>Department:</strong> {formData.department}</div>
          <div><strong>Joining Date:</strong> {formatDate(formData.joiningDate)}</div>
          <div><strong>Monthly Salary:</strong> {formData.grossSalary}</div>
          <div><strong>Fixed Salary:</strong> {formData.fixedSalary}</div>
          <div><strong>Job Source:</strong> {formData.jobSource}</div>
          <div className="col-span-2 border-t mt-1 pt-1">
            {formData.educationHistory.length > 0 ? formData.educationHistory.map((ed, i) => (
              <div key={ed.id} className={i > 0 ? 'mt-1.5 pt-1.5 border-t border-dashed' : ''}>
                <strong>Education:</strong> {ed.education} ({ed.educationGroup}) - {ed.educationBoard}
                <br />
                <strong>Institution:</strong> {ed.institution} | <strong>Passing Year:</strong> {ed.passingYear} | <strong>Result:</strong> {ed.educationResult}
              </div>
            )) : <span className="text-gray-400">—</span>}
          </div>
        </div>
      </div>

      {/* 6. Previous Experience */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">PREVIOUS EXPERIENCE</h3>
        {formData.previousJobs.length > 0 ? formData.previousJobs.map((job, i) => (
          <div key={job.id} className={`grid grid-cols-2 gap-y-2 text-sm ${i > 0 ? 'mt-2 pt-2 border-t border-dashed' : ''}`}>
            <div><strong>Company:</strong> {job.prevCompanyName}</div>
            <div><strong>চাকরির বছর:</strong> {job.prevServiceYears}</div>
            <div><strong>Designation:</strong> {job.prevDesignation}</div>
            <div><strong>Reason for Leave:</strong> {job.prevLeaveReason}</div>
            <div><strong>রেফারেন্স:</strong> {job.prevRefDetails}</div>
          </div>
        )) : <span className="text-sm text-gray-400">—</span>}
      </div>

      {/* 7. Banking & Nominee */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">BANKING & NOMINEE</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div><strong>Bank:</strong> {formData.bankName} ({formData.bankBranch})</div>
          <div><strong>A/C No:</strong> {formData.bankAccountNo}</div>
          <div className="col-span-2 border-t mt-1 pt-1">
            <strong>Nominee:</strong> {formData.nomineeName} ({formData.nomineeRelation}) - {formData.nomineePercentage}%
            <br />
            <strong>Address:</strong> {formData.nomineeAddress}
          </div>
        </div>
      </div>

      {/* 8. Emergency & Reference */}
      <div className="nl-section-box p-3">
        <h3 className="nl-section-head -m-3 mb-2">EMERGENCY & REFERENCE</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div><strong>Emergency Contact:</strong> {formData.emergencyName} ({formData.emergencyRelation})</div>
          <div><strong>Phone:</strong> {formData.emergencyMobile}</div>
          <div className="col-span-2 border-t mt-1 pt-1">
            <strong>Supervisor Ref:</strong> {formData.supervisorName} | {formData.supervisorOrg}
            <br />
            <strong>Supervisor Phone:</strong> {formData.supervisorPhone} | <strong>Relation:</strong> {formData.supervisorRelation}
          </div>
        </div>
      </div>
    </div>

    {/* Signatures */}
    <div className="flex justify-between mt-16 px-4">
      <div className="text-center">
        <div className="border-t border-black w-48"></div>
        <p className="text-xs font-bold mt-1">EMPLOYEE SIGNATURE</p>
        <p className="text-[10px]">Date: {formatDate(formData.joiningDate)}</p>
      </div>

      <div className="text-center">
        <div className="border-t border-black w-48"></div>
        <p className="text-xs font-bold mt-1">HR / MANAGER SIGNATURE</p>
        {/* <p className="text-[10px]">Date: {new Date().toLocaleDateString('en-GB')}</p> */}
        <p className="text-[10px]">Date: {formatDate(formData.joiningDate)}</p>
      </div>
    </div>
  </div>
);

export default PersonalInfoSheet;