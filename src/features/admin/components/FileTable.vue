<script setup lang="ts">
// 后台文件审核列表 —— 统一走 useAdminPagination（按 status 过滤）
import { ref, onMounted } from "vue";
import { useAdminPagination } from "~/lib/http/useAdminPagination";
import { t } from "~/lib/i18n";

interface AdminFileRow {
  id: number;
  original_name: string;
  uploader_name: string;
  size: number;
  category_name: string;
  status: string;
  description: string;
  created_at: string;
}

const statusFilter = ref<"all" | "pending" | "approved" | "rejected">("all");

const statusLabel = (key: string): string =>
  ({
    pending: t("admin.fileStatus.pending"),
    approved: t("admin.fileStatus.approved"),
    rejected: t("admin.fileStatus.rejected"),
  })[key] ?? key;

function fmtSize(bytes: number): string {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

const { items, total, page, totalPages, loading, error, refresh, goTo } =
  useAdminPagination<AdminFileRow>((page, limit) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (statusFilter.value !== "all") params.set("status", statusFilter.value);
    return `/api/v1/files?${params.toString()}`;
  }, 20);

const rows = items;

function setFilter(f: "all" | "pending" | "approved" | "rejected") {
  statusFilter.value = f;
  page.value = 1;
  void refresh();
}

onMounted(() => void refresh());
</script>

<template>
  <div>
    <div class="flex gap-2 mb-4">
      <button
        v-for="f in ['all', 'pending', 'approved', 'rejected'] as const"
        :key="f"
        class="px-3 py-1.5 rounded-lg text-sm font-medium"
        :class="
          statusFilter === f
            ? 'bg-primary text-on-primary'
            : 'bg-surface-3 text-text-muted'
        "
        @click="setFilter(f)"
      >
        {{ f === "all" ? t("admin.files.all") : statusLabel(f) }}
      </button>
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</div>

    <div class="bg-card-bg border border-surface-3 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-3/50">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.files.filename") }}
            </th>
            <th
              class="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell"
            >
              {{ t("admin.files.uploader") }}
            </th>
            <th
              class="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell"
            >
              {{ t("admin.files.size") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.files.status") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-3">
          <tr
            v-for="f in rows"
            :key="f.id"
            class="hover:bg-page-bg transition-colors"
          >
            <td class="px-4 py-3">
              <div class="font-medium text-deep-text line-clamp-1 max-w-56">
                {{ f.original_name }}
              </div>
              <div class="text-xs text-text-muted/60">
                {{ f.category_name || t("admin.files.uncategorized") }}
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-text-muted">
              {{ f.uploader_name || "—" }}
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-text-muted">
              {{ fmtSize(f.size) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="{
                  'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-500':
                    f.status === 'pending',
                  'bg-green-100 dark:bg-green-950/30 text-green-500':
                    f.status === 'approved',
                  'bg-red-100 dark:bg-red-950/30 text-red-500':
                    f.status === 'rejected',
                }"
              >
                {{ statusLabel(f.status) }}
              </span>
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-text-muted">
              {{ t("admin.files.empty") }}
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
