<template>
  <TreeholeShell active-nav="write">
    <div class="container">
      <!-- 页面标题 -->
      <section class="write-header">
        <h1 class="page-title grad-text">✍️ {{ t("treehole.write.title") }}</h1>
        <p class="page-sub">{{ t("treehole.write.subtitle2") }}</p>
      </section>

      <!-- 双栏布局 -->
      <div class="write-grid">
        <!-- ========== 左栏：编辑器 ========== -->
        <section class="editor-panel glass">
          <!-- 工具栏 -->
          <div class="editor-toolbar">
            <div class="tb-left">
              <button
                class="tb-btn"
                @click="emojiOpen = !emojiOpen"
                :title="t('treehole.write.emoji')"
              >
                😊
              </button>
              <span class="tb-divider"></span>
              <button
                class="tb-btn"
                :class="{ active: fontSize === 'small' }"
                @click="setFontSize('small')"
                :title="t('treehole.write.fontSmallTitle')"
              >
                A<sup>-</sup>
              </button>
              <button
                class="tb-btn"
                :class="{ active: fontSize === 'normal' }"
                @click="setFontSize('normal')"
                :title="t('treehole.write.fontNormalTitle')"
              >
                A
              </button>
              <button
                class="tb-btn"
                :class="{ active: fontSize === 'large' }"
                @click="setFontSize('large')"
                :title="t('treehole.write.fontLargeTitle')"
              >
                A<sup>+</sup>
              </button>
              <span class="tb-divider"></span>
              <button
                class="tb-btn tb-btn-clear"
                @click="clearContent"
                :title="t('treehole.write.clearContentTitle')"
              >
                🗑️ {{ t("treehole.write.clearContent") }}
              </button>
            </div>
            <div class="tb-right">
              <span
                class="char-counter"
                :class="{ warn: charCount > 900, danger: charCount > 1000 }"
                >{{ charCount }}/1000</span
              >
            </div>
          </div>

          <!-- Emoji 面板 -->
          <transition name="slide-down">
            <div v-if="emojiOpen" class="emoji-panel">
              <button
                v-for="e in EMOJIS"
                :key="e"
                class="emoji-btn"
                @click="insertEmoji(e)"
              >
                {{ e }}
              </button>
            </div>
          </transition>

          <!-- 信纸背景区域 + textarea -->
          <div
            class="paper-wrap"
            :style="{ background: selectedPaper.gradient }"
            :class="{
              'is-night': app.isNight && selectedPaper.key === 'starry',
            }"
          >
            <textarea
              ref="textareaRef"
              class="editor-textarea"
              :class="'fs-' + fontSize"
              :style="{ fontSize: fsValue }"
              v-model="content"
              :placeholder="t('treehole.write.contentPlaceholder')"
              maxlength="1000"
              @input="onContentInput"
            ></textarea>
          </div>
        </section>

        <!-- ========== 右栏：设置 ========== -->
        <aside class="setup-panel">
          <!-- 分类 -->
          <div class="setup-card glass">
            <div class="setup-label">📂 {{ t("treehole.write.category") }}</div>
            <div class="cat-grid">
              <button
                v-for="c in CATEGORIES"
                :key="c.key"
                class="cat-btn"
                :class="{ active: form.category === c.key }"
                @click="form.category = c.key"
              >
                {{ c.emoji }} {{ t(c.label) }}
              </button>
            </div>
          </div>

          <!-- 隐私等级 -->
          <div class="setup-card glass">
            <div class="setup-label">
              🔒 {{ t("treehole.write.privacyLevel") }}
            </div>
            <div class="privacy-row">
              <button
                v-for="p in PRIVACY"
                :key="p.key"
                class="privacy-btn"
                :class="{ active: form.privacy === p.key }"
                @click="form.privacy = p.key"
              >
                <span class="privacy-dot" :class="p.key"></span>
                <span class="privacy-label">{{ t(p.label) }}</span>
                <span class="privacy-desc">{{ t(p.desc) }}</span>
              </button>
            </div>
          </div>

          <!-- 匿名代号 -->
          <div class="setup-card glass">
            <div class="setup-label">🎭 {{ t("treehole.write.codename") }}</div>
            <div class="codename-row">
              <input
                class="native-input"
                v-model="form.codename"
                :placeholder="t('treehole.write.codenamePlaceholder2')"
                maxlength="20"
              />
              <button class="chip" @click="form.codename = randomCodename()">
                {{ t("treehole.write.random") }}
              </button>
            </div>
          </div>

          <!-- 心情标签 -->
          <div class="setup-card glass">
            <div class="setup-label">💭 {{ t("treehole.write.moods") }}</div>
            <div class="chip-row">
              <button
                v-for="m in MOODS"
                :key="m"
                class="chip"
                :class="{ active: form.moods.includes(m) }"
                @click="toggleMood(m)"
              >
                #{{ t(moodKey(m)) }}
              </button>
            </div>
          </div>

          <!-- 内容标签 -->
          <div class="setup-card glass">
            <div class="setup-label">🏷️ {{ t("treehole.write.tags") }}</div>
            <div class="chip-row">
              <button
                v-for="tg in TAGS"
                :key="tg.key"
                class="chip"
                :class="{ active: form.tags.includes(tg.key) }"
                @click="toggleTag(tg.key)"
              >
                {{ tg.emoji }} {{ t(tg.label) }}
              </button>
            </div>
          </div>

          <!-- 贴纸 -->
          <div class="setup-card glass">
            <div class="setup-label">🌸 {{ t("treehole.write.sticker") }}</div>
            <div class="chip-row">
              <button
                v-for="s in STICKERS"
                :key="s"
                class="sticker-btn"
                :class="{ active: form.sticker === s }"
                @click="form.sticker = form.sticker === s ? '' : s"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <!-- 信纸模板 -->
          <div class="setup-card glass">
            <div class="setup-label">📄 {{ t("treehole.write.paper") }}</div>
            <div class="paper-row">
              <button
                v-for="p in PAPERS"
                :key="p.key"
                class="paper-btn"
                :class="{ active: form.paper === p.key }"
                :style="{ background: p.gradient }"
                @click="form.paper = p.key"
              >
                {{ t(p.label) }}
              </button>
            </div>
          </div>

          <!-- 定时发布 -->
          <div class="setup-card glass">
            <div class="setup-label">
              ⏰ {{ t("treehole.write.scheduled") }}
            </div>
            <div class="toggle-row">
              <label class="toggle-switch">
                <input type="checkbox" v-model="scheduleEnabled" />
                <span class="toggle-track"></span>
              </label>
              <span class="toggle-label">{{
                scheduleEnabled
                  ? t("treehole.write.enabled")
                  : t("treehole.write.disabled")
              }}</span>
            </div>
            <input
              v-if="scheduleEnabled"
              class="native-input native-input-dt"
              type="datetime-local"
              v-model="form.scheduledAt"
            />
          </div>

          <!-- 限时封存 -->
          <div class="setup-card glass">
            <div class="setup-label">🔐 {{ t("treehole.write.seal") }}</div>
            <div class="toggle-row">
              <label class="toggle-switch">
                <input type="checkbox" v-model="sealEnabled" />
                <span class="toggle-track"></span>
              </label>
              <span class="toggle-label">{{
                sealEnabled
                  ? t("treehole.write.enabled")
                  : t("treehole.write.disabled")
              }}</span>
            </div>
            <input
              v-if="sealEnabled"
              class="native-input native-input-dt"
              type="datetime-local"
              v-model="form.sealUntil"
            />
          </div>

          <!-- 验证码 -->
          <div class="setup-card glass">
            <div class="setup-label">🤖 {{ t("treehole.write.captcha") }}</div>
            <div class="captcha-row">
              <div class="captcha-code" @click="genCaptcha">
                {{ captchaCode }}
              </div>
              <input
                class="native-input captcha-input"
                v-model="captchaInput"
                :placeholder="t('treehole.write.captchaPlaceholder2')"
                maxlength="4"
              />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="submit-actions">
            <button
              class="btn-grad btn-submit"
              @click="submitLetter"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-small"></span>
              <span v-else>📮 {{ t("treehole.write.submit") }}</span>
            </button>
            <button class="btn-outline" @click="saveAsDraft">
              {{ t("treehole.write.saveDraft") }}
            </button>
            <button class="btn-text" @click="clearAll">
              {{ t("treehole.write.clearAll") }}
            </button>
          </div>
        </aside>
      </div>
    </div>

    <!-- ==================== 成功弹窗 ==================== -->
    <transition name="dialog-fade">
      <div
        v-if="showSuccess"
        class="modal-overlay"
        @click.self="showSuccess = false"
      >
        <div class="modal-card pop-scale">
          <div class="modal-icon">✅</div>
          <h2 class="modal-title">{{ t("treehole.write.successTitle") }}</h2>
          <p class="modal-desc">{{ successMsg }}</p>
          <div class="modal-actions">
            <a :href="buildUrl('/treehole')" class="btn-grad">{{
              t("treehole.write.backToSquare")
            }}</a>
            <a :href="buildUrl('/treehole/mine')" class="chip">{{
              t("treehole.write.myMailbox")
            }}</a>
            <button class="btn-text" @click="writeAnother">
              {{ t("treehole.write.writeAnother") }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </TreeholeShell>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import TreeholeShell from "../components/TreeholeShell.vue";
import {
  CATEGORIES,
  PRIVACY,
  MOODS,
  STICKERS,
  PAPERS,
  getCategory,
  getPaper,
  TAGS,
  EMOJIS,
  SENSITIVE_WORDS,
  moodKey,
} from "../stores/constants";
import {
  addLetter,
  updateLetter,
  saveDraft,
  getLetters,
  canPost,
  logPost,
  logMood,
  saveSketch,
} from "../stores/storage";
import { randomCodename } from "../utils/codename";
import { useApp } from "../stores/app";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

const app = useApp();

const textareaRef = ref(null);

// ---------- 表单状态 ----------
const form = reactive({
  category: "confess",
  privacy: "public",
  codename: randomCodename(),
  moods: /** @type {string[]} */ ([]),
  tags: /** @type {string[]} */ ([]),
  sticker: "",
  paper: "paper",
  scheduledAt: "",
  sealUntil: "",
});

const content = ref("");
const fontSize = ref("normal");
const emojiOpen = ref(false);
const scheduleEnabled = ref(false);
const sealEnabled = ref(false);
const captchaCode = ref("");
const captchaInput = ref("");
const submitting = ref(false);
const showSuccess = ref(false);
const successMsg = ref("");

// 编辑模式
const editId = ref("");

// ---------- 计算属性 ----------
const charCount = computed(() => content.value.length);
const fsValue = computed(() => {
  return fontSize.value === "small"
    ? "0.9em"
    : fontSize.value === "large"
      ? "1.15em"
      : "1em";
});
const selectedPaper = computed(() => getPaper(form.paper));
const selectedCategory = computed(() => getCategory(form.category));

// ---------- 验证码 ----------
function genCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  captchaCode.value = code;
}

