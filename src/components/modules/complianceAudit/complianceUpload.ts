// ─────────────────────────────────────────────────────────────────────────────
// complianceUpload.ts — deferred Drive upload for the Compliance Audit "Non-Compliance Picture", same behaviour
// as the Corrective Action evidence: "Attach file" only KEEPS the file in the browser; it goes to Drive when the
// audit is SAVED (named <NC ID>.1.<ext>, into the SAME Drive folder the Corrective Action module uses).
//
// While a file is waiting, the NC's picture field holds a placeholder token ("pending:…"). The Manager must call
// uploadPendingPictures() in its save step, BEFORE the record is written, and save the returned items.
// Path: src/components/modules/complianceAudit/complianceUpload.ts
// ─────────────────────────────────────────────────────────────────────────────

import {
  uploadEvidenceFile, deleteEvidenceFiles, checkEvidenceFolder, getChosenFolder, folderErrorText, evidenceFileName, NO_FOLDER_ATTACH,
} from '../correctiveAction/evidenceUpload';
import type { UploadConfig } from '../correctiveAction/evidenceUpload';

const PREFIX = 'pending:';
const waiting = new Map<string, File>();
let counter = 0;

export const isPendingPicture = (v: string): boolean => v.startsWith(PREFIX);
export function addPendingPicture(file: File): string {
  const token = `${PREFIX}${++counter}-${Date.now()}`;
  waiting.set(token, file);
  return token;
}
export const getPendingPicture  = (token: string): File | undefined => waiting.get(token);
export const dropPendingPicture = (token: string): void => { waiting.delete(token); };
/** True when any NC still has a file waiting for Save. */
export const hasPendingPictures = (items: { nonCompliancePictureLink: string }[]): boolean =>
  items.some(i => isPendingPicture(String(i.nonCompliancePictureLink ?? '')));

// ── Same file → never stored twice ────────────────────────────────────────────
// Before a waiting picture is uploaded, the backend (action 'findFile', Code.gs V16.24) is asked whether the chosen Drive
// folder already holds a file with the SAME NAME and the SAME CONTENT (SHA-256). If so, that file's link is reused and
// nothing is uploaded. Same name but different content is NOT a duplicate — it is uploaded as a new file.
// If the check cannot be made (old backend, no crypto) the file is simply uploaded as before.

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function findSameFile(cfg: UploadConfig, file: File): Promise<{ url: string; name: string } | null> {
  try {
    if (!cfg.url || !cfg.key || !globalThis.crypto?.subtle) return null;
    const res = await fetch(cfg.url, {
      method: 'POST', redirect: 'follow',
      body: JSON.stringify({ key: cfg.key, action: 'findFile', fileName: file.name, size: file.size, sha256: await sha256Hex(file), folderId: getChosenFolder().input }),
    });
    const j = await res.json() as { ok?: boolean; found?: boolean; url?: string; name?: string };
    return j && j.ok && j.found && j.url ? { url: j.url, name: j.name || file.name } : null;
  } catch { return null; }
}

type Item = { slNo: number; ncId: string; nonCompliancePictureLink: string; nonCompliancePictureName?: string };

export type PendingUploadResult<T> =
  | { ok: true; items: T[]; uploaded: string[] }
  | { ok: false; error: string };

/**
 * Uploads every waiting picture and returns the items with the real Drive links.
 * If anything fails, the files uploaded in this call are deleted again and nothing is changed.
 * After the record is saved, call finishPendingPictures(items) to forget the waiting files; if the save FAILS, call
 * deleteEvidenceFiles(cfg, uploaded) so no orphan file stays in Drive.
 */
export async function uploadPendingPictures<T extends Item>(cfg: UploadConfig, items: T[]): Promise<PendingUploadResult<T>> {
  if (!hasPendingPictures(items)) return { ok: true, items, uploaded: [] };

  const chosen = getChosenFolder().input;
  try { await checkEvidenceFolder(cfg, chosen); }
  catch (err) { return { ok: false, error: folderErrorText(err, chosen, NO_FOLDER_ATTACH) }; }

  const uploaded: string[] = [];
  const next: T[] = [];
  for (const item of items) {
    const link = String(item.nonCompliancePictureLink ?? '');
    if (!isPendingPicture(link)) { next.push(item); continue; }
    const file = getPendingPicture(link);
    if (!file) {
      if (uploaded.length) await deleteEvidenceFiles(cfg, uploaded);
      return { ok: false, error: `The picture of ${item.ncId || `NC ${item.slNo}`} is no longer in the browser — attach it again. Nothing was saved.` };
    }
    try {
      const renamed = new File([file], evidenceFileName(item.ncId || `NC-${item.slNo}`, 0, file.name), { type: file.type });
      const same = await findSameFile(cfg, renamed);
      if (same) {                                       // already in Drive: reuse it (NOT added to `uploaded`, so a failed save never deletes it)
        next.push({ ...item, nonCompliancePictureLink: same.url, nonCompliancePictureName: same.name });
        continue;
      }
      const up = await uploadEvidenceFile(cfg, renamed);
      uploaded.push(up.url);
      next.push({ ...item, nonCompliancePictureLink: up.url, nonCompliancePictureName: up.name });   // name = "uploaded by the app" (so ✕ may delete it from Drive)
    } catch (err) {
      if (uploaded.length) await deleteEvidenceFiles(cfg, uploaded);
      return { ok: false, error: `${file.name}: ${err instanceof Error ? err.message : 'Upload failed.'} Nothing was saved.` };
    }
  }
  return { ok: true, items: next, uploaded };
}

/** Forget the waiting files of these items (call after a successful save, or when the form is cancelled/reset). */
export function finishPendingPictures(items: { nonCompliancePictureLink: string }[]): void {
  items.forEach(i => { const v = String(i.nonCompliancePictureLink ?? ''); if (isPendingPicture(v)) waiting.delete(v); });
}