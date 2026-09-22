<template>
  <div
    class="letter-card glass glass-hover float-up"
    :style="{ '--card-grad': grad }"
  >
    <!-- 顶部：分类 + 代号 + 时间 -->
    <div class="lc-head">
      <span class="lc-cat" :style="{ background: category.color }"
        >{{ category.emoji }} {{ t(category.label) }}</span
      >
      <span class="lc-code">{{ letter.codename }}</span>
    </div>

    <!-- 信纸背景正文 -->
    <div class="lc-body" :style="{ background: paperBg }" :class="{ expanded }">
      <div v-if="letter.sticker" class="lc-sticker">{{ letter.sticker }}</div>
      <p class="lc-content" :class="{ clamped: !expanded && isLong }">
        {{ letter.content }}
      </p>
      <div v-if="!expanded && isLong" class="lc-fade"></div>
    </div>
    <button
      v-if="isLong && !letter.encrypted"
      class="lc-toggle"
      @click="expanded = !expanded"
    >
      {{
        expanded
          ? t("treehole.letterCard.collapse")
          : t("treehole.letterCard.expand")
      }}
    </button>

    <!-- 心情标签 -->
    <div class="lc-moods" v-if="letter.moods && letter.moods.length">
      <span v-for="m in letter.moods" :key="m" class="lc-mood"
        >#{{ t(moodKey(m)) }}</span
      >
    </div>
    <!-- 内容标签 -->
    <div class="lc-tags" v-if="letter.tags && letter.tags.length">
      <span
        v-for="tg in letter.tags"
        :key="tg"
        class="lc-tag"
        :style="{ background: tagColor(tg) }"
        >{{ tagEmoji(tg) }} {{ t(tagLabel(tg)) }}</span
      >
    </div>
    <slot name="extra" />

    <!-- 操作栏 -->
    <div class="lc-actions">
      <button class="lc-act" :class="{ liked: letter.liked }" @click="onLike">
        <span class="lc-ic" :class="{ 'heart-burst': burst }">❤️</span
        ><span v-if="burst" class="heart-particles"
          ><span v-for="n in 6" :key="n" :style="particleStyle(n)"
            >💗</span
          ></span
        >{{ letter.likes || 0 }}
      </button>
      <button class="lc-act" :class="{ favd: isFav }" @click="onFav">
        <span class="lc-ic">{{ isFav ? "⭐" : "☆" }}</span
        >{{ favCount }}
      </button>
      <button class="lc-act" @click="onCopy">
        <span class="lc-ic">📋</span>{{ t("treehole.letterCard.copy") }}
      </button>
      <button class="lc-act" @click="onReport">
        <span class="lc-ic">⚠️</span>{{ t("treehole.letterCard.report") }}
      </button>
    </div>

    <div class="lc-foot">
      <span>{{ formatTime(letter.createdAt) }}</span>
      <button class="lc-same" @click="onSameType">
        {{ t("treehole.letterCard.sameType") }}
      </button>
    </div>

    <ReportDialog
      v-model="reportVisible"
      :target="letter.codename"
      :target-id="letter.id"
      target-type="letter"
      @reported="onReported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { getCategory, getPaper, getTag, moodKey } from "../stores/constants";
import { toggleFavorite, getFavorites } from "../stores/storage";
import ReportDialog from "./ReportDialog.vue";
import { t } from "~/lib/i18n";

const props = defineProps({ letter: { type: Object, required: true } });
const emit = defineEmits(["like", "fav", "same-type"]);

const category = computed(() => getCategory(props.letter.category));
const paperBg = computed(() => getPaper(props.letter.paper).gradient);
const grad = computed(() => category.value.color);
function tagColor(k) {
  return (getTag(k) || {}).color || "#8e7cff";
}
function tagLabel(k) {
  return (getTag(k) || {}).label || k;
}
function tagEmoji(k) {
  return (getTag(k) || {}).emoji || "🏷️";
}

const expanded = ref(false);
const isLong = computed(() => (props.letter.content || "").length > 90);

const isFav = ref(getFavorites().includes(props.letter.id));
// 收藏数单一来源：onFav 已经同步了 props.letter.favorites，这里不能再叠加 isFav（会 +2）
const favCount = computed(() => props.letter.favorites || 0);

const reportVisible = ref(false);
const burst = ref(false);

