<template>
  <TreeholeShell active-nav="home">
    <div class="container">
      <!-- 首页 Hero：打字机 slogan + 每日治愈文案 -->
      <section class="hero glass float-up">
        <h1 class="hero-title">
          <span class="grad-text typewriter">{{ typed }}</span
          ><span class="caret">|</span>
        </h1>
        <p class="hero-sub">{{ t("treehole.home.heroSubtitle") }}</p>
        <div class="hero-quote">
          <span class="quote-mark">"</span>{{ t(quote)
          }}<span class="quote-mark">"</span>
        </div>
        <div class="hero-acts">
          <a :href="buildUrl('/treehole/write')" class="btn-grad">{{
            t("treehole.writeLetter")
          }}</a>
          <a :href="buildUrl('/treehole/random')" class="chip">{{
            t("treehole.randomTreehole")
          }}</a>
        </div>
      </section>

      <!-- 筛选栏：分类 + 排序 + 标签 -->
      <section class="filters glass">
        <div class="filter-row">
          <span class="filter-label">{{ t("treehole.home.category") }}</span>
          <div class="chips">
            <button
              class="chip"
              :class="{ active: activeCat === 'all' }"
              @click="setCat('all')"
            >
              {{ t("treehole.home.all") }}
            </button>
            <button
              v-for="c in categories"
              :key="c.key"
              class="chip"
              :class="{ active: activeCat === c.key }"
              @click="setCat(c.key)"
            >
              {{ c.emoji }} {{ t(c.label) }}
            </button>
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label">{{ t("treehole.home.sort") }}</span>
          <div class="chips">
            <button
              class="chip"
              :class="{ active: sort === 'new' }"
              @click="sort = 'new'"
            >
              {{ t("treehole.home.sortNew") }}
            </button>
            <button
              class="chip"
              :class="{ active: sort === 'hot' }"
              @click="sort = 'hot'"
            >
              {{ t("treehole.home.sortHot") }}
            </button>
            <button
              class="chip"
              :class="{ active: sort === 'random' }"
              @click="sort = 'random'"
            >
              {{ t("treehole.home.sortRandom") }}
            </button>
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label">{{ t("treehole.home.tag") }}</span>
          <div class="chips">
            <button
              class="chip"
              :class="{ active: activeTag === '' }"
              @click="setTag('')"
            >
              {{ t("treehole.home.all") }}
            </button>
            <button
              v-for="tg in tags"
              :key="tg.key"
              class="chip"
              :class="{ active: activeTag === tg.key }"
              @click="setTag(tg.key)"
            >
              {{ tg.emoji }} {{ t(tg.label) }}
            </button>
          </div>
        </div>
      </section>

      <!-- 瀑布流信件广场 -->
      <section v-if="filtered.length" class="masonry">
        <div v-for="l in filtered" :key="l.id" class="masonry-col">
          <LetterCard
            :letter="l"
            @like="onLike"
            @fav="onFav"
            @same-type="onSameType"
          />
        </div>
      </section>
      <EmptyState
        v-else
        :title="t('treehole.home.emptyTitle')"
        :sub="t('treehole.home.emptySub')"
      />

      <!-- 心情云标签墙 -->
      <section class="mood-cloud glass">
        <div class="mc-head">
          <span>{{ t("treehole.home.moodCloud") }}</span>
          <span class="mc-hint">{{ t("treehole.home.moodCloudHint") }}</span>
        </div>
        <div class="mc-tags">
          <button
            v-for="(cnt, m) in moodStats"
            :key="m"
            class="mc-tag"
            :style="{ fontSize: 12 + Math.min(cnt, 8) + 'px' }"
            @click="filterByMood(m)"
          >
            #{{ t(moodKey(m)) }}
          </button>
        </div>
      </section>
    </div>
  </TreeholeShell>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import TreeholeShell from "../components/TreeholeShell.vue";
import LetterCard from "../components/LetterCard.vue";
import EmptyState from "../components/EmptyState.vue";
import {
  CATEGORIES,
  TAGS,
  MOODS,
  randomQuote,
  moodKey,
} from "../stores/constants";
import { getLetters, toggleFavorite } from "../stores/storage";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

const categories = CATEGORIES;

const tags = TAGS;

const allLetters = ref([]);
const activeCat = ref("all");
const activeTag = ref("");
const activeMood = ref("");
const sort = ref("new");

const quote = ref(randomQuote());

// 打字机 slogan
const SLOGAN = t("treehole.home.slogan");
const typed = ref("");
let ti = 0;
function typeLoop() {
  if (ti <= SLOGAN.length) {
    typed.value = SLOGAN.slice(0, ti);
    ti++;
    setTimeout(typeLoop, 110);
  }
}

