<template>
  <TreeholeShell active-nav="wish">
    <div class="container">
      <!-- 头部 -->
      <section class="wish-head glass float-up">
        <h1 class="page-title">🌟 {{ t("treehole.wish.title") }}</h1>
        <button class="btn-grad" @click="makeDialogOpen = true">
          {{ t("treehole.wish.makeWish") }}
        </button>
      </section>

      <!-- 空状态 -->
      <section v-if="wishes.length === 0" class="wish-empty glass float-up">
        <div class="empty-icon">🌟</div>
        <p class="empty-text">{{ t("treehole.wish.emptyTitle") }}</p>
        <p class="empty-sub">{{ t("treehole.wish.emptySub") }}</p>
        <button class="btn-grad" @click="makeDialogOpen = true">
          {{ t("treehole.wish.makeDialogTitle") }}
        </button>
      </section>

      <!-- 许愿墙网格 -->
      <section v-else class="wish-grid">
        <div
          v-for="w in wishes"
          :key="w.id"
          class="wish-card glass float-up"
          :style="{ borderLeftColor: cardColor(w.id) }"
        >
          <p class="wish-text">{{ w.text }}</p>
          <div class="wish-meta">
            <button
              class="light-btn"
              @click="onLight(w)"
              :title="t('treehole.wish.lightWishTitle')"
            >
              🕯️ {{ w.lights || 0 }}
            </button>
            <span class="wish-date">{{ formatDate(w.createdAt) }}</span>
            <template v-if="w.ownerId === 'me_local'">
              <button
                class="wish-action-chip"
                :title="t('common.edit')"
                :aria-label="t('common.edit')"
                @click="openEdit(w)"
              >
                ✏️
              </button>
              <button
                class="wish-action-chip wish-del"
                :title="t('common.delete')"
                :aria-label="t('common.delete')"
                @click="onDelete(w)"
              >
                🗑️
              </button>
            </template>
          </div>
        </div>
      </section>
    </div>

    <!-- 许愿弹窗 -->
    <div
      v-if="makeDialogOpen"
      class="dialog-overlay"
      @click.self="makeDialogOpen = false"
    >
      <div class="dialog-box glass">
        <h3 class="dialog-title">
          🌟 {{ t("treehole.wish.makeDialogTitle") }}
        </h3>
        <p class="dialog-desc">{{ t("treehole.wish.makeDialogDesc") }}</p>
        <textarea
          v-model="makeText"
          class="dialog-textarea"
          :placeholder="t('treehole.wish.makePlaceholder')"
          rows="4"
        ></textarea>
        <div class="dialog-actions">
          <button
            class="chip"
            @click="
              makeDialogOpen = false;
              makeText = '';
            "
          >
            {{ t("treehole.wish.cancel") }}
          </button>
          <button
            class="btn-grad btn-sm"
            @click="onMake"
            :disabled="!makeText.trim()"
          >
            {{ t("treehole.wish.lightWishBtn") }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div
      v-if="editDialogOpen"
      class="dialog-overlay"
      @click.self="editDialogOpen = false"
    >
      <div class="dialog-box glass">
        <h3 class="dialog-title">{{ t("treehole.wish.editTitle") }}</h3>
        <textarea
          v-model="editText"
          class="dialog-textarea"
          :placeholder="t('treehole.wish.editPlaceholder')"
          rows="4"
        ></textarea>
        <div class="dialog-actions">
          <button class="chip" @click="editDialogOpen = false">
            {{ t("treehole.wish.cancel") }}
          </button>
          <button
            class="btn-grad btn-sm"
            @click="onSaveEdit"
            :disabled="!editText.trim()"
          >
            {{ t("treehole.wish.save") }}
          </button>
        </div>
      </div>
    </div>
  </TreeholeShell>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import TreeholeShell from "../components/TreeholeShell.vue";
import { getWishes, addWish, lightWish, saveWishes } from "../stores/storage";
import { t } from "~/lib/i18n";

const wishes = ref([]);
const makeDialogOpen = ref(false);
const makeText = ref("");
const editDialogOpen = ref(false);
const editText = ref("");
const editId = ref("");

function loadWishes() {
  wishes.value = getWishes();
}

function onMake() {
  if (!makeText.value.trim()) return;
  addWish({
    id: "wish_" + Date.now(),
    text: makeText.value.trim(),
    lights: 0,
    createdAt: Date.now(),
    ownerId: "me_local",
  });
  makeText.value = "";
  makeDialogOpen.value = false;
  loadWishes();
}

function onLight(w) {
  lightWish(w.id);
  loadWishes();
}

function openEdit(w) {
  editId.value = w.id;
  editText.value = w.text;
  editDialogOpen.value = true;
}

function onSaveEdit() {
  if (!editText.value.trim()) return;
  const list = getWishes();
  const idx = list.findIndex((w) => w.id === editId.value);
  if (idx > -1) {
    list[idx].text = editText.value.trim();
    saveWishes(list);
  }
  editDialogOpen.value = false;
  editText.value = "";
  editId.value = "";
  loadWishes();
}

function onDelete(w) {
  if (!confirm(t("treehole.wish.confirmDeleteWish"))) return;
  const list = getWishes().filter((x) => x.id !== w.id);
  saveWishes(list);
  loadWishes();
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const COLORS = [
  "#ff9aa2",
  "#a0c4ff",
  "#ffd6a5",
  "#bdb2ff",
  "#9bf6ff",
  "#caffbf",
  "#ffc6ff",
  "#b9fbc0",
  "#ffadad",
  "#fdffb6",
];
function cardColor(id) {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

// 跨标签页同步：storage 事件只在**其它**标签页改写 localStorage 时触发，本地写入不触发（无回环）。
// 不做 key 过滤：本页只读愿望列表，多读一次代价可忽略，过滤反而会因 key 前缀变化而失效
function onStorage() {
  loadWishes();
}

onMounted(() => {
  loadWishes();
  window.addEventListener("storage", onStorage);
});

onUnmounted(() => {
  window.removeEventListener("storage", onStorage);
});
</script>

<style scoped>
/* ========== 许愿墙页面内容样式 ========== */

/* 头部 */
.wish-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-radius: 20px;
  margin-bottom: 18px;
}
.page-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  color: var(--text-main);
}

/* 空状态 */
.wish-empty {
  padding: 60px 26px;
  text-align: center;
  border-radius: 26px;
  max-width: 520px;
  margin: 0 auto;
}
.empty-icon {
  font-size: 72px;
  margin-bottom: 12px;
  animation: twinkle 2s ease-in-out infinite;
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}
.empty-text {
  font-size: 17px;
  color: var(--text-main);
  font-weight: 600;
  margin: 0 0 6px;
}
.empty-sub {
  color: var(--text-sub);
  font-size: 14px;
  margin: 0 0 24px;
}

/* 许愿卡片网格 */
.wish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.wish-card {
  padding: 18px 20px;
  border-radius: 16px;
  border-left: 4px solid;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.wish-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--glow);
}
.wish-text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-main);
  white-space: pre-wrap;
}
.wish-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.light-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 13px;
  cursor: pointer;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
  color: var(--text-main);
}
:root.dark .light-btn {
  background: rgba(255, 255, 255, 0.08);
}
.light-btn:hover {
  background: var(--grad-soft);
  border-color: var(--accent);
  transform: scale(1.05);
}
.wish-date {
  font-size: 12px;
  color: var(--text-sub);
  margin-left: auto;
}
.wish-action-chip {
  border: none;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
:root.dark .wish-action-chip {
  background: rgba(255, 255, 255, 0.08);
}
.wish-action-chip:hover {
  background: var(--grad-soft);
}
.wish-del:hover {
  background: rgba(255, 100, 100, 0.2);
}

/* 弹窗 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.dialog-box {
  padding: 28px 24px;
  border-radius: 20px;
  width: 90%;
  max-width: 440px;
  background: var(--nav-bg);
  box-shadow: var(--card-shadow);
}
.dialog-title {
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--text-main);
}
.dialog-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-sub);
}
.dialog-textarea {
  width: 100%;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 0.6));
  color: var(--text-main);
  font-size: 1rem;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
.dialog-textarea:focus {
  border-color: var(--accent);
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.btn-sm {
  padding: 8px 20px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  border-radius: 999px;
}
.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .wish-head {
    flex-direction: column;
    gap: 12px;
  }
  .page-title {
    font-size: 20px;
  }
  .wish-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .wish-empty {
    padding: 40px 16px;
  }
}

@media (max-width: 600px) {
  .wish-grid {
    grid-template-columns: 1fr;
  }
}
</style>
