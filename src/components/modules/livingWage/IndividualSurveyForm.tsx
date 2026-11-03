// ─────────────────────────────────────────────────────────────────────────────
// IndividualSurveyForm.tsx — worker survey (9 Anker cost components incl. Utilities).
// Search, "issues only", column sort (▲/▼) and funnels, paste from Excel, print the blank form,
// data-quality flags.
// NEW RECORDS GO TO THE TOP ("Add Record" and "Paste from Excel"); filters and sort are cleared so
// the new row is visible. Filters are owned by LivingWageManager so the print preview, PDF and
// Excel follow exactly what is shown here.
// Path: src/components/modules/livingWage/IndividualSurveyForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState } from 'react';
import {
  blankSurveyEntry, deriveFromSurveys, toIsoDate, parseAmount, fmt, statisticLabel,
  SURVEY_NUM_FIELDS, SURVEY_FILTER_FIELDS, EMPTY_SURVEY_FILTERS, buildSurveyRows, filterSurveyRows, surveyColumnValue,
  countActiveSurveyFilters,
} from './types';
import type { IndividualSurveyEntry, SurveyStatistic, SurveyFilters, SurveySortField } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import HeaderFilter from './HeaderFilter';
import InfoBall from './InfoBall';
import { font, inputStyle, card, cardTitle, toolBtn, th, td, mini } from './ui';

const widthOf = (key: string) => (key === 'actualFamilySize' || key === 'actualEarnersInFamily' ? 78 : key === 'reportedCommunicationExpense' ? 100 : 88);
const NUM_COLS = SURVEY_NUM_FIELDS.map(f => ({ ...f, w: widthOf(f.key) }));

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
  /** Opens the blank survey form (paper form) in the print preview. */
  onPrintForm: () => void;
  /** Table filters / sort — owned by LivingWageManager. */
  filters: SurveyFilters;
  onFiltersChange: (f: SurveyFilters) => void;
}

