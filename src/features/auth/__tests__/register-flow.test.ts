// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useRegisterFlow } from "../composables/useRegisterFlow";
import { ok } from "~/lib/errors/result";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("useRegisterFlow", () => {
  it("本地注册不使用随机密码", async () => {
    // 本地注册会走 store.registerLocal → authApi.registerLocal
    const api = await import("~/lib/api/modules/auth");
    vi.spyOn(api.authApi, "registerLocal").mockResolvedValue(
      ok({
        access_token: "a",
        refresh_token: "r",
        user_id: "00000000-0000-7000-8000-000000000001",
        account_level: "local",
      }),
    );
    // 本地注册成功后 store 会 fetchMe 同步用户，注入 mock 避免真实网络
    vi.spyOn(api.authApi, "getMe").mockResolvedValue(
      ok({
        id: "00000000-0000-7000-8000-000000000001",
        username: "alma",
        account_level: "local",
      }),
    );

    const flow = useRegisterFlow();
    flow.type = "local";
    flow.username = "alma";
    flow.password = "pass123";
    flow.confirm = "pass123";
    await flow.submit();
    // 断言 authApi.registerLocal 收到用户输入的 password（而非随机值）
    expect(api.authApi.registerLocal).toHaveBeenCalledWith("alma", "pass123");
  });

  it("普通注册获取验证码后用 txnId 从 form 进入 verify 且不发真实请求外的状态", async () => {
    const api = await import("~/lib/api/modules/auth");
    vi.spyOn(api.authApi, "registerNormal").mockResolvedValue(
      ok({
        message: "ok",
        txn_id: "txn-1",
        email_sent: true,
        phone_sent: false,
      }),
    );
    const flow = useRegisterFlow();
    flow.type = "normal";
    flow.username = "alma";
    flow.password = "pass123";
    flow.confirm = "pass123";
    flow.contact = "alma@example.com";
    flow.useEmail = true;
    await flow.submit();
    expect(flow.stage).toBe("verify");
    expect(flow.txnId).toBe("txn-1");
    expect(api.authApi.registerNormal).toHaveBeenCalledWith(
      "alma",
      "pass123",
      "alma@example.com",
      null,
    );
  });
});
