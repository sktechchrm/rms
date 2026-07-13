// ─────────────────────────────────────────────────────────────────────────────
// Layout.tsx — extracted from RewardApp.tsx, per explicit request.
// Holds exactly what was asked for: Navigation, the <main> content area,
// and Footer — plus the CSS that already governed their sizing
// (--nav-h/--footer-h variables, .app-shell/.app-main classes), since
// that CSS is specifically about THIS layout, not RewardApp's own
// business logic. Pure file-organization split — no behavior change.
//
// DashboardSidebar.tsx (the 3-category accordion) is deliberately NOT
// rendered here — confirmed scope: it stays used only within
// Dashboard.tsx itself, not app-wide via this Layout.
// Path: src/pages/Layout.tsx
// ─────────────────────────────────────────────────────────────────────────────

import Navigation from "../components/common/Navigation";
import Footer from "../components/common/footer";

interface Props {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, setCurrentPage, children }: Props) {
  return (
    <>
      <style>{`
        :root { --nav-h: 60px; --footer-h: 40px; }
        html, body { margin: 0; padding: 0; background: #f1f5f9; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .app-shell { min-height: 100vh; background: #f1f5f9; }
        .app-main  { padding-top: var(--nav-h); padding-bottom: var(--footer-h);
                     min-height: 100vh; box-sizing: border-box; }
      `}</style>
      <div className="app-shell">
        <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main id="main-content" className="app-main" tabIndex={-1}>{children}</main>
        <Footer />
      </div>
    </>
  );
}
