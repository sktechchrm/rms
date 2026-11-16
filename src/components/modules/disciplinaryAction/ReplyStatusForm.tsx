// ─────────────────────────────────────────────────────────────────────────────
// ReplyStatusForm.tsx — ধাপ ২: জবাব ও অবস্থা. The status choices are answers, not actions. No printed output at this step.
// Path: src/components/modules/disciplinaryAction/ReplyStatusForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DisciplinaryActionData, ReplyStatus } from './types';
import { FormPage, FormSection, Field, Notice } from './FormPage';
import { font, inputStyle } from './formStyles';

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
}

const OPTIONS: { value: Exclude<ReplyStatus, ''>; label: string; hint: string; on: string; onBg: string; onBd: string }[] = [
  { value: 'সন্তোষজনক',   label: '✓ সন্তোষজনক',   hint: 'ব্যাখ্যা গৃহীত — কেস এখানেই সমাপ্ত', on: '#15803d', onBg: '#f0fdf4', onBd: '#16a34a' },
  { value: 'অসন্তোষজনক', label: '✕ অসন্তোষজনক', hint: 'জবাব গৃহীত হয়নি — তদন্তে যাবে',     on: '#b91c1c', onBg: '#fef2f2', onBd: '#dc2626' },
];

export default function ReplyStatusForm({ data, setData }: Props) {
  const isClosed = data.replyStatus === 'সন্তোষজনক';

  return (
    <FormPage step="২" title="জবাব ও অবস্থা" subtitle="কর্মী কবে জবাব দিয়েছেন এবং ব্যবস্থাপনা কীভাবে বিবেচনা করেছে" reference={data.referenceNo || undefined} output={false}>
      <FormSection id="reply" no="১" title="জবাবের তারিখ">
        <div style={{ maxWidth: 320 }}>
          <Field label="জবাবের তারিখ" hint={data.replyDate ? undefined : 'জবাব না এলে ফাঁকা থাকবে'}>
            <input type="date" className="da-in" style={inputStyle} value={data.replyDate} onChange={e => setData({ ...data, replyDate: e.target.value })} />
          </Field>
        </div>
      </FormSection>

      <FormSection id="status" no="২" title="জবাবের অবস্থা" hint="একটি নির্বাচন করুন। আবার চাপলে নির্বাচন মুছে যাবে।">
        <div role="radiogroup" aria-label="জবাবের অবস্থা" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {OPTIONS.map(o => {
            const on = data.replyStatus === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setData({ ...data, replyStatus: on ? '' : o.value })}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: font,
                  border: `${on ? 2 : 1}px solid ${on ? o.onBd : '#cbd5e1'}`,
                  background: on ? o.onBg : '#fff', color: on ? o.on : '#475569',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800 }}>{o.label}</div>
                <div style={{ fontSize: 11.5, marginTop: 3, opacity: 0.9 }}>{o.hint}</div>
              </button>
            );
          })}
        </div>
      </FormSection>

      {isClosed && <Notice tone="success"><b>জবাব সন্তোষজনক — কেস এখানেই সমাপ্ত।</b> ধাপ ৩–৬ প্রযোজ্য নয়।</Notice>}
      {data.replyStatus === 'অসন্তোষজনক' && <Notice tone="warn">জবাব অসন্তোষজনক — পরের ধাপ «প্রতিনিধি মনোনয়ন» থেকে তদন্ত শুরু করুন।</Notice>}
    </FormPage>
  );
}