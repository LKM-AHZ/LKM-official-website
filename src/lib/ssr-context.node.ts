/**
 * SSR 请求上下文 — Node 专属实现（仅 middleware 引用，不进入客户端 bundle）。
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { setSsrStore, runWithRequest } from "./ssr-context";
import type { SsrRequestContext } from "./ssr-context";

// 显式边界：本模块只能在服务端加载（静态 import 了 node:async_hooks）。
// 客户端 bundle 若误引，这里立刻抛错，而不是等到打包器报 module not found 或线上才炸
if (typeof window !== "undefined") {
  throw new Error(
    "ssr-context.node 只能在服务端加载；客户端请改用 ~/lib/ssr-context",
  );
}

const store = new AsyncLocalStorage<SsrRequestContext>();
setSsrStore(store);

export { runWithRequest };
