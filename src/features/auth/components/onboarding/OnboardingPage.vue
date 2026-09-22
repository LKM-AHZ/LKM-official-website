<template>
  <div class="min-h-screen bg-page-bg flex flex-col">
    <!-- 顶部精简步骤条 -->
    <div class="bg-card-bg border-b border-surface-3">
      <div class="max-w-xl mx-auto px-4 py-3">
        <ol
          class="flex items-center justify-between"
          :aria-label="t('onboarding.stepsAria')"
        >
          <li
            v-for="cfg in steps"
            :key="cfg.number"
            class="flex items-center"
            :class="{ 'flex-1': cfg.number < steps.length }"
          >
            <div class="flex flex-col items-center">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                :class="dotClass(cfg.number)"
              >
                <Icon
                  v-if="cfg.number < flow.step"
                  icon="material-symbols:check"
                  class="w-3.5 h-3.5"
                  aria-hidden="true"
                />
                <span v-else>{{ cfg.number }}</span>
              </div>
              <span
                class="text-[11px] mt-1 whitespace-nowrap hidden sm:block"
                :class="
                  cfg.number <= flow.step
                    ? 'text-deep-text font-medium'
                    : 'text-text-muted'
                "
              >
                {{ cfg.label }}
              </span>
            </div>
            <!-- 连接线 -->
            <div
              v-if="cfg.number < steps.length"
              class="h-0.5 mx-1 mt-[-0.75rem] flex-1 min-w-[1.5rem]"
              :class="cfg.number < flow.step ? 'bg-primary' : 'bg-surface-3'"
            ></div>
          </li>
        </ol>
      </div>
    </div>

    <!-- 单张聚焦向导卡 -->
    <div class="flex-1 flex items-start justify-center px-4 py-8">
      <AuthCard class="max-w-lg">
        <div class="text-center mb-2">
          <span class="text-xs text-text-muted/70">{{ stepNote }}</span>
        </div>

        <Transition name="step" mode="out-in">
          <component
            :is="currentConfig.component"
            :key="flow.step"
            :ref="setStepRef"
            v-bind="stepProps"
          />
        </Transition>

        <div class="flex justify-between mt-8">
          <button
            v-if="flow.step > 1"
            type="button"
            class="btn-ghost text-sm px-4 py-2"
            :disabled="flow.loading"
            @click="prev"
          >
            {{ t("onboarding.prev") }}
          </button>
          <div v-else></div>

          <div class="flex gap-2">
            <button
              v-if="currentConfig.skippable"
              type="button"
              class="btn-ghost text-sm px-4 py-2 text-text-muted"
              :disabled="flow.loading"
              @click="skip"
            >
              {{ t("onboarding.skipAll") }}
            </button>
            <button
              v-if="!isLastStep"
              type="button"
              class="btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
              :disabled="!canProceed || flow.loading"
              :class="
                !canProceed || flow.loading
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              "
              @click="next"
            >
              {{ currentConfig.buttonText || t("onboarding.next") }}
            </button>
            <button
              v-else
              type="button"
              class="btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
              :disabled="!canProceed || flow.loading"
              :class="
                !canProceed || flow.loading
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              "
              @click="next"
            >
              {{ t("onboarding.finish") }}
            </button>
          </div>
        </div>

        <div v-if="flow.error" class="mt-4">
          <AuthStatus type="error" :message="flow.error" />
        </div>
      </AuthCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import AuthCard from "../shared/AuthCard.vue";
import AuthStatus from "../shared/AuthStatus.vue";
import IdentityTags from "./IdentityTags.vue";
import FollowRecommend from "./FollowRecommend.vue";
import AnswerQuiz from "./AnswerQuiz.vue";
import NewbieTasks from "./NewbieTasks.vue";
import {
  useOnboardingFlow,
  type OnboardingStepNumber,
} from "~/features/auth/composables/useOnboardingFlow";
import { resolveSafeRedirect } from "~/features/auth/utils/safe-redirect";
import { buildUrl } from "~/lib/utils/paths";

interface StepConfig {
  number: OnboardingStepNumber;
  label: string;
  component: Record<string, unknown>;
  optional: boolean;
  required: boolean;
  skippable: boolean;
  buttonText?: string;
  /** 该步骤组件支持从 flow.dataByStep 回填已提交数据（声明 initial prop） */
  hydrates?: boolean;
}

const props = defineProps<{ redirect?: string | null }>();

