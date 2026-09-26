import React, { forwardRef } from 'react';
import { Plasma } from '@cruxgarden/plasma-ui';
import type { Offset } from '@cruxgarden/plasma-ui';

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
  snap?: boolean;
  group?: string;
  lean?: number | false;
  padding?: number;
  bounds?: React.RefObject<HTMLElement | null>;
  offset?: Offset;
  defaultOffset?: Offset;
  onDragStart?: () => void;
  onDragEnd?: (offset: Offset) => void;
  onJoinChange?: (joined: boolean) => void;
  interactive?: boolean;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PlasmaCard = forwardRef<HTMLDivElement, PlasmaCardProps>(({
  as = 'div',
  elevation = 0.35,
  radius = 16,
  tint,
  opacity,
  frost,
  fuse = true,
  draggable = false,
  snap = true,
  group,
  lean = 10,
  padding,
  bounds,
  offset,
  defaultOffset,
  onDragStart,
  onDragEnd,
  onJoinChange,
  interactive = false,
  active = false,
  className = '',
  children,
  ...rest
}, ref) => {
  return (
    <Plasma
      ref={ref as any}
      as={as as any}
      elevation={elevation}
      radius={radius}
      tint={tint}
      opacity={opacity}
      frost={frost}
      fuse={fuse}
      draggable={draggable}
      snap={snap}
      group={group}
      lean={lean}
      padding={padding}
      bounds={bounds}
      offset={offset}
      defaultOffset={defaultOffset}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onJoinChange={onJoinChange}
      className={`relative rounded-[${radius}px] bg-[var(--bg-card)]/30 border border-[var(--border-card)]/40 transition-colors duration-150 ${
        draggable ? 'touch-none select-none cursor-grab active:cursor-grabbing' : ''
      } ${
        interactive
          ? 'hover:border-white/20 hover:shadow-lg cursor-pointer'
          : ''
      } ${
        active
          ? 'border-[var(--accent-primary)]/80 ring-1 ring-[var(--accent-primary)]/40 shadow-[0_0_16px_var(--glow-primary)]'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Plasma>
  );
});

PlasmaCard.displayName = 'PlasmaCard';

export default PlasmaCard;
