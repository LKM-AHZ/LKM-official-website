<template>
  <div>
    <!-- 顶部固定：竞赛名 + 倒计时 + 进度 -->
    <div
      class="sticky top-0 z-20 -mx-4 px-4 py-3 mb-4 bg-[var(--card-bg)] border-b border-surface-3 flex items-center justify-between gap-3"
    >
      <span class="text-sm font-semibold text-deep-text truncate">
        {{ t("community.competition.title") }}
      </span>
      <div class="flex items-center gap-3 shrink-0">
        <span class="hidden sm:inline text-xs text-text-muted">{{
          t("community.competition.answered", {
            count: answeredCount,
            total: questions.length,
          })
        }}</span>
        <span
          class="font-mono text-sm font-bold px-2 py-0.5 rounded"
          :class="
            remaining < 300
              ? 'bg-red-500/10 text-red-500'
              : 'bg-[var(--btn-regular-bg)] text-primary'
          "
        >
          {{ formatTime(remaining) }}
        </span>
        <!-- 移动端：展开/收起答题卡 -->
        <button
          class="lg:hidden text-xs px-2 py-1 rounded border border-surface-3 text-text-muted"
          @click="showSheet = !showSheet"
        >
          {{ t("community.competition.answerSheet") }}
        </button>
      </div>
    </div>

    <div class="flex gap-4">
      <!-- 答题主区 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-text-muted">{{
            t("community.competition.questionOf", {
              current: currentIndex + 1,
              total: questions.length,
            })
          }}</span>
          <!-- 题型徽章 -->
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium"
            :class="typeBadgeClass(currentQ.type)"
          >
            {{ typeLabel(currentQ.type) }}
          </span>
        </div>

        <div class="bg-card-bg border border-surface-3 rounded-xl p-6">
          <p class="text-deep-text font-medium mb-4 leading-7">
            {{ t(currentQ.stem) }}
          </p>

          <!-- 选项（单选/多选/判断） -->
          <div v-if="currentQ.type !== 'fill'" class="space-y-2">
            <button
              v-for="(opt, i) in currentQ.options"
              :key="i"
              class="w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors"
              :class="optionClass(i)"
              @click="selectOption(i)"
            >
              <span class="font-mono text-text-muted mr-2"
                >{{ labelOf(i) }}.</span
              >
              {{ t(opt) }}
            </button>
          </div>

          <!-- 填空 -->
          <input
            v-else
            v-model.fill="fillAnswer"
            type="text"
            :placeholder="t('community.competition.fillPlaceholder')"
            class="w-full px-4 py-3 rounded-lg text-sm border border-surface-3 bg-card-bg text-deep-text focus:border-primary outline-none"
          />
        </div>

        <div class="flex justify-between mt-4">
          <button
            class="btn-ghost text-sm px-4 py-2 rounded-lg"
            :disabled="currentIndex === 0"
            @click="currentIndex--"
          >
            {{ t("community.competition.previous") }}
          </button>
          <button
            v-if="currentIndex < questions.length - 1"
            class="btn-primary px-5 py-2 rounded-lg text-sm"
            @click="currentIndex++"
          >
            {{ t("community.competition.next") }}
          </button>
          <button
            v-else
            class="btn-primary px-5 py-2 rounded-lg text-sm font-bold"
            @click="onSubmit"
          >
            {{ t("community.competition.submitExam") }}
          </button>
        </div>
      </div>

      <!-- 桌面端答题卡侧边栏 -->
      <aside class="hidden lg:block w-52 shrink-0">
        <div
          class="bg-card-bg border border-surface-3 rounded-xl p-4 sticky top-20"
        >
          <p class="text-xs font-semibold text-deep-text mb-3">
            {{ t("community.competition.answerSheet") }}
          </p>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="(q, i) in questions"
              :key="q.id"
              class="h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors"
              :class="answerCellClass(i)"
              @click="currentIndex = i"
            >
              {{ i + 1 }}
            </button>
          </div>
          <div class="mt-4 space-y-1 text-[11px] text-text-muted">
            <p class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-sm bg-primary inline-block"
              ></span>
              {{ t("community.competition.answeredShort") }}
            </p>
            <p class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-sm bg-surface-3 inline-block"
              ></span>
              {{ t("community.competition.unansweredShort") }}
            </p>
          </div>
        </div>
      </aside>
    </div>

    <!-- 移动端答题卡抽屉 -->
    <div
      v-if="showSheet"
      class="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-card-bg border-t border-surface-3 rounded-t-2xl p-4"
    >
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-semibold text-deep-text">
          {{ t("community.competition.answerSheet") }}
        </p>
        <button class="text-xs text-text-muted" @click="showSheet = false">
          ✕
        </button>
      </div>
      <div class="grid grid-cols-6 gap-1.5">
        <button
          v-for="(q, i) in questions"
          :key="q.id"
          class="h-9 rounded-md text-xs font-medium flex items-center justify-center"
          :class="answerCellClass(i)"
          @click="
            currentIndex = i;
            showSheet = false;
          "
        >
          {{ i + 1 }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  mockQuestions,
  type MockQuestion,
  type QuestionAnswer,
} from "../data/mock-competitions";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

