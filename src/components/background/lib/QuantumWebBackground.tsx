import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

type Range = [number, number];

export interface QuantumWebBackgroundProps {
  quantumColor?: string;
  normalColor?: string;
  backgroundColor?: string;
  labelColor?: string;
  labelBg?: string;
  densityDivisor?: number;
  velocityMultiplier?: number;
  speedRange?: Range;
  phaseNoise?: number;
  velocityDamping?: number;
  quantumRadiusRange?: Range;
  normalRadiusRange?: Range;
  opacityRange?: Range;
  trailMaxRange?: [number, number];
  mouseRadius?: number;
  attractionForceFactor?: number;
  repulsionForceFactor?: number;
  connectionDistance?: number;
  connectionBaseOpacity?: number;
  connectionPulseRate?: number;
  connectionStrengthRange?: Range;
  connectionLineWidth?: number;
  glowMultiplier?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  baseColor: string;
  trail: { x: number; y: number }[];
  maxTrail: number;
  isQuantum: boolean;
  phase: number;
  speed: number;
  lastX: number;
  lastY: number;
}

interface Connection {
  p1: Particle;
  p2: Particle;
  distance: number;
  opacity: number;
  strength: number;
}

const QUALITY_MULTIPLIER = { high: 1, medium: 0.68, low: 0.4 } as const;
const BASE_FRAME_RATE = 60;

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;

