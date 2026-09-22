// =============================================================
// 全局响应式状态 (composable)
// 主题跟随主站 .dark class，不自行管理 data-theme
// =============================================================
import { reactive, computed, watch, type ComputedRef } from "vue";
import * as store from "./storage";
import type { TreeholeSettings } from "./storage";

interface AppState {
  settings: TreeholeSettings;
}

const isClient = typeof document !== "undefined";

/** 把主题同步到宿主 .dark class 与 localStorage.theme（整页加载时由主站脚本读回）。 */
function applyThemeToHost(theme: "day" | "night"): void {
  if (!isClient) return;
  document.documentElement.classList.toggle("dark", theme === "night");
  localStorage.theme = theme === "night" ? "dark" : "light";
}

interface AppApi {
  state: AppState;
  isNight: ComputedRef<boolean>;
  lowPerf: ComputedRef<boolean>;
  highContrast: ComputedRef<boolean>;
  toggleTheme: () => void;
  setTheme: (t: "day" | "night") => void;
  toggleMuted: () => void;
  setFontScale: (s: "small" | "normal" | "large") => void;
  setAccent: (a: string, b: string) => void;
  toggleLowPerf: () => void;
  toggleHighContrast: () => void;
  setRateLimit: (n: number) => void;
  acceptPrivacy: () => void;
}

// 单例：useApp 被 5+ 个组件调用，若每次调用都新建 reactive/watch/监听器，
// 会得到多份互不同步的状态、重复写 storage、并持续泄漏 astro:after-swap 监听器。
let singleton: AppApi | null = null;

export function useApp(): AppApi {
  if (singleton) return singleton;

  const settings = store.getSettings();
  // 始终从主站 .dark class 同步初始主题，不被 localStorage 覆盖
  if (isClient) {
    settings.theme = document.documentElement.classList.contains("dark")
      ? "night"
      : "day";
  }

  const state = reactive<AppState>({ settings });

  // 监听主站 theme 变化（astro:after-swap 后 BasicScripts 会更新 .dark class）
  if (isClient) {
    document.addEventListener("astro:after-swap", () => {
      const isDark = document.documentElement.classList.contains("dark");
      state.settings.theme = isDark ? "night" : "day";
    });
  }

  const isNight = computed(() => state.settings.theme === "night");
  const lowPerf = computed(
    () => state.settings.lowPerf || state.settings.muted,
  );
  const highContrast = computed(() => state.settings.highContrast);

  // 字体大小 -> 写入根节点 css 变量
  watch(
    () => state.settings.fontScale,
    (s) => {
      if (isClient) {
        document.documentElement.style.setProperty(
          "--font-scale",
          s === "small" ? "0.9" : s === "large" ? "1.15" : "1",
        );
      }
    },
    { immediate: true },
  );

  // 高对比度护眼模式
  watch(
    () => state.settings.highContrast,
    (on) => {
      if (isClient)
        document.documentElement.classList.toggle("high-contrast", !!on);
    },
    { immediate: true },
  );

  // 低性能设备：关闭重特效。必须与 lowPerf computed 用同一条件（含 muted），
  // 否则「静音」时 computed 为 true 而 .low-perf class 不被加上，两边判断不一致
  watch(
    () => [state.settings.lowPerf, state.settings.muted] as const,
    ([lowPerf, muted]) => {
      if (isClient) {
        document.documentElement.classList.toggle(
          "low-perf",
          !!lowPerf || !!muted,
        );
      }
    },
    { immediate: true },
  );

  // 同步设置到存储
  watch(
    () => state.settings,
    (s) => store.saveSettings(s),
    { deep: true },
  );

  function toggleTheme(): void {
    const next = isNight.value ? "day" : "night";
    state.settings.theme = next;
    applyThemeToHost(next);
  }

  function setTheme(t: "day" | "night"): void {
    state.settings.theme = t;
    // 与 toggleTheme 一样同步宿主 class/localStorage：只改 state 的话
    // 设置页的日/夜按钮没有可见效果，刷新后也会被宿主 .dark 覆盖回去
    applyThemeToHost(t);
  }
  function toggleMuted(): void {
    state.settings.muted = !state.settings.muted;
  }
  function setFontScale(s: "small" | "normal" | "large"): void {
    state.settings.fontScale = s;
  }
  function setAccent(a: string, b: string): void {
    state.settings.accent = a;
    state.settings.accent2 = b;
  }
  function toggleLowPerf(): void {
    state.settings.lowPerf = !state.settings.lowPerf;
  }
  function toggleHighContrast(): void {
    state.settings.highContrast = !state.settings.highContrast;
  }
  function setRateLimit(n: number): void {
    state.settings.rateLimit = n;
  }
  function acceptPrivacy(): void {
    state.settings.privacyAccepted = true;
  }

  singleton = {
    state,
    isNight,
    lowPerf,
    highContrast,
    toggleTheme,
    setTheme,
    toggleMuted,
    setFontScale,
    setAccent,
    toggleLowPerf,
    toggleHighContrast,
    setRateLimit,
    acceptPrivacy,
  };
  return singleton;
}
