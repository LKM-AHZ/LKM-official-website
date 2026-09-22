<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePracticeStore } from "../stores/practice";
import type { Question } from "~/features/starhope/types";
import { t } from "~/lib/i18n";
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
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-deep-text mb-6">
      {{ t("starhope.wrongBook.title") }}
    </h1>
    <p v-if="loading" class="card-base p-8 text-center text-text-muted">
      {{ t("common.loading") }}
    </p>
    <div
      v-else-if="loadFailed"
      class="card-base p-8 text-center text-text-muted"
    >
      {{ t("messages.operationFailed") }}
    </div>
    <div
      v-else-if="wrongQuestions.length === 0"
      class="card-base p-8 text-center text-text-muted"
    >
      <div class="text-5xl mb-4">📕</div>
      <p>{{ t("starhope.wrongBook.empty") }}</p>
    </div>
    <div v-else class="card-base p-4">
      <div
        v-for="q in wrongQuestions"
        :key="q.id"
        class="p-3 border-b border-surface-3 text-sm"
      >
        {{ q.content }}
      </div>
    </div>
  </div>
</template>
