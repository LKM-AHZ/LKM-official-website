// src/lib/http/usePagination.ts — 统一分页 hook
//
// 收敛前端各列表页手写分页，支持两种后端形态：
//  1. offset 分页（`PaginatedResponse{items,total,page,pages}`，前端读 body.total）
//  2. 游标分页（`{items, next_cursor}`，如 timeline feed）
//
// 行为对齐参考（Solar §2.1）：
//  - 刷新保留旧数据（clearOnRefresh 可关）
//  - 加载更多/翻页失败不丢已加载页，只复位 loading
//  - hasMore：offset 用 page < pages；游标用 next_cursor != null

import { ref, type Ref } from "vue";
import type { Result } from "~/lib/errors/result";
import type { AppError } from "~/lib/errors/error-codes";
import type { PaginatedResponse } from "~/lib/api/types";

/** 游标分页单页（timeline feed 形态）。 */
export interface CursorPage<T> {
  items: T[];
  next_cursor?: string | null;
}

type OffsetLoader<T> = (
  page: number,
  limit: number,
) => Promise<Result<PaginatedResponse<T>, AppError>>;

type CursorLoader<T> = (
  cursor: string | null,
  limit: number,
) => Promise<Result<CursorPage<T>, AppError>>;

export interface UsePaginationOptions<T> {
  /** offset 分页 loader。 */
  loader?: OffsetLoader<T>;
  /** 游标分页 loader（与 loader 二选一）。 */
  cursorLoader?: CursorLoader<T>;
  limit?: number;
  /** 刷新时是否清空旧列表（默认 false：保留旧数据避免抖动）。 */
  clearOnRefresh?: boolean;
  /** offset 模式是否首屏自动加载（默认 true）。 */
  immediate?: boolean;
}

export interface UsePagination<T> {
  items: Ref<T[]>;
  page: Ref<number>;
  total: Ref<number>;
  totalPages: Ref<number>;
  hasMore: Ref<boolean>;
  loading: Ref<boolean>;
  /** 是否处于首次加载（列表为空时的 loading）。 */
  initialLoading: Ref<boolean>;
  error: Ref<string | null>;
  refresh: () => Promise<void>;
  /** 翻到指定页（offset 模式）。 */
  goPage: (page: number) => Promise<void>;
  /** 加载下一批（offset 下一页 / 游标取 next_cursor）。 */
  loadMore: () => Promise<void>;
}

export function usePagination<T>(
  options: UsePaginationOptions<T>,
): UsePagination<T> {
  const {
    loader,
    cursorLoader,
    limit = 20,
    clearOnRefresh = false,
    immediate = true,
  } = options;

  const items = ref<T[]>([]) as Ref<T[]>;
  const page = ref(1);
  const total = ref(0);
  const totalPages = ref(0);
  const loading = ref(false);
  const initialLoading = ref(false);
  const error = ref<string | null>(null);
  const hasMore = ref(cursorLoader != null);
  const lastCursor = ref<string | null>(null);
  const endReached = ref(false);

  /** 统一：req 返回指定页数据，replaceAll 决定清空还是追加。 */
  async function fetchPage(
    p: number,
    cursor: string | null,
    replaceAll: boolean,
  ): Promise<void> {
    loading.value = true;
    let r: Result<CursorPage<T> | PaginatedResponse<T>, AppError>;
    if (cursorLoader) {
      r = await cursorLoader(cursor, limit);
    } else if (loader) {
      r = await loader(p, limit);
    } else {
      loading.value = false;
      return;
    }

    if (r.isErr()) {
      setError(r.error.message);
      loading.value = false;
      initialLoading.value = false;
      return;
    }

    const data = r.value;
    if (cursorLoader) {
      const c = data as CursorPage<T>;
      if (replaceAll) items.value = c.items;
      else items.value.push(...c.items);
      lastCursor.value = c.next_cursor ?? null;
      endReached.value = c.next_cursor == null || c.next_cursor === "";
      hasMore.value = !endReached.value;
    } else {
      const d = data as PaginatedResponse<T>;
      if (replaceAll) items.value = d.items;
      else items.value.push(...d.items);
      total.value = d.total;
      totalPages.value = d.pages;
      page.value = d.page;
      hasMore.value = d.page < d.pages;
    }
    error.value = null;
    loading.value = false;
    initialLoading.value = false;
  }

  function setError(msg: string): void {
    error.value = msg;
  }

  async function refresh(): Promise<void> {
    if (clearOnRefresh) items.value = [];
    page.value = 1;
    lastCursor.value = null;
    endReached.value = false;
    const firstLoad = items.value.length === 0;
    if (firstLoad) initialLoading.value = true;
    await fetchPage(1, null, true);
  }

  async function goPage(target: number): Promise<void> {
    if (!loader) return;
    await fetchPage(target, null, true);
  }

  async function loadMore(): Promise<void> {
    if (loading.value || !hasMore.value) return;
    if (cursorLoader) {
      await fetchPage(1, lastCursor.value, false);
    } else {
      await fetchPage(page.value + 1, null, false);
    }
  }

  if (immediate && !cursorLoader) {
    void refresh();
  }

  return {
    items,
    page,
    total,
    totalPages,
    hasMore,
    loading,
    initialLoading,
    error,
    refresh,
    goPage,
    loadMore,
  };
}
