<template>
  <div class="space-y-4">
    <!-- 练习模式 + 错题本 -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1 rounded-xl border border-surface-3 bg-card-bg p-3">
        <p class="text-xs text-text-muted mb-2">
          {{ t("community.competition.practiceMode") }}
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="mode in modes"
            :key="mode.value"
            class="rounded-lg border px-2 py-2 text-xs font-medium transition-colors"
            :class="
              practiceMode === mode.value
                ? 'border-primary bg-[var(--btn-regular-bg)] text-primary'
                : 'border-surface-3 text-text-muted hover:border-primary/40'
            "
            @click="practiceMode = mode.value"
          >
            {{ t(mode.label) }}
          </button>
        </div>
      </div>
      <!-- 错题本入口 -->
      <a
        href="#wrong-book"
        class="sm:w-52 rounded-xl border border-surface-3 bg-card-bg p-3 flex items-center gap-3"
      >
        <span class="text-2xl">📕</span>
        <div>
          <p class="text-sm font-semibold text-deep-text">
            {{ t("community.competition.myWrongBook") }}
          </p>
          <p class="text-xs text-text-muted">
            {{ t("community.competition.wrongCount", { count: wrongCount }) }}
          </p>
        </div>
      </a>
    </div>

    <div class="flex flex-col md:flex-row gap-4">
      <!-- 学科分类侧边栏 -->
      <aside class="md:w-44 shrink-0">
        <div class="rounded-xl border border-surface-3 bg-card-bg p-2">
          <button
            v-for="c in QUESTION_CATEGORIES"
            :key="c"
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
            :class="
              activeSubject === c
                ? 'bg-[var(--btn-regular-bg)] text-primary font-medium'
                : 'text-text-muted hover:bg-[var(--btn-card-bg-hover)]'
            "
            @click="activeSubject = c"
          >
            {{ c }}
          </button>
        </div>
        <!-- 难度筛选 -->
        <div class="mt-3 rounded-xl border border-surface-3 bg-card-bg p-3">
          <p class="text-xs text-text-muted mb-2">
            {{ t("community.competition.allDifficulties") }}
          </p>
          <div class="space-y-1">
            <button
              v-for="d in difficulties"
              :key="d.value"
              class="w-full text-left px-2 py-1 rounded text-xs transition-colors"
              :class="
                activeDifficulty === d.value
                  ? 'bg-[var(--btn-regular-bg)] text-primary'
                  : 'text-text-muted hover:bg-[var(--btn-card-bg-hover)]'
              "
              @click="activeDifficulty = d.value"
            >
              {{ t(d.label) }}
            </button>
          </div>
        </div>
      </aside>

      <!-- 题目列表 -->
      <div class="flex-1 min-w-0">
        <p
          v-if="filteredQuestions.length === 0"
          class="text-center py-12 text-sm text-text-muted"
        >
          {{ t("community.competition.noQuestions") }}
        </p>
        <div v-else class="space-y-3">
          <div
            v-for="q in filteredQuestions"
            :key="q.id"
            class="bg-card-bg border border-surface-3 rounded-xl p-4"
          >
            <div class="flex items-start gap-2">
              <span
                class="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                :class="typeBadgeClass(q.type)"
                >{{ typeLabel(q.type) }}</span
              >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-deep-text leading-6">
                  {{ t(q.stem) }}
                </p>
                <!-- 标签 -->
                <div class="mt-1.5 flex flex-wrap gap-1">
                  <span
                    v-for="tag in q.tags"
                    :key="tag"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-muted"
                    >{{ tag }}</span
                  >
                </div>
              </div>
            </div>
            <!-- 难度星级 + 正确率 + 解析开关 -->
            <div class="mt-2.5 flex items-center justify-between gap-2">
              <div class="flex items-center gap-3 text-xs text-text-muted">
                <span class="text-warning">{{ stars(q.difficulty) }}</span>
                <span>{{ t("community.competition.accuracy") }} {{ q.accuracy }}%</span>
              </div>
              <button
                class="text-xs text-primary hover:underline"
                @click="toggle(q.id)"
              >
                {{
                  revealed.has(q.id)
                    ? t("community.competition.hideAnalysis")
                    : t("community.competition.viewAnalysis")
                }}
              </button>
            </div>
            <div v-if="revealed.has(q.id)" class="mt-2 text-xs text-text-muted/80 leading-5">
              {{ t("community.competition.answer") }}
              {{ answerText(q) }}
              <span class="mx-2">|</span>
              {{ t("community.competition.explanation") }}{{ t(q.explanation) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  mockQuestions,
  QUESTION_CATEGORIES,
  type MockQuestion,
  type QuestionType,
} from "../data/mock-competitions";
import { t } from "~/lib/i18n";

const modes = [
  { value: "sequence", label: "community.competition.modeSequence" },
  { value: "random", label: "community.competition.modeRandom" },
  { value: "timed", label: "community.competition.modeTimed" },
];

const difficulties = [
  { value: 0, label: "community.competition.allDifficulties" },
  { value: 1, label: "community.competition.difficultyEasy" },
  { value: 2, label: "community.competition.difficultyMedium" },
  { value: 3, label: "community.competition.difficultyHard" },
];

const practiceMode = ref("sequence");
const activeSubject = ref("全部");
const activeDifficulty = ref(0);
const revealed = ref<Set<string>>(new Set());
// 静态示例错题数
const wrongCount = ref(5);

const filteredQuestions = computed(() => {
  let qs = [...mockQuestions];
  if (activeSubject.value !== "全部")
    qs = qs.filter((q) => q.subject === activeSubject.value);
  if (activeDifficulty.value !== 0)
    qs = qs.filter((q) => q.difficulty === activeDifficulty.value);
  return qs;
});

function toggle(id: string) {
  const next = new Set(revealed.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  revealed.value = next;
}

function stars(n: number): string {
  return "★".repeat(Math.max(1, Math.min(3, n)));
}

function typeLabel(type: QuestionType): string {
  if (type === "multiple") return t("community.competition.multipleChoice");
  if (type === "true_false") return t("community.competition.trueFalse");
  if (type === "fill") return t("community.competition.fillBlank");
  return t("community.competition.singleChoice");
}

function typeBadgeClass(type: QuestionType): string {
  if (type === "multiple") return "bg-[var(--warning)] text-[var(--on-warning)]";
  if (type === "fill") return "bg-[var(--info)] text-[var(--on-info)]";
  if (type === "true_false") return "bg-[var(--surface-3)] text-text-muted";
  return "bg-[var(--btn-regular-bg)] text-primary";
}

function answerText(q: MockQuestion): string {
  if (Array.isArray(q.answer))
    return q.answer.map((i: number) => "ABCD"[i]).join(", ");
  if (typeof q.answer === "string") return q.answer;
  return "ABCD"[q.answer as number];
}
</script>
