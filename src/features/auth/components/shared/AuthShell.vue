<template>
  <div
    class="flex min-h-[calc(100dvh-72px)] w-full items-center justify-center px-4 py-10 sm:px-6"
  >
    <div class="w-full" :style="{ maxWidth: maxWidth }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    maxWidth?: string;
  }>(),
  { maxWidth: "440px" },
);
</script>
