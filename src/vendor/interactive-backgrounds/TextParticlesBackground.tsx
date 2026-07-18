import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

export interface TextParticlesBackgroundProps {
  text?: string;
  fontSize?: number;
  density?: number;
  color?: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function TextParticlesBackground({
  text = '理科迷',
  fontSize = 120,
  density = 4,
  color: propColor,
  className = '',
}: TextParticlesBackgroundProps) {
  const mode = useColorMode();
  const color = propColor || (mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)');
  const particlesRef = useRef<Particle[]>([]);
  const lastSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const createTextParticles = useCallback(
    (width: number, height: number) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return [];

      offCtx.font = `${fontSize}px Space Grotesk`;
      offCtx.textAlign = 'center';
      offCtx.fillStyle = '#ffffff';
      offCtx.fillText(text, width / 2, height / 2);
      const imageData = offCtx.getImageData(0, 0, width, height);
      const data = imageData.data;

      const particles: Particle[] = [];
      for (let y = 0; y < height; y += density) {
        for (let x = 0; x < width; x += density) {
          const index = (y * width + x) * 4;
          const alpha = data[index + 3];
          if (alpha > 128) {
            particles.push({
              x: x + Math.random() * 10 - 5,
              y: y + Math.random() * 10 - 5,
              baseX: x,
              baseY: y,
              vx: 0,
              vy: 0,
              size: 1.5,
              opacity: 1,
            });
          }
        }
      }

      // Scatter background particles in empty space
      const bgParticleCount = 200;
      for (let i = 0; i < bgParticleCount; i++) {
        const px = Math.random() * width;
        const py = Math.random() * height;
        const tooClose = particles.some(
          (p) => Math.hypot(p.baseX - px, p.baseY - py) < 15
        );
        if (!tooClose) {
          particles.push({
            x: px,
            y: py,
            baseX: px,
            baseY: py,
            vx: 0,
            vy: 0,
            size: 1 + Math.random() * 1.5,
            opacity: 0.4 + Math.random() * 0.3,
          });
        }
      }

      return particles;
    },
    [text, fontSize, density]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse } = frame;

      // Ensure pattern: rebuild particles on resize
      if (width !== lastSizeRef.current.width || height !== lastSizeRef.current.height) {
        lastSizeRef.current = { width, height };
        particlesRef.current = createTextParticles(width, height);
      }

      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((p) => {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = 80 / dist;
          if (dist < 80) {
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force * 0.5;
            p.vy -= Math.sin(angle) * force * 0.5;
          }
        }

        const dxBase = p.baseX - p.x;
        const dyBase = p.baseY - p.y;
        p.vx += dxBase * 0.01;
        p.vy += dyBase * 0.01;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(/[\d.]+(?=\))/, p.opacity.toFixed(2));
        ctx.fill();
      });
    },
    [color, createTextParticles]
  );

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      lastSizeRef.current = { width: frame.width, height: frame.height };
      particlesRef.current = createTextParticles(frame.width, frame.height);
    },
    [createTextParticles]
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
