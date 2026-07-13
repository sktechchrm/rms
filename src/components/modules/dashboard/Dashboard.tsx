import { FaBaby, FaFileAlt, FaGofore, FaUser, FaClipboardList, FaFileInvoiceDollar, FaBriefcase, FaBuilding, FaGavel, FaBookOpen, FaUserShield, FaHeadset, FaClipboardCheck, FaFileContract, FaFileInvoice, FaBalanceScale, FaTruck, FaUserPlus, FaUserCheck, FaIdBadge, FaSitemap, FaChartLine, FaAmbulance, FaChalkboardTeacher, FaGraduationCap, FaExclamationTriangle } from "react-icons/fa";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { ROLE_META } from "../../../auth/users";
import { useSecurity } from "../../../security";
import WorkerGuidelinePopup from "../workerGuideline/WorkerGuidelinePopup";
import DashboardSidebar from "./DashboardSidebar";

interface Props { setCurrentPage: (page: string) => void; }

// AUDIT FIX: this list had drifted badly out of date — 8 modules built
// across this project (auditvisit, legaldocument, miscbill, livingwage,
// supplierassessment, disciplinaryaction, candidatepipeline,
// onboardingchecklist) were missing entirely, meaning they had NO
// dashboard tile at all despite being fully built and in Navigation.
// Rebuilt to match Navigation.tsx's module list exactly, and grouped
// into the same confirmed 3-category structure (core/lifecycle/
// compliance) — sidebar and dashboard now show the identical grouping.
type CardCategory = 'core' | 'lifecycle' | 'compliance';

const CATEGORY_META: Record<CardCategory, { title: string; titleBn: string }> = {
  core:       { title: 'Core HR & Payroll',               titleBn: 'কোর এইচআর ও বেতন' },
  lifecycle:  { title: 'Employee Lifecycle & Relations',  titleBn: 'কর্মী জীবনচক্র ও সম্পর্ক' },
  compliance: { title: 'Compliance & Governance',          titleBn: 'কমপ্লায়েন্স ও গভর্নেন্স' },
};

