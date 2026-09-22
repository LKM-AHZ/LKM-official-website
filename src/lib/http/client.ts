// HTTP 客户端封装 — 所有 API 请求统一入口
//
// 支持两种运行环境：
//  - SSR（Astro 服务端）：fetch 真实后端（由 API_URL 指定）
//  - 客户端（浏览器）：fetch 同域 /api/*（无跨域），携带 Cookie
//
// 原则：
//  1. 所有请求返回 Result<T, AppError>，不抛异常
//  2. SSR 和 CSR 自动切换 base URL
//  3. 错误消息不含敏感信息（token/key 等）
//
// 实现基于原生 fetch（弃用 axios），对外 API 契约保持不变：
//  get/post/put/patch/del 与 request 均返回 Result<T, AppError>，
//  token 读写(getHttpAccessToken 等)供 GraphQL exchange 等无请求方使用。

import { AppError, ErrorCode, MFARequiredError } from "../errors/error-codes";
import { ok, err } from "../errors/result";
import { t } from "~/lib/i18n";
import type { Result } from "../errors/result";
import { getSsrCookie } from "../ssr-context";

/** SSR 时使用真实后端直连地址，客户端时使用同域 /api */
function getApiBase(): string {
  // SSR: Astro 服务端，使用 API_URL 环境变量指向真实后端
  if (typeof window === "undefined") {
    return process.env.API_URL ?? "";
  }
  // 客户端：同域 /api，无跨域
  return "";
}

const DEFAULT_TIMEOUT_MS = 15_000;

/** 请求配置（原 axios 的 AxiosRequestConfig 最小等价子集，仅含现有消费方所用到字段）。 */
export interface RequestConfig {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** GET 等查询参数，扁平对象 → 拼到 query string（与 axios params 一致）。 */
  params?: Record<string, unknown>;
  /** 请求体，JSON 序列化。 */
  data?: unknown;
  headers?: Record<string, string>;
  /** 覆盖默认超时（毫秒）。 */
  timeout?: number;
}

// ── 认证会话适配器：统一从这里读写 token，可被 configureHttpAuthSession 覆盖 ──
export interface HttpAuthSessionAdapter {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(a: string, r: string): void;
  clear(): void;
}

let _adapter: HttpAuthSessionAdapter | null = null;

/** Pinia auth store 的持久化键（与 src/stores/auth.ts 的 persist 键一致），只在此声明一次 */
const AUTH_STORAGE_KEY = "lkm-auth-store";

/** 认证 store 持久化快照（只取本适配器关心的两个 token 字段） */
interface StoredAuth {
  _token?: string;
  _refreshToken?: string;
}

/** 读取持久化快照：隐私模式/禁用存储/载荷损坏时返回 null，由调用方降级 */
function readStoredAuth(): StoredAuth | null {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as StoredAuth) : null;
  } catch {
    return null;
  }
}

const defaultAdapter: HttpAuthSessionAdapter = {
  getAccessToken() {
    return readStoredAuth()?._token ?? null;
  },
  getRefreshToken() {
    return readStoredAuth()?._refreshToken ?? null;
  },
  setTokens(a, r) {
    try {
      const store: StoredAuth = readStoredAuth() ?? {};
      store._token = a;
      store._refreshToken = r;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    // 通知运行中的认证 store 清理内存态（401 刷新失败等静默清会话路径）：
    // localStorage 删除本身不会同步到 Pinia 内存，需广播事件让 store 复位。
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lkm:auth-cleared"));
    }
  },
};

function getAdapter(): HttpAuthSessionAdapter {
  return _adapter ?? defaultAdapter;
}

/** 配置全局认证会话适配器；传 null 恢复为默认 localStorage 行为。 */
export function configureHttpAuthSession(
  ad: HttpAuthSessionAdapter | null,
): void {
  _adapter = ad ?? defaultAdapter;
}

/** 只读访问令牌（GraphQL exchange 等无 http 请求方用）。 */
export function getHttpAccessToken(): string | null {
  return getAdapter().getAccessToken();
}

/** 只读刷新令牌（供 GraphQL 等非 http 消费方使用）。 */
export function getHttpRefreshToken(): string | null {
  return getAdapter().getRefreshToken();
}

/** 更新令牌（供 GraphQL 等非 http 消费方在刷新成功后写入）。 */
export function setHttpTokens(accessToken: string, refreshToken: string): void {
  getAdapter().setTokens(accessToken, refreshToken);
}

/** 清除会话（供 GraphQL 等非 http 消费方在刷新失败后登出）。 */
export function clearHttpSession(): void {
  getAdapter().clear();
}

/** 需要自动附加 Bearer 的端点判断（与旧 axios 拦截器逻辑一致）。 */
function needsAuth(url: string): boolean {
  if (
    url.startsWith("/api/v1/auth/") &&
    !url.startsWith("/api/v1/auth/login") &&
    !url.startsWith("/api/v1/auth/reg")
  ) {
    return true;
  }
  return (
    url.startsWith("/api/v1/starhope/") ||
    url.startsWith("/api/v1/points/") ||
    url.startsWith("/api/v1/articles/") ||
    url.startsWith("/api/v1/blog/") ||
    url.startsWith("/graphql")
  );
}