// ---------- 工具栏 ----------
function setFontSize(s) {
  fontSize.value = s;
}

function insertEmoji(e) {
  content.value += e;
  emojiOpen.value = false;
  nextTick(() => textareaRef.value?.focus());
}

function clearContent() {
  content.value = "";
}

function onContentInput() {
  // 敏感词检测
  const lower = content.value.toLowerCase();
  for (const w of SENSITIVE_WORDS) {
    if (lower.includes(w.toLowerCase())) {
      content.value = content.value.replace(new RegExp(w, "gi"), "***");
    }
  }
}

// ---------- 选项切换 ----------
function toggleMood(m) {
  const idx = form.moods.indexOf(m);
  if (idx > -1) {
    form.moods.splice(idx, 1);
  } else {
    if (form.moods.length < 3) {
      form.moods.push(m);
    }
  }
}

function toggleTag(key) {
  const idx = form.tags.indexOf(key);
  if (idx > -1) {
    form.tags.splice(idx, 1);
  } else {
    if (form.tags.length < 3) {
      form.tags.push(key);
    }
  }
}

// ---------- 清空 ----------
function clearAll() {
  content.value = "";
  form.category = "confess";
  form.privacy = "public";
  form.codename = randomCodename();
  form.moods = [];
  form.tags = [];
  form.sticker = "";
  form.paper = "paper";
  form.scheduledAt = "";
  form.sealUntil = "";
  scheduleEnabled.value = false;
  sealEnabled.value = false;
  captchaInput.value = "";
  genCaptcha();
}

