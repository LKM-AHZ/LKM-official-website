// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useLoginFlow } from "../composables/useLoginFlow";
import { useVerificationCountdown } from "../composables/useVerificationCountdown";
import * as authModule from "~/lib/api/modules/auth";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("useVerificationCountdown", () => {
  it("倒计时结束后归零并停止", async () => {
    vi.useFakeTimers();
    const c = useVerificationCountdown(2);
    c.start();
    expect(c.running).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(c.countdown).toBe(0);
    expect(c.running).toBe(false);
    vi.useRealTimers();
  });
});

describe("useLoginFlow", () => {
  it("密码登录成功：置 loggedIn 显示成功卡并触发 onSuccess（不跳转）", async () => {
    vi.spyOn(authModule.authApi, "loginPassword").mockResolvedValue(
      ok({
        access_token: "a",
        refresh_token: "r",
        user_id: "00000000-0000-7000-8000-000000000001",
        account_level: "local",
      }),
    );
    vi.spyOn(authModule.authApi, "getMe").mockResolvedValue(
      ok({
        id: "00000000-0000-7000-8000-000000000001",
        username: "alma",
        account_level: "local",
      }),
    );
    const onSuccess = vi.fn();
    const flow = useLoginFlow({ redirect: null, onSuccess });
    flow.account = "alma";
    flow.password = "123456";
    await flow.submitPassword();
    expect(flow.loggedIn).toBe(true);
    expect(onSuccess).toHaveBeenCalled();
  });

  it("透出的 countdown / countdownRunning 响应式实时递减", async () => {
    vi.useFakeTimers();
    const flow = useLoginFlow({ redirect: null });
    // 触发 requestCode 以启动倒计时（注入 mock 避免真实网络）
    vi.spyOn(authModule.authApi, "requestLoginCode").mockResolvedValue(
      ok({ message: "ok" }),
    );
    flow.account = "alma";
    await flow.requestCode();
    expect(flow.countdownRunning).toBe(true);
    expect(flow.countdown).toBe(60);
    vi.advanceTimersByTime(3000);
    expect(flow.countdown).toBe(57);
    expect(flow.countdownRunning).toBe(true);
    vi.useRealTimers();
  });

  it("密码错误显示中文 error 且不触发 onSuccess", async () => {
    vi.spyOn(authModule.authApi, "loginPassword").mockResolvedValue(
      err(new AppError(ErrorCode.AUTH_ERROR as never, "密码错误")),
    );
    const onSuccess = vi.fn();
    const flow = useLoginFlow({ redirect: null, onSuccess });
    flow.account = "x";
    flow.password = "y";
    await flow.submitPassword();
    expect(flow.error).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
