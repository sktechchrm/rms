// ─────────────────────────────────────────────────────────────────────────────
// evidenceUpload.ts — attach evidence files (PNG, JPEG, JPG, PDF, Word, Excel).
// Path: src/components/modules/correctiveAction/evidenceUpload.ts
//
// Files go to Google Drive through YOUR existing RMS Apps Script backend
// (Code.gs V16.22, actions 'uploadFile' and 'checkFolder'). The URL and key are
// taken from the ACTIVE FACTORY (factory.db.sheetsUrl / factory.db.sheetsKey), with
// .env (VITE_SHEETS_URL / VITE_SHEETS_KEY) as a fallback — the same source the
// database adapter uses, so nothing needs typing in here.
//
// THE FOLDER IS THE USER'S CHOICE: the person using the form pastes a Google Drive
// folder link (or id); it is checked with the backend, remembered in this browser
// (localStorage) and sent with every upload. If no folder is chosen, the backend
// uses the default in its EVIDENCE_FOLDER_ID Script Property — and answers
// "No Drive folder chosen…" when there is none. The Google account that owns the
// backend script needs Edit access to the chosen folder.
//
// Server errors are passed through friendlyServerError(), which rewrites Google's
// long permission messages into short, actionable ones.
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadConfig {
  /** Apps Script web-app URL (…/exec). */
  url: string;
  /** The backend's SECRET_KEY. */
  key: string;
}

/** Reads the upload address from the active factory, falling back to the .env values. */
export function resolveUploadConfig(factory: object | null | undefined): UploadConfig {
  const db  = (factory as { db?: { sheetsUrl?: string; sheetsKey?: string } } | null | undefined)?.db;
  const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) ?? {};
  return {
    url: String(db?.sheetsUrl || env.VITE_SHEETS_URL || '').trim(),
    key: String(db?.sheetsKey || env.VITE_SHEETS_KEY || '').trim(),
  };
}

export function isEvidenceUploadConfigured(cfg: UploadConfig): boolean {
  return cfg.url !== '' && cfg.key !== '';
}

export const ALLOWED_EVIDENCE_EXT = ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
export const EVIDENCE_ACCEPT = ALLOWED_EVIDENCE_EXT.map(e => `.${e}`).join(',');
export const MAX_EVIDENCE_MB = 10;

/** Give up on a request after this long (large files on slow links take a while). */
const REQUEST_TIMEOUT_MS = 120_000;

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
  } catch { /* storage unavailable or corrupt — fall through */ }
  return { input: '', name: '' };
}

export function setChosenFolder(folder: ChosenFolder): void {
  try {
    if (folder.input) localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(folder));
    else localStorage.removeItem(FOLDER_STORAGE_KEY);
  } catch { /* storage unavailable — the choice just won't be remembered */ }
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

/** Turns Google's long Apps Script error text into a short message that says what to do. */
/** Turns Google's long Apps Script error text into a short message that says what to do. */
function friendlyServerError(message: string): string {
  const m = message || '';
  if (/permission to call (DriveApp|Drive\.|Session\.)/i.test(m) || /Required permissions/i.test(m) || /not sufficient to call/i.test(m)) {
    return 'The backend script is not allowed to use Google Drive yet. In the Apps Script editor run authorizeDriveDelete() once, click Allow, then Deploy → Manage deployments → Edit → New version → Deploy.';
  }
  if (/Cannot open (that )?(Drive )?folder/i.test(m)) {
    return `${m} Share the folder with the Google account that owns the backend script as Editor.`;
  }
  if (/Unauthorized/i.test(m)) {
    return 'The server rejected the key. Check that the factory\u2019s sheetsKey matches SECRET_KEY in the backend.';
  }
  return m || 'The server refused the request.';
}

async function callServer(cfg: UploadConfig, payload: Record<string, unknown>): Promise<ServerReply> {
  if (!isEvidenceUploadConfigured(cfg)) throw new Error('File upload is not set up — paste a link instead.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    // No custom headers → a "simple" request, so the browser sends no CORS preflight
    // (Apps Script web apps do not answer preflights). Same style as the database calls.
    res = await fetch(cfg.url, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ key: cfg.key, ...payload }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('The server took too long to answer. Try again, or use a smaller file.');
    }
    throw new Error('Could not reach the server — check the connection and the server address.');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`Server error (HTTP ${res.status}).`);

  let json: ServerReply;
  try {
    json = await res.json();
  } catch {
    throw new Error('Unexpected reply from the server (not JSON). Redeploy the web app as a New version with access set to "Anyone".');
  }
  if (!json.ok) throw new Error(friendlyServerError(json.error ?? ''));
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

/**
 * Checks a folder link/id the user pasted — or, with '' (empty), the server's
 * default folder. Returns the folder's name; throws an Error with a readable
 * message if it can't be opened or the server account can only view it.
 */
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

/** Deletes uploaded evidence files from Drive (given their Drive links). Never throws. */
export async function deleteEvidenceFiles(cfg: UploadConfig, urls: string[]): Promise<{ ok: boolean; error?: string }> {
  const ids = urls
    .map(u => (/\/d\/([a-zA-Z0-9_-]+)/.exec(u) || /[?&]id=([a-zA-Z0-9_-]+)/.exec(u))?.[1] ?? '')
    .filter(Boolean);
  if (ids.length === 0) return { ok: true };
  try {
    await callServer(cfg, { action: 'deleteFile', fileIds: ids });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not delete the file.' };
  }
}

// ─── Helpers shared by the CAP form and manager ──────────────────────────────

export const NO_FOLDER_ATTACH =
  'Choose a Drive folder first: click the (i) in the Attach box, paste a folder link and click Use folder.';

export function folderErrorText(err: unknown, chosenInput: string, whenMissing: string): string {
  const raw = err instanceof Error ? err.message : 'Could not check the Drive folder.';
  return !chosenInput && /no drive folder/i.test(raw) ? whenMissing : raw;
}

/** "NC-012" + slot 0 + "photo.JPG" → "NC-012.1.jpg" (characters Drive can't use become "_"). */
export function evidenceFileName(ncId: string, slotIndex: number, original: string): string {
  const ext  = original.includes('.') ? original.split('.').pop()!.toLowerCase() : '';
  const base = ncId.trim().replace(/[\\/:*?"<>|]+/g, '_');
  return `${base}.${slotIndex + 1}${ext ? `.${ext}` : ''}`;
}