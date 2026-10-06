// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminLogin } from "~/lib/api/admin";

afterEach(() => vi.restoreAllMocks());

describe("adminLogin", () => {
  it("shows the credential error returned by the login endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 3, message: "用户名或密码错误" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    await expect(adminLogin("root", "bad")).rejects.toThrow("用户名或密码错误");
    vi.unstubAllGlobals();
  });
});
