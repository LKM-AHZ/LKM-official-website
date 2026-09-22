<script setup lang="ts">
import { onMounted } from "vue";
import { useQuestionBankStore } from "../stores/question-bank";
import { t } from "~/lib/i18n";

// 本页目前只是「题库数量」占位页：练习作答 UI 尚未实现，
// 原先的 _start()/_nav 从未被引用（死接线），故移除；
// 等实现练习流程时再接回 usePracticeStore().startPractice。
const bank = useQuestionBankStore();

onMounted(async () => {
  await bank.loadQuestions();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-deep-text mb-6">
      {{ t("starhope.practice.title") }}
    </h1>
    <div class="card-base p-6 text-center text-text-muted">
      <div class="text-5xl mb-4">✏️</div>
      <p>
        {{
          t("starhope.practice.summary", { count: bank.questions.value.length })
        }}
      </p>
    </div>
  </div>
</template>
