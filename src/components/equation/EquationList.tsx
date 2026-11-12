import React, { useState } from 'react';
import { Plus, Sparkles, Trash } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EquationItem } from './EquationItem';
import { Button } from '../common/Button';

const PRESET_EXAMPLES = [
  { label: 'Quadratic Parabola', expr: 'y = x^2 - 4x + 3' },
  { label: 'Trigonometric Sine', expr: 'y = sin(x)' },
  { label: 'Damped Oscillation', expr: 'y = exp(-0.2*x) * cos(2*x)' },
  { label: 'Rational / Asymptote', expr: 'y = (x^2 - 1) / (x - 2)' },
  { label: 'Circle (Implicit)', expr: 'x^2 + y^2 = 25' },
  { label: 'Rose Curve (Polar)', expr: 'r = 3*cos(4*theta)' },
  { label: '3D Paraboloid', expr: 'z = x^2 + y^2' },
  { label: '3D Saddle Surface', expr: 'z = x^2 - y^2' },
];

export const EquationList: React.FC = () => {
  const {
    equations,
    selectedEquationId,
    setSelectedEquationId,
    addEquation,
    updateEquation,
    removeEquation,
    toggleEquationVisibility,
  } = useAppStore();

  const [inputVal, setInputVal] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      addEquation(inputVal.trim());
      setInputVal('');
    }
  };

  const handleSelectPreset = (expr: string) => {
    addEquation(expr);
  };

  return (
    <div className="space-y-3.5">
      {/* Input bar */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter equation (e.g. y = 3x^2 - 2x + 1 or x^2 + y^2 = 16)..."
          className="flex-1 rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
        />
        <Button variant="primary" size="sm" type="submit">
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </Button>
      </form>

      {/* Preset quick buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="flex items-center gap-1 text-text-muted whitespace-nowrap mr-0.5 font-bold">
          Presets:
        </span>
        {PRESET_EXAMPLES.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleSelectPreset(preset.expr)}
            className="px-2 py-0.5 rounded-sm bg-panel border border-border text-text-muted hover:text-text-main hover:bg-panel-hover whitespace-nowrap transition-colors text-xs"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Equations List */}
      <div className="space-y-2">
        {equations.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-text-muted">
            <p className="text-xs">No equations entered yet.</p>
            <p className="text-[11px] mt-0.5">Add an expression above or select an example preset to visualize.</p>
          </div>
        ) : (
          equations.map((eq) => (
            <EquationItem
              key={eq.id}
              equation={eq}
              isSelected={selectedEquationId === eq.id}
              onSelect={() => setSelectedEquationId(eq.id)}
              onUpdate={(updates) => updateEquation(eq.id, updates)}
              onDelete={() => removeEquation(eq.id)}
              onToggleVisibility={() => toggleEquationVisibility(eq.id)}
            />
          ))
        )}
      </div>

      {/* Bulk action buttons */}
      {equations.length > 0 && (
        <div className="flex items-center justify-between text-xs text-text-muted pt-1">
          <span>{equations.length} equation(s) registered</span>
          <button
            type="button"
            onClick={() => {
              equations.forEach((eq) => removeEquation(eq.id));
            }}
            className="flex items-center gap-1 text-text-muted hover:text-text-main transition-colors text-xs"
          >
            <Trash className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}
    </div>
  );
};
