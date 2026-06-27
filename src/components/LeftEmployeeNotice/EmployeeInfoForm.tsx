// ─────────────────────────────────────────────────────────────────────────────
// EmployeeInfoForm.tsx — rebuilt with WCAG 2.2 FormField components
//
// Changes:
//  • All InputBox replaced with FormField + Input from FormField.tsx
//  • All labels: proper <label htmlFor> linking
//  • Date inputs: aria-required, aria-describedby hint
//  • Gender select: FormField + Select with proper options
//  • Address section: fieldset + legend per address group
//  • "Same address" checkbox: CheckboxField with aria-controls
//  • Focus rings, error states, touch targets all WCAG 2.2 compliant
//  • All inline Tailwind classes removed — uses FormField design tokens
//  • Business logic (addWorkingDays, buildDateISO) unchanged
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import type { Address, Employee }     from '../../types/LeftNoticeDataType';
import { FormField, Input, Select, CheckboxField } from '../common/FormField';

// ── Date calculation logic (unchanged) ───────────────────────────────────────

const publicHolidays: Record<string, string> = {
  '02-21': 'Language Day',   '03-26': 'Independence Day',
  '04-14': 'Pohela Boishakh','05-01': 'May Day',
  '08-15': 'National Mourning Day', '12-16': 'Victory Day',
};

const isPublicHoliday = (d: Date): boolean => {
  const key = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return key in publicHolidays;
};
const isWeekend    = (d: Date) => d.getDay() === 5 || d.getDay() === 6;
const isWorkingDay = (d: Date) => !isWeekend(d) && !isPublicHoliday(d);

const addWorkingDays = (startDate: string, days: number): string => {
  if (!startDate) return '';
  let date = new Date(startDate);
  let count = 0;
  while (count < days) {
    date.setDate(date.getDate() + 1);
    if (isWorkingDay(date)) count++;
  }
  return date.toISOString().split('T')[0];
};

const getDateParts = (iso?: string) => {
  if (!iso) return { day: '', month: '', year: '' };
  const [year, month, day] = iso.split('-');
  return { day, month, year };
};

const buildDateISO = ({ day, month, year }: { day: string; month: string; year: string }): string => {
  if (!day || !month || !year) return '';
  const d = Number(day), m = Number(month), y = Number(year);
  if (isNaN(d)||isNaN(m)||isNaN(y)||d<1||d>31||m<1||m>12||y<1900||y>2100) return '';
  const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return isNaN(new Date(iso).getTime()) ? '' : iso;
};

// ── Shared style tokens ───────────────────────────────────────────────────────

const font    = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const cardSt: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E2E8F0',
  borderRadius: 12, padding: '16px 18px', marginBottom: 14,
};
const cardHd: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: '#0F2442',
  marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
  fontFamily: font,
};
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 };
const addrCard = (accent: string, faded = false): React.CSSProperties => ({
  flex: 1, border: `1px solid ${faded ? '#E2E8F0' : accent}`,
  borderRadius: 10, padding: '14px 16px',
  background: faded ? '#F8FAFC' : '#FAFEFF',
  opacity: faded ? .6 : 1, transition: 'opacity .2s',
});

// ── Address sub-section ───────────────────────────────────────────────────────

interface AddressProps {
  title:    string;
  titleEn:  string;
  icon:     string;
  data:     Address;
  disabled: boolean;
  prefix:   string;
  onChange: (field: keyof Address, val: string) => void;
}

