<script setup lang="ts">
// 后台待办审核卡片 —— 接 GET /api/v1/admin/review-summary。
//
// 五个队列共用一份后端聚合口径（与每日摘要同源）：文件 / 举报 / 三类申请。
// 只有已有后台审核页的队列给深链；申请类暂无页面，只显示数字，避免链到 404。
import { onMounted, ref } from "vue";
import { NCard, NSkeleton } from "naive-ui";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

interface QueueItem {
  key: string;
  count: number;
  oldest_waiting_seconds: number | null;
  href: string | null;
}

interface ReviewSummary {
  total_pending: number;
  queues: QueueItem[];
}

const summary = ref<ReviewSummary | null>(null);
const loading = ref(true);
const error = ref("");

function durationLabel(seconds: number): string {
  if (seconds < 3600) {
    return t("admin.reviewQueues.minutes", {
      n: String(Math.max(1, Math.round(seconds / 60))),
    });
  }
  if (seconds < 86400) {
    return t("admin.reviewQueues.hours", {
      n: String(Math.round(seconds / 3600)),
    });
  }
  return t("admin.reviewQueues.days", {
    n: String(Math.round(seconds / 86400)),
  });
}

function queueLabel(key: string): string {
  const labels: Record<string, string> = {
    files: t("admin.reviewQueues.files"),
    reports: t("admin.reviewQueues.reports"),
    board_applications: t("admin.reviewQueues.boardApplications"),
    column_applications: t("admin.reviewQueues.columnApplications"),
    project_applications: t("admin.reviewQueues.projectApplications"),
  };
  return labels[key] ?? key;
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const res = await adminFetch("/api/v1/admin/review-summary");
    const body = await readAdminResp(res);
    summary.value = body.data as ReviewSummary;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("admin.loadFailed");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <n-card>
    <div v-if="error" class="text-sm text-red-500 flex items-center gap-3">
      <span>{{ error }}</span>
      <button type="button" class="underline hover:no-underline" @click="load">
        {{ t("common.retry") }}
      </button>
    </div>
    <div v-else-if="loading" class="space-y-2">
      <n-skeleton v-for="i in 5" :key="i" text />
    </div>
    <template v-else-if="summary">
      <div class="divide-y divide-surface-3">
        <a
          v-for="item in summary.queues"
          :key="item.key"
          :href="item.href ?? undefined"
          class="flex items-center justify-between gap-3 py-2 no-underline"
          :class="
            item.href ? 'text-deep-text hover:text-primary' : 'text-deep-text'
          "
        >
          <span class="text-sm">{{ queueLabel(item.key) }}</span>
          <span class="flex items-center gap-3">
            <span
              v-if="item.oldest_waiting_seconds !== null"
              class="text-xs text-text-muted"
            >
              {{ t("admin.reviewQueues.oldest") }}
              {{ durationLabel(item.oldest_waiting_seconds) }}
            </span>
            <span
              class="text-sm font-semibold tabular-nums"
              :class="item.count ? 'text-red-500' : 'text-text-muted'"
              >{{ item.count }}</span
            >
          </span>
        </a>
      </div>
      <p
        v-if="summary.total_pending === 0"
        class="text-sm text-text-muted mt-3"
      >
        {{ t("admin.reviewQueues.empty") }}
      </p>
    </template>
  </n-card>
</template>
