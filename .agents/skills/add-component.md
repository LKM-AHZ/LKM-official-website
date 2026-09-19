# 添加组件

## 组件归属判断

| 组件类型                               | 放置位置                             | 说明                          |
| -------------------------------------- | ------------------------------------ | ----------------------------- |
| 通用基础组件（Button、Image、Form 等） | `src/components/primitives/`         | 无业务逻辑，可跨 feature 复用 |
| 复合/模式组件（TableOfContents 等）    | `src/components/patterns/`           | 组合多个 primitive 的通用模式 |
| 业务功能组件                           | `src/features/<feature>/components/` | 与特定业务模块耦合            |

## 步骤

1. 根据上表确定组件放置位置
2. 创建 `.astro` 文件（`.tsx` 用于需要客户端状态的 React 组件）
3. 遵循现有组件模式

## 基础组件模板

```astro
---
import { twMerge } from "tailwind-merge";
import type { SomeProps } from "~/types/core";

interface Props extends SomeProps {
  className?: string;
}
const { className, ...rest } = Astro.props;
---

<div class={twMerge('...', className)} {...rest}>
  <slot />
</div>
```

## 约定

- Props 使用 TypeScript 类型定义，继承自 `~/core/types`
- 使用 `class:list` 进行条件样式绑定
- 接收 `className` 覆写时使用 `twMerge()` 合并
- 布局组合使用具名插槽（named slots）
- 业务组件放在 `src/features/<feature>/` 下对应的目录
- 跨功能复用的通用组件放在 `src/components/primitives/` 或 `src/components/patterns/`
- Vue 交互组件使用 `.vue`；React 只用于现有编辑器边界，不为普通页面新增 React island
- 新增 `client:only` 组件时提供稳定的 `min-height` 容器，避免 CLS
- 完成后运行 `pnpm check` 和相关 Vitest；影响页面路由时再运行 Playwright 冒烟测试
