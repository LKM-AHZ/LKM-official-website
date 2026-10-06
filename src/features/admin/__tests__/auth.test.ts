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

  it("refreshes one expired session for concurrent requests and retries them", async () => {
    let refreshes = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/auth/refresh")) {
        refreshes++;
        return new Response(JSON.stringify({ code: 0, data: {} }), {
          status: 200,
        });
      }
      return new Response("{}", { status: refreshes ? 200 : 401 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const results = await Promise.all([
      adminFetch("/api/v1/admin/stats"),
      adminFetch("/api/v1/admin/users"),
    ]);
    expect(results.map((response) => response.status)).toEqual([200, 200]);
    expect(refreshes).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    vi.unstubAllGlobals();
  });
});
