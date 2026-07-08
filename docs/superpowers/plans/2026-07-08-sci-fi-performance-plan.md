# Sci-Fi 背景性能优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首页 Sci-Fi WebGL 动态背景仅在首屏（1 视口高度）可见时运行渲染循环，滚出后停止 GPU/CPU 消耗。

**Architecture:** 在 `SciFiBackground.tsx` 中渲染一个哨兵 `<div>`（定位 `top: 100vh`），用 IntersectionObserver 观察其可见性，控制 `SciFiRenderer.start()` / `stop()`。渲染器已有 start/stop 方法，无需修改。

**Tech Stack:** React 19, IntersectionObserver API, TypeScript

## Global Constraints

- 不改动 `sci-fi-renderer.ts`、`sci-fi-shaders.ts`、`sci-fi-config.ts`、`SciFiBackground.astro`、`index.astro`
- 仅修改 `SciFiBackground.tsx`
- 哨兵定位：`top: 100vh; height: 1px`，CSS fixed 定位
- 初始化默认启动渲染，Observer 注册后立即接管

---

### Task 1: 添加哨兵元素和 IntersectionObserver

**Files:**
- Modify: `src/components/background/SciFiBackground.tsx`

**Interfaces:**
- Produces: `SciFiBackground` 组件新增一个透明哨兵 div + IntersectionObserver，哨兵可见时调用 `renderer.start()`，离开时调用 `renderer.stop()`

- [ ] **Step 1: 修改 SciFiBackground.tsx，添加哨兵 div 和 IntersectionObserver**

修改 `src/components/background/SciFiBackground.tsx`，在初始化 useEffect 内添加 IntersectionObserver，在 return 中添加哨兵 div。

**当前文件需要修改的部分：**

在初始化 useEffect 中（`renderer.start()` 调用之后），添加 observer 逻辑：

```tsx
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

  document.body.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.body.addEventListener('click', handleClick, { passive: true });

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
      renderer.setMouse(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length > 0) {
      renderer.click(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  };
  document.body.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.body.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    renderer.destroy();
    rendererRef.current = null;
    document.body.removeEventListener('mousemove', handleMouseMove);
    document.body.removeEventListener('click', handleClick);
    window.removeEventListener('resize', handleResize);
    document.body.removeEventListener('touchmove', handleTouchMove);
    document.body.removeEventListener('touchend', handleTouchEnd);
  };
}, []);
```

改为：

```tsx
// 哨兵 ref
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

  document.body.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.body.addEventListener('click', handleClick, { passive: true });

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
      renderer.setMouse(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length > 0) {
      renderer.click(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
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
    document.body.removeEventListener('mousemove', handleMouseMove);
    document.body.removeEventListener('click', handleClick);
    window.removeEventListener('resize', handleResize);
    document.body.removeEventListener('touchmove', handleTouchMove);
    document.body.removeEventListener('touchend', handleTouchEnd);
  };
}, []);
```

在 return 中，canvas 之后添加哨兵 div：

当前 return：
```tsx
return (
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
);
```

改为：
```tsx
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
```

- [ ] **Step 2: 验证构建通过**

```bash
pnpm run build
```

Expected: 构建成功，无 TypeScript 错误。

- [ ] **Step 3: 提交**

```bash
git add src/components/background/SciFiBackground.tsx
git commit -m "perf: pause WebGL background when scrolled past viewport height

Use IntersectionObserver on a sentinel element at 100vh to stop/start
the SciFiRenderer render loop, eliminating GPU/CPU usage below the fold.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Self-Review

1. **Spec coverage:** Spec 只有一个需求——首屏可见时运行，滚出后停止。Task 1 完整实现。
2. **Placeholder scan:** 无 TBD/TODO，无模糊描述。
3. **Type consistency:** `sentinelRef` 在同一个 task 中定义和使用，无跨 task 不一致风险。
