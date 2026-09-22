export interface QaDraft {
  title: string;
  situation: string;
  detail: string;
  bountyPeople: number | null;
  bountyPerPerson: number | null;
  images: string[];
}

export const QA_DRAFT_STORAGE_KEY = "lkm-qa-draft";

// 草稿来自 localStorage，可被手工改写：金额与人数字段只做 typeof 检查会放过负数、小数，
// 进而把非法值带进 submit 载荷与总悬赏展示
function nonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

export function parseDraft(raw: string | null): QaDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<QaDraft>;
    // 数组的 typeof 也是 "object"，被篡改成 "[1,2,3]" 之类会当成合法草稿静默映射成空表单，故显式排除
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }
    return {
      title: typeof value.title === "string" ? value.title : "",
      situation: typeof value.situation === "string" ? value.situation : "",
      detail: typeof value.detail === "string" ? value.detail : "",
      bountyPeople: (() => {
        const n = nonNegativeNumber(value.bountyPeople);
        return n === null ? null : Math.floor(n);
      })(),
      bountyPerPerson: nonNegativeNumber(value.bountyPerPerson),
      images: Array.isArray(value.images)
        ? value.images.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    };
  } catch {
    return null;
  }
}

export function serializeDraft(draft: QaDraft): string {
  return JSON.stringify(draft);
}

export function computeTotalBounty(
  people: number | null,
  perPerson: number | null,
): number {
  // 任一操作数为负/非有限值都会算出「负悬赏」或 NaN 并直接显示在页面上，故在此收敛
  return Math.max(0, (people ?? 0) * (perPerson ?? 0));
}