export default function QuantumWebBackground({
  quantumColor: propQuantumColor,
  normalColor: propNormalColor,
  backgroundColor: _backgroundColor,
  labelColor: _labelColor,
  labelBg: _labelBg,
  densityDivisor = 5000,
  velocityMultiplier = 0.5,
  speedRange = [0.01, 0.05],
  phaseNoise = 0.01,
  velocityDamping = 0.98,
  quantumRadiusRange = [1, 3],
  normalRadiusRange = [0.5, 2],
  opacityRange = [0.2, 0.6],
  trailMaxRange = [5, 15],
  mouseRadius = 150,
  attractionForceFactor = 0.01,
  repulsionForceFactor = 0.05,
  connectionDistance = 150,
  connectionBaseOpacity = 0.7,
  connectionPulseRate = 3,
  connectionStrengthRange = [0.01, 0.06],
  connectionLineWidth = 1,
  glowMultiplier = 3,
}: QuantumWebBackgroundProps) {
  const mode = useColorMode();
  const quantumColor = propQuantumColor || (mode === 'dark' ? '#7f5af0' : '#3f2d78');
  const normalColor = propNormalColor || (mode === 'dark' ? '#2cb67d' : '#165b3e');

  const particlesRef = useRef<Particle[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const connectionFrameRef = useRef(0);
  const lastSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const lastQualityRef = useRef<BackgroundFrame['performance']['quality'] | null>(null);

  const createParticles = useCallback(
    (width: number, height: number, multiplier: number) => {
      const particles: Particle[] = [];
      const particleCount = Math.max(10, Math.floor(((width * height) / densityDivisor) * multiplier));
      const maxTrailMultiplier = Math.max(multiplier, 0.2);
      for (let i = 0; i < particleCount; i++) {
        const isQuantum = Math.random() > 0.85;
        const radius = isQuantum
          ? randRange(quantumRadiusRange[0], quantumRadiusRange[1])
          : randRange(normalRadiusRange[0], normalRadiusRange[1]);
        const opacity = randRange(opacityRange[0], opacityRange[1]);
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * velocityMultiplier,
          vy: (Math.random() - 0.5) * velocityMultiplier,
          radius,
          opacity,
          baseColor: isQuantum ? quantumColor : normalColor,
          trail: [],
          maxTrail: Math.max(1, Math.floor(randRange(trailMaxRange[0], trailMaxRange[1]) * maxTrailMultiplier)),
          isQuantum,
          phase: Math.random() * Math.PI * 2,
          speed: randRange(speedRange[0], speedRange[1]),
          lastX: 0,
          lastY: 0,
        });
      }
      return particles;
    },
    [
      densityDivisor,
      velocityMultiplier,
      quantumRadiusRange,
      normalRadiusRange,
      opacityRange,
      trailMaxRange,
      quantumColor,
      normalColor,
      speedRange,
    ]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse, time, keys, delta, performance } = frame;
      const { quality, reducedMotion } = performance;
      const multiplier = QUALITY_MULTIPLIER[quality];
      const motionStep = delta * BASE_FRAME_RATE;
      const motionScale = reducedMotion ? 0.05 : motionStep;
      const scaledMouseRadius = mouseRadius * multiplier;
      const scaledAttractionForce = attractionForceFactor * multiplier;
      const scaledRepulsionForce = repulsionForceFactor * multiplier;
      const scaledConnectionDistance = connectionDistance * multiplier;
      const scaledGlowMultiplier = glowMultiplier * multiplier;

      // Rebuild quality-dependent resources on resize or quality changes.
      if (
        width !== lastSizeRef.current.width ||
        height !== lastSizeRef.current.height ||
        quality !== lastQualityRef.current
      ) {
        lastSizeRef.current = { width, height };
        lastQualityRef.current = quality;
        particlesRef.current = createParticles(width, height, multiplier);
        connectionsRef.current = [];
        connectionFrameRef.current = 0;
      }

      const particles = particlesRef.current;

      // Update particles
      particles.forEach((particle) => {
        if (reducedMotion) {
          particle.phase += particle.speed * motionScale;
          return;
        }

        particle.lastX = particle.x;
        particle.lastY = particle.y;

        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > particle.maxTrail) {
          particle.trail.shift();
        }

        particle.phase += particle.speed * motionStep;
        particle.vx += Math.sin(particle.phase) * phaseNoise * motionStep;
        particle.vy += Math.cos(particle.phase) * phaseNoise * motionStep;
        particle.vx *= Math.pow(velocityDamping, motionStep);
        particle.vy *= Math.pow(velocityDamping, motionStep);

        if (mouse.x !== null && mouse.y !== null) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < scaledMouseRadius) {
            const force = (scaledMouseRadius - distance) / scaledMouseRadius;
            const angle = Math.atan2(dy, dx);
            const tx = mouse.x + Math.cos(angle) * scaledMouseRadius;
            const ty = mouse.y + Math.sin(angle) * scaledMouseRadius;
            if (keys.shift) {
              particle.vx += (mouse.x - particle.x) * force * scaledAttractionForce * motionStep;
              particle.vy += (mouse.y - particle.y) * force * scaledAttractionForce * motionStep;
            } else {
              particle.vx += (particle.x - tx) * force * scaledRepulsionForce * motionStep;
              particle.vy += (particle.y - ty) * force * scaledRepulsionForce * motionStep;
            }
          }
        }

        if (particle.x < -particle.radius) particle.x = width + particle.radius;
        if (particle.x > width + particle.radius) particle.x = -particle.radius;
        if (particle.y < -particle.radius) particle.y = height + particle.radius;
        if (particle.y > height + particle.radius) particle.y = -particle.radius;

        particle.x += particle.vx * motionScale;
        particle.y += particle.vy * motionScale;
      });

      // Low quality reuses the previous connection set between updates.
      connectionFrameRef.current += 1;
      const shouldUpdateConnections =
        connectionFrameRef.current === 1 || quality !== 'low' || connectionFrameRef.current % 3 === 0;
      if (shouldUpdateConnections) {
        const newConnections: Connection[] = [];
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < scaledConnectionDistance) {
              const opacity = connectionBaseOpacity * multiplier * (1 - distance / scaledConnectionDistance);
              const pulse = reducedMotion ? 1 : Math.sin(time * connectionPulseRate) * 0.3 + 0.7;
              newConnections.push({
                p1,
                p2,
                distance,
                opacity: opacity * pulse,
                strength: randRange(connectionStrengthRange[0], connectionStrengthRange[1]),
              });
            }
          }
        }
        connectionsRef.current = newConnections;
      }

      // Render
      ctx.clearRect(0, 0, width, height);

      // Draw particle trails
      particles.forEach((particle) => {
        if (particle.trail.length > 1) {
          const velocity = Math.sqrt(
            Math.pow(particle.x - particle.lastX, 2) + Math.pow(particle.y - particle.lastY, 2)
          );
          const trailIntensity = Math.min(velocity * 20, 1);
          if (trailIntensity > 0.05) {
            ctx.beginPath();
            ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
            for (let i = 1; i < particle.trail.length; i++) {
              ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
            }
            const gradient = ctx.createLinearGradient(particle.trail[0].x, particle.trail[0].y, particle.x, particle.y);
            gradient.addColorStop(0, `${particle.baseColor}00`);
            gradient.addColorStop(
              1,
              `${particle.baseColor}${Math.floor(trailIntensity * 80)
                .toString(16)
                .padStart(2, '0')}`
            );
            ctx.strokeStyle = gradient;
            ctx.lineWidth = particle.isQuantum ? 1.5 : 1;
            ctx.stroke();
          }
        }
      });

      // Draw connections with entanglement effect
      connectionsRef.current.forEach((connection) => {
        const { p1, p2 } = connection;
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, p1.isQuantum ? quantumColor : normalColor);
        gradient.addColorStop(1, p2.isQuantum ? quantumColor : normalColor);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = gradient;
        ctx.globalAlpha = connection.opacity;
        ctx.lineWidth = connectionLineWidth;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw particles
      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.baseColor;
        ctx.fill();

        // Glow effect for quantum particles
        if (particle.isQuantum) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius * scaledGlowMultiplier, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.radius * scaledGlowMultiplier
          );
          gradient.addColorStop(0, `${particle.baseColor}80`);
          gradient.addColorStop(1, `${particle.baseColor}00`);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });
    },
    [
      createParticles,
      phaseNoise,
      velocityDamping,
      mouseRadius,
      attractionForceFactor,
      repulsionForceFactor,
      connectionDistance,
      connectionBaseOpacity,
      connectionPulseRate,
      connectionStrengthRange,
      connectionLineWidth,
      glowMultiplier,
      quantumColor,
      normalColor,
    ]
  );

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      lastSizeRef.current = { width: frame.width, height: frame.height };
      particlesRef.current = createParticles(frame.width, frame.height, QUALITY_MULTIPLIER[frame.performance.quality]);
      connectionsRef.current = [];
      connectionFrameRef.current = 0;
    },
    [createParticles]
  );

  return <BackgroundCanvas draw={draw} init={init} interactions={{ mouse: true, keys: true }} />;
}
