// src/components/background/sci-fi-renderer.ts

import { COLORS, FPS_ADAPTIVE, FLOW_LINE_COUNT, LINK_DISTANCE, PARTICLE_COUNT } from './sci-fi-config';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './sci-fi-shaders';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: number; // 0=bg, 1=trail, 2=burst, 3=flowline
  life: number; // remaining life ms
  maxLife: number;
}

interface FlowLine {
  particles: Particle[];
  cx: number; // Lissajous phase offset
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

  // particle data
  private bgParticles: Particle[] = [];
  private bursts: Particle[] = [];
  private flowLines: FlowLine[] = [];

  // continuous mouse glow trail (position + timestamp ring buffer)
  private trailPoints: Array<{ x: number; y: number; t: number }> = [];
  private readonly TRAIL_MAX_POINTS = 60;
  private readonly TRAIL_DURATION = 800; // ms for trail to fully fade
  private readonly TRAIL_MIN_DIST = 3; // min px between trail samples
  private lastTrailX = 0;
  private lastTrailY = 0;

  // FPS adaptive
  private frameCount = 0;
  private fpsAccum = 0;
  private currentFps = 60;
  private adaptiveScale = 1.0;
  private lastRecoveryCheck = 0;
  private recoveryFrames = 0;
  private recoveryFpsAccum = 0;
  private inRecovery = false;
  private recoveryTimerId: ReturnType<typeof setTimeout> | null = null;

  // line rendering state (reused every frame, not allocated per-draw)
  private lineVao: WebGLVertexArrayObject | null = null;

  // uniform locations
  private uResolution: WebGLUniformLocation;
  private uColor: WebGLUniformLocation;
  private uGlowColor: WebGLUniformLocation;

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

    // set up attributes
    this.setupAttributes();

    // get uniform locations
    this.uResolution = gl.getUniformLocation(this.program, 'u_resolution')!;
    this.uColor = gl.getUniformLocation(this.program, 'u_color')!;
    this.uGlowColor = gl.getUniformLocation(this.program, 'u_glowColor')!;

    this.initParticles();
    this.initFlowLines();
    this.initLineVao();
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

  /** Pre-allocate a VAO for line rendering so drawLinks() can reuse it every frame. */
  private initLineVao(): void {
    const gl = this.gl;
    this.lineVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    // Layout: x,y,alpha per vertex (3 floats, stride = 12 bytes)
    // a_position (location 0): x,y at offset 0
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

    // a_velocity (location 1): unused → leave disabled, defaults to (0,0)
    // a_size (location 2): unused → leave disabled
    // a_alpha (location 3): alpha at offset 8 (2 floats in)
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(
      3,
      1,
      gl.FLOAT,
      false,
      3 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT
    );

    // a_type (location 4): unused → leave disabled (defaults to 0)

    // Restore the main particle VAO
    gl.bindVertexArray(this.vao);
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
    const base = this.isMobile ? PARTICLE_COUNT.mobile : PARTICLE_COUNT.desktop;
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
    // clear any pending recovery timer
    if (this.recoveryTimerId !== null) {
      clearTimeout(this.recoveryTimerId);
      this.recoveryTimerId = null;
    }
  }

  setMouse(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;

    // continous glow trail: sample position at distance intervals
    const dd = Math.hypot(x - this.lastTrailX, y - this.lastTrailY);
    if (dd > this.TRAIL_MIN_DIST) {
      this.trailPoints.push({ x, y, t: performance.now() });
      this.lastTrailX = x;
      this.lastTrailY = y;
      // trim old entries
      while (this.trailPoints.length > this.TRAIL_MAX_POINTS) {
        this.trailPoints.shift();
      }
    }
  }

  click(x: number, y: number): void {
    this.mouseDown = true;
    // spawn burst particles
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
    if (this.lineVao) this.gl.deleteVertexArray(this.lineVao);
    this.gl.deleteBuffer(this.buffer);
  }

  // ── internal methods ──

  /** Simple pseudo-random hash for Brownian drift. */
  private hash(n: number): number {
    return (Math.sin(n) * 43758.5453123) % 1;
  }

  private update(dt: number): void {
    const cappedDt = Math.min(dt, 0.1);
    const w = this.canvas.width;
    const h = this.canvas.height;

    // ── update background particles (moved from shader to JS) ──
    for (let i = 0; i < this.bgParticles.length; i++) {
      const p = this.bgParticles[i];

      // 指数衰减速度 (阻尼), 原着色器: exp(-0.5 * dt)
      p.vx *= Math.exp(-0.5 * cappedDt);
      p.vy *= Math.exp(-0.5 * cappedDt);

      // 鼠标吸引
      const dx = this.mouseX - p.x;
      const dy = this.mouseY - p.y;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);
      if (distToMouse < 200 && distToMouse > 0.01) {
        const strength = ((200 - distToMouse) / 200) * 40;
        const invDist = 1 / distToMouse;
        p.vx += dx * invDist * strength * cappedDt;
        p.vy += dy * invDist * strength * cappedDt;
      }

      // 点击推开
      if (this.mouseDown && distToMouse < 150 && distToMouse > 0.01) {
        const invDist = 1 / distToMouse;
        const strength = ((150 - distToMouse) / 150) * 200;
        p.vx -= dx * invDist * strength * cappedDt;
        p.vy -= dy * invDist * strength * cappedDt;
      }

      // 布朗噪声漂移, 原着色器: hash(gl_VertexID * seed + u_time * freq) - 0.5
      const noiseX = this.hash(i * 1.3 + (performance.now() / 1000) * 0.7) - 0.5;
      const noiseY = this.hash(i * 2.1 + (performance.now() / 1000) * 0.6) - 0.5;
      p.vx += noiseX * 30 * cappedDt;
      p.vy += noiseY * 30 * cappedDt;

      // 速度钳制
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 60) {
        const scale = 60 / speed;
        p.vx *= scale;
        p.vy *= scale;
      }

