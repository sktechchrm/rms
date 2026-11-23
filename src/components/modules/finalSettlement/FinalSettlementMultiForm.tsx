// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlementMultiForm.tsx — একাধিক কর্মীর চূড়ান্ত পাওনা হিসাব, চাকরি নিষ্পত্তির ধরন অনুযায়ী।
// Path: src/components/modules/finalSettlement/FinalSettlementMultiForm.tsx
//
// Same structure as the single form: a group = ONE settlement type + date (entered once), a row = ONE employee.
// Every figure on screen comes from evaluateBatch() (the same computeSettlement as the single form).
// There are no output buttons here: Save is the page's Save, and bills / statements come from the ফলাফল list.
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties, ReactNode } from 'react';
import type { EmployeeFormData } from './FinalSettlementDataTypes';
import { TERMINATION_OPTIONS, NOTICE_PAY_TYPES, NOTICE_DEDUCTION_TYPES, LAYOFF_TYPE, isDeathType, money } from './settlementModel';
import { isGratuityEligible } from './FinalSettlementFormula';
import { newGroup, newRow } from './settlementBatch';
import type { BatchGroup, BatchRow, EvaluatedGroup, EvaluatedRow } from './settlementBatch';
import { SectionCard, IconAction, ExcelIcon, UserIcon, DownloadIcon } from './SettlementSectionCard';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import { font, labelStyle, inputStyle, FORM_CSS } from '../livingWage/ui';

interface Props {
  groups: BatchGroup[];
  setGroups: (g: BatchGroup[]) => void;
  evaluated: EvaluatedGroup[];
  showErrors: boolean;
  /** Import warnings (unknown type, bad date …) — shown once, dismissible. */
  notes: string[];
  onDismissNotes: () => void;
  defaultDate: string;
  onOpenExcel?: () => void;
  onOpenSingle: () => void;
  /** Download one group's entered rows as an Excel file (same layout as the import template). */
  onDownloadGroup?: (groupIndex: number) => void;
}

const cellInput: CSSProperties = { ...inputStyle, padding: '4px 6px', fontSize: 12, width: '100%', minWidth: 0 };
const numInput: CSSProperties = { ...cellInput, textAlign: 'right' };
const dateBox = { padding: '4px 8px', fontSize: 12 };
const IDX_W = 32;                                   // the # column; the sticky name column starts exactly at its right edge
const DEL_W = 32;
const th: CSSProperties = { padding: '6px 4px', boxSizing: 'border-box', fontSize: 11, fontWeight: 700, color: '#475569', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', fontFamily: font };
const td: CSSProperties = { padding: '4px 3px', boxSizing: 'border-box', borderBottom: '1px solid #eef2f7', verticalAlign: 'middle', background: '#fff' };
const tf: CSSProperties = { ...td, background: '#f1f5f9', borderTop: '2px solid #cbd5e1', fontWeight: 800, fontSize: 12.5, fontFamily: font, textAlign: 'right', padding: '7px 6px', whiteSpace: 'nowrap' };
const red = '#dc2626';

function Chip({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', minWidth: 104 }}>
      <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 13.5, color: tone ?? '#1e3a5f', fontFamily: font }}>{value}</div>
    </div>
  );
}

interface Ctx { g: BatchGroup; r: BatchRow; e: EvaluatedRow; gi: number; ri: number }
interface Col { id: string; head: string; w: number; render: (c: Ctx) => ReactNode; /** Column total (the footer row) — read from the rows that are not blank. */ sum?: (e: EvaluatedRow) => number; fmt?: (x: number) => string; tone?: string }

