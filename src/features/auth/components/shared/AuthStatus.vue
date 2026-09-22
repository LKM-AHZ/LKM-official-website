<template>
  <div
    role="alert"
    class="alert w-full text-sm"
    :class="alertClass"
    aria-live="assertive"
  >
    <div class="shrink-0" aria-hidden="true">
      <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current shrink-0">
        <path
          v-if="type === 'error'"
          d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z"
        />
        <path
          v-else-if="type === 'warning'"
          d="M12 3 2 20h20L12 3Zm1 11h-2v2h2v-2Zm0-6h-2v4h2V8Z"
        />
        <path
          v-else-if="type === 'success'"
          d="M21 6.5 9.5 18 3 11.5 4.5 10l5 5L19.5 5 21 6.5Z"
        />
        <path
          v-else
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    </div>
    <div class="min-w-0 flex-1">
      <!-- message 作为插槽兜底内容：同时传 message 与默认插槽时只显示一处，不会重复两遍 -->
      <span class="block"
        ><slot>{{ message }}</slot></span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type StatusType = "error" | "warning" | "success" | "info";

const props = withDefaults(
  defineProps<{
    type: StatusType;
    message?: string;
  }>(),
  { type: "info" },
);

const alertClass = computed(() => {
  switch (props.type) {
    case "error":
      return "alert-error";
    case "warning":
      return "alert-warning";
    case "success":
      return "alert-success";
    case "info":
    default:
      return "alert-info";
  }
});
</script>
