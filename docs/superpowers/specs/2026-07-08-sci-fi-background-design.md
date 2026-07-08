# Sci-Fi Dynamic Background Design

**Date:** 2026-07-08

**Summary:** 为项目主页添加基于 WebGL2 裸写的科幻风动态粒子背景，支持鼠标交互、亮/暗模式适配、移动端降级。

---

## 技术选型

- **渲染方案**：裸 WebGL2（无 Three.js），手写 GLSL 着色器
- **体积**：目标 10-15KB gzipped
- **性能**：GPU 并行渲染，万级粒子 60fps
- **UI 承载**：React 组件（利用 `useEffect` 生命周期管理 canvas）
- **入口**：Astro 组件包裹 React 组件（`client:only="react"`）

---

## 文件结构

```
src/
  components/
    background/
      SciFiBackground.astro    # Astro 入口，主题检测、移动端检测、加载策略
      SciFiBackground.tsx      # React 组件，管理 canvas 生命周期和事件绑定
      sci-fi-renderer.ts       # WebGL2 渲染引擎核心
      sci-fi-shaders.ts        # GLSL 顶点着色器 + 片段着色器
      sci-fi-config.ts         # 粒子配置、颜色常量、设备检测
```

---

## 组件设计

### SciFiBackground.astro（入口）

- 通过客户端检测传入初始主题
- `client:only="react"` 渲染，仅在客户端运行
- 移动端检测：`< 768px` 传递 `mobile={true}`
- 内联 CSS：canvas 固定定位，`position: fixed; inset: 0; z-index: 0; pointer-events: none`

### SciFiBackground.tsx（React 生命周期）

- `useEffect` 中创建 canvas，挂载 SciFiRenderer
- 监听 `mousemove` / `click` 事件传给渲染器（监听在 body 层级）
- 监听 `resize` 重建画布
- 监听主题变化（MutationObserver 观察 `<html>` 的 `dark` class）
- 清理：组件卸载时释放 WebGL context、移除事件监听

### sci-fi-renderer.ts（渲染引擎）

- 初始化 WebGL2 context + 编译着色器程序
- 维护粒子 buffer（位置、速度、大小、透明度）
- 每帧更新：shader 计算粒子位置 + 绘制
- 暴露三个交互接口：
  - `setMouse(x, y)` — 鼠标吸引
  - `addTrail(x, y)` — 鼠标拖尾
  - `burst(x, y)` — 点击扰动
- FPS 监控 + 自适应降级

### sci-fi-shaders.ts（GLSL）

- **顶点着色器**：粒子位置更新（牛顿物理 + 鼠标吸引/扰动 + 噪声漂移），速度积分、阻尼
- **片段着色器**：圆形粒子 + 光晕（高斯衰减），粒子间连线

### sci-fi-config.ts（配置）

- 粒子数：桌面 300 / 移动端 120
- 控制流光线数量、连线距离阈值等

---

## 视觉效果设计

### 粒子星场

- 粒子以随机速度漂移（布朗运动 + 微弱惯性）
- 粒子大小 1-3px，中心亮、边缘羽化（片段着色器 soft circle）
- 粒子间距离 < 150px 时绘制半透明连线，越近越亮
- 亮色模式配色：粒子 `#0066cc` / 连线 `rgba(0,102,204,0.12)`
- 暗色模式配色：粒子 `#2997ff` / 连线 `rgba(41,151,255,0.15)`

### 流光线条

- 画布中 3-5 条流光线沿贝塞尔曲线缓慢游走
- 流光线 = 8-12 个密集粒子排成线状，首尾相接
- 运动：Lissajous 曲线 + 随机扰动
- 光线颜色比背景粒子更亮，带有微弱辉光
- 移动端减少到 1-2 条

### 鼠标交互

#### 吸引

- 鼠标周围 200px 半径内粒子被轻微拉向光标
- 吸引力与距离反比（近强远弱）
- 粒子不被吸附，只轻微偏向，保持氛围感

#### 拖尾

- 鼠标移动时留下 5-8 个短暂光点
- 光点初始亮度 0.6，2 秒内渐隐
- 移动端不做拖尾（无 hover 概念）

#### 点击扰动

- 点击位置产生环形冲击波
- 10-15 个粒子从点击点向外弹出，1.5 秒内消散
- 冲击波推开周围 150px 内的现有粒子
- 移动端触摸 → 点击触发扰动

---

## 集成方案

### 主页改动

- `SciFiBackground` 放在 `index.astro` 的 `<PageLayout>` 内第一个子元素
- canvas 固定定位 `position: fixed; inset: 0; z-index: 0; pointer-events: none`
- 删除 hero 中的 `<Image src={heroImage} ... />` 及相关 import
- 现有内容（Hero、Team、Timeline 等）在正常文档流中，天然位于 canvas 上方

### 内容层级

各 section 背景需确保透明或半透明，使动态背景可见。Hero 区域文字和按钮保持 `z-index: 1` 以上。

---

## 降级策略

### 移动端

- 粒子数降至 120
- 流光线减少到 1-2 条
- 连线距离阈值缩小
- 触摸交互：单指滑动 → 吸引，点击 → 扰动，不做拖尾

### 性能自适应

- 启动时检测前 3 秒平均 FPS
- 低于 45fps → 粒子数减半
- 低于 30fps → 关闭连线 + 流光，仅保留粒子漂移
- 每 30 秒尝试恢复原配置 2 秒，FPS 达标则升回

---

## 亮/暗模式

- 入口通过 `document.documentElement.classList.contains('dark')` 检测
- 监听主题切换（MutationObserver 观察 class 变化）
- 切换时 1 秒渐变过渡（uniform `uColorTransition`）
