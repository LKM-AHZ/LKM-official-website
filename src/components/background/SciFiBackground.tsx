// src/components/background/SciFiBackground.tsx

import { useEffect, useRef } from 'react';
import { SciFiRenderer } from './sci-fi-renderer';

export default function SciFiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SciFiRenderer | null>(null);
  const darkRef = useRef(false);

  // 初始化 & 销毁
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 延迟一帧确保父级 absolute 容器已由浏览器完成 layout
    requestAnimationFrame(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const isMobile = window.innerWidth < 768;
      darkRef.current = document.documentElement.classList.contains('dark');

      const renderer = new SciFiRenderer(canvas, isMobile);
      renderer.setTheme(darkRef.current);
      renderer.start();
      rendererRef.current = renderer;
    });

    // Cache rect for event handlers instead of reading per-event
    let canvasRect = canvas.getBoundingClientRect();
    const updateRect = () => {
      canvasRect = canvas.getBoundingClientRect();
    };
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);

    const handleMouseMoveDpr = (e: MouseEvent) => {
      updateRect();
      rendererRef.current?.setMouse((e.clientX - canvasRect.left) * dpr, (e.clientY - canvasRect.top) * dpr);
    };
    const handleClickDpr = (e: MouseEvent) => {
      updateRect();
      rendererRef.current?.click((e.clientX - canvasRect.left) * dpr, (e.clientY - canvasRect.top) * dpr);
    };
    // Listen on document.body so mouse events fire even over text/content above the canvas
    document.body.addEventListener('mousemove', handleMouseMoveDpr, { passive: true });
    document.body.addEventListener('click', handleClickDpr, { passive: true });

    const handleResize = () => {
      updateRect();
      canvas.width = canvasRect.width * dpr;
      canvas.height = canvasRect.height * dpr;
      canvas.style.width = `${canvasRect.width}px`;
      canvas.style.height = `${canvasRect.height}px`;
    };
    window.addEventListener('resize', handleResize);

    // 触摸事件 (移动端)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        rendererRef.current?.setMouse(
          (e.touches[0].clientX - canvasRect.left) * dpr,
          (e.touches[0].clientY - canvasRect.top) * dpr
        );
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        rendererRef.current?.click(
          (e.changedTouches[0].clientX - canvasRect.left) * dpr,
          (e.changedTouches[0].clientY - canvasRect.top) * dpr
        );
      }
    };
    // Touch events on body for the same reason — content layer blocks canvas events
    document.body.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.body.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      document.body.removeEventListener('mousemove', handleMouseMoveDpr);
      document.body.removeEventListener('click', handleClickDpr);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
      document.body.removeEventListener('touchmove', handleTouchMove);
      document.body.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 主题切换
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      darkRef.current = dark;
      rendererRef.current?.setTheme(dark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    />
  );
}
