import { mapExchange } from "@urql/core";
import { getHttpAccessToken } from "~/lib/http/client";
import { getSsrCookie } from "~/lib/ssr-context";

/**
 * 自动附加认证信息到 GraphQL 请求头。
 *
 * 从统一的 HTTP 认证会话适配器读取 access token（默认读 localStorage 'lkm-auth-store' 的 _token 字段），
 * 附加为 Authorization: Bearer <token>。
 * SSR 阶段浏览器 localStorage 不可用，改为转发当前请求的 Cookie（B 类认证页面服务端识别用户）。
 */
export const authExchange = mapExchange({
  onOperation(operation) {
    try {
      const headers: Record<string, string> = {};
      const token = getHttpAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      // SSR：无浏览器 token，转发当前请求 Cookie
      if (typeof window === "undefined") {
        const cookie = getSsrCookie();
        if (cookie) headers["Cookie"] = cookie;
      }

      const prevFetchOptions =
        typeof operation.context.fetchOptions === "function"
          ? operation.context.fetchOptions()
          : operation.context.fetchOptions;

      // RequestInit.headers 可能是 Headers 实例或 [name, value][]：直接展开前者会得到 {}、
      // 后者的会掺入 "0"/"1" 这类下标键，都会丢掉/污染原有请求头。统一归一化成普通对象。
      const normalizedHeaders: Record<string, string> = {};
      if (prevFetchOptions) {
        new Headers(
          (prevFetchOptions as RequestInit).headers as HeadersInit,
        ).forEach((value, key) => {
          normalizedHeaders[key] = value;
        });
      }

      operation.context.fetchOptions = {
        ...prevFetchOptions,
        headers: {
          ...normalizedHeaders,
          ...headers,
        },
      };
    } catch (err) {
      // 不再静默：认证头附加失败会让请求以未认证身份发出，最终只在别处表现为 401。
      // 注意不打印 token/cookie 等敏感内容。
      console.warn("[GraphQL] 附加认证头失败:", err);
    }
  },
});