// ---------- 验证 ----------
function validate() {
  if (!content.value.trim()) {
    alert(t("treehole.write.emptyAlert"));
    return false;
  }
  if (charCount.value > 1000) {
    alert(t("treehole.write.lengthAlert"));
    return false;
  }
  if (!canPost()) {
    alert(t("treehole.write.rateAlert"));
    return false;
  }
  if (captchaInput.value.toUpperCase() !== captchaCode.value) {
    alert(t("treehole.write.captchaAlert"));
    genCaptcha();
    captchaInput.value = "";
    return false;
  }
  return true;
}

// ---------- 构建信件对象 ----------
function buildLetter() {
  const now = Date.now();
  const status =
    scheduleEnabled.value && form.scheduledAt
      ? "scheduled"
      : sealEnabled.value && form.sealUntil
        ? "published"
        : "published";

  return {
    id: editId.value || "L_" + now + "_" + Math.floor(Math.random() * 10000),
    content: content.value.trim(),
    category: form.category,
    categoryLabel: selectedCategory.value.label,
    categoryEmoji: selectedCategory.value.emoji,
    privacy: form.privacy,
    codename: form.codename || randomCodename(),
    moods: form.moods.slice(),
    tags: form.tags.slice(),
    sticker: form.sticker,
    paper: form.paper,
    scheduledAt:
      scheduleEnabled.value && form.scheduledAt
        ? new Date(form.scheduledAt).getTime()
        : undefined,
    scheduledPrivacy: scheduleEnabled.value ? form.privacy : undefined,
    sealUntil:
      sealEnabled.value && form.sealUntil
        ? new Date(form.sealUntil).getTime()
        : undefined,
    status,
    publishedAt: status === "published" ? now : undefined,
    createdAt: editId.value ? undefined : now,
    updatedAt: now,
    likes: 0,
    favorites: 0,
  };
}

