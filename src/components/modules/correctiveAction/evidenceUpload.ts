// ─────────────────────────────────────────────────────────────────────────────
// evidenceUpload.ts — attach evidence files (PNG, JPEG, JPG, PDF, Word, Excel).
// Path: src/components/modules/correctiveAction/evidenceUpload.ts
//
// This app has no file storage of its own, so files go to Google Drive through a
// small Google Apps Script web app (DriveUpload.gs): the browser sends the file,
// the script saves it into a Drive folder and answers with the file's link, and
// only that link (plus the file name) is stored in the record.
//
// SETUP (once):
//   1. Create the Apps Script project from DriveUpload.gs, set its TOKEN and
//      FOLDER_ID, deploy it as a Web app (Execute as: Me, Who has access: Anyone).
//   2. Paste the web-app URL into EVIDENCE_UPLOAD_URL below and use the same
//      token in EVIDENCE_UPLOAD_TOKEN.
// While EVIDENCE_UPLOAD_URL is empty the "Attach file" button is disabled and the
// evidence fields just take a pasted link.
//
// The token only stops casual misuse — it is visible in the browser bundle, so
// treat uploaded files as "anyone with the link can view".
// ─────────────────────────────────────────────────────────────────────────────

export const EVIDENCE_UPLOAD_URL = '';     // ← paste the Apps Script web-app URL here
export const EVIDENCE_UPLOAD_TOKEN = '';   // ← same value as TOKEN in DriveUpload.gs

export const ALLOWED_EVIDENCE_EXT = ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
export const EVIDENCE_ACCEPT = ALLOWED_EVIDENCE_EXT.map(e => `.${e}`).join(',');
export const MAX_EVIDENCE_MB = 10;

export function isEvidenceUploadConfigured(): boolean {
  return EVIDENCE_UPLOAD_URL.trim() !== '';
}

/** Returns an error message, or '' when the file is acceptable. */
export function validateEvidenceFile(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EVIDENCE_EXT.includes(ext)) {
    return `File type not allowed. Use PNG, JPEG, JPG, PDF, Word or Excel.`;
  }
  if (file.size > MAX_EVIDENCE_MB * 1024 * 1024) {
    return `File is too large (max ${MAX_EVIDENCE_MB} MB).`;
  }
  return '';
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));   // strip "data:...;base64,"
    };
    reader.readAsDataURL(file);
  });
}

/** Uploads one file to Drive and returns its link and name. Throws an Error with a readable message. */
export async function uploadEvidenceFile(file: File): Promise<{ url: string; name: string }> {
  if (!isEvidenceUploadConfigured()) throw new Error('File upload is not set up yet — paste a link instead.');
  const problem = validateEvidenceFile(file);
  if (problem) throw new Error(problem);

  const data = await readAsBase64(file);
  let res: Response;
  try {
    // No custom headers → a "simple" request, so the browser sends no CORS preflight
    // (Apps Script web apps do not answer preflights).
    res = await fetch(EVIDENCE_UPLOAD_URL, {
      method: 'POST',
      body: JSON.stringify({
        token: EVIDENCE_UPLOAD_TOKEN, fileName: file.name, mimeType: file.type || 'application/octet-stream', data,
      }),
    });
  } catch {
    throw new Error('Upload failed — check the connection and the upload address.');
  }
  let json: { ok?: boolean; url?: string; name?: string; error?: string };
  try { json = await res.json(); } catch { throw new Error('Upload failed — unexpected reply from the upload service.'); }
  if (!json.ok || !json.url) throw new Error(json.error || 'Upload failed.');
  return { url: json.url, name: json.name || file.name };
}