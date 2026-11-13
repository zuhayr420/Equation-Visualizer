import React from 'react';
import { LineChart } from 'lucide-react';
import { PlotlyGraph } from '../components/graphs/PlotlyGraph';
import { GraphAnalysisPanel } from '../components/graphs/GraphAnalysisPanel';
import { EquationList } from '../components/equation/EquationList';
import { Card } from '../components/common/Card';
import { useAppStore } from '../store/useAppStore';

export const Graph2DPage: React.FC = () => {
  const { graphSettings, setGraphSettings } = useAppStore();

  return (
    <div className="space-y-5">
      {/* Header & Viewport Quick Bounds */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <LineChart className="w-4 h-4 text-text-main" />
            2D Graph Explorer
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Plot multiple simultaneous curves with coordinate tracing, roots, turning points, and domain analysis.
          </p>
        </div>

        {/* Viewport Range Controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 p-1 rounded-md border border-border bg-panel">
            <span className="text-text-muted text-xs font-semibold">X:</span>
            <input
              type="number"
              value={graphSettings.xMin}
              onChange={(e) => setGraphSettings({ xMin: Number(e.target.value) })}
              className="w-12 rounded-sm border border-border bg-background p-0.5 text-center text-xs"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="number"
              value={graphSettings.xMax}
              onChange={(e) => setGraphSettings({ xMax: Number(e.target.value) })}
              className="w-12 rounded-sm border border-border bg-background p-0.5 text-center text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-md border border-border bg-panel">
            <span className="text-text-muted text-xs font-semibold">Y:</span>
            <input
              type="number"
              value={graphSettings.yMin}
              onChange={(e) => setGraphSettings({ yMin: Number(e.target.value) })}
              className="w-12 rounded-sm border border-border bg-background p-0.5 text-center text-xs"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="number"
              value={graphSettings.yMax}
              onChange={(e) => setGraphSettings({ yMax: Number(e.target.value) })}
              className="w-12 rounded-sm border border-border bg-background p-0.5 text-center text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Plotly Canvas + Equation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <PlotlyGraph />
          <GraphAnalysisPanel />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card title="Equations" subtitle="Toggle visibility or add new curves">
            <EquationList />
          </Card>
        </div>
      </div>
    </div>
  );
};
