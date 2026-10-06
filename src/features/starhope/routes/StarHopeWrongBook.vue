<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePracticeStore } from "../stores/practice";
import type { Question } from "~/features/starhope/types";
import { t } from "~/lib/i18n";
import StarHopePage from "../components/StarHopePage.vue";
import StarHopeEmptyState from "../components/StarHopeEmptyState.vue";
const practice = usePracticeStore();
const wrongQuestions = ref<Question[]>([]);
// 初值同样是 []：不区分「正在读 IndexedDB」与「真的一道错题都没有」，
// 加载期间会先闪一次空态卡片（与 StarHopeBank 的 loading 分支一致）
const loading = ref(true);
const loadFailed = ref(false);
onMounted(async () => {
  // IndexedDB 读取失败时（隐私模式/配额/被占用）不能让 promise 悬空，
  // 否则整个页面只剩未处理的 rejection 且永远停在全空态
  try {
    wrongQuestions.value = await practice.loadWrongQuestions();
  } catch (e) {
    loadFailed.value = true;
    console.error("[starhope] 加载错题失败", e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <StarHopePage :title="t('starhope.wrongBook.title')" icon="tabler:bookmarks">
    <StarHopeEmptyState
      v-if="loading"
      icon="tabler:bookmarks"
      :message="t('common.loading')"
    />
    <StarHopeEmptyState
      v-else-if="loadFailed"
      icon="tabler:alert-circle"
      :message="t('messages.operationFailed')"
    />
    <StarHopeEmptyState
      v-else-if="wrongQuestions.length === 0"
      icon="tabler:bookmarks"
      :message="t('starhope.wrongBook.empty')"
    />
    <div v-else class="card-base divide-y divide-surface-3">
      <div
        v-for="q in wrongQuestions"
        :key="q.id"
        class="px-5 py-4 text-sm leading-6 text-deep-text"
      >
        {{ q.content }}
      </div>
    </div>
  </StarHopePage>
</template>
