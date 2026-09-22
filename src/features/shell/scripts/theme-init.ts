/**
 * Theme initialization script (extracted from BasicScripts.astro)
 *
 * NOTE: 预绘制（pre-paint）用的主题逻辑必须是 BasicScripts.astro 里的 **is:inline** 版本，
 * 那份是权威实现（不等模块加载，避免首帧闪白）。本文件是非内联消费者的等价副本，
 * 语义必须与它一致：`auto` 交给 prefers-color-scheme 决定，未知/缺失值一律按 `auto` 处理。
 */

const THEMES = ["light", "dark", "auto"] as const;
type Theme = (typeof THEMES)[number];

/** 把任意来源的值收敛到已知主题；未知值按 auto（与内联脚本的 else 分支一致） */
function normalizeTheme(value: unknown): Theme {
  return THEMES.includes(value as Theme) ? (value as Theme) : "auto";
}

/** 读取已持久化的主题；storage 被禁用（沙箱 iframe/隐私模式）时不能抛错中断上色 */
function readStoredTheme(defaultTheme: string): Theme {
  try {
    return normalizeTheme(localStorage.getItem("theme") ?? defaultTheme);
  } catch (err) {
    console.warn("[theme-init] 读取主题失败，使用默认值:", err);
    return normalizeTheme(defaultTheme);
  }
}

export function applyTheme(defaultTheme: string = "auto"): void {
  const theme = readStoredTheme(defaultTheme);
  // auto 跟随系统偏好：与 BasicScripts.astro / setting-utils.ts 的 applyTheme 同一规则，
  // 否则 UI.theme 为 auto 时系统偏好深色的用户会拿到浅色主题
  const dark =
    theme === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

export function toggleTheme(): void {
  // 切换方向取当前渲染态（auto 已经解析成实际的深/浅），切换后写死成 light|dark
  const next = document.documentElement.classList.contains("dark")
    ? "light"
    : "dark";
  // 先落存储再改 DOM：setItem 可能因配额/存储被禁用而抛错，先改 DOM 会留下
  // 「界面已切换、持久态没变」的不一致（刷新后主题跳回）
  try {
    localStorage.setItem("theme", next);
  } catch (err) {
    console.warn("[theme-init] 主题持久化失败，本次不切换:", err);
    return;
  }
  document.documentElement.classList.toggle("dark", next === "dark");
}
