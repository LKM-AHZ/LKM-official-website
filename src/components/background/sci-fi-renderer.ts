// src/components/background/sci-fi-renderer.ts

import { COLORS, FPS_ADAPTIVE, FLOW_LINE_COUNT } from './sci-fi-config';
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
  private prevMouseX = 0;
  private prevMouseY = 0;
  private mouseDown = false;
  private lastTime = 0;

  // particle data
  private bgParticles: Particle[] = [];
  private trails: Particle[] = [];
  private bursts: Particle[] = [];
  private flowLines: FlowLine[] = [];

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

    // set up attributes
    this.setupAttributes();

    // get uniform locations
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
    // clear any pending recovery timer
    if (this.recoveryTimerId !== null) {
      clearTimeout(this.recoveryTimerId);
      this.recoveryTimerId = null;
    }
  }

  setMouse(x: number, y: number): void {
    // trail generation: compute delta against previous position *before* overwriting
    const dx = x - this.prevMouseX;
    const dy = y - this.prevMouseY;
    this.prevMouseX = x;
    this.prevMouseY = y;

    this.mouseX = x;
    this.mouseY = y;

    // spawn trail particles only when mouse moves enough
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
      // cap trail length
      if (this.trails.length > 20) {
        this.trails.shift();
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
    this.gl.deleteBuffer(this.buffer);
  }

  // ── internal methods ──

  private update(dt: number): void {
    // cap max dt to prevent large jumps
    const cappedDt = Math.min(dt, 0.1);

    // update trails
    this.trails = this.trails.filter((t) => {
      t.life -= cappedDt * 1000;
      t.alpha = (t.life / t.maxLife) * 0.6;
      return t.life > 0;
    });

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
      const w = this.canvas.width;
      const h = this.canvas.height;
      for (let i = 0; i < line.particles.length; i++) {
        const t = (performance.now() / 3000 + i * 0.1) * line.speed;
        const p = line.particles[i];
        // Lissajous path
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
    gl.uniform1f(this.uTime, performance.now() / 1000);
    gl.uniform2f(this.uMouse, this.mouseX, this.mouseY);
    gl.uniform1f(this.uMouseDown, this.mouseDown ? 1.0 : 0.0);
    gl.uniform1f(this.uDt, 1 / 60);
    gl.uniform4fv(this.uColor, [...colors.particle]);
    gl.uniform4fv(this.uGlowColor, [...colors.glow]);
    gl.uniform3fv(this.uLineColor, [...colors.line]);

    // enable blending: additive for particles
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // merge all particles into a single draw call
    const allParticles = [
      ...this.bgParticles,
      ...this.trails,
      ...this.bursts,
      ...this.flowLines.flatMap((l) => l.particles),
    ];
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

    // restore default blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
