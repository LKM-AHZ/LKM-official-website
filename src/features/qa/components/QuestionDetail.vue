<script setup lang="ts">
// QA 问题详情（client island）—— 从后端 /api/v1/qa 拉详情并渲染问题与回答。
import { onMounted, ref } from "vue";
import { Icon } from "astro-icon/components";
import { t } from "~/lib/i18n";
import { qaApi, type QuestionDetail } from "~/lib/api/modules/qa";
import { buildUrl } from "~/lib/utils/paths";

const props = defineProps<{ questionId: string }>();

const loading = ref(true);
const question = ref<QuestionDetail | null>(null);

onMounted(async () => {
  const id = Number(props.questionId);
  if (!Number.isFinite(id)) {
    loading.value = false;
    return;
  }
  question.value = await qaApi.getQuestion(id);
  loading.value = false;
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div v-if="loading" class="text-sm text-text-muted py-8 text-center">
      {{ t("common.loading") }}
    </div>
    <div v-else-if="!question" class="text-sm text-text-muted py-8 text-center">
      <a class="text-primary underline" :href="buildUrl('/qa')">{{
        t("page.qa.title")
      }}</a>
    </div>
    <template v-else>
      <!-- 问题 -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium"
            :class="
              question.status !== 'open'
                ? 'bg-green-100 dark:bg-green-950/30 text-green-500'
                : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-500'
            "
          >
            {{
              question.status !== "open"
                ? t("page.qa.resolved")
                : t("page.qa.unresolved")
            }}
          </span>
          <span
            v-if="question.bountyTotal > 0"
            class="text-xs text-amber-500 font-medium"
          >
            {{ t("page.qa.bounty", { count: question.bountyTotal }) }}
          </span>
        </div>
        <h1 class="text-2xl font-bold text-deep-text">{{ question.title }}</h1>
        <div class="flex items-center gap-2 mt-2 text-sm text-text-muted/60">
          <span>{{ question.authorName }}</span>
          <span>·</span>
          <span>{{ formatDate(question.createdAt) }}</span>
          <span>·</span>
          <span>{{
            t("page.qa.answers", { count: question.answerCount })
          }}</span>
        </div>
        <div
          class="mt-4 p-4 bg-card-bg border border-surface-3 rounded-xl text-sm text-deep-text leading-relaxed whitespace-pre-wrap"
        >
          {{ question.situation }}
        </div>
        <div
          v-if="question.content"
          class="mt-2 p-4 bg-card-bg border border-surface-3 rounded-xl text-sm text-deep-text leading-relaxed whitespace-pre-wrap"
        >
          {{ question.content }}
        </div>
      </div>

      <!-- 回答列表 -->
      <div>
        <h3 class="font-semibold text-deep-text mb-4">
          {{ t("page.qa.answers", { count: question.answers.length }) }}
        </h3>
        <div class="space-y-4">
          <div
            v-for="a in question.answers"
            :key="a.id"
            class="bg-card-bg border rounded-xl p-4"
            :class="
              a.isAccepted
                ? 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/10'
                : 'border-surface-3'
            "
          >
            <div
              v-if="a.isAccepted"
              class="text-xs text-green-500 font-medium mb-2 inline-flex items-center gap-1"
            >
              <Icon name="material-symbols:check-circle" class="w-3.5 h-3.5" />
              {{ t("page.qa.accepted") }}
            </div>
            <div
              class="text-sm text-deep-text leading-relaxed whitespace-pre-wrap"
            >
              {{ a.content }}
            </div>
            <div
              class="flex items-center gap-3 mt-3 text-xs text-text-muted/60"
            >
              <span>{{ a.authorId }}</span>
              <span>{{ formatDate(a.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
