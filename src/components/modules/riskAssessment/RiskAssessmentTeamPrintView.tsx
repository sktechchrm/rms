// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentTeamPrintView.tsx — Risk Assessment Team + one separate page per section.
// Path: src/components/modules/riskAssessment/RiskAssessmentTeamPrintView.tsx
//
// NOTE: no id="printable-area" here — RiskAssessmentManager wraps it in the one element.
// Built from the CURRENTLY FILTERED records:
//   Page 1      — "ঝুঁকি মূল্যায়ন টিম": every responsible person (name + designation),
//                 the sections they cover, their risk counts and a signature box.
//   Next pages  — ONE PAGE PER SECTION (new sheet each, in the Statement's order):
//                 section heading, that section's team, level counts, its own risk
//                 table and a section-in-charge signature line.
// The authorization signature row closes the last page.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import { RISK_LEVEL_OPTIONS, buildRiskEntries, assessmentText, formatDMY, todayIso, toBn } from './types';
import type { RiskEntry, RiskLevelName } from './types';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
  /** Date shown as "Submission Date" (ISO). Defaults to today. */
  submissionDate?: string;
}

const TH = 'border border-black px-2 py-2 text-center font-bold';
const TD = 'border border-black px-2 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const dash = (v: unknown) => String(v ?? '') || '—';
const NO_SECTION = 'সেকশন উল্লেখ নেই';

const LEVEL_COLOR: Record<RiskLevelName, { bg: string; fg: string }> = {
  'অত্যন্ত উচ্চ': { bg: '#7f1d1d', fg: '#ffffff' },
  'উচ্চ':         { bg: '#dc2626', fg: '#ffffff' },
  'মাঝারি':       { bg: '#f59e0b', fg: '#1f2937' },
  'নিম্ন':        { bg: '#15803d', fg: '#ffffff' },
};
const LEVELS_DESC: RiskLevelName[] = [...RISK_LEVEL_OPTIONS].reverse();

const isHigh = (lv: string) => lv === 'উচ্চ' || lv === 'অত্যন্ত উচ্চ';
const personKey = (name: string, designation: string) =>
  `${name.trim().toLowerCase()}|${designation.trim().toLowerCase()}`;

// widths sum to 100
const TEAM_W    = [5, 20, 18, 24, 8, 10, 15];
const SECTION_W = [5, 14, 20, 14, 13, 20, 14];

// ─── Small pieces ────────────────────────────────────────────────────────────

function FactoryHeader({ factoryName, factoryAddress }: { factoryName: string; factoryAddress: string }) {
  return (
    <header className="print-header">
      <div className="text-center pb-3 border-b-2 border-black company-header">
        <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
        <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
      </div>
    </header>
  );
}

function LevelBadge({ entry }: { entry: RiskEntry }) {
  const text = assessmentText(entry.likelihood, entry.severity, entry.level);
  if (!entry.level) return <span>{text}</span>;
  const c = LEVEL_COLOR[entry.level];
  return (
    <span
      className="rt-color"
      style={{ display: 'inline-block', padding: '1px 6px', border: '1px solid #000', background: c.bg, color: c.fg, fontWeight: 700 }}
    >{text}</span>
  );
}

// ─── Page for ONE section ────────────────────────────────────────────────────

interface SectionPageProps {
  name: string;
  entries: RiskEntry[];
  index: number;
  total: number;
  factoryName: string;
  factoryAddress: string;
}

