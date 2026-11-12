import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-text-main text-background border-text-main font-semibold',
    secondary: 'bg-panel-hover text-text-main border-border',
    neutral: 'bg-panel text-text-muted border-border',
    success: 'bg-panel text-text-main border-border',
    warning: 'bg-panel text-text-main border-border',
    danger: 'bg-panel text-text-muted border-border',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
