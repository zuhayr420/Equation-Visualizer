import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
import {
  Activity,
  Play,
  Pause,
} from 'lucide-react';
import { CalculusEngine } from '../../engines/calculus/calculusEngine';
import { NumericalEngine } from '../../engines/numerical/numericalEngine';
import { parseEquation } from '../../engines/parser/expressionParser';
import { useAppStore } from '../../store/useAppStore';
import { MathView } from '../common/MathView';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

const getPlotly = () => (Plotly as any).default || Plotly;

export const CalculusLab: React.FC = () => {
  const { theme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'derivative' | 'integral' | 'limits' | 'taylor'>('derivative');

  // Common function input
  const [expr, setExpr] = useState('x^3 - 3*x');

  // Differentiation states
  const [x0, setX0] = useState(1.5);
  const [isTangentAnimating, setIsTangentAnimating] = useState(false);
  const [showDerivativeCurve, setShowDerivativeCurve] = useState(true);

  // Integration states
  const [boundA, setBoundA] = useState(-1.5);
  const [boundB, setBoundB] = useState(2.0);
  const [rectCount, setRectCount] = useState(12);
  const [riemannMethod, setRiemannMethod] = useState<'left' | 'right' | 'midpoint' | 'trapezoid' | 'simpson'>('midpoint');

  // Limits states
  const [limitA, setLimitA] = useState(0);

  // Taylor series states
  const [taylorOrder, setTaylorOrder] = useState(3);
  const [taylorCenter, setTaylorCenter] = useState(0);

  const plotDivRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  // Parse current expression
  const parsed = parseEquation(expr);
  const fn = parsed.eval1D || ((x: number) => x * x * x - 3 * x);

  // Tangent animation loop
  useEffect(() => {
    if (!isTangentAnimating) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let dir = 1;
    const animate = () => {
      setX0((prev) => {
        let next = prev + 0.02 * dir;
        if (next > 3.0) {
          next = 3.0;
          dir = -1;
        } else if (next < -3.0) {
          next = -3.0;
          dir = 1;
        }
        return Math.round(next * 100) / 100;
      });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isTangentAnimating]);

  // Render interactive Plotly graph for current active module
  useEffect(() => {
    if (!plotDivRef.current) return;
    const p = getPlotly();

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#09090B' : '#FFFFFF';
    const paperColor = isDark ? '#09090B' : '#FFFFFF';
    const gridColor = isDark ? '#27272A' : '#E4E4E7';
    const textColor = isDark ? '#A1A1AA' : '#71717A';

    const traces: any[] = [];
    const shapes: any[] = [];

    // Base function sample
    const sample = NumericalEngine.sample2DCurve(fn, -4, 4, 600);
    traces.push({
      x: sample.x,
      y: sample.y,
      type: 'scatter',
      mode: 'lines',
      name: `f(x) = ${expr}`,
      line: { color: '#7C8FFF', width: 2.5 },
    });

    if (activeTab === 'derivative') {
      // Tangent line at x0
      const tangent = CalculusEngine.getTangentLine(fn, x0);

      traces.push({
        x: tangent.lineX,
        y: tangent.lineY,
        type: 'scatter',
        mode: 'lines',
        name: `Tangent at x=${x0.toFixed(2)} (slope=${tangent.slope.toFixed(2)})`,
        line: { color: '#F59E0B', width: 2, dash: 'solid' },
      });

      // Tangent Point marker
      traces.push({
        x: [x0],
        y: [fn(x0)],
        type: 'scatter',
        mode: 'markers',
        name: 'Point of Tangency',
        marker: { size: 8, color: '#F59E0B', line: { width: 1.5, color: '#FFFFFF' } },
      });

      // Optional derivative curve
      if (showDerivativeCurve) {
        const dSample = NumericalEngine.sample2DCurve(
          (x) => NumericalEngine.numericalDerivative(fn, x),
          -4,
          4,
          400
        );
        traces.push({
          x: dSample.x,
          y: dSample.y,
          type: 'scatter',
          mode: 'lines',
          name: "f'(x) Derivative",
          line: { color: '#EC4899', width: 1.5, dash: 'dot' },
        });
      }
    } else if (activeTab === 'integral') {
      // Riemann sum integration slices
      const riemann = NumericalEngine.calculateRiemann(fn, boundA, boundB, rectCount, riemannMethod);

      for (const rect of riemann.rectangles) {
        shapes.push({
          type: 'rect',
          x0: rect.x0,
          x1: rect.x1,
          y0: rect.y0,
          y1: rect.y1,
          fillcolor: 'rgba(66, 200, 181, 0.35)',
          line: { color: '#42C8B5', width: 1 },
        });
      }
    } else if (activeTab === 'taylor') {
      // Taylor polynomial trace
      const taylor = CalculusEngine.getTaylorSeries(expr, taylorCenter, taylorOrder);
      const tSample = NumericalEngine.sample2DCurve(taylor.evalFn, -4, 4, 500);
      traces.push({
        x: tSample.x,
        y: tSample.y,
        type: 'scatter',
        mode: 'lines',
        name: `P_${taylorOrder}(x) Taylor Approx`,
        line: { color: '#EC4899', width: 2, dash: 'dash' },
      });
    }

    const layout = {
      autosize: true,
      paper_bgcolor: paperColor,
      plot_bgcolor: bgColor,
      font: { family: 'Times New Roman, Times, serif', color: textColor, size: 12 },
      margin: { l: 50, r: 25, t: 25, b: 40 },
      xaxis: { range: [-4, 4], showgrid: true, gridcolor: gridColor, zerolinecolor: gridColor },
      yaxis: { range: [-6, 6], showgrid: true, gridcolor: gridColor, zerolinecolor: gridColor },
      shapes,
      legend: { orientation: 'h', y: 1.05, x: 1, xanchor: 'right', font: { family: 'Times New Roman, Times, serif', size: 12, color: textColor } },
      hovermode: 'closest',
    };

    p.react(plotDivRef.current, traces, layout, { responsive: true, displayModeBar: false });
  }, [
    expr,
    activeTab,
    x0,
    showDerivativeCurve,
    boundA,
    boundB,
    rectCount,
    riemannMethod,
    taylorOrder,
    taylorCenter,
    theme,
  ]);

  // Calculated values
  const currentTangent = CalculusEngine.getTangentLine(fn, x0);
  const riemannCalc = NumericalEngine.calculateRiemann(fn, boundA, boundB, rectCount, riemannMethod);
  const limitAnalysis = CalculusEngine.analyzeLimit(fn, limitA);
  const taylorCalc = CalculusEngine.getTaylorSeries(expr, taylorCenter, taylorOrder);

  return (
    <div className="space-y-5">
      {/* Header and Expression Input */}
      <div className="rounded-md border border-border bg-panel p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Activity className="w-4 h-4 text-text-main" />
              Calculus Visualisation & Learning Lab
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Explore dynamic tangent slopes, Riemann sum approximations, limit convergence, and Taylor polynomials.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-bold">Function:</span>
            <div className="p-1 rounded-sm bg-background border border-border">
              <MathView math={`f(x) = ${expr}`} className="text-xs font-semibold" />
            </div>
          </div>
        </div>

        {/* Input box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="Enter function f(x) e.g. x^3 - 3x or sin(x)..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
          />
        </div>

        {/* Module Tabs */}
        <div className="flex items-center gap-1.5 border-t border-border/70 pt-2.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('derivative')}
            className={`px-3 py-1.5 rounded-sm font-semibold transition-colors ${
              activeTab === 'derivative'
                ? 'bg-text-main text-background border border-text-main'
                : 'bg-panel border border-border text-text-muted hover:text-text-main hover:bg-panel-hover'
            }`}
          >
            Differentiation & Tangent Line
          </button>
          <button
            onClick={() => setActiveTab('integral')}
            className={`px-3 py-1.5 rounded-sm font-semibold transition-colors ${
              activeTab === 'integral'
                ? 'bg-text-main text-background border border-text-main'
                : 'bg-panel border border-border text-text-muted hover:text-text-main hover:bg-panel-hover'
            }`}
          >
            Definite Integration & Riemann Sums
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`px-3 py-1.5 rounded-sm font-semibold transition-colors ${
              activeTab === 'limits'
                ? 'bg-text-main text-background border border-text-main'
                : 'bg-panel border border-border text-text-muted hover:text-text-main hover:bg-panel-hover'
            }`}
          >
            Limits & Continuity Analysis
          </button>
          <button
            onClick={() => setActiveTab('taylor')}
            className={`px-3 py-1.5 rounded-sm font-semibold transition-colors ${
              activeTab === 'taylor'
                ? 'bg-text-main text-background border border-text-main'
                : 'bg-panel border border-border text-text-muted hover:text-text-main hover:bg-panel-hover'
            }`}
          >
            Taylor Series Polynomial Approximations
          </button>
        </div>
      </div>

      {/* Main Grid: Visualizer Canvas + Interactive Parameter Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Plotly Visualizer */}
        <div className="lg:col-span-2 rounded-md border border-border bg-panel overflow-hidden">
          <div className="px-3.5 py-2 border-b border-border bg-panel-hover/50 text-xs font-bold text-text-main flex items-center justify-between">
            <span>Dynamic Calculus Canvas</span>
            <span className="text-text-muted capitalize">{activeTab} Mode</span>
          </div>
          <div ref={plotDivRef} className="w-full h-[480px] bg-background" />
        </div>

        {/* Right Interactive Controls based on active module */}
        <div className="space-y-4">
          {activeTab === 'derivative' && (
            <Card title="Tangent Line Controls" subtitle="Move point along curve">
              <div className="space-y-3.5 text-xs">
                {/* Point Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-text-muted font-bold">
                    <span>Point of Tangency (x₀):</span>
                    <span className="text-text-main">{x0.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.05"
                    value={x0}
                    onChange={(e) => setX0(Number(e.target.value))}
                    className="w-full accent-text-main cursor-pointer"
                  />
                </div>

                {/* Animation Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={isTangentAnimating ? 'danger' : 'secondary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsTangentAnimating(!isTangentAnimating)}
                  >
                    {isTangentAnimating ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                    <span>{isTangentAnimating ? 'Stop Animation' : 'Animate Movement'}</span>
                  </Button>
                </div>

                {/* Live Values */}
                <div className="p-2.5 rounded-md bg-background border border-border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Coordinate (x₀, y₀):</span>
                    <span className="font-semibold text-text-main">
                      ({x0.toFixed(2)}, {fn(x0).toFixed(2)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Instantaneous Slope f'(x₀):</span>
                    <span className="font-bold text-text-main">
                      {currentTangent.slope.toFixed(3)}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-border/70">
                    <span className="text-[11px] text-text-muted block">Tangent Equation:</span>
                    <MathView math={currentTangent.equationLatex} className="text-xs" />
                  </div>
                </div>

                {/* Show derivative curve toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-text-main pt-1">
                  <input
                    type="checkbox"
                    checked={showDerivativeCurve}
                    onChange={(e) => setShowDerivativeCurve(e.target.checked)}
                    className="rounded-sm border-border accent-text-main"
                  />
                  <span>Show Derivative Curve f'(x)</span>
                </label>
              </div>
            </Card>
          )}

          {activeTab === 'integral' && (
            <Card title="Riemann Sum Controls" subtitle="Definite integral approximation">
              <div className="space-y-3.5 text-xs">
                {/* Method selector */}
                <div className="space-y-1">
                  <label className="block text-text-muted font-bold">Integration Method:</label>
                  <select
                    value={riemannMethod}
                    onChange={(e) => setRiemannMethod(e.target.value as any)}
                    className="w-full rounded-md border border-border bg-background p-1.5 text-text-main text-xs focus:border-text-main focus:outline-none"
                  >
                    <option value="left">Left Riemann Sum</option>
                    <option value="right">Right Riemann Sum</option>
                    <option value="midpoint">Midpoint Riemann Sum</option>
                    <option value="trapezoid">Trapezoidal Rule</option>
                    <option value="simpson">Simpson's 1/3 Rule</option>
                  </select>
                </div>

                {/* Rectangles Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-text-muted font-bold">
                    <span>Subdivisions (N):</span>
                    <span className="text-text-main">{rectCount}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="80"
                    step="1"
                    value={rectCount}
                    onChange={(e) => setRectCount(Number(e.target.value))}
                    className="w-full accent-text-main cursor-pointer"
                  />
                </div>

                {/* Bounds */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-text-muted block mb-1 font-bold">Lower Bound (a):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={boundA}
                      onChange={(e) => setBoundA(Number(e.target.value))}
                      className="w-full rounded-sm border border-border bg-background p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted block mb-1 font-bold">Upper Bound (b):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={boundB}
                      onChange={(e) => setBoundB(Number(e.target.value))}
                      className="w-full rounded-sm border border-border bg-background p-1 text-xs"
                    />
                  </div>
                </div>

                {/* Result Area */}
                <div className="p-2.5 rounded-md bg-background border border-border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Riemann Area:</span>
                    <span className="font-bold text-text-main text-xs">
                      {riemannCalc.approximateArea.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Width of each slice: <MathView math={`\\Delta x = \\frac{b-a}{n} = ${((boundB - boundA) / rectCount).toFixed(3)}`} />
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'limits' && (
            <Card title="Limit Convergence Table" subtitle={`Approaching x = ${limitA}`}>
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-text-muted block mb-1 font-bold">Target Point (a):</label>
                  <input
                    type="number"
                    value={limitA}
                    onChange={(e) => setLimitA(Number(e.target.value))}
                    className="w-full rounded-sm border border-border bg-background p-1.5 text-xs"
                  />
                </div>

                <div className="p-2.5 rounded-md bg-background border border-border space-y-1">
                  <span className="font-bold text-text-main block">{limitAnalysis.message}</span>
                  <div className="flex justify-between text-text-muted pt-1">
                    <span>Left limit: {limitAnalysis.leftLimit?.toFixed(4) ?? 'undef'}</span>
                    <span>Right limit: {limitAnalysis.rightLimit?.toFixed(4) ?? 'undef'}</span>
                  </div>
                </div>

                {/* Approaching Table */}
                <div className="max-h-48 overflow-y-auto border border-border rounded-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-panel-hover text-text-muted border-b border-border">
                      <tr>
                        <th className="p-1.5">x</th>
                        <th className="p-1.5">f(x)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {limitAnalysis.leftTable.slice(-3).map((row, i) => (
                        <tr key={`left_${i}`} className="text-text-muted">
                          <td className="p-1.5">{row.x}</td>
                          <td className="p-1.5 font-semibold text-text-main">{row.fx}</td>
                        </tr>
                      ))}
                      <tr className="bg-text-main/10 font-bold text-text-main">
                        <td className="p-1.5">x → {limitA}</td>
                        <td className="p-1.5">
                          {limitAnalysis.limit !== null ? limitAnalysis.limit.toFixed(4) : 'DNE'}
                        </td>
                      </tr>
                      {limitAnalysis.rightTable.slice(0, 3).map((row, i) => (
                        <tr key={`right_${i}`} className="text-text-muted">
                          <td className="p-1.5">{row.x}</td>
                          <td className="p-1.5 font-semibold text-text-main">{row.fx}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'taylor' && (
            <Card title="Taylor Polynomial Controls" subtitle="Series expansion around center a">
              <div className="space-y-3.5 text-xs">
                {/* Order Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-text-muted font-bold">
                    <span>Polynomial Order (N):</span>
                    <span className="text-text-main">{taylorOrder}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={taylorOrder}
                    onChange={(e) => setTaylorOrder(Number(e.target.value))}
                    className="w-full accent-text-main cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-text-muted block mb-1 font-bold">Center Point (a):</label>
                  <input
                    type="number"
                    value={taylorCenter}
                    onChange={(e) => setTaylorCenter(Number(e.target.value))}
                    className="w-full rounded-sm border border-border bg-background p-1.5 text-xs"
                  />
                </div>

                {/* Polynomial LaTeX preview */}
                <div className="p-2.5 rounded-md bg-background border border-border space-y-1">
                  <span className="text-[11px] text-text-muted block font-bold">
                    Approximating Polynomial:
                  </span>
                  <div className="overflow-x-auto py-1">
                    <MathView math={taylorCalc.polynomialLatex} className="text-xs font-semibold" />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
