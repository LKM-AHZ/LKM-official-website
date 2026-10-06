<script setup lang="ts">
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "../stores/auth";
import { useNavigationStore, type StarHopeRoute } from "../stores/navigation";
import { t } from "~/lib/i18n";
import { buildUrl } from "~/lib/utils/paths";

const { navItems, currentRoute, navigate } = useNavigationStore();
const { currentUser, logout } = useAuthStore();
const mobileMenuOpen = ref(false);
const activeItem = computed(() =>
  navItems.find((item) => item.route === currentRoute.value),
);

function openRoute(route: StarHopeRoute): void {
  navigate(route);
  mobileMenuOpen.value = false;
}

async function handleLogout(): Promise<void> {
  try {
    await logout();
  } catch (err) {
    console.error("StarHope 退出登录失败", err);
  }
}
</script>

<template>
  <div
    class="relative flex min-h-[calc(100dvh-4.5rem)] bg-page-bg"
    @keydown.esc="mobileMenuOpen = false"
  >
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 top-[4.5rem] z-30 bg-black/40 lg:hidden"
      @click="mobileMenuOpen = false"
    ></div>
    <aside
      id="starhope-navigation"
      class="fixed bottom-0 left-0 top-[4.5rem] z-40 flex w-[min(18rem,84vw)] shrink-0 flex-col border-r border-surface-3 bg-card-bg p-4 shadow-xl transition-transform duration-200 lg:sticky lg:top-[4.5rem] lg:h-[calc(100dvh-4.5rem)] lg:w-60 lg:translate-x-0 lg:overflow-y-auto lg:p-5 lg:shadow-none"
      :class="
        mobileMenuOpen
          ? 'translate-x-0 visible'
          : '-translate-x-full invisible lg:visible'
      "
    >
      <div class="mb-7 flex items-center gap-3 px-2 pt-1">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
        >
          <Icon icon="tabler:school" class="size-5" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-base font-semibold leading-tight text-deep-text">
            {{ t("starhope.appName") }}
          </div>
          <div class="mt-0.5 text-xs text-text-muted">
            {{ t("starhope.tagline") }}
          </div>
        </div>
        <button
          type="button"
          class="rounded-full p-2 text-text-muted hover:bg-surface-3 lg:hidden"
          :aria-label="t('common.close')"
          @click="mobileMenuOpen = false"
        >
          <Icon icon="tabler:x" class="size-5" aria-hidden="true" />
        </button>
      </div>

      <nav
        class="min-h-0 flex-1 space-y-1 overflow-y-auto"
        :aria-label="t('starhope.menu')"
      >
        <button
          v-for="item in navItems"
          :key="item.route"
          type="button"
          class="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-action"
          :class="
            currentRoute === item.route
              ? 'bg-btn-regular-bg font-semibold text-primary-readable'
              : 'text-text-muted hover:bg-btn-plain-bg-hover hover:text-deep-text'
          "
          :aria-current="currentRoute === item.route ? 'page' : undefined"
          @click="openRoute(item.route)"
        >
          <Icon :icon="item.icon" class="size-5 shrink-0" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="mt-5 border-t border-surface-3 pt-4">
        <div
          v-if="currentUser"
          class="mb-2 flex min-w-0 items-center gap-3 rounded-2xl bg-page-bg p-2.5"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-btn-regular-bg text-sm font-semibold text-primary-readable"
          >
            {{
              currentUser.username ? Array.from(currentUser.username)[0] : "?"
            }}
          </span>
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-deep-text">
              {{ currentUser.username ?? t("starhope.user") }}
            </div>
            <div class="truncate text-xs text-text-muted">
              {{ currentUser.account_level }}
            </div>
          </div>
        </div>
        <button
          v-if="currentUser"
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-text-muted hover:bg-btn-plain-bg-hover hover:text-deep-text"
          @click="handleLogout"
        >
          <Icon icon="tabler:logout" class="size-4" aria-hidden="true" />
          {{ t("starhope.logout") }}
        </button>
        <a
          :href="buildUrl('/apps')"
          class="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-text-muted hover:bg-btn-plain-bg-hover hover:text-deep-text"
        >
          <Icon icon="tabler:arrow-left" class="size-4" aria-hidden="true" />
          {{ t("starhope.backToSite") }}
        </a>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <div
        class="sticky top-[4.5rem] z-20 flex h-14 items-center gap-3 border-b border-surface-3 bg-card-bg px-4 lg:hidden"
      >
        <button
          type="button"
          class="rounded-full p-2 text-deep-text hover:bg-btn-plain-bg-hover"
          :aria-label="t('starhope.menu')"
          :aria-expanded="mobileMenuOpen"
          aria-controls="starhope-navigation"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <Icon icon="tabler:menu-2" class="size-5" aria-hidden="true" />
        </button>
        <span class="text-sm font-semibold text-deep-text">{{
          activeItem?.label ?? t("starhope.appName")
        }}</span>
      </div>
      <main class="min-w-0 bg-page-bg"><slot /></main>
    </div>
  </div>
</template>
