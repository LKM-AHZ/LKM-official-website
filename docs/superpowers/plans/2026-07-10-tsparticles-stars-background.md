# tsParticles 星空背景 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 tsParticles 官方 `stars` 预设为 Hero 区域添加星空浮游微光粒子背景。

**Architecture:** Astro wrapper 组件通过 Hero 的 `bg` slot 注入 React tsParticles 组件，粒子配置基于 `@tsparticles/preset-stars` 覆盖粒子数、颜色和交互，颜色跟随 `<html class="dark">` 响应暗色/亮色模式。

**Tech Stack:** `@tsparticles/react` + `@tsparticles/preset-stars`，AST: Astro React client:only

## Global Constraints

- pnpm 作为包管理器（`packageManager: pnpm@11.8.0`）
- Node >= 24.0.0
- TypeScript 严格模式
- 路径别名 `~/` 映射 `src/`
- 暗色模式通过 `<html class="dark">` 切换

---

### Task 1: 安装 tsParticles 依赖

**Files:** `package.json` + `pnpm-lock.yaml`（自动更新）

- [ ] **Step 1: 安装 @tsparticles/react 和 @tsparticles/preset-stars**

```bash
cd C:/Project/LKM-official-website && pnpm add @tsparticles/react @tsparticles/preset-stars
```

Expected: 成功安装，无错误

- [ ] **Step 2: 验证安装**

```bash
cd C:/Project/LKM-official-website && pnpm ls @tsparticles/react @tsparticles/preset-stars
```

Expected: 显示两个包的版本号

---

### Task 2: 创建 ParticleBackground React 组件

**Files:**
- Create: `src/components/background/ParticleBackground.tsx`

**Interfaces:**
- Consumes: `@tsparticles/react` 的 `Particles`，`@tsparticles/preset-stars` 的 `loadStarsPreset`
- Produces: 默认导出 React 组件，无 props（内部自行检测主题和视口）

- [ ] **Step 1: 编写 ParticleBackground.tsx**

```tsx
import { Particles } from "@tsparticles/react";
import {
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from "@tsparticles/engine";
import { loadStarsPreset } from "@tsparticles/preset-stars";
import { useCallback, useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

function getIsDark(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

function getIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export default function ParticleBackground() {
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsDark(getIsDark());
    setIsMobile(getIsMobile());

    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const particlesInit = useCallback(async (engine: any) => {
    await loadStarsPreset(engine);
  }, []);

  const options: ISourceOptions = {
    preset: "stars",
    fullScreen: false,
    particles: {
      number: {
        value: isMobile ? 40 : 70,
      },
      color: {
        value: isDark ? ["#2997ff", "#ffffff"] : ["#f59e0b", "#fbbf24"],
      },
      move: {
        enable: true,
        speed: 0.3,
        direction: MoveDirection.none,
        random: true,
        straight: false,
        outModes: {
          default: OutMode.bounce,
        },
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
        onClick: {
          enable: true,
          mode: "repulse",
        },
      },
      modes: {
        grab: {
          distance: 140,
          links: {
            opacity: 0,
          },
        },
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    },
  };

  return (
    <Particles
      id="tsparticles"
      options={options}
      init={particlesInit}
    />
  );
}
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
cd C:/Project/LKM-official-website && pnpm astro check
```

Expected: 无错误

---

### Task 3: 创建 ParticleBackground Astro 包装组件

**Files:**
- Create: `src/components/background/ParticleBackground.astro`

**Interfaces:**
- Consumes: `ParticleBackground.tsx`
- Produces: Astro 组件，client:only="react"

- [ ] **Step 1: 编写 ParticleBackground.astro**

```astro
---
import ParticleBackgroundReact from "./ParticleBackground";
---

<div
  class="absolute inset-0 z-0"
  style="pointer-events: none;"
>
  <div style="pointer-events: auto; position: absolute; inset: 0;">
    <ParticleBackgroundReact client:only="react" />
  </div>
</div>
```

- [ ] **Step 2: 运行 astro check**

```bash
cd C:/Project/LKM-official-website && pnpm astro check
```

Expected: 无错误

---

### Task 4: 在首页 Hero 中集成

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `ParticleBackground.astro`

- [ ] **Step 1: 添加 import**

在 `src/pages/index.astro` 中，`import Hero from '~/components/widgets/Hero.astro';` 之后添加：

```astro
import ParticleBackground from '~/components/background/ParticleBackground.astro';
```

- [ ] **Step 2: 在 Hero 中添加 bg slot**

在 `<Hero` 开始标签之后，其他 slot 之前添加：

```astro
    <Fragment slot="bg">
      <ParticleBackground />
    </Fragment>
```

- [ ] **Step 3: 运行 astro check 验证**

```bash
cd C:/Project/LKM-official-website && pnpm astro check
```

Expected: Pass

- [ ] **Step 4: 运行 astro build 验证**

```bash
cd C:/Project/LKM-official-website && pnpm astro build
```

Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
cd C:/Project/LKM-official-website && git add -f src/components/background/ParticleBackground.astro src/components/background/ParticleBackground.tsx src/pages/index.astro pnpm-lock.yaml package.json && git commit -m "$(cat <<'EOF'
feat: replace WebGL background with tsParticles stars preset

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```
