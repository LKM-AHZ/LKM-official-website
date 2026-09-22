<template>
  <TreeholeShell active-nav="settings">
    <div class="container">
      <h1 class="page-title">⚙️ {{ t("treehole.settings.title") }}</h1>
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

        <!-- 自定义主题配色 -->
        <div class="set-row">
          <div class="set-info">
            <b>{{ t("treehole.settings.accentColor") }}</b>
            <small>{{ t("treehole.settings.accentColorDesc") }}</small>
          </div>
          <div class="accent-picks">
            <button
              v-for="a in accents"
              :key="a[0]"
              type="button"
              class="accent-dot"
              :aria-label="`${t('treehole.settings.accentColor')} ${a[0]}`"
              :aria-pressed="state.settings.accent === a[0]"
              :class="{ active: state.settings.accent === a[0] }"
              :style="{
                background: `linear-gradient(135deg, ${a[0]}, ${a[1]})`,
              }"
              @click="setAccent(a[0], a[1])"
            ></button>
            <input
              type="color"
              v-model="customA"
              class="accent-color"
              @input="onCustom"
              :title="t('treehole.settings.customAccent')"
            />
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
              v-for="n in [1, 2, 3, 5, 10]"
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
import { ref, watch } from "vue";
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
  setAccent,
  toggleLowPerf,
  toggleHighContrast,
  setRateLimit,
} = app;

const showPrivacy = ref(false);

const accents = [
  ["#e8a87c", "#c3aed6"],
  ["#8b7ff0", "#5fd0e0"],
  ["#ff9aa2", "#ffc6ff"],
  ["#7bdff2", "#b2f7ef"],
  ["#f6c28b", "#d9a7c7"],
  ["#a0c4ff", "#bdb2ff"],
];
const customA = ref(state.settings.accent);

// 色板输入框只初始化一次的话，选预设色块/别处改 accent 后它仍显示旧颜色，
// 用户再确认就会把过期色值写回 store，故跟随 state 同步
watch(
  () => state.settings.accent,
  (a) => {
    customA.value = a;
  },
);

function onCustom() {
  const b = customA.value;
  const b2 = shade(b, 40);
  setAccent(b, b2);
}

function shade(hex, amt) {
  // 非 #rrggbb（空串、#abc、被 getSettings 合并弄脏的历史值）解析出来是 NaN 通道，
  // 会生成 "#NaNNaNNaN" 这种非法颜色；原样返回比产出坏值安全。
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const h = hex.replace("#", "");
  let r = parseInt(h.slice(0, 2), 16) + amt;
  let g = parseInt(h.slice(2, 4), 16) + amt;
  let bl = parseInt(h.slice(4, 6), 16) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  bl = Math.max(0, Math.min(255, bl));
  return "#" + [r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("");
}

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
.rate-pick,
.accent-picks {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.theme-opt {
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.4);
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

.accent-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s;
}
.accent-dot.active {
  border-color: var(--text-main);
  transform: scale(1.15);
}
.accent-color {
  width: 32px;
  height: 30px;
  border: none;
  background: none;
  cursor: pointer;
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
