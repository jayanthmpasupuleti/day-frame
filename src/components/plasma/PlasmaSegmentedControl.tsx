import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface PlasmaSegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: SegmentOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
}

export function PlasmaSegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  size = 'md',
  className = '',
}: PlasmaSegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'p-0.5 text-[10.5px]',
    md: 'p-1 text-xs',
  }[size];

  const itemSizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
  }[size];

  return (
    <div
      data-plasma-nodrag
      role="group"
      className={`inline-flex items-center gap-0.5 rounded-full bg-[var(--bg-inset)] border border-[var(--border-card)] shadow-inner ${sizeClasses} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 font-medium rounded-full transition-all duration-150 cursor-pointer select-none ${itemSizeClasses} ${
              isSelected
                ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default PlasmaSegmentedControl;
