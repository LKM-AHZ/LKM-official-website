# Sci-Fi 背景性能优化 —— 首屏可见时运行

**日期**: 2026-07-08  
**状态**: 已确认

---

## 目标

当前 WebGL 动态背景（`SciFiBackground`）在首页持续运行，离开首屏后依然消耗 GPU/CPU。优化为：**仅在首屏（约 1 视口高度）可见时运行渲染循环，滚出后停止**。

## 方案

不改动渲染器、着色器、配置文件。仅在 `SciFiBackground.tsx` 中通过 IntersectionObserver 控制 `SciFiRenderer.start()` / `stop()`。

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/background/SciFiBackground.tsx` | 添加哨兵元素 + IntersectionObserver |

`SciFiRenderer` 已有 `start()` / `stop()` 方法，无需修改。

### 实现要点

1. **哨兵元素**：在 canvas 同级渲染一个透明 div，CSS 定位 `top: 100vh; height: 1px; position: fixed; z-index: -1`
2. **IntersectionObserver**：观察哨兵
   - 哨兵进入视口（`isIntersecting = true`）→ `renderer.start()`
   - 哨兵离开视口 → `renderer.stop()`
3. **初始化**：挂载时默认启动（页面加载时 Hero 在视口内），Observer 在 `useEffect` 中注册后立即接管
4. **清理**：组件卸载时 observer 断开，renderer 正常 destroy

### 边缘情况

- 窗口 resize 后视口高度变化：哨兵使用百分比定位 (`top: 100vh`)，自动适配
- 快速滚动：Observer 触发多次 start/stop，`start()` 内已有 `rafId` 防重复保护，`stop()` 有 `cancelAnimationFrame` 幂等
- Safari/iOS 兼容：IntersectionObserver 全平台支持（iOS 12.2+）

## 不在范围内

- 不改动着色器代码
- 不改动 sci-fi-config.ts / sci-fi-renderer.ts
- 不改动 SciFiBackground.astro
- 不改动 index.astro
- 不添加复杂加载动画
