# Styling Guide

## Tailwind CSS v4 配置

Tailwind 入口是 `src/styles/tailwind.css`，使用 CSS-first 配置方式（`@import 'tailwindcss'`），通过 `@theme` 块定义设计令牌。共享变量另见 `src/styles/variables.css`。

### 暗色模式

暗色模式通过 `.dark` 类切换：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

主题切换逻辑由 `shell` feature 中的组件负责，在页面加载时读取 `localStorage.theme` 并设置初始状态，运行时通过按钮切换。

### 语义色 Token

在 `@theme` 块中通过 CSS 变量暴露语义色：

| Token                  | 用途          |
| ---------------------- | ------------- |
| `--color-base-100`     | 页面主背景    |
| `--color-base-200`     | 次级背景      |
| `--color-base-300`     | 更深一级背景  |
| `--color-base-content` | 正文文本      |
| `--color-neutral`      | 中性/弱化文本 |
| `--color-primary`      | 主题色        |
| `--color-secondary`    | 辅助色        |
| `--color-info`         | 信息色        |
| `--color-success`      | 成功色        |
| `--color-warning`      | 警告色        |
| `--color-error`        | 错误色        |
| `--color-card-bg`      | 卡片背景      |
| `--color-page-bg`      | 页面背景      |
| `--color-surface-3`    | 分割线/边框   |
| `--color-deep-text`    | 深色文字      |
| `--color-text-muted`   | 禁用/弱化文字 |

避免硬编码 hex 色值；如需新配色，修改 CSS 变量。

### 组件 Class

按钮等控件由 Tailwind CSS v4 的 `@layer components` 在 `tailwind.css` 中定义（不再依赖 daisyUI 组件 class）：`btn`、`btn-primary`、`btn-ghost`、`btn-outline`、`btn-sm`、`btn-lg` 等。

### 自定义 Utility

在 `tailwind.css` 中通过 `@utility` 定义的项目级工具类：

| Utility        | 用途                      |
| -------------- | ------------------------- |
| `profile-card` | 团队成员/项目团队卡片样式 |
| `card-hover`   | 卡片悬浮动效              |

### 滚动动画

自定义 `intersect` 变体，配合 IntersectionObserver 做入场动画：

```html
<div
  class="intersect-once intersect-quarter motion-safe:md:opacity-0 motion-safe:md:intersect:animate-fade"
></div>
```

## 修改配色

编辑 `src/styles/tailwind.css` 与 `src/styles/variables.css` 中对应的语义变量。修改前先搜索变量的现有定义和使用位置，避免建立第二套 token。

## 修改字体

1. 安装字体：`pnpm add @fontsource-variable/your-font`
2. 在入口导入：`import '@fontsource-variable/your-font'`
3. 更新 `tailwind.css` 里 `@theme` 的 `--font-sans` / `--font-heading`

## 新增主题颜色

1. 在 `@theme` 块中添加 `--color-yourcolor: var(--yourcolor)`
2. 组件里以 `bg-yourcolor`、`text-yourcolor` 等语义 class 使用
