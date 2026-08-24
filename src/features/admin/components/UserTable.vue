<script setup lang="ts">
// 后台用户管理列表 —— 统一走 useAdminPagination
import { ref, onMounted } from "vue";
import { useAdminPagination } from "~/lib/http/useAdminPagination";
import { t } from "~/lib/i18n";

interface AdminUserRow {
  id: number;
  username: string;
  account_level: string;
  is_locked: boolean;
  created_at: string;
  email: string | null;
  phone: string | null;
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

onMounted(() => void load());
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-4 items-center">
      <input
        v-model="keyword"
        type="text"
        :placeholder="t('admin.users.searchPlaceholder')"
        class="px-3 py-1.5 rounded-lg text-sm bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
        @keyup.enter="
          page = 1;
          load();
        "
      />
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary"
        :disabled="loading"
        @click="
          page = 1;
          load();
        "
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
