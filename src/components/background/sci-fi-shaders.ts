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
