import React from 'react';

export interface PlasmaBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'primary' | 'outline' | 'muted' | 'success' | 'warning';
  size?: 'sm' | 'md';
  mono?: boolean;
  active?: boolean;
  interactive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PlasmaBadge: React.FC<PlasmaBadgeProps> = ({
  variant = 'default',
  size = 'sm',
  mono = false,
  active = false,
  interactive = false,
  className = '',
  children,
  onClick,
  ...rest
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10.5px]',
    md: 'px-2.5 py-1 text-xs',
  }[size];

  const variantClasses = {
    default:
      'bg-[var(--bg-inset)] text-slate-300 border border-[var(--border-card)]',
    primary:
      'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/35 shadow-xs',
    accent:
      'bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/35',
    outline:
      'bg-transparent text-slate-400 border border-white/10 hover:border-white/20',
    muted:
      'bg-white/[0.04] text-slate-400 border border-white/[0.06]',
    success:
      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning:
      'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  }[variant];

  const Component = interactive ? 'button' : 'span';

  return (
    <Component
      data-plasma-nodrag
      onClick={onClick as any}
      type={interactive ? 'button' : undefined}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-150 select-none ${
        mono ? 'font-mono tabular-nums tracking-tight' : ''
      } ${sizeClasses} ${variantClasses} ${
        interactive ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''
      } ${
        active
          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-transparent font-bold shadow-xs'
          : ''
      } ${className}`}
      {...(rest as any)}
    >
      {children}
    </Component>
  );
};

export default PlasmaBadge;
