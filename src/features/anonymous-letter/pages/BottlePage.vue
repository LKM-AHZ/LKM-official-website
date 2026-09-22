<template>
  <TreeholeShell active-nav="bottle">
    <div class="container">
      <!-- 头部 -->
      <section class="bottle-head glass float-up">
        <h1 class="page-title">🍶 {{ t("treehole.bottle.title") }}</h1>
        <button class="btn-grad" @click="throwDialogOpen = true">
          {{ t("treehole.bottle.throwBtn") }}
        </button>
      </section>

      <!-- 无漂流瓶状态 -->
      <section v-if="!currentBottle" class="bottle-empty glass float-up">
        <div class="bottle-sea">
          <div class="sea-emoji">🌊</div>
          <p class="sea-text">
            {{ t("treehole.bottle.seaText", { count: bottleCount }) }}
          </p>
          <p class="sea-sub">{{ t("treehole.bottle.seaSub") }}</p>
          <button
            class="btn-grad"
            @click="pickBottleHandler"
            :disabled="picking || bottleCount === 0"
          >
            {{
              picking
                ? t("treehole.bottle.picking")
                : t("treehole.bottle.pickBtn")
            }}
          </button>
        </div>
      </section>

      <!-- 当前瓶子 -->
      <section v-else class="bottle-current glass float-up">
        <div class="bottle-display">
          <div class="bottle-icon">🍶</div>
          <div class="bottle-text">{{ currentBottle.text }}</div>
          <div class="bottle-meta">
            <span class="bottle-from">{{
              t("treehole.bottle.from", {
                name: currentBottle.from || t("treehole.bottle.stranger"),
              })
            }}</span>
            <span class="bottle-date">{{
              formatDate(currentBottle.createdAt)
            }}</span>
          </div>
        </div>

        <!-- 回复区域 -->
        <div class="bottle-reply">
          <textarea
            v-model="replyText"
            class="reply-textarea"
            :placeholder="t('treehole.bottle.replyPlaceholder')"
            rows="3"
          ></textarea>
          <div class="reply-actions">
            <button
              class="chip"
              @click="
                currentBottle = null;
                replyText = '';
              "
            >
              {{ t("treehole.bottle.switchBottle") }}
            </button>
            <button
              class="btn-grad btn-sm"
              @click="sendBottleReply"
              :disabled="!replyText.trim()"
            >
              {{ t("treehole.bottle.sendReply") }}
            </button>
          </div>
          <p v-if="replyOk" class="reply-ok">
            {{ t("treehole.bottle.replySent") }}
          </p>
        </div>
      </section>

      <!-- 扔漂流瓶弹窗 -->
      <div
        v-if="throwDialogOpen"
        class="dialog-overlay"
        @click.self="closeThrowDialog"
      >
        <div class="dialog-box glass">
          <h3 class="dialog-title">
            🍶 {{ t("treehole.bottle.throwDialogTitle") }}
          </h3>
          <p class="dialog-desc">{{ t("treehole.bottle.throwDialogDesc") }}</p>
          <textarea
            v-model="throwText"
            class="dialog-textarea"
            :placeholder="t('treehole.bottle.throwPlaceholder')"
            rows="4"
          ></textarea>
          <div class="dialog-actions">
            <button
              class="chip"
              @click="closeThrowDialog"
            >
              {{ t("treehole.bottle.cancel") }}
            </button>
            <button
              class="btn-grad btn-sm"
              @click="throwBottle"
              :disabled="!throwText.trim()"
            >
              {{ t("treehole.bottle.throwBtn2") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </TreeholeShell>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import TreeholeShell from "../components/TreeholeShell.vue";
import {
  getBottles,
  addBottle,
  pickBottle,
  markBottlePicked,
} from "../stores/storage";
import { t } from "~/lib/i18n";

const allBottles = ref([]);
const currentBottle = ref(null);
const picking = ref(false);
const replyText = ref("");
const replyOk = ref(false);
const throwDialogOpen = ref(false);
const throwText = ref("");

const bottleCount = computed(() => {
  // 与 storage.pickBottle() 的过滤口径一致（自己扔的瓶子不算可捞）：否则会出现
  // 「计数 > 0、按钮可点，点下去 pickBottle() 返回 null、界面毫无反应」
  return allBottles.value.filter((b) => !b.picked && b.ownerId !== "me_local")
    .length;
});

function loadBottles() {
  allBottles.value = getBottles();
}

function pickBottleHandler() {
  picking.value = true;
  replyText.value = "";
  replyOk.value = false;
  setTimeout(() => {
    const bottle = pickBottle();
    currentBottle.value = bottle;
    picking.value = false;
    // 竞态下可能已无可捞的瓶子：重载列表把计数与禁用态拉回真实值（面向用户的提示文案需新增
    // i18n key，而 src/lib/i18n/languages/*.ts 不在本单元文件清单内，故此处只做自校正）
    if (!bottle) loadBottles();
  }, 500);
}

function sendBottleReply() {
  if (!currentBottle.value || !replyText.value.trim()) return;
  markBottlePicked(currentBottle.value.id, replyText.value.trim());
  replyOk.value = true;
  loadBottles();
  setTimeout(() => {
    currentBottle.value = null;
    replyText.value = "";
    replyOk.value = false;
  }, 1500);
}

// 关闭弹窗（遮罩点击/取消按钮共用）：只关不重置的话，下次打开会看到上次的草稿
function closeThrowDialog() {
  throwDialogOpen.value = false;
  throwText.value = "";
}

function throwBottle() {
  if (!throwText.value.trim()) return;
  addBottle({
    id: "bottle_" + Date.now(),
    text: throwText.value.trim(),
    from: t("treehole.bottle.stranger"),
    createdAt: Date.now(),
    picked: false,
    ownerId: "me_local",
  });
  throwText.value = "";
  throwDialogOpen.value = false;
  loadBottles();
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

onMounted(() => {
  loadBottles();
});
</script>

<style scoped>
/* ========== 漂流瓶页面内容样式 ========== */

/* 头部 */
.bottle-head {
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
.bottle-empty {
  padding: 60px 26px;
  text-align: center;
  border-radius: 26px;
  max-width: 520px;
  margin: 0 auto;
}
.sea-emoji {
  font-size: 80px;
  margin-bottom: 16px;
  animation: wave 3s ease-in-out infinite;
}
@keyframes wave {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-6px) rotate(-2deg);
  }
  75% {
    transform: translateY(4px) rotate(2deg);
  }
}
.sea-text {
  font-size: 17px;
  color: var(--text-main);
  font-weight: 600;
  margin: 0 0 6px;
}
.sea-sub {
  color: var(--text-sub);
  font-size: 14px;
  margin: 0 0 24px;
}

/* 当前瓶子 */
.bottle-current {
  padding: 24px;
  border-radius: 26px;
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.bottle-display {
  background: linear-gradient(
    135deg,
    rgba(173, 216, 230, 0.2),
    rgba(221, 160, 221, 0.15)
  );
  padding: 28px 24px;
  border-radius: 16px;
  text-align: center;
}
:root.dark .bottle-display {
  background: rgba(255, 255, 255, 0.05);
}
.bottle-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.bottle-text {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-main);
  white-space: pre-wrap;
  margin-bottom: 16px;
}
.bottle-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 13px;
  color: var(--text-sub);
}
.bottle-from {
  font-style: italic;
}

/* 回复区域 */
.bottle-reply {
  border-top: 1px solid var(--card-border);
  padding-top: 16px;
}
.reply-textarea {
  width: 100%;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 0.6));
  color: var(--text-main);
  font-size: 1rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.reply-textarea:focus {
  border-color: var(--accent);
}
.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
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
.reply-ok {
  color: var(--accent);
  font-size: 13px;
  margin-top: 10px;
  text-align: center;
}

/* 扔瓶子弹窗 */
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

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .bottle-head {
    flex-direction: column;
    gap: 12px;
  }
  .page-title {
    font-size: 20px;
  }
  .bottle-empty {
    padding: 40px 16px;
  }
  .sea-emoji {
    font-size: 60px;
  }
  .bottle-current {
    padding: 16px;
  }
  .bottle-display {
    padding: 20px 16px;
  }
}

@media (max-width: 600px) {
  .sea-emoji {
    font-size: 48px;
  }
}
</style>
