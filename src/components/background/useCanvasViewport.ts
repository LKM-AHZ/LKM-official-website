import { useEffect, useRef, useState } from 'react';
<<<<<<< HEAD
=======
import {
  getBackgroundPerformance,
  type BackgroundPerformance,
  type BackgroundQuality,
} from './useBackgroundCanvas';
>>>>>>> 2764c34 (333)

export interface CanvasViewportMouse {
  x: number | null;
  y: number | null;
}

export interface ViewportRipple {
  x: number;
  y: number;
  startTime: number;
}

export interface CanvasViewport {
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  mouse: CanvasViewportMouse;
  ripples: ViewportRipple[];
  isVisible: boolean;
  reducedMotion: boolean;
<<<<<<< HEAD
=======
  quality: BackgroundQuality;
  performance: BackgroundPerformance;
>>>>>>> 2764c34 (333)
}

export function useCanvasViewport(interactions: { mouse?: boolean; click?: boolean } = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(true);
<<<<<<< HEAD
  const [reducedMotion, setReducedMotion] = useState(false);
=======
  const [backgroundPerformance, setBackgroundPerformance] = useState<BackgroundPerformance>(() =>
    getBackgroundPerformance()
  );
>>>>>>> 2764c34 (333)
  const mouseRef = useRef<CanvasViewportMouse>({ x: null, y: null });
  const ripplesRef = useRef<ViewportRipple[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
<<<<<<< HEAD
    setReducedMotion(reducedQuery.matches);
    const onReduced = () => setReducedMotion(reducedQuery.matches);
=======
    setBackgroundPerformance(getBackgroundPerformance());
    const onReduced = () => {
      const nextPerformance = getBackgroundPerformance();
      setBackgroundPerformance(nextPerformance);
      if (nextPerformance.reducedMotion) ripplesRef.current.length = 0;
    };
>>>>>>> 2764c34 (333)
    reducedQuery.addEventListener('change', onReduced);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
<<<<<<< HEAD
=======
      setBackgroundPerformance(getBackgroundPerformance());
>>>>>>> 2764c34 (333)
    };
    measure();
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 200);
    });
    ro.observe(el);

    const updateVis = () => {
      const rect = el.getBoundingClientRect();
      const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
      setIsVisible(!document.hidden && inViewport);
    };
    updateVis();
    const onVis = () => updateVis();
    const onScroll = () => updateVis();
<<<<<<< HEAD
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onVis);
=======
    const onWindowResize = () => {
      measure();
      updateVis();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onWindowResize);
>>>>>>> 2764c34 (333)

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };
    const onPointerDown = (e: PointerEvent) => {
<<<<<<< HEAD
=======
      if (reducedQuery.matches) return;
>>>>>>> 2764c34 (333)
      const rect = el.getBoundingClientRect();
      ripplesRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        startTime: performance.now() / 1000,
      });
<<<<<<< HEAD
=======
      if (ripplesRef.current.length > 12) ripplesRef.current.splice(0, ripplesRef.current.length - 12);
>>>>>>> 2764c34 (333)
    };

    if (interactions.mouse) {
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerleave', onPointerLeave);
    }
    if (interactions.click) {
      el.addEventListener('pointerdown', onPointerDown);
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      ro.disconnect();
      reducedQuery.removeEventListener('change', onReduced);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('scroll', onScroll);
<<<<<<< HEAD
      window.removeEventListener('resize', onVis);
=======
      window.removeEventListener('resize', onWindowResize);
>>>>>>> 2764c34 (333)
      if (interactions.mouse) {
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerleave', onPointerLeave);
      }
      if (interactions.click) {
        el.removeEventListener('pointerdown', onPointerDown);
      }
    };
  }, [interactions.mouse, interactions.click]);

  return {
    containerRef,
    width: size.width,
    height: size.height,
    mouse: mouseRef.current,
    ripples: ripplesRef.current,
    isVisible,
<<<<<<< HEAD
    reducedMotion,
=======
    reducedMotion: backgroundPerformance.reducedMotion,
    quality: backgroundPerformance.quality,
    performance: backgroundPerformance,
>>>>>>> 2764c34 (333)
  };
}
