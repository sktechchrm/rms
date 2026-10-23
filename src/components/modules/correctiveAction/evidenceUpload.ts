// ─────────────────────────────────────────────────────────────────────────────
// evidenceUpload.ts — attach evidence files (PNG, JPEG, JPG, PDF, Word, Excel).
// Path: src/components/modules/correctiveAction/evidenceUpload.ts
//
// Files go to Google Drive through the SAME Apps Script backend the database
// uses (Code.gs V16.22, actions 'uploadFile' and 'checkFolder').
//
// URL / key resolution (same as GoogleSheetsAdapter):
//   1. the active factory's db.sheetsUrl / db.sheetsKey
//   2. .env  VITE_SHEETS_URL / VITE_SHEETS_KEY
// Nothing needs to be typed into this file.
// ─────────────────────────────────────────────────────────────────────────────

export const ALLOWED_EVIDENCE_EXT = ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
export const EVIDENCE_ACCEPT = ALLOWED_EVIDENCE_EXT.map(e => `.${e}`).join(',');
export const MAX_EVIDENCE_MB = 10;

export interface UploadConfig { url: string; key: string; }

/** Anything shaped like a FactoryConfig with an optional db block. */
type FactoryLike = { db?: { sheetsUrl?: string; sheetsKey?: string } } | null | undefined;

export function resolveUploadConfig(factory?: FactoryLike): UploadConfig {
  return {
    url: String(factory?.db?.sheetsUrl || import.meta.env.VITE_SHEETS_URL || '').trim(),
    key: String(factory?.db?.sheetsKey || import.meta.env.VITE_SHEETS_KEY || '').trim(),
  };
}

export function isEvidenceUploadConfigured(cfg: UploadConfig): boolean {
  return cfg.url !== '' && cfg.key !== '';
}

// ─── The Drive folder the user chose (remembered in this browser) ────────────

const FOLDER_STORAGE_KEY = 'rms-evidence-folder';

export interface ChosenFolder {
  /** What the user pasted (a folder link or id); '' = use the backend's default folder. */
  input: string;
  /** The folder's name as reported by the backend when it was checked. */
  name: string;
}

export function getChosenFolder(): ChosenFolder {
  try {
    const raw = localStorage.getItem(FOLDER_STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<ChosenFolder>;
      return { input: String(o.input ?? ''), name: String(o.name ?? '') };
    }
  } catch { /* storage unavailable or corrupt */ }
  return { input: '', name: '' };
}

export function setChosenFolder(folder: ChosenFolder): void {
  try {
    if (folder.input) localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(folder));
    else localStorage.removeItem(FOLDER_STORAGE_KEY);
  } catch { /* the choice just won't be remembered */ }
}

// ─── Backend calls ───────────────────────────────────────────────────────────

interface ServerReply {
  ok?: boolean;
  error?: string;
  url?: string;
  name?: string;
  folderId?: string;
  folderName?: string;
  canWrite?: boolean;
}

async function callServer(cfg: UploadConfig, payload: Record<string, unknown>): Promise<ServerReply> {
  if (!isEvidenceUploadConfigured(cfg)) {
    throw new Error('File upload is not set up — the factory has no Apps Script URL / key.');
  }
  let res: Response;
  try {
    // No custom headers → "simple" request, no CORS preflight (Apps Script can't answer one).
    res = await fetch(cfg.url, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ key: cfg.key, ...payload }),
    });
  } catch {
    throw new Error('Could not reach the server — check the connection and the web-app URL.');
  }
  if (!res.ok) throw new Error(`Server error (HTTP ${res.status}).`);
  let json: ServerReply;
  try { json = await res.json(); }
  catch { throw new Error('Unexpected reply from the server (not JSON). Redeploy the web app as a New version with access "Anyone".'); }
  if (!json.ok) throw new Error(json.error || 'The server refused the request.');
  return json;
}

/** Returns an error message, or '' when the file is acceptable. */
export function validateEvidenceFile(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EVIDENCE_EXT.includes(ext)) {
    return 'File type not allowed. Use PNG, JPEG, JPG, PDF, Word or Excel.';
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

/** Checks a folder link/id the user pasted. Returns its name or throws a readable Error. */
export async function checkEvidenceFolder(cfg: UploadConfig, input: string): Promise<{ name: string }> {
  const r = await callServer(cfg, { action: 'checkFolder', folderId: input.trim() });
  if (r.canWrite === false) {
    throw new Error('The server account can only view that folder — share it with the account that owns the backend script as Editor.');
  }
  return { name: r.folderName || 'Drive folder' };
}

/** Uploads one file into the user's chosen folder and returns its link and name. */
export async function uploadEvidenceFile(cfg: UploadConfig, file: File): Promise<{ url: string; name: string }> {
  const problem = validateEvidenceFile(file);
  if (problem) throw new Error(problem);

  const data = await readAsBase64(file);
  const r = await callServer(cfg, {
    action: 'uploadFile',
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    data,
    folderId: getChosenFolder().input,
  });
  if (!r.url) throw new Error('Upload failed.');
  return { url: r.url, name: r.name || file.name };
}