// src/components/common/Navigation.tsx
import { useState, useEffect, useRef } from "react";
import type { IconType } from "react-icons";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaBaby, FaFileAlt, FaGofore, FaUser,
  FaClipboardList, FaFileInvoiceDollar, FaBriefcase,
  FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
  FaChevronDown, FaLayerGroup, FaBuilding, FaExchangeAlt, FaUserShield, FaHeadset,
  FaChartBar, FaIdBadge, FaBookOpen, FaClipboardCheck, FaFileContract, FaFileInvoice, FaBalanceScale, FaTruck, FaGavel, FaUserPlus, FaUserCheck, FaSitemap, FaChartLine, FaAmbulance, FaChalkboardTeacher, FaGraduationCap, FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { ROLE_META } from "../../auth/users";
import { useSecurity } from "../../security";
import { useAccessibleFactories, useFactory } from "../../hooks/useFactory";
import ProfilePanel from "./ProfilePanel";
import SkipNav from "./SkipNav";
import SupportPanel from "./SupportPanel";

const skTechLogo = '/rms/logo.png';

interface Props {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export type ModuleCategory = 'core' | 'lifecycle' | 'compliance';

export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  core:       'Core HR & Payroll',
  lifecycle:  'Employee Lifecycle & Relations',
  compliance: 'Compliance & Governance',
};

const ALL_HR_MODULES: { id: string; label: string; icon: IconType; category?: ModuleCategory }[] = [
  { id: "personalfile",        label: "Personal File",            icon: FaUser,                category: 'core' },
  { id: "settlement",          label: "Final Settlement",         icon: FaFileAlt,             category: 'core' },
  { id: "maternity",           label: "Maternity Benefit",        icon: FaBaby,                category: 'core' },
  { id: "increment",           label: "Salary Increment",         icon: FaFileInvoiceDollar,   category: 'core' },
  { id: "miscbill",            label: "Miscellaneous Bill",       icon: FaFileInvoice,         category: 'core' },
  { id: "leftnotice",          label: "Left Worker Notice",       icon: FaGofore,              category: 'core' },
  { id: "wagesgrid",           label: "Wages Grid",               icon: FaSitemap,             category: 'core' },

  { id: "requisition",         label: "Requisition",              icon: FaClipboardList,       category: 'lifecycle' },
  { id: "candidatepipeline",   label: "Candidate Pipeline",       icon: FaUserPlus,            category: 'lifecycle' },
  { id: "onboardingchecklist", label: "Onboarding Checklist",     icon: FaUserCheck,           category: 'lifecycle' },
  { id: "performance",         label: "Employee Performance",     icon: FaChartLine,           category: 'lifecycle' },
  { id: "meeting",             label: "Meeting Minutes",          icon: FaBriefcase,           category: 'lifecycle' },
  { id: "grievance",           label: "Grievance",                icon: FaHeadset,             category: 'lifecycle' },
  { id: "disciplinaryaction",  label: "Disciplinary Action",      icon: FaGavel,               category: 'lifecycle' },
  { id: "workerrights",        label: "Worker Rights",            icon: FaUserShield,          category: 'lifecycle' },
  { id: "workerguideline",     label: "Worker Guideline",         icon: FaBookOpen,            category: 'lifecycle' },
  { id: "trainingmodule",      label: "Training Module",          icon: FaGraduationCap,       category: 'lifecycle' },
  { id: "trainerlist",         label: "Trainer List",             icon: FaChalkboardTeacher,   category: 'lifecycle' },

  { id: "auditvisit",          label: "Audit/Visit Record",       icon: FaClipboardCheck,      category: 'compliance' },
  { id: "legaldocument",       label: "Legal Document Validity",  icon: FaFileContract,        category: 'compliance' },
  { id: "livingwage",          label: "Living Wage Assessment",   icon: FaBalanceScale,        category: 'compliance' },
  { id: "supplierassessment",  label: "Supplier Assessment",      icon: FaTruck,               category: 'compliance' },
  { id: "authority",           label: "Authority Control",        icon: FaIdBadge,             category: 'compliance' },
  { id: "emergencylog",        label: "Emergency Log",            icon: FaAmbulance,           category: 'compliance' },
  { id: "complianceaudit",     label: "Compliance Audit",         icon: FaClipboardCheck,      category: 'compliance' },
  { id: "riskassessment",      label: "Risk Assessment",          icon: FaExclamationTriangle, category: 'compliance' },

  { id: "reports", label: "Reports", icon: FaChartBar },
];

