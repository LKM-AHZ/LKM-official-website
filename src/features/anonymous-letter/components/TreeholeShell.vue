<template>
  <div class="treehole-root">
    <NMessageProvider>
      <NDialogProvider>
        <NModalProvider>
          <div
            class="th-app"
            :class="{ 'low-perf': lowPerf, 'high-contrast': highContrast }"
            :style="{
              '--font-scale':
                app.state.settings.fontScale === 'small'
                  ? '0.9'
                  : app.state.settings.fontScale === 'large'
                    ? '1.15'
                    : '1',
            }"
          >
            <div class="app-root" @keydown.esc="mobileMenuOpen = false">
              <!-- 背景层 -->
              <div class="bg-flow" aria-hidden="true"></div>
              <!-- 角落装饰 -->
              <div class="corner-deco tl"></div>
              <div class="corner-deco br"></div>
              <div class="corner-deco tr"></div>

              <div
                v-if="mobileMenuOpen"
                class="sidebar-backdrop"
                @click="mobileMenuOpen = false"
              ></div>
              <aside class="side-nav" :class="{ open: mobileMenuOpen }">
                <div class="sidebar-head">
                  <a
                    :href="buildUrl('/treehole')"
                    class="nav-brand"
                    :aria-label="t('treehole.homeAriaLabel')"
                  >
                    <Icon
                      icon="tabler:tree"
                      class="brand-icon"
                      aria-hidden="true"
                    />
                    <span class="brand-text grad-text">{{
                      t("treehole.name")
                    }}</span>
                  </a>
                  <button
                    class="sidebar-close"
                    :aria-label="t('common.close')"
                    @click="mobileMenuOpen = false"
                  >
                    &times;
                  </button>
                </div>

                <nav class="nav-links" :aria-label="t('treehole.nav.aria')">
                  <a
                    v-for="item in navItems"
                    :key="item.key"
                    :href="buildUrl(item.path)"
                    class="nav-link"
                    :class="{ active: activeNav === item.key }"
                    :aria-current="activeNav === item.key ? 'page' : undefined"
                    @click="mobileMenuOpen = false"
                  >
                    <Icon
                      :icon="item.icon"
                      class="nav-icon"
                      aria-hidden="true"
                    />
                    <span>{{ item.label }}</span>
                  </a>
                </nav>

                <div class="sidebar-footer">
                  <a :href="buildUrl('/apps')" class="footer-action">
                    <Icon icon="tabler:arrow-left" aria-hidden="true" />
                    {{ t("treehole.backToSite") }}
                  </a>
                </div>
              </aside>

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
                  <Icon icon="tabler:home" class="bn-icon" aria-hidden="true" />
                  <span class="bn-label">{{ t("treehole.nav.square") }}</span>
                </a>
                <a
                  :href="buildUrl('/treehole/random')"
                  class="bn-item"
                  :class="{ active: activeNav === 'random' }"
                >
                  <Icon
                    icon="tabler:dice-5"
                    class="bn-icon"
                    aria-hidden="true"
                  />
                  <span class="bn-label">{{ t("treehole.nav.random") }}</span>
                </a>
                <a
                  :href="buildUrl('/treehole/write')"
                  class="bn-item bn-center"
                  :class="{ active: activeNav === 'write' }"
                >
                  <span class="bn-center-circle"
                    ><Icon icon="tabler:pencil" aria-hidden="true"
                  /></span>
                </a>
                <a
                  :href="buildUrl('/treehole/bottle')"
                  class="bn-item"
                  :class="{ active: activeNav === 'bottle' }"
                >
                  <Icon
                    icon="tabler:bottle"
                    class="bn-icon"
                    aria-hidden="true"
                  />
                  <span class="bn-label">{{ t("treehole.nav.bottle") }}</span>
                </a>
                <button
                  class="bn-item"
                  :aria-label="t('treehole.menu')"
                  :aria-expanded="mobileMenuOpen"
                  @click="mobileMenuOpen = !mobileMenuOpen"
                >
                  <Icon
                    icon="tabler:menu-2"
                    class="bn-icon"
                    aria-hidden="true"
                  />
                  <span class="bn-label">{{ t("treehole.menu") }}</span>
                </button>
              </nav>
            </div>
          </div>
        </NModalProvider>
      </NDialogProvider>
    </NMessageProvider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { NMessageProvider, NDialogProvider, NModalProvider } from "naive-ui";
import { Icon } from "@iconify/vue";
import { useApp } from "../stores/app";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

defineProps<{
  activeNav?: string;
}>();

