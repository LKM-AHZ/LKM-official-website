import { beforeEach, describe, expect, it, vi } from "vitest";
import { ok } from "~/lib/errors/result";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock("~/lib/http/client", () => http);

describe("treehole API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    http.post.mockResolvedValue(ok({ ready: true }));
  });

  it("establishes one anonymous session before reading shared letters", async () => {
    http.get.mockResolvedValue(ok([{ id: "letter-1" }]));
    const { treeholeApi } = await import("./api");

    const [first, second] = await Promise.all([
      treeholeApi.letters("public"),
      treeholeApi.letters("mine"),
    ]);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(http.post).toHaveBeenCalledWith("/api/v1/treehole/session");
    expect(http.get).toHaveBeenCalledWith("/api/v1/treehole/letters", {
      scope: "public",
      page: 1,
      limit: 100,
    });
  });
});
