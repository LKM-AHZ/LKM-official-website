<script setup lang="ts">
// 后台文件审核列表 —— 统一走 useAdminPagination（按 status 过滤）+ 待审文件批量审核。
import { computed, ref } from "vue";
import { useAdminPagination } from "~/lib/http/useAdminPagination";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { useAdminMFA } from "~/lib/http/useAdminMFA";
import { t } from "~/lib/i18n";
import AdminMFAVerifyDialog from "./AdminMFAVerifyDialog.vue";

interface AdminFileRow {
  id: string;
  original_name: string;
  uploader_name: string;
  size: number;
  category_name: string;
  status: string;
  description: string;
  created_at: string;
}

interface BatchResult {
  succeeded: number;
  failed: number;
  results: { file_id: string; ok: boolean; error: string | null }[];
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

// 首屏加载由 useAdminPagination → usePagination 的 immediate（默认 true）在 setup 期完成，
// 这里再挂 onMounted(refresh) 会重复发一次同样的第 1 页请求
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

// —— 批量审核（仅 pending 行；限 50 条、后端逐条独立事务）——
const selected = ref<Set<string>>(new Set());
const batchReason = ref("");
const batchBusy = ref(false);
const batchError = ref("");
const batchResult = ref<BatchResult | null>(null);
const mfa = useAdminMFA();

const pendingRows = computed(() =>
  rows.value.filter((row) => row.status === "pending"),
);
const allPendingSelected = computed(
  () =>
    pendingRows.value.length > 0 &&
    pendingRows.value.every((row) => selected.value.has(row.id)),
);

function toggleRow(id: string): void {
  const next = new Set(selected.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected.value = next;
}

function toggleAll(): void {
  selected.value = allPendingSelected.value
    ? new Set()
    : new Set(pendingRows.value.map((row) => row.id));
}

async function submitBatch(action: "approve" | "reject"): Promise<void> {
  const ids = [...selected.value];
  if (!ids.length) return;
  const reason = batchReason.value.trim();
  if (action === "reject" && !reason) {
    batchError.value = t("admin.files.batchReasonRequired");
    return;
  }
  const confirmed = window.confirm(
    t(
      action === "approve"
        ? "admin.files.batchConfirmApprove"
        : "admin.files.batchConfirmReject",
      { n: ids.length },
    ),
  );
  if (!confirmed) return;

  batchBusy.value = true;
  batchError.value = "";
  batchResult.value = null;
  try {
    await mfa.run(async () => {
      const res = await adminFetch("/api/v1/files/review-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_ids: ids,
          status: action === "approve" ? "approved" : "rejected",
          review_comment: action === "reject" ? reason : undefined,
        }),
      });
      const body = await readAdminResp(res);
      batchResult.value = body.data as BatchResult;
      selected.value = new Set();
      batchReason.value = "";
      await refresh();
    });
  } catch (e) {
    batchError.value = e instanceof Error ? e.message : t("admin.loadFailed");
  } finally {
    batchBusy.value = false;
  }
}
</script>

<template>
  <div>
    <AdminMFAVerifyDialog
      :state="mfa.dialog"
      @verify="mfa.onCode"
      @cancel="mfa.onCancel"
    />
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

    <div
      v-if="selected.size || batchResult || batchError"
      class="mb-4 rounded-xl border border-surface-3 bg-card-bg p-3 space-y-2"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-text-muted">
          {{ t("admin.files.batchSelected", { n: selected.size }) }}
        </span>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm bg-green-100 dark:bg-green-950/30 text-green-600 disabled:opacity-40"
          :disabled="!selected.size || batchBusy"
          @click="submitBatch('approve')"
        >
          {{ t("admin.files.batchApprove") }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm bg-red-100 dark:bg-red-950/30 text-red-500 disabled:opacity-40"
          :disabled="!selected.size || batchBusy"
          @click="submitBatch('reject')"
        >
          {{ t("admin.files.batchReject") }}
        </button>
        <input
          v-model="batchReason"
          type="text"
          :placeholder="t('admin.files.batchReasonPlaceholder')"
          class="flex-1 min-w-48 px-3 py-1.5 rounded-lg text-sm bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          class="text-sm text-text-muted underline"
          @click="selected = new Set()"
        >
          {{ t("common.cancel") }}
        </button>
      </div>
      <p v-if="batchError" class="text-sm text-red-500">{{ batchError }}</p>
      <div v-if="batchResult" class="text-sm">
        <p class="text-text-muted">
          {{
            t("admin.files.batchResult", {
              ok: batchResult.succeeded,
              failed: batchResult.failed,
            })
          }}
        </p>
        <ul
          v-if="batchResult.failed"
          class="mt-1 space-y-0.5 text-xs text-red-500"
        >
          <li
            v-for="item in batchResult.results.filter((r) => !r.ok)"
            :key="item.file_id"
          >
            {{ item.file_id }}：{{ item.error || t("admin.loadFailed") }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</div>

    <div class="bg-card-bg border border-surface-3 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-3/50">
          <tr>
            <th class="px-2 py-3 w-8">
              <input
                type="checkbox"
                :checked="allPendingSelected"
                :disabled="!pendingRows.length"
                :aria-label="t('admin.files.batchSelectAll')"
                @change="toggleAll"
              />
            </th>
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
            <td class="px-2 py-3">
              <input
                v-if="f.status === 'pending'"
                type="checkbox"
                :checked="selected.has(f.id)"
                @change="toggleRow(f.id)"
              />
            </td>
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
                  // 后端新增状态时给中性底色，避免 badge 变成无样式的裸文本
                  // （文案侧 statusLabel 已回退为原始值，不再假装成某个已知状态）
                  'bg-surface-3 text-text-muted': ![
                    'pending',
                    'approved',
                    'rejected',
                  ].includes(f.status),
                }"
              >
                {{ statusLabel(f.status) }}
              </span>
            </td>
          </tr>
          <!-- 加载态单独占一行：原先只有空态行且被 !loading 挡住，首次加载时表体整片空白 -->
          <tr v-if="loading">
            <td colspan="5" class="px-4 py-8 text-center text-text-muted">
              <span class="inline-block animate-pulse">…</span>
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-text-muted">
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