const app = useApp();
const mobileMenuOpen = ref(false);
const navItems = [
  {
    key: "home",
    path: "/treehole",
    icon: "tabler:home",
    label: t("treehole.nav.square"),
  },
  {
    key: "random",
    path: "/treehole/random",
    icon: "tabler:dice-5",
    label: t("treehole.nav.random"),
  },
  {
    key: "bottle",
    path: "/treehole/bottle",
    icon: "tabler:bottle",
    label: t("treehole.nav.bottle"),
  },
  {
    key: "wish",
    path: "/treehole/wish",
    icon: "tabler:star",
    label: t("treehole.nav.wish"),
  },
  {
    key: "rank",
    path: "/treehole/rank",
    icon: "tabler:trophy",
    label: t("treehole.nav.rank"),
  },
  {
    key: "write",
    path: "/treehole/write",
    icon: "tabler:pencil",
    label: t("treehole.nav.write"),
  },
  {
    key: "mine",
    path: "/treehole/mine",
    icon: "tabler:mailbox",
    label: t("treehole.nav.myMailbox"),
  },
  {
    key: "messages",
    path: "/treehole/messages",
    icon: "tabler:message",
    label: t("treehole.nav.messages"),
  },
  {
    key: "settings",
    path: "/treehole/settings",
    icon: "tabler:settings",
    label: t("treehole.nav.settings"),
  },
];

const { lowPerf, highContrast } = app;

let synced = false;

function forceSync() {
  if (synced) return;
  // 同步色相。隐私模式/禁用 Cookie 下 localStorage 读取会抛 SecurityError：
  // 从 onMounted 里逃逸会中断整个 shell 初始化，下面的 app.setTheme 便永不执行、主题停在未同步状态
  try {
    const hue = localStorage.getItem("hue");
    if (hue) document.documentElement.style.setProperty("--hue", hue);
  } catch (e) {
    console.warn("[treehole] 读取色相失败", e);
  }
  // 以实际落地的 .dark class 为唯一事实来源同步主题。
  // 原实现按 localStorage.theme/matchMedia 推导 expectedDark 并在不一致时 location.reload()，
  // 但 synced 是组件内变量、刷新后归零：只要推导结果与最终 class 持续不符（例如主题由主站其它来源决定
  // 或由异步脚本后置清除），就会无限重载使页面不可用。这也与 stores/app.ts「主题跟随主站 .dark class」的约定一致。
  synced = true;
  app.setTheme(
    document.documentElement.classList.contains("dark") ? "night" : "day",
  );
}

onMounted(forceSync);
</script>

<style scoped>
/* ============================================================
   TreeholeShell — shared layout styles
   Extracted from HomePage/WritePage for reuse across all pages
   ============================================================ */

/* ---------- 根容器 ---------- */
.th-app {
  min-height: calc(100dvh - 4.5rem);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}
.app-root {
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh - 4.5rem);
  position: relative;
}

/* ---------- 树洞侧栏 ---------- */
.side-nav {
  position: fixed;
  top: 4.5rem;
  bottom: 0;
  left: 0;
  z-index: 100;
  width: 232px;
  display: flex;
  flex-direction: column;
  padding: 24px 14px 18px;
  background: var(--nav-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid var(--card-border);
  box-shadow: 8px 0 28px color-mix(in srgb, var(--accent) 5%, transparent);
}
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 20px;
}
.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.brand-icon {
  font-size: 24px;
}
.brand-text {
  font-size: 18px;
  font-weight: 800;
}
.sidebar-close {
  display: none;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text-sub);
  font-size: 24px;
  cursor: pointer;
}
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
}
.nav-link,
.footer-action {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text-sub);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}
.nav-link:hover,
.footer-action:hover,
.sidebar-close:hover {
  background: var(--grad-soft);
  color: var(--accent);
}
.nav-link.active {
  background: var(--grad-soft);
  color: var(--accent);
  font-weight: 700;
}
.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  font-size: 18px;
  line-height: 1;
}
.nav-link:nth-child(6) {
  margin-top: 12px;
  border: 1px solid var(--accent);
  color: var(--accent);
}
.nav-link:nth-child(7) {
  margin-top: 12px;
}
.sidebar-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--card-border);
}
.footer-action {
  min-height: 38px;
  font-size: 12px;
}
.footer-action span {
  width: 20px;
  text-align: center;
  font-size: 16px;
}
.sidebar-backdrop {
  display: none;
}

/* ---------- 主内容区 ---------- */
.main-content {
  flex: 1;
  min-width: 0;
  margin-left: 232px;
  padding-top: 28px;
  padding-bottom: 60px;
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
  border: 0;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
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
  .side-nav {
    top: 4.5rem;
    z-index: 101;
    width: min(280px, 85vw);
    background: var(--bg-1);
    transform: translateX(-105%);
    transition: transform 0.25s ease;
    visibility: hidden;
  }
  .side-nav.open {
    transform: translateX(0);
    visibility: visible;
  }
  .sidebar-close,
  .sidebar-backdrop {
    display: block;
  }
  .sidebar-backdrop {
    position: fixed;
    inset: 4.5rem 0 0;
    z-index: 99;
    background: var(--mask);
  }
  .main-content {
    margin-left: 0;
    padding-top: 20px;
    padding-bottom: 100px;
  }
  .bottom-nav {
    display: flex;
  }
}
</style>