export default function FinalSettlementMultiForm({ groups, setGroups, evaluated, showErrors, notes, onDismissNotes, defaultDate, onOpenExcel, onOpenSingle, onDownloadGroup }: Props) {
  const evOf = (g: BatchGroup) => evaluated.find(x => x.key === g.key);

  const patchGroup = (gi: number, p: Partial<BatchGroup>) => setGroups(groups.map((g, i) => (i === gi ? { ...g, ...p } : g)));
  const patchRow = (gi: number, ri: number, k: keyof EmployeeFormData, v: string) =>
    setGroups(groups.map((g, i) => (i !== gi ? g : { ...g, rows: g.rows.map((r, j) => (j !== ri ? r : { ...r, f: { ...r.f, [k]: v } })) })));
  const addRow = (gi: number) => patchGroup(gi, { rows: [...groups[gi].rows, newRow()] });
  const removeRow = (gi: number, ri: number) => {
    const rows = groups[gi].rows.filter((_, j) => j !== ri);
    patchGroup(gi, { rows: rows.length ? rows : [newRow()] });
  };
  const removeGroup = (gi: number) => { const next = groups.filter((_, i) => i !== gi); setGroups(next.length ? next : [newGroup(defaultDate)]); };

  const fieldErr = (e: EvaluatedRow, field: string) => showErrors && !e.blank && e.errors.some(x => x.field === field);
  const bad = (e: EvaluatedRow, field: string): CSSProperties => (fieldErr(e, field) ? { borderColor: red } : {});

  /** Columns of one group — the type decides which type-specific columns appear. */
  const columnsFor = (g: BatchGroup): Col[] => {
    const t = g.terminationType;
    const text = (k: keyof EmployeeFormData, w: number, head: string, place?: string): Col => ({
      id: String(k), head, w, render: ({ r, gi, ri }) => <input aria-label={head} value={String(r.f[k] ?? '')} placeholder={place} onChange={e => patchRow(gi, ri, k, e.target.value)} style={cellInput} />,
    });
    const num = (k: keyof EmployeeFormData, w: number, head: string, auto?: (e: EvaluatedRow) => string, sum?: (e: EvaluatedRow) => number): Col => ({
      id: String(k), head, w, sum, render: ({ r, e, gi, ri }) => <input type="number" min="0" aria-label={head} value={String(r.f[k] ?? '')} placeholder={auto?.(e) ?? ''} onChange={ev => patchRow(gi, ri, k, ev.target.value)} style={{ ...numInput, ...bad(e, k as string) }} />,
    });
    const dateCol = (k: 'joiningDate' | 'lastAttendance', w: number, head: string): Col => ({
      id: String(k), head, w, render: ({ r, e, gi, ri }) => (
        <div data-field={`${r.key}:${k}`} style={{ display: 'flex' }}>
          <DateFieldDMY value={r.f[k]} onChange={v => patchRow(gi, ri, k, v)} ariaLabel={head} clearable invalid={fieldErr(e, k)} boxStyle={dateBox}
            {...(k === 'joiningDate' ? { max: r.f.lastAttendance || undefined } : { min: r.f.joiningDate || undefined })} />
        </div>
      ),
    });
    const cols: Col[] = [
      { id: 'name', head: 'নাম *', w: 170, render: ({ r, e, gi, ri }) => <div data-field={`${r.key}:employeeName`}><input aria-label="নাম" value={r.f.employeeName} onChange={ev => patchRow(gi, ri, 'employeeName', ev.target.value)} style={{ ...cellInput, ...bad(e, 'employeeName') }} /></div> },
      text('cardNo', 80, 'কার্ড নং'), text('designation', 120, 'পদবি'), text('section', 110, 'বিভাগ'),
      dateCol('joiningDate', 140, 'নিয়োগ *'), dateCol('lastAttendance', 140, 'সর্বশেষ উপস্থিতি *'),
      num('absentDays', 70, 'অনুপস্থিত'),
      { id: 'wage', head: 'মোট মজুরি *', w: 96, render: ({ r, e, gi, ri }) => <div data-field={`${r.key}:totalMonthlyWage`}><input type="number" min="0" aria-label="মোট মজুরি" value={r.f.totalMonthlyWage} onChange={ev => patchRow(gi, ri, 'totalMonthlyWage', ev.target.value)} style={{ ...numInput, fontWeight: 700, ...bad(e, 'totalMonthlyWage') }} /></div> },
      num('payableDay', 74, 'প্রাপ্য দিন', e => e.autoPayableDay),
      num('payableHours', 70, 'OT ঘন্টা'), num('elQty', 70, 'অর্জিত ছুটি'),
    ];
    if (NOTICE_PAY_TYPES.includes(t)) cols.push(num('noticePayDay', 80, 'নোটিশ পে (দিন)'));
    if (NOTICE_DEDUCTION_TYPES.includes(t)) cols.push(num('noticeDeductionDay', 90, 'নোটিশ কর্তন (দিন)'));
    if (t === LAYOFF_TYPE) cols.push(num('layOffDays', 80, 'লে-অফ (দিন)'));
    if (t && isGratuityEligible(t)) {
      cols.push({ id: 'method', head: 'পদ্ধতি', w: 128, render: ({ r, gi, ri }) => (
        <select aria-label="পেমেন্ট পদ্ধতি" value={r.f.paymentMethod === 'gratuity' ? 'gratuity' : 'compensation'} onChange={ev => patchRow(gi, ri, 'paymentMethod', ev.target.value)} style={cellInput}>
          <option value="compensation">ক্ষতিপূরণ</option><option value="gratuity">গ্র্যাচুইটি</option>
        </select>
      ) });
    }
    cols.push(
      num('others', 92, 'অন্যান্য প্রাপ্য', undefined, e => e.calc.others),
      num('advanceDeduction', 92, 'অগ্রিম কর্তন', undefined, e => e.calc.advance),
      num('otherDeduction', 92, 'অন্যান্য কর্তন', undefined, e => e.calc.otherDeduction),
    );
    const out = (head: string, w: number, v: (e: EvaluatedRow) => string, strong?: string): Col => ({
      id: head, head, w, render: ({ e }) => <div style={{ textAlign: 'right', padding: '0 4px', fontSize: 12.5, fontWeight: strong ? 800 : 600, color: strong ?? '#1e293b', fontFamily: font, whiteSpace: 'nowrap' }}>{e.blank ? '—' : v(e)}</div>,
    });
    /** One part of the settlement: its amount per employee + its total in the footer. */
    const part = (head: string, w: number, v: (e: EvaluatedRow) => number, strong?: string, fmt?: (x: number) => string): Col =>
      ({ ...out(head, w, e => (fmt ?? money)(v(e)), strong), sum: v, fmt, tone: strong });

    cols.push(out('মেয়াদ', 112, e => `${e.calc.years}ব ${e.calc.months}মা ${e.calc.days}দি`), out('সুবিধা বছর', 70, e => String(e.calc.benefitYears)));
    cols.push(part('শেষ মাসের বেতন', 104, e => e.calc.lastMonthSalary), part('ওভারটাইম (টাকা)', 100, e => e.calc.lastMonthOvertime), part('অর্জিত ছুটি (টাকা)', 104, e => e.calc.earnedLeave));
    if (t && t !== LAYOFF_TYPE) cols.push(part('চাকরি অবসানজনিত ক্ষতিপূরণ', 128, e => e.calc.serviceComp));
    if (isDeathType(t)) cols.push(part('মৃত্যুজনিত ক্ষতিপূরণ', 112, e => e.calc.deathComp));
    if (t && isGratuityEligible(t)) cols.push(part('গ্র্যাচুইটি', 96, e => (e.calc.usesGratuity ? e.calc.gratuity : 0)));
    if (t === LAYOFF_TYPE) cols.push(part('লে-অফ ক্ষতিপূরণ', 108, e => e.calc.layOff));
    if (NOTICE_PAY_TYPES.includes(t)) cols.push(part('নোটিশ পে (টাকা)', 100, e => e.calc.notice));
    if (NOTICE_DEDUCTION_TYPES.includes(t)) cols.push(part('নোটিশ কর্তন (টাকা)', 108, e => e.calc.noticeDeduction));
    cols.push(
      part('মোট প্রাপ্য (A)', 112, e => e.calc.totalReceivable, '#15803d'),
      part('কর্তন (B)', 92, e => e.calc.totalDeductions, '#b45309'),
      part('নিট (A−B)', 104, e => e.calc.finalTotal, '#047857', x => x.toLocaleString('en-US')),
    );
    return cols;
  };

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      <SectionCard
        title="একাধিক কর্মীর হিসাব"
        subtitle="চাকরি নিষ্পত্তির ধরন একবার নির্বাচন করুন — নিচের সব কর্মীর হিসাব সেই ধরন অনুযায়ী হবে। ভিন্ন ধরনের জন্য আলাদা গ্রুপ যোগ করুন।"
        actions={<>
          {onOpenExcel && <IconAction title="Excel দিয়ে তথ্য আপলোড" tone="green" onClick={onOpenExcel}><ExcelIcon /></IconAction>}
          <IconAction title="একজন কর্মীর ফর্মে ফিরুন" tone="slate" onClick={onOpenSingle}><UserIcon /></IconAction>
        </>}
      >
        <div style={{ fontSize: 12, color: '#64748b', fontFamily: font, lineHeight: 1.6 }}>
          নিষ্পত্তির তারিখ পেজের হেডার থেকে বদলালে সব গ্রুপে প্রযোজ্য হয়। সর্বশেষ মাস = সর্বশেষ উপস্থিতির মাস; “প্রাপ্য দিন” ফাঁকা রাখলে সর্বশেষ উপস্থিতির তারিখের দিন ধরা হয় (ধূসর সংখ্যাটি)।
          অন্যান্য প্রাপ্য/কর্তনের বিবরণ ও পেমেন্ট তারিখ সংরক্ষণের পর স্টেটমেন্ট থেকে Edit করে দেওয়া যাবে।
        </div>
      </SectionCard>

      {notes.length > 0 && (
        <div role="status" style={{ padding: '10px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 12, fontFamily: font }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 12.5, color: '#92400e' }}>Excel থেকে আমদানি — {notes.length}টি বিষয় দেখুন</strong>
            <button type="button" onClick={onDismissNotes} aria-label="Dismiss" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#92400e' }}>✕</button>
          </div>
          {notes.slice(0, 8).map((m, i) => <div key={i} style={{ fontSize: 12, color: '#92400e', marginTop: 3 }}>⚠ {m}</div>)}
          {notes.length > 8 && <div style={{ fontSize: 12, color: '#92400e', marginTop: 3 }}>… আরও {notes.length - 8}টি</div>}
        </div>
      )}

      {groups.map((g, gi) => {
        const ev = evOf(g);
        const cols = columnsFor(g);
        const typeBad = showErrors && Boolean(ev?.typeMissing);
        const dateBad = showErrors && Boolean(ev?.dateMissing);
        const rowIssues = (ev?.rows ?? []).map((e, ri) => ({ e, ri })).filter(x => !x.e.blank && ((showErrors && x.e.errors.length) || x.e.warnings.length));
        return (
          <SectionCard key={g.key} flush
            title={`নিষ্পত্তির গ্রুপ ${gi + 1}`}
            subtitle="এই গ্রুপের সব কর্মীর জন্য একই চাকরি নিষ্পত্তির ধরন ও তারিখ"
            actions={<>
              {onDownloadGroup && <IconAction title="এই গ্রুপের তথ্য Excel-এ ডাউনলোড" tone="green" onClick={() => onDownloadGroup(gi)}><DownloadIcon /></IconAction>}
              {groups.length > 1 && <IconAction title="এই গ্রুপ বাদ দিন" tone="slate" onClick={() => removeGroup(gi)}><span style={{ fontSize: 15, lineHeight: 1 }}>✕</span></IconAction>}
            </>}
          >
            <div style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
              <div data-field={`${g.key}:type`} style={{ flex: '1 1 320px', minWidth: 240 }}>
                <label style={labelStyle}>চাকরি নিষ্পত্তির ধরন *</label>
                <select value={g.terminationType} onChange={e => patchGroup(gi, { terminationType: e.target.value })} style={{ ...inputStyle, ...(typeBad ? { borderColor: red } : {}) }}>
                  <option value="">-- নির্বাচন করুন --</option>
                  {TERMINATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {typeBad && <div role="alert" style={{ marginTop: 3, fontSize: 11.5, color: red, fontWeight: 600, fontFamily: font }}>Choose the settlement type.</div>}
              </div>
              <div data-field={`${g.key}:date`} style={{ width: 170 }}>
                <label style={labelStyle}>নিষ্পত্তির তারিখ *</label>
                <div style={{ display: 'flex' }}><DateFieldDMY value={g.settlementDate} onChange={v => patchGroup(gi, { settlementDate: v })} ariaLabel="Settlement date" clearable invalid={dateBad} boxStyle={{ padding: '7px 10px', fontSize: 12.5 }} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip label="কর্মী" value={String(ev?.count ?? 0)} />
                <Chip label="মোট প্রাপ্য (A)" value={money(ev?.totalReceivable ?? 0)} tone="#15803d" />
                <Chip label="মোট কর্তন (B)" value={money(ev?.totalDeductions ?? 0)} tone="#b45309" />
                <Chip label="মোট নিট" value={(ev?.totalNet ?? 0).toLocaleString('en-US')} tone="#047857" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
              <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>{ev?.count ?? 0} জন কর্মীর হিসাব — প্রতিটি অংশের মোট টেবিলের নিচে</span>
              <button type="button" onClick={() => addRow(gi)} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #93c5fd', background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}>
                + কর্মী যোগ করুন
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', width: IDX_W + cols.reduce((x, c) => x + c.w, 0) + DEL_W }}>
                <colgroup>
                  <col style={{ width: IDX_W }} />
                  {cols.map(c => <col key={c.id} style={{ width: c.w }} />)}
                  <col style={{ width: DEL_W }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ ...th, left: 0, zIndex: 3, position: 'sticky', textAlign: 'center' }}>#</th>
                    {cols.map((c, k) => <th key={c.id} style={{ ...th, ...(k === 0 ? { position: 'sticky', left: IDX_W, zIndex: 3 } : {}) }} title={c.head}>{c.head}</th>)}
                    <th style={th} aria-label="Remove" />
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r, ri) => {
                    const e = ev?.rows[ri];
                    if (!e) return null;
                    return (
                      <tr key={r.key}>
                        <td style={{ ...td, position: 'sticky', left: 0, zIndex: 1, textAlign: 'center', fontSize: 11.5, color: '#64748b', fontFamily: font }}>{ri + 1}</td>
                        {cols.map((c, k) => (
                          <td key={c.id} style={{ ...td, ...(k === 0 ? { position: 'sticky', left: IDX_W, zIndex: 1 } : {}) }}>{c.render({ g, r, e, gi, ri })}</td>
                        ))}
                        <td style={{ ...td, textAlign: 'center' }}>
                          <button type="button" aria-label={`সারি ${ri + 1} বাদ দিন`} title="সারি বাদ দিন" onClick={() => removeRow(gi, ri)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ ...tf, position: 'sticky', left: 0, zIndex: 1 }} />
                    {cols.map((c, k) => {
                      const total = c.sum ? (ev?.rows ?? []).filter(x => !x.blank).reduce((acc, x) => acc + (c.sum?.(x) ?? 0), 0) : null;
                      return (
                        <td key={c.id} style={{ ...tf, color: c.tone ?? '#1e293b', ...(k === 0 ? { position: 'sticky', left: IDX_W, zIndex: 1, textAlign: 'left' } : {}) }}>
                          {k === 0 ? `মোট (${ev?.count ?? 0} জন)` : total === null ? '' : (c.fmt ?? money)(total)}
                        </td>
                      );
                    })}
                    <td style={tf} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {rowIssues.length > 0 && (
              <div style={{ padding: '8px 14px', borderTop: '1px solid #e2e8f0', background: '#fffdf7' }}>
                {rowIssues.map(({ e, ri }) => (
                  <div key={e.key} style={{ fontSize: 12, fontFamily: font, marginTop: 2 }}>
                    {showErrors && e.errors.map((x, k) => <div key={`e${k}`} style={{ color: '#b91c1c', fontWeight: 600 }}>✕ সারি {ri + 1}: {x.text}</div>)}
                    {e.warnings.map((m, k) => <div key={`w${k}`} style={{ color: '#92400e' }}>⚠ সারি {ri + 1}: {m}</div>)}
                  </div>
                ))}
              </div>
            )}

          </SectionCard>
        );
      })}

      <button type="button" onClick={() => setGroups([...groups, newGroup(groups[groups.length - 1]?.settlementDate || defaultDate)])}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px dashed #94a3b8', background: '#fff', color: '#334155', fontWeight: 700, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>
        + আরেকটি চাকরি নিষ্পত্তির ধরনের গ্রুপ যোগ করুন
      </button>
    </div>
  );
}