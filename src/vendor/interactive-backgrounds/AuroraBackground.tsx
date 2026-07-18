import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

export interface AuroraBackgroundProps {
  mouseRadius?: number;
  rippleColor?: string;
  className?: string;
  layers?: number;
  baseWaveHeight?: number;
  waveSpacing?: number;
  waveSpeed?: number;
  lineWidthBase?: number;
  rippleMaxRadius?: number;
  rippleGrowthRate?: number;
  rippleLineWidth?: number;
}

interface LocalRipple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  growing: boolean;
}

export default function AuroraBackground({
  mouseRadius = 150,
  rippleColor: propRippleColor,
  className = '',
  layers = 5,
  baseWaveHeight = 30,
  waveSpacing = 10,
  waveSpeed = 0.5,
  lineWidthBase = 2,
  rippleMaxRadius = 120,
  rippleGrowthRate = 3,
  rippleLineWidth = 2,
}: AuroraBackgroundProps) {
  const mode = useColorMode();
  const rippleColor = propRippleColor ?? (mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)');
  const ripplesRef = useRef<LocalRipple[]>([]);

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse, time } = frame;

      // Consume per-frame ripples batch
      for (const r of frame.ripples) {
        ripplesRef.current.push({ x: r.x, y: r.y, radius: 0, opacity: 1, growing: true });
      }

      // drawAuroraWave
      ctx.clearRect(0, 0, width, height);
      for (let layer = 0; layer < layers; layer++) {
        ctx.beginPath();
        const waveHeight = baseWaveHeight + layer * waveSpacing;
        const waveOffset = time * waveSpeed + layer * 50;
        const alpha = 0.05 + layer * 0.05;
        const hue = (time * 10 + layer * 50) % 360;
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
        ctx.lineWidth = lineWidthBase + layer * 1.5;
        for (let x = 0; x <= width; x += 10) {
          const y =
            height / 2 +
            Math.sin(x * 0.01 + waveOffset) * waveHeight +
            (Math.sin(x * 0.02 + waveOffset * 1.3) * waveHeight) / 2;
          let finalY = y;
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const distort = dist < mouseRadius ? ((mouseRadius - dist) / mouseRadius) * 20 : 0;
            finalY = y - distort;
          }
          ctx.lineTo(x, finalY);
        }
        ctx.stroke();
      }

      // drawRipples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        if (ripple.growing) {
          ripple.radius += rippleGrowthRate;
          ripple.opacity = 1 - ripple.radius / rippleMaxRadius;
          if (ripple.radius >= rippleMaxRadius) ripple.growing = false;
          return true;
        }
        return false;
      });
      ripplesRef.current.forEach((ripple) => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = rippleColor.replace(/[\d.]+(?=\))/, (ripple.opacity * 0.8).toString());
        ctx.lineWidth = rippleLineWidth;
        ctx.stroke();
      });
    },
    [
      mouseRadius,
      rippleColor,
      layers,
      baseWaveHeight,
      waveSpacing,
      waveSpeed,
      lineWidthBase,
      rippleMaxRadius,
      rippleGrowthRate,
      rippleLineWidth,
    ]
  );

  return (
    <BackgroundCanvas
      draw={draw}
      interactions={{ mouse: true, click: true }}
      className={className}
    />
  );
}