// ---------- 提交 ----------
function submitLetter() {
  if (!validate()) return;
  submitting.value = true;

  // 上报心情
  form.moods.forEach((m) => logMood(m));

  const letter = buildLetter();

  try {
    if (editId.value) {
      updateLetter(editId.value, letter);
    } else {
      addLetter(letter);
      logPost();
    }

    if (form.sticker) {
      saveSketch(form.sticker);
    }

    successMsg.value = editId.value
      ? t("treehole.write.updatedTip2")
      : scheduleEnabled.value && form.scheduledAt
        ? t("treehole.write.scheduledTip2", {
            time: new Date(form.scheduledAt).toLocaleString(),
          })
        : t("treehole.write.publishedTip2");

    showSuccess.value = true;
  } catch {
    alert(t("treehole.write.submitFail"));
  } finally {
    submitting.value = false;
  }
}

function saveAsDraft() {
  if (!content.value.trim()) {
    alert(t("treehole.write.emptyDraftMsg2"));
    return;
  }
  const draft = {
    id: editId.value || "draft_" + Date.now(),
    content: content.value,
    category: form.category,
    privacy: form.privacy,
    codename: form.codename,
    moods: form.moods.slice(),
    tags: form.tags.slice(),
    sticker: form.sticker,
    paper: form.paper,
    scheduledAt: scheduleEnabled.value ? form.scheduledAt : "",
    sealUntil: sealEnabled.value ? form.sealUntil : "",
    savedAt: Date.now(),
  };
  saveDraft(draft);
  alert(t("treehole.write.draftSaved2"));
}

function writeAnother() {
  showSuccess.value = false;
  clearAll();
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    textareaRef.value?.focus();
  });
}

