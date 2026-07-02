// ─────────────────────────────────────────────────────────────────────────────
// BasicInfoSection.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, memo, useState, useRef, useCallback } from 'react';
import {
  MeetingMinutes,
  MEETING_TYPES,
  generateMeetingNumber,
  Committee,
  Attendee,
  AgendaItem,
  generateId,
} from './MeetingMinutesTypes';
import { ALL_FACTORIES } from '../../factories/FactoryRegistry';
import { useFactory } from '../../hooks/useFactory';
import { AGENDA_SUGGESTIONS } from './Agendasuggestions';

// ── Venue quick-pick options ───────────────────────────────────────────────
const VENUE_OPTIONS = [
  'কনফারেন্স রুম', 'কনফারেন্স হল', 'বোর্ড রুম',
  'ট্রেনিং রুম', 'ডাইনিং হল', 'কারখানার প্রধান কক্ষ',
  'মিটিং রুম', 'অডিটোরিয়াম',
];

// ── Gender tally helper ────────────────────────────────────────────────────
function computeCommitteeGender(committee: Committee | undefined) {
  if (!committee) return { male: 0, female: 0, total: 0 };
  const all: string[] = [];
  if (committee.chairpersonGender) all.push(committee.chairpersonGender);
  if (committee.secretaryGender)   all.push(committee.secretaryGender);
  for (const m of committee.members ?? []) if (m.gender) all.push(m.gender);
  return {
    male:   all.filter(g => g === 'পুরুষ').length,
    female: all.filter(g => g === 'মহিলা').length,
    total:  all.length,
  };
}

function addHours(timeStr: string, hours: number): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const endH = (h + hours) % 24;
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timePeriod(timeStr: string): { text: string; bg: string; color: string } | null {
  if (!timeStr) return null;
  const h = parseInt(timeStr.split(':')[0]);
  return h >= 12
    ? { text: 'বিকাল', bg: '#e0e7ff', color: '#4338ca' }
    : { text: 'সকাল',  bg: '#fef3c7', color: '#92400e' };
}

const BANGLA_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
function toBangla(n: number): string {
  return String(n).split('').map(d => BANGLA_DIGITS[parseInt(d)] ?? d).join('');
}

