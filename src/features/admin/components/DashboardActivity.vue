<script setup lang="ts">
// 后台控制台最近活动 —— 复用现有只读端点，三组独立容错。
//
// 三组数据分别来自 /admin/users、/admin/content/items、/admin/reports，均解包 data.items
// 组装为「可点击行」。用 Promise.allSettled 让单组请求失败（rejected → 空数组）
// 不至于拖垮整页，任一组的失败只影响当期卡片（展示「暂无数据」兜底）。
import { ref, onMounted } from "vue";
import { NCard, NList, NListItem } from "naive-ui";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

interface Row {
  key: string;
  label: string;
  time?: string;
  to: string;
}

const groups = ref<{ title: string; rows: Row[] }[]>([
  { title: t("admin.activity.latestUsers"), rows: [] },
  { title: t("admin.activity.latestPosts"), rows: [] },
  { title: t("admin.activity.latestReports"), rows: [] },
]);
const loading = ref(true);

async function fetchUsers() {
  const res = await adminFetch("/api/v1/admin/users?size=5");
  const body = await readAdminResp(res);
  return (
    body.data as { items: Array<{ username: string; created_at?: string }> }
  ).items.map((u) => ({
    key: `u${u.username}`,
    label: u.username,
    time: u.created_at,
    to: "/admin/users",
  }));
}

async function fetchPosts() {
  const res = await adminFetch("/api/v1/admin/content/items?page=1&limit=5");
  const body = await readAdminResp(res);
  return (
    body.data as { items: Array<{ title: string; created_at?: string }> }
  ).items.map((p) => ({
    key: `p${p.title}`,
    label: p.title,
    time: p.created_at,
    to: "/admin/posts",
  }));
}

async function fetchReports() {
  const res = await adminFetch("/api/v1/admin/reports");
  const body = await readAdminResp(res);
  return (
    body.data as { items: Array<{ target_title: string; created_at?: string }> }
  ).items.map((r) => ({
    key: `r${r.target_title}`,
    label: r.target_title,
    time: r.created_at,
    to: "/admin/reports",
  }));
}

/** 把某组请求结果写入对应分组的 rows；失败时仅降级为空数组 + 用 console.error
 *  暴露失败原因，避免坏端点被 UI 伪装成「真的没数据」。 */
function assignGroup(
  g: { rows: Row[] },
  settled: PromiseSettledResult<Row[]>,
  logLabel: string,
) {
  g.rows = settled.status === "fulfilled" ? settled.value : [];
  if (settled.status === "rejected") console.error(logLabel, settled.reason);
}

onMounted(async () => {
  const [users, posts, reports] = await Promise.allSettled([
    fetchUsers(),
    fetchPosts(),
    fetchReports(),
  ]);
  assignGroup(groups.value[0], users, "[admin/activity] 拉取最新用户失败");
  assignGroup(groups.value[1], posts, "[admin/activity] 拉取最新帖子失败");
  assignGroup(groups.value[2], reports, "[admin/activity] 拉取最新举报失败");
  loading.value = false;
});
</script>

<template>
  <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <n-card v-for="i in 3" :key="i" class="h-40" />
  </div>
  <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <n-card v-for="g in groups" :key="g.title" :title="g.title" size="small">
      <n-list>
        <a v-for="r in g.rows" :key="r.key" :href="r.to">
          <n-list-item>
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-sm">{{ r.label }}</span>
              <span v-if="r.time" class="text-xs text-text-muted shrink-0">{{
                r.time
              }}</span>
            </div>
          </n-list-item>
        </a>
        <div v-if="!g.rows.length" class="text-sm text-text-muted py-2 px-3">
          {{ t("admin.activity.empty") }}
        </div>
      </n-list>
    </n-card>
  </div>
</template>
