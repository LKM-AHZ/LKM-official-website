<script setup lang="ts">
import { onMounted } from "vue";
import { useQuestionBankStore } from "../stores/question-bank";
import { t } from "~/lib/i18n";
import StarHopePage from "../components/StarHopePage.vue";
import StarHopeEmptyState from "../components/StarHopeEmptyState.vue";

// 本页目前只是「题库数量」占位页：练习作答 UI 尚未实现，
// 原先的 _start()/_nav 从未被引用（死接线），故移除；
// 等实现练习流程时再接回 usePracticeStore().startPractice。
const bank = useQuestionBankStore();

onMounted(async () => {
  await bank.loadQuestions();
});
</script>

<template>
  <StarHopePage :title="t('starhope.practice.title')" icon="tabler:pencil">
    <StarHopeEmptyState
      icon="tabler:pencil"
      :message="
        t('starhope.practice.summary', { count: bank.questions.value.length })
      "
    />
  </StarHopePage>
</template>
