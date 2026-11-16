// ─────────────────────────────────────────────────────────────────────────────
// ShowCauseForm.tsx — ধাপ ১: কারণ দর্শানো (Notice 1). Data entry only; the notice is generated from the ফলাফল sidebar.
// Path: src/components/modules/disciplinaryAction/ShowCauseForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { SUBJECT_OPTIONS, formatDateBn } from './types';
import type { DisciplinaryActionData } from './types';
import RichTextArea from './RichTextArea';
import { FormPage, FormSection, Field } from './FormPage';
import type { FormCheck } from './FormPage';
import { inputStyle } from './formStyles';

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
}

export default function ShowCauseForm({ data, setData }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const plainComplaint = data.complaint.replace(/<[^>]+>/g, '').trim();
  const checks: FormCheck[] = [
    { name: 'employeeName', label: 'কর্মীর নাম', section: 'person', ok: !!data.employeeName.trim() },
    { name: 'cardNo', label: 'কার্ড নং', section: 'person', ok: !!data.cardNo.trim() },
    { name: 'showCauseDate', label: 'কারণ দর্শানোর তারিখ', section: 'notice', ok: !!data.showCauseDate },
    { name: 'complaint', label: 'অভিযোগ', section: 'notice', ok: plainComplaint !== '' },
  ];

  return (
    <FormPage
      step="১"
      checks={checks}
      title="কারণ দর্শানো"
      subtitle="কর্মীর তথ্য ও অভিযোগ — নোটিশ ১ এর ভিত্তি"
      reference={data.referenceNo || undefined}
    >
      <FormSection id="person" no="১" title="কর্মীর সাধারণ তথ্য" hint="যে কর্মীর বিরুদ্ধে অভিযোগ — নাম, কার্ড নং, পদবী ও যোগদান">
        <div className="da-form-grid">
          <Field label="কর্মীর নাম" required name="employeeName" missing={!data.employeeName.trim()}>
            <input style={inputStyle} value={data.employeeName} onChange={e => set('employeeName', e.target.value)} />
          </Field>
          <Field label="কার্ড নং" required name="cardNo" missing={!data.cardNo.trim()}>
            <input style={inputStyle} value={data.cardNo} onChange={e => set('cardNo', e.target.value)} />
          </Field>
          <Field label="পদবী">
            <input style={inputStyle} value={data.designation} onChange={e => set('designation', e.target.value)} />
          </Field>
          <Field label="সেকশন">
            <input style={inputStyle} value={data.section} onChange={e => set('section', e.target.value)} />
          </Field>
          <Field label="যোগদানের তারিখ">
            <input type="date" style={inputStyle} value={data.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection id="notice" no="২" title="নোটিশ ও অভিযোগ" hint="কারণ দর্শানোর তারিখ থেকেই জবাবের সময় ও তদন্ত সময়সীমা হিসাব হয়">
        <div className="da-form-grid">
          <Field label="কারণ দর্শানোর তারিখ" required name="showCauseDate" missing={!data.showCauseDate} hint={data.showCauseDate ? `${formatDateBn(data.showCauseDate)} ইং` : undefined}>
            <input type="date" style={inputStyle} value={data.showCauseDate} onChange={e => set('showCauseDate', e.target.value)} />
          </Field>
          <Field label="বিষয়" required>
            <select style={inputStyle} value={data.subject} onChange={e => set('subject', e.target.value as DisciplinaryActionData['subject'])}>
              {SUBJECT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="অভিযোগ" required wide name="complaint" missing={plainComplaint === ''} hint="নোটিশে অনুচ্ছেদ হিসেবে ছাপা হয়">
            <RichTextArea
              value={data.complaint}
              onChange={v => set('complaint', v)}
              rows={4}
              placeholder="যে অভিযোগের ভিত্তিতে এই নোটিশ জারি করা হচ্ছে তা লিখুন"
            />
          </Field>
        </div>
      </FormSection>
    </FormPage>
  );
}