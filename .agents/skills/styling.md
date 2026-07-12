# Styling Guide

## Tailwind CSS v4 配置

所有 Tailwind 配置都在 `src/assets/styles/tailwind.css`：

### daisyUI 主题

项目使用 daisyUI v5，定义了两个主题：

| 主题        | 说明                |
| ----------- | ------------------- |
| `lkm-light` | 浅色主题（default） |
| `lkm-dark`  | 深色主题            |

两个主题都在 `tailwind.css` 里用 `@plugin "daisyui/theme"` 块声明，通过 CSS
变量（`--color-base-100`、`--color-primary` 等）定义配色。

### 主题切换机制

主题靠 `<html data-theme="lkm-light|lkm-dark">` 属性驱动：

- `ApplyColorMode.astro` 在页面加载时读取 `localStorage.theme` 并设置初始
  `data-theme`，避免 FOUC。
- `BasicScripts.astro` 处理运行时切换：点击主题按钮时更新 `data-theme` 与
  `localStorage.theme`（存 `'dark'` / `'light'`）。

`tailwind.css` 里注册了 `dark` 变体，映射到深色主题：

```css
@custom-variant dark (&:where([data-theme='lkm-dark'], [data-theme='lkm-dark'] *));
```

日常样式优先用 daisyUI 语义色 class（见下），一般无需再手写 `dark:` 前缀。

### 语义色 class

组件统一使用 daisyUI 语义色 class，两个主题自动适配：

| Class               | 用途                  |
| ------------------- | --------------------- |
| `bg-base-100`       | 页面主背景            |
| `bg-base-200`       | 次级背景（区块/卡片） |
| `bg-base-300`       | 更深一级背景          |
| `text-base-content` | 正文文本              |
| `text-neutral`      | 次要/弱化文本         |
| `text-primary`      | 强调文本              |
| `border-base-300`   | 分隔线/边框           |

避免硬编码 hex 色值；如需新配色，改主题块里的 CSS 变量而非在组件里写死。

### daisyUI 组件 class

按钮、表单等控件由 daisyUI 组件 class 提供，不再使用自定义 utility 或第三方
组件库：

`btn`、`input`、`textarea`、`checkbox`、`alert`、`badge` 等。

### 自定义 Utility

| Utility   | 用途                                |
| --------- | ----------------------------------- |
| `bg-page` | 页面背景（`--color-base-100` 别名） |
| `bg-dark` | 次级背景（`--color-base-200` 别名） |

这两个别名保留是因为仍被 JS / 条件类切换引用（`BasicScripts.astro` 移动菜单
header 背景、`WidgetWrapper.astro` 的 `isDark` 区块背景）。

### 滚动动画

自定义 `intersect` 变体，配合 IntersectionObserver 做入场动画：

```html
<div class="intersect-once intersect-quarter motion-safe:md:opacity-0 motion-safe:md:intersect:animate-fade"></div>
```

## 修改配色

编辑 `src/assets/styles/tailwind.css` 中对应主题（`lkm-light` / `lkm-dark`）块里
的 CSS 变量：

```css
@plugin "daisyui/theme" {
  name: 'lkm-light';
  --color-primary: #0066cc;
  --color-base-100: #ffffff;
  /* ... */
}
```

## 修改字体

1. 安装字体：`pnpm add @fontsource-variable/your-font`
2. 在入口导入：`import '@fontsource-variable/your-font'`
3. 更新 `tailwind.css` 里 `@theme` 的 `--font-sans` / `--font-heading`

## 新增主题颜色

1. 在两个主题块（`lkm-light` 与 `lkm-dark`）里都加对应 `--color-yourcolor`
2. 组件里以 `bg-yourcolor`、`text-yourcolor` 等语义 class 使用