// ---------- 初始化 ----------
onMounted(() => {
  genCaptcha();

  // 尝试从 URL 参数加载编辑的信件
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const letterId = params.get("edit");
    if (letterId) {
      const letters = getLetters();
      const found = letters.find((l) => l.id === letterId);
      if (found) {
        editId.value = found.id;
        content.value = found.content || "";
        form.category = found.category || "confess";
        form.privacy = found.privacy || "public";
        form.codename = found.codename || randomCodename();
        form.moods = found.moods ? found.moods.slice() : [];
        form.tags = found.tags ? found.tags.slice() : [];
        form.sticker = found.sticker || "";
        form.paper = found.paper || "paper";
        if (found.scheduledAt) {
          scheduleEnabled.value = true;
          form.scheduledAt = new Date(found.scheduledAt)
            .toISOString()
            .slice(0, 16);
        }
        if (found.sealUntil) {
          sealEnabled.value = true;
          form.sealUntil = new Date(found.sealUntil).toISOString().slice(0, 16);
        }
      }
    }
  }
});
</script>

<style scoped>
/* ========== WritePage 专用样式 ========== */

/* ========== 页面头部 ========== */
.write-header {
  text-align: center;
  margin-bottom: 28px;
}
.page-title {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 800;
  margin: 0 0 8px;
  letter-spacing: 1px;
}
.page-sub {
  color: var(--text-sub);
  font-size: 14px;
  margin: 0;
}

/* ========== 双栏布局 ========== */
.write-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 22px;
  align-items: start;
}

/* ========== 左栏：编辑器 ========== */
.editor-panel {
  border-radius: 22px;
  overflow: hidden;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--card-border);
  gap: 8px;
  flex-wrap: wrap;
}
.tb-left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tb-right {
  flex-shrink: 0;
}
.tb-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
  line-height: 1;
}
.tb-btn:hover,
.tb-btn.active {
  border-color: var(--blue);
  color: var(--accent);
  background: var(--grad-soft);
}
.tb-btn-clear {
  width: auto;
  padding: 0 10px;
  font-size: 12px;
}
.tb-divider {
  width: 1px;
  height: 18px;
  background: var(--card-border);
  margin: 0 4px;
}
.char-counter {
  font-size: 12px;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}
.char-counter.warn {
  color: #e6a817;
}
.char-counter.danger {
  color: var(--danger);
  font-weight: 700;
}

/* Emoji 面板 */
.emoji-panel {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--card-border);
  background: var(--bg-3);
  max-height: 140px;
  overflow-y: auto;
}
.emoji-btn {
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.emoji-btn:hover {
  background: var(--grad-soft);
  transform: scale(1.2);
}

/* 信纸背景 + textarea */
.paper-wrap {
  padding: 24px 28px;
  min-height: 420px;
  transition: background 0.4s;
  position: relative;
}
.paper-wrap.is-night {
  color: #e7e7f0;
}
.paper-wrap.is-night .editor-textarea {
  color: #e7e7f0;
}
.paper-wrap.is-night .editor-textarea::placeholder {
  color: rgba(255, 255, 255, 0.45);
}
.editor-textarea {
  width: 100%;
  min-height: 380px;
  border: none;
  outline: none;
  background: transparent;
  resize: vertical;
  font-family: inherit;
  line-height: 1.9;
  color: var(--text-main);
  caret-color: var(--accent);
  transition: font-size 0.2s;
}
.editor-textarea::placeholder {
  color: #bbb;
  font-style: italic;
}
.editor-textarea:focus {
  outline: none;
}

/* ========== 右栏：设置面板 ========== */
.setup-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setup-card {
  padding: 16px 18px;
  border-radius: 18px;
}

.setup-label {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-main);
  margin-bottom: 10px;
}

/* 分类网格 */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.cat-btn {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-sub);
  text-align: left;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
.cat-btn:hover {
  border-color: var(--blue);
  color: var(--accent);
}
.cat-btn.active {
  border-color: var(--blue);
  color: var(--accent);
  background: var(--grad-soft);
  font-weight: 700;
}

/* 隐私等级 */
.privacy-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.privacy-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--card-border);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
.privacy-btn:hover {
  border-color: var(--blue);
}
.privacy-btn.active {
  border-color: var(--blue);
  background: var(--grad-soft);
}
.privacy-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.privacy-dot.public {
  background: #4fc3f7;
}
.privacy-dot.self {
  background: #81c784;
}
.privacy-dot.random {
  background: #ffb74d;
}
.privacy-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}
.privacy-desc {
  font-size: 11px;
  color: var(--text-sub);
  margin-left: auto;
}

