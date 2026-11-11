import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  footer,
}) => {
  return (
    <div className={`rounded-md border border-border bg-panel p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3.5 flex items-center justify-between border-b border-border/70 pb-2.5">
          <div>
            {title && <h3 className="text-sm font-bold text-text-main tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="mt-3.5 border-t border-border/70 pt-2.5 flex items-center justify-between text-xs text-text-muted">
          {footer}
        </div>
      )}
    </div>
  );
};
