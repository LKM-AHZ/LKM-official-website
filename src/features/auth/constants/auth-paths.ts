import { buildAuthUrl } from "~/lib/utils/paths";
import { normalizeBase } from "~/features/auth/utils/safe-redirect";

declare global {
  interface Window {
    __BASE_URL__: string;
  }
}

export function getBaseUrl(): string {
  // 必须归一化：buildAuthUrl → joinPaths 会把连续 `/` 压成一个，绝对地址（https://x/）
  // 会被压成 `https:/x/...`，协议相对值 `//evil.com` 被中和成 `/evil.com`。
  // normalizeBase 保证「前导 /、无尾随 /」并拒绝这两类非法值（与 safe-redirect 同一份实现）。
  if (typeof window !== "undefined" && window.__BASE_URL__) {
    return normalizeBase(window.__BASE_URL__);
  }
  // SSR/构建期没有 window：回退到编译期注入的 base（与客户端 __BASE_URL__ 同源），
  // 否则子路径部署下服务端渲染出的链接与客户端 hydrate 后的不一致（水合不一致/坏链）
  return normalizeBase(import.meta.env.BASE_URL || "/");
}

export function getAuthPath(path: string): string {
  return buildAuthUrl(getBaseUrl(), path);
}