const steps: StepConfig[] = [
  {
    number: 1,
    label: t("onboarding.identityTitle"),
    component: IdentityTags,
    hydrates: true,
    optional: true,
    required: false,
    skippable: true,
    buttonText: t("onboarding.next"),
  },
  {
    number: 2,
    label: t("onboarding.followTitle"),
    component: FollowRecommend,
    optional: false,
    required: true,
    skippable: true,
    buttonText: t("onboarding.followAll"),
  },
  {
    number: 3,
    label: t("onboarding.quizTitle"),
    component: AnswerQuiz,
    optional: true,
    required: false,
    skippable: true,
    buttonText: t("onboarding.submit"),
  },
  {
    number: 4,
    label: t("onboarding.tasksTitle"),
    component: NewbieTasks,
    optional: false,
    required: false,
    skippable: false,
    // 该步会收集 displayName/bio/intro：来回切步会被重建，需要把已提交数据回灌
    hydrates: true,
  },
];

function navigate(dst: string): void {
  const url = buildUrl(dst);
  if (typeof window !== "undefined") window.location.href = url;
}

const flow = useOnboardingFlow({
  redirect: props.redirect ?? null,
  onDone: navigate,
});

const stepRefs = ref<Record<number, Record<string, unknown>>>({});

function setStepRef(el: Record<string, unknown> | null): void {
  if (el) stepRefs.value[flow.step] = el;
}

const currentConfig = computed(
  () => steps.find((s) => s.number === flow.step) ?? steps[0],
);

// 最后一步不要写死 4：步骤增删/换序时，「下一步」与「完成」两个按钮的分支会跟着漂
const lastStepNumber = steps[steps.length - 1].number;
const isLastStep = computed(() => flow.step >= lastStepNumber);

/** 仅向声明 hydrates 的步骤传 initial，避免把该属性漏到其它步骤组件的根 DOM 上 */
const stepProps = computed(() => {
  const cfg = currentConfig.value;
  return cfg.hydrates ? { initial: flow.dataByStep[cfg.number] } : {};
});

// 切换步骤即清空注册表：Transition mode="out-in" 下新组件要等 180ms 才挂载，
// 期间 canProceed/collectData 会读到上一步已卸载实例的陈旧数据。
watch(
  () => flow.step,
  () => {
    stepRefs.value = {};
  },
);

const stepNote = computed(() => {
  if (currentConfig.value.optional) return t("onboarding.optionalNote");
  if (currentConfig.value.required) return t("onboarding.requiredNote");
  return "";
});

const canProceed = computed(() => {
  const ref = stepRefs.value[flow.step];
  if (currentConfig.value.optional) return true;
  if (ref && typeof ref.isComplete === "function") return !!ref.isComplete();
  return true;
});

async function collectData(): Promise<Record<string, unknown>> {
  const ref = stepRefs.value[flow.step];
  if (ref && typeof ref.getData === "function") {
    const d = ref.getData();
    return typeof d === "object" && d !== null
      ? (d as Record<string, unknown>)
      : {};
  }
  return {};
}

async function next(): Promise<void> {
  if (!isLastStep.value) {
    const data = await collectData();
    const ok = await flow.saveStep(flow.step, data);
    if (!ok) return;
    flow.goNext();
    return;
  }
  // 最后一步：先一并持久化本步资料，成功后才完成跳转（失败停留并显示错误）
  const ok = await flow.saveStep(flow.step, await collectData());
  if (!ok) return;
  flow.markDone();
}

function prev(): void {
  flow.goPrev();
}

async function skip(): Promise<void> {
  try {
    await flow.skipAll();
  } catch {
    // skipAll 若以 rejection 形式失败（网络等），不接住会变成未处理拒绝且 flow.error 仍为空，
    // 用户点了「跳过」却毫无反馈；这里补一条通用错误（模板已渲染 flow.error）
    flow.error.value = t("messages.operationFailed");
  }
}

onMounted(async () => {
  // 已完成用户（存量 localStorage 兜底）不重走。
  // 该 key 目前没有任何写入点，属历史遗留兜底；storage 被禁用时（Safari 隐私模式/沙箱）
  // getItem 会抛 SecurityError，不接住会中断 onMounted，连 flow.load() 都不会执行
  // 两条路径都显式赋值（catch 也赋 false）：预置初值会被判为无用赋值（no-useless-assignment）
  let doneFlag: boolean;
  try {
    doneFlag = localStorage.getItem("lkm-onboarding-done") === "true";
  } catch {
    // storage 被禁用（隐私模式/沙箱）：按未完成处理
    doneFlag = false;
  }
  if (doneFlag) {
    navigate(resolveSafeRedirect(props.redirect ?? null));
    return;
  }
  await flow.load();
  if (flow.completed) {
    navigate(resolveSafeRedirect(props.redirect ?? null));
  }
});

function dotClass(number: number): string {
  if (number < flow.step || number === flow.step)
    return "bg-primary text-on-primary";
  return "bg-surface-3 text-text-muted";
}
</script>

<style scoped>
/* 步骤切换微动效（150-200ms），尊重 prefers-reduced-motion */
.step-enter-active,
.step-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.step-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
@media (prefers-reduced-motion: reduce) {
  .step-enter-active,
  .step-leave-active {
    transition: none;
  }
  .step-enter-from,
  .step-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
