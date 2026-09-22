import { defineStore, getActivePinia } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "~/lib/api/modules/auth";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import { ok, err } from "~/lib/errors/result";
import type { Result } from "~/lib/errors/result";
import type { UserInfo, MessageResponse } from "~/lib/api/modules/auth";
import type { SessionStatus } from "~/types/auth";

let _sessionClearedBound = false;

/** 会话持久化键：本文件内多处读写，收敛为常量，改名时不会漏改（HTTP 适配器等外部写入方共用同一字面量） */
const AUTH_STORAGE_KEY = "lkm-auth-store";

export const useAuthStore = defineStore("auth", () => {
  // 首次实例创建时注册「http 会话被清除」同步监听（http 层 401 刷新失败等
  // 静默清空 localStorage 时会广播；此处让内存态复位，避免"假登录"漂移）。
  if (_sessionClearedBound === false) {
    _sessionClearedBound = true;
    if (typeof window !== "undefined") {
      window.addEventListener("lkm:auth-cleared", () => {
        // 事件若在 app 之外触发（测试/HMR/多实例），useAuthStore() 会凭空建一个实例：
        // 没有活动 Pinia 时跳过
        if (!getActivePinia()) return;
        useAuthStore().resetState();
      });
    }
  }

  // ── State（单一状态源：session 驱动） ──
  const user = ref<UserInfo | null>(null);
  const isLoggedIn = ref(false);
  const session = ref<SessionStatus>("anonymous");
  const _token = ref<string | null>(null);
  const _refreshToken = ref<string | null>(null);
  const onboardingCompleted = ref(false);
  // 2FA 过渡态：登录返回 requires_2fa/setup_required 时暂存后端签发的 temp_token，
  // 供后续 TOTP/恢复码验证（TwoFactorVerify 等）使用。仅内存态，不持久化。
  const _pendingTempToken = ref<string | null>(null);

  // ── Token 辅助函数 ──
  function setTokens(accessToken: string, refreshToken: string): void {
    _token.value = accessToken;
    _refreshToken.value = refreshToken;
  }

  function clearTokens(): void {
    _token.value = null;
    _refreshToken.value = null;
  }

  // ── Getters ──
  const accountLevel = computed(() => user.value?.account_level ?? "local");
  const username = computed(() => user.value?.username ?? "");

  // ── API: 获取当前用户 ──
  async function fetchMe(): Promise<Result<UserInfo, AppError>> {
    if (!_token.value) {
      return err(new AppError(ErrorCode.AUTH_ERROR, "no token"));
    }
    const result = await authApi.getMe();
    if (result.isOk()) {
      user.value = result.value;
      isLoggedIn.value = true;
      session.value = "authenticated";
    }
    return result;
  }

  // ── 从 localStorage 恢复到内存 ──
  function restoreFromStorage(): void {
    // 本函数会被 client:load 组件的 setup 调用，SSR 阶段没有 localStorage：
    // 不加守卫会在 Node 下抛 ReferenceError
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.user && data.isLoggedIn) {
          user.value = data.user;
          isLoggedIn.value = true;
          _token.value = data._token ?? null;
          _refreshToken.value = data._refreshToken ?? null;
          onboardingCompleted.value = data.onboardingCompleted ?? false;
        }
      }
    } catch {
      // 解析失败或存储被禁用（隐私模式/沙箱）：清理本身也可能抛 SecurityError，
      // 不能再让它逃逸出去掩盖原始错误
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  // ── 恢复并校验：无 token→anonymous；有→restoring→fetchMe→authenticated / 原子清除 ──
  async function restoreAndValidate(): Promise<Result<boolean, AppError>> {
    restoreFromStorage();
    if (!_token.value) {
      session.value = "anonymous";
      return ok(false);
    }
    session.value = "restoring";
    const r = await fetchMe();
    if (r.isOk()) {
      session.value = "authenticated";
      return ok(true);
    }
    session.value = "anonymous";
    isLoggedIn.value = false;
    user.value = null;
    clearTokens();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return ok(false);
  }

  // ── 登录后同步用户信息 ──
  // 关键：登录成功的持久化必须发生在 user/isLoggedIn/session 都就绪之后。
  // 各登录接口会在 setTokens 后先 persist 一次（那时 user 尚空），故这里成功后再 persist，
  // 确保 localStorage 写入完整会话，刷新/restoreFromStorage 才能恢复登录态。
  async function fetchMeAfterLogin(): Promise<Result<AuthSuccess, AppError>> {
    // 登录响应既没有 2FA 标记也没有 access_token 时，给出可区分的契约错误，
    // 而不是让 fetchMe 报笼统的 "no token"（调用方无法判断是契约违约还是会话失效）
    if (!_token.value) {
      return err(
        new AppError(ErrorCode.AUTH_ERROR, "登录响应缺少 access_token"),
      );
    }
    const meResult = await fetchMe();
    if (meResult.isOk()) {
      isLoggedIn.value = true;
      session.value = "authenticated";
      persistToStorage();
      return ok({});
    }
    return err(meResult.error);
  }

  /**
   * 登录接口共用的收尾：写入 token 并持久化，再拉取资料补全会话。
   * 原先这段在 loginPassword/registerLocal/verifyNormalRegister/loginCode/verifyMagicLink
   * 各抄一份，容易漏掉 persistToStorage 或 2FA 分支。
   */
  function completeLogin(payload: {
    access_token: string;
    refresh_token: string;
  }): Promise<Result<AuthSuccess, AppError>> {
    if (payload.access_token) {
      setTokens(payload.access_token, payload.refresh_token);
      persistToStorage();
    }
    return fetchMeAfterLogin();
  }

  // ── 持久化到 localStorage ──
  function persistToStorage(): void {
    try {
      if (_token.value) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            user: user.value,
            isLoggedIn: true,
            _token: _token.value,
            _refreshToken: _refreshToken.value,
            onboardingCompleted: onboardingCompleted.value,
          }),
        );
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      // 存储不可用（配额用尽/隐私模式/被禁用）不该让已成功的登录冒未捕获异常：
      // 内存态已就绪，只是无法跨刷新持久化
      console.warn("[auth] 会话持久化失败", e);
    }
  }

  // ── API: 密码登录 ──
  async function loginPassword(
    account: string,
    password: string,
  ): Promise<Result<AuthSuccess, AppError>> {
    const result = await authApi.loginPassword(account, password);
    if (result.isErr()) {
      session.value = "anonymous";
      return err(result.error);
    }

    const data = result.value;
    if (data.requires_2fa || data.setup_required) {
      // 暂存 temp_token，供后续 2FA 验证（submit2FA）使用
      _pendingTempToken.value = data.temp_token ?? null;
      return ok({
        requires2FA: data.requires_2fa,
        requires2FASetup: data.setup_required,
      });
    }

    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token);
      persistToStorage();
    }

    return fetchMeAfterLogin();
  }

  // ── API: 注册本地账户 ──
  async function registerLocal(
    username: string,
    password: string,
  ): Promise<Result<AuthSuccess, AppError>> {
    const result = await authApi.registerLocal(username, password);
    if (result.isErr()) return err(result.error);
    return completeLogin(result.value);
  }

  // ── API: 注册普通账户（发送验证码） ──
  async function registerNormal(
    username: string,
    password: string,
    email?: string,
    phone?: string,
  ): Promise<
    Result<
      { txn_id: string; email_sent: boolean; phone_sent: boolean },
      AppError
    >
  > {
    return authApi.registerNormal(
      username,
      password,
      email ?? null,
      phone ?? null,
    );
  }

  // ── API: 验证并完成普通账户注册 ──
  async function verifyNormalRegister(
    txnId: string,
    code: string,
    type: "email" | "phone",
  ): Promise<Result<AuthSuccess, AppError>> {
    const result = await authApi.registerNormalVerify(
      txnId,
      type === "email" ? code : null,
      type === "phone" ? code : null,
    );
    if (result.isErr()) return err(result.error);
    return completeLogin(result.value);
  }

  // ── API: 短信/邮箱验证码登录（发送验证码） ──
  async function requestLoginCode(
    contact: string,
  ): Promise<Result<MessageResponse, AppError>> {
    return authApi.requestLoginCode(contact);
  }

  // ── API: 短信/邮箱验证码登录（验证） ──
  async function loginCode(
    contact: string,
    code: string,
  ): Promise<Result<AuthSuccess, AppError>> {
    const result = await authApi.loginCode(contact, code);
    if (result.isErr()) {
      session.value = "anonymous";
      return err(result.error);
    }
    if (result.value.requires_2fa || result.value.setup_required) {
      // 暂存 temp_token，供后续 2FA 验证
      _pendingTempToken.value = result.value.temp_token ?? null;
      return ok({
        requires2FA: result.value.requires_2fa,
        requires2FASetup: result.value.setup_required,
      });
    }
    return completeLogin(result.value);
  }

  // ── API: Magic Link 请求 ──
  async function requestMagicLink(
    email: string,
  ): Promise<Result<MessageResponse, AppError>> {
    return authApi.requestMagicLink(email);
  }

  // ── API: Magic Link 验证 ──
  async function verifyMagicLink(
    token: string,
  ): Promise<Result<AuthSuccess, AppError>> {
    const result = await authApi.verifyMagicLink(token);
    if (result.isErr()) {
      session.value = "anonymous";
      return err(result.error);
    }
    return completeLogin(result.value);
  }

  // ── API: 登出 ──
  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // 即使后端登出失败也清理本地状态
    }
    clearTokens();
    // 2FA 过渡态与引导标记也要清：否则登出后 getPending2FA() 仍能读到上一个会话的 temp_token
    clearPending2FA();
    isLoggedIn.value = false;
    user.value = null;
    onboardingCompleted.value = false;
    session.value = "anonymous";
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  // ── 更新用户 ──
  function updateUser(updated: UserInfo): void {
    user.value = updated;
    if (_token.value) persistToStorage();
  }

  // ── 2FA temp_token 过渡态 ──
  function holdPending2FA(token: string | null): void {
    _pendingTempToken.value = token;
  }
  function getPending2FA(): string | null {
    return _pendingTempToken.value;
  }
  function clearPending2FA(): void {
    _pendingTempToken.value = null;
  }

  // ── 重置状态 ──
  function resetState(): void {
    user.value = null;
    isLoggedIn.value = false;
    session.value = "anonymous";
    onboardingCompleted.value = false;
    clearTokens();
    clearPending2FA();
    // 同时清掉持久化快照：否则 resetState 之后一刷新，restoreFromStorage 会把
    // 已经登出的会话重新读回来（与 lkm:auth-cleared 防「假登录」的初衷冲突）
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  return {
    // State
    user,
    isLoggedIn,
    session,
    onboardingCompleted,
    // Getters
    accountLevel,
    username,
    // Actions
    fetchMe,
    loginPassword,
    registerLocal,
    registerNormal,
    verifyNormalRegister,
    requestLoginCode,
    loginCode,
    requestMagicLink,
    verifyMagicLink,
    logout,
    updateUser,
    resetState,
    restoreFromStorage,
    restoreAndValidate,
    persistToStorage,
    setTokens,
    clearTokens,
    holdPending2FA,
    getPending2FA,
    clearPending2FA,
  };
});

export interface AuthSuccess {
  requires2FA?: boolean;
  requires2FASetup?: boolean;
}
