import { useCallback, useRef } from 'react';
import { BackgroundCanvas } from '~/components/background/BackgroundCanvas';
import type { BackgroundFrame } from '~/components/background/useBackgroundCanvas';
import { useColorMode } from './useColorMode';

export interface OrbitClusterBackgroundProps {
  clusterCount?: number;
  particlesPerCluster?: number;
  color?: string;
  className?: string;
  orbitDistanceMin?: number;
  orbitDistanceMax?: number;
  orbitSpeedMin?: number;
  orbitSpeedMax?: number;
  particleSizeMin?: number;
  particleSizeMax?: number;
  parallaxMultiplier?: number;
  gravityWarpStrength?: number;
  gravityWarpDecay?: number;
}

interface Particle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  opacity: number;
  depth: number;
}

interface Cluster {
  x: number;
  y: number;
  particles: Particle[];
}

interface GravityWarp {
  x: number;
  y: number;
  strength: number;
  active: boolean;
}

export default function OrbitClusterBackground({
  clusterCount = 6,
  particlesPerCluster = 25,
  color: propColor,
  className = '',
  orbitDistanceMin = 20,
  orbitDistanceMax = 80,
  orbitSpeedMin = 0.001,
  orbitSpeedMax = 0.004,
  particleSizeMin = 0.8,
  particleSizeMax = 2.5,
  parallaxMultiplier = 0.001,
  gravityWarpStrength = 20,
  gravityWarpDecay = 0.9,
}: OrbitClusterBackgroundProps) {
  const mode = useColorMode();
  const color = propColor || (mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)');
  const clustersRef = useRef<Cluster[]>([]);
  const gravityWarpRef = useRef<GravityWarp | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const generateClusters = useCallback(
    (width: number, height: number) => {
      const clusters: Cluster[] = [];
      for (let i = 0; i < clusterCount; i++) {
        const cluster: Cluster = {
          x: Math.random() * width,
          y: Math.random() * height,
          particles: [],
        };
        for (let j = 0; j < particlesPerCluster; j++) {
          cluster.particles.push({
            angle: Math.random() * Math.PI * 2,
            distance: orbitDistanceMin + Math.random() * (orbitDistanceMax - orbitDistanceMin),
            speed: orbitSpeedMin + Math.random() * (orbitSpeedMax - orbitSpeedMin),
            size: particleSizeMin + Math.random() * (particleSizeMax - particleSizeMin),
            opacity: 0.4 + Math.random() * 0.6,
            depth: 0.5 + Math.random() * 0.5,
          });
        }
        clusters.push(cluster);
      }
      return clusters;
    },
    [
      clusterCount,
      particlesPerCluster,
      orbitDistanceMin,
      orbitDistanceMax,
      orbitSpeedMin,
      orbitSpeedMax,
      particleSizeMin,
      particleSizeMax,
    ]
  );

  const draw = useCallback(
    (frame: BackgroundFrame) => {
      const { ctx, width, height, mouse } = frame;

      // Ensure pattern: rebuild clusters on resize
      if (width !== lastSizeRef.current.width || height !== lastSizeRef.current.height) {
        lastSizeRef.current = { width, height };
        clustersRef.current = generateClusters(width, height);
      }

      // Consume click ripples as gravity warps
      for (const r of frame.ripples) {
        gravityWarpRef.current = {
          x: r.x,
          y: r.y,
          strength: gravityWarpStrength,
          active: true,
        };
      }

      ctx.clearRect(0, 0, width, height);

      const mouseX = mouse.x ?? width / 2;
      const mouseY = mouse.y ?? height / 2;

      clustersRef.current.forEach((cluster) => {
        cluster.particles.forEach((p) => {
          p.angle += p.speed;

          let dX = Math.cos(p.angle) * p.distance;
          let dY = Math.sin(p.angle) * p.distance;

          if (gravityWarpRef.current?.active) {
            const dx = gravityWarpRef.current.x - cluster.x;
            const dy = gravityWarpRef.current.y - cluster.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const gravity = Math.min(gravityWarpRef.current.strength / (dist + 20), 5);
            dX += dx * gravity * 0.02;
            dY += dy * gravity * 0.02;
          }

          const offsetX = (mouseX - width / 2) * parallaxMultiplier * p.depth;
          const offsetY = (mouseY - height / 2) * parallaxMultiplier * p.depth;

          const x = cluster.x + dX + offsetX * 100;
          const y = cluster.y + dY + offsetY * 100;

          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(/[\d.]+(?=\))/, p.opacity.toFixed(2));
          ctx.fill();
        });
      });

      if (gravityWarpRef.current?.active) {
        gravityWarpRef.current.strength *= gravityWarpDecay;
        if (gravityWarpRef.current.strength < 0.05) {
          gravityWarpRef.current.active = false;
        }
      }
    },
    [color, generateClusters, parallaxMultiplier, gravityWarpStrength, gravityWarpDecay]
  );

  const init = useCallback(
    (_canvas: HTMLCanvasElement, frame: BackgroundFrame) => {
      lastSizeRef.current = { width: frame.width, height: frame.height };
      clustersRef.current = generateClusters(frame.width, frame.height);
    },
    [generateClusters]
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
