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
        @click="setMode(false)"
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
        :disabled="loading || !totpValid"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        <span v-else>{{ t("auth.twoFactor.verify") }}</span>
      </button>
      <div class="text-center mt-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm text-xs"
          @click="setMode(true)"
        >
          {{ t("auth.twoFactor.useRecoveryCode") }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useLoginFlow } from "~/features/auth/composables/useLoginFlow";
import { t } from "~/lib/i18n";
import AuthField from "../shared/AuthField.vue";
import AuthStatus from "../shared/AuthStatus.vue";

// 只声明实际会发出的 success：原先还声明了 error 但从没 emit 过（失败只写 flow.error），
// 让父级以为能监听失败。该组件当前全仓无引用，补 emit 也不会有消费者，故按「契约诚实」直接删掉
const emit = defineEmits<{
  (e: "success", msg: string): void;
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

// TOTP 固定 6 位数字：只判长度会把 "abcdef" / 带空格的输入也放过去，
// 提交时才报错；这里与 handleTOTPSubmit 用同一条正则
const totpValid = computed(() => /^\d{6}$/.test(totpCode.value.trim()));

/** 切换 TOTP / 恢复码：两种模式的残留（错误提示、已输入的码）都要清掉 */
function setMode(recovery: boolean): void {
  flow.error.value = null;
  totpCode.value = "";
  recoveryCode.value = "";
  showRecovery.value = recovery;
}

async function handleTOTPSubmit() {
  flow.error.value = null;
  if (!totpValid.value) {
    flow.error.value = t("auth.twoFactor.enter6DigitError");
    return;
  }
  // tempToken 为 TOTP 验证的唯一来源；显式传入 flow.submit2FA（覆盖 flow 自身兜底空值）
  await flow.submit2FA(totpCode.value.trim(), props.tempToken);
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
  } catch (e) {
    // submit2FA 内部只把 Err 结果写进 flow.error，抛出的异常（网络层等）会以未处理拒绝逃出去，
    // 用户看不到任何提示，这里兜底成可见错误
    flow.error.value =
      e instanceof Error ? e.message : t("messages.operationFailed");
  } finally {
    recoveryLoading.value = false;
  }
}
</script>
