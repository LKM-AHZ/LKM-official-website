<script setup lang="ts">
// 后台用户管理列表 —— 统一走 useAdminPagination；顶部是准入待审队列（P2 apply 模式）。
import { ref, onMounted } from "vue";
import { useAdminPagination } from "~/lib/http/useAdminPagination";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { useAdminMFA } from "~/lib/http/useAdminMFA";
import { t } from "~/lib/i18n";
import AdminMFAVerifyDialog from "./AdminMFAVerifyDialog.vue";

interface AdminUserRow {
  id: string;
  username: string;
  account_level: string;
  is_locked: boolean;
  created_at: string;
  email: string | null;
  phone: string | null;
}

interface AdmissionRow {
  user_id: string;
  username: string;
  email: string | null;
  admission_status: string;
  applied_at: string | null;
  apply_reason: string | null;
  reject_reason: string | null;
}

const keyword = ref("");
const includePii = ref(false);

const levelLabel = (key: string): string =>
  ({
    local: t("admin.userLevel.local"),
    normal: t("admin.userLevel.normal"),
    admin: t("admin.userLevel.admin"),
  })[key] ?? key;

const { items, total, page, totalPages, loading, error, refresh, goTo } =
  useAdminPagination<AdminUserRow>((page, limit) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      include_pii: String(includePii.value),
    });
    if (keyword.value.trim()) params.set("keyword", keyword.value.trim());
    return `/api/v1/admin/users?${params.toString()}`;
  }, 20);

const rows = items;
const load = refresh;

// —— 准入待审队列（仅 apply 模式有数据；open 模式为空）——
const admissionRows = ref<AdmissionRow[]>([]);
const admissionLoading = ref(false);
const admissionError = ref("");
const admissionMessage = ref("");
// 无 admin.users_review 的角色（如 org_member）打开用户页时整块隐藏，不渲染 403 噪音
const admissionVisible = ref(true);
const rejectingId = ref<string | null>(null);
const rejectReason = ref("");
const mfa = useAdminMFA();

async function loadAdmission(): Promise<void> {
  admissionLoading.value = true;
  admissionError.value = "";
  try {
    const res = await adminFetch(
      "/api/v1/admin/admission/users?status=pending",
    );
    if (res.status === 403) {
      admissionVisible.value = false;
      return;
    }
    const body = await readAdminResp(res);
    admissionRows.value = body.data as AdmissionRow[];
  } catch (e) {
    admissionError.value =
      e instanceof Error ? e.message : t("admin.loadFailed");
  } finally {
    admissionLoading.value = false;
  }
}

