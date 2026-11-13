import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  Plus,
  Upload,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { ExportService } from '../services/export/exportService';

export const LibraryPage: React.FC = () => {
  const {
    projects,
    currentProject,
    loadProjects,
    createProject,
    openProject,
    deleteProject,
    duplicateProject,
    importProjectJSON,
    setActiveSection,
  } = useAppStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjName.trim()) {
      await createProject(newProjName.trim(), newProjDesc.trim());
      setNewProjName('');
      setNewProjDesc('');
      setCreateModalOpen(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await importProjectJSON(content);
        if (success) {
          setImportStatus('Project successfully imported.');
        } else {
          setImportStatus('Failed to parse project JSON. Check file structure.');
        }
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-text-main" />
            Project Library
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Organize, save, and restore your mathematical workspaces, equations, and view configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* File Import Button */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center font-medium rounded-md text-xs px-3 py-1.5 gap-1.5 border border-border bg-transparent text-text-main hover:bg-panel transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </span>
          </label>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Storage Notice Banner */}
      <div className="rounded-md border border-border bg-panel p-3.5 flex items-start gap-2.5 text-xs text-text-muted">
        <Info className="w-4 h-4 text-text-main flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-text-main">Local Browser Storage Notice:</strong> Projects are saved in your current browser's IndexedDB database. They persist across browser reloads, but are not automatically synchronized to other devices. Use the <strong>Export JSON</strong> option to backup or transfer projects.
        </p>
      </div>

      {importStatus && (
        <div className="p-2.5 rounded-md bg-panel border border-border text-xs text-text-main font-semibold">
          {importStatus}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-md border border-dashed border-border p-6">
            <FolderKanban className="w-10 h-10 text-text-muted/40 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-text-main">No saved projects yet</h3>
            <p className="text-xs text-text-muted mt-0.5 max-w-sm mx-auto">
              Save your current equations and view configuration as a project or import an existing JSON project.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="mt-3"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create First Project
            </Button>
          </div>
        ) : (
          projects.map((proj) => {
            const isCurrent = currentProject?.id === proj.id;

            return (
              <div
                key={proj.id}
                className={`rounded-md border p-4 transition-colors flex flex-col justify-between ${
                  isCurrent
                    ? 'border-text-main bg-panel ring-1 ring-border'
                    : 'border-border bg-panel hover:border-text-muted/70'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-text-main">{proj.name}</h3>
                      <p className="text-xs text-text-muted line-clamp-2 mt-0.5">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-text-main text-background border border-text-main">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/70 text-xs text-text-muted space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-text-muted" />
                      <span>{proj.equations?.length || 0} Equation(s) configured</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>Updated: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-2.5 border-t border-border/70 flex items-center justify-between gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      await openProject(proj.id);
                      setActiveSection('2d-graphs');
                    }}
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateProject(proj.id)}
                      className="p-1 rounded-sm hover:bg-border/60 text-text-muted hover:text-text-main transition-colors"
                      title="Duplicate project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => ExportService.exportProjectJSON(proj)}
                      className="p-1 rounded-sm hover:bg-border/60 text-text-muted hover:text-text-main transition-colors"
                      title="Export JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="p-1 rounded-sm hover:bg-panel-hover text-text-muted hover:text-text-main transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project"
        description="Save your current equations and graphing workspace."
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Project Name"
            placeholder="e.g. Calculus Exploration or Physics Oscillations"
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            autoFocus
            required
          />
          <Input
            label="Description (Optional)"
            placeholder="Brief notes about the equations and experiments in this project"
            value={newProjDesc}
            onChange={(e) => setNewProjDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
