<script setup lang="ts">
import { ref } from "vue";
import { t } from "~/lib/i18n";
import { useI18n } from "~/lib/i18n/composables/useI18n";
import type { Locale } from "~/lib/i18n/types";
import { Icon } from "@iconify/vue";

const { locale, setLocale } = useI18n();

const isOpen = ref(false);

const options: { value: Locale; label: string }[] = [
  { value: "zh-CN", label: t("languageSwitcher.zh") },
  { value: "en", label: t("languageSwitcher.en") },
];

function toggle() {
  isOpen.value = !isOpen.value;
}

function select(next: Locale) {
  isOpen.value = false;
  if (next === locale.value) return;
  setLocale(next);
  // 整页刷新是必需的：服务端渲染的文案/`lang` 属性只在下次请求时才会按新 locale 输出，
  // 只靠 setLocale 的响应式更新无法改动已经渲染好的 SSR 内容
  window.location.reload();
}
</script>

<template>
  <div class="relative z-50" @mouseleave="isOpen = false">
    <button
      aria-label="Language"
      class="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      @click="toggle"
    >
      <Icon icon="material-symbols:language" class="text-[1.25rem]" />
    </button>
    <div
      class="absolute right-0 top-11 pt-1.5 transition"
      :class="isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <div
        class="bg-white dark:bg-[oklch(0.23_0.015_var(--hue))] border border-black/5 dark:border-white/10 rounded-[var(--radius-large)] overflow-hidden shadow-lg dark:shadow-none float-panel p-1.5"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          class="flex transition-all whitespace-nowrap items-center !justify-start w-full scale-animation rounded-lg h-9 px-3 text-sm font-medium active:scale-95 mb-0.5"
          :class="
            locale === opt.value
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary hover:bg-black/5 dark:hover:bg-white/10'
          "
          @click="select(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>
