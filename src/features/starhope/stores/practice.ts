import { ref, computed, type Ref, type ComputedRef } from "vue";
import { db } from "./db";
import { useAuthStore } from "./auth";
import { enqueue } from "../sync/sync";
import type { Question, PracticeSession } from "~/features/starhope/types";
import { t } from "~/lib/i18n";

export interface PracticeConfig {
  questionIds: string[];
  mode: "realtime" | "batch";
  type: "practice" | "exam";
  timeLimit?: number;
  passingGrade?: number;
}

const currentSession = ref<PracticeSession | null>(null);
const currentQuestion = ref<Question | null>(null);
const currentIndex = ref(0);
const questions = ref<Question[]>([]);
const elapsedSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
const error = ref<string | null>(null);

export function usePracticeStore(): {
  currentSession: Ref<PracticeSession | null>;
  currentQuestion: Ref<Question | null>;
  currentIndex: Ref<number>;
  questions: Ref<Question[]>;
  elapsedSeconds: Ref<number>;
  error: Ref<string | null>;
  totalQuestions: ComputedRef<number>;
  progress: ComputedRef<number>;
  answeredCount: ComputedRef<number>;
  isLastQuestion: ComputedRef<boolean>;
  isFirstQuestion: ComputedRef<boolean>;
  startPractice: (config: PracticeConfig) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  setAnswer: (answer: string | string[]) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submitExam: () => Promise<PracticeSession | undefined>;
  pauseSession: () => Promise<void>;
  getSessionResult: () => {
    total: number;
    correct: number;
    wrong: number;
    score: number;
  } | null;
  getPassed: () => boolean | null;
  loadSessions: (type?: "practice" | "exam") => Promise<PracticeSession[]>;
  loadWrongQuestions: () => Promise<Question[]>;
  reset: () => void;
} {
  const auth = useAuthStore();

  const totalQuestions = computed(() => questions.value.length);
  const progress = computed(() =>
    totalQuestions.value === 0 ? 0 : currentIndex.value / totalQuestions.value,
  );
  const answeredCount = computed(() =>
    currentSession.value ? Object.keys(currentSession.value.answers).length : 0,
  );
  const isLastQuestion = computed(
    () => currentIndex.value >= totalQuestions.value - 1,
  );
  const isFirstQuestion = computed(() => currentIndex.value <= 0);

  function stopTimer(): void {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTimer(): void {
    stopTimer();
    timerInterval = setInterval(() => {
      elapsedSeconds.value++;
      if (
        // 只对进行中的会话自动交卷：否则已完成的会话被 resume 后还会反复提交
        currentSession.value?.status === "ongoing" &&
        currentSession.value.timeLimit &&
        elapsedSeconds.value >= currentSession.value.timeLimit * 60
      ) {
        // 先停表再提交：submitExam 里有 await，不停表的话等待期间每个 tick 都会重复提交
        // （重复评分、重复写库、重复 enqueue）
        stopTimer();
        void submitExam();
      }
    }, 1000);
  }

  /** 作答/评分后的落库 + 同步通知；答题很密集，800ms 去抖避免每题都写一次 IndexedDB。 */
  function schedulePersist(): void {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      void persistSession();
    }, 800);
  }

  async function persistSession(): Promise<void> {
    const session = currentSession.value;
    if (!session) return;
    try {
      session.updatedAt = new Date().toISOString();
      await db.practiceSessions.put(session);
      enqueue("sessions", session.id, "upsert", session);
    } catch (e) {
      error.value = t("messages.operationFailed");
      console.error("persistSession failed:", e);
    }
  }

  function loadCurrentQuestion(): void {
    currentQuestion.value = questions.value[currentIndex.value] ?? null;
  }

  async function startPractice(config: PracticeConfig): Promise<void> {
    if (!auth.isLoggedIn.value) return;
    questions.value = (await db.questions.bulkGet(
      config.questionIds,
    )) as Question[];
    questions.value = questions.value.filter(Boolean);
    const session: PracticeSession = {
      id: crypto.randomUUID(),
      userId: String(auth.userId.value!),
      type: config.type,
      mode: config.mode,
      questionIds: questions.value.map((q) => q.id),
      answers: {},
      status: "ongoing",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeLimit: config.timeLimit,
      passingGrade: config.passingGrade,
    };
    await db.practiceSessions.put(session);
    enqueue("sessions", session.id, "upsert", session);
    currentSession.value = session;
    currentIndex.value = 0;
    elapsedSeconds.value = 0;
    loadCurrentQuestion();
    startTimer();
  }

  async function resumeSession(sessionId: string): Promise<void> {
    const session = await db.practiceSessions.get(sessionId);
    if (!session) return;
    currentSession.value = session;
    questions.value = (await db.questions.bulkGet(
      session.questionIds,
    )) as Question[];
    questions.value = questions.value.filter(Boolean);
    // 恢复到第一道未作答的题（旧实现恒为 0，等于让用户从第一题重新作答）
    const firstUnanswered = questions.value.findIndex(
      (q) => session.answers?.[q.id] === undefined,
    );
    currentIndex.value =
      firstUnanswered === -1
        ? Math.max(questions.value.length - 1, 0)
        : firstUnanswered;
    loadCurrentQuestion();
    // 已完成/暂停的会话不该再起表（否则到点还会自动交卷一次）
    if (session.status === "ongoing") startTimer();
  }

  function setAnswer(answer: string | string[]): void {
    if (!currentSession.value || !currentQuestion.value) return;
    currentSession.value.answers[currentQuestion.value.id] = answer;
    if (currentSession.value.mode === "realtime") gradeCurrent();
    // 作答必须落盘 + 通知同步：否则崩溃/关页面会丢答案，远端也永远拿不到这些作答
    schedulePersist();
  }

  function gradeCurrent(): void {
    if (!currentSession.value || !currentQuestion.value) return;
    const userAnswer = currentSession.value.answers[currentQuestion.value.id];
    const correctAnswer = currentQuestion.value.answer;
    let correct = false;
    if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
      const s1 = [...correctAnswer].sort(),
        s2 = [...userAnswer].sort();
      correct = s1.length === s2.length && s1.every((v, i) => v === s2[i]);
    } else if (
      typeof correctAnswer === "string" &&
      typeof userAnswer === "string"
    ) {
      correct =
        correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
    }
    if (!currentSession.value.results) currentSession.value.results = {};
    currentSession.value.results[currentQuestion.value.id] = { correct };
  }

  function goToQuestion(index: number): void {
    if (index >= 0 && index < totalQuestions.value) {
      currentIndex.value = index;
      loadCurrentQuestion();
    }
  }
  function nextQuestion(): void {
    if (!isLastQuestion.value) {
      currentIndex.value++;
      loadCurrentQuestion();
    }
  }
  function prevQuestion(): void {
    if (!isFirstQuestion.value) {
      currentIndex.value--;
      loadCurrentQuestion();
    }
  }

  async function submitExam(): Promise<PracticeSession | undefined> {
    if (!currentSession.value) return;
    if (currentSession.value.mode === "batch") {
      for (const q of questions.value) {
        const ua = currentSession.value.answers[q.id];
        if (!ua) continue;
        let correct = false;
        if (Array.isArray(q.answer) && Array.isArray(ua)) {
          const s1 = [...q.answer].sort(),
            s2 = [...ua].sort();
          correct = s1.length === s2.length && s1.every((v, i) => v === s2[i]);
        } else if (typeof q.answer === "string" && typeof ua === "string") {
          correct = q.answer.trim().toLowerCase() === ua.trim().toLowerCase();
        }
        if (!currentSession.value.results) currentSession.value.results = {};
        currentSession.value.results[q.id] = { correct };
      }
    }
    currentSession.value.status = "completed";
    currentSession.value.completedAt = new Date().toISOString();
    currentSession.value.updatedAt = new Date().toISOString();
    await db.practiceSessions.put(currentSession.value);
    enqueue(
      "sessions",
      currentSession.value.id,
      "upsert",
      currentSession.value,
    );
    stopTimer();
    return currentSession.value;
  }

  async function pauseSession(): Promise<void> {
    if (!currentSession.value) return;
    currentSession.value.status = "paused";
    currentSession.value.updatedAt = new Date().toISOString();
    await db.practiceSessions.put(currentSession.value);
    enqueue(
      "sessions",
      currentSession.value.id,
      "upsert",
      currentSession.value,
    );
    stopTimer();
  }

  function getSessionResult(): {
    total: number;
    correct: number;
    wrong: number;
    score: number;
  } | null {
    if (!currentSession.value?.results) return null;
    const results = currentSession.value.results;
    // 分母用「本次会话的题目数」而不是「已判分的题数」：整场只答对 1 题、其余 19 题空白时，
    // 后者会算成 100 分
    const total =
      currentSession.value.questionIds?.length || Object.keys(results).length;
    const correct = Object.values(results).filter((r) => r.correct).length;
    return {
      total,
      correct,
      wrong: total - correct,
      score: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }

  function getPassed(): boolean | null {
    if (currentSession.value?.type !== "exam") return null;
    const result = getSessionResult();
    // 显式判 null/undefined：及格线配成 0 分时，`!passingGrade` 会把「0 分即及格」判成「未设置」
    const passingGrade = currentSession.value.passingGrade;
    if (!result || passingGrade === undefined || passingGrade === null) {
      return null;
    }
    return result.score >= passingGrade;
  }

  async function loadSessions(
    type?: "practice" | "exam",
  ): Promise<PracticeSession[]> {
    if (!auth.isLoggedIn.value) return [];
    let query = db.practiceSessions.where("userId").equals(auth.userId.value!);
    if (type) query = query.and((s: PracticeSession) => s.type === type);
    // reverse() 对 Collection 是空操作：排序会立刻覆盖它的迭代顺序，
    // 结果仍是升序（最旧在前）。先排序再反转数组才是「最新在前」
    const sessions = await query.sortBy("startedAt");
    return sessions.reverse();
  }

  async function loadWrongQuestions(): Promise<Question[]> {
    if (!auth.isLoggedIn.value) return [];
    const all = await db.practiceSessions
      .where("userId")
      .equals(auth.userId.value!)
      .toArray();
    const sessions = all.filter(
      (s: PracticeSession) => s.results && s.status === "completed",
    );
    const wrongIds = new Set<string>();
    for (const s of sessions) {
      if (!s.results) continue;
      for (const [id, r] of Object.entries(s.results)) {
        if (!r.correct) wrongIds.add(id);
      }
    }
    const qs = (await db.questions.bulkGet([...wrongIds])) as Question[];
    return qs.filter(Boolean);
  }

  function reset(): void {
    stopTimer();
    currentSession.value = null;
    currentQuestion.value = null;
    questions.value = [];
    currentIndex.value = 0;
    elapsedSeconds.value = 0;
  }

  return {
    currentSession,
    currentQuestion,
    currentIndex,
    questions,
    elapsedSeconds,
    error,
    totalQuestions,
    progress,
    answeredCount,
    isLastQuestion,
    isFirstQuestion,
    startPractice,
    resumeSession,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    submitExam,
    pauseSession,
    getSessionResult,
    getPassed,
    loadSessions,
    loadWrongQuestions,
    reset,
  };
}
