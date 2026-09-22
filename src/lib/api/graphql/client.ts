import { Client, cacheExchange, fetchExchange } from "@urql/core";
import { authExchange } from "./exchanges/auth";
import { errorExchange } from "./exchanges/error";

/**
 * 运行时获取 GraphQL URL，自动带上 BASE_URL 前缀
 */
function getGraphqlUrl(): string {
  const publicUrl = import.meta.env.PUBLIC_GRAPHQL_URL;
  if (publicUrl) {
    // urql 内部用 new URL() 解析：非绝对 URL 会在请求时才抛，这里提前校验并回落
    try {
      return new URL(publicUrl).toString();
    } catch {
      console.warn(
        `[graphql] PUBLIC_GRAPHQL_URL 不是合法绝对 URL，已忽略：${publicUrl}`,
      );
    }
  }

  // SSR: 使用真实后端直连地址（尾斜杠归一，避免拼出 //graphql）
  if (typeof window === "undefined") {
    const apiUrl = (process.env.API_URL || "").replace(/\/+$/, "");
    if (!apiUrl) {
      // 不用抛错：构建/预渲染环境常常没配 API_URL，直接抛会连带打断整条构建链；
      // 这里显式告警，让「指向 localhost」这件事不再静默
      console.warn(
        "[graphql] 未配置 API_URL，SSR 回退到 http://localhost:8000/graphql",
      );
      return "http://localhost:8000/graphql";
    }
    return `${apiUrl}/graphql`;
  }

  // CSR: 完整 URL（urql 内部用 new URL() 解析，必须有 origin）
  const base = window.__BASE_URL__ || import.meta.env.BASE_URL || "/";
  const cleanBase = base.replace(/\/$/, "");
  return `${window.location.origin}${cleanBase}/graphql`;
}

/**
 * urql GraphQL 客户端 — SSR/CSR 共享实例
 *
 * SSR 时 fetch 到真实后端（由 Astro middleware 代理），
 * CSR 时同域 /graphql → Astro middleware → 真实后端。
 */
export const graphqlClient = new Client({
  url: getGraphqlUrl(),
  // SSR 不带 cacheExchange：模块级实例在 Node 进程内被所有请求共享，文档缓存会把前一个
  // 请求的结果命中给后一个请求（forum 等页面在 frontmatter 里直接发查询）。CSR 仍保留缓存。
  exchanges:
    typeof window === "undefined"
      ? [authExchange, errorExchange, fetchExchange]
      : [cacheExchange, authExchange, errorExchange, fetchExchange],
});
