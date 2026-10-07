// 「越权被拒」的事件契约 —— lib 层派发（client.ts 的 toResult），UI 层订阅
// （src/features/auth/components/PermissionDeniedDialog.vue）。
//
// 为什么在 HTTP 层拦：各 API 模块把错误压平的形态不统一（Result / null / boolean / alert），
// 403 一旦被压成 null 就再也认不出来；而 toResult 是唯一还握着 HTTP 状态码与后端报文的地方。
//
// 事件名风格与既有的 `lkm:auth-cleared` 一致（client.ts 派发、stores/auth.ts 订阅）。

/** 权限/账号等级不足事件的频道名。 */
export const PERMISSION_DENIED_EVENT = "lkm:permission-denied";

export interface PermissionDeniedDetail {
  /**
   * 缺失的权限点（如 `content.create`）。
   * 账号等级不足（后端未指明具体权限点）时为 null。
   */
  permission: string | null;
}

/**
 * 后端「权限不足」的两类固定报文 —— 只有这两类才代表「补权限/补注册即可继续」：
 *
 * - `Missing permission: <perm>`：`LKM-service/app/modules/rbac/deps.py` 的 RequirePermission
 *   与 `app/modules/admin/permissions.py` 的 require_permission。
 * - `Account level insufficient`：`LKM-service/core/ports/authz.py` 的 RequireLevel
 *   （错误码 AuthErr.ACCOUNT_LEVEL_INSUFFICIENT，见 core/err.py）。
 *
 * 刻意**不**收编其它 403：板块禁言、非属主、非提问者本人、「不能采纳自己的回答」、文件未过审
 * 等同样是 403，但它们各有更准确的中文文案，硬套「无权限 + 去注册」会误导用户。
 */
const MISSING_PERMISSION_PREFIX = "Missing permission:";
const ACCOUNT_LEVEL_INSUFFICIENT = "Account level insufficient";

/** 后端错误体里的可读文案（`msg` 或 `message`，与 client.ts 的取值顺序一致）。 */
function readBackendMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const a = raw.msg;
  const b = raw.message;
  return typeof a === "string" ? a : typeof b === "string" ? b : null;
}

/**
 * 判断一个响应是否为「越权拒绝」，是则返回事件载荷，否则返回 null。
 * 传入的是**未截断**的后端报文（client.ts 面向用户的 detail 会截到 160 字符）。
 */
export function parsePermissionDenial(
  status: number,
  body: unknown,
): PermissionDeniedDetail | null {
  if (status !== 403) return null;
  const msg = readBackendMessage(body);
  if (!msg) return null;
  if (msg.startsWith(MISSING_PERMISSION_PREFIX)) {
    return {
      permission: msg.slice(MISSING_PERMISSION_PREFIX.length).trim() || null,
    };
  }
  if (msg === ACCOUNT_LEVEL_INSUFFICIENT) return { permission: null };
  return null;
}

/** 广播越权拒绝。SSR（无 window）下静默跳过 —— client.ts 在服务端同样会跑到这里。 */
export function dispatchPermissionDenied(detail: PermissionDeniedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PERMISSION_DENIED_EVENT, { detail }));
}

/** 订阅越权拒绝，返回退订函数。 */
export function onPermissionDenied(
  handler: (detail: PermissionDeniedDetail) => void,
): () => void {
  const listener = (e: Event): void => {
    const detail = (e as CustomEvent<PermissionDeniedDetail>).detail;
    handler(detail ?? { permission: null });
  };
  window.addEventListener(PERMISSION_DENIED_EVENT, listener);
  return () => window.removeEventListener(PERMISSION_DENIED_EVENT, listener);
}

// ── 「这条错误已经被全局对话框承接了」的标记 ──────────────────────────────
//
// 调用方需要知道「要不要再自己提示一次」：不标记的话，它只能按 `status === 403` 猜，
// 而 403 远不止「越权」一种——匿名请求打需要登录的端点也返回 403
// （core/ports/authz.py 的 `_parse_bearer` 抛 FORBIDDEN）、板块禁言/非属主同样是 403。
// 按状态码一刀切会让这些**既不弹全局对话框、也不给任何提示**，回到静默失败。
//
// 用 WeakSet 而不是给 AppError 加字段：错误对象是通用的，不该长出 UI 专用属性；
// 键是对象，随错误一同被回收，不留引用。
const handledByDialog = new WeakSet<object>();

/** 记录「这条错误已广播给全局无权限对话框」。由 client.ts 在派发的同一处调用。 */
export function markPermissionDeniedHandled(error: object): void {
  handledByDialog.add(error);
}

/** 该错误是否已由全局无权限对话框承接（调用方据此避免重复提示）。 */
export function isPermissionDeniedHandled(error: object): boolean {
  return handledByDialog.has(error);
}
