<script setup lang="ts">
import { useAuthStore } from "../stores/auth";
import { useNavigationStore } from "../stores/navigation";
import { t } from "~/lib/i18n";

const { navItems, currentRoute, navigate } = useNavigationStore();
const { currentUser, logout } = useAuthStore();

// @click 直接绑 logout 会把 MouseEvent 当首参传入、且 Vue 不会 await 它返回的 Promise，
// 失败时只会留下 unhandled rejection 而界面仍停在已登录态，故包一层并记录错误
async function handleLogout(): Promise<void> {
  try {
    await logout();
  } catch (err) {
    console.error("StarHope 退出登录失败", err);
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col lg:flex-row">
    <aside
      class="sticky top-0 z-30 flex w-full shrink-0 flex-col border-b border-surface-3 bg-card-bg p-3 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r lg:p-5"
    >
      <div class="mb-3 flex items-center justify-between px-2 lg:mb-8 lg:block">
        <h1 class="text-lg font-bold text-primary">
          {{ t("starhope.appName") }}
        </h1>
        <p class="mt-1 hidden text-xs text-text-muted lg:block">
          {{ t("starhope.tagline") }}
        </p>
        <button
          type="button"
          @click="handleLogout"
          class="rounded-full px-3 py-1.5 text-xs text-text-muted hover:bg-surface-3 lg:hidden"
        >
          {{ t("starhope.logout") }}
        </button>
      </div>
      <nav
        class="flex gap-1 overflow-x-auto lg:block lg:space-y-1"
        :aria-label="t('starhope.appName')"
      >
        <button
          v-for="item in navItems"
          :key="item.route"
          @click="navigate(item.route)"
          class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-left text-sm transition-colors lg:w-full"
          :class="
            currentRoute === item.route
              ? 'bg-primary/10 text-primary'
              : 'text-text-muted hover:bg-surface-3'
          "
        >
          <span class="text-base">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="mt-auto hidden border-t border-surface-3 pt-4 lg:block">
        <div v-if="currentUser" class="flex items-center gap-2 px-3 py-2">
          <div
            class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary"
          >
            {{
              currentUser.username ? Array.from(currentUser.username)[0] : "?"
            }}
          </div>
          <div class="text-sm">
            <div class="font-medium text-deep-text">
              {{ currentUser.username ?? t("starhope.user") }}
            </div>
            <div class="text-xs text-text-muted">
              {{ currentUser.account_level }}
            </div>
          </div>
        </div>
        <button
          type="button"
          @click="handleLogout"
          class="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-red-500 rounded-lg hover:bg-surface-3 transition-colors block"
        >
          {{ t("starhope.logout") }}
        </button>
      </div>
    </aside>
    <main class="min-w-0 flex-1 bg-page-bg">
      <slot />
    </main>
  </div>
</template>
