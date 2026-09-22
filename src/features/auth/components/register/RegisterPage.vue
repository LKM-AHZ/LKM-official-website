<template>
  <component
    :is="mode === 'modal' ? 'div' : AuthShell"
    :max-width="mode === 'modal' ? undefined : '440px'"
    :class="mode === 'modal' ? 'w-full' : undefined"
  >
    <AuthCard
      :title="t('auth.register.title')"
      :subtitle="t('auth.register.subtitle')"
      :mode="mode"
    >
      <!-- 状态提示 -->
      <AuthStatus
        v-if="flow.error"
        type="error"
        class="mb-4"
        :message="flow.error"
      />

      <!-- Docker / done -->
      <div v-if="flow.stage === 'done'" class="text-center space-y-4">
        <div class="flex justify-center">
          <svg
            class="w-14 h-14 text-success"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p class="text-xl font-semibold">{{ t("auth.register.success") }}</p>
        <a :href="getAuthPath('')" class="btn btn-primary btn-sm w-full">{{
          t("auth.register.backHome")
        }}</a>
      </div>

      <template v-else>
        <!-- 注册方式切换 -->
        <AuthSegmentedControl
          :options="segmentedOptions"
          :model-value="flow.type"
          @update:model-value="onTypeChange($event as RegisterType)"
          class="mb-6"
        />

        <!-- 本地账户：纯字段子表单 -->
        <LocalRegister v-if="flow.type === 'local'" :flow="flow" />

        <!-- 普通账户：纯字段子表单 -->
        <NormalRegister v-else :flow="flow" />

        <!-- GitHub 注册（简化，未接入） -->
        <template v-if="flow.stage === 'form'">
          <div class="my-6 flex items-center gap-3">
            <div class="h-px flex-1 bg-[var(--surface-3)]"></div>
            <span class="text-xs text-text-muted">{{
              t("auth.register.or")
            }}</span>
            <div class="h-px flex-1 bg-[var(--surface-3)]"></div>
          </div>
          <!-- GitHub 注册尚未接通：按钮置灰并给出可见说明，不再用 alert 假装可用 -->
          <AuthMethodButton
            :label="t('auth.register.githubRegister')"
            disabled
          />
          <p class="mt-2 text-center text-xs text-text-muted">
            {{ t("auth.register.githubNotSupported") }}
          </p>
        </template>

        <!-- 已有账号 -->
        <p class="mt-6 text-center text-[13px] text-text-muted">
          {{ t("auth.register.haveAccount") }}
          <button
            type="button"
            class="text-primary font-semibold hover:underline"
            @click="switchToLogin"
          >
            {{ t("auth.register.loginNow") }}
          </button>
        </p>
      </template>
    </AuthCard>
  </component>
</template>

<script setup lang="ts">
import {
  useRegisterFlow,
  type RegisterType,
} from "~/features/auth/composables/useRegisterFlow";
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import { t } from "~/lib/i18n";
import AuthShell from "../shared/AuthShell.vue";
import AuthCard from "../shared/AuthCard.vue";
import AuthSegmentedControl from "../shared/AuthSegmentedControl.vue";
import AuthStatus from "../shared/AuthStatus.vue";
import AuthMethodButton from "../shared/AuthMethodButton.vue";
import LocalRegister from "./LocalRegister.vue";
import NormalRegister from "./NormalRegister.vue";

withDefaults(defineProps<{ mode?: "page" | "modal" }>(), { mode: "page" });

const redirectRaw =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("redirect")
    : null;

const flow = useRegisterFlow({
  redirect: redirectRaw || "/",
  onSuccess: (dst) => {
    window.dispatchEvent(new CustomEvent("close-auth-modal"));
    window.location.href = dst;
  },
});

const segmentedOptions = [
  { key: "normal" as RegisterType, label: t("auth.register.normalAccount") },
  { key: "local" as RegisterType, label: t("auth.register.localAccount") },
];

// 注册进行中或已进入验证码阶段时禁止切换注册方式：
// LocalRegister/NormalRegister 是按 flow.type 二选一渲染的，NormalRegister 持有验证码 UI，
// 中途切换会卸载验证码步骤，而 flow.stage 仍停在 'verify'、txnId 也还留着，
// 待验证的流程会凭空消失且表单状态与 flow 脱节。
// AuthSegmentedControl 没有 disabled 能力，故在 handler 里拦。
function onTypeChange(next: RegisterType) {
  if (flow.loading || flow.stage !== "form") return;
  flow.type = next;
}

function switchToLogin() {
  window.dispatchEvent(new CustomEvent("close-auth-modal"));
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent("open-auth-modal", { detail: { view: "login" } }),
    );
  }, 150);
}
</script>
