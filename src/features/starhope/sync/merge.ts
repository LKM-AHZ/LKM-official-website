export interface TombstoneInput {
  id: string;
  deleted_at: string;
}

/**
 * 远端版本是否应当胜出。
 * 原来直接用字符串比较 ISO 时间：字段缺失时 `undefined >= x` 恒为 false，
 * 会把更新的远端记录静默丢弃；精度/时区不一致的 ISO 串也排不对序。
 * 这里改为按时间戳比较：远端时间不可用则保留本地；本地时间不可用则以远端兜底。
 * 时间相等仍判远端胜出，与原 `>=` 语义保持一致。
 */
function remoteWins(remote: unknown, local: unknown): boolean {
  const r = typeof remote === "string" ? Date.parse(remote) : NaN;
  const l = typeof local === "string" ? Date.parse(local) : NaN;
  if (!Number.isFinite(r)) return false;
  return !Number.isFinite(l) || r >= l;
}

/**
 * 合并增量 pull 结果到本地记录（均为 camelCase 后的对象）。
 * 规则：items 里本地已有同 id 取 updatedAt 较新者；tombstone 以 deleted_at 参与比较，晚者胜。
 */
export function mergePull(
  local: Record<string, unknown>[],
  items: Record<string, unknown>[],
  tombstones: TombstoneInput[],
): Record<string, unknown>[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const r of local) {
    // 无有效 id 的记录不能进 map：否则会全部塌缩到同一个 undefined 键上互相覆盖
    if (typeof r.id === "string" && r.id.length > 0) byId.set(r.id, r);
  }

  for (const item of items) {
    const id = item.id;
    if (typeof id !== "string" || id.length === 0) continue;
    const existing = byId.get(id);
    if (!existing || remoteWins(item.updatedAt, existing.updatedAt)) {
      byId.set(id, item);
    }
  }

  for (const tomb of tombstones) {
    const existing = byId.get(tomb.id);
    if (existing && remoteWins(tomb.deleted_at, existing.updatedAt)) {
      byId.delete(tomb.id);
    }
  }

  // 浅拷贝后再返回：结果会被写回本地集合，若与 local/items 共享对象引用，
  // 调用方一次 in-place 修改就会连带改到入参集合，串改极难追
  return [...byId.values()].map((r) => ({ ...r }));
}
