// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionForm.tsx — Step 5: Corrective Action & Commitment.
// Path: src/components/modules/livingWage/CorrectiveActionForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { ACTION_STATUS_OPTIONS, blankCorrectiveAction } from './types';
import type { CorrectiveActionItem, CommitmentStatement } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1',
  borderRadius: 6, fontSize: 12.5, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  verticalAlign: 'middle',
};
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, fontFamily: font, color: '#1e293b',
  display: 'block', marginBottom: 6,
};
const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 13, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Not Started': { bg: '#f1f5f9', color: '#64748b' },
  'In Progress': { bg: '#fef3c7', color: '#92400e' },
  'Completed':   { bg: '#f0fdf4', color: '#15803d' },
};

interface Props {
  actions: CorrectiveActionItem[];
  setActions: (actions: CorrectiveActionItem[]) => void;
  commitment: CommitmentStatement;
  setCommitment: (c: CommitmentStatement) => void;
}

export default function CorrectiveActionForm({ actions, setActions, commitment, setCommitment }: Props) {
  const handleChange = (index: number, field: keyof CorrectiveActionItem, value: string) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const addAction = () => {
    const reNumbered = [blankCorrectiveAction(1), ...actions].map((a, i) => ({ ...a, slNo: i + 1 }));
    setActions(reNumbered);
  };

  const removeAction = (index: number) => {
    const filtered = actions.filter((_, i) => i !== index);
    setActions(filtered.map((a, i) => ({ ...a, slNo: i + 1 })));
  };

  const completedCount = actions.filter(a => a.status === 'Completed').length;

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e293b' }}>
            Corrective Action Items {actions.length > 0 && `(${completedCount}/${actions.length} completed)`}
          </span>
          <button
            onClick={addAction}
            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font }}
          >
            + Add Action Item
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 36 }}>SL</th>
                <th style={thStyle}>Action Item</th>
                <th style={{ ...thStyle, width: 160 }}>Responsible Person</th>
                <th style={{ ...thStyle, width: 130 }}>Target Date</th>
                <th style={{ ...thStyle, width: 130 }}>Status</th>
                <th style={thStyle}>Remarks</th>
                <th style={{ ...thStyle, width: 40, borderRight: 'none' }} />
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 && (
                <tr><td colSpan={7} style={{ ...tdStyle, borderRight: 'none', textAlign: 'center', color: '#94a3b8', padding: 24 }}>No corrective actions recorded yet</td></tr>
              )}
              {actions.map((a, index) => {
                const sc = STATUS_COLORS[a.status];
                return (
                  <tr key={index}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{a.slNo}</td>
                    <td style={tdStyle}><input value={a.actionItem} onChange={e => handleChange(index, 'actionItem', e.target.value)} style={inputStyle} /></td>
                    <td style={tdStyle}><input value={a.responsiblePerson} onChange={e => handleChange(index, 'responsiblePerson', e.target.value)} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="date" value={a.targetDate} onChange={e => handleChange(index, 'targetDate', e.target.value)} style={inputStyle} /></td>
                    <td style={tdStyle}>
                      <select value={a.status} onChange={e => handleChange(index, 'status', e.target.value)} style={{ ...inputStyle, background: sc.bg, color: sc.color, fontWeight: 600 }}>
                        {ACTION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}><input value={a.remarks} onChange={e => handleChange(index, 'remarks', e.target.value)} style={inputStyle} /></td>
                    <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                      <button onClick={() => removeAction(index)} title="Remove" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e293b', marginBottom: 12 }}>Commitment Statement</div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Statement</label>
          <textarea
            value={commitment.statement}
            onChange={e => setCommitment({ ...commitment, statement: e.target.value })}
            placeholder="e.g., We commit to closing the identified wage gap through the corrective actions listed above, with progress reviewed quarterly."
            style={{ ...fieldStyle, resize: 'vertical' as const, minHeight: 80 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <label style={labelStyle}>Committed By</label>
            <input value={commitment.committedBy} onChange={e => setCommitment({ ...commitment, committedBy: e.target.value })} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Designation</label>
            <input value={commitment.committedByDesignation} onChange={e => setCommitment({ ...commitment, committedByDesignation: e.target.value })} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Commitment Date</label>
            <input type="date" value={commitment.commitmentDate} onChange={e => setCommitment({ ...commitment, commitmentDate: e.target.value })} style={fieldStyle} />
          </div>
        </div>
      </div>
    </>
  );
}
