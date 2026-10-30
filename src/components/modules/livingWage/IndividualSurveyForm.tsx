// ─────────────────────────────────────────────────────────────────────────────
// IndividualSurveyForm.tsx — worker survey (9 Anker cost components incl. Utilities).
// Search, "issues only", paste from Excel, print blank form, data-quality flags.
// Path: src/components/modules/livingWage/IndividualSurveyForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { blankSurveyEntry, deriveFromSurveys, duplicateCounts, surveyIssues, toIsoDate, parseAmount, fmt, statisticLabel } from './types';
import type { IndividualSurveyEntry, SurveyStatistic } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import InfoBall from './InfoBall';
import { font, inputStyle, card, cardTitle, toolBtn, th, td } from './ui';

type NumKey = 'actualFamilySize' | 'actualEarnersInFamily' | 'reportedFoodExpense' | 'reportedHousingExpense' | 'reportedUtilitiesExpense'
  | 'reportedHealthcareExpense' | 'reportedEducationExpense' | 'reportedTransportExpense' | 'reportedClothingExpense'
  | 'reportedCommunicationExpense' | 'reportedOtherExpense';

const NUM_COLS: { key: NumKey; label: string; w: number }[] = [
  { key: 'actualFamilySize',             label: 'Family size',   w: 78 },
  { key: 'actualEarnersInFamily',        label: 'FTE earners',   w: 78 },
  { key: 'reportedFoodExpense',          label: 'Food',          w: 88 },
  { key: 'reportedHousingExpense',       label: 'Housing',       w: 88 },
  { key: 'reportedUtilitiesExpense',     label: 'Utilities',     w: 88 },
  { key: 'reportedHealthcareExpense',    label: 'Healthcare',    w: 88 },
  { key: 'reportedEducationExpense',     label: 'Education',     w: 88 },
  { key: 'reportedTransportExpense',     label: 'Transport',     w: 88 },
  { key: 'reportedClothingExpense',      label: 'Clothing',      w: 88 },
  { key: 'reportedCommunicationExpense', label: 'Communication', w: 100 },
  { key: 'reportedOtherExpense',         label: 'Other',         w: 88 },
];

const cell: React.CSSProperties = { ...inputStyle, padding: '5px 7px', fontSize: 12 };
const stickyTh = (w: number): React.CSSProperties => ({ ...th, position: 'sticky', top: 0, zIndex: 2, width: w });

const Icon = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONS = {
  plus: 'M12 5v14M5 12h14',
  print: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z',
  paste: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h6',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  search: 'M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
};

interface Props {
  surveys: IndividualSurveyEntry[];
  setSurveys: (s: IndividualSurveyEntry[]) => void;
  statistic: SurveyStatistic;
  normalize: boolean;
  onPrintForm: () => void;
}

