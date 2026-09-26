import React from 'react';

export interface PlasmaProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const PlasmaProgress: React.FC<PlasmaProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  className = '',
  ...rest
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  return (
    <div className={`w-full flex items-center gap-2 ${className}`} {...rest}>
      <div
        className={`flex-1 w-full bg-[var(--bg-inset)] border border-[var(--border-card)] rounded-full overflow-hidden relative ${heightClasses}`}
      >
        <div
          className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300 relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          {/* Subtle liquid shimmer wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
      {showLabel && (
        <span className="text-[11px] font-mono font-bold text-slate-300 tabular-nums">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export default PlasmaProgress;