function blankAgendaItem(index: number): AgendaItem {
  return {
    id:            generateId(),
    itemNumber:    String(index),
    topic:         '',
    presenter:     '',
    timeAllocated: '',
    discussion:    '',
    decisions:     [],
    actionItems:   [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AgendaPickerModal — full-screen modal with search + list
// ─────────────────────────────────────────────────────────────────────────────
interface ModalProps {
  onSelect: (topic: string) => void;
  onClose:  () => void;
  currentValue: string;
}

function AgendaPickerModal({ onSelect, onClose, currentValue }: ModalProps) {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on open
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 80);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = search.trim()
    ? AGENDA_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(search.toLowerCase()) || s.includes(search)
      )
    : AGENDA_SUGGESTIONS;

  return (
    <>
      {/* Backdrop */}
      <div className="apm-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="apm-modal" role="dialog" aria-modal="true" aria-label="আলোচ্যসূচি নির্বাচন">

        {/* Header */}
        <div className="apm-header">
          <div className="apm-header-left">
            <i className="ti ti-list-check" />
            <span>আলোচ্যসূচি নির্বাচন করুন</span>
            <span className="apm-count">{filtered.length}টি বিষয়</span>
          </div>
          <button className="apm-close" onClick={onClose} title="বন্ধ করুন">
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Search */}
        <div className="apm-search-wrap">
          <i className="ti ti-search apm-search-icon" />
          <input
            ref={searchRef}
            type="text"
            className="apm-search"
            placeholder="বিষয় খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            lang="bn"
          />
          {search && (
            <button className="apm-search-clear" onClick={() => setSearch('')}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        {/* List */}
        <ul className="apm-list">
          {filtered.length === 0 && (
            <li className="apm-empty">কোনো বিষয় পাওয়া যায়নি</li>
          )}
          {filtered.map((s, i) => (
            <li
              key={i}
              className={`apm-item ${currentValue === s ? 'apm-item-active' : ''}`}
              onClick={() => { onSelect(s); onClose(); }}
            >
              <span className="apm-item-num">{toBangla(i + 1)}</span>
              <span className="apm-item-text">{s}</span>
              {currentValue === s && (
                <i className="ti ti-check apm-item-check" />
              )}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="apm-footer">
          <span className="apm-footer-hint">
            <i className="ti ti-keyboard" /> Esc চাপলে বন্ধ হবে
          </span>
          <button className="apm-cancel-btn" onClick={onClose}>বাতিল</button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AgendaInput — row input + modal trigger button
// ─────────────────────────────────────────────────────────────────────────────
interface AgendaInputProps {
  value:    string;
  onChange: (v: string) => void;
}

function AgendaInput({ value, onChange }: AgendaInputProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = useCallback((topic: string) => {
    onChange(topic);
  }, [onChange]);

  return (
    <>
      <div className="ai-wrap">
        <input
          type="text"
          className="bis-ag-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="আলোচ্যসূচি লিখুন..."
          lang="bn"
        />
        <button
          className="ai-pick-btn"
          onClick={() => setModalOpen(true)}
          title="তালিকা থেকে নির্বাচন করুন"
          type="button"
        >
          <i className="ti ti-layout-list" />
        </button>
      </div>

      {modalOpen && (
        <AgendaPickerModal
          currentValue={value}
          onSelect={handleSelect}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  minutes:    MeetingMinutes;
  setMinutes: (data: MeetingMinutes) => void;
}

function BasicInfoSection({ minutes, setMinutes }: Props) {
  const factory = useFactory();

  useEffect(() => {
    const f = ALL_FACTORIES.find(f => f.id === factory.id) ?? ALL_FACTORIES[0];
    if (f) setMinutes({
      ...minutes,
      organizationName:    f.name,
      organizationAddress: f.address,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const update = (patch: Partial<MeetingMinutes>) => setMinutes({ ...minutes, ...patch });

  // ── Agenda CRUD ────────────────────────────────────────────────────────────
  const addAgendaItem = () => update({
    agendaItems: [...minutes.agendaItems, blankAgendaItem(minutes.agendaItems.length + 1)],
  });

  const updateAgendaTopic = (id: string, topic: string) => update({
    agendaItems: minutes.agendaItems.map(a => a.id === id ? { ...a, topic } : a),
  });

  const removeAgendaItem = (id: string) => update({
    agendaItems: minutes.agendaItems
      .filter(a => a.id !== id)
      .map((a, i) => ({ ...a, itemNumber: String(i + 1) })),
  });

  // ── Committee selection ────────────────────────────────────────────────────
  const handleCommitteeSelect = (committeeId: string) => {
    const src = (ALL_FACTORIES.find(f => f.name === minutes.organizationName) ?? ALL_FACTORIES[0])
      ?.committees ?? ALL_FACTORIES.flatMap(f => f.committees);
    const c = src.find(c => c.id === committeeId);
    if (!c) return;
    update({
      meetingTitle:         c.name,
      meetingEstablishDate: c.establishDate ?? minutes.meetingEstablishDate,
      meetingNumber:        generateMeetingNumber(),
      chairperson:          c.chairperson,
      secretary:            c.secretary,
      attendees:            buildAttendeesFromCommittee(c),
    });
  };

  const buildAttendeesFromCommittee = (c: Committee): Attendee[] => {
    const fromCommittee: Attendee[] = [
      {
        id: generateId(), name: c.chairperson,
        designation: c.chairpersonDesignation ?? '', department: c.chairpersonDept ?? '',
        email: '', attendanceStatus: 'Present', committeeRole: 'সভাপতি',
      },
      {
        id: generateId(), name: c.secretary,
        designation: c.secretaryDesignation ?? '', department: c.secretaryDept ?? '',
        email: '', attendanceStatus: 'Present', committeeRole: 'সচিব',
      },
      ...(c.members ?? []).map(m => ({
        id: generateId(), name: m.name,
        designation: m.designation, department: m.section,
        email: '', attendanceStatus: 'Present' as const,
        committeeRole: m.role ?? 'সদস্য',
      })),
    ];
    const guestRows: Attendee[] = Array.from({ length: 5 }, () => ({
      id: generateId(), name: '', designation: '', department: '',
      email: '', attendanceStatus: 'Present' as const, committeeRole: 'অতিথি',
    }));
    return [...fromCommittee, ...guestRows];
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const selectedFactory   = ALL_FACTORIES.find(f => f.name === minutes.organizationName);
  const committeeSource   = selectedFactory
    ? selectedFactory.committees
    : ALL_FACTORIES.flatMap(f => f.committees);
  const selectedCommittee = committeeSource.find(c => c.name === minutes.meetingTitle);
  const genderCount       = computeCommitteeGender(selectedCommittee);
  const startPeriod       = timePeriod(minutes.startTime);

  return (
    <div className="bis-wrap">

      {/* ── Card: মিটিং সময়সূচি ── */}
      <div className="bis-card">
        <div className="bis-card-header">
          <i className="ti ti-calendar-event" aria-hidden="true" />
          <span>মিটিং সময়সূচি</span>
        </div>

        <div className="bis-body">
          <div className="bis-field bis-r1a">
            <label className="bis-label">কমিটি নির্বাচন *</label>
            <select
              className="bis-select"
              value={committeeSource.find(c => c.name === minutes.meetingTitle)?.id ?? ''}
              onChange={e => handleCommitteeSelect(e.target.value)}
            >
              <option value="">— কমিটি নির্বাচন করুন —</option>
              {committeeSource.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCommittee && (
              <p className="bis-hint bis-hint-green">
                ✓ সভাপতি: {selectedCommittee.chairperson} · সচিব: {selectedCommittee.secretary}
                {genderCount.total > 0 && (
                  <span> · মোট {genderCount.total} জন
                    (<span style={{ color: '#db2777' }}>নারী {genderCount.female}</span>
                    {' / '}
                    <span style={{ color: '#1d4ed8' }}>পুরুষ {genderCount.male}</span>)
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="bis-field bis-r1b">
            <label className="bis-label">মিটিং ধরন *</label>
            <select
              className="bis-select"
              value={minutes.meetingType}
              onChange={e => update({ meetingType: e.target.value as MeetingMinutes['meetingType'] })}
            >
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="bis-field bis-r2a">
            <label className="bis-label">স্থান *</label>
            <input
              type="text"
              className="bis-input"
              value={minutes.venue}
              onChange={e => update({ venue: e.target.value })}
              placeholder="কনফারেন্স রুম"
              list="bis-venue-list"
              lang="bn"
            />
            <datalist id="bis-venue-list">
              {VENUE_OPTIONS.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          <div className="bis-field bis-r2b">
            <label className="bis-label">মিটিং তারিখ *</label>
            <input
              type="date"
              className="bis-input"
              value={minutes.meetingDate}
              onChange={e => update({ meetingDate: e.target.value })}
            />
          </div>

          <div className="bis-field bis-r2c">
            <label className="bis-label">শুরু *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="time"
                className="bis-input"
                value={minutes.startTime}
                onChange={e => {
                  const v = e.target.value;
                  update({ startTime: v, endTime: addHours(v, 2) });
                }}
                style={{ paddingRight: startPeriod ? 72 : 12 }}
              />
              {startPeriod && (
                <span className="bis-time-badge"
                  style={{ background: startPeriod.bg, color: startPeriod.color }}>
                  {startPeriod.text}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Card: আলোচ্যসূচি ── */}
      <div className="bis-card" style={{ marginTop: 16 }}>
        <div className="bis-card-header">
          <i className="ti ti-list-check" aria-hidden="true" />
          <span>আলোচ্যসূচি</span>
          <button className="bis-add-btn" onClick={addAgendaItem}>
            <i className="ti ti-plus" aria-hidden="true" /> যোগ করুন
          </button>
        </div>

        <table className="bis-ag-table">
          <colgroup>
            <col style={{ width: 52 }} />
            <col />
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              <th>ক্রম</th>
              <th style={{ textAlign: 'left' }}>আলোচ্যসূচি</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {minutes.agendaItems.length === 0 && (
              <tr>
                <td colSpan={3} className="bis-ag-empty">
                  কোনো আলোচ্যসূচি নেই — উপরে + যোগ করুন চাপুন
                </td>
              </tr>
            )}
            {minutes.agendaItems.map((item, i) => (
              <tr key={item.id}>
                <td className="bis-ag-sl">{toBangla(i + 1).padStart(2, '০')}</td>
                <td className="bis-ag-topic">
                  <AgendaInput
                    value={item.topic}
                    onChange={v => updateAgendaTopic(item.id, v)}
                  />
                </td>
                <td className="bis-ag-del">
                  <button
                    className="bis-ag-del-btn"
                    onClick={() => removeAgendaItem(item.id)}
                    title="মুছুন"
                  >
                    <i className="ti ti-x" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .bis-wrap { width: 100%; display: flex; flex-direction: column; gap: 0; }

        .bis-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 12px; overflow: hidden;
        }
        .bis-card-header {
          display: flex; align-items: center; gap: 9px;
          padding: 13px 22px;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          font-size: 11.5px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .bis-card-header i { font-size: 16px; color: #94a3b8; }

        .bis-body {
          padding: 22px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 18px;
        }
        .bis-r1a { grid-column: span 4; }
        .bis-r1b { grid-column: span 2; }
        .bis-r2a { grid-column: span 2; }
        .bis-r2b { grid-column: span 2; }
        .bis-r2c { grid-column: span 2; }

        @media (min-width: 640px) and (max-width: 1023px) {
          .bis-body { grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px; }
          .bis-r1a { grid-column: span 1; }
          .bis-r1b { grid-column: span 1; }
          .bis-r2a { grid-column: span 1; }
          .bis-r2b { grid-column: span 1; }
          .bis-r2c { grid-column: 1 / -1; }
        }
        @media (max-width: 639px) {
          .bis-body { grid-template-columns: 1fr; gap: 12px; padding: 14px; }
          .bis-r1a, .bis-r1b, .bis-r2a, .bis-r2b, .bis-r2c { grid-column: 1; }
        }

        .bis-field { display: flex; flex-direction: column; gap: 6px; }
        .bis-label {
          font-size: 11px; font-weight: 700;
          color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;
        }
        .bis-input, .bis-select {
          width: 100%; padding: 10px 14px;
          font-size: 14px; font-family: inherit;
          border: 1px solid #e2e8f0; border-radius: 8px;
          background: #fff; color: #1e293b;
          outline: none; box-sizing: border-box;
          transition: border-color 0.14s, box-shadow 0.14s;
          min-height: 42px;
        }
        .bis-input:focus, .bis-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
        .bis-input::placeholder { color: #cbd5e1; }
        .bis-select { cursor: pointer; appearance: none; }

        .bis-time-badge {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
          pointer-events: none;
        }
        .bis-hint {
          font-size: 11.5px; color: #475569;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 6px; padding: 6px 11px; line-height: 1.5;
        }
        .bis-hint-green { background: #f0fdf4; border-color: #bbf7d0; color: #065f46; }

        .bis-add-btn {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; font-size: 12px; font-weight: 600;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe; border-radius: 6px;
          cursor: pointer; transition: background 0.12s; font-family: inherit;
          appearance: none;
        }
        .bis-add-btn:hover { background: #dbeafe; }
        .bis-add-btn i { font-size: 13px; }

        /* ── Agenda table ── */
        .bis-ag-table {
          width: 100%; border-collapse: collapse;
          font-size: 13px; table-layout: fixed;
        }
        .bis-ag-table th {
          background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 8px 12px; font-size: 11px; font-weight: 700;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
          text-align: center;
        }
        .bis-ag-table td { border: 1px solid #e2e8f0; vertical-align: middle; }
        .bis-ag-sl {
          text-align: center; font-size: 12px;
          color: #94a3b8; font-weight: 700; padding: 8px 10px;
        }
        .bis-ag-topic { padding: 4px 6px; }

        /* ── AgendaInput row ── */
        .ai-wrap {
          display: flex; align-items: center; gap: 0;
        }
        .bis-ag-input {
          flex: 1; padding: 8px 10px;
          font-size: 13px; font-family: inherit;
          border: none; outline: none; background: transparent;
          color: #1e293b; box-sizing: border-box;
        }
        .bis-ag-input:focus {
          background: #f0f9ff;
          box-shadow: inset 0 0 0 1.5px #93c5fd;
          border-radius: 4px;
        }
        .bis-ag-input::placeholder { color: #cbd5e1; }

        /* Modal trigger button */
        .ai-pick-btn {
          flex-shrink: 0;
          width: 30px; height: 30px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 6px; color: #64748b;
          cursor: pointer; font-size: 15px;
          transition: background 0.12s, color 0.12s;
          margin-right: 4px;
          appearance: none;
        }
        .ai-pick-btn:hover { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }

        .bis-ag-del { text-align: center; padding: 4px 8px; }
        .bis-ag-del-btn {
          -webkit-appearance: none !important;
          appearance: none !important;
          width: 28px; height: 28px;
          display: inline-flex; align-items: center; justify-content: center;
          background-color: #fef2f2 !important;
          border: 1.5px solid #fca5a5 !important;
          border-radius: 6px; color: #ef4444 !important;
          cursor: pointer; font-size: 14px;
          transition: background-color 0.12s;
        }
        .bis-ag-del-btn:hover {
          background-color: #fee2e2 !important;
          border-color: #f87171 !important;
        }
        .bis-ag-empty {
          text-align: center; padding: 24px;
          color: #cbd5e1; font-size: 12.5px; font-style: italic;
        }

        /* ══════════════════════════════════════════════
           AgendaPickerModal
        ══════════════════════════════════════════════ */
        .apm-backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(3px);
          z-index: 10000;
          animation: apm-fade-in 0.15s ease;
        }
        @keyframes apm-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .apm-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: min(640px, 95vw);
          max-height: 80vh;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.22);
          z-index: 10001;
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: apm-slide-up 0.18s ease;
        }
        @keyframes apm-slide-up {
          from { opacity: 0; transform: translate(-50%, -47%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }

        /* Modal header */
        .apm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .apm-header-left {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; font-weight: 700; color: #1e293b;
        }
        .apm-header-left i { font-size: 18px; color: #3b82f6; }
        .apm-count {
          font-size: 11px; font-weight: 600;
          background: #dbeafe; color: #1d4ed8;
          padding: 2px 8px; border-radius: 20px;
        }
        .apm-close {
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 8px; color: #64748b;
          cursor: pointer; font-size: 16px;
          transition: background 0.12s;
          appearance: none;
        }
        .apm-close:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

        /* Search bar */
        .apm-search-wrap {
          position: relative;
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .apm-search-icon {
          position: absolute; left: 34px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; font-size: 15px; pointer-events: none;
        }
        .apm-search {
          width: 100%; padding: 10px 40px;
          font-size: 14px; font-family: inherit;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f8fafc; color: #1e293b;
          outline: none; box-sizing: border-box;
          transition: border-color 0.14s, box-shadow 0.14s;
        }
        .apm-search:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          background: #fff;
        }
        .apm-search::placeholder { color: #94a3b8; }
        .apm-search-clear {
          position: absolute; right: 34px; top: 50%; transform: translateY(-50%);
          width: 22px; height: 22px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #e2e8f0; border: none; border-radius: 50%;
          color: #64748b; cursor: pointer; font-size: 11px;
          transition: background 0.12s;
          appearance: none;
        }
        .apm-search-clear:hover { background: #cbd5e1; }

        /* List */
        .apm-list {
          flex: 1; overflow-y: auto;
          margin: 0; padding: 8px 0;
          list-style: none;
        }
        .apm-list::-webkit-scrollbar { width: 5px; }
        .apm-list::-webkit-scrollbar-track { background: transparent; }
        .apm-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .apm-list::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

        .apm-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 11px 20px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid #f8fafc;
        }
        .apm-item:last-child { border-bottom: none; }
        .apm-item:hover { background: #eff6ff; }
        .apm-item-active { background: #f0fdf4 !important; }
        .apm-item-active:hover { background: #dcfce7 !important; }

        .apm-item-num {
          flex-shrink: 0;
          min-width: 24px; height: 24px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #f1f5f9; border-radius: 50%;
          font-size: 10px; font-weight: 700; color: #64748b;
          margin-top: 1px;
        }
        .apm-item-active .apm-item-num {
          background: #bbf7d0; color: #065f46;
        }
        .apm-item-text {
          flex: 1; font-size: 13px; line-height: 1.6; color: #1e293b;
        }
        .apm-item:hover .apm-item-text { color: #1d4ed8; }
        .apm-item-check {
          flex-shrink: 0; font-size: 15px;
          color: #16a34a; margin-top: 3px;
        }

        .apm-empty {
          text-align: center; padding: 40px;
          color: #94a3b8; font-size: 13px; font-style: italic;
        }

        /* Modal footer */
        .apm-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .apm-footer-hint {
          font-size: 11.5px; color: #94a3b8;
          display: flex; align-items: center; gap: 5px;
        }
        .apm-footer-hint i { font-size: 13px; }
        .apm-cancel-btn {
          padding: 6px 18px; font-size: 13px; font-weight: 600;
          background: #fff; color: #64748b;
          border: 1px solid #e2e8f0; border-radius: 8px;
          cursor: pointer; font-family: inherit;
          transition: background 0.12s;
          appearance: none;
        }
        .apm-cancel-btn:hover { background: #f1f5f9; }
      `}</style>
    </div>
  );
}

export default memo(BasicInfoSection);