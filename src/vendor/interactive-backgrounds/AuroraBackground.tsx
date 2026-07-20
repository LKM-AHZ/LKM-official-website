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

<<<<<<< HEAD
=======
const AURORA_THEME = {
  dark: {
    layers: 3,
    colors: ['#6366f1', '#818cf8', '#22d3ee'],
    alpha: [0.16, 0.11, 0.07],
    waveSpeed: 0.12,
    mouseStrength: 14,
  },
  light: {
    layers: 2,
    colors: ['#818cf8', '#67e8f9'],
    alpha: [0.09, 0.055],
    waveSpeed: 0.08,
    mouseStrength: 7,
  },
} as const;

const MAX_RIPPLES = 12;

>>>>>>> 2764c34 (333)
export default function AuroraBackground({
  mouseRadius = 150,
  rippleColor: propRippleColor,
  className = '',
<<<<<<< HEAD
  layers = 5,
  baseWaveHeight = 30,
  waveSpacing = 10,
  waveSpeed = 0.5,
=======
  layers: propLayers,
  baseWaveHeight = 30,
  waveSpacing = 10,
  waveSpeed: propWaveSpeed,
>>>>>>> 2764c34 (333)
  lineWidthBase = 2,
  rippleMaxRadius = 120,
  rippleGrowthRate = 3,
  rippleLineWidth = 2,
}: AuroraBackgroundProps) {
  const mode = useColorMode();
<<<<<<< HEAD
  const rippleColor = propRippleColor ?? (mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)');
=======
  const theme = AURORA_THEME[mode];
  const rippleColor = propRippleColor ?? (mode === 'dark' ? '#818cf8' : '#a5f3fc');
>>>>>>> 2764c34 (333)
  const ripplesRef = useRef<LocalRipple[]>([]);

  const draw = useCallback(
    (frame: BackgroundFrame) => {
<<<<<<< HEAD
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
=======
      const { ctx, width, height, mouse, time, delta, performance } = frame;
      const { quality, reducedMotion } = performance;
      const qualityScale = quality === 'high' ? 1 : quality === 'medium' ? 0.75 : 0.5;
      const visibleLayers = Math.max(1, Math.round((propLayers ?? theme.layers) * qualityScale));
      const sampleStep = quality === 'low' ? 18 : quality === 'medium' ? 14 : 10;
      const motionScale = reducedMotion ? 0.02 : quality === 'low' ? 0.15 : 1;
      const mouseStrength = theme.mouseStrength * qualityScale;
      const rippleOpacity = (mode === 'light' ? 0.45 : 0.8) * (quality === 'low' ? 0.5 : 1);
      const waveSpeed = (propWaveSpeed ?? theme.waveSpeed) * motionScale;

      // Consume per-frame ripples batch, keeping the local queue bounded.
      for (const ripple of frame.ripples) {
        ripplesRef.current.push({ x: ripple.x, y: ripple.y, radius: 0, opacity: 1, growing: true });
      }
      if (ripplesRef.current.length > MAX_RIPPLES) {
        ripplesRef.current.splice(0, ripplesRef.current.length - MAX_RIPPLES);
      }

      ctx.clearRect(0, 0, width, height);
      for (let layer = 0; layer < visibleLayers; layer++) {
        ctx.beginPath();
        const waveHeight = baseWaveHeight + layer * waveSpacing;
        const waveOffset = time * waveSpeed + layer * 50;
        ctx.strokeStyle = theme.colors[layer % theme.colors.length];
        ctx.globalAlpha = theme.alpha[layer % theme.alpha.length];
        ctx.lineWidth = lineWidthBase + layer * 1.5;
        for (let x = 0; x <= width; x += sampleStep) {
>>>>>>> 2764c34 (333)
          const y =
            height / 2 +
            Math.sin(x * 0.01 + waveOffset) * waveHeight +
            (Math.sin(x * 0.02 + waveOffset * 1.3) * waveHeight) / 2;
          let finalY = y;
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
<<<<<<< HEAD
            const distort = dist < mouseRadius ? ((mouseRadius - dist) / mouseRadius) * 20 : 0;
=======
            const distort = dist < mouseRadius ? ((mouseRadius - dist) / mouseRadius) * mouseStrength : 0;
>>>>>>> 2764c34 (333)
            finalY = y - distort;
          }
          ctx.lineTo(x, finalY);
        }
        ctx.stroke();
      }

<<<<<<< HEAD
      // drawRipples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        if (ripple.growing) {
          ripple.radius += rippleGrowthRate;
=======
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        if (ripple.growing) {
          ripple.radius += rippleGrowthRate * delta * 60 * qualityScale;
>>>>>>> 2764c34 (333)
          ripple.opacity = 1 - ripple.radius / rippleMaxRadius;
          if (ripple.radius >= rippleMaxRadius) ripple.growing = false;
          return true;
        }
        return false;
      });
<<<<<<< HEAD
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
=======
      for (const ripple of ripplesRef.current) {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = rippleColor;
        ctx.globalAlpha = ripple.opacity * rippleOpacity;
        ctx.lineWidth = rippleLineWidth;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    [
      mouseRadius,
      mode,
      propLayers,
      theme,
      rippleColor,
      baseWaveHeight,
      waveSpacing,
      propWaveSpeed,
>>>>>>> 2764c34 (333)
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
