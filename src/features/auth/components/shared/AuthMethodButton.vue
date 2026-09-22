<template>
  <button
    type="button"
    class="btn btn-outline w-full gap-2"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <span v-if="icon" class="shrink-0 text-text-muted" aria-hidden="true">{{
      icon
    }}</span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    icon?: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

// 转发原始 MouseEvent：click 若在 emits 中声明却不带事件，Vue 会拦下原生 onClick 透传，
// 父级拿到的 $event 就是 undefined（stopPropagation/preventDefault/修饰符全部失效）
const emit = defineEmits<(e: "click", event: MouseEvent) => void>();
</script>
