import {
  AUTO_MODE,
  DARK_MODE,
  DEFAULT_THEME,
  LIGHT_MODE,
} from "~/lib/constants/constants";
import type { LIGHT_DARK_MODE } from "~/types/config";

/** 未配置色相时的默认值（与 tailwind.css 的 --hue 初始值一致） */
const DEFAULT_HUE = 250;

export function getDefaultHue(): number {
  const configCarrier = document.getElementById("config-carrier");
  const parsed = Number.parseInt(configCarrier?.dataset.hue ?? "", 10);
  // parseInt 对非数值得到 NaN：原样返回会把 --hue 写成 NaN，
  // 使所有 oklch(... var(--hue)) 颜色失效
  return Number.isFinite(parsed) ? parsed : DEFAULT_HUE;
}

export function getHue(): number {
  const stored = localStorage.getItem("hue");
  if (!stored) return getDefaultHue();
  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed) ? parsed : getDefaultHue();
}

export function setHue(hue: number): void {
  localStorage.setItem("hue", String(hue));
  const r = document.querySelector(":root") as HTMLElement;
  if (!r) {
    return;
  }
  r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE): void {
  switch (theme) {
    case LIGHT_MODE:
      document.documentElement.classList.remove("dark");
      break;
    case DARK_MODE:
      document.documentElement.classList.add("dark");
      break;
    case AUTO_MODE:
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      break;
  }
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
  localStorage.setItem("theme", theme);
  applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
  // localStorage 可能被手改/旧版本写脏（如 "system"）：不校验就会返回非法值，
  // 下游 applyThemeToDocument 匹配不到任何 case、静默保留原 class
  const stored = localStorage.getItem("theme");
  if (stored === LIGHT_MODE || stored === DARK_MODE || stored === AUTO_MODE) {
    return stored;
  }
  return DEFAULT_THEME;
}
