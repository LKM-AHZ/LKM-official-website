// useAdminMFA — 后台危险操作 2FA step-up 编排。
// 执行 action；遇 AdminMFARequiredError（后台 cookie 会话缺 1h 2FA 信任）弹窗，
// 用户提交 TOTP（adminVerify2FA 换带信任的 cookie）后自动重放原 action。
// 与 AdminMFAVerifyDialog.vue 搭配渲染。

import { reactive } from "vue";
import { adminVerify2FA, AdminMFARequiredError } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

export interface AdminMFAState {
  open: boolean;
  submitting: boolean;
  error: string;
}

export interface UseAdminMFA {
  dialog: AdminMFAState;
  run: <T>(action: () => Promise<T>) => Promise<T | null>;
  onCancel: () => void;
  onCode: (code: string) => Promise<void>;
}

export function useAdminMFA(): UseAdminMFA {
  const dialog = reactive<AdminMFAState>({
    open: false,
    submitting: false,
    error: "",
  });
  let resolver: ((code?: string) => void) | null = null;

  function requireCode(): Promise<string | undefined> {
    dialog.open = true;
    dialog.error = "";
    return new Promise<string | undefined>((resolve) => {
      resolver = resolve;
    });
  }

  function finish(code?: string): void {
    dialog.open = false;
    dialog.error = "";
    resolver?.(code);
    resolver = null;
  }

  function onCancel(): void {
    finish(undefined);
  }

  async function onCode(code: string): Promise<void> {
    dialog.submitting = true;
    dialog.error = "";
    try {
      await adminVerify2FA(code.trim());
      finish("verified");
    } catch (e) {
      dialog.error = e instanceof Error ? e.message : t("admin.mfaInvalidCode");
    } finally {
      dialog.submitting = false;
    }
  }

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    try {
      return await action();
    } catch (e) {
      if (!(e instanceof AdminMFARequiredError)) throw e;
      const code = await requireCode();
      if (!code) return null; // 用户取消
    }
    // 用户已完成 2FA（cookie 已带信任），重放原 action
    return await action();
  }

  return { dialog, run, onCancel, onCode };
}
