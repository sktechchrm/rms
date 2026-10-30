// ─────────────────────────────────────────────────────────────────────────────
// WorkersManager.tsx — the custom Workers list ('workers' sheet) used when the wage gap
// is compared against Workers. Add / edit / delete, paste 100+ rows, and a table with
// search, ▲/▼ sort and column funnels (Select all / Deselect all).
// Path: src/components/modules/livingWage/WorkersManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { parseAmount, toIsoDate, money, BLANK_VALUE } from './types';
import type { WorkerInput } from './workersApi';
import HeaderFilter from './HeaderFilter';
import InfoBall from './InfoBall';
import { font, labelStyle, inputStyle, card, cardTitle, toolBtn, th, td, mini } from './ui';

interface Props {
  records: DbRecord[];
  onAdd: (rec: Record<string, string>) => Promise<boolean>;
  onUpdate: (id: string, rec: Record<string, string>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onImport: (rows: WorkerInput[]) => Promise<{ ok: boolean; saved: number; error?: string }>;
}

type SortField = 'fullName' | 'cardNo' | 'designation' | 'department' | 'grossSalary' | '';
const COLS: { key: string; label: string; field?: SortField; filter?: boolean }[] = [
  { key: 'sl', label: 'SL' },
  { key: 'fullName', label: 'Name', field: 'fullName' },
  { key: 'cardNo', label: 'Worker ID', field: 'cardNo', filter: true },
  { key: 'designation', label: 'Designation', field: 'designation', filter: true },
  { key: 'department', label: 'Department', field: 'department', filter: true },
  { key: 'grossSalary', label: 'Gross salary', field: 'grossSalary' },
  { key: 'actions', label: '' },
];

const EMPTY = { fullName: '', cardNo: '', designation: '', department: '', grossSalary: '' };
const cell: React.CSSProperties = { ...inputStyle, padding: '6px 8px' };
const val = (r: DbRecord, k: string) => String((r as unknown as Record<string, unknown>)[k] ?? '').trim();

export default function WorkersManager({ records, onAdd, onUpdate, onDelete, onImport }: Props) {
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState<string | null>(null);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // table filters (local to this list)
  const [search, setSearch]   = useState('');
  const [columns, setColumns] = useState<Record<string, string[]>>({});
  const [sort, setSort]       = useState<{ field: SortField; dir: 'asc' | 'desc' }>({ field: '', dir: 'asc' });

  const set = (k: keyof typeof EMPTY, v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.fullName.trim() !== '' && (parseAmount(form.grossSalary) ?? 0) > 0;

  const matches = (r: DbRecord, cols: Record<string, string[]>) => {
    for (const [field, sel] of Object.entries(cols)) {
      if (sel.length && !sel.includes(val(r, field) || BLANK_VALUE)) return false;
    }
    const q = search.trim().toLowerCase();
    return !q || `${val(r, 'fullName')} ${val(r, 'cardNo')} ${val(r, 'designation')} ${val(r, 'department')}`.toLowerCase().includes(q);
  };

  const rows = useMemo(() => {
    const out = records.filter(r => matches(r, columns));
    const { field, dir } = sort;
    if (!field) return out;
    const m = dir === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      if (field === 'grossSalary') return m * ((Number(val(a, field)) || 0) - (Number(val(b, field)) || 0));
      const x = val(a, field), y = val(b, field);
      if (!x && !y) return 0;
      if (!x) return 1;                                            // blanks always last
      if (!y) return -1;
      return m * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, columns, sort, search]);

  const columnOptions = (field: string) => {
    const cols = { ...columns }; delete cols[field];
    return Array.from(new Set(records.filter(r => matches(r, cols)).map(r => val(r, field) || BLANK_VALUE))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const cycleSort = (field: SortField) => {
    if (sort.field !== field) setSort({ field, dir: 'asc' });
    else if (sort.dir === 'asc') setSort({ field, dir: 'desc' });
    else setSort({ field: '', dir: 'asc' });
  };
  const activeFilters = (search.trim() ? 1 : 0) + Object.values(columns).filter(a => a.length > 0).length;

  const submit = async () => {
    if (!valid) return;
    setBusy(true); setMsg('');
    const rec = { fullName: form.fullName.trim(), cardNo: form.cardNo.trim(), designation: form.designation.trim(), department: form.department.trim(), grossSalary: String(parseAmount(form.grossSalary)) };
    const ok = editId ? await onUpdate(editId, rec) : await onAdd(rec);
    setBusy(false);
    if (ok) { setForm(EMPTY); setEditId(null); setMsg(editId ? 'Worker updated.' : 'Worker added.'); } else setMsg('Could not save — please try again.');
  };

  const startEdit = (r: Record<string, unknown>) => {
    setEditId(String(r.id ?? ''));
    setForm({ fullName: String(r.fullName ?? ''), cardNo: String(r.cardNo ?? ''), designation: String(r.designation ?? ''), department: String(r.department ?? ''), grossSalary: String(r.grossSalary ?? '') });
    setMsg('');
  };

  const importPaste = async () => {
    const parsed = pasteText.split(/\r?\n/).map(l => l.replace(/\s+$/, '')).filter(l => l.trim()).map(l => l.split('\t'));
    const first = parsed[0];
    const body = first && (first[4] ?? '').trim() !== '' && parseAmount(first[4]) === null ? parsed.slice(1) : parsed;
    const items: WorkerInput[] = body.map(c => ({
      fullName: (c[0] ?? '').trim(), cardNo: (c[1] ?? '').trim(), designation: (c[2] ?? '').trim(), department: (c[3] ?? '').trim(),
      grossSalary: String(parseAmount(c[4]) ?? ''), joiningDate: toIsoDate(c[5] ?? ''), remarks: (c[6] ?? '').trim(),
    })).filter(w => w.fullName && (parseAmount(w.grossSalary) ?? 0) > 0);
    const skipped = body.length - items.length;
    if (!items.length) { setMsg('No valid rows (name and gross salary are required).'); return; }
    setBusy(true); setMsg(`Importing ${items.length} workers…`);
    const r = await onImport(items);
    setBusy(false);
    if (r.ok) { setPasteText(''); setPasteOpen(false); setMsg(`${r.saved} workers imported${skipped ? `, ${skipped} skipped` : ''}.`); }
    else setMsg(`Import stopped after ${r.saved} rows: ${r.error}`);
  };

  const headCell = (c: typeof COLS[number]) => {
    if (!c.field) return c.label;
    const sorted = sort.field === c.field;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}</span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          <button type="button" aria-label={`Sort ${c.label}`} onClick={() => cycleSort(c.field!)} style={mini(sorted)}>{sorted ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</button>
          {c.filter && <HeaderFilter label={c.label} selected={columns[c.field] ?? []} getOptions={() => columnOptions(c.field!)} onChange={s => setColumns(prev => ({ ...prev, [c.field!]: s }))} />}
        </span>
      </div>
    );
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={cardTitle}>Workers list</div>
        <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 10, padding: '1px 9px', fontSize: 12, fontWeight: 700, fontFamily: font }}>{records.length}</span>
        <InfoBall title="Custom workers data" width={350}>
          Use this list when you want the wage gap for a custom group (for example a section, a contractor’s workers or a sample) instead of the Employee Personal File.
          Each worker needs a name and a gross monthly salary. Data is saved in the <b>workers</b> sheet.
        </InfoBall>
        <button type="button" onClick={() => setPasteOpen(o => !o)} style={{ ...toolBtn('secondary'), marginLeft: 'auto', ...(pasteOpen ? { background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' } : {}) }}>Paste from Excel</button>
      </div>

      <div className="lw-grid" style={{ marginBottom: 10 }}>
        <div><label style={labelStyle}>Worker name *</label><input value={form.fullName} onChange={e => set('fullName', e.target.value)} style={cell} /></div>
        <div><label style={labelStyle}>Worker ID / card no</label><input value={form.cardNo} onChange={e => set('cardNo', e.target.value)} style={cell} /></div>
        <div><label style={labelStyle}>Designation</label><input value={form.designation} onChange={e => set('designation', e.target.value)} style={cell} /></div>
        <div><label style={labelStyle}>Department</label><input value={form.department} onChange={e => set('department', e.target.value)} style={cell} /></div>
        <div><label style={labelStyle}>Gross salary (Tk) *</label><input type="number" min="0" value={form.grossSalary} onChange={e => set('grossSalary', e.target.value)} style={cell} /></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: '100%' }}>
          <button type="button" onClick={() => void submit()} disabled={!valid || busy} style={{ ...toolBtn('primary'), opacity: valid && !busy ? 1 : 0.5 }}>{editId ? 'Update worker' : '+ Add worker'}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(EMPTY); }} style={toolBtn('secondary')}>Cancel</button>}
        </div>
      </div>

      {pasteOpen && (
        <div style={{ border: '1px solid #bfdbfe', borderRadius: 10, padding: 12, marginBottom: 10, background: '#f8fbff' }}>
          <div style={{ fontSize: 12.5, fontFamily: font, color: '#334155', marginBottom: 8, lineHeight: 1.55 }}>
            Paste rows from Excel. Column order: <b>Name · Worker ID · Designation · Department · Gross salary · Joining date · Remarks</b>. A header row is skipped.
          </div>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={() => void importPaste()} disabled={!pasteText.trim() || busy} style={{ ...toolBtn('primary'), opacity: pasteText.trim() && !busy ? 1 : 0.5 }}>{busy ? 'Importing…' : 'Import rows'}</button>
          </div>
        </div>
      )}
      {msg && <div style={{ fontSize: 12.5, fontFamily: font, fontWeight: 600, color: /could not|stopped|no valid/i.test(msg) ? '#b91c1c' : '#166534', marginBottom: 8 }}>{msg}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / ID / designation / department" style={{ ...inputStyle, height: 32, maxWidth: 320, flex: '1 1 220px', background: search.trim() ? '#eff6ff' : '#fff', borderColor: search.trim() ? '#93c5fd' : '#cbd5e1' }} />
        {activeFilters > 0 && <button type="button" onClick={() => { setSearch(''); setColumns({}); }} style={toolBtn('secondary')}>Clear Filters ({activeFilters})</button>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{rows.length} of {records.length} workers</span>
      </div>

      <div style={{ overflow: 'auto', maxHeight: 320, border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 700 }}>
          <thead><tr>{COLS.map(c => <th key={c.key} style={{ ...th, position: 'sticky', top: 0, zIndex: 2 }}>{headCell(c)}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 22 }}>{records.length ? 'No workers match the filters.' : 'No workers yet — add one above or paste from Excel.'}</td></tr>}
            {rows.map((rc, k) => {
              const r = rc as unknown as Record<string, unknown>;
              const id = String(r.id ?? '');
              return (
                <tr key={id} style={{ background: id === editId ? '#fffbeb' : k % 2 ? '#fafbfc' : '#fff' }}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{k + 1}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{String(r.fullName ?? '') || '—'}</td>
                  <td style={td}>{String(r.cardNo ?? '') || '—'}</td>
                  <td style={td}>{String(r.designation ?? '') || '—'}</td>
                  <td style={td}>{String(r.department ?? '') || '—'}</td>
                  <td style={td}>{money(Number(r.grossSalary) || 0)}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    {confirmId === id ? (
                      <span style={{ fontSize: 11 }}>Sure?{' '}
                        <button type="button" onClick={() => { void onDelete(id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>{' '}
                        <button type="button" onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
                      </span>
                    ) : (
                      <>
                        <button type="button" title="Edit" onClick={() => startEdit(r)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>✎</button>
                        <button type="button" title="Delete" onClick={() => setConfirmId(id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>🗑</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}