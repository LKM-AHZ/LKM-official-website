<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useAiStore } from "../stores/ai";
import type { AiAgent } from "~/features/starhope/types";
import { t } from "~/lib/i18n";

const ai = useAiStore();
const inputText = ref("");
const _showAgentEditor = ref(false);
const _editingAgent = ref<AiAgent | null>(null);
const messagesEl = ref<HTMLElement | null>(null);

// 追加消息后滚到底：否则新消息与「生成中」提示会停在视口之外，用户看不到反馈
watch(
  () => ai.messages.value.length,
  async () => {
    await nextTick();
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  },
);

onMounted(() => {
  ai.loadAgents();
});

async function handleSend() {
  if (!inputText.value.trim() || ai.isGenerating.value) return;
  await ai.sendMessage(inputText.value.trim());
  inputText.value = "";
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)]">
    <div class="w-56 shrink-0 border-r border-surface-3 p-4 flex flex-col">
      <h3 class="text-sm font-semibold text-deep-text mb-3">
        {{ t("starhope.ai.title") }}
      </h3>
      <div class="space-y-1 flex-1 overflow-y-auto">
        <div
          v-for="agent in ai.agents.value"
          :key="agent.id"
          role="button"
          tabindex="0"
          class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer"
          :class="
            ai.currentAgentId.value === agent.id
              ? 'bg-primary/10 text-primary'
              : 'text-text-muted hover:bg-surface-3'
          "
          @click="ai.selectAgent(agent.id)"
          @keydown.enter="ai.selectAgent(agent.id)"
          @keydown.space.prevent="ai.selectAgent(agent.id)"
        >
          <span>{{ agent.name }}</span>
        </div>
      </div>
      <button class="btn-neutral rounded-lg w-full py-2 text-sm mt-2">
        + {{ t("starhope.ai.newAgent") }}
      </button>
    </div>
    <div class="flex-1 flex flex-col min-w-0">
      <div v-if="ai.currentAgent.value" class="flex-1 flex flex-col">
        <div
          class="border-b border-surface-3 px-6 py-3 flex items-center justify-between"
        >
          <div>
            <h2 class="text-sm font-semibold text-deep-text">
              {{ ai.currentAgent.value.name }}
            </h2>
            <p class="text-xs text-text-muted">
              {{ ai.currentAgent.value.model }}
            </p>
          </div>
          <button
            @click="ai.clearConversation()"
            class="text-xs text-text-muted hover:text-red-500"
          >
            {{ t("starhope.ai.clearConversation") }}
          </button>
        </div>
        <div
          ref="messagesEl"
          class="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          <div
            v-for="msg in ai.messages.value"
            :key="msg.id"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[75%] rounded-2xl px-4 py-3 text-sm"
              :class="
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-surface-3 text-deep-text'
              "
            >
              <div class="whitespace-pre-wrap leading-relaxed">
                {{ msg.content }}
              </div>
            </div>
          </div>
          <div
            v-if="ai.messages.value.length === 0 && !ai.isGenerating.value"
            class="flex items-center justify-center h-full"
          >
            <div class="text-center">
              <div class="text-5xl mb-4">🤖</div>
              <h3 class="text-lg font-semibold text-deep-text">
                {{ ai.currentAgent.value.name }}
              </h3>
              <p class="text-sm text-text-muted">
                {{ t("starhope.ai.startHint") }}
              </p>
            </div>
          </div>
        </div>
        <div class="border-t border-surface-3 px-6 py-4">
          <div class="flex gap-3">
            <textarea
              v-model="inputText"
              rows="2"
              @keydown.enter.exact.prevent="handleSend"
              class="flex-1 rounded-xl border border-surface-3 bg-page-bg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
              :placeholder="t('starhope.ai.inputPlaceholder')"
              :disabled="ai.isGenerating.value"
            ></textarea>
            <button
              @click="handleSend"
              :disabled="!inputText.trim() || ai.isGenerating.value"
              class="btn-primary rounded-xl px-5 py-3 text-sm font-semibold shrink-0 disabled:opacity-50"
            >
              {{ ai.isGenerating.value ? "..." : t("starhope.ai.send") }}
            </button>
          </div>
        </div>
      </div>
      <div
        v-else
        class="flex items-center justify-center h-full text-text-muted"
      >
        <p>{{ t("starhope.ai.selectHint") }}</p>
      </div>
    </div>
  </div>
</template>
