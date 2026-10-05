<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import { notificationApi, type SiteNotification } from "~/lib/api";
import { t } from "~/lib/i18n";
import { buildUrl } from "~/lib/utils/paths";
import { useAuthStore } from "~/stores/auth";

const props = withDefaults(defineProps<{ mobile?: boolean }>(), {
  mobile: false,
});
const root = ref<HTMLElement | null>(null);
const panelId = props.mobile
  ? "notification-panel-mobile"
  : "notification-panel-desktop";
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);

const isOpen = ref(false);
const notifications = ref<SiteNotification[]>([]);
const unreadCount = ref(0);
const loadFailed = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | undefined;

async function refresh() {
  if (!isLoggedIn.value) return;
  const [list, count] = await Promise.all([
    notificationApi.list(),
    notificationApi.unreadCount(),
  ]);
  if (!isLoggedIn.value) return;
  loadFailed.value = list.isErr() || count.isErr();
  if (list.isOk()) notifications.value = list.value.items;
  if (count.isOk()) unreadCount.value = count.value.unread;
}

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) void refresh();
  else {
    notifications.value = [];
    unreadCount.value = 0;
    isOpen.value = false;
  }
});

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) void refresh();
}

async function markAsRead(notification: SiteNotification) {
  if (!notification.read_at) {
    const result = await notificationApi.markRead([notification.id]);
    if (result.isOk()) {
      notification.read_at = new Date().toISOString();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }
  const url = notification.payload.url;
  if (
    typeof url === "string" &&
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\")
  ) {
    window.location.assign(buildUrl(url));
  }
}

async function markAllAsRead() {
  const result = await notificationApi.markRead([], true);
  if (result.isErr()) return;
  const now = new Date().toISOString();
  notifications.value = notifications.value.map((n) => ({
    ...n,
    read_at: n.read_at ?? now,
  }));
  unreadCount.value = 0;
}

function getIcon(type: string): string {
  switch (type) {
    case "content_commented":
    case "comment_replied":
      return "material-symbols:chat-bubble-outline";
    case "content_liked":
      return "material-symbols:favorite-outline";
    case "qa_answer_accepted":
      return "material-symbols:check-circle-outline";
    default:
      return "material-symbols:notifications-outline";
  }
}

function getTitle(type: string): string {
  switch (type) {
    case "content_liked":
      return t("notification.contentLiked");
    case "content_commented":
      return t("notification.contentCommented");
    case "comment_replied":
      return t("notification.commentReplied");
    case "qa_answer_accepted":
      return t("notification.qaAccepted");
    default:
      return t("notification.system");
  }
}

function getContent(n: SiteNotification): string {
  const title = typeof n.payload.title === "string" ? n.payload.title : "";
  if (n.type === "qa_answer_accepted" && typeof n.payload.points === "number") {
    return `${title} · ${t("notification.qaAcceptedPoints", { count: n.payload.points })}`;
  }
  return title;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notification.justNow");
  if (mins < 60) return t("notification.minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notification.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("notification.daysAgo", { count: days });
}

function handleClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

// 键盘用户需要能关掉这个下拉
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") isOpen.value = false;
}

onMounted(() => {
  authStore.restoreFromStorage();
  if (isLoggedIn.value) void refresh();
  refreshTimer = setInterval(() => void refresh(), 60_000);
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    v-if="isLoggedIn"
    ref="root"
    class="relative"
    :class="{ 'w-full': mobile }"
  >
    <!-- 铃铛触发按钮 -->
    <button
      type="button"
      :aria-label="t('notification.title')"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      class="scale-animation relative flex items-center text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      :class="
        mobile
          ? 'w-full gap-3 px-5 py-3 text-left font-semibold'
          : 'rounded-lg w-11 h-11 justify-center active:scale-90'
      "
      @click="toggle"
    >
      <Icon
        icon="material-symbols:notifications-outline"
        class="text-[1.25rem]"
      />
      <span v-if="mobile">{{ t("notification.title") }}</span>
      <!-- 未读红点角标 -->
      <span
        v-if="unreadCount > 0"
        class="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm"
        :class="mobile ? 'ml-auto' : 'absolute top-1.5 right-1.5'"
      >
        {{ unreadCount > 9 ? "9+" : unreadCount }}
      </span>
    </button>

    <!-- 下拉通知面板 -->
    <div
      :id="panelId"
      v-if="isOpen"
      class="max-h-96 overflow-y-auto bg-card-bg border border-surface-3 rounded-[var(--radius-large)] float-panel p-2 z-50 shadow-xl dark:shadow-2xl transition-all"
      :class="mobile ? 'mx-3 mb-3' : 'absolute right-0 top-full mt-2 w-80'"
      @click.stop
    >
      <!-- 面板头部 -->
      <div
        class="flex items-center justify-between px-3 py-2 border-b border-surface-3 mb-1"
      >
        <span
          class="font-semibold text-sm text-neutral-800 dark:text-neutral-100"
          >{{ t("notification.title") }}</span
        >
        <button
          v-if="unreadCount > 0"
          type="button"
          class="text-xs text-primary hover:underline font-medium transition-colors"
          @click="markAllAsRead"
        >
          {{ t("notification.markAllRead") }}
        </button>
      </div>

      <!-- 无通知状态 -->
      <div
        v-if="loadFailed && notifications.length === 0"
        class="px-3 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500"
      >
        {{ t("notification.loadFailed") }}
      </div>
      <div
        v-else-if="notifications.length === 0"
        class="px-3 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500"
      >
        {{ t("notification.empty") }}
      </div>

      <!-- 通知列表项 -->
      <button
        v-for="n in notifications"
        :key="n.id"
        type="button"
        class="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors group mb-0.5"
        :class="{ 'opacity-60': n.read_at }"
        @click="markAsRead(n)"
      >
        <!-- 图标容器 -->
        <span
          class="shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          :class="
            n.read_at
              ? 'bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-400'
              : 'bg-primary/10 text-primary'
          "
        >
          <Icon :icon="getIcon(n.type)" class="w-4 h-4" />
        </span>

        <!-- 文本内容 -->
        <div class="flex-1 min-w-0">
          <div
            class="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate group-hover:text-primary transition-colors"
          >
            {{ getTitle(n.type) }}
          </div>
          <div
            class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed"
          >
            {{ getContent(n) }}
          </div>
          <div class="text-xs text-neutral-400 dark:text-neutral-500/80 mt-1">
            {{ timeAgo(n.createdAt) }}
          </div>
        </div>

        <!-- 未读原点提示 -->
        <span
          v-if="!n.read_at"
          class="shrink-0 w-2 h-2 rounded-full bg-primary mt-2"
        ></span>
      </button>
    </div>
  </div>
</template>
