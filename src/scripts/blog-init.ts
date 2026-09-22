/**
 * BlogLayout 页面初始化：主题、色相、滚动条、Banner、滚动/窗口事件
 */

import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbars } from "overlayscrollbars";
import {
  getHue,
  getStoredTheme,
  setHue,
  setTheme,
} from "~/lib/utils/setting-utils";
import {
  BANNER_HEIGHT,
  BANNER_HEIGHT_EXTEND,
  BANNER_HEIGHT_HOME,
  MAIN_PANEL_OVERLAPS_BANNER_HEIGHT,
} from "~/lib/constants/constants";
import { siteConfig } from "~/lib/config";

/* ---------- 点击外部关闭面板 ---------- */
function setClickOutsideToClose(panel: string, ignores: string[]): void {
  document.addEventListener("click", (event) => {
    const panelDom = document.getElementById(panel);
    const tDom = event.target;
    if (!(tDom instanceof Node)) return;
    for (const ig of ignores) {
      const ie = document.getElementById(ig);
      if (ie === tDom || ie?.contains(tDom)) {
        return;
      }
    }
    panelDom?.classList.add("float-panel-closed");
  });
}

// 绑定是 document 级、且本文件没有任何注销路径：这里做幂等，避免脚本被重复求值（HMR/重复引入）
// 时叠加监听。标记必须落在 <html> 上——模块级变量在脚本重新求值时会被重置为 false，守卫等于没写。
if (!document.documentElement.dataset.clickOutsideBound) {
  document.documentElement.dataset.clickOutsideBound = "1";
  setClickOutsideToClose("display-setting", [
    "display-setting",
    "display-settings-switch",
  ]);
  setClickOutsideToClose("search-panel", [
    "search-panel",
    "search-bar",
    "search-switch",
  ]);
}

/* ---------- 主题与色相 ---------- */
function loadTheme(): void {
  const theme = getStoredTheme();
  setTheme(theme);
}

function loadHue(): void {
  setHue(getHue());
}

/* ---------- 自定义滚动条 ---------- */
export function initCustomScrollbar(): void {
  const bodyElement = document.querySelector("body");
  if (!bodyElement) return;
  OverlayScrollbars(
    {
      target: bodyElement,
      cancel: {
        nativeScrollbarsOverlaid: true,
      },
    },
    {
      scrollbars: {
        theme: "scrollbar-base scrollbar-auto py-1",
        autoHide: "move",
        autoHideDelay: 500,
        autoHideSuspend: false,
      },
    },
  );

  const katexElements = document.querySelectorAll(
    ".katex-display",
  ) as NodeListOf<HTMLElement>;

  const processKatexElement = (element: HTMLElement): void => {
    if (!element.parentNode) return;
    if (element.hasAttribute("data-scrollbar-initialized")) return;

    const container = document.createElement("div");
    container.className = "katex-display-container";
    container.setAttribute("aria-label", "scrollable container for formulas");

    element.parentNode.insertBefore(container, element);
    container.appendChild(element);

    OverlayScrollbars(container, {
      scrollbars: {
        theme: "scrollbar-base scrollbar-auto",
        autoHide: "leave",
        autoHideDelay: 500,
        autoHideSuspend: false,
      },
    });

    element.setAttribute("data-scrollbar-initialized", "true");
  };

  const katexObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          processKatexElement(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    },
  );

  katexElements.forEach((element) => {
    katexObserver.observe(element);
  });
}

/* ---------- Banner 显示 ---------- */
export function showBanner(): void {
  if (!siteConfig.banner.enable) return;
  const banner = document.getElementById("banner");
  if (!banner) {
    console.error("Banner element not found");
    return;
  }
  banner.classList.remove("opacity-0", "scale-105");
}

/* ---------- 滚动处理 ---------- */
const NAVBAR_HEIGHT = 72;
const MAIN_PANEL_EXCESS_HEIGHT = MAIN_PANEL_OVERLAPS_BANNER_HEIGHT * 16;

/** 当前滚动位置：两种滚动根取较大值（不同浏览器把滚动放在 body 或 documentElement） */
export function getScrollTop(): number {
  return Math.max(document.body.scrollTop, document.documentElement.scrollTop);
}

/**
 * 导航栏隐藏阈值。blog-transitions.ts 共用同一实现，
 * 否则（首页大 banner 与普通页）两个脚本会算出不同阈值。
 */
export function navbarHideThreshold(): number {
  const useHomeBanner =
    document.body.classList.contains("lg:is-home") && window.innerWidth >= 1024;
  const bannerH = useHomeBanner ? BANNER_HEIGHT_HOME : BANNER_HEIGHT;
  return (
    window.innerHeight * (bannerH / 100) -
    NAVBAR_HEIGHT -
    MAIN_PANEL_EXCESS_HEIGHT -
    16
  );
}

/** 计算并写入 --banner-height-extend（与 BlogLayout 内联脚本同一算法，四个像素对齐避免文字发虚） */
export function applyBannerHeightExtend(): void {
  let offset = Math.floor(window.innerHeight * (BANNER_HEIGHT_EXTEND / 100));
  offset = offset - (offset % 4);
  document.documentElement.style.setProperty(
    "--banner-height-extend",
    `${offset}px`,
  );
}

function handleScroll(): void {
  // 这些节点在 swup 导航（astro:before-swap/after-swap）后会被整体替换：每次滚动都重新查询，
  // 模块级快照会指向已脱离文档的旧节点，导致导航后 banner/TOC/回顶按钮的隐藏逻辑永久失效
  const backToTopBtn = document.getElementById("back-to-top-btn");
  const toc = document.getElementById("toc-wrapper");
  const navbar = document.getElementById("navbar-wrapper");
  const bannerEnabled = !!document.getElementById("banner-wrapper");

  const bannerHeight = window.innerHeight * (BANNER_HEIGHT / 100);
  const scrollTop = getScrollTop();

  if (backToTopBtn) {
    if (scrollTop > bannerHeight) {
      backToTopBtn.classList.remove("hide");
    } else {
      backToTopBtn.classList.add("hide");
    }
  }

  if (bannerEnabled && toc) {
    if (scrollTop > bannerHeight) {
      toc.classList.remove("toc-hide");
    } else {
      toc.classList.add("toc-hide");
    }
  }

  if (!bannerEnabled) return;
  if (navbar) {
    if (scrollTop >= navbarHideThreshold()) {
      navbar.classList.add("navbar-hidden");
    } else {
      navbar.classList.remove("navbar-hidden");
    }
  }
}
window.addEventListener("scroll", handleScroll, { passive: true });

window.addEventListener("resize", applyBannerHeightExtend);

/** 首屏入场动画的基础延迟（CSS 侧同名变量在 variables.css 里有 150ms 默认值，这里按设计覆盖为 300ms） */
const CONTENT_DELAY_INITIAL = "300ms";

/* ---------- 初始化 ---------- */
function init(): void {
  loadTheme();
  loadHue();
  initCustomScrollbar();
  showBanner();
  // 之前只在 resize 时算过：首屏依赖内联脚本先跑过，少了这一步就可能在别的脚本未执行时取不到值
  applyBannerHeightExtend();

  // 设置初始 content-delay 用于入场动画（数值与 transition.css 消费的变量同名同源）
  document.documentElement.style.setProperty(
    "--content-delay",
    CONTENT_DELAY_INITIAL,
  );
}

if ("requestIdleCallback" in window) {
  requestIdleCallback(init, { timeout: 2000 });
} else {
  setTimeout(init, 1);
}
