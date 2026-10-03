import { describe, expect, it } from "vitest";
import { computeTotalBounty, parseDraft, serializeDraft } from "../draft";

describe("parseDraft", () => {
  it("空输入返回 null", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("")).toBeNull();
  });

  it("非法 JSON 返回 null", () => {
    expect(parseDraft("{bad json")).toBeNull();
  });

  it("非对象输入返回 null", () => {
    expect(parseDraft("42")).toBeNull();
  });

  it("缺失字段回填默认值", () => {
    expect(parseDraft('{"title":"t"}')).toEqual({
      title: "t",
      situation: "",
      detail: "",
      bountyEnabled: false,
      bountyPeople: null,
      bountyPerPerson: null,
      bountyDays: 7,
      urgent: false,
      images: [],
    });
  });

  it("images 回填并过滤非字符串项", () => {
    expect(parseDraft('{"images":["blob:a", 1, null, "blob:b"]}')).toEqual({
      title: "",
      situation: "",
      detail: "",
      bountyEnabled: false,
      bountyPeople: null,
      bountyPerPerson: null,
      bountyDays: 7,
      urgent: false,
      images: ["blob:a", "blob:b"],
    });
  });
});

describe("serializeDraft", () => {
  it("序列化后可被 parseDraft 还原", () => {
    const draft = {
      title: "t",
      situation: "s",
      detail: "d",
      bountyEnabled: true,
      bountyPeople: 3,
      bountyPerPerson: 10,
      bountyDays: 14,
      urgent: false,
      images: ["blob:a", "blob:b"],
    };
    expect(parseDraft(serializeDraft(draft))).toEqual(draft);
  });
});

describe("computeTotalBounty", () => {
  it("人数 × 人均", () => {
    expect(computeTotalBounty(3, 10)).toBe(30);
  });

  it("null 视为 0", () => {
    expect(computeTotalBounty(null, 10)).toBe(0);
    expect(computeTotalBounty(3, null)).toBe(0);
  });
});
