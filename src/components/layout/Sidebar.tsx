import React from 'react';
import {
  LayoutDashboard,
  Edit3,
  LineChart,
  Box,
  Calculator,
  Activity,
  Sparkles,
  BookOpen,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Atom,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { ViewSection } from '../../types';

interface NavItem {
  id: ViewSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'equation-studio', label: 'Equation Studio', icon: Edit3 },
  { id: '2d-graphs', label: '2D Graph Explorer', icon: LineChart },
  { id: '3d-visualisation', label: '3D Visualisation Studio', icon: Box },
  { id: 'solver', label: 'Equation Solver', icon: Calculator },
  { id: 'calculus-lab', label: 'Calculus Lab', icon: Activity },
  { id: 'ai-tutor', label: 'AI Mathematics Tutor', icon: Sparkles, tag: 'AI' },
  { id: 'library', label: 'My Library', icon: BookOpen },
  { id: 'history', label: 'Calculation History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col border-r border-border bg-sidebar transition-all duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-border">
        <div
          className="flex items-center gap-2.5 overflow-hidden cursor-pointer select-none"
          onClick={() => setActiveSection('overview')}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-panel text-text-main border border-border flex-shrink-0">
            <Atom className="w-4 h-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="truncate">
              <span className="text-sm font-bold tracking-normal text-text-main block leading-tight">
                MathVision
              </span>
              <p className="text-[11px] text-text-muted truncate leading-tight">Mathematics, Made Visible</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded text-text-muted hover:text-text-main hover:bg-panel transition-colors hidden md:block"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors group relative ${
                isActive
                  ? 'bg-text-main text-background font-bold border border-text-main'
                  : 'text-text-muted hover:text-text-main hover:bg-panel'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-background' : 'text-text-muted group-hover:text-text-main'
                }`}
              />
              {!sidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.tag && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-sm border ${
                        isActive
                          ? 'border-background/40 bg-background/20 text-background'
                          : 'border-border bg-panel text-text-muted'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-border text-xs text-text-muted space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-text-main font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-text-main"></span>
              Client Engine Ready
            </span>
            <span className="text-[11px] text-text-muted">v1.0</span>
          </div>
          <p className="text-[11px] text-text-muted">In-Browser Mathematical Platform</p>
        </div>
      )}
    </aside>
  );
};
