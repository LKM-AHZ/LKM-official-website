<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuestionBankStore } from "../stores/question-bank";
import { t } from "~/lib/i18n";
const bank = useQuestionBankStore();

// 数据来自本地 IndexedDB，首帧计数必然是 0：没有 loading/empty 分支的话，
// 「还在读」和「真的一道题都没有」都会显示成 0，看起来像数据丢了
const loading = ref(true);

onMounted(async () => {
  try {
    await bank.loadQuestions();
    await bank.loadFolders();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-deep-text mb-6">
      {{ t("starhope.bank.title") }}
    </h1>
    <div class="card-base p-6 text-center text-text-muted">
      <div class="text-5xl mb-4">📚</div>
      <p v-if="loading">{{ t("common.loading") }}</p>
      <p v-else-if="bank.questions.value.length === 0">
        {{ t("primitives.empty") }}
      </p>
      <p v-else>
        {{
          t("starhope.bank.summary", {
            questions: bank.questions.value.length,
            folders: bank.folders.value.length,
          })
        }}
      </p>
    </div>
  </div>
</template>
