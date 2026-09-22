<template>
  <TreeholeShell active-nav="messages">
    <div class="container">
      <h1 class="page-title">💬 {{ t("treehole.messages.title") }}</h1>
      <p class="page-sub">{{ t("treehole.messages.subtitle") }}</p>

      <div class="msg-layout">
        <!-- 会话列表 -->
        <aside class="conv-list glass">
          <div class="conv-head">
            <span>{{
              t("treehole.messages.conversations", {
                count: conversations.length,
              })
            }}</span>
          </div>
          <div v-if="conversations.length" class="conv-items">
            <div
              v-for="c in conversations"
              :key="c.id"
              class="conv-item"
              :class="{ active: activeId === c.id, blocked: c.blocked }"
              @click="selectConv(c)"
            >
              <div class="conv-avatar">{{ c.peerCodename?.charAt(0) }}</div>
              <div class="conv-info">
                <b>{{ c.peerCodename }}</b>
                <small>{{ lastMsg(c) }}</small>
              </div>
              <span v-if="c.blocked" class="conv-blocked">{{
                t("treehole.messages.blocked")
              }}</span>
            </div>
          </div>
          <EmptyState
            v-else
            :title="t('treehole.messages.emptyConvsTitle')"
            :sub="t('treehole.messages.emptyConvsSub')"
          />
        </aside>

        <!-- 对话面板 -->
        <section class="chat glass" v-if="active">
          <div class="chat-head">
            <div class="chat-peer">
              <div class="conv-avatar">
                {{ active.peerCodename?.charAt(0) }}
              </div>
              <div>
                <b>{{ active.peerCodename }}</b>
                <small>{{
                  t("treehole.messages.myCodename", { name: active.myCodename })
                }}</small>
              </div>
            </div>
            <div class="chat-acts">
              <button class="mini" @click="blockConv" v-if="!active.blocked">
                {{ t("treehole.messages.block") }}
              </button>
              <button
                class="mini"
                @click="clearConvConfirm"
                v-if="active.messages?.length"
              >
                {{ t("treehole.messages.clear") }}
              </button>
              <button class="mini danger" @click="delConvConfirm">
                {{ t("treehole.messages.delete") }}
              </button>
            </div>
          </div>

          <div class="chat-body" ref="chatBody">
            <div v-if="active.messages?.length" class="bubbles">
              <div
                v-for="(m, i) in active.messages"
                :key="m.id || i"
                class="bubble"
                :class="[
                  m.from === 'me' ? 'mine' : 'peer',
                  { recalled: m.recalled },
                ]"
              >
                <template v-if="m.recalled">{{ m.text }}</template>
                <template v-else>
                  <span class="bubble-text">{{ m.text }}</span>
                  <button
                    v-if="m.from === 'me' && !m.recalled"
                    class="bubble-recall"
                    @click="recall(active.id, m)"
                  >
                    {{ t("treehole.messages.recall") }}
                  </button>
                </template>
              </div>
            </div>
            <EmptyState
              v-else
              :title="t('treehole.messages.emptyMsgsTitle')"
              :sub="t('treehole.messages.emptyMsgsSub')"
            />
          </div>

          <div class="chat-input" v-if="!active.blocked">
            <textarea
              v-model="text"
              :placeholder="t('treehole.messages.replyPlaceholder')"
              @keyup.enter.exact="onEnter"
              @compositionstart="composing = true"
              @compositionend="composing = false"
              rows="1"
            ></textarea>
            <button class="btn-grad" :disabled="!text.trim()" @click="send">
              {{ t("treehole.messages.send") }}
            </button>
          </div>
          <div v-else class="chat-blocked">
            {{ t("treehole.messages.blockedHint") }}
          </div>
        </section>

        <EmptyState
          v-else
          class="chat-empty"
          :title="t('treehole.messages.selectConvHint')"
        />
      </div>
    </div>
  </TreeholeShell>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import TreeholeShell from "../components/TreeholeShell.vue";
import EmptyState from "../components/EmptyState.vue";
import {
  getReplies,
  appendMessage,
  recallMessage,
  blockConversation,
  clearConversation,
  deleteConversation,
} from "../stores/storage";
import { t } from "~/lib/i18n";

const conversations = ref([]);
const activeId = ref("");
const text = ref("");
const chatBody = ref(null);

const active = computed(
  () => conversations.value.find((c) => c.id === activeId.value) || null,
);

onMounted(() => {
  conversations.value = getReplies();
  if (conversations.value.length) activeId.value = conversations.value[0].id;
});

function lastMsg(c) {
  // 导入的备份只校验到「是数组」这一层，历史 schema 的会话可能缺 messages/peerCodename
  if (!c.messages?.length) return t("treehole.messages.noMsg");
  const m = c.messages[c.messages.length - 1];
  return (
    (m.recalled
      ? t("treehole.messages.recalledPrefix")
      : m.from === "me"
        ? t("treehole.messages.mePrefix")
        : "") + m.text
  );
}

