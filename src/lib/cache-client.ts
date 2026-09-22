/**
 * 客户端请求缓存层
 * 用 Map + TTL 做内存缓存，减少重复 API 请求。
 * 适合文章列表、标签列表等不频繁变化的数据。
 */

import { t } from "~/lib/i18n";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 分钟

const store = new Map<string, CacheEntry<unknown>>();

// 缓存条目上限。过期的条目只在「再次读到同一个 key」时才被清理，
// 因此永不复读的 key（分页/筛选/带 token 的 URL）会一直占内存到页面生命周期结束。
const MAX_ENTRIES = 200;

/** 超出上限时按插入序淘汰最旧的条目（Map 迭代顺序即插入顺序） */
function evictOldest(): void {
  if (store.size <= MAX_ENTRIES) return;
  for (const key of store.keys()) {
    store.delete(key);
    if (store.size <= MAX_ENTRIES) break;
  }
}

function now(): number {
  return Date.now();
}

/** 从缓存读取，过期或无数据返回 null */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/** 在途请求表：key → 尚未 settle 的请求，供并发去重 */
const inflight = new Map<string, Promise<{ data: unknown; error: string | null }>>();

/** 写入缓存 */
export function cacheSet<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  store.set(key, { data, expiresAt: now() + ttlMs });
  evictOldest();
}

/** 删除缓存 */
export function cacheDel(key: string): void {
  store.delete(key);
}

/** 清空所有缓存 */
export function cacheClear(): void {
  store.clear();
}

/**
 * SWR 风格的 fetch — 先返回缓存（秒开），后台静默更新
 * @returns 一个 ref-friendly 对象，调用者可自行赋值
 */
export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<{ data: T | null; fromCache: boolean; error: string | null }> {
  // 先检查缓存（如果有直接返回，同时后台更新）
  const cached = cacheGet<T>(cacheKey);

  const doFetch = async (): Promise<{
    data: T | null;
    error: string | null;
  }> => {
    try {
      // eslint-disable-next-line no-restricted-globals
      const res = await fetch(url);
      if (!res.ok)
        return {
          data: null,
          error: t("messages.httpError", { status: res.status }),
        };
      const json = await res.json();
      if (json.code === 0) {
        cacheSet(cacheKey, json.data as T, ttlMs);
        return { data: json.data as T, error: null };
      }
      return { data: null, error: json.msg || t("messages.unknownError") };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : t("messages.networkError"),
      };
    }
  };

  // 并发去重：同一 key 的多个并发调用共享同一个在途请求，避免重复打后端
  const fetchOnce = (): Promise<{ data: T | null; error: string | null }> => {
    const existing = inflight.get(cacheKey);
    if (existing) {
      return existing as Promise<{ data: T | null; error: string | null }>;
    }
    const pending = doFetch().finally(() => inflight.delete(cacheKey));
    inflight.set(
      cacheKey,
      pending as Promise<{ data: unknown; error: string | null }>,
    );
    return pending;
  };

  if (cached) {
    // 后台静默更新（不 await），下次访问拿到热数据。doFetch 内部已 try/catch、不会抛，
    // 所以这里只能靠返回值判断：失败时至少留一条日志，否则会一直静默供旧数据
    void fetchOnce().then((r) => {
      if (r.error) console.warn("[cache] 后台刷新失败:", r.error);
    });
    return { data: cached, fromCache: true, error: null };
  }

  const result = await fetchOnce();
  return { ...result, fromCache: false };
}