function groupByCategory<T extends { category?: ModuleCategory }>(modules: T[]) {
  const order: ModuleCategory[] = ['core', 'lifecycle', 'compliance'];
  const groups = order
    .map(cat => ({ category: cat, label: CATEGORY_LABELS[cat], items: modules.filter(m => m.category === cat) }))
    .filter(g => g.items.length > 0);
  const uncategorized = modules.filter(m => !m.category);
  return { groups, uncategorized };
}

export default function Navigation({ currentPage, setCurrentPage }: Props) {
  const navigate = useNavigate();
  const { user, logout, activeFactoryId, setActiveFactory } = useAuth();
  const security             = useSecurity();
  const accessibleFactories  = useAccessibleFactories();
  const hasMultipleFactories = accessibleFactories.length > 1;
  const activeFactory        = useFactory();

  const [isProfileOpen,       setIsProfileOpen]       = useState(false);
  const [isMobileMenuOpen,    setIsMobileMenuOpen]    = useState(false);
  const [isHRMenuOpen,        setIsHRMenuOpen]        = useState(false);
  const [isFactorySwitchOpen, setIsFactorySwitchOpen] = useState(false);
  const [showProfilePanel,    setShowProfilePanel]    = useState(false);
  const [showSupportPanel,    setShowSupportPanel]    = useState(false);
  // Which category accordion is open inside the HR dropdown (null = all closed)
  const [openCategory, setOpenCategory] = useState<ModuleCategory | null>(null);

  const profileRef       = useRef<HTMLDivElement>(null);
  const hrMenuRef        = useRef<HTMLDivElement>(null);
  const mobileMenuRef    = useRef<HTMLDivElement>(null);
  const factorySwitchRef = useRef<HTMLDivElement>(null);

  const hrModules    = ALL_HR_MODULES.filter(m => security.module(m.id).allowed);
  const { groups: hrModuleGroups, uncategorized: hrModulesUncategorized } = groupByCategory(hrModules);
  const activeModule = hrModules.find(m => m.id === currentPage);
  const roleMeta     = user ? ROLE_META[user.role] : null;
  const userName     = user?.name ?? (user?.email?.split("@")[0] ?? "User");
  const initials     = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setShowProfilePanel(false); setIsHRMenuOpen(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current       && !profileRef.current.contains(e.target as Node))       setIsProfileOpen(false);
      if (hrMenuRef.current        && !hrMenuRef.current.contains(e.target as Node))        { setIsHRMenuOpen(false); setOpenCategory(null); }
      if (mobileMenuRef.current    && !mobileMenuRef.current.contains(e.target as Node))    setIsMobileMenuOpen(false);
      if (factorySwitchRef.current && !factorySwitchRef.current.contains(e.target as Node)) setIsFactorySwitchOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); setIsHRMenuOpen(false); setOpenCategory(null); }, [currentPage]);

  const handleSignOut       = () => { logout(); navigate("/"); };
  const navTo               = (page: string) => { setCurrentPage(page); setIsHRMenuOpen(false); setOpenCategory(null); setIsMobileMenuOpen(false); };
  const handleFactorySwitch = (id: string)   => { setActiveFactory(id); setIsFactorySwitchOpen(false); setIsMobileMenuOpen(false); };
  const openProfile         = () => { setIsProfileOpen(false); setShowProfilePanel(true); };
  const toggleCategory      = (cat: ModuleCategory) => setOpenCategory(prev => prev === cat ? null : cat);

  // Mobile accordion state
  const [mobileOpenCat, setMobileOpenCat] = useState<ModuleCategory | null>(null);
  const toggleMobileCat = (cat: ModuleCategory) => setMobileOpenCat(prev => prev === cat ? null : cat);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
    :root{--nav-h:60px;--nav-bg:#0b1120;--nav-border:rgba(255,255,255,0.08);--nav-accent:#3b82f6;--nav-text:#94a3b8;--nav-text-active:#f1f5f9;--nav-hover-bg:rgba(255,255,255,0.06);--nav-active-bg:rgba(59,130,246,0.16);--dropdown-bg:#111827;--font-nav:'DM Sans',sans-serif;}
    .nav-root{position:fixed;top:0;left:0;width:100%;height:var(--nav-h);background:var(--nav-bg);border-bottom:1px solid var(--nav-border);z-index:1000;font-family:var(--font-nav);box-shadow:0 1px 16px rgba(0,0,0,0.4);}
    .nav-inner{max-width:1440px;margin:0 auto;padding:0 20px;height:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;}
    .nav-brand{display:flex;align-items:center;gap:10px;flex-shrink:0;cursor:pointer;background:none;border:none;}
    .nav-brand img{height:32px;width:auto;object-fit:contain;}
    .nav-brand-text{display:none;}
    @media(min-width:480px){.nav-brand-text{display:block;}}
    .nav-brand-name{font-size:13.5px;font-weight:700;color:var(--nav-text-active);line-height:1.2;}
    .nav-brand-sub{font-size:10px;color:#334155;letter-spacing:0.5px;margin-top:1px;}
    .nav-menu{display:none;align-items:center;gap:2px;flex:1;padding-left:20px;}
    @media(min-width:1024px){.nav-menu{display:flex;}}
    .nav-btn{display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:7px;font-size:13px;font-weight:500;color:var(--nav-text);background:transparent;border:none;cursor:pointer;transition:background 0.15s,color 0.15s;white-space:nowrap;font-family:var(--font-nav);}
    .nav-btn:hover{background:var(--nav-hover-bg);color:var(--nav-text-active);}
    .nav-btn.active{background:var(--nav-active-bg);color:var(--nav-accent);}
    .nav-btn svg{font-size:13px;flex-shrink:0;}

    /* ── HR dropdown ──────────────────────────────────────── */
    .nav-dropdown{position:relative;}
    .nav-dropdown-panel{
      position:absolute;top:calc(100% + 8px);left:0;
      width:300px;
      background:var(--dropdown-bg);
      border:1px solid var(--nav-border);
      border-radius:10px;
      box-shadow:0 16px 40px rgba(0,0,0,0.5);
      overflow:hidden;
      animation:dropIn 0.15s ease;
      z-index:100;
    }
    @keyframes dropIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}

    /* Category header row */
    .nav-cat-btn{
      width:100%;display:flex;align-items:center;justify-content:space-between;
      gap:10px;padding:11px 16px;
      font-size:12.5px;font-weight:600;
      color:var(--nav-text-active);
      background:transparent;border:none;cursor:pointer;
      font-family:var(--font-nav);text-align:left;
      transition:background 0.12s;
      border-bottom:1px solid var(--nav-border);
    }
    .nav-cat-btn:last-child{border-bottom:none;}
    .nav-cat-btn:hover{background:rgba(255,255,255,0.04);}
    .nav-cat-btn.open{background:rgba(59,130,246,0.08);color:var(--nav-accent);}
    .nav-cat-btn-left{display:flex;align-items:center;gap:8px;}
    .nav-cat-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
    .nav-cat-dot.core{background:#3b82f6;}
    .nav-cat-dot.lifecycle{background:#10b981;}
    .nav-cat-dot.compliance{background:#f59e0b;}
    .nav-cat-chevron{font-size:10px;transition:transform 0.2s;opacity:0.6;flex-shrink:0;}
    .nav-cat-chevron.open{transform:rotate(180deg);}
    .nav-cat-count{font-size:10px;color:#475569;font-weight:500;margin-left:4px;}

    /* Module list inside accordion */
    .nav-cat-items{
      background:rgba(0,0,0,0.2);
      border-bottom:1px solid var(--nav-border);
      max-height:0;overflow:hidden;
      transition:max-height 0.22s ease;
    }
    .nav-cat-items.open{max-height:400px;overflow-y:auto;}
    .nav-dropdown-item{
      width:100%;display:flex;align-items:center;gap:10px;
      padding:9px 16px 9px 32px;
      font-size:12.5px;font-weight:400;
      color:var(--nav-text);background:transparent;border:none;
      cursor:pointer;transition:background 0.12s,color 0.12s;
      font-family:var(--font-nav);text-align:left;
    }
    .nav-dropdown-item:hover{background:rgba(255,255,255,0.05);color:var(--nav-text-active);}
    .nav-dropdown-item.active{background:var(--nav-active-bg);color:var(--nav-accent);font-weight:500;}
    .nav-dropdown-item svg{font-size:12px;flex-shrink:0;opacity:0.7;}

    /* Reports direct link */
    .nav-reports-btn{
      width:100%;display:flex;align-items:center;gap:10px;
      padding:11px 16px;
      font-size:12.5px;font-weight:600;
      color:var(--nav-text);background:transparent;border:none;
      cursor:pointer;transition:background 0.12s,color 0.12s;
      font-family:var(--font-nav);text-align:left;
      border-top:1px solid var(--nav-border);
    }
    .nav-reports-btn:hover{background:rgba(255,255,255,0.04);color:var(--nav-text-active);}
    .nav-reports-btn.active{background:var(--nav-active-bg);color:var(--nav-accent);}
    .nav-reports-btn svg{font-size:13px;opacity:0.7;}

    .nav-chevron{font-size:10px !important;margin-left:2px;transition:transform 0.2s;}
    .nav-chevron.open{transform:rotate(180deg);}
    .nav-breadcrumb{display:none;align-items:center;gap:6px;font-size:11px;color:#334155;padding-left:16px;border-left:1px solid rgba(255,255,255,0.08);margin-left:4px;white-space:nowrap;overflow:hidden;}
    @media(min-width:1024px){.nav-breadcrumb{display:flex;}}
    .nav-breadcrumb-cat{color:#475569;font-size:10.5px;}
    .nav-breadcrumb-active{color:var(--nav-accent);font-weight:600;font-size:11.5px;}

    /* ── Right side ────────────────────────────────────────── */
    .nav-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}
    .nav-factory-switcher{position:relative;}
    .nav-factory-badge{display:none;align-items:center;gap:5px;padding:4px 10px;background:rgba(37,99,235,0.1);border:1px solid rgba(59,130,246,0.18);border-radius:20px;font-size:11px;color:#7ea8d8;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;cursor:default;}
    @media(min-width:1200px){.nav-factory-badge{display:flex;}}
    .nav-factory-badge.clickable{cursor:pointer;transition:background 0.15s;}
    .nav-factory-badge.clickable:hover{background:rgba(37,99,235,0.18);}
    .nav-factory-dot{width:5px;height:5px;border-radius:50%;background:#3b82f6;animation:navPulse 2s ease infinite;flex-shrink:0;}
    @keyframes navPulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
    .nav-factory-panel{position:absolute;top:calc(100% + 8px);right:0;min-width:220px;background:var(--dropdown-bg);border:1px solid var(--nav-border);border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,0.5);overflow:hidden;animation:dropIn 0.15s ease;z-index:100;}
    .nav-factory-panel-header{padding:8px 14px 6px;font-size:10px;font-weight:600;color:#334155;letter-spacing:1px;text-transform:uppercase;}
    .nav-factory-panel-item{width:100%;display:flex;align-items:center;gap:10px;padding:9px 14px;font-size:12.5px;font-weight:500;color:var(--nav-text);background:transparent;border:none;cursor:pointer;transition:background 0.12s,color 0.12s;font-family:var(--font-nav);text-align:left;}
    .nav-factory-panel-item:hover{background:rgba(255,255,255,0.06);color:var(--nav-text-active);}
    .nav-factory-panel-item.active{background:var(--nav-active-bg);color:#7ea8d8;}
    .nav-factory-panel-item .fcheck{margin-left:auto;font-size:10px;color:var(--nav-accent);}
    .nav-profile-btn{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--nav-border);cursor:pointer;transition:background 0.15s;}
    .nav-profile-btn:hover{background:rgba(255,255,255,0.08);}
    .nav-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700;color:#fff;flex-shrink:0;}
    .nav-profile-text{display:none;}
    @media(min-width:768px){.nav-profile-text{display:block;}}
    .nav-profile-name{font-size:12px;font-weight:600;color:var(--nav-text-active);line-height:1.2;}
    .nav-profile-role{font-size:10px;color:#334155;}
    .nav-profile-panel{position:absolute;top:calc(100% + 8px);right:0;width:220px;background:var(--dropdown-bg);border:1px solid var(--nav-border);border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,0.5);overflow:hidden;z-index:100;animation:dropIn 0.15s ease;}
    .nav-profile-header{padding:12px 16px;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--nav-border);}
    .nav-profile-header-name{font-size:13px;font-weight:600;color:var(--nav-text-active);}
    .nav-profile-header-email{font-size:11px;color:#334155;margin-top:2px;word-break:break-all;}
    .nav-profile-header-factory{font-size:11px;color:#7ea8d8;margin-top:4px;display:flex;align-items:center;gap:5px;}
    .nav-role-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;margin-top:4px;}
    .nav-profile-action{width:100%;display:flex;align-items:center;gap:9px;padding:10px 16px;font-size:13px;font-weight:500;color:var(--nav-text);background:transparent;border:none;cursor:pointer;transition:background 0.12s;font-family:var(--font-nav);text-align:left;}
    .nav-profile-action:hover{background:rgba(255,255,255,0.06);color:var(--nav-text-active);}
    .nav-profile-action.danger{color:#f87171;}
    .nav-profile-action.danger:hover{background:rgba(248,113,113,0.07);}
    .nav-profile-action.support{color:#60a5fa;}
    .nav-profile-action.support:hover{background:rgba(59,130,246,0.08);color:#93c5fd;}
    .nav-profile-divider{border-top:1px solid var(--nav-border);}

    /* ── Mobile ────────────────────────────────────────────── */
    .nav-mobile-toggle{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:7px;background:rgba(255,255,255,0.04);border:1px solid var(--nav-border);color:var(--nav-text);cursor:pointer;font-size:14px;transition:background 0.15s;}
    .nav-mobile-toggle:hover{background:rgba(255,255,255,0.08);}
    @media(min-width:1024px){.nav-mobile-toggle{display:none;}}
    .nav-mobile-panel{position:fixed;top:var(--nav-h);left:0;right:0;background:#0b1120;border-bottom:1px solid var(--nav-border);z-index:999;padding:12px 16px 16px;box-shadow:0 8px 24px rgba(0,0,0,0.5);animation:slideDown 0.18s ease;max-height:calc(100vh - var(--nav-h));overflow-y:auto;}
    @keyframes slideDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
    @media(min-width:1024px){.nav-mobile-panel{display:none !important;}}
    .nav-mobile-btn{width:100%;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:8px;font-size:13.5px;font-weight:500;color:var(--nav-text);background:transparent;border:none;cursor:pointer;transition:background 0.12s,color 0.12s;font-family:var(--font-nav);text-align:left;margin-bottom:2px;}
    .nav-mobile-btn:hover{background:var(--nav-hover-bg);color:var(--nav-text-active);}
    .nav-mobile-btn.active{background:var(--nav-active-bg);color:var(--nav-accent);}
    .nav-mobile-cat-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--nav-text-active);background:rgba(255,255,255,0.03);border:none;cursor:pointer;font-family:var(--font-nav);text-align:left;margin-bottom:2px;}
    .nav-mobile-cat-btn.open{background:rgba(59,130,246,0.1);color:var(--nav-accent);}
    .nav-mobile-cat-items{padding-left:12px;display:none;}
    .nav-mobile-cat-items.open{display:block;}
    .nav-mobile-section-label{font-size:10px;font-weight:600;color:#334155;letter-spacing:1.2px;text-transform:uppercase;padding:10px 14px 6px;}
    .nav-mobile-divider{border-top:1px solid var(--nav-border);margin:8px 0;}
    .nav-mobile-factory-info{padding:10px 14px;background:rgba(37,99,235,0.08);border-radius:8px;margin-bottom:8px;}
    .nav-mobile-factory-name{font-size:12px;color:#7ea8d8;font-weight:600;}
    .nav-mobile-factory-role{font-size:11px;color:#334155;margin-top:2px;}
    @media print{.nav-root,.nav-mobile-panel{display:none !important;}}
  `;

  const catDotClass: Record<ModuleCategory, string> = {
    core: 'core', lifecycle: 'lifecycle', compliance: 'compliance',
  };

  return (
    <>
      <style>{CSS}</style>
      <SkipNav />

      <nav className="nav-root print:hidden" aria-label="Main navigation">
        <div className="nav-inner">

          {/* Brand */}
          <button className="nav-brand" onClick={() => navTo("dashboard")} aria-label="Go to dashboard">
            <img src={skTechLogo} alt="SK-TECH"/>
            <div className="nav-brand-text">
              <div className="nav-brand-name">SK-TECH RMS</div>
              <div className="nav-brand-sub">HR Management System</div>
            </div>
          </button>

          {/* Desktop nav */}
          <div className="nav-menu" role="menubar">
            <button className={`nav-btn ${currentPage === "dashboard" ? "active" : ""}`} onClick={() => navTo("dashboard")}>
              <FaHome aria-hidden="true" /> Dashboard
            </button>

            {/* HR Modules dropdown */}
            <div className="nav-dropdown" ref={hrMenuRef}>
              <button
                className={`nav-btn ${activeModule ? "active" : ""}`}
                onClick={() => setIsHRMenuOpen(v => !v)}
                aria-expanded={isHRMenuOpen}
                aria-haspopup="menu"
              >
                <FaLayerGroup aria-hidden="true" /> HR Modules
                <FaChevronDown aria-hidden="true" className={`nav-chevron ${isHRMenuOpen ? "open" : ""}`}/>
              </button>

              {isHRMenuOpen && (
                <div className="nav-dropdown-panel" role="menu">
                  {/* Category accordion rows */}
                  {hrModuleGroups.map(group => (
                    <div key={group.category}>
                      {/* Category header — click to expand */}
                      <button
                        className={`nav-cat-btn ${openCategory === group.category ? "open" : ""}`}
                        onClick={() => toggleCategory(group.category as ModuleCategory)}
                        aria-expanded={openCategory === group.category}
                      >
                        <span className="nav-cat-btn-left">
                          <span className={`nav-cat-dot ${catDotClass[group.category as ModuleCategory]}`}/>
                          {group.label}
                          <span className="nav-cat-count">({group.items.length})</span>
                        </span>
                        <FaChevronDown className={`nav-cat-chevron ${openCategory === group.category ? "open" : ""}`}/>
                      </button>

                      {/* Module list */}
                      <div className={`nav-cat-items ${openCategory === group.category ? "open" : ""}`}>
                        {group.items.map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            className={`nav-dropdown-item ${currentPage === id ? "active" : ""}`}
                            onClick={() => navTo(id)}
                            role="menuitem"
                          >
                            <Icon aria-hidden="true"/> {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Reports — direct link, no accordion */}
                  {hrModulesUncategorized.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      className={`nav-reports-btn ${currentPage === id ? "active" : ""}`}
                      onClick={() => navTo(id)}
                      role="menuitem"
                    >
                      <Icon aria-hidden="true"/> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Breadcrumb */}
            {activeModule && (
              <div className="nav-breadcrumb">
                {activeModule.category && (
                  <>
                    <span className="nav-breadcrumb-cat">{CATEGORY_LABELS[activeModule.category]}</span>
                    <span>›</span>
                  </>
                )}
                <span className="nav-breadcrumb-active">{activeModule.label}</span>
              </div>
            )}
          </div>

          <div className="nav-right">
            {/* Factory switcher */}
            {user && (
              <div className="nav-factory-switcher" ref={factorySwitchRef}>
                {hasMultipleFactories ? (
                  <>
                    <button className="nav-factory-badge clickable" onClick={() => setIsFactorySwitchOpen(v => !v)} aria-expanded={isFactorySwitchOpen}>
                      <div className="nav-factory-dot"/>
                      <span>{activeFactory?.nameEn ?? user.factoryName}</span>
                      <FaExchangeAlt style={{ fontSize: "9px", marginLeft: 2, opacity: 0.6 }}/>
                    </button>
                    {isFactorySwitchOpen && (
                      <div className="nav-factory-panel">
                        <div className="nav-factory-panel-header">Switch Factory</div>
                        {accessibleFactories.map(f => (
                          <button key={f.id} className={`nav-factory-panel-item ${f.id === activeFactoryId ? "active" : ""}`} onClick={() => handleFactorySwitch(f.id)}>
                            <FaBuilding style={{ fontSize: "11px", opacity: 0.5 }}/><span>{f.nameEn}</span>
                            {f.id === activeFactoryId && <span className="fcheck">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="nav-factory-badge">
                    <div className="nav-factory-dot"/>
                    <span>{activeFactory?.nameEn ?? user.factoryName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            <div style={{ position: "relative" }} ref={profileRef}>
              <button className="nav-profile-btn" onClick={() => setIsProfileOpen(v => !v)} aria-expanded={isProfileOpen}>
                <div className="nav-avatar">{initials}</div>
                <div className="nav-profile-text">
                  <div className="nav-profile-name">{userName.split(" ")[0]}</div>
                  <div className="nav-profile-role">{roleMeta?.label ?? "User"}</div>
                </div>
              </button>
              {isProfileOpen && (
                <div className="nav-profile-panel">
                  <div className="nav-profile-header">
                    <div className="nav-profile-header-name">{userName}</div>
                    <div className="nav-profile-header-email">{user?.email}</div>
                    <div className="nav-profile-header-factory"><FaBuilding style={{ fontSize: "10px" }}/>{activeFactory?.nameEn ?? user?.factoryName}</div>
                    {roleMeta && <div className="nav-role-badge" style={{ background: roleMeta.bg, color: roleMeta.color }}>{roleMeta.label}</div>}
                  </div>
                  <button className="nav-profile-action" onClick={openProfile}>
                    <FaUserCircle style={{ fontSize: "10px", color: "#3b82f6" }}/> Profile
                  </button>
                  <button className="nav-profile-action support" onClick={() => { setIsProfileOpen(false); setShowSupportPanel(true); }}>
                    <FaHeadset style={{ color: "#60a5fa", fontSize: "10px", flexShrink: 0 }}/>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "10px", fontWeight: 500, lineHeight: "1.2" }}>SK-TECH Support</span>
                      <span style={{ fontSize: "10px", color: "#475569", lineHeight: "1.2", marginTop: "2px" }}>Help, FAQ &amp; contact</span>
                    </div>
                  </button>
                  <div className="nav-profile-divider">
                    <button className="nav-profile-action danger" onClick={handleSignOut}>
                      <FaSignOutAlt aria-hidden="true" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="nav-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(v => !v)}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {isMobileMenuOpen && (
        <div className="nav-mobile-panel print:hidden" ref={mobileMenuRef} id="mobile-menu" role="navigation">
          {user && (
            <div className="nav-mobile-factory-info">
              <div className="nav-mobile-factory-name"><FaBuilding style={{ marginRight: 5, fontSize: "11px" }}/>{activeFactory?.nameEn ?? user.factoryName}</div>
              <div className="nav-mobile-factory-role">{roleMeta?.label} · {user.designation}</div>
            </div>
          )}
          {hasMultipleFactories && (
            <>
              <div className="nav-mobile-section-label">Switch Factory</div>
              {accessibleFactories.map(f => (
                <button key={f.id} className={`nav-mobile-btn ${f.id === activeFactoryId ? "active" : ""}`} onClick={() => handleFactorySwitch(f.id)}>
                  <FaExchangeAlt style={{ fontSize: "11px" }}/> {f.nameEn}
                  {f.id === activeFactoryId && <span style={{ marginLeft: "auto", fontSize: "10px", color: "#3b82f6" }}>✓</span>}
                </button>
              ))}
              <div className="nav-mobile-divider"/>
            </>
          )}

          <button className={`nav-mobile-btn ${currentPage === "dashboard" ? "active" : ""}`} onClick={() => navTo("dashboard")}>
            <FaHome aria-hidden="true"/> Dashboard
          </button>
          <div className="nav-mobile-divider"/>

          {/* Mobile category accordion */}
          {hrModuleGroups.map(group => (
            <div key={group.category}>
              <button
                className={`nav-mobile-cat-btn ${mobileOpenCat === group.category ? "open" : ""}`}
                onClick={() => toggleMobileCat(group.category as ModuleCategory)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`nav-cat-dot ${catDotClass[group.category as ModuleCategory]}`}/>
                  {group.label}
                </span>
                <FaChevronDown className={`nav-cat-chevron ${mobileOpenCat === group.category ? "open" : ""}`}/>
              </button>
              <div className={`nav-mobile-cat-items ${mobileOpenCat === group.category ? "open" : ""}`}>
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button key={id} className={`nav-mobile-btn ${currentPage === id ? "active" : ""}`} onClick={() => navTo(id)}>
                    <Icon aria-hidden="true"/> {label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {hrModulesUncategorized.length > 0 && (
            <>
              <div className="nav-mobile-divider"/>
              {hrModulesUncategorized.map(({ id, label, icon: Icon }) => (
                <button key={id} className={`nav-mobile-btn ${currentPage === id ? "active" : ""}`} onClick={() => navTo(id)}>
                  <Icon aria-hidden="true"/> {label}
                </button>
              ))}
            </>
          )}

          <div className="nav-mobile-divider"/>
          <div className="nav-mobile-section-label">Account</div>
          <button className="nav-mobile-btn" onClick={openProfile} style={{ color: "#7ea8d8" }}><FaUserCircle aria-hidden="true"/> View Profile</button>
          <button className="nav-mobile-btn" onClick={handleSignOut} style={{ color: "#f87171" }}><FaSignOutAlt aria-hidden="true"/> Sign Out</button>
        </div>
      )}

      {showProfilePanel && user && <ProfilePanel onClose={() => setShowProfilePanel(false)}/>}

      {showSupportPanel && (
        <>
          <div aria-hidden="true" style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(5px)'}} onClick={() => setShowSupportPanel(false)}/>
          <div style={{position:'fixed',top:0,right:0,bottom:0,width:'100%',maxWidth:'480px',background:'#0b1120',borderLeft:'1px solid rgba(255,255,255,0.09)',zIndex:2001,boxShadow:'-16px 0 60px rgba(0,0,0,0.6)',animation:'ppSlide 0.28s cubic-bezier(0.22,0.68,0,1.08)',display:'flex',flexDirection:'column',fontFamily:"'DM Sans',sans-serif"}}>
            <style>{`@keyframes ppSlide{from{transform:translateX(100%);}to{transform:translateX(0);}}`}</style>
            <SupportPanel onClose={() => setShowSupportPanel(false)}/>
          </div>
        </>
      )}
    </>
  );
}