async function decideAdmission(
  row: AdmissionRow,
  action: "approve" | "reject",
): Promise<void> {
  const reason = action === "reject" ? rejectReason.value.trim() : undefined;
  if (action === "reject" && !reason) return;
  admissionError.value = "";
  admissionMessage.value = "";
  try {
    await mfa.run(async () => {
      const res = await adminFetch(
        `/api/v1/admin/admission/users/${row.user_id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        },
      );
      await readAdminResp(res);
      admissionMessage.value = t(
        action === "approve"
          ? "admin.users.admissionApproved"
          : "admin.users.admissionRejected",
      );
      rejectingId.value = null;
      rejectReason.value = "";
      await loadAdmission();
    });
  } catch (e) {
    admissionError.value =
      e instanceof Error ? e.message : t("admin.loadFailed");
  }
}

// refresh() 内部已把 page 复位为 1（usePagination.ts），模板里再写 page = 1 是重复且易漂移的。
function runSearch(): void {
  void load();
}

onMounted(() => {
  void load();
  void loadAdmission();
});
</script>

<template>
  <div>
    <AdminMFAVerifyDialog
      :state="mfa.dialog"
      @verify="mfa.onCode"
      @cancel="mfa.onCancel"
    />

    <section
      v-if="admissionVisible"
      class="mb-6 bg-card-bg border border-surface-3 rounded-xl p-4"
    >
      <div class="flex items-center gap-2 mb-3">
        <h3 class="text-sm font-semibold text-deep-text">
          {{ t("admin.users.admissionPending") }}
        </h3>
        <span
          v-if="admissionRows.length"
          class="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/30 text-red-500"
          >{{ admissionRows.length }}</span
        >
      </div>
      <p v-if="admissionError" class="mb-2 text-sm text-red-500">
        {{ admissionError }}
      </p>
      <p v-if="admissionMessage" class="mb-2 text-sm text-green-600">
        {{ admissionMessage }}
      </p>
      <div v-if="admissionLoading" class="text-sm text-text-muted py-3">
        {{ t("common.loading") }}
      </div>
      <p v-else-if="!admissionRows.length" class="text-sm text-text-muted py-3">
        {{ t("admin.users.admissionEmpty") }}
      </p>
      <div v-else class="divide-y divide-surface-3">
        <div v-for="row in admissionRows" :key="row.user_id" class="py-2.5">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-medium text-deep-text">{{
              row.username
            }}</span>
            <span class="text-xs text-text-muted">{{ row.email || "—" }}</span>
            <span class="text-xs text-text-muted">
              {{ t("admin.users.appliedAt") }}:
              {{ row.applied_at ? row.applied_at.slice(0, 10) : "—" }}
            </span>
            <span class="ml-auto flex gap-2">
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-950/30 text-green-600"
                @click="decideAdmission(row, 'approve')"
              >
                {{ t("admin.users.approve") }}
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-950/30 text-red-500"
                @click="rejectingId = row.user_id"
              >
                {{ t("admin.users.reject") }}
              </button>
            </span>
          </div>
          <p
            v-if="row.apply_reason"
            class="mt-1 text-xs text-text-muted whitespace-pre-wrap"
          >
            {{ t("admin.users.applyReason") }}: {{ row.apply_reason }}
          </p>
          <div
            v-if="rejectingId === row.user_id"
            class="mt-2 flex flex-wrap gap-2"
          >
            <input
              v-model="rejectReason"
              type="text"
              :placeholder="t('admin.users.rejectReasonPlaceholder')"
              class="flex-1 min-w-40 px-3 py-1.5 rounded-lg text-sm bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-sm bg-primary text-on-primary disabled:opacity-40"
              :disabled="!rejectReason.trim()"
              @click="decideAdmission(row, 'reject')"
            >
              {{ t("common.confirm") }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-sm bg-surface-3 text-deep-text"
              @click="
                rejectingId = null;
                rejectReason = '';
              "
            >
              {{ t("common.cancel") }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="flex flex-wrap gap-2 mb-4 items-center">
      <input
        v-model="keyword"
        type="text"
        :placeholder="t('admin.users.searchPlaceholder')"
        class="px-3 py-1.5 rounded-lg text-sm bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
        @keyup.enter="runSearch"
      />
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary"
        :disabled="loading"
        @click="runSearch"
      >
        {{ t("common.search") }}
      </button>
      <label class="flex items-center gap-1.5 text-sm text-text-muted ml-auto">
        <input v-model="includePii" type="checkbox" @change="load()" />
        {{ t("admin.users.showPii") }}
      </label>
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</div>

    <div class="bg-card-bg border border-surface-3 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-3/50">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-text-muted">ID</th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.users.username") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.users.level") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.users.email") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.users.status") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.users.createdAt") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-3">
          <tr
            v-for="u in rows"
            :key="u.id"
            class="hover:bg-page-bg transition-colors"
          >
            <td class="px-4 py-3 text-text-muted">{{ u.id }}</td>
            <td class="px-4 py-3 font-medium text-deep-text">
              {{ u.username }}
              <span
                v-if="u.account_level === 'admin'"
                class="ml-1 text-xs text-primary"
                >{{ t("admin.userLevel.admin") }}</span
              >
            </td>
            <td class="px-4 py-3 text-text-muted">
              {{ levelLabel(u.account_level) }}
            </td>
            <td class="px-4 py-3 text-text-muted">{{ u.email || "—" }}</td>
            <td class="px-4 py-3">
              <span
                v-if="u.is_locked"
                class="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-950/30 text-red-500"
              >
                {{ t("admin.users.locked") }}
              </span>
              <span
                v-else
                class="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-950/30 text-green-500"
              >
                {{ t("admin.users.active") }}
              </span>
            </td>
            <td class="px-4 py-3 text-text-muted">
              {{ u.created_at ? u.created_at.slice(0, 10) : "—" }}
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-text-muted">
              {{ t("admin.users.empty") }}
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