export default function IndividualSurveyForm({
  surveys, setSurveys, statistic, normalize, onPrintForm, filters, onFiltersChange,
}: Props) {
  const [pasteOpen, setPasteOpen]   = useState(false);
  const [pasteText, setPasteText]   = useState('');
  const [pasteMsg, setPasteMsg]     = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const focusNewRef = useRef(false);   // the next render focuses the name box of the new top row

  const derived = useMemo(() => deriveFromSurveys(surveys, statistic, normalize), [surveys, statistic, normalize]);
  const rows    = useMemo(() => buildSurveyRows(surveys), [surveys]);
  const shown   = useMemo(() => filterSurveyRows(rows, filters), [rows, filters]);
  const issueCount = rows.filter(r => r.issues.length).length;
  const activeCount = countActiveSurveyFilters(filters);
  const cur = filters.sort ?? { field: '', dir: 'asc' };

  const setFilter = (patch: Partial<SurveyFilters>) => onFiltersChange({ ...filters, ...patch });
  const renumber = (l: IndividualSurveyEntry[]) => l.map((s, k) => ({ ...s, slNo: k + 1 }));
  const edit = (i: number, f: keyof IndividualSurveyEntry, v: string) => setSurveys(surveys.map((s, k) => (k === i ? { ...s, [f]: v } : s)));
  const remove = (i: number) => setSurveys(renumber(surveys.filter((_, k) => k !== i)));

  // New record → TOP of the list. Filters and sort are cleared so the new row is visible, and it is focused.
  const add = () => {
    focusNewRef.current = true;
    setSurveys(renumber([blankSurveyEntry(1), ...surveys]));
    if (activeCount > 0 || cur.field) onFiltersChange(EMPTY_SURVEY_FILTERS);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const cycleSort = (field: SurveySortField) => {
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };
  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    const base = filterSurveyRows(rows, { ...filters, columns: cols });
    return Array.from(new Set(base.map(r => surveyColumnValue(r.s, field)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, sel: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: sel } });

  const headCell = (label: string, field: SurveySortField, w: number) => {
    const sorted = cur.field === field;
    return (
      <th key={field || label} style={stickyTh(w)}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
          <span>{label}</span>
          <span style={{ display: 'inline-flex', gap: 2 }}>
            <button type="button" aria-label={`Sort ${label}`} title={sorted ? (cur.dir === 'asc' ? 'Ascending — click for descending' : 'Descending — click to clear') : 'Sort ascending'}
              onClick={() => cycleSort(field)} style={mini(sorted)}>{sorted ? (cur.dir === 'asc' ? '▲' : '▼') : '↕'}</button>
            {SURVEY_FILTER_FIELDS.includes(field) && (
              <HeaderFilter label={label} selected={filters.columns?.[field] ?? []} getOptions={() => columnOptions(field)} onChange={sel => setColumn(field, sel)} />
            )}
          </span>
        </div>
      </th>
    );
  };

  const importPaste = () => {
    const rowsIn = pasteText.split(/\r?\n/).map(l => l.replace(/\s+$/, '')).filter(l => l.trim()).map(l => l.split('\t'));
    if (!rowsIn.length) { setPasteMsg('Nothing to import.'); return; }
    const first = rowsIn[0];
    const hasHeader = (first[3] ?? '').trim() !== '' && parseAmount(first[3]) === null;
    const body = hasHeader ? rowsIn.slice(1) : rowsIn;
    const c2 = (v?: string) => (v ?? '').replace(/,/g, '').trim();
    const added = body.map((c, k): IndividualSurveyEntry => ({
      ...blankSurveyEntry(k + 1),
      workerName: (c[0] ?? '').trim(), workerId: (c[1] ?? '').trim(), surveyDate: toIsoDate(c[2] ?? ''),
      actualFamilySize: c2(c[3]), actualEarnersInFamily: c2(c[4]),
      reportedFoodExpense: c2(c[5]), reportedHousingExpense: c2(c[6]), reportedUtilitiesExpense: c2(c[7]),
      reportedHealthcareExpense: c2(c[8]), reportedEducationExpense: c2(c[9]), reportedTransportExpense: c2(c[10]),
      reportedClothingExpense: c2(c[11]), reportedCommunicationExpense: c2(c[12]), reportedOtherExpense: c2(c[13]),
      surveyorName: (c[14] ?? '').trim(),
    }));
    // Pasted rows go to the top, in the order they were pasted.
    setSurveys(renumber([...added, ...surveys]));
    if (activeCount > 0 || cur.field) onFiltersChange(EMPTY_SURVEY_FILTERS);
    scrollRef.current?.scrollTo({ top: 0 });
    setPasteMsg(`${added.length} records added at the top.`);
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
        {metric('Valid records', `${derived.n} / ${derived.total}`)}
        {metric('Avg. family size', derived.n ? fmt(derived.familySize) : '—')}
        {metric('Avg. FTE earners', derived.workersN ? fmt(derived.workers) : '—')}
        {metric('Avg. food (household)', derived.n ? fmt(derived.costs.food.raw) : '—')}
        {metric('Avg. housing + utilities', derived.n ? fmt(derived.costs.housing.raw + derived.costs.utilities.raw) : '—')}
        {metric('Records with issues', String(issueCount))}
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
            Utilities means electricity, water and gas. The calculation step fills itself from these records using the {statisticLabel(statistic).toLowerCase()}
            {normalize ? ', with per-person costs scaled to the family size' : ''}. A family size above 15 is treated as a typing mistake and left out.
            Use “Print survey form” to collect the data on paper first. New records are added at the top.
          </InfoBall>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'inline-flex', pointerEvents: 'none' }}><Icon d={ICONS.search} /></span>
            <input value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search name / ID / surveyor"
              style={{ ...inputStyle, height: 32, paddingLeft: 30, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
          </div>
          <button type="button" aria-pressed={filters.issuesOnly} onClick={() => setFilter({ issuesOnly: !filters.issuesOnly })}
            style={{ height: 32, padding: '0 12px', borderRadius: 16, fontSize: 12.5, fontWeight: 600, fontFamily: font, cursor: 'pointer',
              border: `1px solid ${filters.issuesOnly ? '#f59e0b' : '#cbd5e1'}`, background: filters.issuesOnly ? '#fef3c7' : '#fff', color: filters.issuesOnly ? '#92400e' : '#475569' }}>
            ⚠ Issues only ({issueCount})
          </button>
          {activeCount > 0 && <button type="button" onClick={() => onFiltersChange({ ...EMPTY_SURVEY_FILTERS, sort: filters.sort })} style={toolBtn('secondary')}>Clear Filters ({activeCount})</button>}
          <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>{shown.length} of {surveys.length} records</span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={onPrintForm} style={toolBtn('secondary')} title="Blank survey form to collect data on paper"><Icon d={ICONS.print} /> Print survey form</button>
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
              Copy rows from Excel and paste here. Column order: <b>Worker name · Worker ID/Card No · Survey date (DD-MM-YYYY) · Family size · FTE earners · Food · Housing · Utilities ·
              Healthcare · Education · Transport · Clothing · Communication · Other · Surveyor</b>. A header row is skipped automatically. Pasted rows are added at the top.
            </div>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button type="button" onClick={importPaste} disabled={!pasteText.trim()} style={{ ...toolBtn('primary'), opacity: pasteText.trim() ? 1 : 0.5 }}>Import rows</button>
              {pasteMsg && <span style={{ fontSize: 12.5, color: '#166534', fontFamily: font, fontWeight: 600 }}>{pasteMsg}</span>}
            </div>
          </div>
        )}

        <div ref={scrollRef} style={{ overflow: 'auto', maxHeight: '60vh', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 1960 }}>
            <thead>
              <tr>
                {headCell('SL', 'slNo', 64)}
                {headCell('Worker name', 'workerName', 170)}
                {headCell('Worker ID/Card No', 'workerId', 120)}
                {headCell('Survey date', 'surveyDate', 170)}
                {NUM_COLS.map(c => headCell(c.label, c.key, c.w + (SURVEY_FILTER_FIELDS.includes(c.key) ? 30 : 12)))}
                {headCell('Surveyor', 'surveyorName', 160)}
                <th style={stickyTh(60)} />
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={NUM_COLS.length + 6} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 26 }}>
                  {surveys.length ? 'No records match the filters.' : 'No survey records yet — click “Add Record”, “Paste from Excel”, or print the survey form to collect data first.'}
                </td></tr>
              )}
              {shown.map(({ s, i, issues }, idx) => (
                <tr key={i} style={{ background: issues.length ? '#fffbeb' : idx % 2 ? '#fafbfc' : '#fff' }}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{s.slNo}</td>
                  <td style={td}>
                    <input
                      value={s.workerName} onChange={e => edit(i, 'workerName', e.target.value)} style={cell}
                      ref={i === 0 ? (el => { if (el && focusNewRef.current) { focusNewRef.current = false; el.focus(); } }) : undefined}
                    />
                  </td>
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