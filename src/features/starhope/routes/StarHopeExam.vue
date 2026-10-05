<script setup lang="ts">
import { onMounted } from "vue";
import { useQuestionBankStore } from "../stores/question-bank";
import { t } from "~/lib/i18n";
const bank = useQuestionBankStore();
onMounted(async () => {
  await bank.loadQuestions();
});
</script>

<template>
  <div class="site-content-frame">
    <h1 class="text-2xl font-bold text-deep-text mb-6">
      {{ t("starhope.exam.title") }}
    </h1>
    <div class="card-base p-6 text-center text-text-muted">
      <div class="text-5xl mb-4">📝</div>
      <p>
        {{ t("starhope.exam.summary", { count: bank.questions.value.length }) }}
      </p>
    </div>
  </div>
</template>
