import { mapExchange } from "@urql/core";
import type { Operation } from "@urql/core";
import { clearHttpSession, refreshSession } from "~/lib/http/client";
// 循环依赖安全：graphqlClient 仅在异步刷新回调内访问，模块求值阶段不触碰
import { graphqlClient } from "../client";

function isUnauthorized(error: unknown): boolean {
  const netErr = error as { networkError?: { status?: number } };
  return netErr?.networkError?.status === 401;
}

/**
 * 统一 GraphQL 错误处理 + 401 自动刷新重试。
 *
 * - 网络错误和 GraphQL errors 会 console.warn（Phase 2+ 可接入全局 toast）
 * - 检测到 401 时自动刷新 token，成功后重发原操作（带 _retry 标记防循环）
 * - 刷新失败则清空会话（等同登出）
 */
export const errorExchange = mapExchange({
  onError(error, operation) {
    // 401 自动刷新 + 重发原请求
    if (isUnauthorized(error)) {
      const retried =
        (operation.context as Record<string, unknown>)._retry === true;
      if (retried) {
        // 已重试过仍 401：刷新后的令牌同样无效，直接清会话并留诊断。
        // 原实现只在刷新成功分支里看 _retry，导致这里还要多刷一轮且失败被静默吞掉。
        console.warn("[GraphQL] 重试后仍 401，清空会话");
        clearHttpSession();
        return;
      }
      // 复用 HTTP 客户端的单飞刷新：两条 401 路径共用同一把锁与同一份结果判定
      refreshSession().then((outcome) => {
        if (outcome === "ok") {
          graphqlClient.reexecuteOperation({
            ...operation,
            context: { ...operation.context, _retry: true },
          } as Operation);
        } else if (outcome === "invalid") {
          clearHttpSession();
        } else {
          // 暂时性失败（网络/5xx）：保留会话，避免一次抖动即登出
          console.warn("[GraphQL] token 刷新暂时失败，保留会话待重试");
        }
      });
      return; // 已处理，跳过后续 console.warn
    }
    if (error.networkError) {
      console.warn("[GraphQL] Network error:", error.networkError.message);
    }
    if (error.graphQLErrors.length > 0) {
      for (const gqlErr of error.graphQLErrors) {
        console.warn(`[GraphQL] ${gqlErr.message}`);
      }
    }
  },
});
