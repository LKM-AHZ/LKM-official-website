import { useState, useEffect, useCallback } from "react";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

export default function FullscreenButton(): ReactElement {
  // 以真实 DOM 为准初始化：挂载时若已处于全屏（或错过了 fullscreenchange），
  // 否则按钮图标与调用方向都是反的
  const [isFullscreen, setIsFullscreen] = useState(
    () => !!document.fullscreenElement,
  );

  const toggle = useCallback(() => {
    // 全屏 API 会因权限/iframe 策略/浏览器不支持而 reject；失败时按真实 DOM 状态回滚，
    // 同时避免未处理的 rejection
    const resync = (): void => setIsFullscreen(!!document.fullscreenElement);
    if (isFullscreen) {
      void document.exitFullscreen?.()?.catch(resync);
    } else {
      void document.documentElement.requestFullscreen?.()?.catch(resync);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = (): void => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <button
      type="button"
      className="rte-fullscreen-btn"
      title={
        isFullscreen ? t("editor.exitFullscreen") : t("editor.enterFullscreen")
      }
      onClick={toggle}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isFullscreen ? (
          <>
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </>
        ) : (
          <>
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </>
        )}
      </svg>
    </button>
  );
}
