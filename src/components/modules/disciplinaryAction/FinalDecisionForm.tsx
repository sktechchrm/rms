// ─────────────────────────────────────────────────────────────────────────────
// FinalDecisionForm.tsx — ধাপ ৬: চূড়ান্ত সিদ্ধান্ত (Notice 4). Notice 4's date is derived from the evaluation date.
// Path: src/components/modules/disciplinaryAction/FinalDecisionForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { formatDateBn, calculateNotice4Date } from './types';
import type { DisciplinaryActionData } from './types';
import RichTextArea from './RichTextArea';
import { FormPage, FormSection, Field, Notice } from './FormPage';
import type { FormCheck } from './FormPage';
import { font, inputStyle } from './formStyles';

const PUNISHMENT_OPTIONS = [
  'বরখাস্ত',
  'বরখাস্ত [ধারা ২৩-এর ৪(খ/ছ)]',
  'অপসারণ',
  'নিচের পদে, গ্রেডে বা বেতন স্কেলে অনধিক এক বৎসর পর্যন্ত আনয়ন',
  'অনধিক এক বৎসরের জন্য পদোন্নতি বন্ধ',
  'অনধিক এক বৎসরের জন্য মজুরী বৃদ্ধি বন্ধ',
  'জরিমানা',
  'অনধিক সাত দিন পর্যন্ত বিনা মজুরীতে বা বিনা খোরাকীতে সাময়িক বরখাস্ত',
  'ভর্ৎসনা ও সতর্কীকরণ',
];

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
  festivalHolidays: string[];
}

const plain = (html: string) => html.replace(/<[^>]+>/g, '').trim();

export default function FinalDecisionForm({ data, setData, festivalHolidays }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const notice4Date = calculateNotice4Date(data.evaluationDate, festivalHolidays);

  const checks: FormCheck[] = [
    { name: 'finalDecision', label: 'চূড়ান্ত সিদ্ধান্ত', section: 'decision', ok: plain(data.finalDecision) !== '' },
    { name: 'punishmentType', label: 'শাস্তি / দণ্ড', section: 'decision', ok: !!data.punishmentType },
    { name: 'evaluationDate', label: 'মূল্যায়নের তারিখ', section: 'decision', ok: !!data.evaluationDate },
  ];

  return (
    <FormPage step="৬" title="চূড়ান্ত সিদ্ধান্ত" subtitle="কর্তৃপক্ষের সিদ্ধান্ত ও শাস্তির ধরন — নোটিশ ৪ এ ছাপা হবে" reference={data.referenceNo || undefined} checks={checks}>
      {!data.evaluationDate && (
        <Notice tone="warn">প্রথমে «মূল্যায়ন» ধাপে প্রতিবেদনের তারিখ দিন — নোটিশ ৪-এর তারিখ সেখান থেকে স্বয়ংক্রিয়ভাবে হিসাব হবে।</Notice>
      )}

      <FormSection id="decision" no="১" title="চূড়ান্ত সিদ্ধান্ত ও শাস্তি">
        <div className="da-form-grid">
          <Field label="চূড়ান্ত সিদ্ধান্ত" required wide name="finalDecision" missing={plain(data.finalDecision) === ''}>
            <RichTextArea
              value={data.finalDecision}
              onChange={v => set('finalDecision', v)}
              rows={5}
              placeholder="কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত লিখুন..."
            />
          </Field>
          <Field label="শাস্তি / দণ্ড" required name="punishmentType" missing={!data.punishmentType} hint="নোটিশ ৪-এ এই শাস্তিই ছাপা হবে">
            <select className="da-in" style={inputStyle} value={data.punishmentType || ''} onChange={e => set('punishmentType', e.target.value)}>
              <option value="">— শাস্তি নির্বাচন করুন —</option>
              {PUNISHMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="মূল্যায়নের তারিখ" required name="evaluationDate" missing={!data.evaluationDate} hint="«মূল্যায়ন» ধাপ থেকে আসে">
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#f8fafc', fontWeight: 700 }}>
              {data.evaluationDate ? `${formatDateBn(data.evaluationDate)} ইং` : '—'}
            </div>
          </Field>
          <Field label="নোটিশ ৪ ইস্যুর তারিখ" hint="মূল্যায়নের তারিখের পরবর্তী কর্মদিবস — স্বয়ংক্রিয়">
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#f8fafc', fontWeight: 700, fontFamily: font }}>
              {notice4Date ? `${formatDateBn(notice4Date)} ইং` : '—'}
            </div>
          </Field>
        </div>
      </FormSection>
    </FormPage>
  );
}