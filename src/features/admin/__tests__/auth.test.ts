// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminFetch, adminLogin } from "~/lib/api/admin";

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

describe("adminFetch", () => {
  it("keeps the admin page open when one widget lacks permission", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 })),
    );
    const response = await adminFetch("/api/v1/admin/stats");
    expect(response.status).toBe(403);
    vi.unstubAllGlobals();
  });
});
