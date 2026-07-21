import type { ComponentType } from 'react';

export type ThemeMode = 'dark' | 'light' | 'both';

export interface BackgroundMeta {
  id: string;
  name: string;
  /** 懒加载器 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<{ default: ComponentType<any> }>;
  icon: string;
  /** 该背景适用于哪个主题模式。'dark' 在浅色模式隐藏，'light' 在深色模式隐藏，'both' 始终可见。 */
  theme: ThemeMode;
  /** 深色模式的颜色参数，直接作为展开 props 传递给组件。 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  darkProps?: Record<string, any>;
  /** 浅色模式的颜色参数。 */
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
    load: () => import('~/components/background/lib/AuroraBackground').then((m) => ({ default: m.default })),
    darkProps: { rippleColor: '#818cf8' },
    lightProps: { rippleColor: '#a5f3fc' },
  },
  {
    id: 'binary-matrix',
    name: '数字雨',
    icon: '🔢',
    theme: 'dark',
    load: () => import('~/components/background/lib/BinaryMatrixBackground').then((m) => ({ default: m.default })),
    darkProps: { color: 'rgba(0,255,65,0.8)', rippleColor: 'rgba(0,255,65,0.5)' },
  },
  {
    id: 'constellation-field',
    name: '星座',
    icon: '✨',
    theme: 'both',
    load: () =>
      import('~/components/background/lib/ConstellationFieldBackground').then((m) => ({ default: m.default })),
    darkProps: { particleColor: '#5e6ad2', connectionColor: '#818cf8' },
    lightProps: { particleColor: '#0bcaf5', connectionColor: '#20cdf4' },
  },
  {
    id: 'data-rain',
    name: '数据雨',
    icon: '💧',
    theme: 'dark',
    load: () => import('~/components/background/lib/DataRainBackground').then((m) => ({ default: m.default })),
    darkProps: { color: 'rgba(0,255,65,0.8)', rippleColor: 'rgba(0,255,65,0.5)' },
  },
  {
    id: 'dna-spark',
    name: 'DNA火花',
    icon: '🧬',
    theme: 'dark',
    load: () => import('~/components/background/lib/DNASparkBackground').then((m) => ({ default: m.default })),
    darkProps: { sparkColor: '#5e6ad2', strandColor: '#818cf8' },
  },
  {
    id: 'dna-spark-3d',
    name: 'DNA 3D',
    icon: '🧬',
    theme: 'dark',
    load: () => import('~/components/background/lib/DNASparkBackground3D').then((m) => ({ default: m.default })),
    darkProps: { sparkColor: '#5e6ad2', strandColor: '#818cf8' },
  },
  {
    id: 'dreamy-halo',
    name: '梦幻光晕',
    icon: '💫',
    theme: 'light',
    load: () => import('~/components/background/lib/DreamyHaloBackground').then((m) => ({ default: m.default })),
    lightProps: { baseHue: 40, saturation: 80, lightness: 55 },
  },
  {
    id: 'fluid-smoke-flow',
    name: '烟雾流动',
    icon: '💨',
    theme: 'dark',
    load: () => import('~/components/background/lib/FluidSmokeFlowBackground').then((m) => ({ default: m.default })),
    darkProps: { particleColor: '#5e6ad2' },
  },
  {
    id: 'orbit-cluster',
    name: '轨道集群',
    icon: '🪐',
    theme: 'dark',
    load: () => import('~/components/background/lib/OrbitClusterBackground').then((m) => ({ default: m.default })),
    darkProps: { color: '#5e6ad2' },
  },
  {
    id: 'particles',
    name: '粒子',
    icon: '⚛',
    theme: 'both',
    load: () => import('~/components/background/lib/ParticlesBackground').then((m) => ({ default: m.default })),
    darkProps: { particleColor: '#5e6ad2', connectionColor: '#818cf8', rippleColor: '#818cf8' },
    lightProps: { particleColor: '#07c8f9', connectionColor: '#52d0ef', rippleColor: '#52d0ef' },
  },
  {
    id: 'quantum-web',
    name: '量子网',
    icon: '🕸',
    theme: 'dark',
    load: () => import('~/components/background/lib/QuantumWebBackground').then((m) => ({ default: m.default })),
    darkProps: { quantumColor: '#5e6ad2', normalColor: '#818cf8' },
  },
  {
    id: 'text-particles',
    name: '文字粒子',
    icon: '🔤',
    theme: 'both',
    load: () => import('~/components/background/lib/TextParticlesBackground').then((m) => ({ default: m.default })),
    darkProps: { color: 'rgba(255,255,255,0.9)', text: '理科迷', fontSize: 300 },
    lightProps: { color: '#aadcf8', text: '理科迷', fontSize: 300 },
  },
];
