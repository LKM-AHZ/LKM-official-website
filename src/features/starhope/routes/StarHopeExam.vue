<script setup lang="ts">
import { onMounted } from "vue";
import { useQuestionBankStore } from "../stores/question-bank";
import { t } from "~/lib/i18n";
import StarHopePage from "../components/StarHopePage.vue";
import StarHopeEmptyState from "../components/StarHopeEmptyState.vue";
const bank = useQuestionBankStore();
onMounted(async () => {
  await bank.loadQuestions();
});
</script>

<template>
  <StarHopePage :title="t('starhope.exam.title')" icon="tabler:clipboard-list">
    <StarHopeEmptyState
      icon="tabler:clipboard-list"
      :message="
        t('starhope.exam.summary', { count: bank.questions.value.length })
      "
    />
  </StarHopePage>
</template>