function selectConv(c) {
  activeId.value = c.id;
  // text 是所有会话共用的一个 ref：不在这里清空，A 的草稿会被顺手发给 B
  text.value = "";
  // 切过来后定位到最新一条，否则停留在上一段历史的滚动位置
  nextTick(scrollBottom);
}

// 中文输入法用 Enter 上屏候选词时也会触发 keyup.enter：不判断 composition 会提前/重复发送
const composing = ref(false);

function onEnter() {
  if (composing.value) return;
  send();
}

function send() {
  if (!text.value.trim() || !active.value) return;
  const msg = {
    // 同毫秒内连发两条会撞 id（Date.now + 两位随机数的空间太小），重复 id 会破坏查找/编辑/撤回
    id: `m_${crypto.randomUUID()}`,
    from: "me",
    text: text.value.trim(),
    at: Date.now(),
  };
  appendMessage(activeId.value, msg);
  conversations.value = getReplies();
  text.value = "";
  nextTick(scrollBottom);
}

function recall(convId, msg) {
  recallMessage(convId, msg.id);
  conversations.value = getReplies();
}

function blockConv() {
  if (confirm(t("treehole.messages.confirmBlock"))) {
    blockConversation(activeId.value);
    conversations.value = getReplies();
  }
}

function clearConvConfirm() {
  if (confirm(t("treehole.messages.confirmClear"))) {
    clearConversation(activeId.value);
    conversations.value = getReplies();
  }
}

function delConvConfirm() {
  if (confirm(t("treehole.messages.confirmDelete"))) {
    deleteConversation(activeId.value);
    conversations.value = getReplies();
    activeId.value = conversations.value[0]?.id || "";
  }
}

function scrollBottom() {
  const el = chatBody.value;
  if (el) el.scrollTop = el.scrollHeight;
}
</script>

<style scoped>
/* ========== Messages 页面内容样式 ========== */

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

.msg-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;
}

.conv-list {
  padding: 14px;
  border-radius: 20px;
  max-height: 70vh;
  overflow-y: auto;
}
.conv-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 14px;
}
.conv-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  cursor: pointer;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
  border: 1px solid transparent;
}
.conv-item:hover {
  background: rgba(255, 255, 255, 0.4);
}
.conv-item.active {
  background: rgba(255, 255, 255, 0.55);
  border-color: var(--accent);
  box-shadow: 0 0 12px var(--glow);
}
.conv-item.blocked {
  opacity: 0.55;
}
.conv-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--grad-soft);
  color: var(--accent);
  border: 1px solid var(--card-border);
  display: grid;
  place-items: center;
  font-weight: 700;
  flex-shrink: 0;
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.conv-info b {
  font-size: 13px;
  display: block;
  color: var(--text-main);
}
.conv-info small {
  font-size: 11px;
  color: var(--text-sub);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conv-blocked {
  font-size: 10px;
  color: var(--danger);
}

.chat {
  padding: 16px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
}
.chat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--card-border);
}
.chat-peer {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chat-peer small {
  display: block;
  font-size: 11px;
  color: var(--text-sub);
}
.chat-acts {
  display: flex;
  gap: 6px;
}

.mini {
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.4);
  color: var(--text-main);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition:
    background var(--duration-base) var(--ease),
    color var(--duration-base) var(--ease),
    border-color var(--duration-base) var(--ease),
    opacity var(--duration-base) var(--ease);
}
.mini:hover {
  border-color: var(--accent);
}
.mini.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 4px;
  max-height: 52vh;
}
.bubbles {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bubble {
  max-width: 72%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: calc(14px * var(--font-scale));
  line-height: 1.6;
  word-break: break-word;
  animation: floatUpAni 0.3s both;
  position: relative;
}
.bubble.mine {
  align-self: flex-end;
  background: var(--grad-soft);
  color: var(--accent);
  border: 1px solid var(--card-border);
  border-bottom-right-radius: 4px;
}
.bubble.peer {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.55);
  color: var(--text-main);
  border-bottom-left-radius: 4px;
}
.bubble.recalled {
  opacity: 0.6;
  font-style: italic;
  font-size: 12px;
}
.bubble-recall {
  position: absolute;
  top: -8px;
  right: 6px;
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-sub);
  border-radius: 999px;
  font-size: 10px;
  padding: 1px 7px;
  cursor: pointer;
}

@keyframes floatUpAni {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-input {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--card-border);
}
.chat-input textarea {
  flex: 1;
  border-radius: 14px;
  padding: 10px 14px;
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.45);
  color: var(--text-main);
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
}
.chat-input textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--glow);
}
.chat-blocked {
  text-align: center;
  color: var(--text-sub);
  font-size: 13px;
  padding: 16px;
}
.chat-empty {
  grid-column: 2;
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .msg-layout {
    grid-template-columns: 1fr;
  }
  .chat-empty {
    grid-column: 1;
  }
}
</style>
