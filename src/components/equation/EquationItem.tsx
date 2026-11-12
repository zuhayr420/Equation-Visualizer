import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import type { Equation } from '../../types';
import { MathView } from '../common/MathView';
import { Badge } from '../common/Badge';

const COLOR_PALETTE = [
  '#7C8FFF',
  '#42C8B5',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
  '#EF4444',
  '#38BDF8',
];

interface EquationItemProps {
  equation: Equation;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Equation>) => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export const EquationItem: React.FC<EquationItemProps> = ({
  equation,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onToggleVisibility,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(equation.rawInput);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const handleSave = () => {
    if (inputVal.trim()) {
      onUpdate({ rawInput: inputVal.trim() });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputVal(equation.rawInput);
    setIsEditing(false);
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-md border p-3 transition-colors cursor-pointer ${
        isSelected
          ? 'border-text-main bg-panel ring-1 ring-border'
          : 'border-border bg-panel hover:border-text-muted/70'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Visibility toggle & Color pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="p-1 rounded text-text-muted hover:text-text-main transition-colors"
            title={equation.visible ? 'Hide graph' : 'Show graph'}
          >
            {equation.visible ? (
              <Eye className="w-3.5 h-3.5 text-text-main" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 opacity-40" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setColorPickerOpen(!colorPickerOpen);
              }}
              className="w-3.5 h-3.5 rounded-full border border-border shadow-xs transition-opacity hover:opacity-80"
              style={{ backgroundColor: equation.color }}
              title="Change graph color"
            />
            {colorPickerOpen && (
              <div
                className="absolute left-0 top-5 z-50 flex gap-1 p-1 rounded-md border border-border bg-panel shadow-md"
                onClick={(e) => e.stopPropagation()}
              >
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onUpdate({ color: c });
                      setColorPickerOpen(false);
                    }}
                    className="w-4 h-4 rounded-full border border-border hover:opacity-80"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <span className="text-xs font-bold text-text-main mr-1">
            {equation.label}:
          </span>
        </div>

        {/* Center: Equation display or inline edit */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="w-full rounded-sm border border-border bg-background px-2 py-1 text-xs text-text-main focus:border-text-main focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSave}
                className="p-1 rounded text-text-main hover:bg-panel-hover"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded text-text-muted hover:text-text-main hover:bg-panel-hover"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto flex items-center gap-2">
              <MathView
                math={equation.latex || equation.rawInput}
                className={`text-xs font-semibold ${!equation.visible ? 'opacity-40' : ''}`}
              />
              {!equation.valid && (
                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                  <AlertCircle className="w-3 h-3 text-text-muted" />
                  {equation.errorMessage || 'Invalid Syntax'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Badge variant="neutral" className="text-[10px] hidden sm:inline-flex">
            {equation.type}
          </Badge>

          {!isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 rounded text-text-muted hover:text-text-main hover:bg-panel-hover transition-colors"
              title="Edit Equation"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-text-muted hover:text-text-main hover:bg-panel-hover transition-colors"
            title="Delete Equation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