function particleStyle(n) {
  const angle = (n / 6) * Math.PI * 2;
  const dist = 22 + Math.random() * 10;
  return {
    "--dx": Math.cos(angle) * dist + "px",
    "--dy": Math.sin(angle) * dist + "px",
    animationDelay: n * 0.02 + "s",
  };
}

function formatTime(ts) {
  // 备份导入的数据里 createdAt 可能是 ISO 串或任意值：Date.parse 失败时原来会走进日期分支
  // 渲染出 NaN/NaN，必须先在边界归一化
  const time = typeof ts === "number" ? ts : Date.parse(String(ts));
  if (!Number.isFinite(time)) return "";
  const d = new Date(time);
  // 时钟偏移（ts 在未来）时 diff 为负，Math.max 兜成 0 → 显示「刚刚」而不是负数的「-3 分钟前」
  const diff = Math.max(0, Date.now() - time);
  if (diff < 60000) return t("treehole.letterCard.justNow");
  if (diff < 3600000)
    return t("treehole.letterCard.minutesAgo", {
      count: Math.floor(diff / 60000),
    });
  if (diff < 86400000)
    return t("treehole.letterCard.hoursAgo", {
      count: Math.floor(diff / 3600000),
    });
  return t("treehole.letterCard.date", {
    month: d.getMonth() + 1,
    day: d.getDate(),
  });
}

function onLike() {
  emit("like", props.letter);
  if (!props.letter.liked) {
    burst.value = false;
    requestAnimationFrame(() => {
      burst.value = true;
      setTimeout(() => (burst.value = false), 700);
    });
  }
}
function onFav() {
  const added = toggleFavorite(props.letter.id);
  isFav.value = added;
  props.letter.favorites = Math.max(
    0,
    (props.letter.favorites || 0) + (added ? 1 : -1),
  );
}
async function onCopy() {
  const text = `${t("treehole.letterCard.sharePrefix")}${t(category.value.label)} · ${props.letter.codename}\n${props.letter.content}`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // silently fail, user can manually select text
  }
}
function onReport() {
  reportVisible.value = true;
}
function onReported() {
  props.letter.reported = true;
}
function onSameType() {
  emit("same-type", props.letter.category);
}
</script>

<style scoped>
.letter-card {
  padding: 16px 16px 12px;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--card-border);
  border-image: var(--line-grad) 1;
}
.lc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.lc-cat {
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  padding: 3px 11px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
}
.lc-code {
  font-size: 12px;
  color: var(--text-sub);
}
.lc-body {
  border-radius: 12px;
  padding: 14px;
  position: relative;
  border: 1px solid rgba(153, 208, 255, 0.25);
  background: rgba(153, 208, 255, 0.04);
  font-size: calc(14px * var(--font-scale));
  line-height: 1.75;
  color: var(--text-main);
  min-height: 40px;
}
.lc-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.lc-content.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.lc-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2.4em;
  background: linear-gradient(to bottom, transparent, var(--card-bg));
  border-radius: 0 0 12px 12px;
  pointer-events: none;
}
.lc-sticker {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 20px;
  opacity: 0.8;
}
.lc-act {
  position: relative;
}
.lc-ic {
  font-size: 13px;
  display: inline-block;
}
.heart-particles {
  position: absolute;
  left: 50%;
  top: 50%;
  pointer-events: none;
}
.lc-toggle {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  padding: 6px 0 2px;
}
.lc-moods {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
.lc-mood {
  font-size: 12px;
  color: var(--accent);
  border: 1px solid var(--card-border);
  padding: 2px 9px;
  border-radius: 999px;
}
.lc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 8px;
}
.lc-tag {
  color: var(--text-sub);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
}
.lc-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.lc-act {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--card-border);
  background: transparent;
  color: var(--text-sub);
  border-radius: 999px;
  padding: 5px 11px;
  font-size: 12px;
  cursor: pointer;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
.lc-act:hover {
  transform: translateY(-2px);
  border-color: var(--blue);
  color: var(--accent);
}
.lc-act.liked {
  color: var(--danger);
  border-color: var(--danger);
}
.lc-act.favd {
  color: #e6a23c;
  border-color: #e6a23c;
}
.lc-ic {
  font-size: 13px;
}
.lc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 11px;
  color: var(--text-sub);
}
.lc-same {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 11px;
}
</style>
