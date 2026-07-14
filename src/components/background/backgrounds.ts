import type { ComponentType } from 'react';

import AuroraBackground from '~/vendor/interactive-backgrounds/AuroraBackground';
import BinaryMatrixBackground from '~/vendor/interactive-backgrounds/BinaryMatrixBackground';
import ConstellationFieldBackground from '~/vendor/interactive-backgrounds/ConstellationFieldBackground';
import DataRainBackground from '~/vendor/interactive-backgrounds/DataRainBackground';
import DNASparkBackground from '~/vendor/interactive-backgrounds/DNASparkBackground';
import DNASparkBackground3D from '~/vendor/interactive-backgrounds/DNASparkBackground3D';
import DreamyHaloBackground from '~/vendor/interactive-backgrounds/DreamyHaloBackground';
import FluidSmokeFlowBackground from '~/vendor/interactive-backgrounds/FluidSmokeFlowBackground';

import OrbitClusterBackground from '~/vendor/interactive-backgrounds/OrbitClusterBackground';
import ParticlesBackground from '~/vendor/interactive-backgrounds/ParticlesBackground';
import QuantumWebBackground from '~/vendor/interactive-backgrounds/QuantumWebBackground';
import TextParticlesBackground from '~/vendor/interactive-backgrounds/TextParticlesBackground';

export type ThemeMode = 'dark' | 'light' | 'both';

export interface BackgroundMeta {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  icon: string;
  /** Which theme this background is suitable for. 'dark' hides in light, 'light' hides in dark, 'both' always visible. */
  theme: ThemeMode;
  /** Color props for dark mode. Passed directly to the component as spread props. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  darkProps?: Record<string, any>;
  /** Color props for light mode. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lightProps?: Record<string, any>;
}

export type BackgroundId =
  | 'aurora'
  | 'binary-matrix'
  | 'constellation-field'
  | 'data-rain'
  | 'dna-spark'
  | 'dna-spark-3d'
  | 'dreamy-halo'
  | 'fluid-smoke-flow'

  | 'orbit-cluster'
  | 'particles'
  | 'quantum-web'
  | 'text-particles';

export const DEFAULT_BACKGROUND: BackgroundId = 'aurora';

export const BACKGROUNDS: BackgroundMeta[] = [
  {
    id: 'aurora',
    name: '极光',
    component: AuroraBackground,
    icon: '🌈',
    theme: 'both',
    darkProps: { rippleColor: '#818cf8' },
    lightProps: { rippleColor: '#f59e0b' },
  },
  {
    id: 'binary-matrix',
    name: '数字雨',
    component: BinaryMatrixBackground,
    icon: '🔢',
    theme: 'dark',
    darkProps: { color: 'rgba(0,255,65,0.8)', rippleColor: 'rgba(0,255,65,0.5)' },
  },
  {
    id: 'constellation-field',
    name: '星座',
    component: ConstellationFieldBackground,
    icon: '✨',
    theme: 'both',
    darkProps: { particleColor: '#5e6ad2', connectionColor: '#818cf8' },
    lightProps: { particleColor: '#f59e0b', connectionColor: '#fbbf24' },
  },
  {
    id: 'data-rain',
    name: '数据雨',
    component: DataRainBackground,
    icon: '💧',
    theme: 'dark',
    darkProps: { color: 'rgba(0,255,65,0.8)', rippleColor: 'rgba(0,255,65,0.5)' },
  },
  {
    id: 'dna-spark',
    name: 'DNA火花',
    component: DNASparkBackground,
    icon: '🧬',
    theme: 'dark',
    darkProps: { sparkColor: '#5e6ad2', strandColor: '#818cf8' },
  },
  {
    id: 'dna-spark-3d',
    name: 'DNA 3D',
    component: DNASparkBackground3D,
    icon: '🧬',
    theme: 'dark',
    darkProps: { sparkColor: '#5e6ad2', strandColor: '#818cf8' },
  },
  {
    id: 'dreamy-halo',
    name: '梦幻光晕',
    component: DreamyHaloBackground,
    icon: '💫',
    theme: 'light',
    lightProps: { baseHue: 40, saturation: 80, lightness: 55 },
  },
  {
    id: 'fluid-smoke-flow',
    name: '烟雾流动',
    component: FluidSmokeFlowBackground,
    icon: '💨',
    theme: 'dark',
    darkProps: { particleColor: '#5e6ad2' },
  },

  {
    id: 'orbit-cluster',
    name: '轨道集群',
    component: OrbitClusterBackground,
    icon: '🪐',
    theme: 'dark',
    darkProps: { color: '#5e6ad2' },
  },
  {
    id: 'particles',
    name: '粒子',
    component: ParticlesBackground,
    icon: '⚛',
    theme: 'both',
    darkProps: { particleColor: '#5e6ad2', connectionColor: '#818cf8', rippleColor: '#818cf8' },
    lightProps: { particleColor: '#f59e0b', connectionColor: '#fbbf24', rippleColor: '#fbbf24' },
  },
  {
    id: 'quantum-web',
    name: '量子网',
    component: QuantumWebBackground,
    icon: '🕸',
    theme: 'dark',
    darkProps: { quantumColor: '#5e6ad2', normalColor: '#818cf8' },
  },
  {
    id: 'text-particles',
    name: '文字粒子',
    component: TextParticlesBackground,
    icon: '🔤',
    theme: 'light',
    lightProps: { color: '#3b82f6', text: '理科迷', fontSize: 300 },
  },
];
