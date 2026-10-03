// document-store 是纯 localStorage 实现（不用 IndexedDB），node 环境无 localStorage，
// 这里提供一个最小内存 shim 即可；无需 fake-indexeddb。
// 模块内 draftsCache/indexCache 为模块私有且首次读取后常驻，故用 vi.resetModules() +
// 动态 import 让每个用例拿到全新模块状态，保证确定性。

import { describe, it, expect, beforeEach, vi } from "vitest";

// —— 最小 localStorage shim（挂在 globalThis，resetModules 不影响它）——
const store = new Map<string, string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const local: any = {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => {
    store.set(k, String(v));
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => {
    store.clear();
  },
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  get length() {
    return store.size;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (!g.localStorage) {
  g.localStorage = local;
}

describe("document-store slug 贯通", () => {
  beforeEach(() => {
    store.clear();
    // 重置模块，使每个用例拿到独立的 document-store 实例（清掉模块私有缓存）
    vi.resetModules();
  });

  it("发布(updateDocument+slug)后 listDocuments() 能读到 slug", async () => {
    const { createDocument, updateDocument, listDocuments, getDocument } =
      await import("../document-store");

    const created = createDocument("关于项目");
    // isOk() 窄化到 Ok，之后才可访问 .value
    expect(created.isOk()).toBe(true);
    if (!created.isOk()) return;
    const doc = created.value;

    // 草稿态：还没发布，slug 应为 undefined
    expect(listDocuments()[0].slug).toBeUndefined();
    expect(getDocument(doc.id)!.slug).toBeUndefined();

    // 发布：write slug 进 DocumentData（等价 handlePublish→saveDocument→updateDocument）
    const pub = updateDocument(doc.id, {
      title: "关于项目",
      slug: "about-project",
      status: "published",
    });
    expect(pub.isOk()).toBe(true);

    // 索引与正文都应带 slug
    const summary = listDocuments()[0];
    expect(summary.slug).toBe("about-project");
    expect(getDocument(doc.id)!.slug).toBe("about-project");
  });

  it("autosave 保留既有 slug（不丢发布信息）", async () => {
    const {
      createDocument,
      updateDocument,
      autosave,
      listDocuments,
      getDocument,
    } = await import("../document-store");

    const created = createDocument("笔记");
    if (!created.isOk()) return;
    const doc = created.value;
    updateDocument(doc.id, { slug: "notes", status: "published" });

    // autosave 更新内容，slug 应延续
    autosave(doc.id, {
      contentMdx: "正文",
      editorJson: { type: "doc", content: [] },
      baseVersion: 2,
    });

    const summary = listDocuments()[0];
    expect(summary.slug).toBe("notes");
    expect(getDocument(doc.id)!.slug).toBe("notes");
  });

  it("listDocuments 返回的操作可直接访问 slug（无需 cast）", async () => {
    const { createDocument, listDocuments } = await import("../document-store");
    const created = createDocument("A");
    expect(created.isOk()).toBe(true);
    if (!created.isOk()) return;
    updateWithSlug(created.value.id, "a");

    const s = listDocuments()[0];
    // 生效于「类型层面可 d.slug」：此处仅做运行期字段存在断言
    expect("slug" in s).toBe(true);
  });

  it("本地适配器连续保存时保留递增版本号", async () => {
    const { createDocument } = await import("../document-store");
    const { createLocalPersistence } = await import("../index");
    const created = createDocument("连续编辑");
    if (!created.isOk()) return;
    const adapter = createLocalPersistence();
    const first = { ...created.value, version: 2, contentMdx: "AB" };

    expect(await adapter.saveDocument(first)).toBe(true);
    expect((await adapter.loadDocument(first.id))?.version).toBe(2);

    const second = { ...first, version: 3, contentMdx: "A" };
    expect(await adapter.saveDocument(second)).toBe(true);
    expect(await adapter.loadDocument(first.id)).toMatchObject({
      version: 3,
      contentMdx: "A",
    });
  });

  async function updateWithSlug(id: string, slug: string): Promise<void> {
    const { updateDocument } = await import("../document-store");
    updateDocument(id, { slug, status: "published" });
  }
});
