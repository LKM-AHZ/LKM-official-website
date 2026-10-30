// 树洞偏好、屏蔽、举报标记与本地投稿节流。
import type { TreeholeSettings } from "./types";
import { KEYS, read, write } from "./persistence";

// ---------- 设置 ----------
const DEFAULT_SETTINGS: TreeholeSettings = {
  theme: "day", // day | night
  fontScale: "normal", // small | normal | large
  muted: false, // 全站动效静音
  lowPerf: false, // 低性能设备：关闭重特效
  highContrast: false, // 高对比度护眼模式
  privacyAccepted: false,
  accent: "#e8a87c", // 自定义主题强调色
  accent2: "#c3aed6",
  rateLimit: 3, // 投稿限流：每分钟最多 N 封（可自定义）
  audioOn: false, // 白噪音背景音乐
  notifyDesktop: false, // 浏览器桌面通知
  bgmVolume: 0.4,
};
export function getSettings(): TreeholeSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...read<Partial<TreeholeSettings>>(KEYS.settings, {}),
  };
}
export function saveSettings(
  patch: Partial<TreeholeSettings>,
): TreeholeSettings {
  const s = { ...getSettings(), ...patch };
  write(KEYS.settings, s);
  return s;
}

// ---------- 屏蔽 ----------
export function getBlocked(): string[] {
  return read<string[]>(KEYS.blocked, []);
}
export function addBlocked(codename: string): void {
  const b = getBlocked();
  if (!b.includes(codename)) b.push(codename);
  write(KEYS.blocked, b);
}

// ---------- 举报 ----------
export function getReported(): string[] {
  return read<string[]>(KEYS.reported, []);
}
export function addReported(id: string): void {
  const r = getReported();
  if (!r.includes(id)) r.push(id);
  write(KEYS.reported, r);
}

// ---------- 投稿频率限制（自定义） ----------
export function getPostLog(): number[] {
  return read<number[]>(KEYS.postLog, []);
}
export function canPost(): boolean {
  const limit = getSettings().rateLimit || 3;
  const log = getPostLog();
  const now = Date.now();
  const window = 60 * 1000;
  const recent = log.filter((ts) => now - ts < window);
  return recent.length < limit;
}
export function logPost(): void {
  const log = getPostLog().filter((ts) => Date.now() - ts < 60 * 60 * 1000);
  log.push(Date.now());
  write(KEYS.postLog, log);
}
