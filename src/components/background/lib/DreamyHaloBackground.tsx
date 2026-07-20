import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';

interface Halo {
  x: number;
  y: number;
  r: number;
  phase: number;
}

export interface DreamyHaloBackgroundProps {
  baseHue?: number;
  className?: string;
  blurOverlay?: boolean;
  overlayOpacity?: number;
  haloCount?: number;
  haloRadiusMin?: number;
  haloRadiusMax?: number;
  pulseAmplitude?: number;
  saturation?: number;
  lightness?: number;
}

export default function DreamyHaloBackground({
  baseHue = 280,
  className = '',
  blurOverlay = true,
  overlayOpacity = 0.3,
  haloCount = 20,
  haloRadiusMin = 50,
  haloRadiusMax = 150,
  pulseAmplitude = 20,
  saturation = 100,
  lightness = 85,
}: DreamyHaloBackgroundProps) {
  const halosRef = useRef<Halo[]>([]);

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      const halos: Halo[] = [];
      for (let i = 0; i < haloCount; i++) {
        halos.push({
          x: Math.random() * frame.width,
          y: Math.random() * frame.height,
          r: Math.random() * (haloRadiusMax - haloRadiusMin) + haloRadiusMin,
          phase: Math.random() * Math.PI * 2,
        });
      }
      halosRef.current = halos;
      return () => {
        halosRef.current = [];
      };
    },
    [haloCount, haloRadiusMin, haloRadiusMax]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, time } = frame;
      ctx.clearRect(0, 0, width, height);
      halosRef.current.forEach((halo, index) => {
        const pulse = Math.sin(time + halo.phase) * pulseAmplitude;
        const gradient = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, halo.r + pulse);
        const hueShift = (baseHue + index * 10 + time * 10) % 360;
        gradient.addColorStop(0, `hsla(${hueShift}, ${saturation}%, ${lightness}%, 0.25)`);
        gradient.addColorStop(1, `hsla(${hueShift}, ${saturation}%, ${lightness}%, 0)`);
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(halo.x, halo.y, halo.r + pulse, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    [baseHue, pulseAmplitude, saturation, lightness]
  );

  return (
    <BackgroundCanvas draw={draw} init={init} className={className}>
      {blurOverlay && (
        <div
          className="absolute inset-0 backdrop-blur-md pointer-events-none"
          style={{ zIndex: 1, backgroundColor: `rgba(255,255,255,${overlayOpacity})` }}
        />
      )}
    </BackgroundCanvas>
  );
}
