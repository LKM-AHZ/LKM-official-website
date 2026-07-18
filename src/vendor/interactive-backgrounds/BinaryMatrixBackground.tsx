import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

const DEFAULT_CHAR_SET = ['0', '1'];

interface Column {
  x: number;
  yPositions: number[];
  chars: string[];
  speeds: number[];
}

interface LocalRipple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export interface BinaryMatrixBackgroundProps {
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
  rippleGrowthRate?: number;
  rippleFadeRate?: number;
  rippleLineWidth?: number;
  mouseAffectRadius?: number;
}

export default function BinaryMatrixBackground({
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
  rippleGrowthRate = 3,
  rippleFadeRate = 0.015,
  rippleLineWidth = 2,
  mouseAffectRadius = 200,
}: BinaryMatrixBackgroundProps) {
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
        for (let j = 0; j < charCount; j++) {
          yPositions.push(j * fontSize);
          chars.push(charSet[Math.floor(Math.random() * charSet.length)]);
          speeds.push(0.5 + Math.random() * 2);
        }
        columns.push({ x, yPositions, chars, speeds });
      }
      columnsRef.current = columns;
      ripplesRef.current = [];
      mouseIntensityRef.current = 0;
      flickerRef.current = 0;
      lastMouseRef.current = { x: null, y: null };
    },
    [density, fontSize, charSet]
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
          for (let j = 0; j < charCount; j++) {
            yPositions.push(j * fontSize);
            chars.push(charSet[Math.floor(Math.random() * charSet.length)]);
            speeds.push(0.5 + Math.random() * 2);
          }
          columns.push({ x, yPositions, chars, speeds });
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
      if (mouse.x !== lastMouseRef.current.x || mouse.y !== lastMouseRef.current.y) {
        mouseIntensityRef.current = 1.0;
      }
      lastMouseRef.current = { x: mouse.x, y: mouse.y };
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

      // Draw binary characters
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';

      columnsRef.current.forEach((column) => {
        const { x, yPositions, chars, speeds } = column;
        let columnChanged = false;

        const distToMouse = Math.sqrt(
          Math.pow(x - (mouse.x ?? -9999), 2) +
            Math.pow((yPositions[0] || 0) - (mouse.y ?? -9999), 2)
        );
        const isAffected = distToMouse < mouseAffectRadius && mouseIntensityRef.current > 0.1;

        for (let i = 0; i < yPositions.length; i++) {
          yPositions[i] += speeds[i];
          if (yPositions[i] > height + fontSize) {
            yPositions[i] = -fontSize;
            chars[i] = charSet[Math.floor(Math.random() * charSet.length)];
            speeds[i] = 0.5 + Math.random() * 2;
            columnChanged = true;
          }

          if (Math.random() < (isAffected ? charChangeRate * 3 : charChangeRate)) {
            chars[i] = charSet[Math.floor(Math.random() * charSet.length)];
            columnChanged = true;
          }

          const trailIndex = Math.min(i, trailLength);
          const opacity = 1 - trailIndex / trailLength;
          const brightness = i === 0 ? 1 : 0.3 + 0.7 * opacity;
          const currentFlicker = i === 0 ? flickerIntensity : 1;
          const mouseEffect = isAffected
            ? (1 - Math.min(distToMouse / 200, 1)) * mouseIntensityRef.current
            : 0;

          const match = color.match(/\d+/g);
          const [r, g, b] = match ? match.map(Number) : [0, 255, 0];
          const finalColor = `rgba(${r}, ${g}, ${b}, ${opacity * brightness * currentFlicker + mouseEffect})`;
          ctx.fillStyle = finalColor;
          ctx.fillText(chars[i], x, yPositions[i]);

          if (i === 0 && opacity > 0.2) {
            ctx.strokeStyle = finalColor;
            ctx.beginPath();
            ctx.moveTo(x, yPositions[i] - fontSize * 0.8);
            ctx.lineTo(x, yPositions[i] - fontSize * 2.5);
            ctx.stroke();
          }
        }

        if (columnChanged && Math.random() < 0.1) {
          yPositions.unshift(-fontSize);
          chars.unshift(charSet[Math.floor(Math.random() * charSet.length)]);
          speeds.unshift(0.5 + Math.random() * 2);
          if (yPositions.length > trailLength * 2) {
            yPositions.pop();
            chars.pop();
            speeds.pop();
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
      rippleGrowthRate,
      rippleFadeRate,
      rippleLineWidth,
      mouseAffectRadius,
    ]
  );

  return (
    <BackgroundCanvas
      draw={draw}
      init={init}
      interactions={{ mouse: true, click: true }}
      className={className}
    />
  );
}
