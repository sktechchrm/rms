// ─────────────────────────────────────────────────────────────────────────────
// ParticipantListSection.tsx
//
// Standalone "Participant List" output — a printable sign-in/attendance
// sheet, separate from the full Meeting Minutes document. Extracted from
// Printview.tsx's existing attendance table (ক্রম/নাম/পদবি/বিভাগ/কমিটিতে
// ভূমিকা/উপস্থিতি/স্বাক্ষর) — same data, same columns, just as its own
// printable page rather than embedded inside the full minutes document.
//
// UPDATE — attendees are now split into two separate tables: কমিটি সদস্য
// (committee members) and অতিথি (guests, committeeRole === 'অতিথি').
// Numbering (ক্রম) restarts at ১ for each table. Blank/unfilled guest rows
// are still printed as empty placeholder lines (for handwriting in walk-in
// guests on paper), so guests are NOT filtered by name here.
// ─────────────────────────────────────────────────────────────────────────────

import { MeetingMinutes, getAttendanceSummary, Attendee } from './MeetingMinutesTypes';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../utils/printCSS';

interface Props {
  minutes: MeetingMinutes;
}

const toBanglaNumber = (num: string | number | undefined): string => {
  if (num === undefined || num === null) return '';
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
  };
  return num.toString().replace(/\d/g, d => map[d]);
};

const BANGLA_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

const formatDateFullBangla = (dateString: string): string => {
  if (!dateString) return '';
  const date    = new Date(dateString);
  const dayName = BANGLA_DAYS[date.getDay()];
  const day     = toBanglaNumber(String(date.getDate()).padStart(2, '0'));
  const month   = BANGLA_MONTHS[date.getMonth()];
  const year    = toBanglaNumber(date.getFullYear());
  return `${dayName}, ${day} ${month} ${year}`;
};

const attendanceStatusBangla = (s: string): string => {
  const map: Record<string, string> = {
    Present: 'উপস্থিত',
    Absent:  'অনুপস্থিত',
  };
  return map[s] ?? s;
};

// Committee members vs guests — guest rows are tagged with
// committeeRole === 'অতিথি' (see BasicInfoSection.buildAttendeesFromCommittee,
// which appends 5 blank guest rows after the committee members). Unlike
// PrintView's embedded attendance table, blank guest rows are intentionally
// KEPT here (not filtered by name) so they print as empty sign-in lines.
function splitAttendees(attendees: Attendee[]) {
  const members = attendees.filter(a => a.committeeRole !== 'অতিথি');
  const guests   = attendees.filter(a => a.committeeRole === 'অতিথি');
  return { members, guests };
}

function ParticipantTable({ rows }: { rows: Attendee[] }) {
  return (
    <table className="pl-table">
      <thead>
        <tr>
          <th style={{ width: '6%' }}>ক্রম</th>
          <th style={{ width: '20%', textAlign: 'left' }}>নাম</th>
          <th style={{ width: '16%', textAlign: 'left' }}>পদবি</th>
          <th style={{ width: '18%', textAlign: 'left' }}>বিভাগ / সেকশন</th>
          <th style={{ width: '12%' }}>কমিটিতে ভূমিকা</th>
          <th style={{ width: '12%' }}>উপস্থিতি</th>
          <th style={{ width: '16%' }}>স্বাক্ষর</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((att, i) => (
          <tr key={att.id ?? i}>
            <td style={{ textAlign: 'center' }}>{toBanglaNumber(i + 1)}</td>
            <td>{att.name}</td>
            <td>{att.designation}</td>
            <td>{att.department}</td>
            <td style={{ textAlign: 'center' }}>{att.committeeRole || '—'}</td>
            <td style={{ textAlign: 'center', fontWeight: 600 }}>
              {att.name ? attendanceStatusBangla(att.attendanceStatus) : ''}
            </td>
            <td />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ParticipantListSection({ minutes }: Props) {
  const { members, guests } = splitAttendees(minutes.attendees);
  // Summary counts (মোট/উপস্থিত/অনুপস্থিত/হার) reflect committee members
  // only — guests are a separate, unscheduled group and shouldn't affect
  // the committee's attendance rate.
  const summary = getAttendanceSummary(members);

  // Scale row padding/font down as attendee count grows, so the list
  // reliably fits on a single A4 page (committee members + guest rows can
  // add up to 15+ entries).
  const n = minutes.attendees.length;
  const rowFontSize = n <= 15 ? 12 : n <= 22 ? 11 : n <= 30 ? 10 : 9;
  const rowPaddingV  = n <= 15 ? 9  : n <= 22 ? 7  : n <= 30 ? 5  : 4;

  return (
    <div className="pl-page" style={{ ['--pl-row-font' as string]: `${rowFontSize}px`, ['--pl-row-pad' as string]: `${rowPaddingV}px 8px` }}>
      <div className="pl-header">
        <h1 className="pl-org">{minutes.organizationName}</h1>
        {minutes.organizationAddress && <p className="pl-org-addr">{minutes.organizationAddress}</p>}
        <h2 className="pl-title">{(minutes.meetingTitle || '--') + ' এর উপস্থিতি তালিকা'}</h2>
        <p className="pl-date">তারিখ: {formatDateFullBangla(minutes.meetingDate)}</p>
      </div>

      <p className="pl-summary">
        মোট: {toBanglaNumber(summary.total)} |&nbsp;
        উপস্থিত: {toBanglaNumber(summary.present)} |&nbsp;
        অনুপস্থিত: {toBanglaNumber(summary.absent)} |&nbsp;
        উপস্থিতির হার: {toBanglaNumber(summary.presentPercentage)}%
      </p>

      {members.length > 0 && (
        <div className="pl-section" style={{ marginBottom: guests.length > 0 ? '20px' : '0' }}>
          <p className="pl-section-title">কমিটি সদস্য ({toBanglaNumber(members.length)} জন)</p>
          <ParticipantTable rows={members} />
        </div>
      )}

      {guests.length > 0 && (
        <div className="pl-section">
          <p className="pl-section-title">অতিথি ({toBanglaNumber(guests.length)} জন)</p>
          <ParticipantTable rows={guests} />
        </div>
      )}

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}

        .pl-page { max-width: 900px; margin: 0 auto; font-family: 'Noto Sans Bengali', Arial, sans-serif; }
        .pl-header { text-align: center; margin-bottom: 18px; }
        .pl-org { font-size: 18px; font-weight: 700; margin: 0; }
        .pl-org-addr { font-size: 12px; color: #475569; margin: 2px 0 10px; }
        .pl-title { font-size: 15px; font-weight: 700; margin: 10px 0 4px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 4px; }
        .pl-date { font-size: 12.5px; margin: 4px 0 0; }
        .pl-summary { font-size: 12px; font-weight: 600; margin-bottom: 12px; }
        .pl-section-title { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
        .pl-table { width: 100%; border: 2px solid #000; border-collapse: collapse; font-size: var(--pl-row-font, 12px); }
        .pl-table th { border: 1px solid #000; padding: var(--pl-row-pad, 9px 8px); background: #e5e7eb; font-weight: 700; }
        .pl-table td { border: 1px solid #000; padding: var(--pl-row-pad, 9px 8px); line-height: 1.4; }

        @media print {
          /* Same ModuleShell overflow:hidden / narrow-column escape fix
             already applied in Printview.tsx and EmployeeNotice.tsx. */
          body * { visibility: hidden; }
          .pl-page, .pl-page * { visibility: visible; }
          .pl-page {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            max-width: none !important; width: 100% !important;
            background: white !important;
            page-break-inside: avoid; page-break-after: avoid;
          }
          html, body, body * { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
}