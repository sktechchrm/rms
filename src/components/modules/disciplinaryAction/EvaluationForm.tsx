// ─────────────────────────────────────────────────────────────────────────────
// EvaluationForm.tsx — ধাপ ৫: মূল্যায়ন (প্রতিবেদন ও সুপারিশ). Rich text matches what the print output renders.
// Path: src/components/modules/disciplinaryAction/EvaluationForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { formatDateBn } from './types';
import type { DisciplinaryActionData } from './types';
import RichTextArea from './RichTextArea';
import { FormPage, FormSection, Field } from './FormPage';
import type { FormCheck } from './FormPage';
import { inputStyle } from './formStyles';

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
}

const plain = (html: string) => html.replace(/<[^>]+>/g, '').trim();

export default function EvaluationForm({ data, setData }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const checks: FormCheck[] = [
    { name: 'evaluationDate', label: 'প্রতিবেদনের তারিখ', section: 'date', ok: !!data.evaluationDate },
    { name: 'investigationReportSummary', label: 'সারাংশ', section: 'report', ok: plain(data.investigationReportSummary) !== '' },
    { name: 'recommendation', label: 'সুপারিশ', section: 'report', ok: plain(data.recommendation) !== '' },
  ];

  return (
    <FormPage step="৫" title="মূল্যায়ন" subtitle="তদন্ত কমিটির প্রতিবেদনের সারাংশ ও সুপারিশ" reference={data.referenceNo || undefined} checks={checks}>
      <FormSection id="date" no="১" title="প্রতিবেদনের তারিখ">
        <div style={{ maxWidth: 300 }}>
          <Field label="প্রতিবেদনের তারিখ" required name="evaluationDate" missing={!data.evaluationDate}
            hint={data.evaluationDate ? `${formatDateBn(data.evaluationDate)} ইং` : undefined}>
            <input type="date" className="da-in" style={inputStyle} value={data.evaluationDate} onChange={e => set('evaluationDate', e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection id="report" no="২" title="প্রতিবেদন ও সুপারিশ" hint="বিস্তারিত সারাংশ এবং কমিটির সুপারিশ — উভয়ই নোটিশে ছাপা হবে">
        <div className="da-form-grid">
          <Field label="সারাংশ (বিস্তারিত প্রতিবেদন)" required wide name="investigationReportSummary" missing={plain(data.investigationReportSummary) === ''}>
            <RichTextArea
              value={data.investigationReportSummary}
              onChange={v => set('investigationReportSummary', v)}
              rows={6}
              placeholder="গত ২ জুলাই ২০২৬ইং তারিখ ... তদন্ত কমিটির পর্যালোচনার ভিত্তিতে ..."
            />
          </Field>
          <Field label="সুপারিশ" required wide name="recommendation" missing={plain(data.recommendation) === ''}>
            <RichTextArea
              value={data.recommendation}
              onChange={v => set('recommendation', v)}
              rows={4}
              placeholder="তদন্ত কমিটির সুপারিশ লিখুন..."
            />
          </Field>
        </div>
      </FormSection>
    </FormPage>
  );
}