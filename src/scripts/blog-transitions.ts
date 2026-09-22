/**
 * Astro 原生 View Transitions 生命周期事件处理
 * 处理：
 * - Banner class 即时切换
 * - 内容延迟重置
 * - 页面高度扩展（防止过渡期间滚动跳跃）
 * - TOC 隐藏/显示
 */

import { pathsEqual, url } from "~/lib/utils/url-utils";
// 与 blog-init 共用滚动阈值/高度算法（两个脚本都由 BlogLayout 加载，ESM 解析为同一模块实例）
import {
  applyBannerHeightExtend,
  getScrollTop,
  navbarHideThreshold,
} from "./blog-init";

/** 过渡收尾延时：page-height-extend 与 TOC 的复位都等这么久 */
const TRANSITION_SETTLE_MS = 200;

function updateBannerClass(pathname: string): void {
  const body = document.body;
  if (pathsEqual(pathname, url("/"))) {
    body.classList.add("lg:is-home");
  } else {
    body.classList.remove("lg:is-home");
  }
}

function resetContentDelay(): void {
  document.documentElement.style.setProperty("--content-delay", "0ms");
}

function handleNavbarOnNavigation(): void {
  // banner-wrapper 在导航后会换成新节点，模块级快照会一直拿到旧文档里的元素
  if (!document.getElementById("banner-wrapper")) return;
  const navbar = document.getElementById("navbar-wrapper");
  if (!navbar || !document.body.classList.contains("lg:is-home")) return;
  // 与 blog-init#handleScroll 共用同一阈值实现，避免同一页面两套阈值
  if (getScrollTop() >= navbarHideThreshold()) {
    navbar.classList.add("navbar-hidden");
  }
}

// --- Show/hide page-height-extend ---
let pageHeightExtendTimer: ReturnType<typeof setTimeout> | undefined;

function showPageHeightExtend(): void {
  const heightExtend = document.getElementById("page-height-extend");
  if (heightExtend) heightExtend.classList.remove("hidden");
}

function hidePageHeightExtend(): void {
  // 必须清掉上一次的定时器：200ms 内又发起一次导航时，旧回调会把 hidden 加回
  // 正在过渡的页面上，破坏防滚动跳跃
  clearTimeout(pageHeightExtendTimer);
  pageHeightExtendTimer = setTimeout(() => {
    const heightExtend = document.getElementById("page-height-extend");
    if (heightExtend) heightExtend.classList.add("hidden");
  }, TRANSITION_SETTLE_MS);
}

// --- TOC visibility during transition ---
let tocTimer: ReturnType<typeof setTimeout> | undefined;

function hideTOCBeforeTransition(): void {
  const toc = document.getElementById("toc-wrapper");
  if (toc) toc.classList.add("toc-not-ready");
}

function showTOCAfterTransition(): void {
  clearTimeout(tocTimer);
  tocTimer = setTimeout(() => {
    const toc = document.getElementById("toc-wrapper");
    if (toc) toc.classList.remove("toc-not-ready");
  }, TRANSITION_SETTLE_MS);
}

// --- Astro View Transitions lifecycle（由 @swup/astro 派发） ---

document.addEventListener("astro:before-swap", () => {
  updateBannerClass(window.location.pathname);
  resetContentDelay();
  handleNavbarOnNavigation();
  showPageHeightExtend();
  hideTOCBeforeTransition();
});

document.addEventListener("astro:after-swap", () => {
  hidePageHeightExtend();
  showTOCAfterTransition();
});

// Resize handler for banner height (non-transition specific) —— 复用 blog-init 的实现
window.addEventListener("resize", applyBannerHeightExtend);
