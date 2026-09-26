import React from 'react';

export interface PlasmaSliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const PlasmaSlider: React.FC<PlasmaSliderProps> = ({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className = '',
  ...rest
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={`relative flex items-center w-full ${className}`} data-plasma-nodrag>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-[var(--bg-inset)] rounded-full appearance-none cursor-pointer accent-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50"
        style={{
          background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${percentage}%, var(--bg-inset) ${percentage}%, var(--bg-inset) 100%)`,
        }}
        {...rest}
      />
    </div>
  );
};

export default PlasmaSlider;
