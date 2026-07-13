// ─────────────────────────────────────────────────────────────────────────────
// TrainerManager.tsx — Trainer Master List. Deliberately simpler than
// this app's other managers (form + inline list in one component, no
// separate Statement/PrintView) — a reusable reference list is a
// lighter-weight tool than a tracking workflow, matching its actual
// complexity rather than forcing the full pattern onto it.
// Path: src/components/modules/trainerList/TrainerManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import ModuleShell from '../../shell/ModuleShell';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { toDateInput } from '../../../utils/dateUtils';
import type { TrainerData, TrainerType } from './types';
import { blankTrainerData, TRAINER_TYPE_OPTIONS } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 13, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, fontFamily: font, color: '#1e293b', display: 'block', marginBottom: 6,
};
const fieldWrap: React.CSSProperties = { marginBottom: 16 };
const thS: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', textAlign: 'left',
};
const tdS: React.CSSProperties = {
  padding: '8px 10px', fontSize: 12.5, fontFamily: font, color: '#1e293b', borderBottom: '1px solid #e2e8f0',
};

const STEPS = [
  { id: 'form', label: 'প্রশিক্ষক তথ্য', icon: 'ti-user-star' },
];

function recordToFormData(rec: Record<string, unknown>, prev: TrainerData): TrainerData {
  return {
    ...prev,
    trainerName:     String(rec.trainerName ?? ''),
    trainerType:     (rec.trainerType === 'External' ? 'External' : 'Internal') as TrainerType,
    designation:     String(rec.designation ?? ''),
    specialization:  String(rec.specialization ?? ''),
    organization:    String(rec.organization ?? ''),
    contactNumber:   String(rec.contactNumber ?? ''),
    email:           String(rec.email ?? ''),
    remarks:         String(rec.remarks ?? ''),
    date:            toDateInput(rec.date) || prev.date,
  };
}

export default function TrainerManager() {
  const factory  = useFactory();
  const { user } = useAuth();
  const sheets = useDatabase('trainers', factory.id, user?.name ?? 'unknown', 500);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [data, setData] = useState<TrainerData>(blankTrainerData());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameBn, factoryAddress: factory.addressBn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const set = <K extends keyof TrainerData>(field: K, value: TrainerData[K]) => setData({ ...data, [field]: value });

  const handleReset = () => {
    setData(prev => ({ ...blankTrainerData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    sheets.setEditingId(null);
  };

  const buildRecord = () => ({
    trainerName: data.trainerName, trainerType: data.trainerType, designation: data.designation,
    specialization: data.specialization, organization: data.organization,
    contactNumber: data.contactNumber, email: data.email, remarks: data.remarks,
    date: data.date, preparedBy: authorization.preparedBy, preparedByDesignation: authorization.preparedByDesignation,
  });

  return (
    <ModuleShell
      moduleName="প্রশিক্ষক তালিকা"
      moduleNameEn="Trainer Master List"
      date={data.date}
      onDateChange={d => setData(p => ({ ...p, date: d }))}

      steps={STEPS}
      activeStep="form"
      onStepChange={() => {}}

      onSave={async () => {
        const record = buildRecord();
        const ok = sheets.editingId ? await sheets.update(sheets.editingId, record) : await sheets.save(record);
        if (ok) handleReset();
        return ok;
      }}
      isSaving={sheets.isSaving}
      configured={sheets.configured}
      adapterName={sheets.adapterName}
      saveDisabled={!data.trainerName}

      editingId={sheets.editingId}
      onCancelEdit={handleReset}
      onReset={handleReset}

      onUpdate={rec => { sheets.setEditingId(String(rec.id ?? '')); setData(p => recordToFormData(rec, p)); }}
      updateModule="trainers"
      updateLabel="প্রশিক্ষক খুঁজুন"
      updateSearchPlaceholder="নাম দিয়ে খুঁজুন..."

      calcRows={[
        { label: 'প্রশিক্ষক', value: data.trainerName || '—' },
        { label: 'ধরন',      value: data.trainerType },
        { label: 'মোট প্রশিক্ষক', value: `${sheets.records.length} জন` },
      ]}

      records={sheets.records}
      isLoading={sheets.isLoading}
      onLoadRecord={rec => { sheets.setEditingId(String(rec.id ?? '')); setData(p => recordToFormData(rec as Record<string, unknown>, p)); }}
      onDeleteRecord={sheets.remove}
      onReload={sheets.reload}

      auth={authorization}
      onAuthChange={setAuthorization}
      lang="bn"
    >
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>প্রশিক্ষকের নাম *</label>
            <input value={data.trainerName} onChange={e => set('trainerName', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>ধরন</label>
            <select value={data.trainerType} onChange={e => set('trainerType', e.target.value as TrainerType)} style={inputStyle}>
              {TRAINER_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>পদবী</label>
            <input value={data.designation} onChange={e => set('designation', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>প্রতিষ্ঠান (External হলে)</label>
            <input value={data.organization} onChange={e => set('organization', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>ফোন</label>
            <input value={data.contactNumber} onChange={e => set('contactNumber', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>ইমেইল</label>
            <input value={data.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>বিশেষজ্ঞতার বিষয়</label>
          <input value={data.specialization} onChange={e => set('specialization', e.target.value)} placeholder="যেমনঃ স্বাস্থ্য ও নিরাপত্তা, মেশিন সেফটি" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>মন্তব্য</label>
          <textarea value={data.remarks} onChange={e => set('remarks', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e3a5f', borderBottom: '1px solid #e2e8f0' }}>
          সংরক্ষিত প্রশিক্ষক তালিকা ({sheets.records.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={thS}>নাম</th>
                <th style={thS}>ধরন</th>
                <th style={thS}>বিশেষজ্ঞতা</th>
                <th style={thS}>ফোন</th>
                <th style={{ ...thS, width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheets.records.length === 0 && (
                <tr><td colSpan={5} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো প্রশিক্ষক যোগ করা হয়নি</td></tr>
              )}
              {sheets.records.map((r: DbRecord) => {
                const id = String(r.id ?? '');
                return (
                  <tr key={id}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{String(r.trainerName ?? '—')}</td>
                    <td style={tdS}>{String(r.trainerType ?? '—')}</td>
                    <td style={tdS}>{String(r.specialization ?? '—')}</td>
                    <td style={tdS}>{String(r.contactNumber ?? '—')}</td>
                    <td style={tdS}>
                      {confirmDeleteId === id ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 11 }}>Sure?</span>
                          <button onClick={() => { sheets.remove(id); setConfirmDeleteId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { sheets.setEditingId(id); setData(p => recordToFormData(r as unknown as Record<string, unknown>, p)); }} title="Edit" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button>
                          <button onClick={() => setConfirmDeleteId(id)} title="Delete" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