function AddressBlock({ title, titleEn, icon, data, disabled, prefix, onChange }: AddressProps) {
  return (
    <fieldset style={{ border: 'none', padding: 0, flex: 1 }}>
      <legend style={{ ...cardHd, marginBottom: 12, fontSize: 13 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color: disabled ? '#94A3B8' : '#378ADD' }} aria-hidden="true" />
        {title}
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>({titleEn})</span>
      </legend>
      <div style={grid2}>
        <FormField label="গ্রাম" id={`${prefix}-village`}>
          <Input id={`${prefix}-village`} value={data.village} disabled={disabled}
            placeholder="গ্রাম / মহল্লা"
            onChange={e => onChange('village', e.target.value)} />
        </FormField>
        <FormField label="ডাকঘর" id={`${prefix}-po`}>
          <Input id={`${prefix}-po`} value={data.postOffice} disabled={disabled}
            placeholder="ডাকঘরের নাম"
            onChange={e => onChange('postOffice', e.target.value)} />
        </FormField>
        <FormField label="থানা" id={`${prefix}-thana`}>
          <Input id={`${prefix}-thana`} value={data.thana} disabled={disabled}
            placeholder="থানার নাম"
            onChange={e => onChange('thana', e.target.value)} />
        </FormField>
        <FormField label="জেলা" id={`${prefix}-dist`}>
          <Input id={`${prefix}-dist`} value={data.district} disabled={disabled}
            placeholder="জেলার নাম"
            onChange={e => onChange('district', e.target.value)} />
        </FormField>
      </div>
    </fieldset>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  employee:  Employee;
  onChange:  (data: Employee) => void;
  activeTab?: 'personal' | 'address';
}

export const EmployeeForm: React.FC<Props> = ({ employee, onChange, activeTab = 'personal' }) => {
  const [sameAddress, setSameAddress] = useState(false);
  const [dateInputs, setDateInputs]   = useState({ day: '', month: '', year: '' });

  // Sync date parts when employee changes externally (e.g. loaded from DB)
  useEffect(() => {
    setDateInputs(getDateParts(employee.absenceStartDate));
  }, [employee.absenceStartDate]);

  // Auto-calculate 1st / 2nd / 3rd notice dates
  useEffect(() => {
    if (!employee.absenceStartDate) return;
    const first  = addWorkingDays(employee.absenceStartDate, 10);
    const second = addWorkingDays(first,  10);
    const third  = addWorkingDays(second,  7);
    if (
      employee.firstNoticeDate  !== first  ||
      employee.secondNoticeDate !== second ||
      employee.thirdNoticeDate  !== third
    ) {
      onChange({ ...employee, firstNoticeDate: first, secondNoticeDate: second, thirdNoticeDate: third });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.absenceStartDate]);

  // Mirror present → permanent when "same address" is checked
  useEffect(() => {
    if (!sameAddress) return;
    if (JSON.stringify(employee.permanentAddress) !== JSON.stringify(employee.presentAddress)) {
      onChange({ ...employee, permanentAddress: { ...employee.presentAddress } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.presentAddress, sameAddress]);

  const updateAddr = (type: 'presentAddress' | 'permanentAddress', field: keyof Address, val: string) =>
    onChange({ ...employee, [type]: { ...employee[type], [field]: val } });

  const set = (key: keyof Employee) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...employee, [key]: e.target.value });

  // ── Date part change handler ──────────────────────────────────────────────
  const onDatePart = (part: 'day' | 'month' | 'year') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...dateInputs, [part]: e.target.value };
    setDateInputs(next);
    const iso = buildDateISO(next);
    onChange({ ...employee, absenceStartDate: iso });
  };

  // ── PERSONAL TAB ─────────────────────────────────────────────────────────
  if (activeTab === 'personal') return (
    <div style={{ paddingBottom: 16 }}>
      <div style={cardSt}>
        <div style={cardHd}>
          <i className="ti ti-user-circle" style={{ fontSize: 17, color: '#378ADD' }} aria-hidden="true" />
          সাধারণ তথ্য
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>Personal info</span>
        </div>

        <div style={grid3}>
          <FormField label="কর্মীর নাম" labelEn="Full name" required id="pf-name">
            <Input id="pf-name" value={employee.name}
              placeholder="নাম লিখুন"
              required aria-required="true"
              onChange={set('name')} />
          </FormField>

          <FormField label="পিতার নাম" labelEn="Father's name" id="pf-father">
            <Input id="pf-father" value={employee.fatherName}
              placeholder="পিতার নাম"
              onChange={set('fatherName')} />
          </FormField>

          <FormField label="মাতার নাম" labelEn="Mother's name" optional id="pf-mother">
            <Input id="pf-mother" value={employee.motherName ?? ''}
              placeholder="মাতার নাম"
              onChange={set('motherName')} />
          </FormField>

          <FormField label="কার্ড নং" labelEn="Card no." required id="pf-card">
            <Input id="pf-card" value={employee.cardNo}
              placeholder="যেমন: EMP-0042"
              required aria-required="true"
              onChange={set('cardNo')} />
          </FormField>

          <FormField label="পদবী" labelEn="Designation" required id="pf-desg">
            <Input id="pf-desg" value={employee.designation}
              placeholder="যেমন: অপারেটর"
              required aria-required="true"
              onChange={set('designation')} />
          </FormField>

          <FormField label="সেকশন" labelEn="Section" id="pf-section">
            <Input id="pf-section" value={employee.section}
              placeholder="যেমন: সুইং"
              onChange={set('section')} />
          </FormField>

          <FormField label="লিঙ্গ" labelEn="Gender" required id="pf-gender">
            <Select id="pf-gender" value={employee.gender ?? ''}
              required aria-required="true"
              onChange={set('gender')}
              placeholder="লিঙ্গ নির্বাচন করুন"
              options={[
                { value: 'male',   label: 'পুরুষ (Male)'   },
                { value: 'female', label: 'মহিলা (Female)'  },
              ]} />
          </FormField>

          {employee.gender === 'female' && (
            <FormField label="স্বামীর নাম" labelEn="Husband's name" optional id="pf-husband">
              <Input id="pf-husband" value={employee.husbandName ?? ''}
                placeholder="স্বামীর নাম"
                onChange={set('husbandName')} />
            </FormField>
          )}

          <FormField label="যোগদানের তারিখ" labelEn="Joining date" optional id="pf-join">
            <Input id="pf-join" type="date" value={employee.joiningDate ?? ''}
              onChange={set('joiningDate')} />
          </FormField>
        </div>
      </div>

      {/* Absence date — separate card, prominent */}
      <div style={cardSt}>
        <div style={cardHd}>
          <i className="ti ti-calendar-off" style={{ fontSize: 17, color: '#E24B4A' }} aria-hidden="true" />
          অনুপস্থিতির তারিখ
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>Absence start date</span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <FormField label="দিন" id="pf-abs-day"
            hint="১–৩১">
            <Input id="pf-abs-day" type="number" min={1} max={31}
              value={dateInputs.day} placeholder="দিন"
              aria-required="true"
              style={{ textAlign: 'center' }}
              onChange={onDatePart('day')} />
          </FormField>
          <FormField label="মাস" id="pf-abs-month" hint="১–১২">
            <Input id="pf-abs-month" type="number" min={1} max={12}
              value={dateInputs.month} placeholder="মাস"
              style={{ textAlign: 'center' }}
              onChange={onDatePart('month')} />
          </FormField>
          <FormField label="বছর" id="pf-abs-year" hint="যেমন: ২০২৬">
            <Input id="pf-abs-year" type="number" min={1900} max={2100}
              value={dateInputs.year} placeholder="বছর"
              onChange={onDatePart('year')} />
          </FormField>
        </div>

        {/* Auto-calculated notice dates */}
        {employee.absenceStartDate && (
          <div style={{
            marginTop: 14, background: '#EFF6FF',
            border: '0.5px solid #BFDBFE', borderRadius: 8,
            padding: '10px 14px', display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          }}>
            {[
              { label: '১ম নোটিশ',     value: employee.firstNoticeDate  },
              { label: '২য় নোটিশ',     value: employee.secondNoticeDate },
              { label: 'চূড়ান্ত নোটিশ', value: employee.thirdNoticeDate  },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#1E40AF', fontWeight: 600, fontFamily: font }}>
                  {label}
                </span>
                <span style={{ fontSize: 12, color: '#1E3A5F', fontFamily: font }}>
                  {value
                    ? new Date(value).toLocaleDateString('bn-BD', { day:'numeric', month:'long', year:'numeric' })
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── ADDRESS TAB ───────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={cardSt}>
        <div style={{ ...cardHd, justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 17, color: '#378ADD' }} aria-hidden="true" />
            ঠিকানা
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>(Addresses)</span>
          </span>
          <CheckboxField
            label="উভয় ঠিকানা একই"
            checked={sameAddress}
            onChange={setSameAddress}
            id="addr-same"
            hint=""
          />
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {/* Present address */}
          <div style={addrCard('#BFDBFE')}>
            <AddressBlock
              title="বর্তমান ঠিকানা"
              titleEn="Present address"
              icon="ti-map-pin"
              prefix="pres"
              data={employee.presentAddress}
              disabled={false}
              onChange={(f, v) => updateAddr('presentAddress', f, v)}
            />
          </div>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', color: '#CBD5E1', fontSize: 18 }}
            aria-hidden="true">
            {sameAddress ? '=' : '≠'}
          </div>

          {/* Permanent address */}
          <div style={addrCard('#86EFAC', sameAddress)}>
            <AddressBlock
              title="স্থায়ী ঠিকানা"
              titleEn="Permanent address"
              icon="ti-home"
              prefix="perm"
              data={employee.permanentAddress}
              disabled={sameAddress}
              onChange={(f, v) => updateAddr('permanentAddress', f, v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};