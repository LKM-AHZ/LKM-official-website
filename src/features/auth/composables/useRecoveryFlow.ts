import { reactive, ref, computed } from "vue";
import { authApi } from "~/lib/api/modules/auth";
import type { RecoverRequires2FA } from "~/lib/api/modules/auth";
import { t } from "~/lib/i18n";
import type { Result } from "~/lib/errors/result";
import type { AppError } from "~/lib/errors/error-codes";

/** recoverEmail/Phone/MagicLinkVerify 三个入口返回类型一致，显式标注避免 `let r` 退化成 evolving any */
type RecoverVerifyResult = Result<RecoverRequires2FA, AppError>;

export type RecoveryStage = "account" | "verify" | "2fa" | "reset" | "done";
export type RecoveryContact = "email" | "phone" | "magic";

export interface RecoveryFlowOptions {
  onSuccess?: (msg: string) => void;
}

export interface RecoveryFlow {
  stage: RecoveryStage;
  account: string;
  contact: RecoveryContact;
  code: string;
  txnId: string;
  tempToken: string;
  newPassword: string;
  confirm: string;
  loading: boolean;
  error: string | null;
  successMessage: string;
  isContactValid: boolean;
  requestCode: () => Promise<void>;
  verifyCode: () => Promise<void>;
  submit2FA: (totp: string) => Promise<void>;
  stepReset: () => Promise<void>;
  reset: () => void;
}

/**
 * 找回密码 Composable —— 对齐真实后端多步流程：
 * account(填邮箱/手机) → 发码 → verify 验证码：
 *   - 非 MFA 用户：verify 时后端直接完成重置（需 new_password）
 *   - MFA 用户：返回 txn_id + temp_token → 2FA(TOTP) → verifyTotp → complete(new_password)
 * 另支持 Magic Link 发送。
 */
/** 新密码最小长度：客户端只做第一道校验，后端仍有自己的规则；提成常量避免与文案/测试各写一份 */
export const MIN_PASSWORD_LENGTH = 6;

export function useRecoveryFlow(
  options: RecoveryFlowOptions = {},
): RecoveryFlow {
  const { onSuccess } = options;

  const stage = ref<RecoveryStage>("account");
  const account = ref("");
  const contact = ref<RecoveryContact>("email");
  const code = ref("");
  const txnId = ref("");
  const tempToken = ref("");
  const newPassword = ref("");
  const confirm = ref("");
  const loading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref("");

  const isContactValid = computed(() => {
    const v = account.value.trim();
    if (!v) return false;
    if (contact.value === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (contact.value === "phone") return /^[+\d][\s\d-]{4,}$/.test(v);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  });

  function fail(msg?: string): void {
    error.value = msg ?? t("messages.operationFailed");
  }

  // ── Step 1: 发送验证码 ──
  async function requestCode(): Promise<void> {
    error.value = null;
    const value = account.value.trim();
    if (!value) return fail(t("messages.recovery.enterAccount"));
    loading.value = true;
    try {
      if (contact.value === "email") {
        const r = await authApi.recoverEmail(value);
        if (r.isErr()) return fail(r.error.message);
      } else if (contact.value === "phone") {
        const r = await authApi.recoverPhone(value);
        if (r.isErr()) return fail(r.error.message);
      } else {
        const r = await authApi.recoverMagicLink(value);
        if (r.isErr()) return fail(r.error.message);
      }
      stage.value = "verify";
      successMessage.value = t("messages.auth.codeSent");
    } finally {
      loading.value = false;
    }
  }

  // ── Step 2: 校验验证码（可能触发 2FA 分流）──
  async function verifyCode(): Promise<void> {
    error.value = null;
    const value = account.value.trim();
    if (!code.value.trim()) return fail(t("messages.recovery.enterCode"));
    loading.value = true;
    try {
      let r: RecoverVerifyResult;
      if (contact.value === "email") {
        r = await authApi.recoverEmailVerify(value, code.value.trim());
      } else if (contact.value === "phone") {
        r = await authApi.recoverPhoneVerify(value, code.value.trim());
      } else {
        // magic link: token 已在邮件链接中，通常通过 URL callback 直接进入 verify。
        r = await authApi.recoverMagicLinkVerify(code.value.trim());
      }
      if (r.isErr()) return fail(r.error.message);

      const data = r.value;
      if (data.requires_2fa) {
        // MFA 分流：暂存 txn + temp_token，进入 TOTP 验证
        txnId.value = data.txn_id ?? "";
        tempToken.value = data.temp_token ?? "";
        stage.value = "2fa";
        return;
      }
      // 非 MFA：后端在 verify 时已用 new_password 直接完成重置 → 进入密码重置确认步
      stage.value = "reset";
    } finally {
      loading.value = false;
    }
  }

  // ── Step 2.5: MFA 时的 TOTP 验证 ──
  async function submit2FA(totp: string): Promise<void> {
    error.value = null;
    if (!tempToken.value)
      return fail(t("messages.recovery.missingSessionToken"));
    if (!/^\d{6}$/.test(totp))
      return fail(t("messages.recovery.enterSixDigitTotp"));
    loading.value = true;
    try {
      const v = await authApi.verify2FA(tempToken.value, totp);
      if (v.isErr()) return fail(v.error.message);
      const vt = await authApi.recoverVerifyTotp(txnId.value, tempToken.value);
      if (vt.isErr()) return fail(vt.error.message);
      stage.value = "reset";
    } finally {
      loading.value = false;
    }
  }

  // ── Step 3: 设置新密码（MFA 场景走完 verify-totp 后；非 MFA 场景由 verify 直接带新密码）──
  async function stepReset(): Promise<void> {
    error.value = null;
    if (newPassword.value.length < MIN_PASSWORD_LENGTH)
      return fail(t("messages.recovery.passwordTooShort"));
    if (newPassword.value !== confirm.value)
      return fail(t("messages.recovery.passwordMismatch"));
    loading.value = true;
    try {
      const value = account.value.trim();
      if (!txnId.value) {
        // 非 MFA：传给 verify 步作为新密码
        let r: RecoverVerifyResult;
        if (contact.value === "email") {
          r = await authApi.recoverEmailVerify(
            value,
            code.value.trim(),
            newPassword.value,
          );
        } else if (contact.value === "phone") {
          r = await authApi.recoverPhoneVerify(
            value,
            code.value.trim(),
            newPassword.value,
          );
        } else {
          r = await authApi.recoverMagicLinkVerify(
            code.value.trim(),
            newPassword.value,
          );
        }
        if (r.isErr()) return fail(r.error.message);
      } else {
        // MFA：走 complete
        const r = await authApi.recoverComplete(txnId.value, newPassword.value);
        if (r.isErr()) return fail(r.error.message);
      }
      stage.value = "done";
      if (typeof onSuccess === "function")
        onSuccess(t("messages.recovery.resetSuccess"));
    } finally {
      loading.value = false;
    }
  }

  // ── 重置 ──
  function reset(): void {
    stage.value = "account";
    account.value = "";
    code.value = "";
    txnId.value = "";
    tempToken.value = "";
    newPassword.value = "";
    confirm.value = "";
    loading.value = false;
    error.value = null;
    successMessage.value = "";
  }

  return reactive({
    stage,
    account,
    contact,
    code,
    txnId,
    tempToken,
    newPassword,
    confirm,
    loading,
    error,
    successMessage,
    isContactValid,
    requestCode,
    verifyCode,
    submit2FA,
    stepReset,
    reset,
  });
}
