# tsParticles 星空背景 — 设计规格

## 概述

用 tsParticles 官方 `stars` 预设替换已删除的自定义 WebGL 背景，为 Hero 区域提供星空浮游微光效果。

## 技术选型

- `@tsparticles/react`：React 组件包装器
- `@tsparticles/preset-stars`：官方星空预设，自带圆形粒子、随机闪烁、缓慢移动
- 通过 `client:only="react"` 嵌入 Astro 页面

## 粒子效果

| 属性 | 值 |
|---|---|
| 预设 | `stars` |
| 粒子数 | desktop: 70, mobile (<768px): 40 |
| 形状 | 圆形，默认 glow 发光效果由 preset 提供 |
| 颜色 | 暗色模式: `#2997ff` / `#ffffff`；亮色模式: 暖色调 |
| 连线 | 无（preset stars 默认无连线） |
| 鼠标悬停 | `grab` — 鼠标附近粒子微微吸引 |
| 鼠标点击 | `repulse` — 粒子向外扩散涟漪 |
| 响应式 | `window.innerWidth < 768` 减半粒子数 |
| 主题适配 | `MutationObserver` 监听 `<html class="dark">` 变化 |

## 文件结构

```
src/components/background/
├── ParticleBackground.astro   # Astro wrapper，client:only="react"
├── ParticleBackground.tsx     # React 组件，加载 stars 预设并覆盖配置
```

## CSS 隔离

tsParticles 创建的 `<canvas>` 是 React 生成的 DOM，不自动获得 Astro scoped class。隔离策略：

- `ParticleBackground.astro` 用 Tailwind 类将 wrapper 设为 `absolute inset-0 z-0`，继承 Hero `bg` slot 的已有约束
- 无需自定义 `<style>`，完全通过 Tailwind 和 Hero 已有的 `absolute inset-0 z-0` 容器双重约束
- Canvas `pointer-events: none` 防止拦截 Hero 内容的点击

## 架构

```
index.astro
  └─ Hero (bg slot)
       └─ ParticleBackground.astro
            └─ ParticleBackground.tsx
                 └─ @tsparticles/react (Stars preset)
```

`ParticleBackground.astro` 仅做一行渲染，`ParticleBackground.tsx` 负责：
- 初始化 tsParticles，加载 stars 预设
- 从头加载 `options` 预设，覆盖粒子数、颜色、交互配置
- 通过 `MutationObserver` 监听 `<html>` class 变化，动态切换粒子颜色
- 响应 resize，切换 mobile/desktop 粒子数

## 使用方式

在 `index.astro` Hero 的 `bg` slot 中：

```astro
<Fragment slot="bg">
  <ParticleBackground />
</Fragment>
```

## 边界条件

- 浏览器不支持 WebGL/Canvas：tsParticles 自动降级，无报错
- 暗色/亮色模式切换：粒子颜色实时切换，无闪烁
- 窗口缩放：响应式粒子数切换，resize debounce
- 组件卸载：清理 observer 和事件监听
