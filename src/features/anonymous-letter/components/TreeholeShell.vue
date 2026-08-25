<template>
  <NMessageProvider>
    <NDialogProvider>
      <NModalProvider>
        <div
          class="th-app"
          :class="{ 'low-perf': lowPerf, 'high-contrast': highContrast }"
        >
          <div class="app-root">
            <!-- 背景层 -->
            <div class="bg-flow" aria-hidden="true"></div>
            <Particles />
            <!-- 角落装饰 -->
            <div class="corner-deco tl"></div>
            <div class="corner-deco br"></div>
            <div class="corner-deco tr"></div>

            <!-- ==================== 顶部导航栏 ==================== -->
            <header class="top-nav glass">
              <div class="nav-inner">
                <div class="nav-left">
                  <a
                    :href="buildUrl('/apps')"
                    class="nav-exit-btn"
                    :title="t('treehole.backToSite')"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </a>
                  <a
                    :href="buildUrl('/treehole')"
                    class="nav-brand"
                    :aria-label="t('treehole.homeAriaLabel')"
                  >
                    <span class="brand-icon">&#x1F333;</span>
                    <span class="brand-text grad-text">{{
                      t("treehole.name")
                    }}</span>
                  </a>
                </div>

                <nav class="nav-links" :aria-label="t('treehole.nav.aria')">
                  <a
                    :href="buildUrl('/treehole')"
                    class="nav-link"
                    :class="{ active: activeNav === 'home' }"
                    >{{ t("treehole.nav.square") }}</a
                  >
                  <a
                    :href="buildUrl('/treehole/random')"
                    class="nav-link"
                    :class="{ active: activeNav === 'random' }"
                    >{{ t("treehole.nav.random") }}</a
                  >
                  <a
                    :href="buildUrl('/treehole/bottle')"
                    class="nav-link"
                    :class="{ active: activeNav === 'bottle' }"
                    >{{ t("treehole.nav.bottle") }}</a
                  >
                  <a
                    :href="buildUrl('/treehole/wish')"
                    class="nav-link"
                    :class="{ active: activeNav === 'wish' }"
                    >{{ t("treehole.nav.wish") }}</a
                  >
                  <a
                    :href="buildUrl('/treehole/rank')"
                    class="nav-link"
                    :class="{ active: activeNav === 'rank' }"
                    >{{ t("treehole.nav.rank") }}</a
                  >
                </nav>

                <!-- 右侧操作 -->
                <div class="nav-actions">
                  <a
                    :href="buildUrl('/treehole/write')"
                    class="btn-grad nav-write-btn"
                    >&#x270D;&#xFE0F; {{ t("treehole.nav.write") }}</a
                  >
                  <button
                    class="nav-icon-btn"
                    @click="app.toggleTheme()"
                    :aria-label="
                      app.isNight
                        ? t('treehole.switchDay')
                        : t('treehole.switchNight')
                    "
                  >
                    {{ app.isNight ? "&#x2600;&#xFE0F;" : "&#x1F319;" }}
                  </button>
                  <button
                    class="nav-icon-btn hamburger"
                    @click="mobileMenuOpen = !mobileMenuOpen"
                    :aria-label="t('treehole.menu')"
                  >
                    <span :class="{ open: mobileMenuOpen }">&#x2630;</span>
                  </button>
                </div>
              </div>
            </header>

            <!-- 移动端下拉菜单 -->
            <transition name="slide-down">
              <nav
                v-if="mobileMenuOpen"
                class="mobile-menu glass"
                :aria-label="t('treehole.nav.mobileAria')"
                @click="mobileMenuOpen = false"
              >
                <a
                  :href="buildUrl('/treehole')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'home' }"
                  >&#x1F3E0; {{ t("treehole.nav.square") }}</a
                >
                <a
                  :href="buildUrl('/treehole/write')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'write' }"
                  >&#x270D;&#xFE0F; {{ t("treehole.nav.write") }}</a
                >
                <a
                  :href="buildUrl('/treehole/random')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'random' }"
                  >&#x1F3B2; {{ t("treehole.nav.randomTreehole") }}</a
                >
                <a
                  :href="buildUrl('/treehole/bottle')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'bottle' }"
                  >&#x1F37E; {{ t("treehole.nav.bottle") }}</a
                >
                <a
                  :href="buildUrl('/treehole/wish')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'wish' }"
                  >&#x2B50; {{ t("treehole.nav.wish") }}</a
                >
                <a
                  :href="buildUrl('/treehole/rank')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'rank' }"
                  >&#x1F3C6; {{ t("treehole.nav.rank") }}</a
                >
                <a
                  :href="buildUrl('/treehole/mine')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'mine' }"
                  >&#x1F4EC; {{ t("treehole.nav.myMailbox") }}</a
                >
                <a
                  :href="buildUrl('/treehole/messages')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'messages' }"
                  >&#x1F4AC; {{ t("treehole.nav.messages") }}</a
                >
                <a
                  :href="buildUrl('/treehole/settings')"
                  class="mobile-nav-link"
                  :class="{ active: activeNav === 'settings' }"
                  >&#x2699;&#xFE0F; {{ t("treehole.nav.settings") }}</a
                >
              </nav>
            </transition>

            <!-- ==================== 主内容区 ==================== -->
            <main class="main-content float-up">
              <slot />
            </main>

            <!-- ==================== 移动端底部导航栏 ==================== -->
            <nav
              class="bottom-nav glass"
              :aria-label="t('treehole.nav.bottomAria')"
            >
              <a
                :href="buildUrl('/treehole')"
                class="bn-item"
                :class="{ active: activeNav === 'home' }"
              >
                <span class="bn-icon">&#x1F3E0;</span>
                <span class="bn-label">{{ t("treehole.nav.square") }}</span>
              </a>
              <a
                :href="buildUrl('/treehole/random')"
                class="bn-item"
                :class="{ active: activeNav === 'random' }"
              >
                <span class="bn-icon">&#x1F3B2;</span>
                <span class="bn-label">{{ t("treehole.nav.random") }}</span>
              </a>
              <a
                :href="buildUrl('/treehole/write')"
                class="bn-item bn-center"
                :class="{ active: activeNav === 'write' }"
              >
                <span class="bn-center-circle">&#x270D;&#xFE0F;</span>
              </a>
              <a
                :href="buildUrl('/treehole/bottle')"
                class="bn-item"
                :class="{ active: activeNav === 'bottle' }"
              >
                <span class="bn-icon">&#x1F37E;</span>
                <span class="bn-label">{{ t("treehole.nav.bottle") }}</span>
              </a>
              <a
                :href="buildUrl('/treehole/mine')"
                class="bn-item"
                :class="{ active: activeNav === 'mine' }"
              >
                <span class="bn-icon">&#x1F4EC;</span>
                <span class="bn-label">{{ t("treehole.nav.mailbox") }}</span>
              </a>
            </nav>
          </div>
        </div>
      </NModalProvider>
    </NDialogProvider>
  </NMessageProvider>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { NMessageProvider, NDialogProvider, NModalProvider } from "naive-ui";
