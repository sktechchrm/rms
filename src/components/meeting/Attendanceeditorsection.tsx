// ─────────────────────────────────────────────────────────────────────────────
// AttendanceEditorSection.tsx
//
// Standalone editable attendance form — separate from PrintView /
// ParticipantListSection (which are read-only/print outputs). This is the
// form step where someone actually marks who showed up:
//
//   - কমিটি সদস্য: read-only name/designation/department (auto-populated
//     from the selected committee), with a tick/untick toggle per row —
//     ticked = উপস্থিত (Present), unticked = অনুপস্থিত (Absent).
//   - অতিথি: fully editable rows (নাম / পদবি / বিভাগ) plus the same
//     tick/untick toggle. Starts with exactly one blank guest row by
//     default; "নতুন অতিথি যোগ করুন" appends more. Each guest row has a
//     remove (✕) button — removing the last remaining guest row leaves
//     zero guest rows (the section doesn't force-keep one once the user
//     has actively cleared them, only the initial default is one row).
//
// Reuses the same Attendee shape / committeeRole === 'অতিথি' tagging
// convention as BasicInfoSection.tsx, PrintView.tsx and
// ParticipantListSection.tsx, so this drops into the same minutes.attendees
// array those components already read from.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { MeetingMinutes, Attendee, generateId } from './MeetingMinutesTypes';

interface Props {
  minutes: MeetingMinutes;
  setMinutes: (m: MeetingMinutes) => void;
}

const blankGuest = (): Attendee => ({
  id: generateId(),
  name: '', designation: '', department: '',
  email: '', attendanceStatus: 'Present', committeeRole: 'অতিথি',
});

function splitAttendees(attendees: Attendee[]) {
  const members = attendees.filter(a => a.committeeRole !== 'অতিথি');
  const guests   = attendees.filter(a => a.committeeRole === 'অতিথি');
  return { members, guests };
}

// ── Tick/untick toggle — green check = উপস্থিত, empty red box = অনুপস্থিত ──
function PresenceToggle({ status, onToggle }: { status: string; onToggle: () => void }) {
  const isPresent = status === 'Present';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isPresent}
      aria-label={isPresent ? 'উপস্থিত — পরিবর্তন করতে ক্লিক করুন' : 'অনুপস্থিত — পরিবর্তন করতে ক্লিক করুন'}
      className="ae-toggle"
      style={{ color: isPresent ? '#15803d' : '#dc2626' }}
    >
      <span
        className="ae-toggle-box"
        style={isPresent
          ? { background: '#16a34a', borderColor: '#16a34a' }
          : { background: '#fff', borderColor: '#dc2626' }}
      >
        {isPresent && (
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8.5L6 12.5L14 3.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {isPresent ? 'উপস্থিত' : 'অনুপস্থিত'}
    </button>
  );
}

