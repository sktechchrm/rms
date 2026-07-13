import { useState, lazy, Suspense } from "react";
import Layout from "./Layout";
import Dashboard from "../components/modules/dashboard/Dashboard";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { useAuth } from "../context/AuthContext";
import RouteGuard from "../security/RouteGuard";
import SessionWarningBanner from "../components/common/SessionWarningBanner";

// ── Code splitting: each HR module loads on first access only ─────────────────
const MaternityBenefit  = lazy(() => import("../components/modules/maternityBenefit/maternityBenefit"));
const FinalSettlement   = lazy(() => import("../components/modules/finalSettlement/FinalSettlement"));
const LeftNotice        = lazy(() => import("../components/modules/LeftEmployeeNotice/EmployeeNoticeView"));
const RequisitionManager= lazy(() => import("../components/modules/requisition/RequisitionManager"));
const IncrementManager  = lazy(() => import("../components/modules/incrementBill/IncrementManager"));
const PersonalFile      = lazy(() => import("../components/modules/employeePersonalFile/EmployeeFileSystem"));
const Meeting           = lazy(() => import("../components/modules/meeting/MeetingManager"));
const WorkerRights      = lazy(() => import("../components/modules/mapp/WorkerRights"));
const WorkerGuidelineViewer = lazy(() => import("../components/modules/workerGuideline/WorkerGuidelineViewer"));
const ReportModule          = lazy(() => import("../components/modules/reports/ReportModule"));
const AuthorityControlModule = lazy(() => import("../components/modules/authorityControl/AuthorityControl"));
const DatabaseAdminModule    = lazy(() => import("../components/modules/admin/DatabaseAdmin"));
const GrievanceModule        = lazy(() => import("../components/modules/grievance/GrievanceModule"));
const AuditVisitManager      = lazy(() => import("../components/modules/auditVisit/AuditVisitManager"));
const LegalDocumentManager   = lazy(() => import("../components/modules/legalDocument/LegalDocumentManager"));
const MiscBillManager        = lazy(() => import("../components/modules/miscBill/MiscBillManager"));
const LivingWageManager      = lazy(() => import("../components/modules/livingWage/LivingWageManager"));
const SupplierManager        = lazy(() => import("../components/modules/supplierAssessment/SupplierManager"));
const DisciplinaryActionManager = lazy(() => import("../components/modules/disciplinaryAction/DisciplinaryActionManager"));
const CandidateManager       = lazy(() => import("../components/modules/candidatePipeline/CandidateManager"));
const OnboardingManager      = lazy(() => import("../components/modules/onboardingChecklist/OnboardingManager"));
const WagesGridManager       = lazy(() => import("../components/modules/wagesGrid/WagesGridManager"));
const PerformanceManager     = lazy(() => import("../components/modules/employeePerformance/PerformanceManager"));
const EmergencyLogManager    = lazy(() => import("../components/modules/emergencyLog/EmergencyLogManager"));
const TrainerManager         = lazy(() => import("../components/modules/trainerList/TrainerManager"));
const TrainingManager        = lazy(() => import("../components/modules/trainingModule/TrainingManager"));
const SettingsPage            = lazy(() => import("../components/modules/settingsPage/SettingsPage"));
const RiskAssessmentManager   = lazy(() => import("../components/modules/riskAssessment/RiskAssessmentManager"));
const ComplianceAuditManager  = lazy(() => import("../components/modules/complianceAudit/ComplianceAuditManager"));

