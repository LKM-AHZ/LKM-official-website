<template>
  <!-- 治愈风空状态插画 -->
  <div class="empty-wrap">
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle
        cx="60"
        cy="60"
        r="46"
        stroke="var(--accent, currentColor)"
        stroke-width="2"
        opacity="0.4"
      />
      <path
        d="M40 70 Q60 90 80 70"
        stroke="var(--accent, currentColor)"
        stroke-width="3"
        stroke-linecap="round"
        fill="none"
      />
      <circle cx="46" cy="52" r="4" fill="var(--accent, currentColor)" />
      <circle cx="74" cy="52" r="4" fill="var(--accent, currentColor)" />
      <path
        d="M52 44 Q60 36 68 44"
        stroke="var(--accent-2, currentColor)"
        stroke-width="3"
        stroke-linecap="round"
        fill="none"
      />
      <circle cx="60" cy="22" r="3" fill="var(--accent-2, currentColor)" />
      <circle cx="28" cy="40" r="2.5" fill="var(--accent-2, currentColor)" />
      <circle cx="92" cy="44" r="2.5" fill="var(--accent-2, currentColor)" />
    </svg>
    <p class="empty-title">{{ title }}</p>
    <p class="empty-sub">{{ sub }}</p>
  </div>
</template>

<script setup lang="ts">
import { t } from "~/lib/i18n";

defineProps({
  title: { type: String, default: () => t("treehole.emptyState.defaultTitle") },
  sub: { type: String, default: () => t("treehole.emptyState.defaultSub") },
});
</script>

<style scoped>
.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}
.empty-sub {
  font-size: 13px;
  margin: 0;
}
</style>
