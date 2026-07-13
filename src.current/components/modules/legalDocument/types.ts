// ─────────────────────────────────────────────────────────────────────────────
// Legal Document/License/Certificate/Agreement Record — types
// Path: src/components/modules/legalDocument/types.ts
//
// REDESIGN (2nd round, explicit field spec): one record = one document
// (fixed form, matches Left Employee Notice's save model). Column spec:
//   Document ID, Document Title, Category, Document No., Issuing
//   Authority, Issue Date, Expiry Date, Status (auto), Attachment, Actions
//
// "Attachment" — this app has no file-upload/storage infrastructure (every
// module stores plain text/JSON in Google Sheets), so this is a TEXT/URL
// field (e.g. a Google Drive link to the scanned document), not a real
// file upload. Documented clearly rather than silently faking upload UI.
//
// "Status" reuses the shared expiryStatus.ts helper — same logic as
// Audit/Visit/Certification Validity Record's Status column, not a
// separate copy.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_OPTIONS = ['License', 'Certificate', 'Agreement', 'Permit', 'Registration', 'Other'];

export interface LegalDocumentData {
  documentTitle: string;
  category: string;
  documentNo: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  /** Text/URL link to the scanned document — see file header note. Not a
     real file upload; this app has no file-storage backend. */
  attachment: string;
  factoryName: string;
  factoryAddress: string;
}

export interface LegalDocumentFormProps {
  data: LegalDocumentData;
  setData: (data: LegalDocumentData) => void;
}

export const INITIAL_LEGAL_DOCUMENT_STATE: LegalDocumentData = {
  documentTitle: '',
  category: 'License',
  documentNo: '',
  issuingAuthority: '',
  issueDate: '',
  expiryDate: '',
  attachment: '',
  factoryName: '',
  factoryAddress: '',
};
