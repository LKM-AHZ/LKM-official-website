<template>
  <div
    role="group"
    class="tabs tabs-boxed flex w-full"
    :aria-label="ariaLabel ?? t('auth.segmented.ariaLabel')"
  >
    <button
      v-for="opt in options"
      :key="opt.key"
      type="button"
      class="tab flex-1"
      :class="{ 'tab-active': opt.key === modelValue }"
      :aria-pressed="opt.key === modelValue"
      @click="emit('update:modelValue', opt.key)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { t } from "~/lib/i18n";

type Option = { key: string; label: string };

withDefaults(
  defineProps<{
    // 可选 + 默认空数组：调用方通常都传，但类型上不该既声明 required 又给默认值
    options?: Option[];
    modelValue: string;
    // 让每个调用方自描述用途：本组件被登录与注册共用，写死「选择登录方式」会让注册流程读错；
    // 不传时回退到原键，兼容既有调用方
    ariaLabel?: string;
  }>(),
  { options: () => [] },
);

const emit = defineEmits<(e: "update:modelValue", v: string) => void>();
</script>
