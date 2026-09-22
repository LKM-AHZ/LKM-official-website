<template>
  <div
    class="rounded-2xl bg-card-bg shadow-2xl border border-surface-3 p-6 sm:p-8"
  >
    <h2 class="text-xl font-semibold text-center mb-4">
      {{ t("auth.twoFactor.recoveryTitle") }}
    </h2>

    <!-- Verify email -->
    <form
      v-if="step === 'verify'"
      @submit.prevent="handleVerify"
      class="space-y-4"
    >
      <p class="text-sm text-text-muted text-center">
        {{ t("auth.twoFactor.verifyIdentity") }}
      </p>
      <div>
        <label class="label pb-1"
          ><span class="label-text font-medium">{{
            t("auth.twoFactor.email")
          }}</span></label
        >
        <input
          type="email"
          class="input input-bordered w-full"
          v-model="email"
          :placeholder="t('auth.twoFactor.enterBoundEmail')"
        />
      </div>
      <div>
        <label class="label pb-1"
          ><span class="label-text font-medium">{{
            t("auth.twoFactor.code")
          }}</span></label
        >
        <input
          type="text"
          class="input input-bordered w-full"
          v-model="code"
          :placeholder="t('auth.twoFactor.enter6Digit')"
          maxlength="6"
        />
      </div>
      <div v-if="error" class="alert alert-error text-sm">{{ error }}</div>
      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="submitting"
      >
        {{ t("auth.twoFactor.verify") }}
      </button>
      <button
        type="button"
        class="btn btn-ghost w-full btn-sm"
        @click="emit('back')"
      >
        {{ t("common.back") }}
      </button>
    </form>

    <!-- Recovery code -->
    <form
      v-else-if="step === 'recovery'"
      @submit.prevent="handleRecovery"
      class="space-y-4"
    >
      <p class="text-sm text-text-muted text-center">
        {{ t("auth.twoFactor.enterRecoveryTitle") }}
      </p>
      <div>
        <label class="label pb-1"
          ><span class="label-text font-medium">{{
            t("auth.twoFactor.recoveryCodeName")
          }}</span></label
        >
        <input
          type="text"
          class="input input-bordered w-full"
          v-model="recoveryCode"
          :placeholder="t('auth.twoFactor.recoveryCodePlaceholder')"
        />
      </div>
      <div v-if="error" class="alert alert-error text-sm">{{ error }}</div>
      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="submitting"
      >
        {{ t("auth.twoFactor.verify") }}
      </button>
      <!-- 非管理员在此步没有其它出口，必须给一个回退，否则用户进了恢复码模式就出不去 -->
      <button
        type="button"
        class="btn btn-ghost w-full btn-sm"
        @click="step = 'verify'"
      >
        {{ t("common.back") }}
      </button>
      <!-- 管理员级别不得绕过校验：这里只做提示，绝不 emit success（是否放行由上游权限决定） -->
      <p
        v-if="props.level === 'admin'"
        class="text-xs text-text-muted text-center"
      >
        {{ t("auth.twoFactor.contactAdmin") }}
      </p>
    </form>

    <!-- Done -->
    <div v-else-if="step === 'done'" class="text-center space-y-4">
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
      <p class="font-semibold">{{ t("auth.twoFactor.recoverySuccess2") }}</p>
      <p class="text-sm text-text-muted">
        {{ t("auth.twoFactor.pleaseReSetup2fa") }}
      </p>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="emit('success')"
      >
        {{ t("auth.twoFactor.done") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { authApi } from "~/lib/api/modules/auth";
import { t } from "~/lib/i18n";

const emit = defineEmits<{
  (e: "success"): void;
  (e: "back"): void;
}>();

const props = withDefaults(
  defineProps<{
    level: "normal" | "admin";
    /** 登录/强制 2FA 流程下发的临时令牌；身份与恢复码校验一律在后端完成 */
    tempToken?: string;
  }>(),
  { tempToken: "" },
);

const step = ref<"verify" | "recovery" | "done">("verify");
const email = ref("");
const code = ref("");
const recoveryCode = ref("");
const error = ref("");
const submitting = ref(false);

async function handleVerify() {
  error.value = "";
  if (!email.value.trim()) {
    error.value = t("auth.twoFactor.enterEmailError");
    return;
  }
  const value = code.value.trim();
  if (!/^\d{6}$/.test(value)) {
    error.value = t("auth.twoFactor.enter6DigitError");
    return;
  }
  if (!props.tempToken) {
    error.value = t("messages.auth.missingTempToken");
    return;
  }
  submitting.value = true;
  try {
    // 身份校验交给后端：客户端不再持有任何「正确答案」字面量
    const r = await authApi.verify2FA(props.tempToken, value);
    if (r.isErr()) {
      error.value = r.error.message;
      return;
    }
    step.value = "recovery";
  } finally {
    submitting.value = false;
  }
}

async function handleRecovery() {
  error.value = "";
  const value = recoveryCode.value.trim();
  if (!value) {
    error.value = t("auth.twoFactor.enterRecoveryCode");
    return;
  }
  if (!props.tempToken) {
    error.value = t("messages.auth.missingTempToken");
    return;
  }
  submitting.value = true;
  try {
    // 恢复码由后端与用户已存储的（哈希）恢复码比对，客户端不再内置任何有效恢复码
    const r = await authApi.verify2FA(props.tempToken, null, value);
    if (r.isErr()) {
      error.value = r.error.message;
      return;
    }
    step.value = "done";
  } finally {
    submitting.value = false;
  }
}
</script>
