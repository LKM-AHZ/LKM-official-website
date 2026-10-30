import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }));

const values = new Map<string, string>();

beforeEach(() => {
  vi.resetModules();
  values.clear();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("树洞本地数据兼容", () => {
  it("沿用原有草稿键并按 id 更新，保持收藏默认分组与列表同步", async () => {
    const storage = await import("../index");
    storage.saveDraft({ id: "draft", text: "first" });
    storage.saveDraft({ id: "draft", text: "edited" });
    expect(JSON.parse(values.get("th_drafts")!)).toEqual([
      { id: "draft", text: "edited" },
    ]);
    storage.addFavGroup("留念");
    storage.toggleFavorite("letter");
    expect(storage.getFavGroups()[0]).toMatchObject({
      id: "default",
      ids: ["letter"],
    });
    storage.resetDrafts();
    expect(storage.getDrafts()).toEqual([]);
  });

  it("备份可往返恢复设置、草稿与旧版本地信件", async () => {
    const storage = await import("../index");
    storage.saveSettings({ highContrast: true, rateLimit: 8 });
    storage.saveDraft({ id: "draft", text: "private" });
    storage.addLetter({ id: "letter", status: "published", content: "legacy" });
    const backup = storage.exportAll();
    expect(JSON.parse(backup).__meta).toMatchObject({
      app: "shiguang-treehole",
      version: 1,
    });
    storage.resetAll();
    expect(storage.importAll(backup)).toBe(true);
    expect(storage.getSettings()).toMatchObject({
      highContrast: true,
      rateLimit: 8,
    });
    expect(storage.getDrafts()).toEqual([{ id: "draft", text: "private" }]);
    expect(storage.getLetters()[0].content).toBe("legacy");
  });

  it("损坏备份不会部分覆盖已有数据", async () => {
    const storage = await import("../index");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.saveDraft({ id: "keep" });
    const before = [...values];
    expect(
      storage.importAll(JSON.stringify({ drafts: [], settings: [] })),
    ).toBe(false);
    expect([...values]).toEqual(before);
  });

  it("SSR 导入时读取和保存草稿不访问浏览器存储", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("localStorage", undefined);
    const storage = await import("../index");
    expect(storage.getDrafts()).toEqual([]);
    expect(storage.getSettings().fontScale).toBe("normal");
    expect(() => storage.saveDraft({ id: "ssr" })).not.toThrow();
  });
});
