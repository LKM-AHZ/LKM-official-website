import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

export interface ConstellationFieldBackgroundProps {
  particleColor?: string;
  connectionColor?: string;
  particleCount?: number;
  maxDistance?: number;
  className?: string;
  constfill?: string;
  particleSpeed?: number;
  particleRadiusMin?: number;
  particleRadiusMax?: number;
  pulseMin?: number;
  pulseMax?: number;
  shootingStarChance?: number;
  shootingStarSpeedMin?: number;
  shootingStarSpeedMax?: number;
  shootingStarLengthMin?: number;
  shootingStarLengthMax?: number;
  shootingStarLineWidth?: number;
  shootingStarLifeDecay?: number;
  nameSpawnRate?: number;
  nameFadeRate?: number;
  trailMaxLength?: number;
  connectionLineWidth?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  trail: { x: number; y: number }[];
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
}

interface ConstellationName {
  x: number;
  y: number;
  name: string;
  opacity: number;
}

const NAMES = ['理科迷'];

export default function ConstellationFieldBackground({
  particleColor: propParticleColor,
  connectionColor: propConnectionColor,
  particleCount = 120,
  maxDistance = 120,
  className = '',
  constfill = 'white',
  particleSpeed = 0.6,
  particleRadiusMin = 0.5,
  particleRadiusMax = 1.7,
  pulseMin = 0.5,
  pulseMax = 2.0,
  shootingStarChance = 0.01,
  shootingStarSpeedMin = 2,
  shootingStarSpeedMax = 6,
  shootingStarLengthMin = 40,
  shootingStarLengthMax = 100,
  shootingStarLineWidth = 2,
  shootingStarLifeDecay = 0.01,
  nameSpawnRate = 0.002,
  nameFadeRate = 0.003,
  trailMaxLength = 20,
  connectionLineWidth = 1,
}: ConstellationFieldBackgroundProps) {
  const mode = useColorMode();
  const particleColor = propParticleColor || (mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)');
  const connectionColor = propConnectionColor || (mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)');

  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const constellationNamesRef = useRef<ConstellationName[]>([]);
  const lastSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const createParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * particleSpeed,
          vy: (Math.random() - 0.5) * particleSpeed,
          radius: Math.random() * (particleRadiusMax - particleRadiusMin) + particleRadiusMin,
          pulse: Math.random() * (pulseMax - pulseMin) + pulseMin,
          trail: [],
        });
      }
      return particles;
    },
    [particleCount, particleSpeed, particleRadiusMin, particleRadiusMax, pulseMin, pulseMax]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse, time } = frame;

      // 确保模式：resize 时重建粒子
      if (width !== lastSizeRef.current.width || height !== lastSizeRef.current.height) {
        lastSizeRef.current = { width, height };
        particlesRef.current = createParticles(width, height);
        shootingStarsRef.current = [];
        constellationNamesRef.current = [];
      }

      // 更新粒子
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * 0.1;
            p.vy += Math.sin(angle) * 0.1;
          }
        }

        if (mouse.isDown) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > trailMaxLength) p.trail.shift();
        } else {
          p.trail = [];
        }
      });

      // 更新流星
      if (Math.random() < shootingStarChance) {
        shootingStarsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.5,
          vx: -Math.random() * (shootingStarSpeedMax - shootingStarSpeedMin) - shootingStarSpeedMin,
          vy: Math.random() * (shootingStarSpeedMax - shootingStarSpeedMin) - shootingStarSpeedMin,
          length: Math.random() * (shootingStarLengthMax - shootingStarLengthMin) + shootingStarLengthMin,
          life: 1,
        });
      }
      shootingStarsRef.current = shootingStarsRef.current.filter((s) => s.life > 0);
      shootingStarsRef.current.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= shootingStarLifeDecay;
      });

      // 更新星座名称
      if (Math.random() < nameSpawnRate) {
        constellationNamesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.8 + 50,
          name: NAMES[Math.floor(Math.random() * NAMES.length)],
          opacity: 1,
        });
      }
      constellationNamesRef.current = constellationNamesRef.current.filter((n) => n.opacity > 0);
      constellationNamesRef.current.forEach((n) => {
        n.opacity -= nameFadeRate;
      });

      // 绘制
      ctx.clearRect(0, 0, width, height);

      // 粒子
      particlesRef.current.forEach((p) => {
        const pulseRadius = p.radius + Math.sin(time * 2 + p.pulse) * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = particleColor.replace(/\d?\.\d+(?=\))/, '0.1');
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // 连接线
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < maxDistance) {
            const opacity = (maxDistance - distance) / maxDistance;
            ctx.strokeStyle = connectionColor.replace(/\d?\.\d+(?=\))/, opacity.toFixed(2));
            ctx.lineWidth = connectionLineWidth;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 流星
      shootingStarsRef.current.forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.length, s.y + s.length * 0.2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = shootingStarLineWidth;
        ctx.stroke();
      });

      // 星座名称
      ctx.font = '19px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillStyle = constfill;
      constellationNamesRef.current.forEach((n) => {
        ctx.globalAlpha = n.opacity;
        ctx.fillText(n.name, n.x, n.y);
      });
      ctx.globalAlpha = 1;
    },
    [
      createParticles,
      maxDistance,
      particleColor,
      connectionColor,
      constfill,
      shootingStarChance,
      shootingStarSpeedMin,
      shootingStarSpeedMax,
      shootingStarLengthMin,
      shootingStarLengthMax,
      shootingStarLineWidth,
      shootingStarLifeDecay,
      nameSpawnRate,
      nameFadeRate,
      trailMaxLength,
      connectionLineWidth,
    ]
  );

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      lastSizeRef.current = { width: frame.width, height: frame.height };
      particlesRef.current = createParticles(frame.width, frame.height);
    },
    [createParticles]
  );

  return <BackgroundCanvas draw={draw} init={init} interactions={{ mouse: true }} className={className} />;
}
