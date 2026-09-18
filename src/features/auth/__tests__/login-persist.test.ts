// @vitest-environment happy-dom
// 复现：密码登录后，刷新（重建 store + restoreFromStorage）应保持登录。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "~/stores/auth";
import * as authModule from "~/lib/api/modules/auth";
import { ok } from "~/lib/errors/result";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("登录态刷新保持", () => {
  it("密码登录后将 token+user+isLoggedIn 持久化，重建 store 后仍登录", async () => {
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

    const store = useAuthStore();
    const r = await store.loginPassword("alma", "123456");
    expect(r.isOk()).toBe(true);

    // 登录后 localStorage 应包含完整会话（user 非空、isLoggedIn true、_token 存在）
    const saved = JSON.parse(localStorage.getItem("lkm-auth-store") || "{}");
    expect(saved._token).toBe("a");
    // 这行是根因断言：user 应为 alma，isLoggedIn 应为 true
    expect(saved.user?.username).toBe("alma");
    expect(saved.isLoggedIn).toBe(true);

    // 模拟刷新：清 Pinia，重建 store，从 localStorage 恢复
    setActivePinia(createPinia());
    const fresh = useAuthStore();
    fresh.restoreFromStorage();
    expect(fresh.isLoggedIn).toBe(true);
    expect(fresh.user?.username).toBe("alma");
  });
});
