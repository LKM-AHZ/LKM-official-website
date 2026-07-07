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

    const handleMouseMoveDpr = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      rendererRef.current?.setMouse(
        (e.clientX - r.left) * dpr,
        (e.clientY - r.top) * dpr
      );
    };
    const handleClickDpr = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      rendererRef.current?.click(
        (e.clientX - r.left) * dpr,
        (e.clientY - r.top) * dpr
      );
    };
    document.body.addEventListener('mousemove', handleMouseMoveDpr, { passive: true });
    document.body.addEventListener('click', handleClickDpr, { passive: true });

    const handleResize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };
    window.addEventListener('resize', handleResize);

    // 触摸事件 (移动端)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const r = canvas.getBoundingClientRect();
        rendererRef.current?.setMouse(
          (e.touches[0].clientX - r.left) * dpr,
          (e.touches[0].clientY - r.top) * dpr
        );
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const r = canvas.getBoundingClientRect();
        rendererRef.current?.click(
          (e.changedTouches[0].clientX - r.left) * dpr,
          (e.changedTouches[0].clientY - r.top) * dpr
        );
      }
    };
    document.body.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.body.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      document.body.removeEventListener('mousemove', handleMouseMoveDpr);
      document.body.removeEventListener('click', handleClickDpr);
      window.removeEventListener('resize', handleResize);
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
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