const ALL_CARDS = [
  // ── Core HR & Payroll ─────────────────────────────────────────────────────
  { id:"personalfile", title:"Personal File",       titleBn:"ব্যক্তিগত ফাইল",              icon:FaUser,             color:"#8b5cf6", bg:"#ede9fe", category:'core' as CardCategory },
  { id:"settlement",   title:"Final Settlement",    titleBn:"চূড়ান্ত নিষ্পত্তি",           icon:FaFileAlt,          color:"#f59e0b", bg:"#fef3c7", category:'core' as CardCategory },
  { id:"maternity",    title:"Maternity Benefit",   titleBn:"মাতৃত্বকালীন সুবিধা",       icon:FaBaby,             color:"#0ea5e9", bg:"#e0f2fe", category:'core' as CardCategory },
  { id:"increment",    title:"Salary Increment",    titleBn:"বেতন বৃদ্ধির প্রস্তাব",        icon:FaFileInvoiceDollar,color:"#f97316", bg:"#ffedd5", category:'core' as CardCategory },
  { id:"miscbill",     title:"Miscellaneous Bill",  titleBn:"বিবিধ বিল",                  icon:FaFileInvoice,      color:"#ca8a04", bg:"#fef9c3", category:'core' as CardCategory },
  { id:"leftnotice",   title:"Left Worker Notice",  titleBn:"অনুমতি ছাড়া কাজ ছেড়ে যাওয়া", icon:FaGofore,           color:"#ef4444", bg:"#fee2e2", category:'core' as CardCategory },
  { id:"wagesgrid",    title:"Wages Grid",          titleBn:"ওয়েজেস গ্রিড",              icon:FaSitemap,          color:"#6366f1", bg:"#e0e7ff", category:'core' as CardCategory },

  // ── Employee Lifecycle & Relations ───────────────────────────────────────
  { id:"requisition",        title:"Requisition",           titleBn:"রিকুইজিশন ফর্ম",              icon:FaClipboardList, color:"#10b981", bg:"#d1fae5", category:'lifecycle' as CardCategory },
  { id:"candidatepipeline",  title:"Candidate Pipeline",    titleBn:"প্রার্থী ট্র্যাকিং",             icon:FaUserPlus,      color:"#7c3aed", bg:"#f3e8ff", category:'lifecycle' as CardCategory },
  { id:"onboardingchecklist",title:"Onboarding Checklist",  titleBn:"অনবোর্ডিং চেকলিস্ট",           icon:FaUserCheck,     color:"#65a30d", bg:"#ecfccb", category:'lifecycle' as CardCategory },
  { id:"performance",        title:"Employee Performance",  titleBn:"কর্মী পারফরম্যান্স",             icon:FaChartLine,     color:"#ea580c", bg:"#ffedd5", category:'lifecycle' as CardCategory },
  { id:"meeting",            title:"Meeting Minutes",       titleBn:"সভা কার্যবিবরণী",             icon:FaBriefcase,     color:"#3b82f6", bg:"#dbeafe", category:'lifecycle' as CardCategory },
  { id:"grievance",          title:"Grievance",             titleBn:"কর্মী অভিযোগ",                 icon:FaHeadset,       color:"#dc2626", bg:"#fee2e2", category:'lifecycle' as CardCategory },
  { id:"disciplinaryaction", title:"Disciplinary Action",   titleBn:"শৃঙ্খলামূলক ব্যবস্থা",           icon:FaGavel,         color:"#e11d48", bg:"#ffe4e6", category:'lifecycle' as CardCategory },
  { id:"workerrights",       title:"Worker Rights",         titleBn:"কর্মচারীর অধিকার",              icon:FaUserShield,    color:"#64748b", bg:"#f8fafc", category:'lifecycle' as CardCategory },
  { id:"workerguideline",    title:"Worker Guideline",      titleBn:"শ্রমিক নির্দেশিকা",              icon:FaBookOpen,      color:"#0f766e", bg:"#f0fdf4", category:'lifecycle' as CardCategory },
  { id:"trainingmodule",     title:"Training Module",       titleBn:"প্রশিক্ষণ মডিউল",              icon:FaGraduationCap, color:"#7c3aed", bg:"#f3e8ff", category:'lifecycle' as CardCategory },
  { id:"trainerlist",        title:"Trainer List",          titleBn:"প্রশিক্ষক তালিকা",              icon:FaChalkboardTeacher, color:"#0891b2", bg:"#cffafe", category:'lifecycle' as CardCategory },

  // ── Compliance & Governance ───────────────────────────────────────────────
  { id:"auditvisit",         title:"Audit/Visit Record",     titleBn:"নিরীক্ষা/পরিদর্শন রেকর্ড",       icon:FaClipboardCheck,color:"#0891b2", bg:"#cffafe", category:'compliance' as CardCategory },
  { id:"legaldocument",      title:"Legal Document Validity", titleBn:"আইনি দলিলের বৈধতা",          icon:FaFileContract,  color:"#4f46e5", bg:"#e0e7ff", category:'compliance' as CardCategory },
  { id:"livingwage",         title:"Living Wage Assessment", titleBn:"জীবনযাপন মজুরি মূল্যায়ন",      icon:FaBalanceScale,  color:"#059669", bg:"#d1fae5", category:'compliance' as CardCategory },
  { id:"supplierassessment", title:"Supplier Assessment",    titleBn:"সরবরাহকারী মূল্যায়ন",           icon:FaTruck,         color:"#0284c7", bg:"#e0f2fe", category:'compliance' as CardCategory },
  { id:"authority",          title:"Authority Control",      titleBn:"কর্তৃত্ব নিয়ন্ত্রণ",             icon:FaIdBadge,       color:"#334155", bg:"#f1f5f9", category:'compliance' as CardCategory },
  { id:"emergencylog",       title:"Emergency Log",          titleBn:"ইমার্জেন্সি লগ",                icon:FaAmbulance,     color:"#dc2626", bg:"#fee2e2", category:'compliance' as CardCategory },
  { id:"complianceaudit",    title:"Compliance Audit",       titleBn:"কমপ্লায়েন্স অডিট",             icon:FaClipboardCheck, color:"#16a34a", bg:"#dcfce7", category:'compliance' as CardCategory },
  { id:"riskassessment",     title:"Risk Assessment",        titleBn:"ঝুঁকি মূল্যায়ন",               icon:FaExclamationTriangle, color:"#ea580c", bg:"#ffedd5", category:'compliance' as CardCategory },
];

