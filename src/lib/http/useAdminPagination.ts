// src/lib/http/useAdminPagination.ts — 后台列表统一分页（包装 usePagination）
//
// 后台各 Table（reports/users/files/posts）原先各自手写 page/loading/error 且
// 用 `size` 参数错误地请求（后端 PaginateDep 认 `limit`）。这里统一：
//  - 用 adminFetch + readAdminResp 取 {items,total,page,pages}
//  - 正确传 page+limit（上限 100）
//  - 复用 usePagination 的 refresh/goPage/失败不丢页语义

import { usePagination } from "./usePagination";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";
import type { PaginatedResponse } from "~/lib/api/types";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import { err, ok } from "~/lib/errors/result";
import type { Result } from "~/lib/errors/result";
import { type Ref } from "vue";

export interface AdminPagination<T> {
  items: Ref<T[]>;
  total: Ref<number>;
  page: Ref<number>;
  totalPages: Ref<number>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  refresh: () => Promise<void>;
  goTo: (page: number) => void;
}

export function useAdminPagination<T>(
  buildPath: (page: number, limit: number) => string,
  pageSize = 20,
): AdminPagination<T> {
  const loader = async (
    page: number,
    limit: number,
  ): Promise<Result<PaginatedResponse<T>, AppError>> => {
    try {
      const res = await adminFetch(buildPath(page, limit));
      const body = await readAdminResp(res);
      const data = body.data as PaginatedResponse<T>;
      return ok({
        items: data.items,
        total: data.total,
        page: data.page,
        pages: data.pages,
      });
    } catch (e) {
      return err(
        new AppError(
          ErrorCode.NETWORK_ERROR,
          e instanceof Error ? e.message : t("admin.loadFailed"),
        ),
      );
    }
  };

  const pag = usePagination<T>({ loader, limit: pageSize });

  return {
    items: pag.items,
    total: pag.total,
    page: pag.page,
    totalPages: pag.totalPages,
    loading: pag.loading,
    error: pag.error,
    refresh: pag.refresh,
    goTo: (p: number) => void pag.goPage(p),
  };
}
