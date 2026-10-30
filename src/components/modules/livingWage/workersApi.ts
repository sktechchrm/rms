// Bulk-saves workers through the Apps Script 'saveBatch' action (one request per 200 rows).
import { resolveUploadConfig } from '../correctiveAction/evidenceUpload';
import { getFactorySpreadsheetId } from '../../../factories/FactoryRegistry';

export interface WorkerInput {
  fullName: string; cardNo: string; designation: string; department: string; grossSalary: string; joiningDate: string; remarks: string;
}

export async function saveWorkersBatch(
  factory: object, factoryId: string, savedBy: string, records: WorkerInput[],
): Promise<{ ok: boolean; saved: number; error?: string }> {
  const cfg = resolveUploadConfig(factory);
  if (!cfg.url || !cfg.key) return { ok: false, saved: 0, error: 'The Apps Script URL / key is not set for this factory.' };
  const spreadsheetId = getFactorySpreadsheetId(factoryId);
  let saved = 0;
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200);
    try {
      const res = await fetch(cfg.url, {
        method: 'POST', redirect: 'follow',
        body: JSON.stringify({ key: cfg.key, action: 'saveBatch', module: 'workers', records: chunk, factoryId, spreadsheetId, savedBy }),
      });
      const j = await res.json();
      if (!j.ok) return { ok: false, saved, error: String(j.error || 'The server refused the request.') };
      saved += Number(j.saved) || chunk.length;
    } catch {
      return { ok: false, saved, error: 'Could not reach the server — check the connection.' };
    }
  }
  return { ok: true, saved };
}