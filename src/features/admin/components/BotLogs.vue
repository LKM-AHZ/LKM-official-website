<script setup lang="ts">
// 后台「机器人日志」原生页 —— 历史回填 + SSE 实时流，全部经社区 BFF（不暴露 bot 密钥）。
//
// 行为对齐面板 ConsolePage 的主路径：实时跟随、暂停/继续、搜索过滤、隐藏用户聊天、
// 字号调节、导出诊断 ZIP、pip 安装。BFF 未配置或不可达时**回退到同源 iframe 完整面板**，
// 保证与原入口行为一致（降级而不是缺功能）。
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  NButton,
  NCard,
  NInput,
  NModal,
  NSelect,
  NSwitch,
  NTag,
} from "naive-ui";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

interface LogEntry {
  type?: string;
  level?: string;
  time?: number;
  data?: string;
  category?: string;
}

interface HistoryResp {
  configured: boolean;
  available: boolean;
  reason?: string | null;
  logs: LogEntry[];
}

const props = defineProps<{ ticket?: string }>();

const mode = ref<"loading" | "native" | "fallback">("loading");
const logs = ref<LogEntry[]>([]);
const buffered = ref<LogEntry[]>([]);
const search = ref("");
const paused = ref(false);
const follow = ref(true);
const hideUserChat = ref(
  localStorage.getItem("bot_console_hide_user_chat") === "true",
);
const fontSize = ref(
  Number(localStorage.getItem("bot_console_log_font_size")) || 12,
);
const viewer = ref<HTMLElement | null>(null);
const fallbackReason = ref("");
const pipOpen = ref(false);
const pipPackage = ref("");
const pipMirror = ref("");
const pipBusy = ref(false);
const pipResult = ref("");

let source: EventSource | null = null;

const fallbackSrc = computed(() => {
  const next = encodeURIComponent("/data/logs");
  return props.ticket
    ? `/bot/api/v1/auth/sso?ticket=${encodeURIComponent(props.ticket)}&next=${next}`
    : `/bot/#/data/logs`;
});

const visibleLogs = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return logs.value.filter((entry) => {
    if (hideUserChat.value && entry.category === "user_chat") return false;
    if (!keyword) return true;
    return (entry.data ?? "").toLowerCase().includes(keyword);
  });
});

function levelColor(level?: string): string {
  switch ((level ?? "").toUpperCase()) {
    case "ERROR":
    case "CRITICAL":
      return "text-red-500";
    case "WARNING":
      return "text-amber-500";
    case "DEBUG":
      return "text-gray-400";
    default:
      return "text-deep-text";
  }
}

function push(entry: LogEntry) {
  if (entry.type !== "log") return;
  if (paused.value) {
    buffered.value.push(entry);
    return;
  }
  logs.value.push(entry);
  if (logs.value.length > 3000) logs.value.splice(0, logs.value.length - 3000);
  if (follow.value) scrollToBottom();
}

async function scrollToBottom() {
  await nextTick();
  if (viewer.value) viewer.value.scrollTop = viewer.value.scrollHeight;
}

function connect() {
  source?.close();
  source = new EventSource("/api/v1/admin/bot/logs/live");
  source.onmessage = (event) => {
    try {
      push(JSON.parse(event.data) as LogEntry);
    } catch {
      /* 非 JSON 帧（如心跳注释）忽略 */
    }
  };
}

function resume() {
  paused.value = false;
  if (buffered.value.length) {
    logs.value.push(...buffered.value);
    buffered.value = [];
    if (follow.value) scrollToBottom();
  }
}

function toggleFollow(value: boolean) {
  follow.value = value;
  if (value) scrollToBottom();
}

watch(hideUserChat, (value) =>
  localStorage.setItem("bot_console_hide_user_chat", String(value)),
);
watch(fontSize, (value) =>
  localStorage.setItem(
    "bot_console_log_font_size",
    String(Math.min(16, Math.max(8, value))),
  ),
);

function exportLogs() {
  window.location.href = "/api/v1/admin/bot/logs/export?redact=true";
}

async function installPip() {
  if (!pipPackage.value.trim()) return;
  pipBusy.value = true;
  pipResult.value = "";
  try {
    const res = await adminFetch("/api/v1/admin/bot/pip/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package: pipPackage.value.trim(),
        ...(pipMirror.value.trim() ? { mirror: pipMirror.value.trim() } : {}),
      }),
    });
    const body = await readAdminResp(res);
    pipResult.value = body.message || t("page.admin.bot.logs.pipDone");
    pipPackage.value = "";
  } catch (err) {
    pipResult.value = err instanceof Error ? err.message : String(err);
  } finally {
    pipBusy.value = false;
  }
}

