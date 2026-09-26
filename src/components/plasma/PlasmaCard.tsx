import React from 'react';
import { Plasma } from '@cruxgarden/plasma-ui';

export interface PlasmaCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDragStart' | 'onDragEnd'> {
  as?: React.ElementType;
  elevation?: number;
  radius?: number;
  tint?: string;
  opacity?: number;
  frost?: number;
  fuse?: boolean;
  draggable?: boolean;
  lean?: number | false;
  padding?: number;
  interactive?: boolean;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PlasmaCard: React.FC<PlasmaCardProps> = ({
  as = 'div',
  elevation = 0.35,
  radius = 16,
  tint,
  opacity,
  frost,
  fuse = true,
  draggable = false,
  lean = 6,
  padding,
  interactive = false,
  active = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <Plasma
      as={as as any}
      elevation={elevation}
      radius={radius}
      tint={tint}
      opacity={opacity}
      frost={frost}
      fuse={fuse}
      draggable={draggable}
      lean={lean}
      padding={padding}
      className={`relative rounded-[${radius}px] bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-card)] transition-all duration-200 ${
        interactive
          ? 'hover:border-white/20 hover:shadow-lg cursor-pointer active:scale-[0.99]'
          : ''
      } ${
        active
          ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40 shadow-[0_0_16px_var(--glow-primary)]'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Plasma>
  );
};

export default PlasmaCard;
