// src/components/background/sci-fi-config.ts

/** 亮色 / 暗色配色 */
export const COLORS = {
  light: {
    bg: [0.0, 0.0, 0.0, 0.0], // 透明，让 CSS body 背景透过
    particle: [0.35, 0.13, 0.62, 1.0], // #5921a1 稍亮紫
    line: [0.35, 0.13, 0.62, 0.5], // rgba(89,33,161,0.5) 提高alpha
    glow: [0.35, 0.13, 0.62, 0.55],
    accent: [0.42, 0.18, 0.71, 1.0], // #6b2eb5 流光线
  },
  dark: {
    bg: [0.0, 0.0, 0.0, 0.0], // 透明，让 CSS body 背景透过
    particle: [0.16, 0.59, 1.0, 1.0], // #2997ff
    line: [0.16, 0.59, 1.0, 0.2], // 与亮色保持一致的可见度
    glow: [0.16, 0.59, 1.0, 0.4],
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
export const TRAIL_MAX = {
  desktop: 20,
  mobile: 8,
} as const;
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
