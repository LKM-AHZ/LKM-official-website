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

export function BackgroundCanvas({ draw, init, interactions, className = '', children }: BackgroundCanvasProps) {
  const { canvasRef } = useBackgroundCanvas({ draw, init, interactions });
  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-auto ${className}`}
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />
      {children}
    </>
  );
}
