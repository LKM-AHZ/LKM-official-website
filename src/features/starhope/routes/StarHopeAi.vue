<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAiStore } from "../stores/ai";
import { t } from "~/lib/i18n";

const ai = useAiStore();
const inputText = ref("");
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

// 中文输入法敲 Enter 是上屏候选词，不判断合成态会把没确认完的半句直接发出去
// （MessagesPage 用同样的 composition 标记）
const composing = ref(false);
function onEnterKey(e: KeyboardEvent): void {
  if (e.isComposing || composing.value) return;
  void handleSend();
}
</script>

<template>
  <div
    class="mx-auto w-full max-w-6xl px-4 py-7 pb-16 sm:px-7 sm:py-9 lg:px-10"
  >
    <header class="mb-6 flex items-center gap-4">
      <span
        class="flex size-12 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
        ><Icon icon="tabler:robot" class="size-6" aria-hidden="true"
      /></span>
      <h1
        class="text-xl font-semibold tracking-tight text-deep-text sm:text-2xl"
      >
        {{ t("starhope.ai.title") }}
      </h1>
    </header>
    <div
      class="card-base flex h-[min(42rem,calc(100dvh-13rem))] min-h-96 flex-col md:flex-row"
    >
      <aside
        class="shrink-0 border-b border-surface-3 bg-page-bg p-3 md:w-48 md:border-b-0 md:border-r md:p-4"
      >
        <p v-if="ai.error.value" role="alert" class="mb-3 text-xs text-red-500">
          {{ ai.error.value }}
        </p>
        <div class="flex gap-2 overflow-x-auto md:flex-col">
          <button
            v-for="agent in ai.agents.value"
            :key="agent.id"
            type="button"
            class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors md:w-full"
            :class="
              ai.currentAgentId.value === agent.id
                ? 'bg-btn-regular-bg font-medium text-primary-readable'
                : 'text-text-muted hover:bg-btn-plain-bg-hover'
            "
            :aria-current="
              ai.currentAgentId.value === agent.id ? 'true' : undefined
            "
            @click="ai.selectAgent(agent.id)"
          >
            <Icon
              icon="tabler:robot"
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            <span class="truncate">{{ agent.name }}</span>
          </button>
        </div>
      </aside>
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <template v-if="ai.currentAgent.value">
          <div
            class="flex items-center justify-between gap-3 border-b border-surface-3 px-4 py-3 sm:px-5"
          >
            <div class="min-w-0">
              <h2 class="truncate text-sm font-semibold text-deep-text">
                {{ ai.currentAgent.value.name }}
              </h2>
              <p class="text-xs text-text-muted">
                {{ ai.currentAgent.value.model }}
              </p>
            </div>
            <button
              type="button"
              :disabled="
                ai.messages.value.length === 0 || ai.isGenerating.value
              "
              class="shrink-0 rounded-lg px-2 py-1.5 text-xs text-text-muted hover:bg-btn-plain-bg-hover hover:text-deep-text disabled:opacity-40"
              @click="ai.clearConversation()"
            >
              {{ t("starhope.ai.clearConversation") }}
            </button>
          </div>
          <div
            ref="messagesEl"
            class="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
          >
            <div
              v-for="msg in ai.messages.value"
              :key="msg.id"
              class="flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%]"
                :class="
                  msg.role === 'user'
                    ? 'bg-primary-action text-white'
                    : 'bg-surface-3 text-deep-text'
                "
              >
                <div class="whitespace-pre-wrap">{{ msg.content }}</div>
              </div>
            </div>
            <div
              v-if="ai.isGenerating.value"
              role="status"
              class="w-fit rounded-2xl bg-surface-3 px-4 py-3 text-sm text-text-muted"
            >
              {{ t("common.loading") }}
            </div>
            <div
              v-if="ai.messages.value.length === 0 && !ai.isGenerating.value"
              class="flex h-full flex-col items-center justify-center text-center"
            >
              <span
                class="mb-4 flex size-14 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
                ><Icon
                  icon="tabler:message-circle"
                  class="size-7"
                  aria-hidden="true"
              /></span>
              <h3 class="text-sm font-semibold text-deep-text">
                {{ ai.currentAgent.value.name }}
              </h3>
              <p class="mt-1 text-sm text-text-muted">
                {{ t("starhope.ai.startHint") }}
              </p>
            </div>
          </div>
          <div class="border-t border-surface-3 bg-card-bg p-3 sm:p-4">
            <div class="flex items-end gap-2">
              <textarea
                v-model="inputText"
                rows="2"
                @keydown.enter.exact.prevent="onEnterKey"
                @compositionstart="composing = true"
                @compositionend="composing = false"
                class="min-w-0 flex-1 resize-none rounded-xl border border-surface-3 bg-page-bg px-3 py-2.5 text-sm text-deep-text outline-none focus:border-primary-action"
                :placeholder="t('starhope.ai.inputPlaceholder')"
                :aria-label="t('starhope.ai.inputPlaceholder')"
                :disabled="ai.isGenerating.value"
              ></textarea>
              <button
                type="button"
                @click="handleSend"
                :aria-label="t('starhope.ai.send')"
                :disabled="!inputText.trim() || ai.isGenerating.value"
                class="btn-primary flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
              >
                <Icon
                  icon="tabler:send"
                  class="size-4"
                  aria-hidden="true"
                /><span class="hidden sm:inline">{{
                  t("starhope.ai.send")
                }}</span>
              </button>
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex flex-1 items-center justify-center p-6 text-center text-sm text-text-muted"
        >
          {{ t("starhope.ai.selectHint") }}
        </div>
      </div>
    </div>
  </div>
</template>
