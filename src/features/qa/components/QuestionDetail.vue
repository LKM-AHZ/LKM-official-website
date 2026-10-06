<script setup lang="ts">
// QA 问题详情（client island）—— 从后端 /api/v1/content/qa 拉详情并渲染问题与回答。
import { computed, onMounted, onUnmounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import { qaApi, type QuestionDetail } from "~/lib/api/modules/qa";
import { buildUrl } from "~/lib/utils/paths";
import { useAuthStore } from "~/stores/auth";

const props = defineProps<{ questionId: string }>();

const loading = ref(true);
const question = ref<QuestionDetail | null>(null);
const answerText = ref("");
const busy = ref(false);
const error = ref("");
const nowTick = ref(Date.now());
let clockTimer: ReturnType<typeof setInterval> | null = null;
const auth = useAuthStore();
const isAsker = computed(
  () => !!question.value && auth.user?.id === question.value.authorId,
);
const canInteract = computed(
  () =>
    question.value?.status === "open" &&
    (!question.value.bountyExpiresAt ||
      new Date(question.value.bountyExpiresAt).getTime() > nowTick.value),
);

onMounted(async () => {
  auth.restoreFromStorage();
  clockTimer = setInterval(() => {
    nowTick.value = Date.now();
  }, 60_000);
  await reload();
  loading.value = false;
});
onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});

async function reload(): Promise<void> {
  question.value = await qaApi.getQuestion(props.questionId);
}

async function submitAnswer(): Promise<void> {
  if (!answerText.value.trim() || busy.value || isAsker.value) return;
  busy.value = true;
  error.value = "";
  try {
    const answer = await qaApi.createAnswer(
      props.questionId,
      answerText.value.trim(),
    );
    if (!answer) throw new Error("submit failed");
    answerText.value = "";
    await reload();
  } catch {
    error.value = t("page.qa.actionFailed");
  } finally {
    busy.value = false;
  }
}

async function acceptAnswer(answerId: string): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    if (!(await qaApi.acceptAnswer(props.questionId, answerId)))
      throw new Error("accept failed");
    await reload();
  } catch {
    error.value = t("page.qa.actionFailed");
  } finally {
    busy.value = false;
  }
}

async function closeQuestion(): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    if (!(await qaApi.closeQuestion(props.questionId)))
      throw new Error("close failed");
    await reload();
  } catch {
    error.value = t("page.qa.actionFailed");
  } finally {
    busy.value = false;
  }
}

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
  <div class="mx-auto max-w-4xl space-y-6">
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
        <header class="page-intro">
          <div class="page-intro-copy">
            <div class="flex items-center gap-2 mb-2">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="
                  question.status === 'accepted'
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-500'
                    : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-500'
                "
              >
                {{
                  question.status === "accepted"
                    ? t("page.qa.resolved")
                    : canInteract
                      ? t("page.qa.unresolved")
                      : t("page.qa.closed")
                }}
              </span>
              <span
                v-if="question.bountyTotal > 0"
                class="text-xs text-amber-500 font-medium"
              >
                {{ t("page.qa.bounty", { count: question.bountyTotal }) }}
              </span>
              <span
                v-if="question.status === 'open' && question.urgent"
                class="text-xs text-red-500 font-medium"
              >
                {{ t("page.qa.urgentBadge") }}
              </span>
            </div>
            <h1 class="text-2xl font-bold text-deep-text">
              {{ question.title }}
            </h1>
            <div
              class="flex flex-wrap items-center gap-2 mt-3 text-sm text-text-muted"
            >
              <span>{{ question.authorName }}</span>
              <span>·</span>
              <span>{{ formatDate(question.createdAt) }}</span>
              <span>·</span>
              <span>{{
                t("page.qa.answers", { count: question.answers.length })
              }}</span>
            </div>
          </div>
        </header>
        <div
          class="mt-5 p-5 bg-card-bg border border-surface-3 rounded-[18px] text-sm text-deep-text leading-7 whitespace-pre-wrap"
        >
          {{ question.situation }}
        </div>
        <div
          v-if="question.content"
          class="mt-3 p-5 bg-card-bg border border-surface-3 rounded-[18px] text-sm text-deep-text leading-7 whitespace-pre-wrap"
        >
          {{ question.content }}
        </div>
        <div
          v-if="question.images.length"
          class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <img
            v-for="url in question.images"
            :key="url"
            :src="url"
            :alt="t('page.qa.imageAlt')"
            class="w-full rounded-lg border border-surface-3 object-cover"
          />
        </div>
        <p v-if="question.bountyExpiresAt" class="mt-3 text-sm text-text-muted">
          {{
            t("page.qa.expiresAt", {
              date: formatDate(question.bountyExpiresAt),
            })
          }}
        </p>
        <button
          v-if="isAsker && question.status === 'open'"
          class="btn btn-ghost mt-4"
          :disabled="busy"
          @click="closeQuestion"
        >
          {{ t("page.qa.closeQuestion") }}
        </button>
      </div>

      <!-- 回答列表 -->
      <div id="answers">
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
              <Icon icon="material-symbols:check-circle" class="w-3.5 h-3.5" />
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
              <span>{{
                a.authorName || t("page.communityDetail.forum.anonymousUser")
              }}</span>
              <span>{{ formatDate(a.createdAt) }}</span>
            </div>
            <button
              v-if="
                isAsker &&
                canInteract &&
                !a.isAccepted &&
                a.authorId !== question.authorId &&
                question.answers.filter((item) => item.isAccepted).length <
                  question.bountyPeople
              "
              class="btn btn-ghost mt-3"
              :disabled="busy"
              @click="acceptAnswer(a.id)"
            >
              {{ t("page.qa.acceptAnswer") }}
            </button>
          </div>
        </div>
        <div v-if="canInteract && auth.user && !isAsker" class="mt-5 space-y-2">
          <textarea
            v-model="answerText"
            rows="4"
            class="qa-input w-full"
            :placeholder="t('page.qa.answerPlaceholder')"
          ></textarea>
          <button
            class="btn btn-primary"
            :disabled="busy || !answerText.trim()"
            @click="submitAnswer"
          >
            {{ t("page.qa.submitAnswer") }}
          </button>
        </div>
        <p v-if="error" class="text-sm text-error" role="alert">{{ error }}</p>
      </div>
    </template>
  </div>
</template>
