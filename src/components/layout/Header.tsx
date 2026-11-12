import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Save,
  Download,
  Plus,
  Menu,
  Check,
  FolderKanban,
  FileText,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { ExportService } from '../../services/export/exportService';

const SECTION_TITLES: Record<string, string> = {
  overview: 'Workspace Overview',
  'equation-studio': 'Equation Studio & Editor',
  '2d-graphs': '2D Graph Explorer (Plotly)',
  '3d-visualisation': '3D Visualisation Studio (Three.js)',
  solver: 'Equation Solver & Step-by-Step Proofs',
  'calculus-lab': 'Calculus Lab (Derivatives & Integrals)',
  'ai-tutor': 'AI Mathematics Tutor',
  library: 'Project Library & Storage',
  history: 'Calculation History',
  settings: 'Application Settings',
};

export const Header: React.FC = () => {
  const {
    activeSection,
    theme,
    toggleTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentProject,
    saveCurrentProject,
    addEquation,
    equations,
    history,
  } = useAppStore();

  const [quickInput, setQuickInput] = useState('');
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleSave = async () => {
    await saveCurrentProject();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      addEquation(quickInput.trim());
      setQuickInput('');
      setQuickModalOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-20 flex items-center justify-between h-14 px-5 border-b border-border bg-background/95 backdrop-blur-xs transition-all duration-200 ${
        sidebarCollapsed ? 'ml-16' : 'ml-60'
      }`}
    >
      {/* Left: Mobile Toggle & Section Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 -ml-1.5 rounded text-text-muted hover:text-text-main md:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-text-main leading-tight">
            {SECTION_TITLES[activeSection] || 'MathVision'}
          </h1>
          <p className="text-[11px] text-text-muted hidden sm:block leading-none mt-0.5">
            {currentProject ? `Project: ${currentProject.name}` : 'Default Sandbox Project'}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Add Equation Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickModalOpen(true)}
          className="hidden sm:inline-flex"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Equation</span>
        </Button>

        {/* Save Project Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSave}
          title="Save active workspace to IndexedDB"
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-text-main" />
              <span className="hidden sm:inline text-text-main">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </Button>

        {/* Export Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            title="Export project or workspace data"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {exportMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-48 rounded-md border border-border bg-panel shadow-md py-1 z-50 text-xs"
              onClick={() => setExportMenuOpen(false)}
            >
              <button
                onClick={() => ExportService.exportReportPDF('root')}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-text-main hover:bg-panel-hover"
              >
                <FileText className="w-3.5 h-3.5 text-text-muted" />
                <span>Export PDF Summary</span>
              </button>
              <button
                onClick={() => {
                  if (currentProject) ExportService.exportProjectJSON(currentProject);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-text-main hover:bg-panel-hover"
              >
                <FolderKanban className="w-3.5 h-3.5 text-text-muted" />
                <span>Export Project JSON</span>
              </button>
              <button
                onClick={() => ExportService.exportHistoryCSV(history)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-text-main hover:bg-panel-hover"
              >
                <Download className="w-3.5 h-3.5 text-text-muted" />
                <span>Export History CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-text-muted hover:text-text-main" />
          ) : (
            <Moon className="w-4 h-4 text-text-muted hover:text-text-main" />
          )}
        </Button>
      </div>

      {/* Quick Add Equation Modal */}
      <Modal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        title="Quick Equation Input"
        description="Add a mathematical expression to your workspace."
      >
        <form onSubmit={handleQuickAdd} className="space-y-3">
          <Input
            autoFocus
            label="Equation Expression"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="e.g. y = x^2 - 4x + 3 or z = x^2 + y^2"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setQuickModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Equation
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
