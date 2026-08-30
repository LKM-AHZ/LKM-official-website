<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex gap-2 border-b border-surface-3 flex-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="px-4 py-3 text-sm font-medium transition-colors relative"
          :class="
            activeTab === tab.key
              ? 'text-primary'
              : 'text-text-muted hover:text-deep-text'
          "
          @click="activeTab = tab.key"
        >
          {{ t(tab.label) }}
          <div
            v-if="activeTab === tab.key"
            class="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
          ></div>
        </button>
      </div>
      <button
        class="btn-primary px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
        @click="askModalOpen = true"
      >
        {{ t("page.qa.ask") }}
      </button>
    </div>

    <div v-if="loading" class="text-sm text-text-muted py-8 text-center">
      {{ t("common.loading") }}
    </div>
    <div v-else class="space-y-3">
      <a
        v-for="q in questions"
        :key="q.id"
        :href="buildUrl(`/qa/${q.id}`)"
        class="profile-card group block"
      >
        <div class="profile-inner p-4 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span
              class="text-xs px-1.5 py-0.5 rounded-full font-medium"
              :class="
                q.status !== 'open'
                  ? 'bg-green-100 dark:bg-green-950/30 text-green-500'
                  : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-500'
              "
            >
              {{
                q.status !== "open"
                  ? t("page.qa.resolved")
                  : t("page.qa.unresolved")
              }}
            </span>
            <span
              v-if="q.bountyTotal > 0"
              class="text-xs text-amber-500 font-medium"
            >
              {{ t("page.qa.bounty", { count: q.bountyTotal }) }}
            </span>
          </div>
          <h3
            class="font-semibold text-deep-text group-hover:text-primary transition-colors line-clamp-1"
          >
            {{ q.title }}
          </h3>
          <div
            class="flex items-center justify-between text-xs text-text-muted/60"
          >
            <span
              >{{ q.authorName }} ·
              {{ mounted ? formatTime(q.createdAt) : "" }}</span
            >
            <span>
              {{ t("page.qa.answers", { count: q.answerCount }) }}
            </span>
          </div>
        </div>
      </a>
      <div
        v-if="!questions.length"
        class="text-sm text-text-muted py-6 text-center"
      >
        {{ t("page.qa.empty") }}
      </div>
    </div>

    <AskQuestionModal
      v-model:show="askModalOpen"
      :category="activeTab"
      @published="load"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { t } from "~/lib/i18n";
import { qaApi, type QuestionSummary } from "~/lib/api/modules/qa";
import { buildUrl } from "~/lib/utils/paths";
import AskQuestionModal from "./AskQuestionModal.vue";

// SSR 与客户端水合时 `new Date()`（相对时间计算）结果可能跨天边界导致
// hydration mismatch。mounted 前渲染空时间，onMounted 后再显示真实相对时间。
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const activeTab = ref<"help" | "volunteer">("help");
const askModalOpen = ref(false);
const loading = ref(true);
const questions = ref<QuestionSummary[]>([]);
const tabs = [
  { key: "help" as const, label: "page.qa.tabHelp" },
  { key: "volunteer" as const, label: "page.qa.tabVolunteer" },
];

async function load() {
  loading.value = true;
  questions.value = await qaApi.listQuestions(activeTab.value, 1, 50);
  loading.value = false;
}

onMounted(load);
watch(activeTab, load);

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return t("common.today");
  if (days === 1) return t("page.qa.yesterday");
  if (days < 7) return t("page.qa.daysAgo", { count: days });
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
</script>
