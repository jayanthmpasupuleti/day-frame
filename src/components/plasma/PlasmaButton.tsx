import React from 'react';

export interface PlasmaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PlasmaButton: React.FC<PlasmaButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  active = false,
  className = '',
  children,
  disabled,
  ...rest
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] rounded-full gap-1.5',
    md: 'px-3.5 py-1.5 text-xs rounded-full gap-2',
    lg: 'px-4 py-2.5 text-sm rounded-xl gap-2 font-bold',
    icon: 'p-1.5 rounded-full aspect-square flex items-center justify-center',
  }[size];

  const variantClasses = {
    primary:
      'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold shadow-md hover:brightness-110 active:scale-95',
    secondary:
      'bg-[var(--bg-inset)] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-[var(--border-card)] hover:border-white/20 active:scale-98',
    ghost:
      'bg-transparent hover:bg-white/[0.08] text-slate-400 hover:text-white active:scale-98',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 active:scale-95',
    warning:
      'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 hover:border-amber-500/50 active:scale-95',
    subtle:
      'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white active:scale-98',
  }[variant];

  return (
    <button
      data-plasma-nodrag
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${
        active ? 'ring-1 ring-[var(--accent-primary)] border-[var(--accent-primary)]' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default PlasmaButton;
