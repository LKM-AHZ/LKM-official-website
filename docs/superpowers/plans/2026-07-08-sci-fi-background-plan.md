# Sci-Fi Dynamic Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为项目主页添加基于 WebGL2 裸写的科幻风动态粒子背景，支持鼠标交互、亮/暗模式适配、移动端降级。

**Architecture:** 5 个源文件组成 `src/components/background/` 目录。Astro 入口检测设备/主题并注入 React 组件，React 组件管理 canvas 生命周期，TypeScript 模块封装 WebGL2 渲染引擎（GLSL shader + 粒子物理 + FPS 监控）。主页 `index.astro` 引入组件并移除 hero 图片。

**Tech Stack:** Astro v6 + React 19 + TypeScript 5.9 + WebGL2 (GLSL 3.00 ES) + Tailwind CSS v4

## Global Constraints

- WebGL2 裸写，零依赖引入（不引入 Three.js 等库）
- 目标体积：核心逻辑 10-15KB gzipped
- 桌面 60fps，移动端降级但不移除效果
- 亮/暗模式各一套配色
- canvas `pointer-events: none`，鼠标事件在 body 层级监听
- 粒子数：桌面 300 / 移动端 120

---

### Task 1: 创建配置模块 `sci-fi-config.ts`

**Files:**
- Create: `src/components/background/sci-fi-config.ts`

**Interfaces:**
- Produces:
  - `COLORS` — `{ light: { bg, particle, line, glow, accent }, dark: { ... } }`
  - `PARTICLE_COUNT` — `{ desktop: number, mobile: number }`
  - `FLOW_LINE_COUNT` — `{ desktop: number, mobile: number }`
  - `LINK_DISTANCE` — `{ desktop: number, mobile: number }`
  - `MOUSE_ATTRACT_RADIUS: number`
  - `TRAIL_COUNT: number` / `TRAIL_LIFETIME: number`
  - `BURST_COUNT: number` / `BURST_LIFETIME: number` / `BURST_RADIUS: number`
  - `MOBILE_BREAKPOINT: number`
  - `FPS_ADAPTIVE` — `{ sampleDuration, downgrade45, downgrade30, recoveryInterval, recoveryDuration }`

- [ ] **Step 1: 创建配置模块**

```typescript
// src/components/background/sci-fi-config.ts

/** 亮色 / 暗色配色 */
export const COLORS = {
  light: {
    bg: [1.0, 1.0, 1.0, 1.0], // #ffffff
    particle: [0.0, 0.4, 0.8, 1.0], // #0066cc
    line: [0.0, 0.4, 0.8, 0.12], // rgba(0,102,204,0.12)
    glow: [0.0, 0.4, 0.8, 0.25],
    accent: [0.0, 0.44, 0.89, 1.0], // #0071e3 流光线
  },
  dark: {
    bg: [0.0, 0.0, 0.0, 1.0], // #000000
    particle: [0.16, 0.59, 1.0, 1.0], // #2997ff
    line: [0.16, 0.59, 1.0, 0.15], // rgba(41,151,255,0.15)
    glow: [0.16, 0.59, 1.0, 0.3],
    accent: [0.16, 0.59, 1.0, 0.8],
  },
} as const;

/** 粒子数量 */
export const PARTICLE_COUNT = {
  desktop: 300,
  mobile: 120,
} as const;

/** 流光线数量 */
export const FLOW_LINE_COUNT = {
  desktop: 4,
  mobile: 2,
} as const;

/** 粒子间连线距离阈值 */
export const LINK_DISTANCE = {
  desktop: 150,
  mobile: 100,
} as const;

/** 鼠标吸引半径 (px) */
export const MOUSE_ATTRACT_RADIUS = 200;

/** 鼠标拖尾参数 */
export const TRAIL_COUNT = 6;
export const TRAIL_LIFETIME = 2000; // ms

/** 点击扰动参数 */
export const BURST_COUNT = 12;
export const BURST_LIFETIME = 1500; // ms
export const BURST_RADIUS = 150; // px

/** 移动端断点 */
export const MOBILE_BREAKPOINT = 768;

/** FPS 自适应 */
export const FPS_ADAPTIVE = {
  sampleDuration: 3000, // 启动采样时长 ms
  downgrade45: 0.5, // 低于 45fps → 粒子数倍率
  downgrade30: 0.25, // 低于 30fps → 粒子数倍率
  recoveryInterval: 30000, // 恢复检测间隔 ms
  recoveryDuration: 2000, // 恢复检测时长 ms
} as const;
```

