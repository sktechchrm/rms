// ─────────────────────────────────────────────────────────────────────────────
// InvestigationCommitteeForm.tsx — ধাপ ৪: তদন্ত কমিটি (Notice 3). The member table is sized by ধাপ ৩.
// Path: src/components/modules/disciplinaryAction/InvestigationCommitteeForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DisciplinaryActionData, CommitteeMember } from './types';
import { formatDateBn } from './types';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { addDaysSkippingHolidays } from '../../../utils/businessDays';
import { FormPage, FormSection, Field, Notice, useFormState } from './FormPage';
import type { FormCheck } from './FormPage';
import { font, inputStyle, NAVY } from './formStyles';

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
  festivalHolidays: string[];
}

const th: React.CSSProperties = {
  padding: '9px 10px', fontSize: 11, fontWeight: 700, fontFamily: font, color: '#334155',
  background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle' };
const cell: React.CSSProperties = { ...inputStyle, height: 34, fontSize: 12.5 };

export default function InvestigationCommitteeForm({ data, setData, festivalHolidays }: Props) {
  const { showAll } = useFormState();
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const deadline = data.showCauseDate ? addDaysSkippingHolidays(data.showCauseDate, 50, festivalHolidays) : '';
  const filled = data.committeeMembers.filter(m => m.name.trim()).length;

  const checks: FormCheck[] = [
    { name: 'notice3Date', label: 'নোটিশ ৩ ইস্যুর তারিখ', section: 'notice', ok: !!data.notice3Date },
    ...data.committeeMembers.map((m, i): FormCheck => ({ name: `member${i}`, label: `সদস্য ${m.slNo} এর নাম`, section: 'members', ok: !!m.name.trim() })),
  ];

  const change = (i: number, field: keyof CommitteeMember, value: string) => {
    const updated = [...data.committeeMembers];
    updated[i] = { ...updated[i], [field]: value };
    setData({ ...data, committeeMembers: updated });
  };

  return (
    <FormPage step="৪" title="তদন্ত কমিটি" subtitle="কমিটির সদস্য-তালিকা ও নোটিশ ৩ এর তারিখ" reference={data.referenceNo || undefined} checks={checks}>
      <FormSection id="notice" no="১" title="নোটিশ ৩" hint="কমিটি গঠনের নোটিশ">
        <div style={{ maxWidth: 300 }}>
          <Field label="নোটিশ ৩ ইস্যুর তারিখ" required name="notice3Date" missing={!data.notice3Date}
            hint={data.notice3Date ? `${formatDateBn(data.notice3Date)} ইং` : undefined}>
            <input type="date" className="da-in" style={inputStyle} value={data.notice3Date} onChange={e => setData({ ...data, notice3Date: e.target.value })} />
          </Field>
        </div>
      </FormSection>

      <FormSection id="members" no="২" title="কমিটির সদস্য" hint={memberCount ? `${toBanglaNumber(filled)} / ${toBanglaNumber(memberCount)} জনের নাম দেওয়া হয়েছে` : undefined}>
        {memberCount === 0 ? (
          <Notice tone="warn">প্রথমে «প্রতিনিধি মনোনয়ন» ধাপে সদস্য সংখ্যা দিন — তালিকা স্বয়ংক্রিয়ভাবে তৈরি হবে।</Notice>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 48, textAlign: 'center' }}>ক্রম</th>
                  <th style={th}>কর্মীর নাম *</th>
                  <th style={{ ...th, width: 130 }}>কার্ড নং</th>
                  <th style={{ ...th, width: 170 }}>পদবী</th>
                  <th style={{ ...th, width: 170 }}>সেকশন</th>
                </tr>
              </thead>
              <tbody>
                {data.committeeMembers.map((m, i) => {
                  const invalid = !m.name.trim() && showAll;
                  return (
                    <tr key={i} data-field={`member${i}`} data-invalid={invalid ? 'true' : undefined}>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: NAVY }}>{toBanglaNumber(m.slNo)}</td>
                      <td style={td}>
                        <input aria-label={`সদস্য ${m.slNo} নাম`} className="da-in" style={{ ...cell, ...(invalid ? { borderColor: '#dc2626', background: '#fff8f8' } : {}) }}
                          value={m.name} onChange={e => change(i, 'name', e.target.value)} />
                      </td>
                      <td style={td}><input aria-label={`সদস্য ${m.slNo} কার্ড`} className="da-in" style={cell} value={m.cardNo} onChange={e => change(i, 'cardNo', e.target.value)} /></td>
                      <td style={td}><input aria-label={`সদস্য ${m.slNo} পদবী`} className="da-in" style={cell} value={m.designation} onChange={e => change(i, 'designation', e.target.value)} /></td>
                      <td style={td}><input aria-label={`সদস্য ${m.slNo} সেকশন`} className="da-in" style={cell} value={m.section} onChange={e => change(i, 'section', e.target.value)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </FormSection>

      {deadline && (
        <Notice tone="warn">
          তদন্ত সময়সীমা: কারণ দর্শানোর তারিখ ({formatDateBn(data.showCauseDate)}) + ৫০ কর্মদিবস (শুক্রবার ও ছুটি বাদে) = <b>{formatDateBn(deadline)}</b>
        </Notice>
      )}
    </FormPage>
  );
}