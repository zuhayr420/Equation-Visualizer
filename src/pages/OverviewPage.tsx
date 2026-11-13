import React, { useState } from 'react';
import {
  ArrowRight,
  LineChart,
  Box,
  Calculator,
  Activity,
  Plus,
  Clock,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Equation, HistoryItem } from '../types';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { MathView } from '../components/common/MathView';
import { Badge } from '../components/common/Badge';

export const OverviewPage: React.FC = () => {
  const {
    setActiveSection,
    equations,
    addEquation,
    history,
  } = useAppStore();

  const [quickInput, setQuickInput] = useState('');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      addEquation(quickInput.trim());
      setQuickInput('');
      setActiveSection('2d-graphs');
    }
  };

  return (
    <div className="space-y-5">
      {/* Workspace Header Panel */}
      <div className="rounded-md border border-border bg-panel p-5">
        <div className="max-w-3xl space-y-2.5">
          <Badge variant="primary" className="mb-0.5">
            Client-Side Mathematical Platform
          </Badge>
          <h1 className="text-xl md:text-2xl font-bold text-text-main tracking-normal">
            MathVision – Mathematics, Made Visible
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            In-browser mathematical computing and visualization workspace. Explore high-performance 2D curves, 3D WebGL manifolds, step-by-step symbolic proofs, calculus animations, and an integrated AI tutor with verified mathematical engines.
          </p>

          {/* Quick Input Box */}
          <form onSubmit={handleQuickAdd} className="flex gap-2 pt-1 max-w-xl">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Quick equation input (e.g. y = x^3 - 3x or z = x^2 + y^2)..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
            />
            <Button variant="primary" size="sm" type="submit">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Plot</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveSection('2d-graphs')}
          className="rounded-md border border-border bg-panel p-4 hover:border-text-muted/70 transition-colors cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-md bg-panel-hover text-text-main border border-border flex items-center justify-center mb-2.5">
            <LineChart className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-text-main flex items-center justify-between">
            2D Graph Explorer
            <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-snug">
            Plotly coordinate tracing, implicit equations, polar curves, and automatic root detection.
          </p>
        </div>

        <div
          onClick={() => setActiveSection('3d-visualisation')}
          className="rounded-md border border-border bg-panel p-4 hover:border-text-muted/70 transition-colors cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-md bg-panel-hover text-text-main border border-border flex items-center justify-center mb-2.5">
            <Box className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-text-main flex items-center justify-between">
            3D Studio
            <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-snug">
            Three.js WebGL surfaces $z=f(x,y)$, customizable colormaps, wireframes, and animated parameters.
          </p>
        </div>

        <div
          onClick={() => setActiveSection('solver')}
          className="rounded-md border border-border bg-panel p-4 hover:border-text-muted/70 transition-colors cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-md bg-panel-hover text-text-main border border-border flex items-center justify-center mb-2.5">
            <Calculator className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-text-main flex items-center justify-between">
            Equation Solver
            <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-snug">
            Exact symbolic algebra, step-by-step calculus proofs, matrix operations, and numerical root finders.
          </p>
        </div>

        <div
          onClick={() => setActiveSection('calculus-lab')}
          className="rounded-md border border-border bg-panel p-4 hover:border-text-muted/70 transition-colors cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-md bg-panel-hover text-text-main border border-border flex items-center justify-center mb-2.5">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-text-main flex items-center justify-between">
            Calculus Lab
            <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-snug">
            Dynamic tangent line slopes, interactive Riemann sum slices, limits table, and Taylor polynomials.
          </p>
        </div>
      </div>

      {/* Equations in current project & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Equations */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Active Workspace Equations"
            subtitle={`${equations.length} equation(s) registered in memory`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSection('equation-studio')}
              >
                Open Studio
              </Button>
            }
          >
            <div className="space-y-2">
              {equations.slice(0, 4).map((eq: Equation) => (
                <div
                  key={eq.id}
                  onClick={() => setActiveSection('2d-graphs')}
                  className="flex items-center justify-between p-2.5 rounded-md border border-border bg-background/60 hover:bg-background transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: eq.color }}
                    />
                    <MathView math={eq.latex || eq.rawInput} className="text-xs font-semibold" />
                  </div>
                  <Badge variant="neutral" className="text-[11px]">
                    {eq.type}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Calculations from IndexedDB */}
        <div>
          <Card
            title="Recent Calculations"
            subtitle="Persisted in browser IndexedDB"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('history')}
              >
                View All
              </Button>
            }
          >
            {history.length === 0 ? (
              <div className="py-5 text-center text-xs text-text-muted">
                No calculations recorded yet. Use Equation Solver to record history.
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 4).map((h: HistoryItem) => (
                  <div key={h.id} className="p-2.5 rounded-md border border-border bg-background/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="font-semibold text-text-main">{h.category}</span>
                      <span className="text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-text-main truncate">{h.input}</div>
                    <div className="text-text-muted font-semibold truncate">{h.result}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
