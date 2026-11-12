import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Grid,
  Download,
  Crosshair,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { parseEquation } from '../../engines/parser/expressionParser';
import { NumericalEngine } from '../../engines/numerical/numericalEngine';
import { ExportService } from '../../services/export/exportService';

const getPlotly = () => (Plotly as any).default || Plotly;

export const PlotlyGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { equations, graphSettings, setGraphSettings, resetGraphBounds, theme } = useAppStore();
  const [showGridState, setShowGridState] = useState(graphSettings.showGrid);
  const [showKeyPoints, setShowKeyPoints] = useState(true);

  // Re-plot when equations, theme, or graphSettings change
  useEffect(() => {
    if (!containerRef.current) return;
    const p = getPlotly();

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#09090B' : '#FFFFFF';
    const paperColor = isDark ? '#09090B' : '#FFFFFF';
    const gridColor = isDark ? '#27272A' : '#E4E4E7';
    const textColor = isDark ? '#A1A1AA' : '#71717A';
    const zeroLineColor = isDark ? '#3F3F46' : '#A1A1AA';

    const traces: any[] = [];

    // Build traces for each visible equation
    for (const eq of equations) {
      if (!eq.visible || !eq.valid) continue;

      const parsed = parseEquation(eq.rawInput);
      if (!parsed.isValid) continue;

      if (parsed.type === '2d-explicit' && parsed.eval1D) {
        const { x, y } = NumericalEngine.sample2DCurve(
          parsed.eval1D,
          graphSettings.xMin,
          graphSettings.xMax,
          800
        );

        traces.push({
          x,
          y,
          type: 'scatter',
          mode: 'lines',
          name: eq.label || eq.rawInput,
          line: {
            color: eq.color || '#7C8FFF',
            width: 2.5,
          },
          hoverinfo: 'x+y+name',
        });

        // Add key points (roots & extrema)
        if (showKeyPoints) {
          const roots = NumericalEngine.findRoots(
            parsed.eval1D,
            graphSettings.xMin,
            graphSettings.xMax
          );
          if (roots.length > 0) {
            traces.push({
              x: roots,
              y: roots.map(() => 0),
              type: 'scatter',
              mode: 'markers',
              name: `${eq.label} Roots`,
              marker: {
                size: 7,
                color: '#EC4899',
                symbol: 'circle',
                line: { width: 1.5, color: '#FFFFFF' },
              },
              hoverinfo: 'x',
              hovertemplate: 'Root: x=%{x:.4f}<extra></extra>',
            });
          }

          const extrema = NumericalEngine.findExtrema(
            parsed.eval1D,
            graphSettings.xMin,
            graphSettings.xMax
          );
          if (extrema.length > 0) {
            traces.push({
              x: extrema.map((e) => e.x),
              y: extrema.map((e) => e.y),
              type: 'scatter',
              mode: 'markers',
              name: `${eq.label} Extrema`,
              marker: {
                size: 8,
                color: '#F59E0B',
                symbol: 'diamond',
                line: { width: 1.5, color: '#FFFFFF' },
              },
              hoverinfo: 'x+y',
              hovertemplate: '%{text}: (%{x:.3f}, %{y:.3f})<extra></extra>',
              text: extrema.map((e) => (e.type === 'max' ? 'Local Max' : 'Local Min')),
            });
          }
        }
      } else if (((parsed.type as string) === '2d-implicit' || (parsed.type as string) === 'implicit') && parsed.compiledFn) {
        // Contour 2D plot for implicit curves f(x, y) = 0
        const steps = 100;
        const xStep = (graphSettings.xMax - graphSettings.xMin) / steps;
        const yStep = (graphSettings.yMax - graphSettings.yMin) / steps;
        const xs: number[] = [];
        const ys: number[] = [];
        const zGrid: number[][] = [];

        for (let i = 0; i <= steps; i++) xs.push(graphSettings.xMin + i * xStep);
        for (let j = 0; j <= steps; j++) ys.push(graphSettings.yMin + j * yStep);

        for (let j = 0; j <= steps; j++) {
          const row: number[] = [];
          const curY = ys[j];
          for (let i = 0; i <= steps; i++) {
            const curX = xs[i];
            try {
              const val = parsed.compiledFn({ x: curX, y: curY });
              row.push(isFinite(val) ? val : NaN);
            } catch {
              row.push(NaN);
            }
          }
          zGrid.push(row);
        }

        traces.push({
          x: xs,
          y: ys,
          z: zGrid,
          type: 'contour',
          name: eq.label || eq.rawInput,
          contours: {
            start: 0,
            end: 0,
            size: 1,
            coloring: 'none',
          },
          line: {
            color: eq.color || '#42C8B5',
            width: 2.5,
          },
          showscale: false,
          hoverinfo: 'x+y+name',
        });
      } else if (parsed.type === '2d-polar' && parsed.compiledFn) {
        // Polar curve r = f(theta)
        const thetas: number[] = [];
        const xs: number[] = [];
        const ys: number[] = [];
        const maxTheta = 4 * Math.PI;
        const steps = 600;

        for (let i = 0; i <= steps; i++) {
          const th = (i / steps) * maxTheta;
          thetas.push(th);
          const r = parsed.compiledFn({ theta: th, t: th });
          if (isFinite(r)) {
            xs.push(r * Math.cos(th));
            ys.push(r * Math.sin(th));
          }
        }

        traces.push({
          x: xs,
          y: ys,
          type: 'scatter',
          mode: 'lines',
          name: eq.label || eq.rawInput,
          line: { color: eq.color || '#8B5CF6', width: 2.5 },
          hoverinfo: 'x+y+name',
        });
      }
    }

    const layout = {
      autosize: true,
      paper_bgcolor: paperColor,
      plot_bgcolor: bgColor,
      font: {
        family: 'Times New Roman, Times, serif',
        color: textColor,
        size: 12,
      },
      margin: { l: 50, r: 25, t: 30, b: 45 },
      xaxis: {
        range: [graphSettings.xMin, graphSettings.xMax],
        showgrid: showGridState,
        gridcolor: gridColor,
        zeroline: true,
        zerolinecolor: zeroLineColor,
        zerolinewidth: 1.5,
        tickcolor: gridColor,
        linecolor: gridColor,
        ticks: 'outside',
        title: { text: 'x', font: { family: 'Times New Roman, Times, serif', size: 13, color: textColor } },
      },
      yaxis: {
        range: [graphSettings.yMin, graphSettings.yMax],
        showgrid: showGridState,
        gridcolor: gridColor,
        zeroline: true,
        zerolinecolor: zeroLineColor,
        zerolinewidth: 1.5,
        tickcolor: gridColor,
        linecolor: gridColor,
        ticks: 'outside',
        title: { text: 'y', font: { family: 'Times New Roman, Times, serif', size: 13, color: textColor } },
      },
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1,
        font: { family: 'Times New Roman, Times, serif', size: 12, color: textColor },
      },
      hovermode: 'closest',
      dragmode: 'pan',
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: true,
    };

    p.react(containerRef.current, traces, layout, config);

    // Sync viewport drag / zoom back to store
    const handleRelayout = (eventData: any) => {
      if (eventData['xaxis.range[0]'] !== undefined && eventData['xaxis.range[1]'] !== undefined) {
        setGraphSettings({
          xMin: Math.round(eventData['xaxis.range[0]'] * 10) / 10,
          xMax: Math.round(eventData['xaxis.range[1]'] * 10) / 10,
          yMin: Math.round(eventData['yaxis.range[0]'] * 10) / 10,
          yMax: Math.round(eventData['yaxis.range[1]'] * 10) / 10,
        });
      }
    };

    const el = containerRef.current as any;
    if (el && typeof el.on === 'function') {
      el.on('plotly_relayout', handleRelayout);
    }

    return () => {
      if (el && typeof el.removeAllListeners === 'function') {
        el.removeAllListeners('plotly_relayout');
      }
    };
  }, [equations, graphSettings, showGridState, showKeyPoints, theme, setGraphSettings]);

  // Window resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const p = getPlotly();
    const handleResize = () => {
      if (containerRef.current) p.Plots.resize(containerRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoom = (factor: number) => {
    const xMid = (graphSettings.xMin + graphSettings.xMax) / 2;
    const xSpan = ((graphSettings.xMax - graphSettings.xMin) * factor) / 2;
    const yMid = (graphSettings.yMin + graphSettings.yMax) / 2;
    const ySpan = ((graphSettings.yMax - graphSettings.yMin) * factor) / 2;

    setGraphSettings({
      xMin: Math.round((xMid - xSpan) * 10) / 10,
      xMax: Math.round((xMid + xSpan) * 10) / 10,
      yMin: Math.round((yMid - ySpan) * 10) / 10,
      yMax: Math.round((yMid + ySpan) * 10) / 10,
    });
  };

  return (
    <div className="relative flex flex-col rounded-md border border-border bg-panel overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border bg-panel-hover/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-main">2D Coordinate Plane</span>
          <span className="text-text-muted">
            [{graphSettings.xMin}, {graphSettings.xMax}] × [{graphSettings.yMin}, {graphSettings.yMax}]
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(0.75)}
            className="p-1 rounded-sm hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1 rounded-sm hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetGraphBounds}
            className="p-1 rounded-sm hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
            title="Reset to [-10, 10]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="h-3.5 w-px bg-border mx-1" />
          <button
            onClick={() => setShowGridState(!showGridState)}
            className={`p-1 rounded-sm transition-colors ${
              showGridState ? 'bg-text-main text-background font-bold' : 'text-text-muted hover:bg-panel'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowKeyPoints(!showKeyPoints)}
            className={`p-1 rounded-sm transition-colors ${
              showKeyPoints ? 'bg-text-main text-background font-bold' : 'text-text-muted hover:bg-panel'
            }`}
            title="Toggle Roots and Extrema Markers"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => ExportService.exportPlotlyGraph('plotly-graph-container', 'png')}
            className="p-1 rounded-sm hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
            title="Export PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Plotly div container */}
      <div
        id="plotly-graph-container"
        ref={containerRef}
        className="w-full h-[520px] bg-background"
      />
    </div>
  );
};
