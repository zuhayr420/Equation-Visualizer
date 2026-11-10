export type ViewSection = 
  | 'overview'
  | 'equation-studio'
  | '2d-graphs'
  | '3d-visualisation'
  | 'solver'
  | 'calculus-lab'
  | 'ai-tutor'
  | 'library'
  | 'history'
  | 'settings';

export type EquationType = 
  | '2d-explicit' 
  | '2d-implicit' 
  | '2d-polar' 
  | '2d-parametric' 
  | '3d-surface' 
  | 'inequality';

export interface Equation {
  id: string;
  expression: string;
  rawInput: string;
  latex?: string;
  type: EquationType;
  color: string;
  visible: boolean;
  label: string;
  valid: boolean;
  errorMessage?: string;
  variable?: string;
  style?: 'solid' | 'dashed' | 'dot';
  createdAt: number;
  updatedAt: number;
}

export interface GraphAnalysis {
  roots: number[];
  yIntercept: number | null;
  extrema: { type: 'min' | 'max' | 'inflection'; x: number; y: number }[];
  domain: string;
  range: string;
  asymptotes: { type: 'vertical' | 'horizontal'; value: number }[];
  intervals: { type: 'increasing' | 'decreasing'; from: number; to: number }[];
  derivativeLatex?: string;
  integralLatex?: string;
}

export interface SolverStep {
  stepNumber: number;
  title: string;
  latex: string;
  explanation: string;
}

export interface SolverResult {
  operation: string;
  input: string;
  steps: SolverStep[];
  finalAnswer: string;
  finalAnswerLatex: string;
  isApproximate: boolean;
  verification?: string;
  executionTimeMs: number;
}

export interface GraphSettings {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid: boolean;
  showAxes: boolean;
  angleUnit: 'rad' | 'deg';
  theme: 'dark' | 'light';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  equations: Equation[];
  graphSettings: GraphSettings;
  activeTab?: ViewSection;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  category: string;
  input: string;
  result: string;
  latex?: string;
  projectId?: string;
}

export interface AIProviderConfig {
  provider: 'local-tutor' | 'gemini' | 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  customEndpoint?: string;
  model?: string;
  enabled: boolean;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  verifiedMath?: {
    input: string;
    output: string;
    status: 'verified' | 'approximate' | 'error';
  };
}
