// ─────────────────────────────────────────────────────────────────────────────
// MiscBillForm.tsx — template selector + dynamic-row table, matching
// Requisition's data-entry pattern. English-only UI (no Bengali).
// Path: src/components/modules/miscBill/MiscBillForm.tsx
//
// Basic Salary is now a DYNAMICALLY COMPUTED, READ-ONLY display column
// (from Gross Salary) — not an editable input, per explicit request.
// Card No. and Department replace the old ambiguous "Card/ID" and
// "Dept/Section" labels/fields.
// ─────────────────────────────────────────────────────────────────────────────

import type { MiscBillFormProps, MiscBillItem } from './types';
import { TEMPLATE_OPTIONS, calculatePayableAmount, calculateDynamicBasicSalary, blankItem, grandTotalInWords } from './types';

const font = "Arial, sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1',
  borderRadius: 6, fontSize: 12.5, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical' as const, minHeight: 36, fontFamily: font,
};
const readOnlyStyle: React.CSSProperties = {
  padding: '6px 8px', fontWeight: 600, color: '#475569', fontFamily: font,
};
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11.5, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  verticalAlign: 'middle',
};

export default function MiscBillFormComponent({ data, setData }: MiscBillFormProps) {

  const handleItemChange = (index: number, field: keyof MiscBillItem, value: string) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, items: newItems });
  };

  const addItem = () => {
    const reNumbered = [blankItem(1), ...data.items].map((item, i) => ({ ...item, slNo: i + 1 }));
    setData({ ...data, items: reNumbered });
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    const filtered = data.items.filter((_, i) => i !== index);
    const reNumbered = filtered.map((item, i) => ({ ...item, slNo: i + 1 }));
    setData({ ...data, items: reNumbered });
  };

  const isAdjustment = data.template === 'adjustment';
  const countLabel   = data.template === 'holiday' ? 'Count Holiday' : data.template === 'festival' ? 'Count Festival Holiday' : '';

  const grandTotal = data.items.reduce(
    (sum, it) => sum + calculatePayableAmount(data.template, it.grossSalary, it.count, it.manualPayableAmount),
    0,
  );

  // colSpan for the footer's "Grand Total" label cell — counts every data
  // column BEFORE Payable Amount: SL + [Particulars OR Count] + Name +
  // Card No. + Designation + Department + Gross Salary + Basic Salary = 8
  // for both column sets (Adjustment swaps Count for Particulars, same count).
  const labelColSpan = 8;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, fontFamily: font, color: '#1e293b', display: 'block', marginBottom: 6 }}>
            Template *
          </label>
          <select
            value={data.template}
            onChange={e => setData({ ...data, template: e.target.value as typeof data.template })}
            style={inputStyle}
          >
            {TEMPLATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, fontFamily: font, color: '#1e293b', display: 'block', marginBottom: 6 }}>
            Subject *
          </label>
          <input
            value={data.subject}
            onChange={e => setData({ ...data, subject: e.target.value })}
            placeholder="e.g., Eid-ul-Fitr Festival Holiday Bill"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e293b' }}>{TEMPLATE_OPTIONS.find(t => t.value === data.template)?.label} Entries</span>
        <button
          onClick={addItem}
          style={{
            background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font,
          }}
        >
          + Add Employee
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1250 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }}>SL</th>
              {isAdjustment && <th style={{ ...thStyle, width: 180 }}>Particulars</th>}
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, width: 100 }}>Card No.</th>
              <th style={thStyle}>Designation</th>
              <th style={thStyle}>Department</th>
              <th style={{ ...thStyle, width: 110 }}>Gross Salary</th>
              <th style={{ ...thStyle, width: 110 }}>Basic Salary</th>
              {!isAdjustment && <th style={{ ...thStyle, width: 110 }}>{countLabel}</th>}
              <th style={{ ...thStyle, width: 120 }}>Payable Amount</th>
              <th style={thStyle}>Remarks</th>
              <th style={{ ...thStyle, width: 40, borderRight: 'none' }} />
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => {
              const payable = calculatePayableAmount(data.template, item.grossSalary, item.count, item.manualPayableAmount);
              const basicSalary = calculateDynamicBasicSalary(item.grossSalary);
              return (
                <tr key={index}>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{item.slNo}</td>
                  {isAdjustment && (
                    <td style={tdStyle}>
                      <textarea
                        value={item.particulars}
                        onChange={e => handleItemChange(index, 'particulars', e.target.value)}
                        placeholder="e.g., Overtime correction for June"
                        rows={2}
                        style={textareaStyle}
                      />
                    </td>
                  )}
                  <td style={tdStyle}>
                    <input value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={item.cardNo} onChange={e => handleItemChange(index, 'cardNo', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={item.designation} onChange={e => handleItemChange(index, 'designation', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={item.department} onChange={e => handleItemChange(index, 'department', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" value={item.grossSalary} onChange={e => handleItemChange(index, 'grossSalary', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={tdStyle}>
                    {/* Basic Salary: dynamically computed from Gross Salary, read-only */}
                    <div style={readOnlyStyle}>{basicSalary > 0 ? basicSalary.toFixed(2) : '—'}</div>
                  </td>
                  {!isAdjustment && (
                    <td style={tdStyle}>
                      <input type="number" value={item.count} onChange={e => handleItemChange(index, 'count', e.target.value)} style={inputStyle} />
                    </td>
                  )}
                  <td style={tdStyle}>
                    {isAdjustment ? (
                      <input
                        type="number"
                        value={item.manualPayableAmount}
                        onChange={e => handleItemChange(index, 'manualPayableAmount', e.target.value)}
                        style={inputStyle}
                      />
                    ) : (
                      <div style={{ padding: '6px 8px', fontWeight: 700, color: '#15803d' }}>{payable.toFixed(2)}</div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <input value={item.remarks} onChange={e => handleItemChange(index, 'remarks', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                    <button
                      onClick={() => removeItem(index)}
                      title="Remove row"
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={labelColSpan} style={{ padding: '10px', textAlign: 'right', fontWeight: 700, fontSize: 13, fontFamily: font, background: '#1e3a5f', color: '#fff' }}>
                Grand Total
              </td>
              <td style={{ padding: '10px', fontWeight: 700, fontSize: 13, fontFamily: font, background: '#1e3a5f', color: '#fff' }}>
                Tk {grandTotal.toFixed(2)}
              </td>
              <td colSpan={2} style={{ background: '#1e3a5f' }} />
            </tr>
            <tr>
              <td colSpan={labelColSpan + 3} style={{ padding: '8px 10px', fontSize: 12, fontFamily: font, background: '#f8fafc', color: '#475569', fontStyle: 'italic' }}>
                In Word: {grandTotalInWords(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isAdjustment && (
        <div style={{ padding: '10px 16px', fontSize: 12, color: '#92400e', background: '#fef3c7', fontFamily: font }}>
          ℹ️ Payable Amount must be entered manually for Adjustment Bill — no auto-calculation.
        </div>
      )}
    </div>
  );
}