import Particles from "./Particles.vue";
import { useApp } from "../stores/app";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

defineProps<{
  activeNav?: string;
}>();

const app = useApp();
const mobileMenuOpen = ref(false);

const { lowPerf, highContrast } = app;

let synced = false;

function forceSync() {
  if (synced) return;
  // 同步主题
  const htmlDark = document.documentElement.classList.contains("dark");
  const expectedDark =
    localStorage.theme === "dark" ||
    (!localStorage.theme &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  // 同步色相
  const hue = localStorage.getItem("hue");
  if (hue) document.documentElement.style.setProperty("--hue", hue);
  // 主题不匹配则 reload
  if (htmlDark !== expectedDark) {
    location.reload();
    return;
  }
  synced = true;
  app.setTheme(htmlDark ? "night" : "day");
}

onMounted(forceSync);

onUnmounted(() => {});
</script>

<style scoped>
/* ============================================================
   TreeholeShell — shared layout styles
   Extracted from HomePage/WritePage for reuse across all pages
   ============================================================ */

/* ---------- 根容器 ---------- */
.th-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

/* ---------- 顶部导航栏 ---------- */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--card-border);
  height: 56px;
  display: flex;
  align-items: center;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.nav-inner {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.nav-exit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  color: var(--text-sub);
  background: transparent;
  cursor: pointer;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
  flex-shrink: 0;
}
.nav-exit-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: translateX(-2px);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}
.brand-icon {
  font-size: 22px;
}
.brand-text {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.nav-links {
  display: flex;
  gap: 4px;
  align-items: center;
}
.nav-link {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--text-sub);
  text-decoration: none;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
  font-weight: 500;
}
.nav-link:hover {
  color: var(--accent);
  background: var(--grad-soft);
}
.nav-link.active {
  color: var(--accent);
  font-weight: 700;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.nav-write-btn {
  padding: 6px 16px;
  font-size: 13px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.nav-icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--card-border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
  color: var(--text-sub);
}
.nav-icon-btn:hover {
  border-color: var(--blue);
  color: var(--accent);
}
.hamburger {
  display: none;
}
.hamburger span {
  transition: transform 0.3s;
  display: inline-block;
}
.hamburger span.open {
  transform: rotate(90deg);
}

/* ---------- 移动端下拉菜单 ---------- */
.mobile-menu {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  z-index: 99;
  background: var(--nav-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--card-border);
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: var(--card-shadow);
}
.mobile-nav-link {
  display: block;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-main);
  text-decoration: none;
  transition: background 0.2s;
}
.mobile-nav-link:hover {
  background: var(--grad-soft);
}
.mobile-nav-link.active {
  color: var(--accent);
  font-weight: 700;
  background: var(--grad-soft);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    transform var(--duration-slow) var(--ease-out),
    opacity var(--duration-slow) var(--ease-out);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ---------- 主内容区 ---------- */
.main-content {
  flex: 1;
  padding-top: 76px;
  padding-bottom: 90px;
}

/* ---------- 移动端底部导航 ---------- */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--card-border);
  display: none;
  justify-content: space-around;
  align-items: center;
  height: 62px;
  padding: 0 8px;
}
.bn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: var(--text-sub);
  font-size: 10px;
  transition: color 0.2s;
  padding: 4px 10px;
}
.bn-item.active {
  color: var(--accent);
}
.bn-icon {
  font-size: 20px;
}
.bn-label {
  font-size: 10px;
}
.bn-center {
  position: relative;
  top: -16px;
}
.bn-center-circle {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--grad);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 14px var(--glow);
  color: #fff;
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .main-content {
    padding-top: 66px;
    padding-bottom: 100px;
  }
  .top-nav {
    height: 50px;
  }
  .nav-links {
    display: none;
  }
  .nav-write-btn {
    display: none;
  }
  .hamburger {
    display: flex;
  }
  .bottom-nav {
    display: flex;
  }
}
</style>
