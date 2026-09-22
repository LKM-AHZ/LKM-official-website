// node 测试环境无原生 IndexedDB，用 fake-indexeddb 提供，使 Dexie 持久化可用于集成式断言
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import Dexie from "dexie";
import {
  BLOB_REF_PREFIX,
  collectImageSrcs,
  saveImageBlob,
  findImageByOrgName,
} from "../image-store";

describe("image-store 纯逻辑", () => {
  it("collectImageSrcs 收集嵌套 image 节点 src", () => {
    const json = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: "blob:a", alt: "" } },
        {
          type: "paragraph",
          content: [
            { type: "image", attrs: { src: "http://x/y.png", alt: "" } },
          ],
        },
        { type: "text", text: "no img" },
      ],
    };
    expect(collectImageSrcs(json)).toEqual(["blob:a", "http://x/y.png"]);
  });

  it("对空/无图片文档返回空数组", () => {
    expect(collectImageSrcs({ type: "doc", content: [] })).toEqual([]);
    expect(collectImageSrcs(null)).toEqual([]);
    expect(collectImageSrcs(undefined)).toEqual([]);
  });
});

describe("image-store orgName 索引", () => {
  beforeEach(async () => {
    await Dexie.delete("lkm-editor-images");
  });

  it("saveImageBlob 带 orgName 后可按名查询", async () => {
    const blob = new Blob(["x"], { type: "image/png" });
    const ref = await saveImageBlob(blob, "pic.png");
    const found = await findImageByOrgName("pic.png");
    expect(found).toBe(ref);
    expect(sortedPrefixRef(found)).toBe(true);
  });

  it("无 orgName 时 findImageByOrgName 返回 null", async () => {
    const blob = new Blob(["x"], { type: "image/png" });
    await saveImageBlob(blob);
    const found = await findImageByOrgName("pic.png");
    expect(found).toBeNull();
  });
});

function sortedPrefixRef(x: string | null): boolean {
  // 引用前缀必须引用导出的常量：写死字面量会在前缀变更时静默失效
  //（`blob:` 是原生 ObjectURL 的 scheme，已改用 `idb:`，见 image-store.ts 的说明）
  return typeof x === "string" && x.startsWith(BLOB_REF_PREFIX);
}
