import { create } from 'zustand';
import type { 
  ViewSection, 
  Equation, 
  GraphSettings, 
  Project, 
  HistoryItem, 
  AIProviderConfig 
} from '../types';
import { createDefaultEquation, parseEquation } from '../engines/parser/expressionParser';
import * as db from '../services/storage/indexedDB';

const DEFAULT_SETTINGS: GraphSettings = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  showGrid: true,
  showAxes: true,
  angleUnit: 'rad',
  theme: 'dark',
};

const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: 'local-tutor',
  apiKey: '',
  model: 'gemini-1.5-flash',
  enabled: true,
};

const PRESET_EQUATIONS: Equation[] = [
  createDefaultEquation('y = x^2 - 4x + 3', '#7C8FFF', 'f(x)'),
  createDefaultEquation('y = 2x - 1', '#42C8B5', 'g(x)'),
  createDefaultEquation('y = sin(x)', '#F59E0B', 'h(x)'),
];

interface AppState {
  // Navigation
  activeSection: ViewSection;
  setActiveSection: (section: ViewSection) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Equations & Graphing
  equations: Equation[];
  selectedEquationId: string | null;
  graphSettings: GraphSettings;
  addEquation: (rawInput: string, color?: string, label?: string) => Equation;
  updateEquation: (id: string, updates: Partial<Equation>) => void;
  removeEquation: (id: string) => void;
  toggleEquationVisibility: (id: string) => void;
  setSelectedEquationId: (id: string | null) => void;
  setGraphSettings: (settings: Partial<GraphSettings>) => void;
  resetGraphBounds: () => void;

  // Projects / Storage
  projects: Project[];
  currentProject: Project | null;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  openProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project | null>;
  importProjectJSON: (jsonString: string) => Promise<boolean>;

  // Calculation History
  history: HistoryItem[];
  loadHistory: () => Promise<void>;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;

  // AI Configuration
  aiConfig: AIProviderConfig;
  setAIConfig: (config: Partial<AIProviderConfig>) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Read saved theme from LocalStorage
  const savedTheme = (localStorage.getItem('mathvision_theme') as 'dark' | 'light') || 'dark';
  if (typeof document !== 'undefined') {
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }

  // Read saved AI config from LocalStorage
  let initialAIConfig = DEFAULT_AI_CONFIG;
  try {
    const rawAI = localStorage.getItem('mathvision_ai_config');
    if (rawAI) {
      initialAIConfig = { ...DEFAULT_AI_CONFIG, ...JSON.parse(rawAI) };
    }
  } catch {
    // Default
  }

  return {
    activeSection: 'overview',
    setActiveSection: (activeSection) => set({ activeSection }),
    sidebarCollapsed: false,
    setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

    theme: savedTheme,
    setTheme: (theme) => {
      localStorage.setItem('mathvision_theme', theme);
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
      set({ theme });
    },
    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },

    equations: PRESET_EQUATIONS,
    selectedEquationId: PRESET_EQUATIONS[0].id,
    graphSettings: DEFAULT_SETTINGS,

