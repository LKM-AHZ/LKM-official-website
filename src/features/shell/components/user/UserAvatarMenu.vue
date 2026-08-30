<template>
  <div ref="menuRef" class="relative">
    <!-- 未登录 -->
    <a
      v-if="!isLoggedIn"
      :href="buildUrl('/login')"
      class="btn-plain scale-animation rounded-lg h-11 px-4 font-bold active:scale-95 flex items-center gap-1.5 text-sm text-primary hover:bg-primary/10 transition-colors"
      @click.prevent="openLogin"
    >
      <Icon icon="material-symbols:login-rounded" class="text-[1.25rem]" />
      <span class="hidden sm:inline">{{ t("user.login") }}</span>
    </a>

    <!-- 已登录 -->
    <button
      v-else
      class="btn-plain scale-animation rounded-full w-9 h-9 active:scale-90 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-primary/30 transition-colors"
      @click.stop="toggle"
    >
      <span class="text-sm font-bold text-primary">{{ avatarLetter }}</span>
    </button>

    <!-- 下拉菜单 -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[oklch(0.23_0.015_var(--hue))] border border-black/5 dark:border-white/10 rounded-[var(--radius-large)] float-panel py-1.5 z-50 shadow-xl dark:shadow-2xl transition-all"
      @click.stop
    >
      <div class="px-4 py-2 border-b border-surface-3 mb-1">
        <div class="font-semibold text-sm text-deep-text truncate">
          {{ username }}
        </div>
        <div class="text-xs text-text-muted">{{ userLevelText }}</div>
      </div>

      <a
        :href="buildUrl('/profile')"
        class="flex items-center gap-2.5 px-4 py-2 text-sm text-deep-text hover:bg-page-bg transition-colors"
        @click="close"
      >
        <Icon icon="material-symbols:person-outline" class="w-4 h-4" />
        {{ t("user.profile") }}
      </a>
      <a
        :href="buildUrl('/contribution')"
        class="flex items-center gap-2.5 px-4 py-2 text-sm text-deep-text hover:bg-page-bg transition-colors"
        @click="close"
      >
        <Icon icon="material-symbols:stars-outline" class="w-4 h-4" />
        {{ t("user.contribution") }}
      </a>
      <a
        :href="buildUrl('/account')"
        class="flex items-center gap-2.5 px-4 py-2 text-sm text-deep-text hover:bg-page-bg transition-colors"
        @click="close"
      >
        <Icon icon="material-symbols:settings-outline" class="w-4 h-4" />
        {{ t("user.settings") }}
      </a>

      <div class="border-t border-surface-3 mt-1 pt-1">
        <button
          class="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors"
          @click="handleLogout"
        >
          <Icon icon="material-symbols:logout-rounded" class="w-4 h-4" />
          {{ t("user.logout") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import { buildUrl } from "~/lib/utils/paths";
import { useAuthStore } from "~/stores/auth";

defineProps<{ base?: string }>();

const store = useAuthStore();
const menuRef = ref<HTMLDivElement | null>(null);
const isOpen = ref(false);
const isLoggedIn = computed(() => store.isLoggedIn);
const username = computed(() => store.username);
// UserInfo.account_level 是 string，需收窄为字面量联合（与 auth store 归一化一致）
const userLevel = computed<"local" | "normal" | "admin">(() => {
  const level = store.user?.account_level;
  return level === "admin" || level === "normal" ? level : "local";
});

const avatarLetter = computed(() =>
  username.value ? username.value.charAt(0).toUpperCase() : "?",
);

const userLevelText = computed(() => {
  switch (userLevel.value) {
    case "admin":
      return t("user.admin");
    case "local":
      return t("user.localAccount");
    default:
      return t("user.normalUser");
  }
});

function openLogin() {
  window.dispatchEvent(
    new CustomEvent("open-auth-modal", { detail: { view: "login" } }),
  );
}

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

// 与其他下拉框一致：点击面板外部关闭
function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

async function handleLogout() {
  isOpen.value = false;
  await store.logout();
}

onMounted(() => {
  store.restoreFromStorage();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
