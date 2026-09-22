/**
 * PhotoSwipe 图片灯箱初始化
 * 使用 Astro 原生 View Transitions 生命周期事件管理
 */

import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

let lightbox: PhotoSwipeLightbox | undefined;

function createPhotoSwipe(): void {
  // 先销毁旧实例：astro:page-load 若在未经过 astro:before-swap 的情况下再次触发
  // （例如重复派发），旧灯箱的监听与注入的 pswp DOM 会变成孤儿
  lightbox?.destroy?.();
  lightbox = new PhotoSwipeLightbox({
    gallery: ".custom-md img, #post-cover img",
    // 模块 chunk 可能加载失败（离线/CSP/构建产物缺失）：加日志便于定位，再原样抛出
    pswpModule: () =>
      import("photoswipe").catch((error) => {
        console.error("[photoswipe] 模块加载失败，灯箱不可用", error);
        throw error;
      }),
    closeSVG:
      '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/></svg>',
    zoomSVG:
      '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M340-540h-40q-17 0-28.5-11.5T260-580q0-17 11.5-28.5T300-620h40v-40q0-17 11.5-28.5T380-700q17 0 28.5 11.5T420-660v40h40q17 0 28.5 11.5T500-580q0 17-11.5 28.5T460-540h-40v40q0 17-11.5 28.5T380-460q-17 0-28.5-11.5T340-500v-40Zm40 220q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>',
    padding: { top: 20, bottom: 20, left: 20, right: 20 },
    wheelToZoom: true,
    arrowPrev: false,
    arrowNext: false,
    imageClickAction: "close",
    tapAction: "close",
    doubleTapAction: "zoom",
  });

  lightbox.addFilter("domItemData", (itemData, element) => {
    if (element instanceof HTMLImageElement) {
      itemData.src = element.src;
      itemData.msrc = element.src;
      // 不要用视口尺寸兜底：懒加载/未解码时 naturalWidth 为 0，编造宽高会得到错误的宽高比
      //（且 w/h 分别来自不同来源时会互相矛盾），导致打开时缩放错位。
      // 拿不到真实尺寸就保留 PhotoSwipe 自己解析出的值（data-pswp-* 属性）
      const w = element.naturalWidth || element.width;
      const h = element.naturalHeight || element.height;
      if (w && h) {
        itemData.w = Number(w);
        itemData.h = Number(h);
      } else {
        console.warn(
          "[photoswipe] 图片尺寸未知，沿用标记属性中的尺寸",
          element.currentSrc || element.src,
        );
      }
    }
    return itemData;
  });

  lightbox.init();
}

// 首次加载直接初始化；Swup 导航后由 astro:page-load 重建、astro:before-swap 销毁旧灯箱
createPhotoSwipe();

document.addEventListener("astro:page-load", () => {
  createPhotoSwipe();
});

document.addEventListener("astro:before-swap", () => {
  lightbox?.destroy?.();
});
