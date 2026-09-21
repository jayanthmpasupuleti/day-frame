import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

export interface ConfettiRef {
  fire: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  tilt: number;
  vTilt: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle' | 'star' | 'ribbon';
  opacity: number;
  decay: number;
  wobble: number;
  wobbleSpeed: number;
}

const DEFAULT_PALETTE = [
  '#00E599', // Neon Mint
  '#4DFFB2', // Bright Mint
  '#A78BFA', // Cyber Violet
  '#C084FC', // Light Violet
  '#38BDF8', // Sky Cyan
  '#F59E0B', // Amber Gold
  '#F43F5E', // Coral Pink
  '#FFFFFF', // White Sparkle
];

const getThemePalette = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_PALETTE;
  try {
    const computed = getComputedStyle(document.documentElement);
    const primary = computed.getPropertyValue('--accent-primary').trim();
    const secondary = computed.getPropertyValue('--accent-secondary').trim();
    const primaryHover = computed.getPropertyValue('--accent-primary-hover').trim();
    const audio = computed.getPropertyValue('--accent-audio').trim();

    if (primary && secondary) {
      return [
        primary,
        primary,
        secondary,
        secondary,
        primaryHover || primary,
        audio || '#A78BFA',
        '#FFFFFF',
        '#FBBF24',
      ];
    }
  } catch {}
  return DEFAULT_PALETTE;
};

const SHAPES: Array<'rect' | 'circle' | 'star' | 'ribbon'> = ['rect', 'rect', 'circle', 'star', 'ribbon'];

export const ConfettiCanvas = forwardRef<ConfettiRef, { triggerCount?: number }>(
  ({ triggerCount }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number | null>(null);

    // Helper to draw a 4-point sparkle star
    const drawStar = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const rot = (Math.PI / 2) * i;
        ctx.lineTo(Math.cos(rot) * size, Math.sin(rot) * size);
        const innerRot = rot + Math.PI / 4;
        ctx.lineTo(Math.cos(innerRot) * (size * 0.35), Math.sin(innerRot) * (size * 0.35));
      }
      ctx.closePath();
      ctx.fill();
    };

    const addBurst = useCallback(
      (originX: number, originY: number, count: number, angleDeg: number, spreadDeg: number, minSpeed: number, maxSpeed: number) => {
        const particles: Particle[] = [];
        const radAngle = (angleDeg * Math.PI) / 180;
        const radSpread = (spreadDeg * Math.PI) / 180;
        const palette = getThemePalette();

        for (let i = 0; i < count; i++) {
          const pAngle = radAngle + (Math.random() - 0.5) * radSpread;
          const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
          const color = palette[Math.floor(Math.random() * palette.length)];
          const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

          particles.push({
            x: originX,
            y: originY,
            vx: Math.cos(pAngle) * speed,
            vy: -Math.sin(pAngle) * speed,
            angle: Math.random() * Math.PI * 2,
            vAngle: (Math.random() - 0.5) * 0.2,
            tilt: Math.random() * Math.PI * 2,
            vTilt: 0.08 + Math.random() * 0.12,
            size: shape === 'ribbon' ? 4 + Math.random() * 5 : 6 + Math.random() * 8,
            color,
            shape,
            opacity: 1,
            decay: 0.005 + Math.random() * 0.008,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.05 + Math.random() * 0.07,
          });
        }

        particlesRef.current.push(...particles);
      },
      []
    );

    // Multi-stage grand celebration sequence
    const fire = useCallback(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Stage 1: Dual cannons from left and right corners
      addBurst(w * 0.05, h * 0.95, 65, 60, 45, 14, 23);
      addBurst(w * 0.95, h * 0.95, 65, 120, 45, 14, 23);

      // Stage 2: Central fountain erupts after 220ms
      setTimeout(() => {
        addBurst(w * 0.5, h * 0.95, 85, 90, 60, 16, 26);
      }, 220);

      // Stage 3: Secondary sparkle bursts at 550ms
      setTimeout(() => {
        addBurst(w * 0.25, h * 0.75, 45, 75, 50, 12, 19);
        addBurst(w * 0.75, h * 0.75, 45, 105, 50, 12, 19);
      }, 550);
    }, [addBurst]);

    useImperativeHandle(ref, () => ({
      fire,
    }));

    // Trigger on external counter updates
    useEffect(() => {
      if (triggerCount && triggerCount > 0) {
        fire();
      }
    }, [triggerCount, fire]);

    // Canvas rendering & physics loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let isRunning = true;

      const handleResize = () => {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const loop = () => {
        if (!isRunning) return;

        const particles = particlesRef.current;
        if (particles.length === 0) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          // Physics updates
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.32; // Gravity
          p.vx *= 0.985; // Air drag
          p.vy *= 0.985;
          p.angle += p.vAngle;
          p.tilt += p.vTilt;
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.6; // Fluttering wobble

          // Fade out as it descends
          if (p.vy > 0) {
            p.opacity -= p.decay;
          }

          if (p.opacity <= 0 || p.y > window.innerHeight + 50) {
            particles.splice(i, 1);
            continue;
          }

          // Render particle
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.scale(Math.cos(p.tilt), 1);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'star') {
            drawStar(ctx, p.size);
          } else if (p.shape === 'ribbon') {
            ctx.fillRect(-p.size * 0.4, -p.size * 1.5, p.size * 0.8, p.size * 3);
          } else {
            // Default rect
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          }

          ctx.restore();
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);

      return () => {
        isRunning = false;
        window.removeEventListener('resize', handleResize);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100vw', height: '100vh' }}
      />
    );
  }
);

ConfettiCanvas.displayName = 'ConfettiCanvas';
