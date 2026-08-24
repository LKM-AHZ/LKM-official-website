<script setup lang="ts">
// 后台帖子管理列表 —— 统一走 useAdminPagination
import { onMounted } from "vue";
import { useAdminPagination } from "~/lib/http/useAdminPagination";

interface AdminPostRow {
  id: number;
  title: string;
  author_name: string;
  category_id: string;
  view_count: number;
  comment_count: number;
  created_at: string;
}

const { items, total, page, totalPages, loading, error, refresh, goTo } =
  useAdminPagination<AdminPostRow>((page, limit) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return `/api/v1/forum/posts?${params.toString()}`;
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
              {{ p.category_id }}
            </td>
            <td class="px-4 py-3 text-text-muted">{{ p.view_count }}</td>
            <td class="px-4 py-3 hidden md:table-cell text-text-muted">
              {{ p.comment_count }}
            </td>
            <td class="px-4 py-3 text-text-muted">
              {{ p.created_at ? p.created_at.slice(0, 10) : "—" }}
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
