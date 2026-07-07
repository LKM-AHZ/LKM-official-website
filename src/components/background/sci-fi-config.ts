// src/components/background/sci-fi-config.ts

/** 亮色 / 暗色配色 */
export const COLORS = {
  light: {
    bg: [1.0, 1.0, 1.0, 1.0], // #ffffff
    particle: [0.0, 0.4, 0.8, 1.0], // #0066cc
    line: [0.0, 0.4, 0.8, 0.12], // rgba(0,102,204,0.12)
    glow: [0.0, 0.4, 0.8, 0.25],
    accent: [0.0, 0.44, 0.89, 1.0], // #0071e3 流光线
  },
  dark: {
    bg: [0.0, 0.0, 0.0, 1.0], // #000000
    particle: [0.16, 0.59, 1.0, 1.0], // #2997ff
    line: [0.16, 0.59, 1.0, 0.15], // rgba(41,151,255,0.15)
    glow: [0.16, 0.59, 1.0, 0.3],
    accent: [0.16, 0.59, 1.0, 0.8],
  },
} as const;

/** 粒子数量 */
export const PARTICLE_COUNT = {
  desktop: 300,
  mobile: 120,
} as const;

/** 流光线数量 */
export const FLOW_LINE_COUNT = {
  desktop: 4,
  mobile: 2,
} as const;

/** 粒子间连线距离阈值 */
export const LINK_DISTANCE = {
  desktop: 150,
  mobile: 100,
} as const;

/** 鼠标吸引半径 (px) */
export const MOUSE_ATTRACT_RADIUS = 200;

/** 鼠标拖尾参数 */
export const TRAIL_COUNT = 6;
export const TRAIL_LIFETIME = 2000; // ms

/** 点击扰动参数 */
export const BURST_COUNT = 12;
export const BURST_LIFETIME = 1500; // ms
export const BURST_RADIUS = 150; // px

/** 移动端断点 */
export const MOBILE_BREAKPOINT = 768;

/** FPS 自适应 */
export const FPS_ADAPTIVE = {
  sampleDuration: 3000, // 启动采样时长 ms
  downgrade45: 0.5, // 低于 45fps → 粒子数倍率
  downgrade30: 0.25, // 低于 30fps → 粒子数倍率
  recoveryInterval: 30000, // 恢复检测间隔 ms
  recoveryDuration: 2000, // 恢复检测时长 ms
} as const;
