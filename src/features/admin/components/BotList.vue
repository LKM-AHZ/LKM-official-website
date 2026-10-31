<script setup lang="ts">
// 机器人资源列表（平台/模型/插件/知识库共用）：数据经社区 BFF，编辑仍用完整面板。
//
// 行为约定：
// - BFF 未配置或不可达 → 整页回退同源 iframe 完整面板（与迁移前一致，不降级功能）；
// - 编辑动作不重写面板表单，而是在弹窗里加载面板原页面（同一票据/同一实现），
//   因此保存、2FA、动态表单等行为与面板完全一致；
// - 启停是幂等开关，直接走 BFF 的 PATCH 代理并写审计。
import { computed, onMounted, ref } from "vue";
import { NButton, NCard, NModal, NSwitch, NTag } from "naive-ui";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

interface Item {
  id: string;
  name?: string;
  subtitle?: string;
  enabled?: boolean | null;
  type?: string | null;
  display_name?: string | null;
  model?: string | null;
}

interface ListResp {
  configured: boolean;
  available: boolean;
  reason?: string | null;
  items: Item[];
}

const props = defineProps<{
  listPath: string;
  toggleBase?: string;
  hashRoute: string;
  ticket?: string;
  titleKey: string;
  columns: { key: string; label: string }[];
}>();

const mode = ref<"loading" | "native" | "fallback">("loading");
const items = ref<Item[]>([]);
const reason = ref("");
const error = ref("");
const editorOpen = ref(false);
const editorSrc = ref("");
const busyId = ref("");

const fallbackSrc = computed(() => {
  const next = encodeURIComponent(props.hashRoute);
  return props.ticket
    ? `/bot/api/v1/auth/sso?ticket=${encodeURIComponent(props.ticket)}&next=${next}`
    : `/bot/#${props.hashRoute}`;
});

function cell(item: Item, key: string): string {
  if (key === "name") return item.display_name || item.name || item.id;
  const value = (item as unknown as Record<string, unknown>)[key];
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

async function load() {
  try {
    const res = await adminFetch(props.listPath);
    const body = await readAdminResp(res);
    const data = body.data as ListResp;
    if (!data.configured || !data.available) {
      reason.value = data.reason ?? "unavailable";
      mode.value = "fallback";
      return;
    }
    items.value = data.items;
    mode.value = "native";
  } catch (err) {
    reason.value = err instanceof Error ? err.message : String(err);
    mode.value = "fallback";
  }
}

async function openEditor() {
  // 票据是一次性的：每次打开编辑器都向社区后端换一张新票，避免复用已被消费的票。
  try {
    const res = await adminFetch("/api/v1/admin/bot/sso-ticket", {
      method: "POST",
    });
    const body = await readAdminResp(res);
    const ticket = (body.data as { ticket?: string }).ticket ?? "";
    editorSrc.value = `/bot/api/v1/auth/sso?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(props.hashRoute)}`;
    editorOpen.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
}

async function toggle(item: Item, value: boolean) {
  if (!props.toggleBase) return;
  busyId.value = item.id;
  error.value = "";
  try {
    const res = await adminFetch(
      `${props.toggleBase}${encodeURIComponent(item.id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: value }),
      },
    );
    await readAdminResp(res);
    item.enabled = value;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    busyId.value = "";
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div v-if="mode === 'loading'" class="text-sm text-gray-500">
      {{ t("page.admin.bot.common.loading") }}
    </div>

    <div v-else-if="mode === 'fallback'" class="space-y-3">
      <NCard size="small">
        <p class="text-sm text-gray-500">
          {{ t("page.admin.bot.common.fallbackHint") }}
          <span v-if="reason" class="text-xs">({{ reason }})</span>
        </p>
      </NCard>
      <iframe
        :src="fallbackSrc"
        :title="t(titleKey)"
        class="h-[70vh] w-full rounded-lg border-0"
        referrerpolicy="no-referrer"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
      ></iframe>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">
          {{ t("page.admin.bot.common.total", { count: items.length }) }}
        </p>
        <NButton size="small" @click="openEditor">
          {{ t("page.admin.bot.common.editInPanel") }}
        </NButton>
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <div class="overflow-x-auto rounded-lg border border-gray-200">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left text-gray-500">
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-2 font-medium"
              >
                {{ col.label }}
              </th>
              <th class="px-4 py-2 font-medium">
                {{ t("page.admin.bot.common.status") }}
              </th>
              <th class="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!items.length">
              <td
                :colspan="columns.length + 2"
                class="px-4 py-6 text-center text-gray-500"
              >
                {{ t("page.admin.bot.common.empty") }}
              </td>
            </tr>
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-t border-gray-100"
            >
              <td v-for="col in columns" :key="col.key" class="px-4 py-2">
                {{ cell(item, col.key) }}
              </td>
              <td class="px-4 py-2">
                <template
                  v-if="
                    toggleBase &&
                    item.enabled !== null &&
                    item.enabled !== undefined
                  "
                >
                  <NSwitch
                    :value="item.enabled"
                    size="small"
                    :loading="busyId === item.id"
                    @update:value="(v: boolean) => toggle(item, v)"
                  />
                </template>
                <NTag
                  v-else-if="
                    item.enabled !== null && item.enabled !== undefined
                  "
                  size="tiny"
                >
                  {{
                    item.enabled
                      ? t("page.admin.bot.common.on")
                      : t("page.admin.bot.common.off")
                  }}
                </NTag>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-2 text-right">
                <NButton size="tiny" text @click="openEditor">
                  {{ t("page.admin.bot.common.edit") }}
                </NButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <NModal
        v-model:show="editorOpen"
        preset="card"
        class="max-w-6xl"
        :title="t(titleKey)"
      >
        <iframe
          v-if="editorSrc"
          :src="editorSrc"
          :title="t(titleKey)"
          class="h-[70vh] w-full rounded-lg border-0"
          referrerpolicy="no-referrer"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        ></iframe>
      </NModal>
    </template>
  </div>
</template>
