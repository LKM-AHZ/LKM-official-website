<script setup lang="ts">
// 后台「机器人概览」原生页 —— 数据来自社区服务端 BFF（/api/v1/admin/bot/overview），
// 由服务侧凭服务密钥读取 LKM-bot 面板，浏览器不再直连 /bot/。
//
// 三种降级（都不能抛整页错误）：
// - configured=false：服务端未配置 bot 地址/密钥 → 提示改用完整面板；
// - available=false：配置了但取数失败 → 提示面板数据暂不可用，仍可打开完整面板；
// - 正常：渲染版本/运行时长/计数与资源占用。
import { computed, onMounted, ref } from "vue";
import { NCard, NStatistic, NSkeleton, NTag } from "naive-ui";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

interface BotOverview {
  configured: boolean;
  available: boolean;
  reason: string | null;
  version: string | null;
  dashboard_version: string | null;
  platform_count: number | null;
  provider_count: number | null;
  plugin_count: number | null;
  message_count: number | null;
  cpu_percent: number | null;
  memory_process_mb: number | null;
  memory_system_mb: number | null;
  thread_count: number | null;
  running: Record<string, number | string> | null;
}

const loading = ref(true);
const error = ref("");
const data = ref<BotOverview | null>(null);

const fullPanelHref = "/bot/";

const runningText = computed(() => {
  const running = data.value?.running;
  if (!running) return "—";
  const parts = ["days", "hours", "minutes", "seconds"]
    .filter((key) => typeof running[key] === "number" && running[key])
    .map((key) => `${running[key]}${key[0]}`);
  return parts.length ? parts.join(" ") : "—";
});

const stats = computed(() => {
  const item = data.value;
  if (!item) return [];
  return [
    {
      key: "version",
      label: t("page.admin.bot.overview.version"),
      value: item.version ?? "—",
    },
    {
      key: "dashboard",
      label: t("page.admin.bot.overview.dashboardVersion"),
      value: item.dashboard_version ?? "—",
    },
    {
      key: "uptime",
      label: t("page.admin.bot.overview.uptime"),
      value: runningText.value,
    },
    {
      key: "platforms",
      label: t("page.admin.bot.overview.platforms"),
      value: item.platform_count ?? "—",
    },
    {
      key: "providers",
      label: t("page.admin.bot.overview.providers"),
      value: item.provider_count ?? "—",
    },
    {
      key: "plugins",
      label: t("page.admin.bot.overview.plugins"),
      value: item.plugin_count ?? "—",
    },
    {
      key: "messages",
      label: t("page.admin.bot.overview.messages"),
      value: item.message_count ?? "—",
    },
    {
      key: "cpu",
      label: t("page.admin.bot.overview.cpu"),
      value: item.cpu_percent === null ? "—" : `${item.cpu_percent}%`,
    },
    {
      key: "memory",
      label: t("page.admin.bot.overview.memory"),
      value:
        item.memory_process_mb === null
          ? "—"
          : `${item.memory_process_mb} / ${item.memory_system_mb ?? "?"} MB`,
    },
    {
      key: "threads",
      label: t("page.admin.bot.overview.threads"),
      value: item.thread_count ?? "—",
    },
  ];
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await adminFetch("/api/v1/admin/bot/overview");
    const body = await readAdminResp(res);
    data.value = body.data as BotOverview;
  } catch (err) {
    // readAdminResp 已在非 2xx 时抛出；这里只显示本卡片错误，不跳转、不白屏
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NCard v-for="i in 6" :key="i" size="small">
        <NSkeleton text :repeat="2" />
      </NCard>
    </div>

    <NCard v-else-if="error" size="small">
      <p class="font-medium text-deep-text">
        {{ t("page.admin.bot.overview.unavailable") }}
      </p>
      <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
      <a class="mt-3 inline-block text-sm text-primary" :href="fullPanelHref">
        {{ t("page.admin.bot.overview.openPanel") }} →
      </a>
    </NCard>

    <NCard v-else-if="data && !data.configured" size="small">
      <p class="font-medium text-deep-text">
        {{ t("page.admin.bot.overview.notConfigured") }}
      </p>
      <p class="mt-1 text-sm text-gray-500">
        {{ t("page.admin.bot.overview.notConfiguredHint") }}
      </p>
      <a class="mt-3 inline-block text-sm text-primary" :href="fullPanelHref">
        {{ t("page.admin.bot.overview.openPanel") }} →
      </a>
    </NCard>

    <NCard v-else-if="data && !data.available" size="small">
      <p class="font-medium text-deep-text">
        {{ t("page.admin.bot.overview.unavailable") }}
      </p>
      <p class="mt-1 text-sm text-gray-500">
        {{ t("page.admin.bot.overview.unavailableHint") }}
      </p>
      <a class="mt-3 inline-block text-sm text-primary" :href="fullPanelHref">
        {{ t("page.admin.bot.overview.openPanel") }} →
      </a>
    </NCard>

    <template v-else-if="data">
      <div class="flex items-center gap-3">
        <NTag type="success" size="small">{{
          t("page.admin.bot.overview.online")
        }}</NTag>
        <span class="text-sm text-gray-500"
          >LKMBot {{ data.version ?? "" }}</span
        >
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <NCard v-for="item in stats" :key="item.key" size="small">
          <NStatistic :label="item.label" :value="String(item.value)" />
        </NCard>
      </div>
    </template>
  </div>
</template>
