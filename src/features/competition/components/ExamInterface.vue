<template>
  <div class="flex gap-4 max-w-4xl mx-auto">
    <!-- 左侧题号导航 -->
    <div class="w-12 shrink-0 space-y-1 hidden sm:block">
      <button
        v-for="(q, i) in questions"
        :key="i"
        class="w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
        :class="
          currentIndex === i
            ? 'bg-primary text-on-primary'
            : answers[i] !== undefined
              ? 'bg-primary/20 text-primary'
              : 'bg-surface-3 text-text-muted'
        "
        @click="currentIndex = i"
      >
        {{ i + 1 }}
      </button>
    </div>

    <!-- 答题区 -->
    <div class="flex-1">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-text-muted">{{
          t("community.competition.questionOf", {
            current: currentIndex + 1,
            total: questions.length,
          })
        }}</span>
        <span
          class="text-sm font-mono font-bold"
          :class="remaining < 300 ? 'text-red-500' : 'text-primary'"
        >
          {{ formatTime(remaining) }}
        </span>
      </div>

      <div class="bg-card-bg border border-surface-3 rounded-xl p-6">
        <p class="text-deep-text font-medium mb-4">{{ t(currentQ.stem) }}</p>
        <div class="space-y-2">
          <button
            v-for="(opt, i) in currentQ.options"
            :key="i"
            class="w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors"
            :class="
              answers[currentIndex] === i
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-surface-3 text-deep-text hover:border-primary/40'
            "
            @click="answers[currentIndex] = i"
          >
            <span class="font-mono text-text-muted mr-2">{{ labelOf(i) }}.</span
            >{{ t(opt) }}
          </button>
        </div>
      </div>

      <div class="flex justify-between mt-4">
        <button
          class="btn-ghost text-sm px-4 py-2"
          :disabled="currentIndex === 0"
          @click="currentIndex--"
        >
          {{ t("community.competition.previous") }}
        </button>
        <div class="flex gap-2">
          <span class="text-xs text-text-muted self-center">{{
            t("community.competition.answered", {
              count: answeredCount,
              total: questions.length,
            })
          }}</span>
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
            @click="submit"
          >
            {{ t("community.competition.submitExam") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { mockQuestions } from "../data/mock-competitions";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

const questions = ref(mockQuestions.slice(0, 8));
const answers = ref<(number | undefined)[]>(
  new Array(questions.value.length).fill(undefined),
);
const currentIndex = ref(0);
const EXAM_SECONDS = 7200; // 120 minutes
const remaining = ref(EXAM_SECONDS);
let timer: ReturnType<typeof setInterval> | undefined;
let deadline = 0;
let submitted = false;

const currentQ = computed(() => questions.value[currentIndex.value]);
const answeredCount = computed(
  () => answers.value.filter((a) => a !== undefined).length,
);

// 按选项下标现算字母标号：原来写死 A-D，题目超过 4 个选项时会渲染出 undefined
const labelOf = (i: number): string => String.fromCharCode(65 + i);

onMounted(() => {
  // 用墙钟截止时间而不是每秒自减：后台标签页被节流或事件循环卡顿时，自减会漂移
  // （计时器少跑，等于多给考试时间）
  deadline = Date.now() + EXAM_SECONDS * 1000;
  timer = setInterval(() => {
    remaining.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    // 到点必须自动交卷：原来只停止递减，interval 还在空转，学生可以继续答题
    if (remaining.value === 0) submit();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function submit() {
  // 自动交卷与手动提交可能同时触发，用标志避免重复弹窗/重复跳转
  if (submitted) return;
  submitted = true;
  const correct = answers.value.filter(
    (a, i) => a === questions.value[i].answer,
  ).length;
  if (timer) clearInterval(timer);
  alert(
    t("community.competition.examSubmitted", {
      correct,
      total: questions.length,
      percent: Math.round((correct / questions.length) * 100),
    }),
  );
  window.location.href = buildUrl("/competition");
}
</script>
