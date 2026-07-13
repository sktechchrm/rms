// ─────────────────────────────────────────────────────────────────────────────
// DashboardSidebar.tsx
// Path: src/components/modules/dashboard/DashboardSidebar.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { IconType } from 'react-icons';
import { FaCog } from 'react-icons/fa';

export type CardCategory = 'core' | 'lifecycle' | 'compliance';

export interface SidebarCardItem {
  id: string;
  title: string;
  icon: IconType;
}

export interface SidebarCardGroup {
  category: CardCategory;
  title: string;
  titleBn: string;
  items: SidebarCardItem[];
}

interface Props {
  cardGroups: SidebarCardGroup[];
  expandedCategory: CardCategory | null;
  onToggleCategory: (category: CardCategory) => void;
  onCardClick: (id: string) => void;
  onSettingsClick: () => void;
}

export default function DashboardSidebar({
  cardGroups,
  expandedCategory,
  onToggleCategory,
  onCardClick,
  onSettingsClick,
}: Props) {
  return (
    <aside className="db-sidebar" aria-label="Module categories">
      <div className="db-sidebar-scroll">
        {cardGroups.map((group, gi) => {
          const isActive = expandedCategory === group.category;
          return (
            <div key={group.category}>
              {gi > 0 && <div className="db-sidebar-cat-divider" />}
              {/* Category button only — no inline item list.
                  Clicking switches the main content area to show
                  that category's cards; no expand/collapse in sidebar. */}
              <button
                className={`db-sidebar-cat ${isActive ? 'open' : ''}`}
                onClick={() => { if (!isActive) onToggleCategory(group.category); }}
                aria-current={isActive ? 'true' : undefined}
              >
                <div>
                  <div className="db-sidebar-cat-title">{group.title}</div>
                  <div className="db-sidebar-cat-sub">{group.titleBn}</div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="db-sidebar-footer">
        <button className="db-sidebar-settings" onClick={onSettingsClick}>
          <FaCog /> Settings
        </button>
      </div>
    </aside>
  );
}