- [ ] **Step 2: 验证类型检查通过**

```bash
cd "C:\Project\LKM-official-website" && npx tsc --noEmit --strict src/components/background/sci-fi-config.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/components/background/sci-fi-config.ts
git commit -m "feat: add sci-fi background config module

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: 创建 GLSL 着色器模块 `sci-fi-shaders.ts`

**Files:**
- Create: `src/components/background/sci-fi-shaders.ts`

**Interfaces:**
- Produces:
  - `VERTEX_SHADER: string` — GLSL 顶点着色器源码
  - `FRAGMENT_SHADER: string` — GLSL 片段着色器源码

- [ ] **Step 1: 创建着色器模块**

```typescript
// src/components/background/sci-fi-shaders.ts

export const VERTEX_SHADER = `#version 300 es
precision highp float;

// ── per-vertex attributes ──
in vec2 a_position;      // 粒子当前位置 (x, y)
in vec2 a_velocity;       // 粒子速度
in float a_size;          // 粒子大小
in float a_alpha;         // 基础透明度
in float a_type;          // 0=background, 1=trail, 2=burst, 3=flowline

// ── uniforms ──
uniform vec2 u_resolution;    // 画布分辨率
uniform float u_time;         // 运行时间 (秒)
uniform vec2 u_mouse;         // 鼠标位置 (px)
uniform float u_mouseDown;    // 点击状态
uniform float u_dt;           // 帧间隔 (秒)

// ── outputs to fragment shader ──
out float v_alpha;
out float v_type;
out float v_size;

// ── 伪随机 ──
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  // 指数衰减速度 (阻尼)
  vec2 vel = a_velocity * exp(-0.5 * u_dt);

  // 鼠标吸引: 距离平方反比
  vec2 toMouse = u_mouse - a_position;
  float distToMouse = length(toMouse);
  float attractStrength = 0.0;
  if (distToMouse < 200.0 && distToMouse > 0.01) {
    attractStrength = (200.0 - distToMouse) / 200.0 * 40.0;
    vel += normalize(toMouse) * attractStrength * u_dt;
  }

  // 点击扰动: 推开周围粒子
  if (u_mouseDown > 0.5 && distToMouse < 150.0 && distToMouse > 0.01) {
    vel -= normalize(toMouse) * (150.0 - distToMouse) / 150.0 * 200.0 * u_dt;
  }

  // 布朗噪声漂移
  float noiseX = hash(gl_VertexID * 1.3 + u_time * 0.7) - 0.5;
  float noiseY = hash(gl_VertexID * 2.1 + u_time * 0.6) - 0.5;
  vel += vec2(noiseX, noiseY) * 30.0 * u_dt;

  // 速度钳制
  float speed = length(vel);
  if (speed > 60.0) {
    vel = vel / speed * 60.0;
  }

  // 更新位置
  vec2 pos = a_position + vel * u_dt;

  // 循环边界
  pos = mod(pos + u_resolution, u_resolution);

  // NDC 转换
  vec2 ndc = (pos / u_resolution) * 2.0 - 1.0;
  ndc.y = -ndc.y; // flip Y

  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = a_size;

  v_alpha = a_alpha;
  v_type = a_type;
  v_size = a_size;
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in float v_alpha;
in float v_type;
in float v_size;

uniform vec4 u_color;       // 当前主题颜色
uniform vec4 u_glowColor;   // 光晕颜色
uniform vec3 u_lineColor;   // 连线颜色 (仅用于连线，碎片着色器绘制粒子本身)

out vec4 fragColor;

void main() {
  // 圆形粒子 with soft edge
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  float radius = 0.5;

  // soft circle: 中心不透明, 边缘羽化
  float alpha = 1.0 - smoothstep(radius * 0.6, radius, dist);

  // 光晕: 更大范围的柔和渐变
  float glow = exp(-dist * 6.0) * 0.4;

  float finalAlpha = (alpha + glow) * v_alpha;

  // 混合主色与光晕色
  vec3 color = mix(u_color.rgb, u_glowColor.rgb, glow);

  // trail 粒子偏亮
  if (abs(v_type - 1.0) < 0.01) {
    color = mix(color, vec3(1.0), 0.4);
    finalAlpha *= 1.2;
  }

  // burst 粒子偏亮且偏大
  if (abs(v_type - 2.0) < 0.01) {
    color = mix(color, vec3(1.0), 0.6);
    finalAlpha *= 1.3;
  }

  // flowline 粒子更亮
  if (abs(v_type - 3.0) < 0.01) {
    color = mix(color, vec3(1.0), 0.5);
    finalAlpha *= 1.4;
  }

  if (finalAlpha < 0.01) discard;

  fragColor = vec4(color, clamp(finalAlpha, 0.0, 1.0));
}
`;
```

- [ ] **Step 2: 验证类型检查通过**

```bash
cd "C:\Project\LKM-official-website" && npx tsc --noEmit src/components/background/sci-fi-shaders.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/components/background/sci-fi-shaders.ts
git commit -m "feat: add WebGL2 shaders for sci-fi background

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: 创建 WebGL2 渲染引擎 `sci-fi-renderer.ts`

