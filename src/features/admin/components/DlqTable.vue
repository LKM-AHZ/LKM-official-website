<script setup lang="ts">
// DlqTable.vue — 后台死信队列：按状态查看、重投、丢弃。
// 列表/重投/丢弃均走 adminFetch（后端 require_admin，无 2FA step-up）。
import { ref, onMounted } from "vue";
import { dlqApi } from "~/lib/api";
import type { DlqMessageInfo, DlqStatus } from "~/lib/api/modules/dlq";
import { t } from "~/lib/i18n";

const STATUSES: DlqStatus[] = ["pending", "requeued", "discarded"];
const STATUS_LABEL: Record<DlqStatus, string> = {
  pending: "admin.dlq.statusPending",
  requeued: "admin.dlq.statusRequeued",
  discarded: "admin.dlq.statusDiscarded",
};

const status = ref<DlqStatus>("pending");
const rows = ref<DlqMessageInfo[]>([]);
const loading = ref(false);
const error = ref("");
const message = ref("");
const actingId = ref<string | null>(null);

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    rows.value = await dlqApi.list(status.value);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("admin.loadFailed");
  } finally {
    loading.value = false;
  }
}

async function switchStatus(s: DlqStatus): Promise<void> {
  status.value = s;
  message.value = "";
  await load();
}

async function requeue(id: string): Promise<void> {
  actingId.value = id;
  error.value = "";
  try {
    await dlqApi.requeue(id);
    message.value = t("admin.dlq.requeued");
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("admin.loadFailed");
  } finally {
    actingId.value = null;
  }
}

async function discard(id: string): Promise<void> {
  if (!window.confirm(t("admin.dlq.confirmDiscard"))) return;
  actingId.value = id;
  error.value = "";
  try {
    await dlqApi.discard(id);
    message.value = t("admin.dlq.discarded");
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("admin.loadFailed");
  } finally {
    actingId.value = null;
  }
}

function payloadText(p: unknown): string {
  try {
    return JSON.stringify(p ?? null, null, 2);
  } catch {
    return String(p);
  }
}

onMounted(() => void load());
</script>

<template>
  <div>
    <!-- 状态筛选 -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="s in STATUSES"
        :key="s"
        type="button"
        class="px-3 py-1.5 rounded-lg text-sm transition-colors"
        :class="
          status === s
            ? 'bg-primary text-on-primary'
            : 'bg-surface-3 text-deep-text hover:bg-surface-3/70'
        "
        @click="switchStatus(s)"
      >
        {{ t(STATUS_LABEL[s]) }}
      </button>
    </div>

    <p v-if="message" class="mb-3 text-sm text-green-600">{{ message }}</p>
    <div v-if="error" class="mb-3 text-sm text-red-500">{{ error }}</div>

    <div v-if="loading" class="text-sm text-text-muted py-6">
      {{ t("common.loading") }}
    </div>
    <div
      v-else-if="rows.length === 0"
      class="text-sm text-text-muted py-6 text-center"
    >
      {{ t("admin.dlq.empty") }}
    </div>
    <div
      v-else
      class="bg-card-bg border border-surface-3 rounded-xl overflow-hidden"
    >
      <table class="w-full text-sm">
        <thead class="bg-surface-3/50">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.dlq.routingKey") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.dlq.attempts") }}
            </th>
            <th
              class="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell"
            >
              {{ t("admin.dlq.reason") }}
            </th>
            <th
              class="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell"
            >
              {{ t("admin.dlq.createdAt") }}
            </th>
            <th
              class="text-right px-4 py-3 font-medium text-text-muted whitespace-nowrap"
            >
              {{ t("admin.actions") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-3">
          <template v-for="r in rows" :key="r.id">
            <tr class="hover:bg-page-bg transition-colors">
              <td class="px-4 py-3 font-medium text-deep-text">
                {{ r.routing_key }}
              </td>
              <td class="px-4 py-3 text-text-muted">{{ r.attempts }}</td>
              <td class="px-4 py-3 hidden md:table-cell text-text-muted">
                {{ r.reason || "—" }}
              </td>
              <td class="px-4 py-3 hidden sm:table-cell text-text-muted">
                {{
                  r.created_at
                    ? r.created_at.slice(0, 19).replace("T", " ")
                    : "—"
                }}
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <template v-if="status === 'pending'">
                  <button
                    type="button"
                    class="text-primary hover:underline mr-3 disabled:opacity-40"
                    :disabled="actingId === r.id"
                    @click="requeue(r.id)"
                  >
                    {{ t("admin.dlq.requeue") }}
                  </button>
                  <button
                    type="button"
                    class="text-red-500 hover:underline disabled:opacity-40"
                    :disabled="actingId === r.id"
                    @click="discard(r.id)"
                  >
                    {{ t("admin.dlq.discard") }}
                  </button>
                </template>
                <span v-else class="text-text-muted">—</span>
              </td>
            </tr>
            <tr>
              <td colspan="5" class="px-4 pb-3">
                <details>
                  <summary class="cursor-pointer text-xs text-text-muted">
                    {{ t("admin.dlq.payload") }}
                  </summary>
                  <pre
                    class="mt-2 p-3 rounded-lg bg-page-bg border border-surface-3 text-xs text-text-muted overflow-x-auto"
                    >{{ payloadText(r.payload) }}</pre>
                </details>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
