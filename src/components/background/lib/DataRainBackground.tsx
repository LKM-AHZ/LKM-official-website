import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

const DEFAULT_CHAR_SET = ['0', '1', 'あ', 'ｑ', 'Æ', 'Ψ'];

interface Column {
  x: number;
  originalX: number;
  yPositions: number[];
  chars: string[];
  speeds: number[];
  deflectionX: number[];
  deflectionDecay: number[];
}

interface LocalRipple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export interface DataRainBackgroundProps {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  rippleColor?: string;
  density?: number;
  className?: string;
  flickerSpeed?: number;
  trailLength?: number;
  charSet?: string[];
  charChangeRate?: number;
  deflectionForce?: number;
  mouseGlowRadius?: number;
  rippleGrowthRate?: number;
  rippleFadeRate?: number;
  rippleLineWidth?: number;
  charSpeedMin?: number;
  charSpeedMax?: number;
}

export default function DataRainBackground({
  fontSize = 18,
  fontFamily = 'Space Grotesk',
  color: propColor,
  rippleColor: propRippleColor,
  density = 0.05,
  className = '',
  flickerSpeed = 0.05,
  trailLength = 15,
  charSet = DEFAULT_CHAR_SET,
  charChangeRate = 0.1,
  deflectionForce = 50,
  mouseGlowRadius = 80,
  rippleGrowthRate = 3,
  rippleFadeRate = 0.015,
  rippleLineWidth = 2,
  charSpeedMin = 0.5,
  charSpeedMax = 2.5,
}: DataRainBackgroundProps) {
  const mode = useColorMode();
  const color = propColor ?? (mode === 'dark' ? 'rgba(0,255,0,0.8)' : 'rgba(0,80,0,0.7)');
  const rippleColor = propRippleColor ?? (mode === 'dark' ? 'rgba(0,255,127,0.5)' : 'rgba(0,0,0,0.08)');

  const columnsRef = useRef<Column[]>([]);
  const ripplesRef = useRef<LocalRipple[]>([]);
  const mouseIntensityRef = useRef(0);
  const flickerRef = useRef(0);
  const lastMouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const lastSizeRef = useRef({ width: 0, height: 0 });

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      const { width, height } = frame;
      lastSizeRef.current = { width, height };
      const columnCount = Math.floor(width * density);
      const columnWidth = width / columnCount;
      const charCount = Math.floor(height / fontSize);
      const columns: Column[] = [];
      for (let i = 0; i < columnCount; i++) {
        const x = i * columnWidth + columnWidth / 2;
        const yPositions: number[] = [];
        const chars: string[] = [];
        const speeds: number[] = [];
        const deflectionX: number[] = [];
        const deflectionDecay: number[] = [];
        for (let j = 0; j < charCount; j++) {
          yPositions.push(j * fontSize);
          chars.push(charSet[Math.floor(Math.random() * charSet.length)]);
          speeds.push(charSpeedMin + Math.random() * (charSpeedMax - charSpeedMin));
          deflectionX.push(0);
          deflectionDecay.push(0.95 + Math.random() * 0.04);
        }
        columns.push({ x, originalX: x, yPositions, chars, speeds, deflectionX, deflectionDecay });
      }
      columnsRef.current = columns;
      ripplesRef.current = [];
      mouseIntensityRef.current = 0;
      flickerRef.current = 0;
      lastMouseRef.current = { x: null, y: null };
    },
    [density, fontSize, charSet, charSpeedMin, charSpeedMax]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse } = frame;
      const last = lastSizeRef.current;

      // Ensure pattern: rebuild columns if size changed
      if (width !== last.width || height !== last.height) {
        lastSizeRef.current = { width, height };
        const columnCount = Math.floor(width * density);
        const columnWidth = width / columnCount;
        const charCount = Math.floor(height / fontSize);
        const columns: Column[] = [];
        for (let i = 0; i < columnCount; i++) {
          const x = i * columnWidth + columnWidth / 2;
          const yPositions: number[] = [];
          const chars: string[] = [];
          const speeds: number[] = [];
          const deflectionX: number[] = [];
          const deflectionDecay: number[] = [];
          for (let j = 0; j < charCount; j++) {
            yPositions.push(j * fontSize);
            chars.push(charSet[Math.floor(Math.random() * charSet.length)]);
            speeds.push(charSpeedMin + Math.random() * (charSpeedMax - charSpeedMin));
            deflectionX.push(0);
            deflectionDecay.push(0.95 + Math.random() * 0.04);
          }
          columns.push({ x, originalX: x, yPositions, chars, speeds, deflectionX, deflectionDecay });
        }
        columnsRef.current = columns;
      }

      // Consume per-frame ripples
      for (const r of frame.ripples) {
        ripplesRef.current.push({ x: r.x, y: r.y, radius: 0, opacity: 0.8 });
      }

      ctx.clearRect(0, 0, width, height);

      // Update flicker
      flickerRef.current = (flickerRef.current + flickerSpeed) % (Math.PI * 2);
      const flickerIntensity = 0.7 + Math.sin(flickerRef.current) * 0.3;

      // Update mouse intensity
      if (mouse.x !== null && mouse.y !== null) {
        const lastX = lastMouseRef.current.x;
        const lastY = lastMouseRef.current.y;
        if (lastX !== null && lastY !== null && (mouse.x !== lastX || mouse.y !== lastY)) {
          const velocityX = mouse.x - lastX;
          const velocityY = mouse.y - lastY;
          const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
          mouseIntensityRef.current = Math.min(1.0, velocity / 8);
        }
        lastMouseRef.current = { x: mouse.x, y: mouse.y };
      } else {
        lastMouseRef.current = { x: null, y: null };
      }
      mouseIntensityRef.current *= 0.92;

      // Update ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += rippleGrowthRate;
        ripple.opacity -= rippleFadeRate;
        return ripple.opacity > 0;
      });

      // Draw ripples
      ctx.lineWidth = rippleLineWidth;
      ripplesRef.current.forEach((ripple) => {
        ctx.globalAlpha = ripple.opacity;
        ctx.strokeStyle = rippleColor;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = ripple.opacity * 0.5;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Draw data rain characters
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';

      columnsRef.current.forEach((column) => {
        const { originalX, yPositions, chars, speeds, deflectionX, deflectionDecay } = column;
        let columnChanged = false;

        for (let i = 0; i < yPositions.length; i++) {
          yPositions[i] += speeds[i];

          const distToMouse = Math.sqrt(
            Math.pow(originalX + deflectionX[i] - (mouse.x ?? -9999), 2) +
              Math.pow(yPositions[i] - (mouse.y ?? -9999), 2)
          );

          if (distToMouse < deflectionForce && mouseIntensityRef.current > 0.2) {
            const angle = Math.atan2(
              yPositions[i] - (mouse.y ?? -9999),
              originalX + deflectionX[i] - (mouse.x ?? -9999)
            );
            const force = (deflectionForce - distToMouse) / deflectionForce;
            deflectionX[i] += Math.cos(angle) * force * mouseIntensityRef.current * 2;
          }

          deflectionX[i] *= deflectionDecay[i];
          column.x = originalX + deflectionX[i];

          if (yPositions[i] > height + fontSize) {
            yPositions[i] = -fontSize;
            chars[i] = charSet[Math.floor(Math.random() * charSet.length)];
            speeds[i] = 0.5 + Math.random() * 2;
            deflectionX[i] = 0;
            columnChanged = true;
          }

          const isAffected = distToMouse < mouseGlowRadius && mouseIntensityRef.current > 0.1;

          if (Math.random() < (isAffected ? charChangeRate * 4 : charChangeRate)) {
            chars[i] = charSet[Math.floor(Math.random() * charSet.length)];
            columnChanged = true;
          }

          const trailIndex = Math.min(i, trailLength);
          const opacity = 1 - trailIndex / trailLength;
          const brightness = i === 0 ? 1 : 0.3 + 0.7 * opacity;
          const currentFlicker = i === 0 ? flickerIntensity : 1;
          const mouseEffect = isAffected
            ? (1 - Math.min(distToMouse / mouseGlowRadius, 1)) * mouseIntensityRef.current * 0.6
            : 0;

          const match = color.match(/\d+/g);
          const [r, g, b] = match ? match.map(Number) : [0, 255, 0];
          const finalColor = `rgba(${r}, ${g}, ${b}, ${opacity * brightness * currentFlicker + mouseEffect})`;
          ctx.fillStyle = finalColor;
          ctx.fillText(chars[i], column.x, yPositions[i]);

          if (i === 0 && opacity > 0.2) {
            ctx.strokeStyle = finalColor;
            ctx.beginPath();
            ctx.moveTo(column.x, yPositions[i] - fontSize * 0.8);
            ctx.lineTo(column.x, yPositions[i] - fontSize * 2.5);
            ctx.stroke();
          }
        }

        if (columnChanged && Math.random() < 0.1) {
          yPositions.unshift(-fontSize);
          chars.unshift(charSet[Math.floor(Math.random() * charSet.length)]);
          speeds.unshift(0.5 + Math.random() * 2);
          deflectionX.unshift(0);
          deflectionDecay.unshift(0.95 + Math.random() * 0.04);
          if (yPositions.length > trailLength * 2) {
            yPositions.pop();
            chars.pop();
            speeds.pop();
            deflectionX.pop();
            deflectionDecay.pop();
          }
        }
      });
    },
    [
      color,
      rippleColor,
      fontSize,
      fontFamily,
      density,
      flickerSpeed,
      trailLength,
      charSet,
      charChangeRate,
      deflectionForce,
      mouseGlowRadius,
      rippleGrowthRate,
      rippleFadeRate,
      rippleLineWidth,
      charSpeedMin,
      charSpeedMax,
    ]
  );

  return <BackgroundCanvas draw={draw} init={init} interactions={{ mouse: true, click: true }} className={className} />;
}
