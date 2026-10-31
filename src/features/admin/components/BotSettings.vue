<script setup lang="ts">
// 机器人「设置」原生页：展示运行版本/资源概览，编辑动作仍在完整面板内完成
// （面板设置涉及密码、2FA、SSL 等安全项，不在这里重写表单）。
import { computed, onMounted, ref } from "vue";
import { NButton, NCard, NModal, NTag } from "naive-ui";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

interface Overview {
  configured: boolean;
  available: boolean;
  reason?: string | null;
  version: string | null;
  dashboard_version: string | null;
  cpu_percent: number | null;
  memory_process_mb: number | null;
  memory_system_mb: number | null;
  thread_count: number | null;
}

const props = defineProps<{ ticket?: string }>();

const mode = ref<"loading" | "native" | "fallback">("loading");
const data = ref<Overview | null>(null);
const reason = ref("");
const editorOpen = ref(false);
const editorSrc = ref("");

const panelSrc = computed(() => {
  const next = encodeURIComponent("/settings");
  return props.ticket
    ? `/bot/api/v1/auth/sso?ticket=${encodeURIComponent(props.ticket)}&next=${next}`
    : `/bot/#/settings`;
});

const info = computed(() => {
  const item = data.value;
  if (!item) return [];
  return [
    { label: t("page.admin.bot.settings.version"), value: item.version ?? "—" },
    {
      label: t("page.admin.bot.settings.dashboardVersion"),
      value: item.dashboard_version ?? "—",
    },
    {
      label: t("page.admin.bot.settings.cpu"),
      value: item.cpu_percent === null ? "—" : `${item.cpu_percent}%`,
    },
    {
      label: t("page.admin.bot.settings.memory"),
      value:
        item.memory_process_mb === null
          ? "—"
          : `${item.memory_process_mb} / ${item.memory_system_mb ?? "?"} MB`,
    },
    {
      label: t("page.admin.bot.settings.threads"),
      value: item.thread_count ?? "—",
    },
  ];
});

async function openEditor() {
  // 票据一次性：每次打开都换新票。
  try {
    const res = await adminFetch("/api/v1/admin/bot/sso-ticket", {
      method: "POST",
    });
    const body = await readAdminResp(res);
    const ticket = (body.data as { ticket?: string }).ticket ?? "";
    editorSrc.value = `/bot/api/v1/auth/sso?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent("/settings")}`;
    editorOpen.value = true;
  } catch {
    /* 换票失败时保持弹窗关闭，使用下方完整面板入口 */
  }
}

onMounted(async () => {
  try {
    const res = await adminFetch("/api/v1/admin/bot/overview");
    const body = await readAdminResp(res);
    const payload = body.data as Overview;
    if (!payload.configured || !payload.available) {
      reason.value = payload.reason ?? "unavailable";
      mode.value = "fallback";
      return;
    }
    data.value = payload;
    mode.value = "native";
  } catch (err) {
    reason.value = err instanceof Error ? err.message : String(err);
    mode.value = "fallback";
  }
});
</script>

<template>
  <div class="space-y-4">
    <div v-if="mode === 'loading'">
      {{ t("page.admin.bot.common.loading") }}
    </div>

    <div v-else-if="mode === 'fallback'" class="space-y-3">
      <NCard size="small">
        <p class="text-sm text-gray-500">
          {{ t("page.admin.bot.common.fallbackHint") }}
          <span v-if="reason" class="text-xs">({{ reason }})</span>
        </p>
      </NCard>
      <iframe
        :src="panelSrc"
        :title="t('page.admin.bot.settings.title')"
        class="h-[70vh] w-full rounded-lg border-0"
        referrerpolicy="no-referrer"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
      ></iframe>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <NTag type="success" size="small">{{
          t("page.admin.bot.settings.online")
        }}</NTag>
        <NButton size="small" @click="openEditor">
          {{ t("page.admin.bot.common.editInPanel") }}
        </NButton>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NCard v-for="row in info" :key="row.label" size="small">
          <p class="text-xs text-gray-500">{{ row.label }}</p>
          <p class="mt-1 text-lg font-semibold text-deep-text">
            {{ row.value }}
          </p>
        </NCard>
      </div>
      <NModal
        v-model:show="editorOpen"
        preset="card"
        class="max-w-6xl"
        :title="t('page.admin.bot.settings.title')"
      >
        <iframe
          v-if="editorSrc"
          :src="editorSrc"
          :title="t('page.admin.bot.settings.title')"
          class="h-[70vh] w-full rounded-lg border-0"
          referrerpolicy="no-referrer"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        ></iframe>
      </NModal>
    </template>
  </div>
</template>
