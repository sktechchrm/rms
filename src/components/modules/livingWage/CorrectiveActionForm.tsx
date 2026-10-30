// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionForm.tsx — Step 5: Corrective Action & Commitment.
// New actions are added at the END; overdue items are flagged; suggested actions available.
// Path: src/components/modules/livingWage/CorrectiveActionForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { ACTION_STATUS_OPTIONS, SUGGESTED_ACTIONS, blankCorrectiveAction, actionOverdue } from './types';
import type { CorrectiveActionItem, CommitmentStatement, ActionStatus } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import { font, labelStyle, inputStyle, areaStyle, card, cardTitle, btn, th, td, FORM_CSS } from './ui';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Not Started': { bg: '#f1f5f9', color: '#64748b' },
  'In Progress': { bg: '#fef3c7', color: '#92400e' },
  'Completed':   { bg: '#dcfce7', color: '#166534' },
};

interface Props {
  actions: CorrectiveActionItem[];
  setActions: (a: CorrectiveActionItem[]) => void;
  commitment: CommitmentStatement;
  setCommitment: (c: CommitmentStatement) => void;
}

export default function CorrectiveActionForm({ actions, setActions, commitment, setCommitment }: Props) {
  const renumber = (l: CorrectiveActionItem[]) => l.map((a, i) => ({ ...a, slNo: i + 1 }));
  const edit = (i: number, f: keyof CorrectiveActionItem, v: string) => setActions(actions.map((a, k) => (k === i ? { ...a, [f]: v } : a)));
  const add = () => setActions([...actions, blankCorrectiveAction(actions.length + 1)]);
  const addSuggested = () => {
    const have = new Set(actions.map(a => a.actionItem));
    const more = SUGGESTED_ACTIONS.filter(t => !have.has(t)).map((t, k) => ({ ...blankCorrectiveAction(actions.length + k + 1), actionItem: t }));
    setActions([...actions, ...more]);
  };
  const remove = (i: number) => setActions(renumber(actions.filter((_, k) => k !== i)));

  const done = actions.filter(a => a.status === 'Completed').length;
  const overdue = actions.filter(actionOverdue).length;
  const cell = { ...inputStyle, padding: '5px 7px', fontSize: 12 };

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={cardTitle}>Corrective action items ({done}/{actions.length} completed{overdue ? ` · ${overdue} overdue` : ''})</div>
          <button type="button" onClick={addSuggested} style={{ ...btn('#1e3a5f'), marginLeft: 'auto' }}>Add suggested actions</button>
          <button type="button" onClick={add} style={btn('#16a34a')}>+ Add action</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead><tr>
              <th style={{ ...th, width: 36 }}>SL</th><th style={th}>Action item</th><th style={{ ...th, width: 150 }}>Responsible person</th>
              <th style={{ ...th, width: 160 }}>Target date</th><th style={{ ...th, width: 120 }}>Status</th><th style={th}>Remarks</th><th style={{ ...th, width: 34 }} />
            </tr></thead>
            <tbody>
              {actions.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 22 }}>No corrective actions yet — click “Add suggested actions” or “+ Add action”.</td></tr>}
              {actions.map((a, i) => {
                const sc = STATUS_COLORS[a.status];
                return (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{a.slNo}</td>
                    <td style={td}><input value={a.actionItem} onChange={e => edit(i, 'actionItem', e.target.value)} style={cell} /></td>
                    <td style={td}><input value={a.responsiblePerson} onChange={e => edit(i, 'responsiblePerson', e.target.value)} style={cell} /></td>
                    <td style={td}>
                      <DateFieldDMY value={a.targetDate} onChange={v => edit(i, 'targetDate', v)} ariaLabel="Target date" clearable boxStyle={{ padding: '5px 7px', fontSize: 12 }} />
                      {actionOverdue(a) && <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b91c1c', marginTop: 2 }}>Overdue</div>}
                    </td>
                    <td style={td}>
                      <select value={a.status} onChange={e => edit(i, 'status', e.target.value as ActionStatus)} style={{ ...cell, background: sc.bg, color: sc.color, fontWeight: 600 }}>
                        {ACTION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={td}><input value={a.remarks} onChange={e => edit(i, 'remarks', e.target.value)} style={cell} /></td>
                    <td style={{ ...td, textAlign: 'center' }}><button type="button" aria-label="Remove action" onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>Commitment statement</div>
        <div className="lw-grid">
          <div className="s4">
            <label style={labelStyle}>Statement</label>
            <textarea value={commitment.statement} onChange={e => setCommitment({ ...commitment, statement: e.target.value })}
              placeholder="e.g., We commit to closing the identified wage gap through the actions above, with progress reviewed quarterly." style={areaStyle} />
          </div>
          <div className="s2"><label style={labelStyle}>Committed by</label><input value={commitment.committedBy} onChange={e => setCommitment({ ...commitment, committedBy: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Designation</label><input value={commitment.committedByDesignation} onChange={e => setCommitment({ ...commitment, committedByDesignation: e.target.value })} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Commitment date</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={commitment.commitmentDate} onChange={v => setCommitment({ ...commitment, commitmentDate: v })} ariaLabel="Commitment date" clearable boxStyle={{ padding: '7px 10px', fontSize: 12.5 }} /></div>
          </div>
        </div>
      </div>
      <div style={{ display: 'none', fontFamily: font }} />
    </div>
  );
}