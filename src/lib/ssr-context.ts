/**
 * SSR 请求上下文（浏览器安全版）
 *
 * 通过 node:async_hooks 的 AsyncLocalStorage 实现，但为避免把 Node 原生模块
 * 打进浏览器 bundle（client.ts / GraphQL exchange 在 CSR 同样加载本模块），
 * 这里仅保留接口与 store 的注入点；AsyncLocalStorage 实例由
 * ssr-context.node.ts 在服务端创建并注入（仅 middleware 引用）。
 *
 * SSR 阶段数据访问层（axios / ssrFetch / urql）可跨异步边界读取当前请求的
 * Cookie，使 B 类认证页面在服务端识别登录用户。
 */
export interface SsrRequestContext {
  headers: Headers;
}

interface AsyncStore {
  run<T>(ctx: SsrRequestContext, fn: () => Promise<T> | T): Promise<T>;
  getStore(): SsrRequestContext | undefined;
}

let _store: AsyncStore | null = null;
let _warnedNoStore = false;

/** 由服务端模块注入 AsyncLocalStorage 实例（仅 SSR 环境调用）。 */
export function setSsrStore(store: AsyncStore): void {
  // 注入是进程级单例：测试/HMR/多份服务端 bundle 会各注一次，静默覆盖会让在途请求丢上下文
  if (_store && _store !== store) {
    console.warn("[ssr-context] SSR store 已注入过，本次注入覆盖了旧实例");
  }
  _store = store;
}

/** 是否已注入 SSR store：服务端据此区分「未注入」与「注入了但没有 Cookie」。 */
export function hasSsrStore(): boolean {
  return _store !== null;
}

/** 仅供测试复位注入状态（生产代码不要调用）。 */
export function resetSsrStore(): void {
  _store = null;
}

/** 在上下文中执行回调；未注入 store（如浏览器）时直接执行。 */
export async function runWithRequest<T>(
  headers: Headers,
  callback: () => T | Promise<T>,
): Promise<T> {
  if (!_store) {
    // 服务端走到这里说明 Node 实现没被加载（漏 import ssr-context.node / 模块图分裂）：
    // 请求 Cookie 会静默读不到、B 类页面认不出登录用户，所以显式告警一次
    if (typeof window === "undefined" && !_warnedNoStore) {
      _warnedNoStore = true;
      console.warn(
        "[ssr-context] 未注入 SSR store：本次 SSR 请求读不到 Cookie（检查是否漏 import ssr-context.node）",
      );
    }
    return await callback();
  }
  return await _store.run({ headers }, () => callback());
}

/** 读取当前 SSR 请求上下文的 Cookie 头；无上下文或无 Cookie 时返回 null。 */
export function getSsrCookie(): string | null {
  const store = _store?.getStore();
  if (!store) return null;
  return store.headers.get("cookie");
}
