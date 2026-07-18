import type { ComponentType } from 'react';

export type ThemeMode = 'dark' | 'light' | 'both';

export interface BackgroundMeta {
  id: string;
  name: string;
  /** 懒加载器 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<{ default: ComponentType<any> }>;
  icon: string;
  /** Which theme this background is suitable for. 'dark' hides in light, 'light' hides in dark, 'both' always visible. */
  theme: ThemeMode;
  /** Color props for dark mode. Passed directly to the component as spread props. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  darkProps?: Record<string, any>;
  /** Color props for light mode. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lightProps?: Record<string, any>;
  /** 在切换器首次挂载时立刻 preload chunk（默认背景用） */
  preload?: boolean;
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
    icon: '🌈',
    theme: 'both',
    preload: true,
    load: () => import('~/vendor/interactive-backgrounds/AuroraBackground').then((m) => ({ default: m.default })),
    darkProps: { rippleColor: '#818cf8' },
    lightProps: { rippleColor: '#c39ee9' },
  },
  {
    id: 'binary-matrix',
    name: '数字雨',
    icon: '🔢',
    theme: 'dark',
    load: () => import('~/vendor/interactive-backgrounds/BinaryMatrixBackground').then((m) => ({ default: m.default })),
    darkProps: { color: 'rgba(0,255,65,0.8)', rippleColor: 'rgba(0,255,65,0.5)' },
  },
  {
    id: 'constellation-field',
    name: '星座',
    icon: '✨',
    theme: 'both',
    load: () =>
      import('~/vendor/interactive-backgrounds/ConstellationFieldBackground').then((m) => ({ default: m.default })),
    darkProps: { particleColor: '#5e6ad2', connectionColor: '#818cf8' },
    lightProps: { particleColor: '#0bcaf5', connectionColor: '#20cdf4' },
  },
  {
    id: 'data-rain',
    name: '数据雨',
    icon: '💧',
    theme: 'dark',
    load: () => import('~/vendor/interactive-backgrounds/DataRainBackground').then((m) => ({ default: m.default })),
    darkProps: { color: 'rgba(0,255,65,0.8)', rippleColor: 'rgba(0,255,65,0.5)' },
  },
  {
    id: 'dna-spark',
    name: 'DNA火花',
    icon: '🧬',
    theme: 'dark',
    load: () => import('~/vendor/interactive-backgrounds/DNASparkBackground').then((m) => ({ default: m.default })),
    darkProps: { sparkColor: '#5e6ad2', strandColor: '#818cf8' },
  },
  {
    id: 'dna-spark-3d',
    name: 'DNA 3D',
    icon: '🧬',
    theme: 'dark',
    load: () => import('~/vendor/interactive-backgrounds/DNASparkBackground3D').then((m) => ({ default: m.default })),
    darkProps: { sparkColor: '#5e6ad2', strandColor: '#818cf8' },
  },
  {
    id: 'dreamy-halo',
    name: '梦幻光晕',
    icon: '💫',
    theme: 'light',
    load: () => import('~/vendor/interactive-backgrounds/DreamyHaloBackground').then((m) => ({ default: m.default })),
    lightProps: { baseHue: 40, saturation: 80, lightness: 55 },
  },
  {
    id: 'fluid-smoke-flow',
    name: '烟雾流动',
    icon: '💨',
    theme: 'dark',
    load: () =>
      import('~/vendor/interactive-backgrounds/FluidSmokeFlowBackground').then((m) => ({ default: m.default })),
    darkProps: { particleColor: '#5e6ad2' },
  },
  {
    id: 'orbit-cluster',
    name: '轨道集群',
    icon: '🪐',
    theme: 'dark',
    load: () => import('~/vendor/interactive-backgrounds/OrbitClusterBackground').then((m) => ({ default: m.default })),
    darkProps: { color: '#5e6ad2' },
  },
  {
    id: 'particles',
    name: '粒子',
    icon: '⚛',
    theme: 'both',
    load: () => import('~/vendor/interactive-backgrounds/ParticlesBackground').then((m) => ({ default: m.default })),
    darkProps: { particleColor: '#5e6ad2', connectionColor: '#818cf8', rippleColor: '#818cf8' },
    lightProps: { particleColor: '#07c8f9', connectionColor: '#52d0ef', rippleColor: '#52d0ef' },
  },
  {
    id: 'quantum-web',
    name: '量子网',
    icon: '🕸',
    theme: 'dark',
    load: () => import('~/vendor/interactive-backgrounds/QuantumWebBackground').then((m) => ({ default: m.default })),
    darkProps: { quantumColor: '#5e6ad2', normalColor: '#818cf8' },
  },
  {
    id: 'text-particles',
    name: '文字粒子',
    icon: '🔤',
    theme: 'light',
    load: () =>
      import('~/vendor/interactive-backgrounds/TextParticlesBackground').then((m) => ({ default: m.default })),
    lightProps: { color: '#aadcf8', text: '理科迷', fontSize: 300 },
  },
];
