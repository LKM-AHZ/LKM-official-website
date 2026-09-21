<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold text-center mb-2">
      {{ t("auth.twoFactor.title") }}
    </h2>

    <AuthStatus v-if="error" type="error" :message="error" />

    <!-- 备用恢复码验证 -->
    <div v-if="showRecovery" class="space-y-4">
      <AuthField
        id="totp-recovery"
        :label="t('auth.twoFactor.recoveryCode')"
        :placeholder="t('auth.twoFactor.recoveryCodePlaceholder')"
        v-model="recoveryCode"
      />
      <button
        type="button"
        class="btn btn-primary w-full active:scale-[0.98] transition-transform"
        :disabled="recoveryLoading"
        @click="handleRecoverySubmit"
      >
        <span
          v-if="recoveryLoading"
          class="loading loading-spinner loading-sm"
        ></span>
        <span v-else>{{ t("auth.twoFactor.verifyRecoveryCode") }}</span>
      </button>
      <button
        type="button"
        class="btn btn-ghost w-full btn-sm"
        @click="showRecovery = false"
      >
        {{ t("auth.twoFactor.backToTotp") }}
      </button>
    </div>

    <!-- 正常 TOTP 验证 -->
    <form v-else @submit.prevent="handleTOTPSubmit" class="space-y-4">
      <p class="text-sm text-text-muted text-center">
        {{ t("auth.twoFactor.totpHint") }}
      </p>
      <AuthField
        id="totp-code"
        :label="t('auth.twoFactor.code')"
        :placeholder="t('auth.twoFactor.enter6Digit')"
        autocomplete="one-time-code"
        v-model="totpCode"
      />
      <button
        type="submit"
        class="btn btn-primary w-full active:scale-[0.98] transition-transform"
        :disabled="loading || totpCode.length < 6"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        <span v-else>{{ t("auth.twoFactor.verify") }}</span>
      </button>
      <div class="text-center mt-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm text-xs"
          @click="showRecovery = true"
        >
          {{ t("auth.twoFactor.useRecoveryCode") }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useLoginFlow } from "~/features/auth/composables/useLoginFlow";
import { t } from "~/lib/i18n";
import AuthField from "../shared/AuthField.vue";
import AuthStatus from "../shared/AuthStatus.vue";

const emit = defineEmits<{
  (e: "success", msg: string): void;
  (e: "error", msg: string): void;
}>();

// 2FA 逻辑统一交由 useLoginFlow.submit2FA 驱动（内部走 authApi.verify2FA），
// 通过 props 传入 temp token。
const props = withDefaults(defineProps<{ tempToken?: string }>(), {
  tempToken: "",
});

// 用独立 flow 承载 loading/error；username 字段在 2FA 场景无需填写。
const flow = useLoginFlow({
  redirect: null,
  onSuccess: () => emit("success", t("auth.twoFactor.verifyPassed")),
});

const totpCode = ref("");
const showRecovery = ref(false);
const recoveryCode = ref("");
const recoveryLoading = ref(false);

const loading = flow.loading;
const error = flow.error;

async function handleTOTPSubmit() {
  flow.error.value = null;
  if (!/^\d{6}$/.test(totpCode.value)) {
    flow.error.value = t("auth.twoFactor.enter6DigitError");
    return;
  }
  // tempToken 为 TOTP 验证的唯一来源；显式传入 flow.submit2FA（覆盖 flow 自身兜底空值）
  await flow.submit2FA(totpCode.value, props.tempToken);
}

async function handleRecoverySubmit() {
  flow.error.value = null;
  const code = recoveryCode.value.trim();
  if (!code) {
    flow.error.value = t("auth.twoFactor.enterRecoveryCode");
    return;
  }
  recoveryLoading.value = true;
  try {
    // 必须走 flow.submit2FA：它会在成功后写 token / 拉用户 / 持久化 / 触发 onSuccess(),
    // 组件内自己调 verify2FA 只会 emit success，用户被当作已登录跳转而 store 仍是匿名。
    await flow.submit2FA("", props.tempToken, code);
  } finally {
    recoveryLoading.value = false;
  }
}
</script>