const questions = ref(mockQuestions.slice(0, 10));
// 作答：单选/判断存下标，多选存下标数组，填空存字符串
const answers = ref<(QuestionAnswer | undefined)[]>(
  new Array(questions.value.length).fill(undefined),
);
const currentIndex = ref(0);
const showSheet = ref(false);

const EXAM_SECONDS = 7200; // 120 minutes
const remaining = ref(EXAM_SECONDS);
let timer: ReturnType<typeof setInterval> | undefined;
let deadline = 0;
let submitted = false;

const currentQ = computed<MockQuestion>(
  () => questions.value[currentIndex.value],
);

// 填空题单独绑 v-model，同步回 answers
const fillAnswer = computed<string>({
  get: () =>
    typeof answers.value[currentIndex.value] === "string"
      ? (answers.value[currentIndex.value] as string)
      : "",
  set: (v: string) => {
    answers.value[currentIndex.value] = v;
  },
});

const answeredCount = computed(
  () => answers.value.filter((a) => !isBlank(a)).length,
);

function isBlank(a: QuestionAnswer | undefined): boolean {
  if (a === undefined) return true;
  if (Array.isArray(a)) return a.length === 0;
  if (typeof a === "string") return a.trim() === "";
  return false;
}

function isAnswered(i: number): boolean {
  return !isBlank(answers.value[i]);
}

// 按选项下标现算字母标号
const labelOf = (i: number): string => String.fromCharCode(65 + i);

onMounted(() => {
  // 用墙钟截止时间而不是每秒自减：后台标签页被节流或事件循环卡顿时，自减会漂移
  deadline = Date.now() + EXAM_SECONDS * 1000;
  timer = setInterval(() => {
    remaining.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remaining.value === 0) onSubmit();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function typeLabel(type: MockQuestion["type"]): string {
  if (type === "multiple") return t("community.competition.multipleChoice");
  if (type === "true_false") return t("community.competition.trueFalse");
  if (type === "fill") return t("community.competition.fillBlank");
  return t("community.competition.singleChoice");
}

function typeBadgeClass(type: MockQuestion["type"]): string {
  if (type === "multiple")
    return "bg-[var(--warning)] text-[var(--on-warning)]";
  if (type === "fill") return "bg-[var(--info)] text-[var(--on-info)]";
  if (type === "true_false") return "bg-[var(--surface-3)] text-text-muted";
  return "bg-[var(--btn-regular-bg)] text-primary";
}

/** 点击选项：单选/判断直接选定；多选切换数组 */
function selectOption(i: number) {
  const q = currentQ.value;
  if (q.type === "multiple") {
    const cur = answers.value[currentIndex.value];
    const set = new Set(Array.isArray(cur) ? (cur as number[]) : []);
    if (set.has(i)) set.delete(i);
    else set.add(i);
    answers.value[currentIndex.value] = [...set].sort((a, b) => a - b);
  } else {
    answers.value[currentIndex.value] = i;
  }
}

function optionClass(i: number): string {
  const q = currentQ.value;
  const cur = answers.value[currentIndex.value];
  const selected =
    q.type === "multiple" ? Array.isArray(cur) && cur.includes(i) : cur === i;
  return selected
    ? "border-primary bg-[var(--btn-regular-bg)] text-primary"
    : "border-surface-3 text-deep-text hover:border-primary/40";
}

function answerCellClass(i: number): string {
  if (currentIndex.value === i) return "bg-primary text-on-primary";
  return isAnswered(i)
    ? "bg-primary/20 text-primary"
    : "bg-surface-3 text-text-muted";
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function onSubmit() {
  if (submitted) return;
  if (!confirm(t("community.competition.submitConfirm"))) return;
  submitted = true;
  let correct = 0;
  questions.value.forEach((q, i) => {
    if (isCorrect(q, answers.value[i])) correct++;
  });
  if (timer) clearInterval(timer);
  alert(
    t("community.competition.examSubmitted", {
      correct,
      total: questions.value.length,
      percent: Math.round((correct / questions.value.length) * 100),
    }),
  );
  window.location.href = buildUrl("/competition");
}

function isCorrect(q: MockQuestion, ans: QuestionAnswer | undefined): boolean {
  if (ans === undefined) return false;
  if (q.type === "multiple") {
    if (!Array.isArray(ans) || !Array.isArray(q.answer)) return false;
    const a = [...ans].sort().join(",");
    const b = [...(q.answer as number[])].sort().join(",");
    return a === b;
  }
  if (q.type === "fill") {
    return String(ans).trim() === String(q.answer).trim();
  }
  return ans === q.answer;
}
</script>
