// src/lib/api/admin.ts
// 后台管理系统 API 客户端 —— 走后端 cookie 会话（admin_session / admin_refresh）。
//
//  - 凭证只在 httpOnly cookie 中，前端 JS 不读不存 token；同域请求自动带 cookie。
//  - 统一使用"单一守卫 + 防重入"：401/403 只由守卫跳一次 /admin/login，
//    避免并发多请求同时 401 时重复跳转；登录页自身不再跳登录，防止死循环。
//  - 后端 admin router prefix="/admin"，经 src/middleware.ts 代理为 /api/v1/admin/...
//    （middleware 已代理 /api 开头），故这里请求 `/admin/...` 即可。
//  - 底层走 src/lib/api/fetch.ts 的 apiFetch（统一 base URL + timeout + Result），
//    符合仓库"不直接调 fetch"的约束。
//  - 路径前缀用 /api/v1/admin：src/middleware.ts 只代理 /api/ 开头并**原样转发**路径，
//    与仓库其余调用一致（如 /api/v1/admin/content/items），cookie Path=/api/v1/admin 也与之匹配。

import { apiFetch } from "~/lib/api/fetch";
import { t } from "~/lib/i18n";
import type { AppError } from "~/lib/errors/error-codes";
import type { Result } from "~/lib/errors/result";

export interface AdminUser {
  id: number;
  account_level: string;
  role: string;
}

export class AdminAuthError extends Error {
  constructor() {
    super(t("messages.admin.sessionExpired"));
    this.name = "AdminAuthError";
  }
}

/** 危险操作需 2FA（后端 CommonErr.MFA_REQUIRED 的 code）。 */
export const ADMIN_MFA_REQUIRED_CODE = 4;

/** 危险操作需要 2FA step-up：会话有效但无 1 小时内信任。调用方应弹 2FA 验证后重试。 */
export class AdminMFARequiredError extends Error {
  constructor() {
    super(t("messages.admin.mfaRequired"));
    this.name = "AdminMFARequiredError";
  }
}

let redirecting = false;
let redirectTarget = "/admin/login";

/** 登录成功 / 页面进入后台前调用，清掉重入锁，避免后续 401 不再触发跳转。 */
export function resetRedirectGuard(): void {
  redirecting = false;
}

/** 允许测试或特殊场景覆盖跳转目标（默认 /admin/login）。 */
export function setRedirectTarget(target: string): void {
  redirectTarget = target;
}

function toLogin(): void {
  if (redirecting || window.location.pathname.startsWith(redirectTarget))
    return;
  redirecting = true;
  window.location.replace(redirectTarget); // replace：不进前进历史
}

/**
 * 后台 REST 调用。返回原始 Response；401/403 时触发守卫跳登录并抛 AdminAuthError。
 *
 *   path 传**完整代理路径**（如 `/api/v1/admin/users`、`/api/v1/files`）：
 *   src/middleware.ts 按 /api/ 原样转发到后端，与仓库其余调用一致。
 *   401/403 触发守卫跳登录，调用方 catch AdminAuthError 静默即可，勿各自跳转。
 */
export async function adminFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const result: Result<Response, AppError> = await apiFetch(path, init);
  if (result.isErr()) {
    // 网络/超时等 AppError：不让守卫跳登录，交由调用方/网络层统一报错
    throw result.error;
  }
  const res = result.value;
  if (res.status === 401 || res.status === 403) {
    // 危险操作 step-up：401 且 body code == MFA_REQUIRED 时，会话仍有效但缺 2FA 信任，
    // 不应跳登录，应抛 MFA 错误由调用方弹 TOTP 验证后重试。
    let mfaRequired = false;
    try {
      const body = (await res.clone().json()) as { code?: number } | null;
      mfaRequired = body?.code === ADMIN_MFA_REQUIRED_CODE;
    } catch {
      /* 非 JSON：视为会话过期 */
    }
    if (mfaRequired) {
      throw new AdminMFARequiredError();
    }
    toLogin();
    throw new AdminAuthError();
  }
  return res;
}

/** 解析 @respond 包络 {code, msg, data} 的 JSON；失败抛错。 */
export async function readAdminResp(
  res: Response,
): Promise<{ code: number; msg: string; data: unknown }> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      detail?: string;
      msg?: string;
    };
    throw new Error(
      body.msg ||
        body.detail ||
        t("messages.admin.requestFailedStatus", { status: res.status }),
    );
  }
  const json = (await res.json()) as {
    code: number;
    msg: string;
    data: unknown;
  };
  if (json.code !== 0)
    throw new Error(json.msg || t("messages.admin.requestFailed"));
  return json;
}

export interface AdminLoginResult {
  /** adminFetch 自动把 Set-Cookie 存进浏览器，无需前端持 token。 */
  user: AdminUser;
}

/** 后台登录；成功后 cookie 已由 Set-Cookie 写入，清守卫并返回用户信息。 */
export async function adminLogin(
  username: string,
  password: string,
): Promise<AdminLoginResult> {
  resetRedirectGuard();
  const res = await adminFetch("/api/v1/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await readAdminResp(res);
  return { user: body.data as unknown as AdminUser };
}

/** 危险操作 step-up：提交当前 TOTP 码，通过后后端 Set-Cookie 更新为带 2FA 信任的会话。 */
export async function adminVerify2FA(code: string): Promise<void> {
  const res = await adminFetch("/api/v1/admin/auth/2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  await readAdminResp(res);
}

/** 后台登出：撤销 refresh 会话并清 cookie。 */
export async function adminLogout(): Promise<void> {
  try {
    const res = await adminFetch("/api/v1/admin/auth/logout", {
      method: "POST",
    });
    await readAdminResp(res);
  } catch {
    // 即使后端不可用也清本地姿态，让守卫复位
  } finally {
    resetRedirectGuard();
  }
}

/**
 * 启动时校验后台会话：成功返回用户；失败（无 cookie / 后端拒绝）会触发守卫跳登录。
 * 调用方一般在需要后台的页面 onMounted 里 await，据此决定展示登录界面还是业务内容。
 */
export async function bootAdminSession(): Promise<AdminUser | null> {
  resetRedirectGuard();
  try {
    const res = await adminFetch("/api/v1/admin/auth/me");
    const body = await readAdminResp(res);
    return (body.data as unknown as AdminUser) ?? null;
  } catch (e) {
    if (e instanceof AdminAuthError) return null;
    // 网络/后端 5xx：不强行跳登录，返回 null 并由调用方降级展示
    return null;
  }
}