/** 扁平对象 → URLSearchParams（值为 null/undefined 跳过）。 */
function toQueryParams(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function isTimeoutError(e: unknown): boolean {
  // 用 name 判定而非 `instanceof DOMException`：DOMException 在部分运行时/旧 Node/polyfill 下
  // 可能未定义，那样会在 catch 里抛 ReferenceError，把网络失败变成异常逃出 Result 契约。
  return e instanceof Error && e.name === "AbortError";
}

function isRefreshRequest(url: string): boolean {
  return url === "/api/v1/auth/refresh";
}

/** 后端危险操作 MFA_REQUIRED 的业务代码（CommonErr.MFA_REQUIRED）。 */
const MFA_REQUIRED_CODE = 4;

/** 判断 401 响应是否为「危险操作需 2FA step-up」（会话仍有效、仅缺信任），而非 token 过期。 */
async function isMfaRequired(response: Response): Promise<boolean> {
  try {
    const body = (await response.clone().json()) as { code?: number } | null;
    return body?.code === MFA_REQUIRED_CODE;
  } catch {
    // 非 JSON：视为普通 401（token 过期），走刷新逻辑
    return false;
  }
}

/**
 * 真正的请求执行。401 时触发「单飞」刷新（并发去重），成功后带新 token 重放一次。
 * 返回 ok(data)（解包 {code,msg,data}）或 err(AppError)。
 */
async function rawRequest<T>(
  config: RequestConfig,
): Promise<Result<T, AppError>> {
  const base = getApiBase();
  const url = config.url ?? "";
  const fullUrl = `${base ? base.replace(/\/$/, "") : ""}${url}${
    config.params ? toQueryParams(config.params) : ""
  }`;

  const timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  const initialController =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  let controller: AbortController | null = initialController;
  let timeoutId = initialController
    ? setTimeout(() => initialController.abort(), timeout)
    : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers ?? {}),
  };

  // SSR：转发当前请求携带的 Cookie（B 类认证页面服务端识别用户）
  if (typeof window === "undefined") {
    const cookie = getSsrCookie();
    if (cookie) headers["Cookie"] = cookie;
  }

  // 自动附加 JWT（只给需要认证的端点且有有效 token 时）
  const token = getAdapter().getAccessToken();
  if (token && needsAuth(url)) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // DELETE 也允许带 body：关闭 2FA / 解绑等 step-up 接口需要把验证码放在请求体里，
  // 之前一并置 undefined 会让这些请求收不到验证码。不传 data 的 DELETE 仍是空 body。
  const body =
    config.method === "GET"
      ? undefined
      : config.data !== undefined
        ? JSON.stringify(config.data)
        : undefined;

  const doFetch = (finalToken: string | null): Promise<Response> =>
    // eslint-disable-next-line no-restricted-globals
    fetch(fullUrl, {
      method: config.method ?? "GET",
      headers: {
        ...headers,
        ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
      },
      body,
      signal: controller ? controller.signal : undefined,
    });

  const cleanup = (): void => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  };

  /**
   * 重放前换一套全新的 controller + 计时器：等待刷新期间旧计时器可能已经到点把
   * controller abort 掉，沿用旧 signal 会让重放请求立刻以「超时」失败。
   */
  const rearmForReplay = (): void => {
    cleanup();
    if (typeof AbortController === "undefined") return;
    const next = new AbortController();
    controller = next;
    timeoutId = setTimeout(() => next.abort(), timeout);
  };

  try {
    let response = await doFetch(token);

    // 401 → 先判是否为「危险操作需 2FA step-up」：会话有效仅缺 2FA 信任时，
    // 不刷新、不清会话，抛 MFARequiredError 由调用方弹 TOTP 验证后再重放。
    if (response.status === 401 && token && (await isMfaRequired(response))) {
      cleanup(); // 提前返回也必须释放计时器，否则 SSR 下会一直挂着一个待触发的 timer
      return err(new MFARequiredError());
    }
    // 否则进入「单飞」刷新（刷新端点自身 401 说明刷新令牌失效，直接清会话）。其余情况刷新成功则带新 token 重放一次。
    // 必须以 needsAuth(url) 为前提：无需认证的端点（如 /api/v1/auth/login 密码错误）返回 401 时，
    // 若恰好存有旧 token，会白刷新一次并用重放结果替换原始 401 响应。
    if (response.status === 401 && token && needsAuth(url)) {
      if (isRefreshRequest(url)) {
        getAdapter().clear();
      } else if ((await refreshSession()) === "ok") {
        const refreshed = getAdapter().getAccessToken();
        if (refreshed) {
          rearmForReplay();
          response = await doFetch(refreshed);
        }
      }
    }

    cleanup();
    return toResult<T>(response);
  } catch (e: unknown) {
    cleanup();
    if (isTimeoutError(e)) {
      return err(
        new AppError(ErrorCode.HTTP_TIMEOUT, t("messages.requestTimeout")),
      );
    }
    return err(
      new AppError(ErrorCode.NETWORK_ERROR, t("messages.networkError"), e),
    );
  }
}

