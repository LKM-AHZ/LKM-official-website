import { describe, expect, it, vi } from "vitest";
import { createGitPersistence } from "../git-persistence";

const api = vi.hoisted(() => ({
  getFileContent: vi.fn(async () => ({
    isErr: () => false,
    value: { content: "# Article\n\nAB" },
  })),
  putSeriesFile: vi.fn(async () => ({ isErr: () => false })),
}));

vi.mock("~/lib/api", () => ({ blogApi: api }));

describe("git persistence session versions", () => {
  it("reports the last successfully saved version for subsequent edits", async () => {
    const adapter = createGitPersistence("series-id", "article.mdx");
    const first = await adapter.loadDocument("article.mdx");
    expect(first?.version).toBe(1);
    if (!first) return;

    expect(await adapter.saveDocument({ ...first, version: 2 })).toBe(true);
    expect((await adapter.loadDocument("article.mdx"))?.version).toBe(2);
    expect(
      await adapter.saveDocument({ ...first, version: 3, contentMdx: "A" }),
    ).toBe(true);
    expect((await adapter.loadDocument("article.mdx"))?.version).toBe(3);
  });
});
