import React from 'react';

export interface PlasmaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  onEnter?: () => void;
  className?: string;
}

export const PlasmaInput = React.forwardRef<HTMLInputElement, PlasmaInputProps>(
  ({ icon, onEnter, className = '', onKeyDown, ...rest }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onEnter) {
        e.preventDefault();
        onEnter();
      }
      onKeyDown?.(e);
    };

    return (
      <div className="relative flex items-center w-full" data-plasma-nodrag>
        {icon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          data-plasma-nodrag
          onKeyDown={handleKeyDown}
          className={`w-full py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-card)] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/50 transition-all duration-150 ${
            icon ? 'pl-9 pr-3' : 'px-3'
          } ${className}`}
          {...rest}
        />
      </div>
    );
  }
);

PlasmaInput.displayName = 'PlasmaInput';

export default PlasmaInput;
