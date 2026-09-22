<script setup lang="ts">
import { t } from "~/lib/i18n";

const plugins = [
  {
    id: "lottery",
    nameKey: "starhope.plugins.lottery.name",
    descKey: "starhope.plugins.lottery.desc",
  },
  {
    id: "timer",
    nameKey: "starhope.plugins.timer.name",
    descKey: "starhope.plugins.timer.desc",
  },
  {
    id: "calculator",
    nameKey: "starhope.plugins.calculator.name",
    descKey: "starhope.plugins.calculator.desc",
  },
] as const;
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-deep-text mb-6">
      {{ t("starhope.plugins.title") }}
    </h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- 插件路由尚未实现：显式标成不可用，避免看起来像可点却点不动的入口
           （文案化的「即将推出」标识需要新增 i18n key，待有产品文案时再补） -->
      <div
        v-for="p in plugins"
        :key="p.id"
        class="card-base p-6 text-center opacity-70 cursor-not-allowed select-none"
        aria-disabled="true"
      >
        <div class="text-3xl mb-3" aria-hidden="true">🧩</div>
        <h2 class="font-semibold text-deep-text">{{ t(p.nameKey) }}</h2>
        <p class="text-xs text-text-muted mt-1">{{ t(p.descKey) }}</p>
      </div>
    </div>
  </div>
</template>
