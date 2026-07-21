<template>
  <div class="flex items-center gap-2">
    <button
      class="like-btn relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-base-200 group"
      :class="{ 'is-liked': liked }"
      @click="handleLike"
      :aria-label="liked ? '取消点赞' : '点赞'"
      :title="liked ? '取消点赞' : '点赞'"
    >
      <span
        class="like-icon inline-flex items-center justify-center w-5 h-5 text-base-content/60 transition-all duration-300"
        :class="{ 'text-red-500 scale-125': liked }"
      >
        <svg
          viewBox="0 0 24 24"
          :fill="liked ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
        </svg>
      </span>

      <span ref="particlesContainer" class="absolute inset-0 pointer-events-none" />

      <span class="text-sm font-medium text-base-content/60 tabular-nums">
        {{ displayCount }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    count?: number;
  }>(),
  {
    count: 0,
  }
);

const liked = ref(false);
const particlesContainer = ref<HTMLElement | null>(null);

const displayCount = computed(() => {
  const base = props.count + (liked.value ? 1 : 0);
  return base > 0 ? base : null;
});

const activeTimers = new Set<ReturnType<typeof setTimeout>>();
const activeRafs = new Set<number>();

function handleLike() {
  liked.value = !liked.value;
  if (liked.value) {
    spawnParticles();
  }
}

function spawnParticles() {
  const container = particlesContainer.value;
  if (!container) return;

  const colors = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fb923c'];
  const count = 8;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 24 + Math.random() * 16;
    const size = 3 + Math.random() * 4;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      pointer-events: none;
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      opacity: 1;
      transform: translate(-50%, -50%) translate(0, 0) scale(1);
    `;

    container.appendChild(particle);

    const rafId = requestAnimationFrame(() => {
      activeRafs.delete(rafId);
      particle.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
      particle.style.opacity = '0';
    });
    activeRafs.add(rafId);

    const timerId = setTimeout(() => {
      activeTimers.delete(timerId);
      particle.remove();
    }, 650);
    activeTimers.add(timerId);
  }
}

onUnmounted(() => {
  for (const id of activeTimers) clearTimeout(id);
  for (const id of activeRafs) cancelAnimationFrame(id);
  activeTimers.clear();
  activeRafs.clear();
});
</script>