/* 代号行 */
.codename-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 原生输入框 */
.native-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  background: var(--bg-1);
  color: var(--text-main);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.native-input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--glow);
}
.native-input::placeholder {
  color: var(--text-sub);
}
.native-input-dt {
  margin-top: 8px;
  width: 100%;
}

/* Chip 行 */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 贴纸按钮 */
.sticker-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
.sticker-btn:hover {
  border-color: var(--blue);
  transform: scale(1.15);
}
.sticker-btn.active {
  border-color: var(--blue);
  background: var(--grad-soft);
  box-shadow: 0 0 8px var(--glow);
}

/* 信纸模板按钮 */
.paper-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.paper-btn {
  padding: 8px 14px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  font-weight: 600;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
}
.paper-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.paper-btn.active {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--glow);
  transform: scale(1.04);
}

/* 开关 */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  cursor: pointer;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-track {
  position: absolute;
  inset: 0;
  background: var(--card-border);
  border-radius: 999px;
  transition: background 0.3s;
}
.toggle-track::after {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s;
}
.toggle-switch input:checked + .toggle-track {
  background: var(--grad);
}
.toggle-switch input:checked + .toggle-track::after {
  transform: translateX(18px);
}
.toggle-label {
  font-size: 13px;
  color: var(--text-sub);
}

/* 验证码行 */
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.captcha-code {
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--grad-soft);
  color: var(--accent);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 6px;
  cursor: pointer;
  user-select: none;
  font-family: "Courier New", monospace;
  border: 1px solid var(--card-border);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.captcha-code:hover {
  transform: scale(1.05);
}
.captcha-input {
  flex: 1;
}

/* 提交操作 */
.submit-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}
.btn-submit {
  width: 100%;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-outline {
  width: 100%;
  padding: 10px 0;
  border: 1px solid var(--card-border);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  color: var(--text-sub);
  font-size: 13px;
  font-family: inherit;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
.btn-outline:hover {
  border-color: var(--blue);
  color: var(--accent);
  background: var(--grad-soft);
}
.btn-text {
  width: 100%;
  padding: 8px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-sub);
  font-size: 12px;
  font-family: inherit;
  transition: color 0.2s;
}
.btn-text:hover {
  color: var(--danger);
}

/* 小旋转器 */
.spinner-small {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: spinGlow 0.9s linear infinite;
}
@keyframes spinGlow {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 成功弹窗 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--mask);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  padding: 36px 32px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: var(--card-shadow);
}
.modal-icon {
  font-size: 56px;
  margin-bottom: 12px;
}
.modal-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 8px;
}
.modal-desc {
  color: var(--text-sub);
  font-size: 14px;
  margin: 0 0 24px;
  line-height: 1.6;
}
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.modal-actions .btn-grad {
  width: 100%;
  text-decoration: none;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
}
.modal-actions .chip {
  font-size: 13px;
  padding: 10px 20px;
  text-decoration: none;
  color: var(--text-sub);
}

/* 弹窗动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.pop-scale-enter-active {
  animation: popScaleIn 0.32s cubic-bezier(0.2, 1.3, 0.4, 1);
}
@keyframes popScaleIn {
  from {
    opacity: 0;
    transform: scale(0.86);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.pop-scale {
  animation: popScaleIn 0.32s cubic-bezier(0.2, 1.3, 0.4, 1);
}

/* ========== 字体大小类 ========== */
.fs-small {
  font-size: 0.9em;
}
.fs-normal {
  font-size: 1em;
}
.fs-large {
  font-size: 1.15em;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .write-grid {
    grid-template-columns: 1fr;
  }
  .paper-wrap {
    min-height: 340px;
  }
  .editor-textarea {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .paper-wrap {
    padding: 18px 16px;
    min-height: 300px;
  }
  .editor-textarea {
    min-height: 260px;
  }
  .emoji-panel {
    grid-template-columns: repeat(8, 1fr);
  }
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: clamp(18px, 5vw, 24px);
  }
  .editor-toolbar {
    padding: 10px 12px;
  }
  .emoji-panel {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>
