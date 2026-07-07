// src/components/background/SciFiBackground.tsx

import { useEffect, useRef } from 'react';
import { SciFiRenderer } from './sci-fi-renderer';

export default function SciFiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SciFiRenderer | null>(null);
  const darkRef = useRef(false);
  const dprRef = useRef(1);

  // 初始化 & 销毁
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const rect = container.getBoundingClientRect();
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

    const handleMouseMoveDpr = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      rendererRef.current?.setMouse(
        (e.clientX - r.left) * dprRef.current,
        (e.clientY - r.top) * dprRef.current
      );
    };
    const handleClickDpr = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      rendererRef.current?.click(
        (e.clientX - r.left) * dprRef.current,
        (e.clientY - r.top) * dprRef.current
      );
    };
    document.body.addEventListener('mousemove', handleMouseMoveDpr, { passive: true });
    document.body.addEventListener('click', handleClickDpr, { passive: true });

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const r = container.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };
    window.addEventListener('resize', handleResize);

    // 触摸事件 (移动端)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const r = container.getBoundingClientRect();
        renderer.setMouse(
          (e.touches[0].clientX - r.left) * dprRef.current,
          (e.touches[0].clientY - r.top) * dprRef.current
        );
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const r = container.getBoundingClientRect();
        renderer.click(
          (e.changedTouches[0].clientX - r.left) * dprRef.current,
          (e.changedTouches[0].clientY - r.top) * dprRef.current
        );
      }
    };
    document.body.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.body.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      renderer.destroy();
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
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          display: 'block',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