function SectionPage({ name, entries, index, total, factoryName, factoryAddress }: SectionPageProps) {
  const counts: Record<RiskLevelName, number> = { 'নিম্ন': 0, 'মাঝারি': 0, 'উচ্চ': 0, 'অত্যন্ত উচ্চ': 0 };
  let unrated = 0;
  for (const e of entries) { if (e.level) counts[e.level] += 1; else unrated += 1; }

  // This section's team: distinct responsible persons.
  const team: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const n = String(e.rec.responsiblePersonName ?? '').trim();
    const d = String(e.rec.responsiblePersonDesignation ?? '').trim();
    if (!n) continue;
    const k = personKey(n, d);
    if (seen.has(k)) continue;
    seen.add(k);
    team.push(d ? `${n} (${d})` : n);
  }

  return (
    <section style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
      <FactoryHeader factoryName={factoryName} factoryAddress={factoryAddress} />

      <div className="text-center mt-3 mb-2">
        <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">ঝুঁকি মূল্যায়ন — সেকশন: {name}</h2>
        <div
          className="text-xs text-gray-700 mt-2"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, textAlign: 'left', lineHeight: 1.6 }}
        >
          <div style={{ minWidth: 0 }}>
            <div><strong>সেকশন টিম:</strong> {team.length ? team.join(' | ') : '—'}</div>
            <div>
              <strong>মোট ঝুঁকি:</strong> {toBn(entries.length)}
              {LEVELS_DESC.map(lv => counts[lv] > 0 && <span key={lv}> | <strong>{lv}:</strong> {toBn(counts[lv])}</span>)}
              {unrated > 0 && <span> | <strong>মূল্যায়ন হয়নি:</strong> {toBn(unrated)}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <strong>সেকশন:</strong> {toBn(index + 1)} / {toBn(total)}
          </div>
        </div>
      </div>

      <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10, lineHeight: 1.35, tableLayout: 'fixed' }}>
        <colgroup>{SECTION_W.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
        <thead>
          <tr className="bg-gray-50 print:bg-white">
            <th className={TH}>ক্রমিক</th>
            <th className={TH}>ঝুঁকির উৎস / কার্যক্রম</th>
            <th className={TH}>চিহ্নিত বিপদ / ঝুঁকি</th>
            <th className={TH}>সম্ভাব্য প্রভাব / পরিণতি</th>
            <th className={TH}>ঝুঁকি মূল্যায়ন</th>
            <th className={TH}>সংশোধনমূলক / প্রতিরোধমূলক ব্যবস্থা</th>
            <th className={TH}>দায়িত্বপ্রাপ্ত ব্যক্তি</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const r = e.rec;
            const actionDate = formatDMY(String(r.correctiveActionDate ?? '').slice(0, 10));
            return (
              <tr key={String(r.id ?? i)} className="req-item-row">
                <td className={`${TD} text-center`}>{toBn(i + 1)}</td>
                <td className={TD} style={wrap}>{dash(r.source)}</td>
                <td className={TD} style={wrap}>{dash(r.riskIdentification)}</td>
                <td className={TD} style={wrap}>{dash(r.impact)}</td>
                <td className={`${TD} text-center`} style={wrap}><LevelBadge entry={e} /></td>
                <td className={TD} style={wrap}>
                  {dash(r.correctiveAction)}
                  {actionDate && <div className="font-semibold" style={{ fontSize: 9 }}>{actionDate}</div>}
                </td>
                <td className={TD} style={wrap}>
                  {dash(r.responsiblePersonName)}{r.responsiblePersonDesignation ? `, ${r.responsiblePersonDesignation}` : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 240, textAlign: 'center', fontSize: 11 }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 4 }}>সেকশন ইনচার্জের স্বাক্ষর ও তারিখ</div>
        </div>
      </div>
    </section>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function RiskAssessmentTeamPrintView({
  records, factoryName, factoryAddress, authorization, submissionDate,
}: Props) {
  const submitted = submissionDate || todayIso();
  const entries   = buildRiskEntries(records);

  // Group by section, keeping the order the records arrive in (the Statement's sort).
  const bySection = new Map<string, RiskEntry[]>();
  for (const e of entries) {
    const name = String(e.rec.section ?? '').trim() || NO_SECTION;
    const list = bySection.get(name);
    if (list) list.push(e); else bySection.set(name, [e]);
  }
  const sectionList = Array.from(bySection.entries());

  // Team = distinct (name, designation) of the responsible persons.
  interface Person { name: string; designation: string; sections: Set<string>; total: number; high: number }
  const people = new Map<string, Person>();
  let unassigned = 0;
  for (const e of entries) {
    const name = String(e.rec.responsiblePersonName ?? '').trim();
    const designation = String(e.rec.responsiblePersonDesignation ?? '').trim();
    if (!name) { unassigned += 1; continue; }
    const k = personKey(name, designation);
    let p = people.get(k);
    if (!p) { p = { name, designation, sections: new Set(), total: 0, high: 0 }; people.set(k, p); }
    p.sections.add(String(e.rec.section ?? '').trim() || NO_SECTION);
    p.total += 1;
    if (isHigh(e.level)) p.high += 1;
  }
  const team = Array.from(people.values()).sort((a, b) => a.name.localeCompare(b.name, 'bn'));

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        {/* ── Page 1: the team ─────────────────────────────────────────── */}
        <FactoryHeader factoryName={factoryName} factoryAddress={factoryAddress} />

        <div className="text-center mt-3 mb-2">
          <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">ঝুঁকি মূল্যায়ন টিম (Risk Assessment Team)</h2>
          <div
            className="text-xs text-gray-700 mt-2"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, textAlign: 'left', lineHeight: 1.6 }}
          >
            <div>
              <strong>মোট সদস্য:</strong> {toBn(team.length)} | <strong>মোট বিভাগ/ক্ষেত্র:</strong> {toBn(sectionList.length)} | <strong>মোট রেকর্ড:</strong> {toBn(entries.length)}
              {unassigned > 0 && <> | <strong>দায়িত্ব নির্ধারিত হয়নি:</strong> {toBn(unassigned)}</>}
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <strong>মূল্যায়নের তারিখ:</strong> {toBn(formatDMY(submitted))}
            </div>
          </div>
        </div>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 11, lineHeight: 1.4, tableLayout: 'fixed' }}>
            <colgroup>{TEAM_W.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className={TH}>ক্রমিক</th>
                <th className={TH}>নাম</th>
                <th className={TH}>পদবি</th>
                <th className={TH}>দায়িত্বপ্রাপ্ত বিভাগ/ক্ষেত্র</th>
                <th className={TH}>মোট ঝুঁকি</th>
                <th className={TH}>উচ্চ ও অত্যন্ত উচ্চ</th>
                <th className={TH}>স্বাক্ষর</th>
              </tr>
            </thead>
            <tbody>
              {team.length === 0 && (
                <tr><td colSpan={TEAM_W.length} className="border border-black px-2 py-4 text-center text-gray-600">কোনো দায়িত্বপ্রাপ্ত ব্যক্তি পাওয়া যায়নি</td></tr>
              )}
              {team.map((p, i) => (
                <tr key={personKey(p.name, p.designation)} className="req-item-row">
                  <td className={`${TD} text-center`}>{toBn(i + 1)}</td>
                  <td className={`${TD} font-semibold`} style={wrap}>{dash(p.name)}</td>
                  <td className={TD} style={wrap}>{dash(p.designation)}</td>
                  <td className={TD} style={wrap}>{Array.from(p.sections).join(', ')}</td>
                  <td className={`${TD} text-center`}>{toBn(p.total)}</td>
                  <td className={`${TD} text-center font-semibold`}>{toBn(p.high)}</td>
                  <td className={TD} style={{ height: 34 }} />
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        {/* ── One separate page per section ────────────────────────────── */}
        {sectionList.map(([name, list], i) => (
          <SectionPage
            key={name}
            name={name}
            entries={list}
            index={i}
            total={sectionList.length}
            factoryName={factoryName}
            factoryAddress={factoryAddress}
          />
        ))}

        <footer className="print-footer mt-10">
          <PrintSignatureRow value={authorization} lang="en" />
        </footer>

      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
        .rt-color { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * { visibility: visible !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; background: white !important; }
          .print-content { font-size: 10pt !important; }
          .req-items-table thead { display: table-header-group; }
          .req-item-row { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}