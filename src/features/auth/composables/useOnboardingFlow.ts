import { reactive, ref } from "vue";
import { authApi } from "~/lib/api/modules/auth";
import { resolveSafeRedirect } from "~/features/auth/utils/safe-redirect";
import { t } from "~/lib/i18n";

export type OnboardingStepNumber = 1 | 2 | 3 | 4;

export interface OnboardingFlowOptions {
  redirect?: string | null;
  onDone?: (dst: string) => void;
}

export interface OnboardingFlow {
  // state —— reactive 包裹的 ref 已解包，模板/JS 直接 flow.step=…
  step: OnboardingStepNumber;
  completed: boolean;
  loading: boolean;
  error: string | null;
  dataByStep: Record<number, Record<string, unknown>>;
  // methods
  load: () => Promise<void>;
  saveStep: (step: number, data: Record<string, unknown>) => Promise<boolean>;
  skipAll: () => Promise<void>;
  goNext: () => void;
  goPrev: () => void;
  markDone: () => void;
}

/**
 * Onboarding 聚焦向导流程 Composable。
 *
 * 逐步后端持久化：每个步骤提交 `setOnboardingStep`，完成/跳过调用
 * `skipOnboarding`；`load()` 从 `getOnboarding` 恢复首个未完成步骤，
 * 避免刷新后从第 1 步重走。汇总数据存于 `dataByStep`，由 OnboardingPage
 * 统一收集后 `markDone()` 跳转（`resolveSafeRedirect`）。
 *
 * 数据统一由 OnboardingPage→本 flow 提交；各步骤组件不再各自写 localStorage
 * 或独立调 API。
 */
/** 引导流程的步骤总数（goNext 与"已提交步骤"解析共用同一来源，避免两处各写一个 4） */
export const MAX_ONBOARDING_STEP = 4;

export function useOnboardingFlow(
  options: OnboardingFlowOptions = {},
): OnboardingFlow {
  const { redirect = null, onDone } = options;

  const step = ref<OnboardingStepNumber>(1);
  const completed = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const dataByStep = ref<Record<number, Record<string, unknown>>>({});

  function setError(msg?: string): void {
    error.value = msg ?? t("messages.operationFailed");
  }

  function finish(): void {
    error.value = null;
    const dst = resolveSafeRedirect(redirect);
    if (typeof onDone === "function") onDone(dst);
  }

  /** 从 getOnboarding 恢复未完成步骤与已提交的分步数据。 */
  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const r = await authApi.getOnboarding();
      if (r.isErr()) {
        setError(r.error.message);
        return;
      }
      const res = r.value;
      if (res.completed) {
        completed.value = true;
        return;
      }
      // 已提交的分步数据：data 以步骤号为 key（如 { 1: { grade: 'math' } }）
      const data = (res.data ?? {}) as Record<string, unknown>;
      const next: Record<number, Record<string, unknown>> = {};
      for (const key of Object.keys(data)) {
        const numKey = Number(key);
        if (
          Number.isInteger(numKey) &&
          numKey >= 1 &&
          numKey <= 4 &&
          data[key] &&
          typeof data[key] === "object"
        ) {
          next[numKey] = data[key] as Record<string, unknown>;
        }
      }
      dataByStep.value = next;
      // 首个未完成步骤优先：后端回传的 step，否则退回到第 1 步
      const resume =
        res.step >= 1 && res.step <= 4 ? (res.step as OnboardingStepNumber) : 1;
      step.value = resume;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 逐步持久化：把某一步 data 提交到后端，成功后据返回的 step/completed 更新流状态。
   * 返回是否成功，供页面决定是否推进。
   */
  async function saveStep(
    stepNum: number,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const r = await authApi.setOnboardingStep(stepNum, data);
      if (r.isErr()) {
        setError(r.error.message);
        return false;
      }
      dataByStep.value[stepNum] = data;
      const res = r.value;
      if (res.step >= 1 && res.step <= 4) {
        step.value = res.step as OnboardingStepNumber;
      }
      completed.value = res.completed;
      return true;
    } finally {
      loading.value = false;
    }
  }

  /** 整体跳过（可选流程用户不逐项填写）：调用 skip 接口并视为完成。 */
  async function skipAll(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const r = await authApi.skipOnboarding();
      if (r.isErr()) {
        setError(r.error.message);
        return;
      }
      completed.value = true;
      // 这里不用再 error.value = null：函数开头已清空，且成功分支不会调用 setError
      finish();
    } finally {
      loading.value = false;
    }
  }

  function goNext(): void {
    if (step.value < MAX_ONBOARDING_STEP)
      step.value = (step.value + 1) as OnboardingStepNumber;
  }

  function goPrev(): void {
    if (step.value > 1) step.value = (step.value - 1) as OnboardingStepNumber;
  }

  /** 进入完成态后跳转（连同 dataByStep 汇总，前端整体完成）。 */
  function markDone(): void {
    completed.value = true;
    error.value = null;
    finish();
  }

  // reactive 包裹使 ref 解包（与各 flow 一致），模板里即值类型，消除 TS2367 误报
  return reactive({
    step,
    completed,
    loading,
    error,
    dataByStep,
    load,
    saveStep,
    skipAll,
    goNext,
    goPrev,
    markDone,
  });
}