    addEquation: (rawInput, color = '#7C8FFF', label) => {
      const parsed = parseEquation(rawInput);
      const newEq: Equation = {
        id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        rawInput,
        expression: parsed.cleanExpression,
        latex: parsed.latex,
        type: parsed.type,
        color: color || '#7C8FFF',
        visible: true,
        label: label || `y${get().equations.length + 1}`,
        valid: parsed.isValid,
        errorMessage: parsed.error,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((state) => ({
        equations: [...state.equations, newEq],
        selectedEquationId: newEq.id,
      }));
      return newEq;
    },

    updateEquation: (id, updates) => {
      set((state) => ({
        equations: state.equations.map((eq) => {
          if (eq.id !== id) return eq;
          const merged = { ...eq, ...updates, updatedAt: Date.now() };
          if (updates.rawInput && updates.rawInput !== eq.rawInput) {
            const parsed = parseEquation(updates.rawInput);
            merged.expression = parsed.cleanExpression;
            merged.latex = parsed.latex;
            merged.type = parsed.type;
            merged.valid = parsed.isValid;
            merged.errorMessage = parsed.error;
          }
          return merged;
        }),
      }));
    },

    removeEquation: (id) => {
      set((state) => {
        const remaining = state.equations.filter((eq) => eq.id !== id);
        return {
          equations: remaining,
          selectedEquationId: state.selectedEquationId === id 
            ? (remaining[0]?.id || null) 
            : state.selectedEquationId,
        };
      });
    },

    toggleEquationVisibility: (id) => {
      set((state) => ({
        equations: state.equations.map((eq) =>
          eq.id === id ? { ...eq, visible: !eq.visible } : eq
        ),
      }));
    },

    setSelectedEquationId: (selectedEquationId) => set({ selectedEquationId }),

    setGraphSettings: (newSettings) => {
      set((state) => ({
        graphSettings: { ...state.graphSettings, ...newSettings },
      }));
    },

    resetGraphBounds: () => {
      set((state) => ({
        graphSettings: { ...state.graphSettings, xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      }));
    },

    // Projects
    projects: [],
    currentProject: null,

    loadProjects: async () => {
      const projects = await db.getAllProjects();
      set({ projects });
    },

    createProject: async (name, description = '') => {
      const newProj: Project = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        equations: get().equations,
        graphSettings: get().graphSettings,
      };
      await db.saveProject(newProj);
      await get().loadProjects();
      set({ currentProject: newProj });
      return newProj;
    },

    openProject: async (id) => {
      const proj = await db.getProjectById(id);
      if (proj) {
        set({
          currentProject: proj,
          equations: proj.equations,
          graphSettings: proj.graphSettings,
          selectedEquationId: proj.equations[0]?.id || null,
        });
      }
    },

    saveCurrentProject: async () => {
      const current = get().currentProject;
      if (!current) {
        await get().createProject('My Workspace Project');
        return;
      }
      const updated: Project = {
        ...current,
        equations: get().equations,
        graphSettings: get().graphSettings,
        updatedAt: Date.now(),
      };
      await db.saveProject(updated);
      await get().loadProjects();
      set({ currentProject: updated });
    },

    deleteProject: async (id) => {
      await db.deleteProject(id);
      await get().loadProjects();
      if (get().currentProject?.id === id) {
        set({ currentProject: null });
      }
    },

    duplicateProject: async (id) => {
      const proj = await db.getProjectById(id);
      if (!proj) return null;
      const duplicated: Project = {
        ...proj,
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: `${proj.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.saveProject(duplicated);
      await get().loadProjects();
      return duplicated;
    },

    importProjectJSON: async (jsonString) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.name || !Array.isArray(parsed.equations)) {
          return false;
        }
        const imported: Project = {
          id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: parsed.name,
          description: parsed.description || 'Imported project',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          equations: parsed.equations,
          graphSettings: parsed.graphSettings || DEFAULT_SETTINGS,
        };
        await db.saveProject(imported);
        await get().loadProjects();
        await get().openProject(imported.id);
        return true;
      } catch (err) {
        console.error('Failed to import project JSON:', err);
        return false;
      }
    },

    // History
    history: [],
    loadHistory: async () => {
      const history = await db.getAllHistory();
      set({ history });
    },

    addToHistory: async (item) => {
      await db.addHistoryItem(item);
      await get().loadHistory();
    },

    clearHistory: async () => {
      await db.clearAllHistory();
      set({ history: [] });
    },

    deleteHistoryItem: async (id) => {
      await db.deleteHistoryItem(id);
      await get().loadHistory();
    },

    // AI Configuration
    aiConfig: initialAIConfig,
    setAIConfig: (config) => {
      const updated = { ...get().aiConfig, ...config };
      localStorage.setItem('mathvision_ai_config', JSON.stringify(updated));
      set({ aiConfig: updated });
    },
  };
});