// ── Skeleton loader — shown while a lazy module chunk is downloading ──────────
// Uses CSS animation (no JS timers) so it renders instantly and is safe for
// any module. The shimmer effect signals "loading" without a jarring spinner.
function ModuleLoader() {
  return (
    <div
      role="status"
      aria-label="Loading module, please wait"
      style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}
    >
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -800px 0; }
          100% { background-position:  800px 0; }
        }
        .skeleton-block {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 8px;
        }
      `}</style>

      {/* Header bar skeleton */}
      <div className="skeleton-block" style={{ height: "48px", width: "55%", marginBottom: "28px" }} />

      {/* Two-column form rows */}
      {[1, 2, 3].map(row => (
        <div key={row} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div className="skeleton-block" style={{ height: "13px", width: "40%", marginBottom: "8px" }} />
            <div className="skeleton-block" style={{ height: "40px" }} />
          </div>
          <div>
            <div className="skeleton-block" style={{ height: "13px", width: "40%", marginBottom: "8px" }} />
            <div className="skeleton-block" style={{ height: "40px" }} />
          </div>
        </div>
      ))}

      {/* Full-width row */}
      <div style={{ marginBottom: "16px" }}>
        <div className="skeleton-block" style={{ height: "13px", width: "30%", marginBottom: "8px" }} />
        <div className="skeleton-block" style={{ height: "40px" }} />
      </div>

      {/* Result card skeleton */}
      <div className="skeleton-block" style={{ height: "120px", marginTop: "28px", borderRadius: "14px" }} />

      {/* Screen-reader announcement */}
      <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        Loading…
      </span>
    </div>
  );
}


// AUDIT FIX: currentPage previously always initialized to "dashboard" —
// a browser refresh while inside any module (Personal File, Requisition,
// etc.) would silently bounce the person back to the dashboard, losing
// their place. Now persisted to sessionStorage (per-tab, cleared when
// the tab closes — deliberately NOT localStorage, so a genuinely fresh
// visit still starts at the dashboard rather than reopening wherever a
// previous session left off days later) and restored on mount. Wrapped
// in try/catch since sessionStorage can throw in some restricted
// embedding contexts (e.g. certain iframe sandboxes) — falls back to
// "dashboard" if reading/writing fails, matching the original behavior
// rather than crashing the app.
const CURRENT_PAGE_STORAGE_KEY = 'rms_current_page';

function readStoredPage(): string {
  try {
    return sessionStorage.getItem(CURRENT_PAGE_STORAGE_KEY) || 'dashboard';
  } catch {
    return 'dashboard';
  }
}

function writeStoredPage(page: string): void {
  try {
    sessionStorage.setItem(CURRENT_PAGE_STORAGE_KEY, page);
  } catch {
    // sessionStorage unavailable — page just won't survive a refresh, no crash.
  }
}

// ── Main shell ────────────────────────────────────────────────────────────────
export default function RewardApp() {
  const [currentPage, setCurrentPageState] = useState(readStoredPage);
  const { user } = useAuth();

  const setCurrentPage = (page: string) => {
    setCurrentPageState(page);
    writeStoredPage(page);
  };

  const goTo = (page: string) => setCurrentPage(page);

  const renderPage = () => {
    if (currentPage === "dashboard") return <Dashboard setCurrentPage={goTo} />;

    // RouteGuard checks both role minimum AND allowedModules — single enforced gate
    return (
      <RouteGuard moduleId={currentPage}>
        <ErrorBoundary moduleName={currentPage}>
          <Suspense fallback={<ModuleLoader />}>
            {currentPage === "maternity"       && <MaternityBenefit />}
            {currentPage === "settlement"      && <FinalSettlement />}
            {currentPage === "leftnotice"      && <LeftNotice />}
            {currentPage === "requisition"     && <RequisitionManager />}
            {currentPage === "increment"       && <IncrementManager />}
            {currentPage === "personalfile"    && <PersonalFile />}
            {currentPage === "meeting"         && <Meeting />}
            {currentPage === "workerrights"    && <WorkerRights />}
            {currentPage === "workerguideline" && <WorkerGuidelineViewer />}
            {currentPage === "reports"         && <ReportModule onNavigateToModule={(mod, _rec) => {
              // Map DbModule names → currentPage IDs used by RewardApp
              const DB_TO_PAGE: Record<string, string> = {
                employees:    'personalfile',
                settlements:  'settlement',
                maternity:    'maternity',
                leftnotice:   'leftnotice',
                requisitions: 'requisition',
                increments:   'increment',
                meetings:     'meeting',
                grievance:    'grievance',
                auditvisits:      'auditvisit',
                legaldocuments:   'legaldocument',
                miscbills:        'miscbill',
                livingwage:       'livingwage',
                suppliers:        'supplierassessment',
                disciplinaryactions: 'disciplinaryaction',
                candidates:       'candidatepipeline',
                onboarding:       'onboardingchecklist',
                wagesgrid:        'wagesgrid',
                performance:      'performance',
                emergencylog:     'emergencylog',
                trainers:         'trainerlist',
                trainingsessions: 'trainingmodule',
                riskassessment:   'riskassessment',
                complianceaudit:  'complianceaudit',
              };
              const page = DB_TO_PAGE[mod] ?? mod;
              goTo(page);
            }} />}
            {currentPage === "authority"       && <AuthorityControlModule />}
            {currentPage === "database"        && <DatabaseAdminModule />}
            {currentPage === "grievance"       && <GrievanceModule />}
            {currentPage === "auditvisit"      && <AuditVisitManager />}
            {currentPage === "legaldocument"   && <LegalDocumentManager />}
            {currentPage === "miscbill"        && <MiscBillManager />}
            {currentPage === "livingwage"      && <LivingWageManager />}
            {currentPage === "supplierassessment" && <SupplierManager />}
            {currentPage === "disciplinaryaction" && <DisciplinaryActionManager />}
            {currentPage === "candidatepipeline" && <CandidateManager />}
            {currentPage === "onboardingchecklist" && <OnboardingManager />}
            {currentPage === "wagesgrid" && <WagesGridManager />}
            {currentPage === "performance" && <PerformanceManager />}
            {currentPage === "emergencylog" && <EmergencyLogManager />}
            {currentPage === "trainerlist" && <TrainerManager />}
            {currentPage === "trainingmodule" && <TrainingManager />}
            {currentPage === "settings" && <SettingsPage />}
            {currentPage === "riskassessment" && <RiskAssessmentManager />}
            {currentPage === "complianceaudit" && <ComplianceAuditManager />}
          </Suspense>
        </ErrorBoundary>
      </RouteGuard>
    );
  };

  return (
    <>
      <SessionWarningBanner />
      <Layout currentPage={currentPage} setCurrentPage={goTo}>
        {renderPage()}
      </Layout>
    </>
  );
}