      // 更新位置
      p.x += p.vx * cappedDt;
      p.y += p.vy * cappedDt;

      // 循环边界 (GPU 端也会做一次 mod，双重保证)
      p.x = ((p.x % w) + w) % w;
      p.y = ((p.y % h) + h) % h;
    }

    // prune old trail points
    const trailExpiry = performance.now() - this.TRAIL_DURATION;
    while (this.trailPoints.length > 0 && this.trailPoints[0].t < trailExpiry) {
      this.trailPoints.shift();
    }

    // update bursts
    this.bursts = this.bursts.filter((b) => {
      b.life -= cappedDt * 1000;
      b.alpha = (b.life / b.maxLife) * 0.8;
      b.vx *= 0.95;
      b.vy *= 0.95;
      return b.life > 0;
    });

    // update flow lines
    for (const line of this.flowLines) {
      line.cx += line.speed * cappedDt;
      line.cy += line.speed * 0.7 * cappedDt;
      for (let i = 0; i < line.particles.length; i++) {
        const t = (performance.now() / 3000 + i * 0.1) * line.speed;
        const p = line.particles[i];
        const lx = 0.5 + 0.35 * Math.sin(t * 1.3 + line.cx);
        const ly = 0.5 + 0.35 * Math.cos(t * 0.7 + line.cy);
        p.x = lx * w;
        p.y = ly * h;
        p.vx = 0;
        p.vy = 0;
      }
    }

    // ensure correct particle count (adapt after downgrade/recovery)
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
    gl.uniform4fv(this.uColor, [...colors.particle]);
    gl.uniform4fv(this.uGlowColor, [...colors.glow]);

    // enable blending: additive for particles
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // merge all particles into a single draw call
    const allParticles = [...this.bgParticles, ...this.bursts, ...this.flowLines.flatMap((l) => l.particles)];
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

    // ── draw continuous mouse glow trail ──
    this.drawTrail(colors);

    // ── draw connecting lines between nearby background particles ──
    this.drawLinks(colors);

    // restore default blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Draw a continuous fading glow trail along recent mouse positions.
   * Renders as large soft POINTS (not LINES) for reliable width across all GPUs.
   */
  private drawTrail(colors: typeof COLORS.light | typeof COLORS.dark): void {
    const pts = this.trailPoints;
    if (pts.length === 0) return;

    const gl = this.gl;
    const now = performance.now();
    const accent = colors.accent;

    // Use the main particle VAO (handles POINTS with correct attribute layout)
    gl.bindVertexArray(this.vao);
    // Standard alpha blending — no additive overlap, points don't sum to white
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Build per-point data: each point is 7 floats (x,y, vx,vy, size, alpha, type)
    const data = new Float32Array(pts.length * 7);
    for (let i = 0; i < pts.length; i++) {
      const age = (now - pts[i].t) / this.TRAIL_DURATION;
      if (age >= 1) continue;
      const alpha = (1 - age) * accent[3];
      const size = 4 + (1 - age) * 6; // 4→10 px, fresher = larger
      const offset = i * 7;
      data[offset] = pts[i].x;
      data[offset + 1] = pts[i].y;
      data[offset + 2] = 0; // vx
      data[offset + 3] = 0; // vy
      data[offset + 4] = size;
      data[offset + 5] = alpha;
      data[offset + 6] = 1; // type=trail → brighter in frag shader
    }

    gl.uniform4f(this.uColor, accent[0], accent[1], accent[2], 1.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, pts.length);

    // Restore particle color
    gl.uniform4fv(this.uColor, [...colors.particle]);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  }

  /**
   * Draw connecting lines between background particles within a distance threshold,
   * using a spatial grid to avoid O(n^2) comparisons.
   */
  private drawLinks(colors: typeof COLORS.light | typeof COLORS.dark): void {
    const gl = this.gl;
    const linkDistance = this.isMobile ? LINK_DISTANCE.mobile : LINK_DISTANCE.desktop;
    const lineAlpha = colors.line[3]; // alpha from config line color

    // Build spatial grid for background particles only
    const cellSize = linkDistance;
    const gridWidth = Math.ceil(this.canvas.width / cellSize);
    const gridHeight = Math.ceil(this.canvas.height / cellSize);
    const grid: number[][] = Array.from({ length: gridWidth * gridHeight }, () => []);

    // Bucket particles by cell
    for (let i = 0; i < this.bgParticles.length; i++) {
      const p = this.bgParticles[i];
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      if (cx >= 0 && cx < gridWidth && cy >= 0 && cy < gridHeight) {
        grid[cy * gridWidth + cx].push(i);
      }
    }

    // Check each cell and its right, down, down-right, down-left neighbors
    // Direction offsets: right(1,0), down(0,1), down-right(1,1), down-left(-1,1)
    const neighborOffsets = [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 1],
    ];

    // Pre-allocate a reasonable buffer; grow as needed
    const lineVertices: number[] = [];

    for (let cy = 0; cy < gridHeight; cy++) {
      for (let cx = 0; cx < gridWidth; cx++) {
        const cellIdx = cy * gridWidth + cx;
        const cellParticles = grid[cellIdx];
        if (cellParticles.length === 0) continue;

        // Pairs within same cell
        for (let a = 0; a < cellParticles.length; a++) {
          const i = cellParticles[a];
          const pi = this.bgParticles[i];
          for (let b = a + 1; b < cellParticles.length; b++) {
            const j = cellParticles[b];
            const pj = this.bgParticles[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < linkDistance) {
              const alpha = (1 - dist / linkDistance) * lineAlpha;
              lineVertices.push(pi.x, pi.y, alpha);
              lineVertices.push(pj.x, pj.y, alpha);
            }
          }
        }

        // Pairs with neighbor cells
        for (const [ox, oy] of neighborOffsets) {
          const nx = cx + ox;
          const ny = cy + oy;
          if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;
          const neighborIdx = ny * gridWidth + nx;
          const neighborParticles = grid[neighborIdx];
          if (neighborParticles.length === 0) continue;

          for (let a = 0; a < cellParticles.length; a++) {
            const i = cellParticles[a];
            const pi = this.bgParticles[i];
            for (let b = 0; b < neighborParticles.length; b++) {
              const j = neighborParticles[b];
              const pj = this.bgParticles[j];
              const dx = pi.x - pj.x;
              const dy = pi.y - pj.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < linkDistance) {
                const alpha = (1 - dist / linkDistance) * lineAlpha;
                lineVertices.push(pi.x, pi.y, alpha);
                lineVertices.push(pj.x, pj.y, alpha);
              }
            }
          }
        }
      }
    }

    if (lineVertices.length === 0) return;

    // Pass 1: Draw lines with pre-allocated lineVao
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform4f(this.uColor, colors.line[0], colors.line[1], colors.line[2], 1.0);

    const vertexCount = lineVertices.length / 3;
    const lineData = new Float32Array(lineVertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);

    gl.bindVertexArray(this.lineVao!);
    gl.drawArrays(gl.LINES, 0, vertexCount);

    // Pass 2: Draw glow points at line endpoints for visual thickness
    // Extract unique endpoint positions with their alpha values from the line data
    const glowData = new Float32Array(vertexCount * 7);
    for (let i = 0; i < vertexCount; i++) {
      const src = i * 3;
      const dst = i * 7;
      glowData[dst] = lineData[src]; // x
      glowData[dst + 1] = lineData[src + 1]; // y
      glowData[dst + 2] = 0; // vx unused
      glowData[dst + 3] = 0; // vy unused
      glowData[dst + 4] = 5; // size — glow dot thickness
      glowData[dst + 5] = lineData[src + 2]; // alpha from line
      glowData[dst + 6] = 0; // type=bg
    }

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, glowData, gl.DYNAMIC_DRAW);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, vertexCount);

    // Restore particle color
    gl.uniform4fv(this.uColor, [...colors.particle]);
  }

  private updateFps(dt: number): void {
    if (dt <= 0) return;

    const now = performance.now();

    // recovery detection
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

    // regular FPS sampling
    this.frameCount++;
    this.fpsAccum += 1 / dt;

    if (now - this.lastRecoveryCheck > FPS_ADAPTIVE.sampleDuration || this.frameCount >= 180) {
      this.currentFps = this.fpsAccum / this.frameCount;

      if (this.currentFps < 30 && this.adaptiveScale > 0.25) {
        this.adaptiveScale = Math.max(0.25, this.adaptiveScale * FPS_ADAPTIVE.downgrade30);
        this.initParticles();
      } else if (this.currentFps < 45 && this.adaptiveScale > 0.5) {
        this.adaptiveScale = Math.max(0.5, this.adaptiveScale * FPS_ADAPTIVE.downgrade45);
        this.initParticles();
      }

      this.frameCount = 0;
      this.fpsAccum = 0;
      this.lastRecoveryCheck = now;

      // if degraded, schedule recovery attempt after interval
      if (this.adaptiveScale < 1.0 && !this.inRecovery) {
        this.recoveryTimerId = setTimeout(() => {
          this.recoveryTimerId = null;
          this.inRecovery = true;
          this.recoveryFrames = 0;
          this.recoveryFpsAccum = 0;
          this.lastRecoveryCheck = performance.now();
        }, FPS_ADAPTIVE.recoveryInterval);
      }
    }
  }
}