**Files:**
- Create: `src/components/background/sci-fi-renderer.ts`

**Interfaces:**
- Consumes: `COLORS`, `PARTICLE_COUNT`, `FLOW_LINE_COUNT`, `LINK_DISTANCE`, `MOUSE_BREAKPOINT`, `FPS_ADAPTIVE` from `sci-fi-config`, `VERTEX_SHADER`, `FRAGMENT_SHADER` from `sci-fi-shaders`
- Produces:
  - `class SciFiRenderer` with methods:
    - `constructor(canvas: HTMLCanvasElement, isMobile: boolean)`
    - `setTheme(dark: boolean): void`
    - `start(): void`
    - `stop(): void`
    - `setMouse(x: number, y: number): void`
    - `click(x: number, y: number): void`
    - `destroy(): void`

- [ ] **Step 1: 创建渲染引擎**

```typescript
// src/components/background/sci-fi-renderer.ts

import { COLORS, FPS_ADAPTIVE, FLOW_LINE_COUNT, LINK_DISTANCE } from './sci-fi-config';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './sci-fi-shaders';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: number; // 0=bg, 1=trail, 2=burst, 3=flowline
  life: number; // 剩余生命 ms
  maxLife: number;
}

interface FlowLine {
  particles: Particle[];
  cx: number; // Lissajous 相位偏移
  cy: number;
  speed: number;
}

export class SciFiRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buffer: WebGLBuffer;
  private isDark = false;
  private isMobile: boolean;
  private rafId = 0;
  private mouseX = 0;
  private mouseY = 0;
  private mouseDown = false;
  private lastTime = 0;

  // 粒子数据
  private bgParticles: Particle[] = [];
  private trails: Particle[] = [];
  private bursts: Particle[] = [];
  private flowLines: FlowLine[] = [];

  // FPS 自适应
  private frameCount = 0;
  private fpsAccum = 0;
  private currentFps = 60;
  private adaptiveScale = 1.0;
  private lastRecoveryCheck = 0;
  private recoveryFrames = 0;
  private recoveryFpsAccum = 0;
  private inRecovery = false;

  // uniform locations
  private uResolution: WebGLUniformLocation;
  private uTime: WebGLUniformLocation;
  private uMouse: WebGLUniformLocation;
  private uMouseDown: WebGLUniformLocation;
  private uDt: WebGLUniformLocation;
  private uColor: WebGLUniformLocation;
  private uGlowColor: WebGLUniformLocation;
  private uLineColor: WebGLUniformLocation;

  constructor(canvas: HTMLCanvasElement, isMobile: boolean) {
    this.canvas = canvas;
    this.isMobile = isMobile;

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false });
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;

    this.program = this.compileProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    // 设置 attributes
    this.setupAttributes();

    // 获取 uniform locations
    this.uResolution = gl.getUniformLocation(this.program, 'u_resolution')!;
    this.uTime = gl.getUniformLocation(this.program, 'u_time')!;
    this.uMouse = gl.getUniformLocation(this.program, 'u_mouse')!;
    this.uMouseDown = gl.getUniformLocation(this.program, 'u_mouseDown')!;
    this.uDt = gl.getUniformLocation(this.program, 'u_dt')!;
    this.uColor = gl.getUniformLocation(this.program, 'u_color')!;
    this.uGlowColor = gl.getUniformLocation(this.program, 'u_glowColor')!;
    this.uLineColor = gl.getUniformLocation(this.program, 'u_lineColor')!;

    this.initParticles();
    this.initFlowLines();
  }

  private compileProgram(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;

    const vShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vShader, vs);
    gl.compileShader(vShader);
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
      throw new Error(`Vertex shader: ${gl.getShaderInfoLog(vShader)}`);
    }

    const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fShader, fs);
    gl.compileShader(fShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
      throw new Error(`Fragment shader: ${gl.getShaderInfoLog(fShader)}`);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program: ${gl.getProgramInfoLog(program)}`);
    }

    gl.deleteShader(vShader);
    gl.deleteShader(fShader);

    return program;
  }

  private setupAttributes(): void {
    const gl = this.gl;
    const stride = 7 * Float32Array.BYTES_PER_ELEMENT; // x,y, vx,vy, size, alpha, type

    // a_position
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);

    // a_velocity
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

    // a_size
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);

    // a_alpha
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 5 * Float32Array.BYTES_PER_ELEMENT);

    // a_type
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);
  }

  private createParticle(overrides: Partial<Particle> = {}): Particle {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.3 + Math.random() * 0.5,
      type: 0,
      life: Infinity,
      maxLife: Infinity,
      ...overrides,
    };
  }

  private initParticles(): void {
    const count = this.particleCount();
    this.bgParticles = [];
    for (let i = 0; i < count; i++) {
      this.bgParticles.push(this.createParticle());
    }
  }

  private initFlowLines(): void {
    const count = this.isMobile ? FLOW_LINE_COUNT.mobile : FLOW_LINE_COUNT.desktop;
    this.flowLines = [];
    for (let i = 0; i < count; i++) {
      const segmentCount = 10;
      const line: FlowLine = {
        particles: [],
        cx: Math.random() * Math.PI * 2,
        cy: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
      };
      for (let j = 0; j < segmentCount; j++) {
        line.particles.push(
          this.createParticle({
            type: 3,
            alpha: 0.5 + (1 - j / segmentCount) * 0.4,
            size: 2.5 + (1 - j / segmentCount) * 2,
          })
        );
      }
      this.flowLines.push(line);
    }
  }

  private particleCount(): number {
    const base = this.isMobile ? 120 : 300;
    return Math.max(30, Math.floor(base * this.adaptiveScale));
  }

  setTheme(dark: boolean): void {
    this.isDark = dark;
  }

  start(): void {
    this.lastTime = performance.now();
    this.lastRecoveryCheck = this.lastTime;
    const loop = (now: number) => {
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.update(dt);
      this.draw();
      this.updateFps(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  setMouse(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;

    // 拖尾：只在有足够移动时产生
    const dx = x - this.mouseX;
    const dy = y - this.mouseY;
    if (!this.isMobile && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      this.trails.push(
        this.createParticle({
          x,
          y,
          type: 1,
          alpha: 0.6,
          size: 2 + Math.random(),
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 2000,
          maxLife: 2000,
        })
      );
      // 限制拖尾数量
      if (this.trails.length > 20) {
        this.trails.shift();
      }
    }
  }

  click(x: number, y: number): void {
    this.mouseDown = true;
    // 弹出 burst 粒子
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.5;
      const speed = 50 + Math.random() * 100;
      this.bursts.push(
        this.createParticle({
          x,
          y,
          type: 2,
          alpha: 0.8,
          size: 2 + Math.random() * 3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1500,
          maxLife: 1500,
        })
      );
    }
    setTimeout(() => {
      this.mouseDown = false;
    }, 200);
  }

  destroy(): void {
    this.stop();
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.buffer);
  }

  // ── 内部方法 ──

  private update(dt: number): void {
    // 限制最大 dt 防止跳帧
    const cappedDt = Math.min(dt, 0.1);

    // 更新拖尾
    this.trails = this.trails.filter((t) => {
      t.life -= cappedDt * 1000;
      t.alpha = (t.life / t.maxLife) * 0.6;
      return t.life > 0;
    });

    // 更新 burst
    this.bursts = this.bursts.filter((b) => {
      b.life -= cappedDt * 1000;
      b.alpha = (b.life / b.maxLife) * 0.8;
      b.vx *= 0.95;
      b.vy *= 0.95;
      return b.life > 0;
    });

    // 更新流光线
    for (const line of this.flowLines) {
      line.cx += line.speed * cappedDt;
      line.cy += line.speed * 0.7 * cappedDt;
      const w = this.canvas.width;
      const h = this.canvas.height;
      for (let i = 0; i < line.particles.length; i++) {
        const t = (performance.now() / 3000 + i * 0.1) * line.speed;
        const p = line.particles[i];
        // Lissajous 路径
        const lx = 0.5 + 0.35 * Math.sin(t * 1.3 + line.cx);
        const ly = 0.5 + 0.35 * Math.cos(t * 0.7 + line.cy);
        p.x = lx * w;
        p.y = ly * h;
        p.vx = 0;
        p.vy = 0;
      }
    }

    // 确保粒子数正确（适应降级后恢复）
    const targetCount = this.particleCount();
    if (this.bgParticles.length < targetCount) {
      for (let i = this.bgParticles.length; i < targetCount; i++) {
        this.bgParticles.push(this.createParticle());
      }
    } else if (this.bgParticles.length > targetCount) {
      this.bgParticles.length = targetCount;
    }
  }

  private draw(): void {
    const gl = this.gl;
    const w = this.canvas.width;
    const h = this.canvas.height;

    gl.viewport(0, 0, w, h);

    const colors = this.isDark ? COLORS.dark : COLORS.light;
    gl.clearColor(colors.bg[0], colors.bg[1], colors.bg[2], colors.bg[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    gl.uniform2f(this.uResolution, w, h);
    gl.uniform1f(this.uTime, performance.now() / 1000);
    gl.uniform2f(this.uMouse, this.mouseX, this.mouseY);
    gl.uniform1f(this.uMouseDown, this.mouseDown ? 1.0 : 0.0);
    gl.uniform1f(this.uDt, 1 / 60);
    gl.uniform4fv(this.uColor, colors.particle);
    gl.uniform4fv(this.uGlowColor, colors.glow);

    // 启用混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // 合并所有粒子
    const allParticles = [...this.bgParticles, ...this.trails, ...this.bursts, ...this.flowLines.flatMap((l) => l.particles)];
    const data = new Float32Array(allParticles.length * 7);

    for (let i = 0; i < allParticles.length; i++) {
      const p = allParticles[i];
      const offset = i * 7;
      data[offset] = p.x;
      data[offset + 1] = p.y;
      data[offset + 2] = p.vx;
      data[offset + 3] = p.vy;
      data[offset + 4] = p.size;
      data[offset + 5] = p.alpha;
      data[offset + 6] = p.type;
    }

    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, allParticles.length);

    // 还原混合模式
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private updateFps(dt: number): void {
    if (dt <= 0) return;

    const now = performance.now();

    // 恢复检测
    if (this.inRecovery) {
      this.recoveryFrames++;
      this.recoveryFpsAccum += 1 / dt;
      if (now - this.lastRecoveryCheck > FPS_ADAPTIVE.recoveryDuration) {
        const recoveryFps = this.recoveryFpsAccum / this.recoveryFrames;
        if (recoveryFps >= 55) {
          this.adaptiveScale = Math.min(1.0, this.adaptiveScale * 2);
          this.initParticles();
        }
        this.inRecovery = false;
        this.lastRecoveryCheck = now;
      }
      return;
    }

    // 常规 FPS 统计
    this.frameCount++;
    this.fpsAccum += 1 / dt;

    if (now - this.lastRecoveryCheck > FPS_ADAPTIVE.sampleDuration || this.frameCount >= 180) {
      this.currentFps = this.fpsAccum / this.frameCount;

      if (this.currentFps < 30 && this.adaptiveScale > 0.25) {
        this.adaptiveScale = Math.max(0.25, this.adaptiveScale * 0.5);
        this.initParticles();
      } else if (this.currentFps < 45 && this.adaptiveScale > 0.5) {
        this.adaptiveScale = Math.max(0.5, this.adaptiveScale * 0.75);
        this.initParticles();
      }

      this.frameCount = 0;
      this.fpsAccum = 0;
      this.lastRecoveryCheck = now;

      // 如果已降级，30s 后尝试恢复
      if (this.adaptiveScale < 1.0 && !this.inRecovery) {
        setTimeout(() => {
          this.inRecovery = true;
          this.recoveryFrames = 0;
          this.recoveryFpsAccum = 0;
          this.lastRecoveryCheck = performance.now();
        }, FPS_ADAPTIVE.recoveryInterval);
      }
    }
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd "C:\Project\LKM-official-website" && npx tsc --noEmit src/components/background/sci-fi-renderer.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/components/background/sci-fi-renderer.ts
git commit -m "feat: add WebGL2 sci-fi background renderer

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: 创建 React 组件 `SciFiBackground.tsx` 和 Astro 入口 `SciFiBackground.astro`

**Files:**
- Create: `src/components/background/SciFiBackground.tsx`
- Create: `src/components/background/SciFiBackground.astro`

**Interfaces:**
- Consumes: `SciFiRenderer` from `sci-fi-renderer`
- Produces (Astro): 可被页面导入的 `<SciFiBackground />` 组件

- [ ] **Step 1: 创建 React 组件**

```tsx
// src/components/background/SciFiBackground.tsx

import { useEffect, useRef, useCallback } from 'react';
import { SciFiRenderer } from './sci-fi-renderer';

export default function SciFiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SciFiRenderer | null>(null);
  const darkRef = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    rendererRef.current?.setMouse(e.clientX, e.clientY);
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    rendererRef.current?.click(e.clientX, e.clientY);
  }, []);

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

  // 主题切换
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      darkRef.current = dark;
      rendererRef.current?.setTheme(dark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
}
```

- [ ] **Step 2: 创建 Astro 入口组件**

```astro
---
// src/components/background/SciFiBackground.astro
import SciFiBackgroundReact from './SciFiBackground.tsx';
---

<SciFiBackgroundReact client:only="react" />
```

- [ ] **Step 3: 验证 TypeScript**

```bash
cd "C:\Project\LKM-official-website" && npx tsc --noEmit src/components/background/SciFiBackground.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/background/SciFiBackground.tsx src/components/background/SciFiBackground.astro
git commit -m "feat: add SciFiBackground React and Astro components

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: 集成到主页并移除 hero 图片

**Files:**
- Modify: `src/pages/index.astro` — 引入 `<SciFiBackground />`，移除 `image` prop

**Interfaces:**
- Consumes: `SciFiBackground` from `~/components/background/SciFiBackground.astro`

- [ ] **Step 1: 修改 index.astro**

```astro
---
import Layout from '~/layouts/PageLayout.astro';

import { getPermalink } from '~/utils/permalinks';

import SciFiBackground from '~/components/background/SciFiBackground.astro';
import Hero from '~/components/widgets/Hero.astro';
import Features2 from '~/components/widgets/Features2.astro';

import avatar千寻 from '~/assets/images/member/千寻.jpg';
import avatar七月花 from '~/assets/images/member/七月花.jpg';
import avatar七月A from '~/assets/images/member/七月A.jpg';
import avatar七月墨染 from '~/assets/images/member/七月墨染.png';
import avatar七月有枝 from '~/assets/images/member/七月有枝.jpeg';

import BlogLatestPosts from '~/components/widgets/BlogLatestPosts.astro';
import FAQs from '~/components/widgets/FAQs.astro';
import Timeline from '~/components/widgets/Timeline.astro';
import Section from '~/components/widgets/Section.astro';
const metadata = {
  title: '理科迷 —— 科技爱好者',
  ignoreTitleTemplate: true,
};
---

<Layout metadata={metadata}>
  <!-- Sci-Fi 动态背景 -->
  <SciFiBackground />

  <!-- Hero Widget ******************* -->

  <Hero
    id="intro"
    actions={[
      {
        variant: 'primary',
        text: '博客',
        href: getPermalink('/blog'),
        target: '_self',
        icon: 'tabler:arrow-right',
      },
      {
        text: 'GitHub',
        href: 'https://github.com/LKM-2014/LKM-official-website',
        target: '_blank',
        icon: 'tabler:brand-github',
      },
    ]}
  >
    <Fragment slot="title">
      <div class="flex flex-col gap-4">
        <div>
          <span class="text-[#0066cc] dark:text-[#2997ff]">理科迷！</span>
        </div>

        <span class="block mb-1 font-semibold tracking-[-0.005em] text-[#1d1d1f] dark:text-white">
          科技爱好者社区
        </span>
      </div>
    </Fragment>
    <Fragment slot="subtitle">
      <span class="block text-[17px] font-normal text-[#7a7a7a] dark:text-[#cccccc] mb-2 leading-relaxed">
        由普罗大众组成的科技爱好者社区
      </span>

      <span class="text-[14px] text-[#7a7a7a] dark:text-[#cccccc] leading-relaxed hidden sm:inline">
        <strong class="font-semibold text-[#0066cc] dark:text-[#2997ff] mr-1">Here!</strong>
        科学脱离了象牙塔的刻板与高冷，变成了每一个普通人对世界发问的好奇心。我们打破专业门槛，让每一位热爱理性、崇尚科学的"普通人"，都能在这里找到同频的伙伴，共同探索万物运转的奥秘。
      </span>
    </Fragment>
  </Hero>
  <!-- ... 其余内容保持不变 ... -->
```

注意需要移除 `image={{ src: '~/assets/images/hero-image.png', alt: '理科迷' }}` 这行。其余 Features2, Timeline, BlogLatestPosts, FAQs 部分保持不变。

- [ ] **Step 2: 确保 Hero section 背景透明**

Hero 的 section 默认应该有透明背景以便看到 canvas，但由于 Hero 用的是 `relative` 定位且有 `absolute inset-0` 的背景槽位（bg slot），我们需要确保没有不透明背景挡住。查看 Hero 组件结构——它有一个 `<div class="absolute inset-0 pointer-events-none">` 作为 bg slot，但只在传入 bg 时有内容。不存在问题。

但 `tailwind.css` 的 `body` 背景在亮色模式下是 `#ffffff`，这会完全遮住 canvas。需要把 body 背景改为透明，同时让各 section 自己处理背景。

修改 `tailwind.css` 中的 body 背景：

```css
/* 原来: */
@layer base {
  html,
  body {
    letter-spacing: -0.022em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #ffffff;
    color: #1d1d1f;
  }
}

/* 改为: */
@layer base {
  html,
  body {
    letter-spacing: -0.022em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: transparent;
    color: #1d1d1f;
  }
}
```

同时暗色模式也需要同步：

```css
/* 原来: */
.dark {
  h1, h2, h3, h4, h5, h6, p { color: #ffffff; }
  body { background-color: #000000; color: #ffffff; }
  p { color: #cccccc; }
}

/* 改为: */
.dark {
  h1, h2, h3, h4, h5, h6, p { color: #ffffff; }
  body { background-color: transparent; color: #ffffff; }
  p { color: #cccccc; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro src/assets/styles/tailwind.css
git commit -m "feat: integrate sci-fi background into homepage, remove hero image

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: 测试验证

- [ ] **Step 1: 构建验证**

```bash
cd "C:\Project\LKM-official-website" && pnpm build 2>&1 | tail -30
```
Expected: Build 成功，无 WebGL 相关错误（WebGL 只在运行时初始化）

- [ ] **Step 2: 类型检查**

```bash
cd "C:\Project\LKM-official-website" && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 开发服务器启动**

```bash
cd "C:\Project\LKM-official-website" && pnpm dev
```
手动验证：
1. 打开浏览器 → 主页应有粒子星场背景
2. 移动鼠标 → 粒子被轻微吸引，留下拖尾光点
3. 点击 → 产生冲击波粒子
4. 切换暗色模式 → 粒子颜色从蓝变亮蓝
5. 缩小窗口到手机宽度 → 粒子减少
6. 检查 FPS → 保持在 60fps 附近

- [ ] **Step 4: Commit (如有修复)**

```bash
git add -A
git commit -m "fix: any issues found during testing"
```
```

