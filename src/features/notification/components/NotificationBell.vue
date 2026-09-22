<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  mockNotifications,
  type MockNotification,
} from "../data/mock-notifications";
import { t } from "~/lib/i18n";

const isOpen = ref(false);
// 复制一份：直接持有模块级 mock 数组会让本组件与所有引用方共享同一份状态，
// 将来任何原地修改都会泄漏到别的实例
const notifications = ref<MockNotification[]>([...mockNotifications]);

const unreadCount = computed(
  () => notifications.value.filter((n) => !n.isRead).length,
);

function toggle() {
  isOpen.value = !isOpen.value;
}

function markAsRead(id: string) {
  notifications.value = notifications.value.map((n) =>
    n.id === id ? { ...n, isRead: true } : n,
  );
}

function markAllAsRead() {
  notifications.value = notifications.value.map((n) => ({
    ...n,
    isRead: true,
  }));
}

function getIcon(type: MockNotification["type"]): string {
  switch (type) {
    case "reply":
      return "material-symbols:chat-bubble-outline";
    case "like":
      return "material-symbols:favorite-outline";
    case "follow":
      return "material-symbols:person-add-outline";
    case "system":
      return "material-symbols:campaign-outline";
    case "file_approved":
      return "material-symbols:check-circle-outline";
    case "file_rejected":
      return "material-symbols:cancel-outline";
    default:
      return "material-symbols:notifications-outline";
  }
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
  const target = e.target as HTMLElement;
  const bell = document.getElementById("notification-bell");
  if (bell && !bell.contains(target)) {
    isOpen.value = false;
  }
}

// 键盘用户需要能关掉这个下拉
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") isOpen.value = false;
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div id="notification-bell" class="relative">
    <!-- 铃铛触发按钮 -->
    <button
      type="button"
      :aria-label="t('notification.title')"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      aria-controls="notification-panel"
      class="scale-animation rounded-lg w-11 h-11 active:scale-90 relative flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      @click="toggle"
    >
      <Icon
        icon="material-symbols:notifications-outline"
        class="text-[1.25rem]"
      />
      <!-- 未读红点角标 -->
      <span
        v-if="unreadCount > 0"
        class="absolute top-1.5 right-1.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm"
      >
        {{ unreadCount > 9 ? "9+" : unreadCount }}
      </span>
    </button>

    <!-- 下拉通知面板 -->
    <div
      id="notification-panel"
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[oklch(0.23_0.015_var(--hue))] border border-black/5 dark:border-white/10 rounded-[var(--radius-large)] float-panel p-2 z-50 shadow-xl dark:shadow-2xl transition-all"
      @click.stop
    >
      <!-- 面板头部 -->
      <div
        class="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/10 mb-1"
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
        v-if="notifications.length === 0"
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
        :class="{ 'opacity-60': n.isRead }"
        @click="markAsRead(n.id)"
      >
        <!-- 图标容器 -->
        <span
          class="shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          :class="
            n.isRead
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
            {{ t(n.title) }}
          </div>
          <div
            class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed"
          >
            {{ t(n.content) }}
          </div>
          <div class="text-xs text-neutral-400 dark:text-neutral-500/80 mt-1">
            {{ timeAgo(n.createdAt) }}
          </div>
        </div>

        <!-- 未读原点提示 -->
        <span
          v-if="!n.isRead"
          class="shrink-0 w-2 h-2 rounded-full bg-primary mt-2"
        ></span>
      </button>
    </div>
  </div>
</template>