export default function Dashboard({ setCurrentPage }: Props) {
  const { user, activeFactoryId } = useAuth();
  const security = useSecurity();
  const roleMeta = user ? ROLE_META[user.role] : null;
  const cards    = ALL_CARDS.filter(c => security.module(c.id).allowed);
  const cardGroups = (['core', 'lifecycle', 'compliance'] as CardCategory[])
    .map(cat => ({ category: cat, ...CATEGORY_META[cat], items: cards.filter(c => c.category === cat) }))
    .filter(g => g.items.length > 0);
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", {hour:"2-digit",minute:"2-digit"});
  const dateStr = now.toLocaleDateString("en-GB", {weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const [showGuidelinePopup, setShowGuidelinePopup] = useState(false);
  // Sidebar accordion — only one category's app list visible at a time.
  // Per explicit correction: NO category open by default (was
  // 'compliance' before) — the main body now shows a prompt until the
  // person picks one.
  const [expandedCategory, setExpandedCategory] = useState<CardCategory | null>(null);

  const handleCardClick = (id: string) => {
    if (id === "workerguideline") {
      setShowGuidelinePopup(true);
    } else {
      setCurrentPage(id);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        /* AUDIT: Dashboard-only persistent sidebar, per explicit request —
           confirmed scope: Dashboard page only (not app-wide), alongside
           the existing top-bar dropdown (not replacing it), always fully
           open (no collapse/toggle). Lives entirely within this
           component's own render tree, so it doesn't touch RewardApp.
           tsx's global layout at all. */
        .db-page { display: flex; gap: 24px; max-width: 1380px; margin: 0 auto; padding: 28px 20px 24px; align-items: flex-start; }
        .db-sidebar {
          width: 240px; flex-shrink: 0; background: #fff; border-radius: 14px;
          border: 1px solid #e2e8f0; padding: 14px 0;
          position: sticky; top: calc(var(--nav-h, 60px) + 20px);
          max-height: calc(100vh - var(--nav-h, 60px) - 40px);
          display: flex; flex-direction: column;
        }
        .db-sidebar-scroll { flex: 1; overflow-y: auto; min-height: 0; }
        .db-sidebar-footer { border-top: 1px solid #f1f5f9; padding-top: 6px; margin-top: 6px; flex-shrink: 0; }
        .db-sidebar-settings {
          display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 18px;
          background: none; border: none; cursor: pointer; text-align: left; font-family: inherit;
          font-size: 13px; font-weight: 600; color: #475569; transition: background .12s, color .12s;
        }
        .db-sidebar-settings:hover { background: #f1f5f9; color: #1e3a5f; }
        .db-sidebar-settings svg { font-size: 14px; opacity: 0.75; }
        .db-sidebar-heading {
          font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.6px; padding: 14px 18px 6px;
        }
        .db-sidebar-heading:first-child { padding-top: 6px; }
        .db-sidebar-cat {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          width: 100%; padding: 12px 18px; background: none; border: none; cursor: pointer;
          text-align: left; font-family: inherit;
        }
        .db-sidebar-cat-title { font-size: 12.5px; font-weight: 700; color: #1e3a5f; }
        .db-sidebar-cat-sub { font-size: 10.5px; color: #94a3b8; margin-top: 1px; }
        .db-sidebar-cat-arrow { font-size: 11px; color: #94a3b8; transition: transform .15s; flex-shrink: 0; }
        .db-sidebar-cat.open .db-sidebar-cat-arrow { transform: rotate(90deg); color: #1e3a5f; }
        .db-sidebar-cat:hover { background: #f8fafc; }
        .db-sidebar-cat.open { background: #eff6ff; }
        .db-sidebar-cat-divider { height: 1px; background: #f1f5f9; margin: 2px 0; }
        .db-sidebar-item {
          display: flex; align-items: center; gap: 10px; padding: 9px 18px;
          font-size: 13px; color: #334155; cursor: pointer; transition: background .12s, color .12s;
          border-left: 3px solid transparent; background: none; width: 100%; text-align: left;
          border-top: none; border-right: none; border-bottom: none; font-family: inherit;
        }
        .db-sidebar-item:hover { background: #f1f5f9; color: #1e3a5f; }
        .db-sidebar-item svg { font-size: 13px; flex-shrink: 0; opacity: 0.75; }
        @media (max-width: 900px) { .db-sidebar { display: none; } }
        .db-wrap { font-family:var(--app-font); flex: 1; min-width: 0; }
        /* Welcome banner */
        .db-banner {
          background:linear-gradient(135deg,#1e3a5f 0%,#1e40af 50%,#1d4ed8 100%);
          border-radius:16px;
          padding:24px 28px;
          margin-bottom:28px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          position:relative;
          overflow:hidden;
        }
        .db-banner::before {
          content:'';
          position:absolute;
          top:-40%;right:-5%;
          width:280px;height:280px;
          background:rgba(255,255,255,0.04);
          border-radius:50%;
        }
        .db-banner-left { position:relative; z-index:1; }
        .db-banner-greeting { font-size:13px; color:rgba(255,255,255,0.65); margin-bottom:4px; }
        .db-banner-name { font-size:22px; font-weight:700; color:#fff; margin-bottom:6px; }
        .db-banner-factory { display:flex; align-items:center; gap:6px; font-size:12.5px; color:#93c5fd; }
        .db-banner-right { text-align:right; position:relative; z-index:1; flex-shrink:0; }
        .db-banner-time { font-size:24px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums; }
        .db-banner-date { font-size:11.5px; color:rgba(255,255,255,0.55); margin-top:2px; }
        .db-role-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; margin-top:8px; }

        /* Section heading */
        .db-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .db-heading-title { font-size:15px; font-weight:700; color:#1e293b; }
        .db-heading-sub { font-size:12px; color:#94a3b8; }
        .db-heading-line { flex:1; height:1px; background:#e2e8f0; margin-left:12px; }

        /* Grid */
        .db-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        @media(max-width:900px){ .db-grid{ grid-template-columns:repeat(3,1fr); } }
        @media(max-width:640px){ .db-grid{ grid-template-columns:repeat(2,1fr); gap:10px; } }
        @media(max-width:380px){ .db-grid{ grid-template-columns:1fr; } }

        /* Card */
        .db-card {
          background:#fff;
          border:1.5px solid #e2e8f0;
          border-radius:12px;
          padding:20px 14px 16px;
          cursor:pointer;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:10px;
          transition:transform 0.18s cubic-bezier(.22,.68,0,1.2), box-shadow 0.18s ease, border-color 0.18s ease;
          user-select:none;
          position:relative;
          overflow:hidden;
          animation:db-fadeUp 0.32s ease both;
        }
        .db-card::before {
          content:'';
          position:absolute;
          top:0;left:0;right:0;
          height:3px;
          background:var(--db-card-color, #3b82f6);
          border-radius:0;
        }
        .db-card:hover {
          transform:translateY(-4px);
          box-shadow:0 8px 24px rgba(0,0,0,0.1);
          border-color:var(--db-card-color, #3b82f6);
        }
        .db-card:active { transform:translateY(-1px); }
        .db-icon-wrap {
          width:52px;height:52px;
          border-radius:12px;
          background:var(--db-card-bg, #dbeafe);
          display:flex;align-items:center;justify-content:center;
          font-size:22px;
          color:var(--db-card-color, #3b82f6);
          transition:transform 0.2s ease;
        }
        .db-card:hover .db-icon-wrap { transform:scale(1.08); }
        .db-label { text-align:center; }
        .db-title { font-size:13px; font-weight:700; color:#1e293b; line-height:1.3; }
        .db-title-bn { font-size:10.5px; color:#64748b; margin-top:3px; line-height:1.4; }

        @keyframes db-fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
        .db-card:nth-child(1){animation-delay:0ms;} .db-card:nth-child(2){animation-delay:40ms;}
        .db-card:nth-child(3){animation-delay:80ms;} .db-card:nth-child(4){animation-delay:120ms;}
        .db-card:nth-child(5){animation-delay:160ms;} .db-card:nth-child(6){animation-delay:200ms;}
        .db-card:nth-child(7){animation-delay:240ms;}

        /* Access denied card */
        .db-card--locked { opacity:0.45; cursor:not-allowed; }
        .db-card--locked:hover { transform:none; box-shadow:none; }
      `}</style>

      <div className="db-page">
        <DashboardSidebar
          cardGroups={cardGroups}
          expandedCategory={expandedCategory}
          onToggleCategory={cat => setExpandedCategory(prev => prev === cat ? null : cat)}
          onCardClick={handleCardClick}
          onSettingsClick={() => setCurrentPage('settings')}
        />

      <div className="db-wrap">
        {/* Welcome Banner */}
        <div className="db-banner">
          <div className="db-banner-left">
            <div className="db-banner-greeting">Welcome back,</div>
            <div className="db-banner-name">{user?.name ?? "User"}</div>
            <div className="db-banner-factory">
              <FaBuilding style={{fontSize:"11px"}}/>
              {user?.factoryName ?? "SK-TECH"}
            </div>
            {roleMeta && (
              <div className="db-role-badge" style={{background:roleMeta.bg,color:roleMeta.color}}>
                <FaGavel style={{fontSize:"10px",marginRight:4}}/>
                {roleMeta.label}
              </div>
            )}
          </div>
          <div className="db-banner-right">
            <div className="db-banner-time">{timeStr}</div>
            <div className="db-banner-date">{dateStr}</div>
          </div>
        </div>

        {/* Module cards — only the sidebar-selected category shows here now
           (was unconditionally showing all 3 categories, a mismatch with
           "onclick a label displays that label's apps" — fixed). */}
        {expandedCategory === null && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: '#94a3b8',
            fontFamily: 'var(--app-font)', background: '#fff', borderRadius: 14, border: '1px dashed #e2e8f0',
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>একটি ক্যাটেগরি নির্বাচন করুন</div>
            <div style={{ fontSize: 12.5 }}>বাম পাশের sidebar থেকে একটি ক্যাটেগরিতে ক্লিক করুন মডিউল দেখতে</div>
          </div>
        )}
        {cardGroups.filter(group => group.category === expandedCategory).map(group => (
          <div key={group.category} style={{ marginBottom: 28 }}>
            <div className="db-heading">
              <div>
                <div className="db-heading-title">{group.title}</div>
                <div className="db-heading-sub">{group.titleBn}</div>
              </div>
              <div className="db-heading-line"/>
            </div>

            <div className="db-grid">
              {group.items.map(({id,title,titleBn,icon:Icon,color,bg})=>(
                <div
                  key={id}
                  className="db-card"
                  style={{"--db-card-color":color,"--db-card-bg":bg} as React.CSSProperties}
                  onClick={()=>handleCardClick(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e=>e.key==="Enter"&&handleCardClick(id)}
                >
                  <div className="db-icon-wrap"><Icon/></div>
                  <div className="db-label">
                    <div className="db-title">{title}</div>
                    <div className="db-title-bn">{titleBn}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Worker Guideline Popup */}
        {showGuidelinePopup && (
          <WorkerGuidelinePopup
            factoryId={activeFactoryId}
            onClose={() => setShowGuidelinePopup(false)}
            onOpen={() => { setShowGuidelinePopup(false); setCurrentPage("workerguideline"); }}
          />
        )}
      </div>
      </div>
    </>
  );
}