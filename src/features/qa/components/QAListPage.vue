<template>
  <div class="space-y-6">
    <div
      class="flex flex-col gap-3 border-b border-surface-3 pb-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div
        class="flex gap-1 rounded-full bg-btn-plain-bg-hover p-1"
        role="group"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
          :class="
            activeTab === tab.key
              ? 'bg-card-bg text-primary-readable shadow-sm'
              : 'text-text-muted hover:text-deep-text'
          "
          :aria-pressed="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ t(tab.label) }}
        </button>
      </div>
      <button
        class="btn-primary rounded-full px-4 py-2 text-sm font-semibold shrink-0 self-start"
        @click="askModalOpen = true"
      >
        {{ t("page.qa.ask") }}
      </button>
    </div>

    <div class="flex justify-end">
      <select
        v-model="sortBy"
        class="rounded-lg border border-surface-3 bg-card-bg px-3 py-2 text-sm text-deep-text"
      >
        <option value="newest">{{ t("page.qa.sortNewest") }}</option>
        <option value="bounty">{{ t("page.qa.sortBounty") }}</option>
      </select>
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
                q.status === 'accepted'
                  ? 'bg-green-100 dark:bg-green-950/30 text-green-500'
                  : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-500'
              "
            >
              {{
                q.status === "accepted"
                  ? t("page.qa.resolved")
                  : q.status === "closed"
                    ? t("page.qa.closed")
                    : t("page.qa.unresolved")
              }}
            </span>
            <span
              v-if="q.status === 'open' && q.urgent"
              class="text-xs font-medium text-red-500"
            >
              {{ t("page.qa.urgentBadge") }}
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
            class="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted"
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
      <button
        v-if="hasMore"
        class="btn btn-ghost mx-auto block"
        @click="loadMore"
      >
        {{ t("page.qa.loadMore") }}
      </button>
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
import { qaApi, type QaSort, type QuestionSummary } from "~/lib/api/modules/qa";
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
const sortBy = ref<QaSort>("newest");
const page = ref(1);
const hasMore = ref(false);
let requestToken = 0;
const tabs = [
  { key: "help" as const, label: "page.qa.tabHelp" },
  { key: "volunteer" as const, label: "page.qa.tabVolunteer" },
];

const PAGE_SIZE = 50;

async function load() {
  const token = ++requestToken;
  loading.value = true;
  const rows = await qaApi.listQuestions(
    activeTab.value,
    1,
    PAGE_SIZE,
    sortBy.value,
  );
  if (token !== requestToken) return;
  questions.value = rows;
  page.value = 1;
  hasMore.value = rows.length === PAGE_SIZE;
  loading.value = false;
}

async function loadMore() {
  const token = requestToken;
  const next = page.value + 1;
  const rows = await qaApi.listQuestions(
    activeTab.value,
    next,
    PAGE_SIZE,
    sortBy.value,
  );
  if (token !== requestToken) return;
  questions.value.push(...rows);
  page.value = next;
  hasMore.value = rows.length === PAGE_SIZE;
}

onMounted(load);
watch(activeTab, load);
watch(sortBy, load);

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