export default function AttendanceEditorSection({ minutes, setMinutes }: Props) {
  const { members, guests } = splitAttendees(minutes.attendees);

  // Ensure exactly one guest row exists by default the first time this
  // section is used for a meeting that has none yet (e.g. a committee
  // with no guest rows pre-seeded, or all guest rows previously removed
  // on a brand new record). Only fires when there are zero guest rows AND
  // zero member rows have ever been touched is not required — we simply
  // top up to one guest row if the list is completely empty on mount.
  useEffect(() => {
    if (minutes.attendees.length > 0) return;
    setMinutes({ ...minutes, attendees: [blankGuest()] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAttendee = (id: string, patch: Partial<Attendee>) => {
    setMinutes({
      ...minutes,
      attendees: minutes.attendees.map(a => a.id === id ? { ...a, ...patch } : a),
    });
  };

  const toggleStatus = (id: string) => {
    const att = minutes.attendees.find(a => a.id === id);
    if (!att) return;
    updateAttendee(id, { attendanceStatus: att.attendanceStatus === 'Present' ? 'Absent' : 'Present' });
  };

  const addGuestRow = () => {
    setMinutes({ ...minutes, attendees: [...minutes.attendees, blankGuest()] });
  };

  const removeGuestRow = (id: string) => {
    setMinutes({ ...minutes, attendees: minutes.attendees.filter(a => a.id !== id) });
  };

  return (
    <div className="ae-wrap">

      {/* ── কমিটি সদস্য ── */}
      {members.length > 0 && (
        <div className="ae-card">
          <div className="ae-card-header">
            <i className="ti ti-users" aria-hidden="true" />
            <span>কমিটি সদস্য ({members.length} জন)</span>
          </div>
          <table className="ae-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>ক্রম</th>
                <th style={{ textAlign: 'left' }}>নাম</th>
                <th style={{ textAlign: 'left' }}>পদবি</th>
                <th style={{ textAlign: 'left' }}>বিভাগ / সেকশন</th>
                <th style={{ width: 90 }}>ভূমিকা</th>
                <th style={{ width: 130 }}>উপস্থিতি</th>
              </tr>
            </thead>
            <tbody>
              {members.map((att, i) => (
                <tr key={att.id ?? i}>
                  <td className="ae-sl">{i + 1}</td>
                  <td>{att.name}</td>
                  <td>{att.designation}</td>
                  <td>{att.department}</td>
                  <td style={{ textAlign: 'center' }}>{att.committeeRole || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <PresenceToggle status={att.attendanceStatus} onToggle={() => att.id && toggleStatus(att.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── অতিথি ── */}
      <div className="ae-card" style={{ marginTop: members.length > 0 ? 16 : 0 }}>
        <div className="ae-card-header">
          <i className="ti ti-user-plus" aria-hidden="true" />
          <span>অতিথি ({guests.length} জন)</span>
          <button type="button" className="ae-add-btn" onClick={addGuestRow}>
            <i className="ti ti-plus" aria-hidden="true" /> নতুন অতিথি যোগ করুন
          </button>
        </div>

        <table className="ae-table">
          <colgroup>
            <col style={{ width: 44 }} />
            <col />
            <col />
            <col />
            <col style={{ width: 130 }} />
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              <th>ক্রম</th>
              <th style={{ textAlign: 'left' }}>নাম</th>
              <th style={{ textAlign: 'left' }}>পদবি</th>
              <th style={{ textAlign: 'left' }}>বিভাগ / প্রতিষ্ঠান</th>
              <th>উপস্থিতি</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 && (
              <tr>
                <td colSpan={6} className="ae-empty">
                  কোনো অতিথি নেই — উপরে + নতুন অতিথি যোগ করুন চাপুন
                </td>
              </tr>
            )}
            {guests.map((att, i) => (
              <tr key={att.id ?? i}>
                <td className="ae-sl">{i + 1}</td>
                <td>
                  <input
                    type="text" className="ae-input" lang="bn"
                    value={att.name}
                    placeholder="অতিথির নাম"
                    onChange={e => att.id && updateAttendee(att.id, { name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="text" className="ae-input" lang="bn"
                    value={att.designation}
                    placeholder="পদবি"
                    onChange={e => att.id && updateAttendee(att.id, { designation: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="text" className="ae-input" lang="bn"
                    value={att.department}
                    placeholder="বিভাগ / প্রতিষ্ঠানের নাম"
                    onChange={e => att.id && updateAttendee(att.id, { department: e.target.value })}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <PresenceToggle status={att.attendanceStatus} onToggle={() => att.id && toggleStatus(att.id)} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button" className="ae-del-btn"
                    onClick={() => att.id && removeGuestRow(att.id)}
                    title="মুছুন" aria-label="অতিথি মুছুন"
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
        .ae-wrap { width: 100%; display: flex; flex-direction: column; gap: 0; }

        .ae-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .ae-card-header {
          display: flex; align-items: center; gap: 9px;
          padding: 13px 18px;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          font-size: 11.5px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .ae-card-header i { font-size: 16px; color: #94a3b8; }

        .ae-add-btn {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; font-size: 12px; font-weight: 600;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe; border-radius: 6px;
          cursor: pointer; transition: background 0.12s; font-family: inherit;
          appearance: none; text-transform: none; letter-spacing: normal;
        }
        .ae-add-btn:hover { background: #dbeafe; }
        .ae-add-btn i { font-size: 13px; }

        .ae-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ae-table th {
          background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 8px 10px; font-size: 11px; font-weight: 700;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
          text-align: center;
        }
        .ae-table td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: middle; color: #1e293b; }
        .ae-sl { text-align: center; font-size: 12px; color: #94a3b8; font-weight: 700; }
        .ae-empty { text-align: center; padding: 20px; color: #cbd5e1; font-size: 12.5px; font-style: italic; }

        .ae-input {
          width: 100%; padding: 7px 9px;
          font-size: 13px; font-family: inherit;
          border: 1px solid #e2e8f0; border-radius: 6px;
          background: #fff; color: #1e293b;
          outline: none; box-sizing: border-box;
          transition: border-color 0.14s, box-shadow 0.14s;
        }
        .ae-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        .ae-input::placeholder { color: #cbd5e1; }

        .ae-toggle {
          display: inline-flex; align-items: center; gap: 6px;
          font-weight: 700; font-size: 12px; font-family: inherit;
          background: transparent; border: none; cursor: pointer; padding: 4px 2px;
        }
        .ae-toggle-box {
          width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid;
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .ae-del-btn {
          -webkit-appearance: none; appearance: none;
          width: 26px; height: 26px;
          display: inline-flex; align-items: center; justify-content: center;
          background-color: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 6px;
          color: #ef4444; cursor: pointer; font-size: 13px;
          transition: background-color 0.12s;
        }
        .ae-del-btn:hover { background-color: #fee2e2; border-color: #f87171; }
      `}</style>
    </div>
  );
}