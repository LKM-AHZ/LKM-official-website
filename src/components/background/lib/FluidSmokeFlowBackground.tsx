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

const QUALITY_MULTIPLIER = { high: 1, medium: 0.68, low: 0.4 } as const;
const BASE_FRAME_RATE = 60;

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
  const particleColor = propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');

  const particlesRef = useRef<Particle[]>([]);
  const lastQualityRef = useRef<BackgroundFrame['performance']['quality'] | null>(null);

  const createParticles = useCallback(
    (width: number, height: number, quality: BackgroundFrame['performance']['quality']) => {
      const count = Math.floor(particleCount * QUALITY_MULTIPLIER[quality]);
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
      lastQualityRef.current = quality;
    },
    [particleCount]
  );

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      createParticles(frame.width, frame.height, frame.performance.quality);
      return () => {
        particlesRef.current = [];
      };
    },
    [createParticles]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse, delta, performance } = frame;
      const multiplier = QUALITY_MULTIPLIER[performance.quality];
      if (performance.quality !== lastQualityRef.current) {
        createParticles(width, height, performance.quality);
      }
      const motionStep = delta * BASE_FRAME_RATE;
      const motionScale = performance.reducedMotion ? 0.05 : motionStep;
      const scaledInteractionRadius = interactionRadius * multiplier;
      const scaledInteractionStrength = interactionStrength * multiplier;
      // 低画质粒子更少，需要更积极地清理旧轨迹。
      const cleanupAlpha = Math.min(1, backgroundFadeAlpha / multiplier);
      ctx.fillStyle = `rgba(0, 0, 0, ${cleanupAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = particleColor;

      particlesRef.current.forEach((p) => {
        if (!performance.reducedMotion && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < scaledInteractionRadius) {
            const force = (scaledInteractionRadius - dist) / scaledInteractionRadius;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force * scaledInteractionStrength * motionStep;
            p.vy -= Math.sin(angle) * force * scaledInteractionStrength * motionStep;
          }
        }

        p.vx *= Math.pow(0.96, motionStep);
        p.vy *= Math.pow(0.96, motionStep);

        const prevX = p.x;
        const prevY = p.y;
        p.x += p.vx * motionScale;
        p.y += p.vy * motionScale;

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
    [createParticles, particleColor, lineWidth, interactionRadius, interactionStrength, backgroundFadeAlpha]
  );

  return <BackgroundCanvas draw={draw} init={init} interactions={{ mouse: true }} className={className} />;
}
