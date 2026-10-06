<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{ title: string; icon: string; description?: string }>();
</script>

<template>
  <div
    class="mx-auto w-full max-w-6xl px-4 py-7 pb-16 sm:px-7 sm:py-9 lg:px-10"
  >
    <header class="mb-7 flex items-center gap-4">
      <span
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
      >
        <Icon :icon="icon" class="size-6" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <h1
          class="text-xl font-semibold tracking-tight text-deep-text sm:text-2xl"
        >
          {{ title }}
        </h1>
        <p v-if="description" class="mt-1 text-sm text-text-muted">
          {{ description }}
        </p>
      </div>
    </header>
    <slot />
  </div>
</template>
