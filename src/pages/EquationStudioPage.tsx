import React, { useState } from 'react';
import { Edit3, Plus, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { EquationList } from '../components/equation/EquationList';
import { VirtualKeypad } from '../components/equation/VirtualKeypad';
import { PlotlyGraph } from '../components/graphs/PlotlyGraph';
import { GraphAnalysisPanel } from '../components/graphs/GraphAnalysisPanel';
import { MathView } from '../components/common/MathView';
import { Button } from '../components/common/Button';

export const EquationStudioPage: React.FC = () => {
  const { addEquation, setActiveSection } = useAppStore();
  const [activeInput, setActiveInput] = useState('y = x^2 - 4x + 3');

  const handleKeypadInsert = (token: string) => {
    setActiveInput((prev) => prev + token);
  };

  const handleKeypadClear = () => {
    setActiveInput('');
  };

  const handleKeypadBackspace = () => {
    setActiveInput((prev) => prev.slice(0, -1));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeInput.trim()) {
      addEquation(activeInput.trim());
      setActiveInput('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-text-main" />
            Equation Studio
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Create, edit, compare, and style explicit functions, implicit equations, polar curves, and 3D surfaces.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setActiveSection('2d-graphs')}
        >
          <span>Open Full 2D Explorer</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Equation Editor & Virtual Keypad */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Input Box */}
          <div className="rounded-md border border-border bg-panel p-4 space-y-2.5">
            <span className="text-xs font-bold text-text-muted">Equation Input:</span>
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={activeInput}
                onChange={(e) => setActiveInput(e.target.value)}
                placeholder="Enter equation (e.g. y = x^2 - 4x + 3)..."
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
              />
              <Button variant="primary" size="sm" type="submit">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </form>

            {/* Live LaTeX Preview */}
            <div className="p-2.5 rounded-md bg-background border border-border/70">
              <span className="text-[11px] text-text-muted block mb-1">Live LaTeX Preview:</span>
              <div className="overflow-x-auto min-h-[26px] flex items-center">
                <MathView math={activeInput || 'y = f(x)'} className="text-xs font-semibold" />
              </div>
            </div>
          </div>

          {/* Virtual Math Keypad */}
          <VirtualKeypad
            onInsert={handleKeypadInsert}
            onClear={handleKeypadClear}
            onBackspace={handleKeypadBackspace}
          />

          {/* Managed Equations List */}
          <EquationList />
        </div>

        {/* Right Column: Instant Live Graph & Properties Analysis */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-md border border-border bg-panel p-4">
            <div className="mb-2.5 flex items-center justify-between border-b border-border/70 pb-2">
              <h3 className="text-xs font-bold text-text-main">Synchronized 2D Preview</h3>
              <span className="text-[11px] text-text-muted">Plotly 2D Engine</span>
            </div>
            <PlotlyGraph />
          </div>

          <GraphAnalysisPanel />
        </div>
      </div>
    </div>
  );
};
