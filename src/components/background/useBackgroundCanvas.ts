import { useEffect, useRef } from 'react';

export interface Ripple {
  x: number;
  y: number;
  startTime: number;
}

export interface BackgroundMouse {
  x: number | null;
  y: number | null;
  isDown: boolean;
}

export interface BackgroundFrame {
  ctx: CanvasRenderingContext2D;
  width: number; // CSS 像素
  height: number;
  dpr: number;
  mouse: BackgroundMouse;
  ripples: Ripple[];
  keys: { shift: boolean };
  time: number; // 秒，自启动累计；暂停期不增长
  delta: number; // 距上一帧秒数
}

export interface BackgroundInteractions {
  mouse?: boolean;
  click?: boolean;
  keys?: boolean;
}

export interface UseBackgroundCanvasOptions {
  draw: (frame: BackgroundFrame) => void;
  init?: (canvas: HTMLCanvasElement, frame: BackgroundFrame) => void | (() => void);
  interactions?: BackgroundInteractions;
  maxDpr?: number;
}

const DEFAULT_MAX_DPR = 1.5;

export function useBackgroundCanvas({
  draw,
  init,
  interactions = {},
  maxDpr = DEFAULT_MAX_DPR,
}: UseBackgroundCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<BackgroundFrame | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const initCleanupRef = useRef<(() => void) | void>(undefined);
  const didMountRef = useRef(false);

  // 保存最新 draw/init 引用，避免 effect 依赖抖动
  const drawRef = useRef(draw);
  const initRef = useRef(init);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);
  useEffect(() => {
    initRef.current = init;
  }, [init]);

  // init 挂载点（init 变化时重跑）
  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    initCleanupRef.current?.();
    initCleanupRef.current = initRef.current?.(canvas, frame);
    return () => {
      initCleanupRef.current?.();
      initCleanupRef.current = undefined;
    };
  }, [init]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const frame: BackgroundFrame = {
      ctx,
      width: 0,
      height: 0,
      dpr,
      mouse: { x: null, y: null, isDown: false },
      ripples: [],
      keys: { shift: false },
      time: 0,
      delta: 0,
    };
    frameRef.current = frame;

    let isVisible = !document.hidden;
    let isInViewport = true;

    const resize = () => {
      // fixed 定位 + 100vw/100vh，直接取 window 尺寸
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * frame.dpr));
      canvas.height = Math.max(1, Math.round(h * frame.dpr));
      frame.width = w;
      frame.height = h;
      ctx.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0);
    };
    resize();

    // Run init after resize so frame.width/height and canvas dimensions are correct.
    initCleanupRef.current = initRef.current?.(canvas, frame);

    // window resize 监听
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const updatePause = () => {
      pausedRef.current = !(isVisible && isInViewport);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) isInViewport = e.isIntersecting;
        updatePause();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      isVisible = !document.hidden;
      updatePause();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // 鼠标/触摸事件（canvas 局部坐标）
    const useMouse = !!interactions.mouse;
    const useClick = !!interactions.click;
    const useKeys = !!interactions.keys;

    const getCanvasPos = (e: PointerEvent) => {
      return {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const pos = getCanvasPos(e);
      frame.mouse.x = pos.x;
      frame.mouse.y = pos.y;
    };
    const onPointerDown = (e: PointerEvent) => {
      const pos = getCanvasPos(e);
      frame.mouse.x = pos.x;
      frame.mouse.y = pos.y;
      frame.mouse.isDown = true;
      if (useClick) {
        frame.ripples.push({ x: pos.x, y: pos.y, startTime: frame.time });
      }
    };
    const onPointerUp = () => {
      frame.mouse.isDown = false;
    };
    const onPointerLeave = () => {
      frame.mouse.x = null;
      frame.mouse.y = null;
      frame.mouse.isDown = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') frame.keys.shift = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') frame.keys.shift = false;
    };

    if (useMouse) {
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }
    if (useClick || useMouse) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup', onPointerUp);
    }
    if (useKeys) {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
    }

    // rAF 循环
    startTimeRef.current = performance.now();
    lastFrameRef.current = startTimeRef.current;
    pausedElapsedRef.current = 0;
    let pausedStart: number | null = null;

    const loop = (now: number) => {
      rafIdRef.current = requestAnimationFrame(loop);
      if (pausedRef.current) {
        if (pausedStart === null) pausedStart = now;
        lastFrameRef.current = now;
        return;
      }
      if (pausedStart !== null) {
        pausedElapsedRef.current += now - pausedStart;
        pausedStart = null;
      }
      frame.time = (now - startTimeRef.current - pausedElapsedRef.current) / 1000;
      frame.delta = Math.min((now - lastFrameRef.current) / 1000, 0.1);
      lastFrameRef.current = now;

      // Consume ripples produced since last frame; each frame's component sees one batch.
      const ripplesBatch = frame.ripples;
      frame.ripples = [];
      drawRef.current({ ...frame, ripples: ripplesBatch });
    };
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (useMouse) {
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
      }
      if (useClick || useMouse) {
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointerup', onPointerUp);
      }
      if (useKeys) {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      }
      initCleanupRef.current?.();
      initCleanupRef.current = undefined;
      frameRef.current = null;
    };
    // interactions 视为不可变配置；变化时整体重建
  }, [maxDpr, interactions.mouse, interactions.click, interactions.keys]);

  return { canvasRef };
}
