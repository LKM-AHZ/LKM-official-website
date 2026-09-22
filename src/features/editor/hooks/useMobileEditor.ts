/**
 * Mobile editor utilities: touch gestures, keyboard adaptation, viewport management.
 * These are applied as side effects / event listeners in the editor's useEffect.
 */

/** Scroll editor content into view when virtual keyboard appears on mobile */
export function setupKeyboardAutoScroll(
  editorEl: HTMLElement | null,
): () => void {
  if (!editorEl) return () => {};

  const vv = window.visualViewport;
  let rafId: number | null = null;

  if (vv) {
    const resetPadding = (): void => {
      editorEl.style.paddingBottom = "";
    };

    const handleResize = (): void => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const heightDiff = window.innerHeight - vv.height;
        if (heightDiff > 150) {
          // 键盘弹出：增加底部 padding 并滚动到焦点元素
          editorEl.style.paddingBottom = `${heightDiff}px`;
          // activeElement 可能是 body/document 这类非 HTMLElement 节点，别断言成元素
          const activeEl = document.activeElement as HTMLElement | null;
          if (activeEl instanceof HTMLElement && editorEl.contains(activeEl)) {
            activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        } else {
          // 键盘收起
          resetPadding();
        }
      });
    };

    vv.addEventListener("resize", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      resetPadding();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }

  // Fallback: focus-based detection (old browsers without visualViewport)
  let focusScrollTimer: ReturnType<typeof setTimeout> | null = null;

  const handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as HTMLElement;
    if (!editorEl.contains(target)) return;

    // 记录定时器：否则失焦/卸载都无法取消，回调可能在组件销毁后继续改 padding
    if (focusScrollTimer) clearTimeout(focusScrollTimer);
    // Wait for keyboard animation to start
    focusScrollTimer = setTimeout(() => {
      focusScrollTimer = null;
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // If target is near the bottom half, scroll it up
      if (rect.bottom > viewportHeight * 0.4) {
        editorEl.style.paddingBottom = `${viewportHeight * 0.5}px`;
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 300);
  };

  const handleBlur = (e: FocusEvent): void => {
    // focusout 会冒泡：焦点只是在编辑器内部两个字段之间移动时不应清 padding，
    // 否则 300ms 后又被 focusin 加回来，画面会抖一下
    if (e.relatedTarget && editorEl.contains(e.relatedTarget as Node)) return;
    if (focusScrollTimer) {
      clearTimeout(focusScrollTimer);
      focusScrollTimer = null;
    }
    editorEl.style.paddingBottom = "";
  };

  editorEl.addEventListener("focusin", handleFocusIn);
  editorEl.addEventListener("focusout", handleBlur);

  return () => {
    editorEl.removeEventListener("focusin", handleFocusIn);
    editorEl.removeEventListener("focusout", handleBlur);
    if (focusScrollTimer) clearTimeout(focusScrollTimer);
    editorEl.style.paddingBottom = "";
  };
}

/** Mobile viewport: detect small screens */
export function isMobile(): boolean {
  return window.innerWidth < 768 || "ontouchstart" in window;
}

/** Add "swipe to dismiss" and "long press" handling on a container */
export function setupTouchGestures(
  container: HTMLElement | null,
  handlers: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onLongPress?: (target: HTMLElement) => void;
  },
): () => void {
  if (!container) return () => {};

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchTarget: HTMLElement | null = null;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelLongPress = (): void => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  /** 手指移动超过阈值即取消长按（留出抖动余量，避免轻微移动就判失败） */
  const MOVE_CANCEL_PX = 10;
  const onTouchMove = (e: TouchEvent): void => {
    const touch = e.touches[0];
    if (!touch) return;
    if (
      Math.abs(touch.clientX - touchStartX) > MOVE_CANCEL_PX ||
      Math.abs(touch.clientY - touchStartY) > MOVE_CANCEL_PX
    ) {
      cancelLongPress();
    }
  };

  const onTouchStart = (e: TouchEvent): void => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    touchTarget = e.target as HTMLElement;

    // 上一次长按未结束就再次按下：先清掉旧计时器，否则会重复触发
    cancelLongPress();
    if (handlers.onLongPress) {
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        if (touchTarget) handlers.onLongPress?.(touchTarget);
      }, 600);
    }
  };

  const onTouchEnd = (e: TouchEvent): void => {
    cancelLongPress();

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;

    if (dt > 500) return; // too slow — not a swipe
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return; // not horizontal enough

    if (dx > 0) {
      handlers.onSwipeRight?.();
    } else {
      handlers.onSwipeLeft?.();
    }
  };

  container.addEventListener("touchstart", onTouchStart);
  container.addEventListener("touchend", onTouchEnd);
  // 滚动/拖动/被系统打断时取消长按，否则滑动列表也会触发 onLongPress
  container.addEventListener("touchmove", onTouchMove);
  container.addEventListener("touchcancel", cancelLongPress);

  return () => {
    container.removeEventListener("touchstart", onTouchStart);
    container.removeEventListener("touchend", onTouchEnd);
    container.removeEventListener("touchmove", onTouchMove);
    container.removeEventListener("touchcancel", cancelLongPress);
    cancelLongPress();
  };
}
