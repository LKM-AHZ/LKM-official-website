<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, useId } from "vue";
import { Icon } from "@iconify/vue";
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "~/lib/constants/constants";
import { t } from "~/lib/i18n";
import { useI18n } from "~/lib/i18n/composables/useI18n";
import type { Locale } from "~/lib/i18n/types";
import {
  applyThemeToDocument,
  getDefaultHue,
  getHue,
  getStoredTheme,
  setHue,
  setTheme,
} from "~/lib/utils/setting-utils";
import type { LIGHT_DARK_MODE } from "~/types/config";

const props = withDefaults(
  defineProps<{ mobile?: boolean; allowColor?: boolean }>(),
  { mobile: false, allowColor: true },
);

const { locale, setLocale } = useI18n();
const root = ref<HTMLElement | null>(null);
const hueInputId = useId();
const isOpen = ref(false);
const mode = ref<LIGHT_DARK_MODE>(AUTO_MODE);
const hue = ref(250);
const defaultHue = ref(250);
let hydrating = true;
let darkModePreference: MediaQueryList | null = null;

const modes: { value: LIGHT_DARK_MODE; icon: string; label: string }[] = [
  {
    value: LIGHT_MODE,
    icon: "material-symbols:wb-sunny-outline-rounded",
    label: "theme.light",
  },
  {
    value: DARK_MODE,
    icon: "material-symbols:dark-mode-outline-rounded",
    label: "theme.dark",
  },
  {
    value: AUTO_MODE,
    icon: "material-symbols:radio-button-partial",
    label: "theme.system",
  },
];
const languages: { value: Locale; label: string; icon: string }[] = [
  {
    value: "zh-CN",
    label: "languageSwitcher.zh",
    icon: "material-symbols:language",
  },
  {
    value: "en",
    label: "languageSwitcher.en",
    icon: "material-symbols:language",
  },
];

function handleSystemThemeChange() {
  if (mode.value === AUTO_MODE) applyThemeToDocument(mode.value);
}

function handleClickOutside(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node))
    isOpen.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") isOpen.value = false;
}

onMounted(() => {
  try {
    mode.value = getStoredTheme();
    hue.value = getHue();
  } catch (error) {
    console.warn("[preferences] 读取偏好设置失败", error);
  }
  defaultHue.value = getDefaultHue();
  hydrating = false;
  darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
  darkModePreference.addEventListener("change", handleSystemThemeChange);
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  darkModePreference?.removeEventListener("change", handleSystemThemeChange);
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});

watch(
  hue,
  (value) => {
    if (hydrating) return;
    try {
      setHue(value);
    } catch (error) {
      console.warn("[preferences] 保存主题色失败", error);
    }
  },
  { flush: "sync" },
);

function chooseMode(next: LIGHT_DARK_MODE) {
  mode.value = next;
  try {
    setTheme(next);
  } catch (error) {
    // 即使存储不可用，本次切换仍应生效。
    applyThemeToDocument(next);
    console.warn("[preferences] 保存主题模式失败", error);
  }
}

function chooseLanguage(next: Locale) {
  if (next === locale.value) return;
  setLocale(next);
  window.location.reload();
}
</script>

<template>
  <div ref="root" class="relative" :class="mobile ? 'w-full' : 'z-50'">
    <button
      type="button"
      :aria-label="t('theme.displaySettings')"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      class="flex items-center text-neutral-700 dark:text-neutral-200 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      :class="
        mobile
          ? 'w-full gap-3 px-5 py-3 text-left font-semibold'
          : 'h-11 w-11 justify-center rounded-lg'
      "
      @click="isOpen = !isOpen"
    >
      <Icon icon="material-symbols:palette-outline" class="text-[1.25rem]" />
      <span v-if="mobile">{{ t("theme.displaySettings") }}</span>
      <Icon
        v-if="mobile"
        icon="material-symbols:keyboard-arrow-down-rounded"
        class="ml-auto text-[1.25rem] transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <div
      v-if="isOpen"
      class="bg-card-bg border border-surface-3 rounded-[var(--radius-large)] float-panel p-3 shadow-lg"
      :class="mobile ? 'mx-3 mb-3' : 'absolute right-0 top-full mt-2 w-72'"
    >
      <div
        class="relative mb-3 ml-3 text-lg font-bold text-neutral-900 dark:text-neutral-100 before:absolute before:-left-3 before:top-[0.33rem] before:h-4 before:w-1 before:rounded-md before:bg-[var(--primary)]"
      >
        {{ t("theme.lightDarkMode") }}
      </div>
      <div class="grid grid-cols-3 gap-1">
        <button
          v-for="item in modes"
          :key="item.value"
          type="button"
          class="flex h-9 items-center justify-center gap-1 rounded-md px-1 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          :class="
            mode === item.value
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-neutral-700 dark:text-neutral-200'
          "
          @click="chooseMode(item.value)"
        >
          <Icon :icon="item.icon" class="text-base" />
          {{ t(item.label) }}
        </button>
      </div>

      <div
        v-if="props.allowColor"
        class="mt-3 border-t border-black/5 pt-3 dark:border-white/10"
      >
        <div class="flex flex-row gap-2 mb-3 items-center justify-between">
          <div
            class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:-left-3 before:top-[0.33rem]"
          >
            <label :for="hueInputId">{{ t("theme.color") }}</label>
            <button
              type="button"
              :aria-label="t('theme.resetToDefault')"
              :disabled="hue === defaultHue"
              class="btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform"
              :class="{ 'opacity-0 pointer-events-none': hue === defaultHue }"
              @click="hue = defaultHue"
            >
              <div class="text-[var(--btn-content)]">
                <Icon
                  icon="fa6-solid:arrow-rotate-left"
                  class="text-[0.875rem]"
                />
              </div>
            </button>
          </div>
          <div class="flex gap-1">
            <div
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
            :id="hueInputId"
            v-model.number="hue"
            :aria-label="t('theme.color')"
            type="range"
            min="0"
            max="360"
            step="5"
            class="preferences-hue"
            style="width: 100%"
          />
        </div>
      </div>

      <div class="mt-3 border-t border-black/5 pt-3 dark:border-white/10">
        <div
          class="relative mb-3 ml-3 text-lg font-bold text-neutral-900 dark:text-neutral-100 before:absolute before:-left-3 before:top-[0.33rem] before:h-4 before:w-1 before:rounded-md before:bg-[var(--primary)]"
        >
          {{ t("theme.language") }}
        </div>
        <div class="grid grid-cols-2 gap-1">
          <button
            v-for="item in languages"
            :key="item.value"
            type="button"
            class="flex h-9 items-center justify-center gap-1 rounded-md px-1 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            :class="
              locale === item.value
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-neutral-700 dark:text-neutral-200'
            "
            @click="chooseLanguage(item.value)"
          >
            <Icon :icon="item.icon" class="text-base" />
            {{ t(item.label) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
