import React, { useState } from 'react';
import { Box, Sparkles } from 'lucide-react';
import { ThreeCanvas } from './ThreeCanvas';
import { Card } from '../common/Card';
import { MathView } from '../common/MathView';

const PRESET_SURFACES = [
  { name: 'Elliptic Paraboloid', expr: 'z = x^2 + y^2' },
  { name: 'Hyperbolic Saddle', expr: 'z = x^2 - y^2' },
  { name: 'Egg Crate / Wave Grid', expr: 'z = sin(x) * cos(y)' },
  { name: 'Circular Cone', expr: 'z = sqrt(x^2 + y^2)' },
  { name: 'Monkey Saddle', expr: 'z = x^3 - 3*x*y^2' },
  { name: 'Damped Bessel Wave', expr: 'z = 3 * cos(sqrt(x^2 + y^2)) * exp(-0.1*(x^2 + y^2))' },
  { name: 'Oscillating Dynamic Wave', expr: 'z = 2 * sin(sqrt(x^2 + y^2) - t)' },
];

export const ThreeDStudio: React.FC = () => {
  const [equationStr, setEquationStr] = useState('z = x^2 - y^2');
  const [resolution, setResolution] = useState(65);
  const [colorMap, setColorMap] = useState<'viridis' | 'plasma' | 'coolwarm' | 'spectral' | 'neon'>('viridis');
  const [wireframe, setWireframe] = useState(false);
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  return (
    <div className="space-y-5">
      {/* Top equation input & presets */}
      <div className="rounded-md border border-border bg-panel p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Box className="w-4 h-4 text-text-main" />
              3D Mathematical Surface Studio
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Render continuous 2-manifold surfaces $z = f(x, y)$ in WebGL with interactive orbital navigation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-bold">LaTeX:</span>
            <div className="p-1 rounded-sm bg-background border border-border">
              <MathView math={equationStr} className="text-xs font-semibold" />
            </div>
          </div>
        </div>

        {/* Input box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={equationStr}
            onChange={(e) => setEquationStr(e.target.value)}
            placeholder="Enter 3D equation e.g. z = sin(x)*cos(y) or z = x^2 + y^2..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
          />
        </div>

        {/* Presets bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="flex items-center gap-1 text-text-muted whitespace-nowrap mr-0.5 font-bold">
            Presets:
          </span>
          {PRESET_SURFACES.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setEquationStr(p.expr)}
              className={`px-2 py-0.5 rounded-sm transition-colors whitespace-nowrap text-xs ${
                equationStr === p.expr
                  ? 'bg-text-main text-background font-bold border border-text-main'
                  : 'bg-panel border border-border text-text-muted hover:text-text-main hover:bg-panel-hover'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: 3D Canvas + Controls Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3">
          <ThreeCanvas
            equationStr={equationStr}
            resolution={resolution}
            colorMap={colorMap}
            wireframe={wireframe}
            showAxes={showAxes}
            showGrid={showGrid}
          />
        </div>

        {/* Right Settings Controls */}
        <div className="space-y-4">
          <Card title="Surface Controls" subtitle="Shader & Geometry parameters">
            <div className="space-y-3.5 text-xs">
              {/* Mesh Resolution Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-text-muted font-bold">
                  <span>Mesh Resolution:</span>
                  <span className="text-text-main">{resolution}×{resolution}</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="110"
                  step="5"
                  value={resolution}
                  onChange={(e) => setResolution(Number(e.target.value))}
                  className="w-full accent-text-main cursor-pointer"
                />
                <p className="text-[11px] text-text-muted">
                  Higher resolution yields finer curvature details.
                </p>
              </div>

              {/* Colormap selection */}
              <div className="space-y-1">
                <label className="block text-text-muted font-bold">Height Color Map:</label>
                <select
                  value={colorMap}
                  onChange={(e) => setColorMap(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background p-1.5 text-text-main text-xs focus:border-text-main focus:outline-none"
                >
                  <option value="viridis">Viridis (Cyan to Yellow)</option>
                  <option value="plasma">Plasma (Purple to Orange)</option>
                  <option value="coolwarm">CoolWarm (Blue to Red)</option>
                  <option value="spectral">Spectral Rainbow</option>
                  <option value="neon">Cyberpunk Neon</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-border/70">
                <label className="flex items-center gap-2 cursor-pointer text-text-main">
                  <input
                    type="checkbox"
                    checked={wireframe}
                    onChange={(e) => setWireframe(e.target.checked)}
                    className="rounded-sm border-border accent-text-main"
                  />
                  <span>Show Wireframe Grid</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-main">
                  <input
                    type="checkbox"
                    checked={showAxes}
                    onChange={(e) => setShowAxes(e.target.checked)}
                    className="rounded-sm border-border accent-text-main"
                  />
                  <span>Show Coordinate Axes (X=Red, Y=Green, Z=Blue)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-main">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded-sm border-border accent-text-main"
                  />
                  <span>Show Base Floor Grid</span>
                </label>
              </div>
            </div>
          </Card>

          <Card title="Quick Mathematical Tips">
            <div className="space-y-1.5 text-xs text-text-muted">
              <p>
                • Include <code className="text-text-main font-semibold">t</code> in your expression (e.g. <code className="text-text-muted">z = sin(x - t)</code>) to watch animated wave oscillations.
              </p>
              <p>
                • Drag with left mouse button to rotate viewpoint around origin $(0, 0, 0)$.
              </p>
              <p>
                • Right-click and drag to translate/pan the camera frame.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
