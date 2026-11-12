import React, { useMemo } from 'react';
import {
  TrendingUp,
  CircleDot,
  Calculator,
  Activity,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { parseEquation } from '../../engines/parser/expressionParser';
import { GraphAnalyzer } from '../../engines/graph/graphAnalyzer';
import { MathView } from '../common/MathView';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const GraphAnalysisPanel: React.FC = () => {
  const { equations, selectedEquationId, graphSettings, setActiveSection } = useAppStore();

  const selectedEquation = useMemo(() => {
    return equations.find((eq) => eq.id === selectedEquationId) || equations[0];
  }, [equations, selectedEquationId]);

  const analysis = useMemo(() => {
    if (!selectedEquation || !selectedEquation.valid) return null;
    const parsed = parseEquation(selectedEquation.rawInput);
    if (!parsed.isValid || !parsed.eval1D || parsed.type !== '2d-explicit') {
      return null;
    }
    return GraphAnalyzer.analyzeFunction(
      parsed.eval1D,
      selectedEquation.expression || selectedEquation.rawInput,
      graphSettings.xMin,
      graphSettings.xMax
    );
  }, [selectedEquation, graphSettings.xMin, graphSettings.xMax]);

  if (!selectedEquation) {
    return (
      <div className="rounded-md border border-border bg-panel p-5 text-center text-text-muted text-xs">
        Select an equation to inspect calculated mathematical properties.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-panel p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
        <h3 className="text-xs font-bold text-text-main tracking-normal">Mathematical Properties & Analysis</h3>
        <Badge variant="primary" className="text-xs">
          {selectedEquation.label}
        </Badge>
      </div>

      {/* Selected Equation LaTeX */}
      <div className="p-2.5 rounded-md bg-background/60 border border-border/70 flex items-center justify-between">
        <div className="overflow-x-auto">
          <MathView math={selectedEquation.latex || selectedEquation.rawInput} className="text-xs font-semibold" />
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection('calculus-lab')}
            title="Inspect in Calculus Lab"
          >
            <Activity className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline text-xs">Calculus Lab</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection('solver')}
            title="Solve in Equation Solver"
          >
            <Calculator className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline text-xs">Solve</span>
          </Button>
        </div>
      </div>

      {/* If implicit or 3D */}
      {!analysis && (
        <div className="p-3.5 rounded-md bg-panel border border-border text-xs text-text-muted space-y-1">
          <p className="font-bold text-text-main">Surface / Implicit Equation</p>
          <p>
            Detailed roots and 1D interval analysis are designed for explicit curves $y = f(x)$. For 3D surfaces, view them interactively in the 3D Studio.
          </p>
        </div>
      )}

      {/* Calculated Properties Grid */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Roots / X-Intercepts */}
          <div className="p-2.5 rounded-md bg-background border border-border space-y-1">
            <span className="text-text-muted font-bold flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-text-main" /> Roots (X-Intercepts):
            </span>
            <div className="text-text-main">
              {analysis.roots.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.roots.map((r, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded-sm bg-panel text-text-main border border-border text-xs">
                      x = {r}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-text-muted text-xs">No real roots in current view range</span>
              )}
            </div>
          </div>

          {/* Y-Intercept */}
          <div className="p-2.5 rounded-md bg-background border border-border space-y-1">
            <span className="text-text-muted font-bold flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-text-main" /> Y-Intercept:
            </span>
            <div className="text-text-main mt-1">
              {analysis.yIntercept !== null ? (
                <span className="px-1.5 py-0.5 rounded-sm bg-panel text-text-main border border-border text-xs">
                  (0, {analysis.yIntercept})
                </span>
              ) : (
                <span className="text-text-muted text-xs">Undefined at x = 0</span>
              )}
            </div>
          </div>

          {/* Extrema / Turning Points */}
          <div className="p-2.5 rounded-md bg-background border border-border space-y-1">
            <span className="text-text-muted font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-text-main" /> Critical Points & Extrema:
            </span>
            <div className="text-text-main">
              {analysis.extrema.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.extrema.map((e, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded-sm bg-panel text-text-main border border-border text-xs">
                      {e.type === 'min' ? 'Local Min' : 'Local Max'}: ({e.x}, {e.y})
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-text-muted text-xs">No local turning points detected</span>
              )}
            </div>
          </div>

          {/* Domain & Range */}
          <div className="p-2.5 rounded-md bg-background border border-border space-y-1">
            <span className="text-text-muted font-bold flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-text-main" /> Estimated Domain & Range:
            </span>
            <div className="text-text-main mt-1 space-y-1">
              <div>Domain: <MathView math={analysis.domain} /></div>
              <div>Range: <MathView math={analysis.range} /></div>
            </div>
          </div>

          {/* Symbolic Derivative & Integral */}
          <div className="p-2.5 rounded-md bg-background border border-border space-y-1 md:col-span-2">
            <span className="text-text-muted font-bold flex items-center gap-1.5">
              <Calculator className="w-3 h-3 text-text-main" /> Symbolic Calculus Relations:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded-sm bg-panel border border-border">
                <span className="text-[11px] text-text-muted block">First Derivative:</span>
                <MathView math={analysis.derivativeLatex} className="text-xs font-semibold" />
              </div>
              <div className="p-2 rounded-sm bg-panel border border-border">
                <span className="text-[11px] text-text-muted block">Indefinite Integral:</span>
                <MathView math={analysis.integralLatex} className="text-xs font-semibold" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
