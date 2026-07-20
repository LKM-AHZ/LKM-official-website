import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

export interface ParticlesBackgroundProps {
  particleCount?: number | null;
  mouseRadius?: number;
  particleColor?: string;
  connectionColor?: string;
  rippleColor?: string;
  className?: string;
  particleSizeMin?: number;
  particleSizeMax?: number;
  particleSpeedMultiplier?: number;
  connectionDistance?: number;
  connectionOpacityMultiplier?: number;
  rippleMaxRadius?: number;
  rippleGrowthRate?: number;
  rippleLineWidth?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  randomSpeed: number;
  randomDirection: number;
  randomOffset: number;
  baseX: number;
  baseY: number;
  shooting: boolean;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  growing: boolean;
}

<<<<<<< HEAD
=======
const QUALITY_MULTIPLIER = { high: 1, medium: 0.68, low: 0.4 } as const;
const BASE_FRAME_RATE = 60;

function withAlpha(color: string, alpha: number) {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const hex = color.match(/^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
  if (hex) {
    const expanded = hex.length <= 4 ? [...hex].map((value) => value + value).join('') : hex;
    const rgb = expanded.slice(0, 6);
    const sourceAlpha = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1;
    const red = parseInt(rgb.slice(0, 2), 16);
    const green = parseInt(rgb.slice(2, 4), 16);
    const blue = parseInt(rgb.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha * sourceAlpha})`;
  }

  const functional = color.match(/^rgba?\(([^)]+)\)$/i)?.[1]?.split(',').map((value) => value.trim());
  if (functional && functional.length >= 3) {
    const sourceAlpha = functional.length === 4 ? Number(functional[3]) : 1;
    return `rgba(${functional[0]}, ${functional[1]}, ${functional[2]}, ${clampedAlpha * sourceAlpha})`;
  }

  return color;
}

>>>>>>> 2764c34 (333)
export default function ParticlesBackground({
  particleCount = null,
  mouseRadius = 150,
  particleColor: propParticleColor,
  connectionColor: propConnectionColor,
  rippleColor: propRippleColor,
  className = '',
  particleSizeMin = 0.5,
  particleSizeMax = 3,
  particleSpeedMultiplier = 1,
  connectionDistance = 120,
  connectionOpacityMultiplier = 0.3,
  rippleMaxRadius = 150,
  rippleGrowthRate = 3,
  rippleLineWidth = 2,
}: ParticlesBackgroundProps) {
  const mode = useColorMode();
  const particleColor = propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)');
  const connectionColor = propConnectionColor || (mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)');
  const rippleColor = propRippleColor || (mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)');

  const particlesRef = useRef<Particle[]>([]);
  const backgroundRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const createParticles = useCallback(
<<<<<<< HEAD
    (width: number, height: number) => {
      const count = particleCount || Math.floor((width * height) / 8000);
=======
    (width: number, height: number, multiplier: number) => {
      const baseCount = particleCount || Math.floor((width * height) / 8000);
      const count = Math.max(1, Math.floor(baseCount * multiplier));
>>>>>>> 2764c34 (333)
      const particles: Particle[] = [];
      const background: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const isShooter = Math.random() < 0.05;
        const radius = isShooter ? particleSizeMin : particleSizeMin + Math.random() * (particleSizeMax - particleSizeMin);
        const vx = (Math.random() - 0.5) * (isShooter ? 2 * particleSpeedMultiplier : 0.5 * particleSpeedMultiplier);
        const vy = (Math.random() - 0.5) * (isShooter ? 2 * particleSpeedMultiplier : 0.5 * particleSpeedMultiplier);
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx,
          vy,
          radius,
          opacity: Math.random() * 0.5 + 0.3,
          randomSpeed: Math.random() * 0.5 + 0.2,
          randomDirection: Math.random() * Math.PI * 2,
          randomOffset: Math.random() * 1000,
          baseX: 0,
          baseY: 0,
          shooting: isShooter,
        });
      }

<<<<<<< HEAD
      // Parallax background layer
      for (let i = 0; i < count * 0.3; i++) {
=======
      // Parallax background layer scales down again from the quality-adjusted primary count.
      const backgroundCount = Math.floor(count * 0.3 * multiplier);
      for (let i = 0; i < backgroundCount; i++) {
>>>>>>> 2764c34 (333)
        background.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
          radius: Math.random() * (particleSizeMax * 0.5),
          opacity: Math.random() * 0.3,
          randomSpeed: 0,
          randomDirection: 0,
          randomOffset: 0,
          baseX: 0,
          baseY: 0,
          shooting: false,
        });
      }

      return { particles, background };
    },
    [particleCount, particleSizeMin, particleSizeMax, particleSpeedMultiplier]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
<<<<<<< HEAD
      const { ctx, width, height, mouse, time } = frame;
=======
      const { ctx, width, height, mouse, time, delta, performance } = frame;
      const multiplier = QUALITY_MULTIPLIER[performance.quality];
      const motionStep = delta * BASE_FRAME_RATE;
      const motionScale = performance.reducedMotion ? 0.05 : motionStep;
      const scaledMouseRadius = mouseRadius * multiplier;
      const scaledConnectionDistance = connectionDistance * multiplier;
      const scaledConnectionOpacity = connectionOpacityMultiplier * multiplier;
      const scaledRippleLineWidth = rippleLineWidth * multiplier;
>>>>>>> 2764c34 (333)

      // Ensure pattern: rebuild particles on resize
      if (width !== lastSizeRef.current.width || height !== lastSizeRef.current.height) {
        lastSizeRef.current = { width, height };
<<<<<<< HEAD
        const { particles, background } = createParticles(width, height);
=======
        const { particles, background } = createParticles(width, height, multiplier);
>>>>>>> 2764c34 (333)
        particlesRef.current = particles;
        backgroundRef.current = background;
      }

      // Consume per-frame ripples
      for (const r of frame.ripples) {
        ripplesRef.current.push({
          x: r.x,
          y: r.y,
          radius: 0,
          maxRadius: rippleMaxRadius,
          opacity: 1,
          growing: true,
        });
      }

      // Update particles
      particlesRef.current.forEach((particle) => {
        if (particle.baseX === 0 && particle.baseY === 0) {
          particle.baseX = particle.x;
          particle.baseY = particle.y;
        }

        const randomX = Math.sin(time * particle.randomSpeed + particle.randomOffset) * 20;
        const randomY = Math.cos(time * particle.randomSpeed * 0.8 + particle.randomOffset) * 15;
        const driftX = Math.cos(particle.randomDirection + time * 0.1) * 0.3;
        const driftY = Math.sin(particle.randomDirection + time * 0.1) * 0.3;

<<<<<<< HEAD
        particle.vx += driftX * 0.01 + randomX * 0.001;
        particle.vy += driftY * 0.01 + randomY * 0.001;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouseRadius) {
            const force = (mouseRadius - distance) / mouseRadius;
            particle.vx += dx * force * 0.008 * particleSpeedMultiplier;
            particle.vy += dy * force * 0.008 * particleSpeedMultiplier;
          }
        }

        ripplesRef.current.forEach((ripple) => {
          const rippleDx = particle.x - ripple.x;
          const rippleDy = particle.y - ripple.y;
          const rippleDistance = Math.sqrt(rippleDx * rippleDx + rippleDy * rippleDy);
          if (rippleDistance < ripple.radius + 20 && rippleDistance > ripple.radius - 20) {
            const rippleForce = ripple.opacity * 0.8;
            particle.vx += (rippleDx / rippleDistance) * rippleForce;
            particle.vy += (rippleDy / rippleDistance) * rippleForce;
          }
        });

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.985;
        particle.vy *= 0.985;
=======
        if (!performance.reducedMotion) {
          particle.vx += (driftX * 0.01 + randomX * 0.001) * motionStep;
          particle.vy += (driftY * 0.01 + randomY * 0.001) * motionStep;

          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - particle.x;
            const dy = mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < scaledMouseRadius) {
              const force = (scaledMouseRadius - distance) / scaledMouseRadius;
              particle.vx += dx * force * 0.008 * particleSpeedMultiplier * multiplier * motionStep;
              particle.vy += dy * force * 0.008 * particleSpeedMultiplier * multiplier * motionStep;
            }
          }

          ripplesRef.current.forEach((ripple) => {
            const rippleDx = particle.x - ripple.x;
            const rippleDy = particle.y - ripple.y;
            const rippleDistance = Math.sqrt(rippleDx * rippleDx + rippleDy * rippleDy);
            if (rippleDistance < ripple.radius + 20 && rippleDistance > ripple.radius - 20) {
              const rippleForce = ripple.opacity * 0.8 * multiplier;
              particle.vx += (rippleDx / rippleDistance) * rippleForce * motionStep;
              particle.vy += (rippleDy / rippleDistance) * rippleForce * motionStep;
            }
          });
        }

        particle.x += particle.vx * motionScale;
        particle.y += particle.vy * motionScale;
        particle.vx *= Math.pow(0.985, motionStep);
        particle.vy *= Math.pow(0.985, motionStep);
>>>>>>> 2764c34 (333)

        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -0.3;
          particle.x = Math.max(0, Math.min(width, particle.x));
        }
        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -0.3;
          particle.y = Math.max(0, Math.min(height, particle.y));
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const centerDistance = Math.sqrt(Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2));
        const maxDistance = Math.min(width, height) * 0.4;
        if (centerDistance > maxDistance) {
<<<<<<< HEAD
          const returnForce = ((centerDistance - maxDistance) / centerDistance) * 0.001 * particleSpeedMultiplier;
=======
          const returnForce =
            ((centerDistance - maxDistance) / centerDistance) * 0.001 * particleSpeedMultiplier * motionStep;
>>>>>>> 2764c34 (333)
          particle.vx += (centerX - particle.x) * returnForce;
          particle.vy += (centerY - particle.y) * returnForce;
        }

<<<<<<< HEAD
        particle.opacity += Math.sin(time * 2 + particle.randomOffset) * 0.002;
=======
        particle.opacity += Math.sin(time * 2 + particle.randomOffset) * 0.002 * motionScale;
>>>>>>> 2764c34 (333)
        particle.opacity = Math.max(0.1, Math.min(0.8, particle.opacity));
      });

      // Update ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        if (ripple.growing) {
<<<<<<< HEAD
          ripple.radius += rippleGrowthRate;
=======
          ripple.radius += rippleGrowthRate * motionScale;
>>>>>>> 2764c34 (333)
          ripple.opacity = 1 - ripple.radius / ripple.maxRadius;
          if (ripple.radius >= ripple.maxRadius) ripple.growing = false;
          return true;
        }
        return false;
      });

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Background particles
      backgroundRef.current.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
<<<<<<< HEAD
        ctx.fillStyle = particleColor.replace(/([\d.]+)(?=\))/, (particle.opacity * 0.5).toString());
=======
        ctx.fillStyle = withAlpha(particleColor, particle.opacity * 0.5 * multiplier);
>>>>>>> 2764c34 (333)
        ctx.fill();
      });

      // Connections
      ctx.lineWidth = 1;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x;
          const dy = particlesRef.current[i].y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
<<<<<<< HEAD
          if (distance < connectionDistance) {
            const opacity = ((connectionDistance - distance) / connectionDistance) * connectionOpacityMultiplier;
            ctx.strokeStyle = connectionColor.replace(/([\d.]+)(?=\))/, opacity.toString());
=======
          if (distance < scaledConnectionDistance) {
            const opacity =
              ((scaledConnectionDistance - distance) / scaledConnectionDistance) * scaledConnectionOpacity;
            ctx.strokeStyle = withAlpha(connectionColor, opacity);
>>>>>>> 2764c34 (333)
            ctx.beginPath();
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.stroke();
          }
        }
      }

      // Particles
      particlesRef.current.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
<<<<<<< HEAD
        ctx.fillStyle = particleColor.replace(/([\d.]+)(?=\))/, particle.opacity.toString());
=======
        ctx.fillStyle = withAlpha(particleColor, particle.opacity * multiplier);
>>>>>>> 2764c34 (333)
        ctx.fill();

        if (particle.shooting) {
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.vx * 8, particle.y - particle.vy * 8);
          ctx.lineTo(particle.x, particle.y);
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Ripples
      ripplesRef.current.forEach((ripple) => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
<<<<<<< HEAD
        ctx.strokeStyle = rippleColor.replace(/([\d.]+)(?=\))/, (ripple.opacity * 0.8).toString());
        ctx.lineWidth = rippleLineWidth;
=======
        ctx.strokeStyle = withAlpha(rippleColor, ripple.opacity * 0.8 * multiplier);
        ctx.lineWidth = scaledRippleLineWidth;
>>>>>>> 2764c34 (333)
        ctx.stroke();
      });
    },
    [
      createParticles,
      mouseRadius,
      particleColor,
      connectionColor,
      rippleColor,
      particleSpeedMultiplier,
      connectionDistance,
      connectionOpacityMultiplier,
      rippleMaxRadius,
      rippleGrowthRate,
      rippleLineWidth,
    ]
  );

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      lastSizeRef.current = { width: frame.width, height: frame.height };
<<<<<<< HEAD
      const { particles, background } = createParticles(frame.width, frame.height);
=======
      const { particles, background } = createParticles(
        frame.width,
        frame.height,
        QUALITY_MULTIPLIER[frame.performance.quality]
      );
>>>>>>> 2764c34 (333)
      particlesRef.current = particles;
      backgroundRef.current = background;
    },
    [createParticles]
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
