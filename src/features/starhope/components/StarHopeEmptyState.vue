<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{ icon: string; message: string }>();
</script>

<template>
  <div
    class="card-base flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center"
  >
    <span
      class="mb-4 flex size-14 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
    >
      <Icon :icon="icon" class="size-7" aria-hidden="true" />
    </span>
    <p class="max-w-md text-sm leading-6 text-text-muted">{{ message }}</p>
  </div>
</template>
