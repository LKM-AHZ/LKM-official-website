<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "~/lib/constants/constants";
import { t } from "~/lib/i18n";
import { Icon } from "@iconify/vue";
import {
  applyThemeToDocument,
  getStoredTheme,
  setTheme,
} from "~/lib/utils/setting-utils";
import type { LIGHT_DARK_MODE } from "~/types/config";

const seq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE, AUTO_MODE];
// 初值刻意固定为 AUTO_MODE（与 SSR 输出一致，避免水合不一致），真实值在 onMounted 同步
const mode = ref<LIGHT_DARK_MODE>(AUTO_MODE);

// 系统配色变化只在「跟随系统」时需要重算：显式选定的亮/暗再套用一次等于用本组件的旧值
// 覆盖文档主题，会把其它组件（如 setTheme）刚写入的结果顶掉
const changeThemeWhenSchemeChanged = (): void => {
  if (mode.value === AUTO_MODE) applyThemeToDocument(mode.value);
};
let darkModePreference: MediaQueryList | null = null;

onMounted(() => {
  // localStorage 里可能是历史/任意值（getStoredTheme 只做了类型断言、没有校验）：
  // 不在 seq 内时 seq.indexOf 返回 -1，点击切换会静默跳到 LIGHT_MODE 而不是从当前状态轮转
  const stored = getStoredTheme();
  mode.value = seq.includes(stored) ? stored : AUTO_MODE;
  darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
  darkModePreference.addEventListener("change", changeThemeWhenSchemeChanged);
});

onUnmounted(() => {
  // 不摘除会在换页重挂时累积监听器，也让旧实例无法回收
  darkModePreference?.removeEventListener(
    "change",
    changeThemeWhenSchemeChanged,
  );
});

function switchScheme(newMode: LIGHT_DARK_MODE) {
  mode.value = newMode;
  setTheme(newMode);
}

function toggleScheme() {
  const idx = seq.indexOf(mode.value);
  switchScheme(seq[(idx + 1) % seq.length]);
}

function showPanel() {
  const panel = document.querySelector("#light-dark-panel");
  panel?.classList.remove("float-panel-closed");
}

function hidePanel() {
  const panel = document.querySelector("#light-dark-panel");
  panel?.classList.add("float-panel-closed");
}
</script>

<template>
  <div class="relative z-50" role="menu" tabindex="-1" @mouseleave="hidePanel">
    <!-- 主切换按钮 -->
    <button
      aria-label="Light/Dark Mode"
      role="menuitem"
      class="relative scale-animation rounded-lg h-11 w-11 active:scale-90 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      id="scheme-switch"
      @click="toggleScheme"
      @mouseenter="showPanel"
    >
      <div
        class="absolute transition-opacity duration-200"
        :class="{ 'opacity-0': mode !== LIGHT_MODE }"
      >
        <Icon
          icon="material-symbols:wb-sunny-outline-rounded"
          class="text-[1.25rem]"
        />
      </div>
      <div
        class="absolute transition-opacity duration-200"
        :class="{ 'opacity-0': mode !== DARK_MODE }"
      >
        <Icon
          icon="material-symbols:dark-mode-outline-rounded"
          class="text-[1.25rem]"
        />
      </div>
      <div
        class="absolute transition-opacity duration-200"
        :class="{ 'opacity-0': mode !== AUTO_MODE }"
      >
        <Icon
          icon="material-symbols:radio-button-partial"
          class="text-[1.25rem]"
        />
      </div>
    </button>

    <!-- 下拉面板 -->
    <div
      id="light-dark-panel"
      class="hidden lg:block absolute transition float-panel-closed top-11 -right-2 pt-5"
    >
      <div
        class="bg-white dark:bg-[oklch(0.23_0.015_var(--hue))] border border-black/5 dark:border-white/10 rounded-[var(--radius-large)] overflow-hidden shadow-lg dark:shadow-none float-panel p-1.5"
      >
        <!-- 亮色模式选项 -->
        <button
          class="flex transition-all whitespace-nowrap items-center !justify-start w-full scale-animation rounded-lg h-9 px-3 text-sm font-medium active:scale-95 mb-0.5"
          :class="
            mode === LIGHT_MODE
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary hover:bg-black/5 dark:hover:bg-white/10'
          "
          @click="switchScheme(LIGHT_MODE)"
        >
          <Icon
            icon="material-symbols:wb-sunny-outline-rounded"
            class="text-[1.25rem] mr-2.5"
          />
          {{ t("theme.light") }}
        </button>

        <!-- 暗色模式选项 -->
        <button
          class="flex transition-all whitespace-nowrap items-center !justify-start w-full scale-animation rounded-lg h-9 px-3 text-sm font-medium active:scale-95 mb-0.5"
          :class="
            mode === DARK_MODE
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary hover:bg-black/5 dark:hover:bg-white/10'
          "
          @click="switchScheme(DARK_MODE)"
        >
          <Icon
            icon="material-symbols:dark-mode-outline-rounded"
            class="text-[1.25rem] mr-2.5"
          />
          {{ t("theme.dark") }}
        </button>

        <!-- 跟随系统选项 -->
        <button
          class="flex transition-all whitespace-nowrap items-center !justify-start w-full scale-animation rounded-lg h-9 px-3 text-sm font-medium active:scale-95"
          :class="
            mode === AUTO_MODE
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary hover:bg-black/5 dark:hover:bg-white/10'
          "
          @click="switchScheme(AUTO_MODE)"
        >
          <Icon
            icon="material-symbols:radio-button-partial"
            class="text-[1.25rem] mr-2.5"
          />
          {{ t("theme.system") }}
        </button>
      </div>
    </div>
  </div>
</template>
