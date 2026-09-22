<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { t } from "~/lib/i18n";
import { Icon } from "@iconify/vue";
import { getDefaultHue, getHue, setHue } from "~/lib/utils/setting-utils";

// SSR 与客户端水合都用固定初始值 250，避免 hydration mismatch；
// 真实 hue 在 onMounted（仅客户端）再同步，面板默认隐藏，跳变不可见。
const hue = ref(250);
const defaultHue = ref(250);

// 挂载时用存储/站点默认值回填 hue 也会触发下面的 watcher：不加标记就会把「站点默认色相」
// 当成用户选择写进 localStorage，此后 siteConfig.themeColor.hue 再改也带不动这批用户。
// 必须用 flush: 'sync' 让 watcher 在赋值当场同步执行，标记才来得及生效
let hydrating = true;

onMounted(() => {
  try {
    hue.value = getHue();
  } catch (e) {
    console.warn("[display] 读取色相失败", e);
  }
  defaultHue.value = getDefaultHue();
  hydrating = false;
});

function resetHue() {
  // 复用已加载的 defaultHue：再读一次 getDefaultHue() 可能与用于按钮可见性比较的值不一致
  hue.value = defaultHue.value;
}

watch(
  hue,
  (val) => {
    if (hydrating || val === undefined) return;
    // 隐私模式/禁用 Cookie 下 localStorage 读写会抛 SecurityError，
    // 从 watcher 里逃逸就是未捕获异常，且拖动滑杆会反复触发
    try {
      setHue(val);
    } catch (e) {
      console.warn("[display] 保存色相失败", e);
    }
  },
  { flush: "sync" },
);
</script>

<template>
  <div
    id="display-setting"
    class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4"
  >
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
      <div
        class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:-left-3 before:top-[0.33rem]"
      >
        {{ t("theme.color") }}
        <button
          :aria-label="t('theme.resetToDefault')"
          :disabled="hue === defaultHue"
          class="btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform"
          :class="{ 'opacity-0 pointer-events-none': hue === defaultHue }"
          @click="resetHue"
        >
          <div class="text-[var(--btn-content)]">
            <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]" />
          </div>
        </button>
      </div>
      <div class="flex gap-1">
        <div
          id="hueValue"
          class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center font-bold text-sm items-center text-[var(--btn-content)]"
        >
          {{ hue }}
        </div>
      </div>
    </div>
    <div
      class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none"
    >
      <input
        :aria-label="t('theme.color')"
        type="range"
        min="0"
        max="360"
        v-model.number="hue"
        class="slider"
        id="colorSlider"
        step="5"
        style="width: 100%"
      />
    </div>
  </div>
</template>

<style scoped>
#display-setting input[type="range"] {
  -webkit-appearance: none;
  height: 1.5rem;
  background-image: var(--color-selection-bar);
  transition: background-image 0.15s ease-in-out;
}
#display-setting input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 1rem;
  width: 0.5rem;
  border-radius: 0.125rem;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: none;
}
#display-setting input[type="range"]::-webkit-slider-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}
#display-setting input[type="range"]::-webkit-slider-thumb:active {
  background: rgba(255, 255, 255, 0.6);
}
#display-setting input[type="range"]::-moz-range-thumb {
  height: 1rem;
  width: 0.5rem;
  border-radius: 0.125rem;
  border-width: 0;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: none;
}
#display-setting input[type="range"]::-moz-range-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}
#display-setting input[type="range"]::-moz-range-thumb:active {
  background: rgba(255, 255, 255, 0.6);
}
</style>