/** 把 fetch Response 映射为 Result<T, AppError>：非 2xx 也走 err。 */
async function toResult<T>(response: Response): Promise<Result<T, AppError>> {
  if (!response.ok) {
    const status = response.status;
    const code =
      status >= 500 ? ErrorCode.HTTP_SERVER_ERROR : ErrorCode.HTTP_CLIENT_ERROR;
    const m = t("messages.requestFailed", { status });
    // 尽力取后端 msg/message（只取可读错误信息，不透传完整响应体）
    let detail = "";
    try {
      const raw = (await response.json()) as Record<string, unknown> | null;
      const a = raw?.msg;
      const b = raw?.message;
      const msg = typeof a === "string" ? a : typeof b === "string" ? b : null;
      if (msg) detail = msg.slice(0, 160);
    } catch {
      // 响应非 JSON（如 HTML 错误页），忽略 detail
    }
    return err(new AppError(code, m + (detail ? `：${detail}` : ""), status));
  }

  // 2xx：尝试解析 JSON body
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // unpack {code, msg, data} → 返回内层 data（契约与旧 axios request 一致）。
  // 必须同时要求 code 是数字且等于成功码 0：后端 err.py 的 @respond 只在成功时返回
  // CommonErr.OK(0)，失败一律走非 2xx；仅凭「有 code 和 data 两个键」就拆包，
  // 会把恰好含 code/data 字段的业务对象误拆。
  if (
    data &&
    typeof data === "object" &&
    typeof (data as { code?: unknown }).code === "number" &&
    (data as { code: number }).code === 0 &&
    "data" in (data as object)
  ) {
    return ok((data as { data: T }).data);
  }
  return ok(data as T);
}

/**
 * 刷新结果：
 *  - ok：已写入新 token
 *  - invalid：刷新令牌确已失效（4xx 明示拒绝）→ 可清会话
 *  - transient：暂时失败（网络/超时/5xx/响应畸形）→ 保留会话，避免一次抖动即登出
 */
export type RefreshOutcome = "ok" | "invalid" | "transient";

/**
 * 并发 401 单飞刷新：一次刷新进行中，其余等待同一结果。
 * 导出供 GraphQL 的 errorExchange 复用 —— HTTP 与 GraphQL 两条 401 路径必须共用同一把锁，
 * 否则同一会话的两个 401 会各自刷新，在 refresh token 轮换下必有一个被拒、会话被清。
 */
let refreshing: Promise<RefreshOutcome> | null = null;

export function refreshSession(): Promise<RefreshOutcome> {
  if (refreshing) return refreshing;

  refreshing = (async (): Promise<RefreshOutcome> => {
    const refreshToken = getAdapter().getRefreshToken();
    if (!refreshToken) {
      getAdapter().clear();
      return "invalid";
    }
    try {
      const base = getApiBase();
      // 用原生 fetch 直接刷新，避免递归触发 401 刷新逻辑
      // eslint-disable-next-line no-restricted-globals
      const res = await fetch(
        `${base ? base.replace(/\/$/, "") : ""}/api/v1/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );
      // 只有明示拒绝才算 invalid；408/429 等其它 4xx 与 5xx 都是暂时性失败，
      // 不能据此把用户登出
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        getAdapter().clear();
        return "invalid";
      }
      if (!res.ok) return "transient";

      let body: { data?: { access_token?: string; refresh_token?: string } };
      try {
        body = (await res.json()) as typeof body;
      } catch {
        return "transient";
      }
      const accessToken = body?.data?.access_token;
      const newRefreshToken = body?.data?.refresh_token;
      if (!accessToken) {
        getAdapter().clear();
        return "invalid";
      }
      getAdapter().setTokens(accessToken, newRefreshToken ?? refreshToken);
      return "ok";
    } catch {
      return "transient";
    }
  })();

  void refreshing.finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** 通用请求 */
export async function request<T>(
  config: RequestConfig,
): Promise<Result<T, AppError>> {
  return rawRequest<T>(config);
}

/** GET 请求 */
export function get<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: RequestConfig,
): Promise<Result<T, AppError>> {
  return rawRequest<T>({ ...config, url, params, method: "GET" });
}

/** POST 请求 */
export function post<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<Result<T, AppError>> {
  return rawRequest<T>({ ...config, url, data, method: "POST" });
}

/** PUT 请求 */
export function put<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<Result<T, AppError>> {
  return rawRequest<T>({ ...config, url, data, method: "PUT" });
}

/** PATCH 请求 */
export function patch<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<Result<T, AppError>> {
  return rawRequest<T>({ ...config, url, data, method: "PATCH" });
}

/** DELETE 请求 */
export function del<T>(
  url: string,
  config?: RequestConfig,
): Promise<Result<T, AppError>> {
  return rawRequest<T>({ ...config, url, method: "DELETE" });
}
