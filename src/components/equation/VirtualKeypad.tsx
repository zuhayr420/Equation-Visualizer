import React from 'react';
import { Delete } from 'lucide-react';

interface VirtualKeypadProps {
  onInsert: (token: string) => void;
  onClear: () => void;
  onBackspace: () => void;
}

export const VirtualKeypad: React.FC<VirtualKeypadProps> = ({
  onInsert,
  onClear,
  onBackspace,
}) => {
  const keys = [
    // Row 1: Common variables & constants
    ['x', 'y', 'z', 't', '\\theta', '\\pi', 'e', 'C'],
    // Row 2: Powers, roots, fractions, brackets
    ['x^2', '^', '\\sqrt{x}', '\\frac{a}{b}', '(', ')', '|x|', '='],
    // Row 3: Trigonometric & transcendentals
    ['\\sin', '\\cos', '\\tan', '\\arcsin', '\\arccos', '\\arctan', '\\ln', '\\log'],
    // Row 4: Operators & digits
    ['7', '8', '9', '+', '-', '\\cdot', '/', '<='],
    ['4', '5', '6', '*', '/', '^', '>=', '!='],
    ['1', '2', '3', '0', '.', '<', '>', 'd/dx'],
  ];

  const mapTokenToInsert = (k: string): string => {
    switch (k) {
      case 'x^2': return '^2';
      case '\\sqrt{x}': return 'sqrt(';
      case '\\frac{a}{b}': return '/';
      case '|x|': return 'abs(';
      case '\\theta': return 'theta';
      case '\\pi': return 'pi';
      case '\\sin': return 'sin(';
      case '\\cos': return 'cos(';
      case '\\tan': return 'tan(';
      case '\\arcsin': return 'asin(';
      case '\\arccos': return 'acos(';
      case '\\arctan': return 'atan(';
      case '\\ln': return 'log(';
      case '\\log': return 'log10(';
      case '\\cdot': return '*';
      case 'd/dx': return 'diff(';
      default: return k;
    }
  };

  return (
    <div className="rounded-md border border-border bg-panel p-3 space-y-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-border/70 text-xs font-bold text-text-muted">
        <span>Mathematical Keypad</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onBackspace}
            className="px-2 py-0.5 rounded-sm bg-panel-hover border border-border hover:border-text-muted text-text-main flex items-center gap-1 transition-colors text-xs"
            title="Backspace"
          >
            <Delete className="w-3 h-3" />
            <span>Del</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-0.5 rounded-sm bg-panel border border-border text-text-muted hover:text-text-main hover:border-text-muted transition-colors text-xs"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1 text-xs">
        {keys.flat().map((k, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInsert(mapTokenToInsert(k))}
            className="h-7 rounded-sm bg-panel hover:bg-text-main hover:text-background border border-border text-text-main font-semibold transition-colors flex items-center justify-center text-xs"
          >
            {k.replace(/\\/g, '')}
          </button>
        ))}
      </div>
    </div>
  );
};
