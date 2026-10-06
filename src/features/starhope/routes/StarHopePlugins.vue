<script setup lang="ts">
import { t } from "~/lib/i18n";
import { Icon } from "@iconify/vue";
import StarHopePage from "../components/StarHopePage.vue";

const plugins = [
  {
    id: "lottery",
    nameKey: "starhope.plugins.lottery.name",
    descKey: "starhope.plugins.lottery.desc",
    icon: "tabler:dice-5",
  },
  {
    id: "timer",
    nameKey: "starhope.plugins.timer.name",
    descKey: "starhope.plugins.timer.desc",
    icon: "tabler:clock",
  },
  {
    id: "calculator",
    nameKey: "starhope.plugins.calculator.name",
    descKey: "starhope.plugins.calculator.desc",
    icon: "tabler:calculator",
  },
] as const;
</script>

<template>
  <StarHopePage :title="t('starhope.plugins.title')" icon="tabler:puzzle">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <!-- 插件路由尚未实现：显式标成不可用，避免看起来像可点却点不动的入口
           （文案化的「即将推出」标识需要新增 i18n key，待有产品文案时再补） -->
      <div
        v-for="p in plugins"
        :key="p.id"
        class="card-base flex min-h-36 flex-col items-start p-5 opacity-70"
        aria-disabled="true"
      >
        <span
          class="mb-4 flex size-10 items-center justify-center rounded-xl bg-btn-regular-bg text-primary-readable"
          ><Icon :icon="p.icon" class="size-5" aria-hidden="true"
        /></span>
        <h2 class="text-sm font-semibold text-deep-text">{{ t(p.nameKey) }}</h2>
        <p class="mt-1 text-xs text-text-muted">{{ t(p.descKey) }}</p>
      </div>
    </div>
  </StarHopePage>
</template>
