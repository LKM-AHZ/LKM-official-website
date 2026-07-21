import type { ReactNode } from 'react';
import { useBackgroundCanvas, type BackgroundInteractions, type BackgroundFrame } from './useBackgroundCanvas';

export interface BackgroundCanvasProps {
  draw: (frame: BackgroundFrame) => void;
  init?: (canvas: HTMLCanvasElement, frame: BackgroundFrame) => void | (() => void);
  interactions?: BackgroundInteractions;
  className?: string;
  /** 如 DreamyHalo 的 blurOverlay 覆盖层 */
  children?: ReactNode;
}

/**
 * Canvas 背景包装组件。封装 useBackgroundCanvas hook，提供固定全屏 <canvas>
 * 以及可选的 children 覆盖层（如模糊叠加层）。
 */
export function BackgroundCanvas({ draw, init, interactions, className = '', children }: BackgroundCanvasProps) {
  const { canvasRef } = useBackgroundCanvas({ draw, init, interactions });
  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-auto ${className}`}
        style={{ zIndex: 0, width: '100vw', height: '100vh' }}
        aria-hidden="true"
      />
      {children}
    </>
  );
}
