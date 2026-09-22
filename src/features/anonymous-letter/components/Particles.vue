<template>
  <!-- 背景柔和漂浮粒子：星光 / 花瓣 / 气泡 + 星点闪烁 -->
  <div
    class="particles"
    :class="{ muted, 'low-perf': lowPerf }"
    aria-hidden="true"
  >
    <!-- 上升漂浮粒子（星光/花瓣/气泡） -->
    <span
      v-for="p in particles"
      :key="'f' + p.id"
      class="particle"
      :style="p.style"
      >{{ p.symbol }}</span
    >
    <!-- 角落星点闪烁 -->
    <i
      v-for="s in stars"
      :key="'s' + s.id"
      class="star-dot"
      :style="s.style"
    ></i>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useApp } from "../stores/app";

const { state, lowPerf } = useApp();
const muted = computed(() => state.settings.muted);

const SYMBOLS = ["✨", "🌸", "🫧", "⭐", "🌿", "💫", "🍃", "🕯️"];

const particles = ref([]);
const stars = ref([]);

const MOBILE_MAX_WIDTH = 768;
let isMobileLayout = false;

function makeParticles() {
  const isMobile = window.innerWidth < MOBILE_MAX_WIDTH;
  isMobileLayout = isMobile;
  const count = isMobile ? 14 : 26;
  const arr = [];
  for (let i = 0; i < count; i++) {
    const size = 10 + Math.random() * 18;
    arr.push({
      id: i,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      style: {
        left: Math.random() * 100 + "%",
        bottom: -30 + "px",
        fontSize: size + "px",
        animationDuration: 14 + Math.random() * 16 + "s",
        animationDelay: -Math.random() * 20 + "s",
        opacity: 0.3 + Math.random() * 0.5,
      },
    });
  }
  particles.value = arr;

  const starCount = isMobile ? 18 : 34;
  const sarr = [];
  for (let i = 0; i < starCount; i++) {
    sarr.push({
      id: i,
      style: {
        left: Math.random() * 100 + "%",
        top: Math.random() * 100 + "%",
        width: 2 + Math.random() * 2 + "px",
        height: 2 + Math.random() * 2 + "px",
        animationDuration: 2.5 + Math.random() * 3 + "s",
        animationDelay: -Math.random() * 5 + "s",
      },
    });
  }
  stars.value = sarr;
}

// 只在跨越移动端断点时重建：否则旋转屏幕/拖窗口后会一直用挂载时的数量（桌面 26/34 留在手机上）。
// 不按每个 resize 像素重建，避免粒子随机位置反复跳变。
function onViewportChange() {
  if ((window.innerWidth < MOBILE_MAX_WIDTH) !== isMobileLayout) makeParticles();
}

onMounted(() => {
  makeParticles();
  window.addEventListener("resize", onViewportChange);
  window.addEventListener("orientationchange", onViewportChange);
});

onUnmounted(() => {
  window.removeEventListener("resize", onViewportChange);
  window.removeEventListener("orientationchange", onViewportChange);
});
</script>

<style scoped>
.particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}
.particles.muted .particle,
.particles.muted .star-dot {
  animation-play-state: paused !important;
}
.particles.low-perf {
  display: none;
}
.particle {
  position: absolute;
  animation-name: rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}
@keyframes rise {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-110vh) translateX(40px) rotate(360deg);
    opacity: 0;
  }
}
.star-dot {
  position: absolute;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--glow);
  animation-name: twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
    transform: scale(0.7);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.2);
  }
}
</style>
