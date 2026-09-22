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
  // 契约用 boolean 而非 "verified" 魔法串：调用方只关心「是否通过」，
  // 依赖某个面向 UI 的字面量是否 truthy 既隐式又易碎。
  let resolver: ((ok: boolean) => void) | null = null;
  let pending: Promise<boolean> | null = null;
  // 每次 requireCode/finish 递增：在途的 adminVerify2FA 用发起时的代数校验，
  // 取消或重新发起后不再回写 dialog 状态，也不会把验证结果交给新一轮的调用方。
  let generation = 0;

  function requireCode(): Promise<boolean> {
    dialog.open = true;
    dialog.error = "";
    // 已有 step-up 在途时复用同一个 promise：直接覆盖 resolver 会让先前的调用永远挂起，
    // 并可能把验证结果交给错误的调用方。
    if (pending) return pending;
    pending = new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
    return pending;
  }

  function finish(ok: boolean): void {
    dialog.open = false;
    dialog.error = "";
    // 关闭即复位提交态：下一轮弹窗不应继承上一轮的 submitting
    dialog.submitting = false;
    const resolve = resolver;
    resolver = null;
    pending = null;
    generation += 1;
    resolve?.(ok);
  }

  function onCancel(): void {
    finish(false);
  }

  async function onCode(code: string): Promise<void> {
    const gen = generation;
    dialog.submitting = true;
    dialog.error = "";
    try {
      await adminVerify2FA(code.trim());
      if (gen !== generation) return; // 期间已取消/重新发起：本次结果作废
      finish(true);
    } catch (e) {
      if (gen !== generation) return;
      dialog.submitting = false;
      dialog.error = e instanceof Error ? e.message : t("admin.mfaInvalidCode");
    }
  }

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    try {
      return await action();
    } catch (e) {
      if (!(e instanceof AdminMFARequiredError)) throw e;
      const ok = await requireCode();
      if (!ok) return null; // 用户取消
    }
    // 用户已完成 2FA（cookie 已带信任），重放原 action
    return await action();
  }

  return { dialog, run, onCancel, onCode };
}
