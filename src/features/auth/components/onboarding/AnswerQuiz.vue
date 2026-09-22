<template>
  <div class="space-y-6">
    <div class="text-center">
      <h3 class="text-xl font-semibold text-deep-text">
        {{ t("onboarding.quiz.title") }}
      </h3>
      <p class="text-sm text-text-muted mt-1">
        {{ t("onboarding.quiz.subtitle") }}
      </p>
    </div>

    <!-- 选择领域 -->
    <div v-if="!quizStarted">
      <label
        class="block text-sm font-medium text-deep-text mb-3 text-center"
        >{{ t("onboarding.quiz.chooseField") }}</label
      >
      <div class="flex flex-wrap justify-center gap-2">
        <button
          v-for="f in quizFields"
          :key="f.value"
          type="button"
          class="px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors"
          :class="
            selectedField === f.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-surface-3 bg-card-bg text-text-muted hover:border-primary/40'
          "
          @click="selectedField = f.value"
        >
          {{ t(f.labelKey) }}
        </button>
      </div>
      <div class="text-center mt-4">
        <button
          type="button"
          class="btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
          :disabled="!selectedField"
          :class="!selectedField ? 'opacity-50 cursor-not-allowed' : ''"
          @click="startQuiz"
        >
          {{ t("onboarding.quiz.start", { count: fieldPoolSize }) }}
        </button>
      </div>
    </div>

    <!-- 答题中 -->
    <div v-else-if="!quizFinished">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-text-muted">{{
          t("onboarding.quiz.progress", {
            current: currentIndex + 1,
            total: questions.length,
          })
        }}</span>
        <div class="flex gap-1">
          <span
            v-for="(_, i) in questions"
            :key="i"
            class="w-2 h-2 rounded-full"
            :class="
              answers[i] === undefined
                ? 'bg-surface-3'
                : answers[i] === questions[i].answer
                  ? 'bg-green-500'
                  : 'bg-red-500'
            "
          ></span>
        </div>
      </div>

      <div class="bg-card-bg border border-surface-3 rounded-xl p-6">
        <p class="text-deep-text font-medium mb-4">
          {{ t(questions[currentIndex].stem) }}
        </p>
        <div class="space-y-2">
          <button
            v-for="(opt, i) in questions[currentIndex].options"
            :key="i"
            type="button"
            class="w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors"
            :class="
              answers[currentIndex] === i
                ? i === questions[currentIndex].answer
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                  : 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                : 'border-surface-3 bg-card-bg text-deep-text hover:border-primary/40'
            "
            :disabled="answers[currentIndex] !== undefined"
            @click="answer(i)"
          >
            <span class="font-mono text-text-muted mr-2">{{ "ABCD"[i] }}.</span>
            {{ t(opt) }}
          </button>
        </div>
      </div>

      <div class="flex justify-between mt-4">
        <button
          type="button"
          class="btn-ghost text-sm"
          :disabled="currentIndex === 0"
          @click="currentIndex--"
        >
          {{ t("onboarding.quiz.prev") }}
        </button>
        <button
          v-if="
            currentIndex < questions.length - 1 &&
            answers[currentIndex] !== undefined
          "
          type="button"
          class="btn-primary px-4 py-2 rounded-lg text-sm"
          @click="currentIndex++"
        >
          {{ t("onboarding.quiz.next") }}
        </button>
        <button
          v-if="allAnswered"
          type="button"
          class="btn-primary px-4 py-2 rounded-lg text-sm"
          @click="finishQuiz"
        >
          {{ t("onboarding.submit") }}
        </button>
      </div>
    </div>

    <!-- 答完结果 -->
    <div v-else class="text-center space-y-4">
      <div
        class="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
        :class="
          passed
            ? 'bg-green-100 dark:bg-green-950/30'
            : 'bg-red-100 dark:bg-red-950/30'
        "
      >
        <Icon
          :icon="
            passed
              ? 'material-symbols:check-circle-outline'
              : 'material-symbols:cancel-outline'
          "
          class="w-10 h-10"
          :class="passed ? 'text-green-500' : 'text-red-500'"
        />
      </div>
      <h3
        class="text-lg font-semibold"
        :class="
          passed
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        "
      >
        {{ passed ? t("onboarding.quiz.passed") : t("onboarding.quiz.failed") }}
      </h3>
      <p class="text-sm text-text-muted">
        {{
          t("onboarding.quiz.result", {
            correct: correctCount,
            total: questions.length,
            rate: Math.round((correctCount / questions.length) * 100),
          })
        }}
      </p>
      <p v-if="passed" class="text-sm text-primary font-medium">
        {{ t("onboarding.quiz.unlocked") }}
      </p>
      <p v-else class="text-sm text-text-muted">
        {{ t("onboarding.quiz.retryHint") }}
      </p>
      <button
        v-if="!passed"
        type="button"
        class="btn-ghost text-sm"
        @click="resetQuiz"
      >
        {{ t("onboarding.quiz.retry") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { t, type TranslationKey } from "~/lib/i18n";

interface QuizQuestion {
  id: string;
  field: string;
  stem: string;
  options: string[];
  answer: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "p1",
    field: "physics",
    stem: "onboarding.quizData.p1.stem",
    options: [
      "onboarding.quizData.p1.options.0",
      "onboarding.quizData.p1.options.1",
      "onboarding.quizData.p1.options.2",
      "onboarding.quizData.p1.options.3",
    ],
    answer: 2,
  },
  {
    id: "p2",
    field: "physics",
    stem: "onboarding.quizData.p2.stem",
    options: [
      "onboarding.quizData.p2.options.0",
      "onboarding.quizData.p2.options.1",
      "onboarding.quizData.p2.options.2",
      "onboarding.quizData.p2.options.3",
    ],
    answer: 1,
  },
  {
    id: "p3",
    field: "physics",
    stem: "onboarding.quizData.p3.stem",
    options: [
      "onboarding.quizData.p3.options.0",
      "onboarding.quizData.p3.options.1",
      "onboarding.quizData.p3.options.2",
      "onboarding.quizData.p3.options.3",
    ],
    answer: 2,
  },
  {
    id: "p4",
    field: "physics",
    stem: "onboarding.quizData.p4.stem",
    options: [
      "onboarding.quizData.p4.options.0",
      "onboarding.quizData.p4.options.1",
      "onboarding.quizData.p4.options.2",
      "onboarding.quizData.p4.options.3",
    ],
    answer: 3,
  },
  {
    id: "p5",
    field: "physics",
    stem: "onboarding.quizData.p5.stem",
    options: [
      "onboarding.quizData.p5.options.0",
      "onboarding.quizData.p5.options.1",
      "onboarding.quizData.p5.options.2",
      "onboarding.quizData.p5.options.3",
    ],
    answer: 1,
  },
  {
    id: "m1",
    field: "math",
    stem: "onboarding.quizData.m1.stem",
    options: [
      "onboarding.quizData.m1.options.0",
      "onboarding.quizData.m1.options.1",
      "onboarding.quizData.m1.options.2",
      "onboarding.quizData.m1.options.3",
    ],
    answer: 0,
  },
  {
    id: "m2",
    field: "math",
    stem: "onboarding.quizData.m2.stem",
    options: [
      "onboarding.quizData.m2.options.0",
      "onboarding.quizData.m2.options.1",
      "onboarding.quizData.m2.options.2",
      "onboarding.quizData.m2.options.3",
    ],
    answer: 3,
  },
  {
    id: "m3",
    field: "math",
    stem: "onboarding.quizData.m3.stem",
    options: [
      "onboarding.quizData.m3.options.0",
      "onboarding.quizData.m3.options.1",
      "onboarding.quizData.m3.options.2",
      "onboarding.quizData.m3.options.3",
    ],
    answer: 1,
  },
  {
    id: "m4",
    field: "math",
    stem: "onboarding.quizData.m4.stem",
    options: [
      "onboarding.quizData.m4.options.0",
      "onboarding.quizData.m4.options.1",
      "onboarding.quizData.m4.options.2",
      "onboarding.quizData.m4.options.3",
    ],
    answer: 1,
  },
  {
    id: "m5",
    field: "math",
    stem: "onboarding.quizData.m5.stem",
    options: [
      "onboarding.quizData.m5.options.0",
      "onboarding.quizData.m5.options.1",
      "onboarding.quizData.m5.options.2",
      "onboarding.quizData.m5.options.3",
    ],
    answer: 2,
  },
  {
    id: "c1",
    field: "chemistry",
    stem: "onboarding.quizData.c1.stem",
    options: [
      "onboarding.quizData.c1.options.0",
      "onboarding.quizData.c1.options.1",
      "onboarding.quizData.c1.options.2",
      "onboarding.quizData.c1.options.3",
    ],
    answer: 0,
  },
  {
    id: "c2",
    field: "chemistry",
    stem: "onboarding.quizData.c2.stem",
    options: [
      "onboarding.quizData.c2.options.0",
      "onboarding.quizData.c2.options.1",
      "onboarding.quizData.c2.options.2",
      "onboarding.quizData.c2.options.3",
    ],
    answer: 2,
  },
  {
    id: "c3",
    field: "chemistry",
    stem: "onboarding.quizData.c3.stem",
    options: [
      "onboarding.quizData.c3.options.0",
      "onboarding.quizData.c3.options.1",
      "onboarding.quizData.c3.options.2",
      "onboarding.quizData.c3.options.3",
    ],
    answer: 2,
  },
  {
    id: "c4",
    field: "chemistry",
    stem: "onboarding.quizData.c4.stem",
    options: [
      "onboarding.quizData.c4.options.0",
      "onboarding.quizData.c4.options.1",
      "onboarding.quizData.c4.options.2",
      "onboarding.quizData.c4.options.3",
    ],
    answer: 1,
  },
  {
    id: "c5",
    field: "chemistry",
    stem: "onboarding.quizData.c5.stem",
    options: [
      "onboarding.quizData.c5.options.0",
      "onboarding.quizData.c5.options.1",
      "onboarding.quizData.c5.options.2",
      "onboarding.quizData.c5.options.3",
    ],
    answer: 1,
  },
  {
    id: "b1",
    field: "biology",
    stem: "onboarding.quizData.b1.stem",
    options: [
      "onboarding.quizData.b1.options.0",
      "onboarding.quizData.b1.options.1",
      "onboarding.quizData.b1.options.2",
      "onboarding.quizData.b1.options.3",
    ],
    answer: 1,
  },
  {
    id: "b2",
    field: "biology",
    stem: "onboarding.quizData.b2.stem",
    options: [
      "onboarding.quizData.b2.options.0",
      "onboarding.quizData.b2.options.1",
      "onboarding.quizData.b2.options.2",
      "onboarding.quizData.b2.options.3",
    ],
    answer: 3,
  },
  {
    id: "b3",
    field: "biology",
    stem: "onboarding.quizData.b3.stem",
    options: [
      "onboarding.quizData.b3.options.0",
      "onboarding.quizData.b3.options.1",
      "onboarding.quizData.b3.options.2",
      "onboarding.quizData.b3.options.3",
    ],
    answer: 2,
  },
  {
    id: "b4",
    field: "biology",
    stem: "onboarding.quizData.b4.stem",
    options: [
      "onboarding.quizData.b4.options.0",
      "onboarding.quizData.b4.options.1",
      "onboarding.quizData.b4.options.2",
      "onboarding.quizData.b4.options.3",
    ],
    answer: 1,
  },
  {
    id: "b5",
    field: "biology",
    stem: "onboarding.quizData.b5.stem",
    options: [
      "onboarding.quizData.b5.options.0",
      "onboarding.quizData.b5.options.1",
      "onboarding.quizData.b5.options.2",
      "onboarding.quizData.b5.options.3",
    ],
    answer: 2,
  },
  {
    id: "cs1",
    field: "cs",
    stem: "onboarding.quizData.cs1.stem",
    options: [
      "onboarding.quizData.cs1.options.0",
      "onboarding.quizData.cs1.options.1",
      "onboarding.quizData.cs1.options.2",
      "onboarding.quizData.cs1.options.3",
    ],
    answer: 2,
  },
  {
    id: "cs2",
    field: "cs",
    stem: "onboarding.quizData.cs2.stem",
    options: [
      "onboarding.quizData.cs2.options.0",
      "onboarding.quizData.cs2.options.1",
      "onboarding.quizData.cs2.options.2",
      "onboarding.quizData.cs2.options.3",
    ],
    answer: 2,
  },
  {
    id: "cs3",
    field: "cs",
    stem: "onboarding.quizData.cs3.stem",
    options: [
      "onboarding.quizData.cs3.options.0",
      "onboarding.quizData.cs3.options.1",
      "onboarding.quizData.cs3.options.2",
      "onboarding.quizData.cs3.options.3",
    ],
    answer: 2,
  },
  {
    id: "cs4",
    field: "cs",
    stem: "onboarding.quizData.cs4.stem",
    options: [
      "onboarding.quizData.cs4.options.0",
      "onboarding.quizData.cs4.options.1",
      "onboarding.quizData.cs4.options.2",
      "onboarding.quizData.cs4.options.3",
    ],
    answer: 0,
  },
  {
    id: "cs5",
    field: "cs",
    stem: "onboarding.quizData.cs5.stem",
    options: [
      "onboarding.quizData.cs5.options.0",
      "onboarding.quizData.cs5.options.1",
      "onboarding.quizData.cs5.options.2",
      "onboarding.quizData.cs5.options.3",
    ],
    answer: 2,
  },
];

const quizFields = [
  { value: "physics", labelKey: "onboarding.tags.physics" as TranslationKey },
  { value: "math", labelKey: "onboarding.tags.math" as TranslationKey },
  {
    value: "chemistry",
    labelKey: "onboarding.tags.chemistry" as TranslationKey,
  },
  { value: "biology", labelKey: "onboarding.tags.biology" as TranslationKey },
  { value: "cs", labelKey: "onboarding.tags.cs" as TranslationKey },
];

const selectedField = ref("");
const quizStarted = ref(false);
const quizFinished = ref(false);
const currentIndex = ref(0);
const answers = ref<(number | undefined)[]>([]);
const questions = ref<QuizQuestion[]>([]);

// 按钮上的题量取自「当前方向实际会抽到的题数」：questions 要点了开始才有值，
// 直接用 questions.length 永远显示 0
const fieldPoolSize = computed(() => {
  if (!selectedField.value) return 0;
  return Math.min(
    quizQuestions.filter((q) => q.field === selectedField.value).length,
    5,
  );
});

const allAnswered = computed(() => answers.value.every((a) => a !== undefined));
const correctCount = computed(() =>
  answers.value.reduce(
    (sum, a, i) => sum + (a === questions.value[i]?.answer ? 1 : 0),
    0,
  ),
);
// 未开始时 questions 为空：0/0 = NaN，而 NaN >= 0.6 为 false，
// getData() 会把 passed: NaN 一路序列化给后端。显式短路空题库。
const passed = computed(
  () =>
    questions.value.length > 0 &&
    correctCount.value / questions.value.length >= 0.6,
);

function startQuiz() {
  const pool = quizQuestions.filter((q) => q.field === selectedField.value);
  // 随机选 5 题（或全部）
  questions.value = pool.sort(() => Math.random() - 0.5).slice(0, 5);
  answers.value = new Array(questions.value.length).fill(undefined);
  currentIndex.value = 0;
  quizStarted.value = true;
  quizFinished.value = false;
}

function answer(index: number) {
  answers.value[currentIndex.value] = index;
}

function finishQuiz() {
  quizFinished.value = true;
}

function resetQuiz() {
  quizStarted.value = false;
  quizFinished.value = false;
  selectedField.value = "";
  answers.value = [];
  questions.value = [];
  currentIndex.value = 0;
}

defineExpose({
  isComplete: () => quizFinished.value && passed.value,
  getData: () => ({
    passed: passed.value,
    field: selectedField.value,
    correctCount: correctCount.value,
  }),
});
</script>
