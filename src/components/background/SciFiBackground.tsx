// src/components/background/SciFiBackground.tsx

import { useEffect, useRef } from 'react';
import { SciFiRenderer } from './sci-fi-renderer';

export default function SciFiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SciFiRenderer | null>(null);
  const darkRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 初始化 & 销毁
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const isMobile = window.innerWidth < 768;
    darkRef.current = document.documentElement.classList.contains('dark');

    const renderer = new SciFiRenderer(canvas, isMobile);
    renderer.setTheme(darkRef.current);
    renderer.start();
    rendererRef.current = renderer;

    const handleMouseMoveDpr = (e: MouseEvent) => {
      rendererRef.current?.setMouse(e.clientX * dpr, e.clientY * dpr);
    };
    const handleClickDpr = (e: MouseEvent) => {
      rendererRef.current?.click(e.clientX * dpr, e.clientY * dpr);
    };
    document.body.addEventListener('mousemove', handleMouseMoveDpr, { passive: true });
    document.body.addEventListener('click', handleClickDpr, { passive: true });

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    window.addEventListener('resize', handleResize);

    // 触摸事件 (移动端)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        renderer.setMouse(e.touches[0].clientX * dpr, e.touches[0].clientY * dpr);
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        renderer.click(e.changedTouches[0].clientX * dpr, e.changedTouches[0].clientY * dpr);
      }
    };
    document.body.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.body.addEventListener('touchend', handleTouchEnd, { passive: true });

    // IntersectionObserver：哨兵在视口中 → start，离开 → stop
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          renderer.start();
        } else {
          renderer.stop();
        }
      },
      { threshold: 0 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      observer.disconnect();
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
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          display: 'block',
        }}
        aria-hidden="true"
      />
      <div
        ref={sentinelRef}
        style={{
          position: 'fixed',
          top: '100vh',
          left: 0,
          width: '100%',
          height: 1,
          zIndex: -1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
    </>
  );
}
