import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

export interface FluidSmokeFlowBackgroundProps {
  particleColor?: string;
  lineWidth?: number;
  className?: string;
  particleCount?: number;
  interactionRadius?: number;
  interactionStrength?: number;
  backgroundFadeAlpha?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function FluidSmokeFlowBackground({
  particleColor: propParticleColor,
  lineWidth = 1,
  className = '',
  particleCount = 300,
  interactionRadius = 100,
  interactionStrength = 0.3,
  backgroundFadeAlpha = 0.08,
}: FluidSmokeFlowBackgroundProps) {
  const mode = useColorMode();
  const particleColor =
    propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');

  const particlesRef = useRef<Particle[]>([]);

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * frame.width,
          y: Math.random() * frame.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
      particlesRef.current = particles;
      return () => {
        particlesRef.current = [];
      };
    },
    [particleCount]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse } = frame;
      ctx.fillStyle = `rgba(0, 0, 0, ${backgroundFadeAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = particleColor;

      particlesRef.current.forEach((p) => {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < interactionRadius) {
            const force = (interactionRadius - dist) / interactionRadius;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force * interactionStrength;
            p.vy -= Math.sin(angle) * force * interactionStrength;
          }
        }

        p.vx *= 0.96;
        p.vy *= 0.96;

        const prevX = p.x;
        const prevY = p.y;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.y < 0) p.y = height;
        if (p.x > width) p.x = 0;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });
    },
    [particleColor, lineWidth, interactionRadius, interactionStrength, backgroundFadeAlpha]
  );

  return (
    <BackgroundCanvas
      draw={draw}
      init={init}
      interactions={{ mouse: true }}
      className={className}
    />
  );
}
