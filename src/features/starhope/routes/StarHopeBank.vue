<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuestionBankStore } from "../stores/question-bank";
import { t } from "~/lib/i18n";
import StarHopePage from "../components/StarHopePage.vue";
import StarHopeEmptyState from "../components/StarHopeEmptyState.vue";
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
  <StarHopePage :title="t('starhope.bank.title')" icon="tabler:books">
    <StarHopeEmptyState
      icon="tabler:books"
      :message="
        loading
          ? t('common.loading')
          : bank.questions.value.length === 0
            ? t('primitives.empty')
            : t('starhope.bank.summary', {
                questions: bank.questions.value.length,
                folders: bank.folders.value.length,
              })
      "
    />
  </StarHopePage>
</template>
