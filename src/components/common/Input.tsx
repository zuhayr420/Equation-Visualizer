import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border bg-panel px-3 py-1.5 text-sm text-text-main placeholder-text-muted/60 transition-colors focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border ${
          error ? 'border-text-muted focus:border-text-main' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-text-muted mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
    </div>
  );
};
