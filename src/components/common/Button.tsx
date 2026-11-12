import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-border disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2',
    icon: 'p-1.5 text-sm',
  };

  const variantClasses = {
    primary:
      'bg-text-main text-background hover:opacity-90 border border-text-main',
    secondary:
      'bg-panel border border-border text-text-main hover:bg-panel-hover hover:border-text-muted/60',
    outline:
      'border border-border bg-transparent text-text-main hover:bg-panel hover:border-text-muted/60',
    ghost:
      'bg-transparent text-text-muted hover:text-text-main hover:bg-panel',
    danger:
      'border border-border bg-panel text-text-muted hover:text-text-main hover:bg-panel-hover hover:border-text-muted/60',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