onMounted(async () => {
  try {
    const res = await adminFetch("/api/v1/admin/bot/logs/history");
    const body = await readAdminResp(res);
    const data = body.data as HistoryResp;
    if (!data.configured || !data.available) {
      fallbackReason.value = data.reason ?? "unavailable";
      mode.value = "fallback";
      return;
    }
    logs.value = data.logs;
    mode.value = "native";
    connect();
    await scrollToBottom();
  } catch (err) {
    fallbackReason.value = err instanceof Error ? err.message : String(err);
    mode.value = "fallback";
  }
});

onBeforeUnmount(() => {
  source?.close();
  source = null;
});
</script>

<template>
  <div class="space-y-4">
    <div v-if="mode === 'loading'" class="text-sm text-gray-500">
      {{ t("page.admin.bot.logs.loading") }}
    </div>

    <div v-else-if="mode === 'fallback'" class="space-y-3">
      <NCard size="small">
        <p class="text-sm text-gray-500">
          {{ t("page.admin.bot.logs.fallbackHint") }}
          <span v-if="fallbackReason" class="text-xs"
            >({{ fallbackReason }})</span
          >
        </p>
      </NCard>
      <iframe
        :src="fallbackSrc"
        :title="t('page.admin.bot.logs.title')"
        class="h-[70vh] w-full rounded-lg border-0"
        referrerpolicy="no-referrer"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
      ></iframe>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2">
        <NInput
          v-model:value="search"
          clearable
          size="small"
          class="w-56"
          :placeholder="t('page.admin.bot.logs.search')"
        />
        <NButton size="small" @click="paused ? resume() : (paused = true)">
          {{
            paused
              ? t("page.admin.bot.logs.resume")
              : t("page.admin.bot.logs.pause")
          }}
        </NButton>
        <NButton size="small" @click="exportLogs">
          {{ t("page.admin.bot.logs.export") }}
        </NButton>
        <NButton size="small" @click="pipOpen = true">
          {{ t("page.admin.bot.logs.pip") }}
        </NButton>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <NSwitch
            v-model:value="follow"
            size="small"
            @update:value="toggleFollow"
          />
          {{ t("page.admin.bot.logs.follow") }}
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <NSwitch v-model:value="hideUserChat" size="small" />
          {{ t("page.admin.bot.logs.hideUserChat") }}
        </div>
        <div class="ml-auto flex items-center gap-1 text-sm text-gray-500">
          <NButton size="tiny" :disabled="fontSize <= 8" @click="fontSize -= 2"
            >－</NButton
          >
          <span>{{ fontSize }}px</span>
          <NButton size="tiny" :disabled="fontSize >= 16" @click="fontSize += 2"
            >＋</NButton
          >
        </div>
      </div>

      <div
        ref="viewer"
        class="max-h-[70vh] overflow-auto rounded-lg border border-gray-200 bg-black/90 p-3 font-mono leading-relaxed"
        :style="{ fontSize: `${fontSize}px` }"
      >
        <div v-if="!visibleLogs.length" class="text-gray-500">
          {{ t("page.admin.bot.logs.empty") }}
        </div>
        <div
          v-for="(entry, index) in visibleLogs"
          :key="index"
          class="whitespace-pre-wrap"
        >
          <NTag size="tiny" :bordered="false" class="mr-2">{{
            entry.level ?? "INFO"
          }}</NTag>
          <span :class="levelColor(entry.level)">{{ entry.data }}</span>
        </div>
      </div>

      <NModal
        v-model:show="pipOpen"
        preset="card"
        class="max-w-lg"
        :title="t('page.admin.bot.logs.pip')"
      >
        <div class="space-y-3">
          <NInput
            v-model:value="pipPackage"
            :placeholder="t('page.admin.bot.logs.pipPackage')"
          />
          <NSelect
            v-model:value="pipMirror"
            clearable
            :options="[
              { label: t('page.admin.bot.logs.pipMirrorDefault'), value: '' },
              { label: 'PyPI', value: 'https://pypi.org/simple' },
              {
                label: 'Tsinghua',
                value: 'https://pypi.tuna.tsinghua.edu.cn/simple',
              },
            ]"
          />
          <NButton
            type="primary"
            :loading="pipBusy"
            :disabled="!pipPackage.trim()"
            @click="installPip"
          >
            {{ t("page.admin.bot.logs.pipInstall") }}
          </NButton>
          <p v-if="pipResult" class="text-sm text-gray-500">{{ pipResult }}</p>
        </div>
      </NModal>
    </template>
  </div>
</template>
