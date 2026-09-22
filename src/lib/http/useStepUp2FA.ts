// src/lib/http/useStepUp2FA.ts
// 前台危险操作 2FA step-up 共享编排：
//   - 执行危险操作(action)时若收到 MFARequiredError(会话有效但缺 1h 信任)，
//     自动弹 StepUp2FADialog，用户输 TOTP 换取带信任的新 token 后重放原 action。
//   - 弹窗状态收敛在 dialog reactive 对象，由 StepUp2FADialog 绑定渲染。

import { getCurrentScope, onScopeDispose, reactive } from "vue";
import { authApi } from "~/lib/api/modules/auth";
import { useAuthStore } from "~/stores/auth";
import { setHttpTokens } from "~/lib/http/client";
import { MFARequiredError } from "~/lib/errors/error-codes";
import type { AppError } from "~/lib/errors/error-codes";
import type { Result } from "~/lib/errors/result";
import { t } from "~/lib/i18n";

/** StepUp2FADialog 绑定的弹窗状态。 */
export interface StepUpDialogState {
  open: boolean;
  submitting: boolean;
  error: string;
  message: string;
}

export interface UseStepUp2FA {
  dialog: StepUpDialogState;
  /** 收敛全部 MFA 编排：执行 action；遇 MFARequiredError 弹窗验证后自动重试，返回最终结果。 */
  run: <T>(
    action: () => Promise<Result<T, AppError>>,
  ) => Promise<Result<T, AppError>>;
  /** 用户取消弹窗。 */
  onCancel: () => void;
  /** 用户提交第二因素：TOTP 动态码或恢复码。 */
  onCode: (code: string, mode?: "totp" | "recovery") => Promise<void>;
}

export function useStepUp2FA(message?: string): UseStepUp2FA {
  const auth = useAuthStore();
  const dialog = reactive<StepUpDialogState>({
    open: false,
    submitting: false,
    error: "",
    message: message ?? t("messages.mfa.stepUpDialogMessage"),
  });

  // resolve(ok)：用户在弹窗里完成(cancel=false / verify成功=true)
  let resolver: ((ok: boolean) => void) | null = null;

  /** 开启弹窗并返回一个 Promise，用户完成(ok)或取消(ok=false)时 resolve。 */
  function requireCode(): Promise<boolean> {
    dialog.open = true;
    dialog.error = "";
    return new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  }

  function finish(ok: boolean): void {
    dialog.open = false;
    dialog.error = "";
    resolver?.(ok);
    resolver = null;
  }

  // 组件在弹窗打开期间卸载时，必须释放待决 Promise：否则调用方 run() 会永远挂起
  //（finish 只由 onCancel/onCode 触发）。getCurrentScope 守卫避免在非 setup 上下文调用时告警。
  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (resolver) finish(false);
    });
  }

  function onCancel(): void {
    finish(false);
  }

  async function onCode(
    code: string,
    mode: "totp" | "recovery" = "totp",
  ): Promise<void> {
    dialog.submitting = true;
    dialog.error = "";
    try {
      const trimmed = code.trim();
      const isRecovery = mode === "recovery";
      const r = await authApi.verifyStepUp2FA(
        isRecovery ? undefined : trimmed,
        isRecovery ? trimmed : undefined,
      );
      if (r.isErr()) {
        dialog.error = r.error.message || t("messages.mfa.invalidCode");
        return;
      }
      // 换发成功：写回 http 适配器 + 认证 store，获得 1h 信任
      const data = r.value;
      if (!data.access_token || !data.refresh_token) {
        // 缺 token 时不能算成功：重放动作会带着旧 token 再失败一次，
        // 而那时弹窗已关闭，用户看不到任何原因。保留弹窗让用户可重试。
        dialog.error = t("messages.operationFailed");
        return;
      }
      setHttpTokens(data.access_token, data.refresh_token);
      auth.setTokens(data.access_token, data.refresh_token);
      auth.persistToStorage();
      finish(true);
    } finally {
      dialog.submitting = false;
    }
  }

  async function run<T>(
    action: () => Promise<Result<T, AppError>>,
  ): Promise<Result<T, AppError>> {
    let result = await action();
    if (result.isErr() && result.error instanceof MFARequiredError) {
      const ok = await requireCode();
      if (!ok) return result; // 用户取消：返回原始 MFA 错误
      result = await action(); // 重放原危险操作（新 token 已带 1h 信任）
    }
    return result;
  }

  return { dialog, run, onCancel, onCode };
}