function load() {
  const all = getLetters();
  allLetters.value = all.filter(
    (l) => l.status === "published" && l.privacy === "public",
  );
}

onMounted(() => {
  load();
  typeLoop();
});

// 跨标签页同步
if (typeof window !== "undefined") {
  window.addEventListener("storage", load);
}

const filtered = computed(() => {
  let list = allLetters.value.slice();
  if (activeCat.value !== "all") {
    list = list.filter((l) => l.category === activeCat.value);
  }
  if (activeMood.value) {
    list = list.filter((l) => (l.moods || []).includes(activeMood.value));
  }
  if (activeTag.value) {
    list = list.filter((l) => (l.tags || []).includes(activeTag.value));
  }
  if (sort.value === "hot") {
    list.sort(
      (a, b) =>
        (b.likes || 0) +
        (b.favorites || 0) -
        ((a.likes || 0) + (a.favorites || 0)),
    );
  } else if (sort.value === "random") {
    list.sort(() => Math.random() - 0.5);
  } else {
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  return list;
});

const moodStats = computed(() => {
  const map = {};
  allLetters.value.forEach((l) =>
    (l.moods || []).forEach((m) => {
      map[m] = (map[m] || 0) + 1;
    }),
  );
  MOODS.forEach((m) => {
    if (!map[m]) map[m] = 1;
  });
  return map;
});

function setCat(c) {
  activeCat.value = c;
  activeMood.value = "";
}
function setTag(t) {
  activeTag.value = t;
}
function filterByMood(m) {
  activeMood.value = activeMood.value === m ? "" : m;
  activeCat.value = "all";
}
function onSameType(cat) {
  activeCat.value = cat;
  activeMood.value = "";
}

function onLike(letter) {
  letter.liked = !letter.liked;
  letter.likes = Math.max(0, (letter.likes || 0) + (letter.liked ? 1 : -1));
  load();
}
function onFav({ letter }) {
  const added = toggleFavorite(letter.id);
  letter.favorites = Math.max(0, (letter.favorites || 0) + (added ? 1 : -1));
  load();
}
</script>

<style scoped>
/* ========== Home 页面内容样式 ========== */

.hero {
  padding: 30px 26px;
  text-align: center;
  border-radius: 26px;
}
.hero-title {
  font-size: clamp(22px, 4vw, 34px);
  font-weight: 800;
  margin: 0 0 6px;
  letter-spacing: 1px;
}
.typewriter {
  border-right: none;
}
.caret {
  color: var(--accent);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.hero-sub {
  color: var(--text-sub);
  margin: 0 0 16px;
  font-size: 14px;
}
.hero-quote {
  display: inline-block;
  max-width: 620px;
  font-style: italic;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.4);
  padding: 12px 20px;
  border-radius: 16px;
  margin-bottom: 18px;
  font-size: calc(14px * var(--font-scale));
}
:root.dark .hero-quote {
  background: rgba(255, 255, 255, 0.06);
}
.quote-mark {
  color: var(--accent);
  font-size: 20px;
  font-weight: 700;
}
.hero-acts {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.filters {
  padding: 16px 18px;
  border-radius: 20px;
}
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 6px 0;
}
.filter-label {
  font-size: 13px;
  color: var(--text-sub);
  padding-top: 6px;
  flex-shrink: 0;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 瀑布流 */
.masonry {
  columns: 3;
  column-gap: 16px;
}
.masonry-col {
  break-inside: avoid;
  margin-bottom: 16px;
  display: inline-block;
  width: 100%;
}

.mood-cloud {
  padding: 16px 18px;
  border-radius: 20px;
}
.mc-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  font-weight: 700;
}
.mc-hint {
  font-size: 11px;
  color: var(--text-sub);
  font-weight: 400;
}
.mc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mc-tag {
  border: none;
  background: rgba(255, 255, 255, 0.45);
  color: var(--accent);
  padding: 4px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
:root.dark .mc-tag {
  background: rgba(255, 255, 255, 0.08);
}
.mc-tag:hover {
  background: var(--grad-soft);
  color: var(--accent);
  border: 1px solid var(--blue);
  transform: translateY(-2px);
}

/* ---------- 响应式 ---------- */
@media (max-width: 1024px) {
  .masonry {
    columns: 2;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 22px 16px;
  }
}

@media (max-width: 600px) {
  .masonry {
    columns: 1;
  }
  .hero-title {
    font-size: clamp(18px, 5vw, 24px);
  }
}
</style>
