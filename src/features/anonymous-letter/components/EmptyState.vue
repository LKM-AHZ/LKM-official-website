<template>
  <div class="empty-wrap">
    <div class="empty-icon">
      <Icon icon="tabler:mail-opened" aria-hidden="true" />
    </div>
    <p class="empty-title">{{ title }}</p>
    <p class="empty-sub">{{ sub }}</p>
  </div>
</template>

<script setup lang="ts">
import { t } from "~/lib/i18n";
import { Icon } from "@iconify/vue";

defineProps({
  title: { type: String, default: () => t("treehole.emptyState.defaultTitle") },
  sub: { type: String, default: () => t("treehole.emptyState.defaultSub") },
});
</script>

<style scoped>
.empty-icon {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 24px;
  background: var(--grad-soft);
  color: var(--accent);
  font-size: 38px;
}
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
