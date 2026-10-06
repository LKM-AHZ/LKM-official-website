<template>
  <TreeholeShell active-nav="settings">
    <div class="container">
      <h1 class="page-title">{{ t("treehole.settings.title") }}</h1>
      <p class="page-sub">{{ t("treehole.settings.subtitle") }}</p>

      <section class="set-card glass">
        <!-- 主题模式 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.themeMode") }}</b>
            <small>{{ t("treehole.settings.themeModeDesc") }}</small>
          </div>
          <div class="theme-switch">
            <button
              class="theme-opt"
              :class="{ active: !isNight }"
              @click="setTheme('day')"
            >
              {{ t("treehole.settings.themeDay") }}
            </button>
            <button
              class="theme-opt"
              :class="{ active: isNight }"
              @click="setTheme('night')"
            >
              {{ t("treehole.settings.themeNight") }}
            </button>
          </div>
        </div>

        <!-- 字体大小 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.fontSize") }}</b>
            <small>{{ t("treehole.settings.fontSizeDesc") }}</small>
          </div>
          <div class="theme-switch">
            <button
              class="theme-opt"
              :class="{ active: state.settings.fontScale === 'small' }"
              @click="setFontScale('small')"
            >
              {{ t("treehole.settings.fontSmall") }}
            </button>
            <button
              class="theme-opt"
              :class="{ active: state.settings.fontScale === 'normal' }"
              @click="setFontScale('normal')"
            >
              {{ t("treehole.settings.fontNormal") }}
            </button>
            <button
              class="theme-opt"
              :class="{ active: state.settings.fontScale === 'large' }"
              @click="setFontScale('large')"
            >
              {{ t("treehole.settings.fontLarge") }}
            </button>
          </div>
        </div>

        <!-- 白噪音背景音乐 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.whiteNoise") }}</b>
            <small>{{ t("treehole.settings.whiteNoiseDesc") }}</small>
          </div>
          <button
            type="button"
            class="switch"
            role="switch"
            :aria-label="t('treehole.settings.whiteNoise')"
            :aria-checked="state.settings.audioOn"
            :class="{ on: state.settings.audioOn }"
            @click="toggleAudio"
          >
            <span class="knob"></span>
          </button>
        </div>

        <!-- 高对比度护眼模式 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.highContrast") }}</b>
            <small>{{ t("treehole.settings.highContrastDesc") }}</small>
          </div>
          <button
            type="button"
            class="switch"
            role="switch"
            :aria-label="t('treehole.settings.highContrast')"
            :aria-checked="highContrast"
            :class="{ on: highContrast }"
            @click="toggleHighContrast()"
          >
            <span class="knob"></span>
          </button>
        </div>

        <!-- 低性能设备特效开关 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.lowPerf") }}</b>
            <small>{{ t("treehole.settings.lowPerfDesc") }}</small>
          </div>
          <button
            type="button"
            class="switch"
            role="switch"
            :aria-label="t('treehole.settings.lowPerf')"
            :aria-checked="state.settings.lowPerf"
            :class="{ on: state.settings.lowPerf }"
            @click="toggleLowPerf()"
          >
            <span class="knob"></span>
          </button>
        </div>

        <!-- 全站动效静音 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.mute") }}</b>
            <small>{{ t("treehole.settings.muteDesc") }}</small>
          </div>
          <button
            type="button"
            class="switch"
            role="switch"
            :aria-label="t('treehole.settings.mute')"
            :aria-checked="state.settings.muted"
            :class="{ on: state.settings.muted }"
            @click="toggleMuted"
          >
            <span class="knob"></span>
          </button>
        </div>

        <!-- 投稿限流 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.rateLimit") }}</b>
            <small>{{
              t("treehole.settings.rateLimitDesc", {
                count: state.settings.rateLimit,
              })
            }}</small>
          </div>
          <div class="rate-pick">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              class="theme-opt"
              :class="{ active: state.settings.rateLimit === n }"
              @click="setRateLimit(n)"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <!-- 隐私声明 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.privacy") }}</b>
            <small>{{ t("treehole.settings.privacyDesc") }}</small>
          </div>
          <button class="mini" @click="showPrivacy = true">
            {{ t("treehole.settings.view") }}
          </button>
        </div>
      </section>

      <p class="foot-note">{{ t("treehole.settings.footNoteLocal") }}</p>

      <PrivacyDialog v-model="showPrivacy" />
    </div>
  </TreeholeShell>
</template>

<script setup>
import { ref } from "vue";
import TreeholeShell from "../components/TreeholeShell.vue";
import PrivacyDialog from "../components/PrivacyDialog.vue";
import { useApp } from "../stores/app";
import { t } from "~/lib/i18n";

const app = useApp();
const {
  state,
  isNight,
  highContrast,
  setTheme,
  setFontScale,
  toggleMuted,
  toggleLowPerf,
  toggleHighContrast,
  setRateLimit,
} = app;

const showPrivacy = ref(false);

function toggleAudio() {
  // 只改 reactive state：useApp 里已有 deep watch 负责落盘，
  // 这里再手动 saveSettings 会把整个 settings 对象写两遍
  state.settings.audioOn = !state.settings.audioOn;
}
</script>

<style scoped>
/* ========== Settings 页面内容样式 ========== */

.page-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 4px;
}
.page-sub {
  color: var(--text-sub);
  margin: 0 0 18px;
  font-size: 14px;
}

.set-card {
  padding: 8px 18px;
  border-radius: 20px;
}
.set-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--card-border);
  gap: 12px;
}
.set-row:last-child {
  border-bottom: none;
}
.set-info b {
  font-size: 15px;
}
.set-info small {
  display: block;
  font-size: 12px;
  color: var(--text-sub);
  margin-top: 2px;
}

.theme-switch,
.rate-pick {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.theme-opt {
  border: 1px solid var(--card-border);
  background: var(--bg-2);
  color: var(--text-sub);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
.theme-opt.active {
  background: var(--grad-soft);
  color: var(--accent);
  border-color: var(--blue);
  box-shadow: 0 0 12px var(--glow);
}

.switch {
  width: 50px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
  background: transparent;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
  flex-shrink: 0;
}
.switch.on {
  background: var(--grad-soft);
  border-color: var(--blue);
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.switch.on .knob {
  transform: translateX(22px);
}

.mini {
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.4);
  color: var(--text-main);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
}

.foot-note {
  text-align: center;
  font-size: 12px;
  color: var(--text-sub);
  margin-top: 18px;
}
</style>