export default function IndividualSurveyForm({ surveys, setSurveys, statistic, normalize, onPrintForm }: Props) {
  const [query, setQuery]           = useState('');
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [pasteOpen, setPasteOpen]   = useState(false);
  const [pasteText, setPasteText]   = useState('');
  const [pasteMsg, setPasteMsg]     = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const dups    = useMemo(() => duplicateCounts(surveys), [surveys]);
  const derived = useMemo(() => deriveFromSurveys(surveys, statistic, normalize), [surveys, statistic, normalize]);
  const rows    = useMemo(() => surveys.map((s, i) => ({ s, i, issues: surveyIssues(s, dups.get(s.workerId.trim()) ?? 0) })), [surveys, dups]);
  const issueCount = rows.filter(r => r.issues.length).length;
  const q = query.trim().toLowerCase();
  const shown = rows.filter(r => (!issuesOnly || r.issues.length) && (!q || `${r.s.workerName} ${r.s.workerId} ${r.s.surveyorName}`.toLowerCase().includes(q)));

  const renumber = (l: IndividualSurveyEntry[]) => l.map((s, k) => ({ ...s, slNo: k + 1 }));
  const edit = (i: number, f: keyof IndividualSurveyEntry, v: string) => setSurveys(surveys.map((s, k) => (k === i ? { ...s, [f]: v } : s)));
  const add = () => setSurveys([...surveys, blankSurveyEntry(surveys.length + 1)]);
  const remove = (i: number) => setSurveys(renumber(surveys.filter((_, k) => k !== i)));

  const importPaste = () => {
    const rowsIn = pasteText.split(/\r?\n/).map(l => l.replace(/\s+$/, '')).filter(l => l.trim()).map(l => l.split('\t'));
    if (!rowsIn.length) { setPasteMsg('Nothing to import.'); return; }
    const first = rowsIn[0];
    const hasHeader = (first[3] ?? '').trim() !== '' && parseAmount(first[3]) === null;
    const body = hasHeader ? rowsIn.slice(1) : rowsIn;
    const c2 = (v?: string) => (v ?? '').replace(/,/g, '').trim();
    const added = body.map((c, k): IndividualSurveyEntry => ({
      ...blankSurveyEntry(surveys.length + k + 1),
      workerName: (c[0] ?? '').trim(), workerId: (c[1] ?? '').trim(), surveyDate: toIsoDate(c[2] ?? ''),
      actualFamilySize: c2(c[3]), actualEarnersInFamily: c2(c[4]),
      reportedFoodExpense: c2(c[5]), reportedHousingExpense: c2(c[6]), reportedUtilitiesExpense: c2(c[7]),
      reportedHealthcareExpense: c2(c[8]), reportedEducationExpense: c2(c[9]), reportedTransportExpense: c2(c[10]),
      reportedClothingExpense: c2(c[11]), reportedCommunicationExpense: c2(c[12]), reportedOtherExpense: c2(c[13]),
      surveyorName: (c[14] ?? '').trim(),
    }));
    setSurveys([...surveys, ...added]);
    setPasteMsg(`${added.length} entries added.`);
    setPasteText('');
  };

  const sampleTone = derived.n >= 30 ? { bg: '#dcfce7', fg: '#166534', t: `n = ${derived.n} · good sample` } : { bg: '#fef3c7', fg: '#92400e', t: `n = ${derived.n} · small sample (aim for 30+)` };
  const metric = (label: string, value: string) => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#1e3a5f', fontFamily: font }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {metric('Valid entries', `${derived.n} / ${derived.total}`)}
        {metric('Avg. family size', derived.n ? fmt(derived.familySize) : '—')}
        {metric('Avg. FTE earners', derived.workersN ? fmt(derived.workers) : '—')}
        {metric('Avg. food (household)', derived.n ? fmt(derived.costs.food.raw) : '—')}
        {metric('Avg. housing + utilities', derived.n ? fmt(derived.costs.housing.raw + derived.costs.utilities.raw) : '—')}
        {metric('Entries with issues', String(issueCount))}
      </div>
      <div style={{ marginBottom: 10 }}>
        <span style={{ background: sampleTone.bg, color: sampleTone.fg, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, fontFamily: font }}>{sampleTone.t}</span>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={cardTitle}>Individual Worker Surveys</div>
          <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 10, padding: '1px 9px', fontSize: 12, fontWeight: 700, fontFamily: font }}>{surveys.length}</span>
          <InfoBall title="About the survey" width={360}>
            Anker requires local participation: real interviews with workers about their family and spending. Costs are monthly, per household (Tk).
            Utilities means electricity, water and gas. The calculation step fills itself from these entries using the {statisticLabel(statistic).toLowerCase()}
            {normalize ? ', with per-person costs scaled to the family size' : ''}. Use “Print survey form” to collect the data on paper first.
          </InfoBall>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'inline-flex', pointerEvents: 'none' }}><Icon d={ICONS.search} /></span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name / ID / surveyor" style={{ ...inputStyle, height: 32, paddingLeft: 30 }} />
          </div>
          <button type="button" aria-pressed={issuesOnly} onClick={() => setIssuesOnly(o => !o)}
            style={{ height: 32, padding: '0 12px', borderRadius: 16, fontSize: 12.5, fontWeight: 600, fontFamily: font, cursor: 'pointer',
              border: `1px solid ${issuesOnly ? '#f59e0b' : '#cbd5e1'}`, background: issuesOnly ? '#fef3c7' : '#fff', color: issuesOnly ? '#92400e' : '#475569' }}>
            ⚠ Issues only ({issueCount})
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={onPrintForm} style={toolBtn('secondary')}><Icon d={ICONS.print} /> Print survey form</button>
            <button type="button" onClick={() => setPasteOpen(o => !o)} style={{ ...toolBtn('secondary'), ...(pasteOpen ? { background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' } : {}) }}><Icon d={ICONS.paste} /> Paste from Excel</button>
            <button type="button" onClick={add} style={toolBtn('primary')}><Icon d={ICONS.plus} /> Add Record</button>
            {surveys.length > 0 && (confirmClear ? (
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12.5, color: '#b91c1c', fontFamily: font, fontWeight: 600 }}>
                Delete all?
                <button type="button" onClick={() => { setSurveys([]); setConfirmClear(false); }} style={{ ...toolBtn('danger'), height: 28, background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}>Yes</button>
                <button type="button" onClick={() => setConfirmClear(false)} style={{ ...toolBtn('secondary'), height: 28 }}>No</button>
              </span>
            ) : <button type="button" onClick={() => setConfirmClear(true)} style={toolBtn('danger')}><Icon d={ICONS.trash} /> Clear all</button>)}
          </div>
        </div>

        {pasteOpen && (
          <div style={{ border: '1px solid #bfdbfe', borderRadius: 10, padding: 12, marginBottom: 12, background: '#f8fbff' }}>
            <div style={{ fontSize: 12.5, fontFamily: font, color: '#334155', marginBottom: 8, lineHeight: 1.55 }}>
              Copy rows from Excel and paste here. Column order: <b>Worker name · Worker ID · Survey date (DD-MM-YYYY) · Family size · FTE earners · Food · Housing · Utilities ·
              Healthcare · Education · Transport · Clothing · Communication · Other · Surveyor</b>. A header row is skipped automatically.
            </div>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button type="button" onClick={importPaste} disabled={!pasteText.trim()} style={{ ...toolBtn('primary'), opacity: pasteText.trim() ? 1 : 0.5 }}>Import rows</button>
              {pasteMsg && <span style={{ fontSize: 12.5, color: '#166534', fontFamily: font, fontWeight: 600 }}>{pasteMsg}</span>}
            </div>
          </div>
        )}

        <div style={{ overflow: 'auto', maxHeight: '60vh', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 1880 }}>
            <thead>
              <tr>
                <th style={stickyTh(40)}>SL</th>
                <th style={stickyTh(160)}>Worker name</th>
                <th style={stickyTh(100)}>Worker ID</th>
                <th style={stickyTh(150)}>Survey date</th>
                {NUM_COLS.map(c => <th key={c.key} style={stickyTh(c.w)}>{c.label}</th>)}
                <th style={stickyTh(140)}>Surveyor</th>
                <th style={stickyTh(60)} />
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={NUM_COLS.length + 6} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 26 }}>
                  {surveys.length ? 'No entries match.' : 'No survey entries yet — click “Add entry”, “Paste from Excel”, or print the survey form to collect data first.'}
                </td></tr>
              )}
              {shown.map(({ s, i, issues }, idx) => (
                <tr key={i} style={{ background: issues.length ? '#fffbeb' : idx % 2 ? '#fafbfc' : '#fff' }}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{s.slNo}</td>
                  <td style={td}><input value={s.workerName} onChange={e => edit(i, 'workerName', e.target.value)} style={cell} /></td>
                  <td style={td}><input value={s.workerId} onChange={e => edit(i, 'workerId', e.target.value)} style={cell} /></td>
                  <td style={td}><DateFieldDMY value={s.surveyDate} onChange={v => edit(i, 'surveyDate', v)} ariaLabel="Survey date" boxStyle={{ padding: '5px 7px', fontSize: 12 }} /></td>
                  {NUM_COLS.map(c => (
                    <td key={c.key} style={td}><input type="number" min="0" step="any" value={s[c.key]} onChange={e => edit(i, c.key, e.target.value)} style={cell} /></td>
                  ))}
                  <td style={td}><input value={s.surveyorName} onChange={e => edit(i, 'surveyorName', e.target.value)} style={cell} /></td>
                  <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {issues.length > 0 && <span title={issues.join(', ')} style={{ color: '#b45309', cursor: 'help', marginRight: 6 }}>⚠</span>}
                    <button type="button" aria-label="Remove entry" onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}