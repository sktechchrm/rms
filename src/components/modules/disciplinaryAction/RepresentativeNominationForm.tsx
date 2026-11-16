// ─────────────────────────────────────────────────────────────────────────────
// RepresentativeNominationForm.tsx — ধাপ ৩: প্রতিনিধি মনোনয়ন (Notice 2). The count sizes the committee table in ধাপ ৪.
// Path: src/components/modules/disciplinaryAction/RepresentativeNominationForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { calculateRepresentativeCount, formatDateBn, resizeCommitteeMembers } from './types';
import type { DisciplinaryActionData } from './types';
import { FormPage, FormSection, Field, Notice } from './FormPage';
import type { FormCheck } from './FormPage';
import { inputStyle } from './formStyles';

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
}

export default function RepresentativeNominationForm({ data, setData }: Props) {
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const repCount = calculateRepresentativeCount(memberCount);

  const checks: FormCheck[] = [
    { name: 'numberOfCommitteeMembers', label: 'কমিটি সদস্য সংখ্যা', section: 'committee', ok: memberCount > 0 },
    { name: 'notice2Date', label: 'নোটিশ ২ ইস্যুর তারিখ', section: 'committee', ok: !!data.notice2Date },
  ];

  // Resizes the committee table at once, so ধাপ ৪ is never empty after a count is entered.
  const handleCount = (value: string) => {
    const n = Number(value) || 0;
    setData({ ...data, numberOfCommitteeMembers: value, committeeMembers: resizeCommitteeMembers(data.committeeMembers, n) });
  };

  return (
    <FormPage step="৩" title="প্রতিনিধি মনোনয়ন" subtitle="তদন্ত কমিটির সদস্য সংখ্যা ও নোটিশ ২ এর তারিখ" reference={data.referenceNo || undefined} checks={checks}>
      <FormSection id="committee" no="১" title="কমিটি গঠন" hint="সদস্য সংখ্যা দিলে ধাপ ৪-এর সদস্য-তালিকা স্বয়ংক্রিয়ভাবে তৈরি হবে">
        <div className="da-form-grid">
          <Field label="কমিটি সদস্য সংখ্যা" required name="numberOfCommitteeMembers" missing={memberCount <= 0}>
            <input type="number" min={1} step={1} className="da-in" style={inputStyle} value={data.numberOfCommitteeMembers} onChange={e => handleCount(e.target.value)} />
          </Field>
          <Field label="নোটিশ ২ ইস্যুর তারিখ" required name="notice2Date" missing={!data.notice2Date}
            hint={data.notice2Date ? `${formatDateBn(data.notice2Date)} ইং` : undefined}>
            <input type="date" className="da-in" style={inputStyle} value={data.notice2Date} onChange={e => setData({ ...data, notice2Date: e.target.value })} />
          </Field>
        </div>
      </FormSection>

      {memberCount > 0 && (
        <Notice tone="info">
          মোট <b>{memberCount} জন</b> সদস্যের মধ্যে <b>{repCount} জন</b> শ্রমিক প্রতিনিধি হতে হবে (৫০%, ঊর্ধ্বে রাউন্ড করা)।
        </Notice>
      )}
    </FormPage>
  );
}