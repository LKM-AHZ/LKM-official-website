// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "~/stores/auth";
import { err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import { authApi } from "~/lib/api/modules/auth";

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useAuthStore 单一状态源", () => {
  it("初始 session 为 anonymous", () => {
    const s = useAuthStore();
    expect(s.session).toBe("anonymous");
    expect(s.isLoggedIn).toBe(false);
  });
  it("restoreAndValidate 校验失败时原子清除", async () => {
    // 在 authApi 层 mock getMe，让它返回错误，从而让 restoreAndValidate 命中失败分支（无网络依赖）
    vi.spyOn(authApi, "getMe").mockResolvedValue(
      err(new AppError(ErrorCode.UNKNOWN_ERROR, "x")),
    );
    const s = useAuthStore();
    s.setTokens("t", "r");
    s.user = {
      id: "00000000-0000-7000-8000-000000000001",
      username: "x",
      account_level: "local",
    };
    s.isLoggedIn = true;
    await s.restoreAndValidate();
    expect(s.isLoggedIn).toBe(false);
    expect(s.user).toBeNull();
    expect(localStorage.getItem("lkm-auth-store")).toBeNull();
  });
  it("loginPassword 失败保持 anonymous", async () => {
    // 在 authApi 层 mock loginPassword，让其返回错误，避免触发真实网络请求
    vi.spyOn(authApi, "loginPassword").mockResolvedValue(
      err(new AppError(ErrorCode.AUTH_ERROR, "账号或密码错误")),
    );
    const s = useAuthStore();
    const r = await s.loginPassword("nobody", "123456");
    expect(r.isErr()).toBe(true);
    expect(s.session).toBe("anonymous");
  });
});
