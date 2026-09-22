<script setup lang="ts">
// 后台帖子管理列表 —— 统一走 useAdminPagination
import { onMounted } from "vue";
import { useAdminPagination } from "~/lib/http/useAdminPagination";
import { t } from "~/lib/i18n";
import type { ContentItem } from "~/lib/api/modules/content";

// 复用后端返回结构的权威类型：本地再写一份会在 API 形状变化时静默漂移
type AdminPostRow = Pick<
  ContentItem,
  | "id"
  | "title"
  | "author_name"
  | "board_id"
  | "view_count"
  | "comment_count"
  | "created_at"
>;

/** 按本地时区渲染日期：直接 slice(0,10) 取的是 UTC 日期，东八区晚间会显示成前一天 */
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const { items, total, page, totalPages, loading, error, refresh, goTo } =
  useAdminPagination<AdminPostRow>((page, limit) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return `/api/v1/admin/content/items?${params.toString()}`;
  }, 20);

const rows = items;

onMounted(() => void refresh());
</script>

<template>
  <div>
    <div v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</div>

    <div class="bg-card-bg border border-surface-3 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-3/50">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.posts.title") }}
            </th>
            <th
              class="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell"
            >
              {{ t("blog.author") }}
            </th>
            <th
              class="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell"
            >
              {{ t("admin.posts.category") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.posts.views") }}
            </th>
            <th
              class="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell"
            >
              {{ t("blog.comments") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.posts.createdAt") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-3">
          <tr
            v-for="p in rows"
            :key="p.id"
            class="hover:bg-page-bg transition-colors"
          >
            <td
              class="px-4 py-3 font-medium text-deep-text line-clamp-1 max-w-72"
            >
              {{ p.title }}
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-text-muted">
              {{ p.author_name || "—" }}
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-text-muted">
              {{ p.board_id }}
            </td>
            <td class="px-4 py-3 text-text-muted">{{ p.view_count }}</td>
            <td class="px-4 py-3 hidden md:table-cell text-text-muted">
              {{ p.comment_count }}
            </td>
            <td class="px-4 py-3 text-text-muted">
              {{ fmtDate(p.created_at) }}
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-text-muted">
              {{ t("admin.posts.empty") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between mt-4 text-sm text-text-muted">
      <span>{{ t("admin.pagination", { total, page, totalPages }) }}</span>
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 rounded-lg bg-surface-3 text-deep-text disabled:opacity-40"
          :disabled="page <= 1"
          @click="goTo(page - 1)"
        >
          {{ t("admin.prevPage") }}
        </button>
        <button
          class="px-3 py-1.5 rounded-lg bg-surface-3 text-deep-text disabled:opacity-40"
          :disabled="page >= totalPages"
          @click="goTo(page + 1)"
        >
          {{ t("admin.nextPage") }}
        </button>
      </div>
    </div>
  </div>
</template>
