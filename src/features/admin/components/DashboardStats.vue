<script setup lang="ts">
// 后台控制台统计卡片 —— 接 GET /api/v1/admin/stats + 待处理举报数。
//
// 说明：图标写法不像 AdminLayout.astro 用 astro-icon（本组件是 Vue SFC，astro-icon
// 不适用；lucide data-lucide 机制全站 Vue 组件均未用），故按 brief 注（#89）改用
// 简洁彩色指示块作 prefix，保持卡片信息直观。统计卡均可下钻到对应管理页。
import { ref, onMounted } from "vue";
import { NCard, NStatistic, NSkeleton } from "naive-ui";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

interface AdminStats {
  user_count: number;
  post_count: number;
  file_count: number;
  file_pending_count: number;
}

const stats = ref<AdminStats | null>(null);
const pendingReports = ref(0);
const loading = ref(true);
const error = ref("");

interface StatCard {
  key: string;
  value: () => number;
  to: string;
  /** 色块：prefix 顶部小色点样式类 */
  dotClass: string;
}

const cards: StatCard[] = [
  {
    key: "users",
    value: () => stats.value?.user_count ?? 0,
    to: "/admin/users",
    dotClass: "bg-primary",
  },
  {
    key: "posts",
    value: () => stats.value?.post_count ?? 0,
    to: "/admin/posts",
    dotClass: "bg-primary",
  },
  {
    key: "files",
    value: () => stats.value?.file_count ?? 0,
    to: "/admin/files",
    dotClass: "bg-primary",
  },
  {
    key: "pendingFiles",
    value: () => stats.value?.file_pending_count ?? 0,
    to: "/admin/files",
    dotClass: "bg-yellow-500",
  },
  {
    key: "pendingReports",
    value: () => pendingReports.value,
    to: "/admin/reports",
    dotClass: "bg-red-500",
  },
];

async function loadStats(): Promise<void> {
  const res = await adminFetch("/api/v1/admin/stats");
  const body = await readAdminResp(res);
  stats.value = body.data as AdminStats;
}

async function loadPendingReports(): Promise<void> {
  const res = await adminFetch("/api/v1/admin/reports?status=pending&size=1");
  const body = await readAdminResp(res);
  pendingReports.value = (body.data as { total?: number }).total ?? 0;
}

// Promise.all 是 fail-fast：任一路失败会把另一路已经拿到的结果一起丢掉、所有卡片显示 0；
// 改为各请求独立结算，单路失败只影响它自己的卡片
async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  const results = await Promise.allSettled([loadStats(), loadPendingReports()]);
  for (const r of results) {
    if (r.status === "rejected") {
      error.value =
        r.reason instanceof Error ? r.reason.message : t("admin.loadFailed");
    }
  }
  loading.value = false;
}

onMounted(load);
</script>

<template>
  <div>
    <!-- 失败态给一条重试路径：否则只能整页刷新 -->
    <div v-if="error" class="text-sm text-red-500 mb-4 flex items-center gap-3">
      <span>{{ error }}</span>
      <button type="button" class="underline hover:no-underline" @click="load">
        {{ t("common.retry") }}
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <template v-if="loading">
        <n-card v-for="i in cards.length" :key="i" class="h-24">
          <n-skeleton text :repeat="2" />
        </n-card>
      </template>
      <template v-else>
        <a v-for="c in cards" :key="c.key" :href="c.to" class="no-underline">
          <n-card hoverable class="cursor-pointer !h-full">
            <n-statistic :value="c.value()" :label="t(`admin.stats.${c.key}`)">
              <template #prefix>
                <span
                  class="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
                  :class="c.dotClass"
                />
              </template>
            </n-statistic>
          </n-card>
        </a>
      </template>
    </div>
  </div>
</template>
