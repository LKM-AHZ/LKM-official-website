import { reactive, ref, toRef } from "vue";
import QRCode from "qrcode";
import { useAuthStore } from "~/stores/auth";
import { authApi } from "~/lib/api/modules/auth";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import { t } from "~/lib/i18n";
import { useVerificationCountdown } from "./useVerificationCountdown";
import { authenticate } from "../lib/webauthn";

export type LoginMode =
  "password" | "code" | "github" | "magic" | "passkey" | "2fa" | "2fa_setup";

export interface LoginFlowOptions {
  redirect?: string | null;
  onSuccess?: (dst: string) => void;
}

export interface LoginFlow {
  // state —— 由 reactive 包裹的 ref 已解包，模板里可直接 flow.mode=… / flow.mode===…
  mode: LoginMode;
  account: string;
  password: string;
  code: string;
  tempToken: string;
  magicSent: boolean;
  loading: boolean;
  error: null | string;
  successMessage: string;
  loggedIn: boolean;
  codeSent: boolean;
  countdown: number;
  countdownRunning: boolean;
  // 强制 2FA 设置态（管理员等 setup_required 场景）
  setup_qr_url: string;
  setup_secret: string;
  setup_recovery_codes: string[];
  setup_recovery_ready: boolean;
  // methods
  submitPassword: () => Promise<void>;
  requestCode: () => Promise<void>;
  submitCode: () => Promise<void>;
  startGithub: () => Promise<void>;
  startMagic: () => Promise<void>;
  continueMagic: () => Promise<void>;
  startPasskey: () => Promise<void>;
  submit2FA: (
    verifyCode: string,
    tempTokenArg?: string,
    recoveryCode?: string,
  ) => Promise<void>;
  init2FASetup: () => Promise<void>;
  complete2FASetup: (code: string) => Promise<void>;
  confirmSetupRecovery: () => void;
  reset: () => void;
  errorMessageByCode: (err: AppError) => string;
}

/** API_BASE：SSR 用 API_URL，浏览器同域。与 http/client 的 base 策略一致。 */
function getApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL || "";
  }
  return "";
}

/**
 * 登录流程 Composable。
 *
 * 统一驱动密码 / 验证码 / GitHub(302) / Magic Link / Passkey / 2FA 登录，
 * 复用 AuthStore 已封装的 store 方法与 authApi 高级方法。
 * Passkey 走真实 WebAuthn；GitHub 走整页跳转后端 302；2FA 用 store 暂存的 temp_token。
 */
export function useLoginFlow(options: LoginFlowOptions = {}): LoginFlow {
  const store = useAuthStore();
  const { onSuccess, redirect = null } = options;

  // ── State ──
  const mode = ref<LoginMode>("password");
  const account = ref("");
  const password = ref("");
  const code = ref("");
  const tempToken = ref("");
  const magicSent = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref("");
  const loggedIn = ref(false);
  const codeSent = ref(false);
  const countdown = useVerificationCountdown(60);
  const countdownRunning = toRef(countdown, "running");
  const setup_qr_url = ref("");
  const setup_secret = ref("");
  const setup_recovery_codes = ref<string[]>([]);
  const setup_recovery_ready = ref(false);

  function errorMessageByCode(e: AppError): string {
    switch (e.code) {
      case ErrorCode.AUTH_ERROR:
      case ErrorCode.HTTP_CLIENT_ERROR:
        return t("messages.auth.wrongCredentials");
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.HTTP_TIMEOUT:
      case ErrorCode.HTTP_SERVER_ERROR:
        return t("messages.networkError");
      default:
        return e.message || t("messages.operationFailed");
    }
  }

  function setError(e: AppError): void {
    error.value = errorMessageByCode(e);
  }

  /**
   * store/网络层抛错（非 Result 返回）时的兜底：只有 try/finally 的话异常会
   * 以未处理拒绝逃出去，error 仍是空，用户看不到任何失败原因。
   */
  function failWith(e: unknown, fallbackMsg: string): void {
    if (e instanceof AppError) {
      setError(e);
      return;
    }
    setError(
      new AppError(
        ErrorCode.NETWORK_ERROR,
        e instanceof Error && e.message ? e.message : fallbackMsg,
      ),
    );
  }

  function succeed(): void {
    error.value = null;
    successMessage.value = t("messages.auth.loginSuccess");
    loggedIn.value = true;
    // redirect 之前只声明不读，成功一律回调空串；改为把调用方给的目标透给 onSuccess
    if (typeof onSuccess === "function") onSuccess(redirect ?? "");
  }

  /**
   * 登录返回 2FA 要求时的统一处理（密码登录与验证码登录两条入口共用，避免两处漂移）：
   * 取回 store 暂存的 temp_token、切换模式，需要初始化时走 init2FASetup。
   * 返回 true 表示已进入 2FA 流程，调用方应直接返回。
   */
  async function handle2FARequirement(
    res: { requires2FA?: boolean; requires2FASetup?: boolean },
    setupHint?: string,
  ): Promise<boolean> {
    if (!res.requires2FA && !res.requires2FASetup) return false;
    // store 已在进入 2FA 时暂存 temp_token，取回填入 flow
    tempToken.value = store.getPending2FA() ?? "";
    if (res.requires2FASetup) {
      mode.value = "2fa_setup";
      if (setupHint) successMessage.value = setupHint;
      await init2FASetup();
    } else {
      mode.value = "2fa";
    }
    return true;
  }

  // ── 密码登录 ──
  async function submitPassword(): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const r = await store.loginPassword(account.value, password.value);
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      if (
        await handle2FARequirement(
          r.value,
          t("messages.auth.passkeyFirstTime2fa"),
        )
      )
        return;
      succeed();
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  // ── 验证码登录：请求验证码 ──
  async function requestCode(): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const r = await store.requestLoginCode(account.value);
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      codeSent.value = true;
      countdown.start();
      successMessage.value = t("messages.auth.codeSent");
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  // ── 验证码登录：提交验证码 ──
  async function submitCode(): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const r = await store.loginCode(account.value, code.value);
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      if (await handle2FARequirement(r.value)) return;
      succeed();
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  // ── GitHub（整页跳转到后端授权 URL，走 302）──
  async function startGithub(): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const base = getApiBase().replace(/\/$/, "");
      const target = `${base}${authApi.githubLoginUrl()}`;
      // 整页跳转：必须用 window.location（axios 会吞 302 并拿到 GitHub HTML）
      window.location.assign(target);
      // 跳转后本页将被卸载；此处不重置 loading，避免闪烁
    } catch (e) {
      loading.value = false;
      setError(
        e instanceof AppError
          ? e
          : new AppError(
              ErrorCode.NETWORK_ERROR,
              t("messages.auth.githubAuthorizationFailed"),
            ),
      );
    }
  }

  // ── Magic Link ──
  async function startMagic(): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const r = await store.requestMagicLink(account.value);
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      magicSent.value = true;
      successMessage.value = t("messages.auth.magicLinkSent");
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  // 校验 magic link 中的 token（通常由邮箱链接重定向到本站后携带 token 调用）。
  async function continueMagic(): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const r = await store.verifyMagicLink(tempToken.value);
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      succeed();
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  // ── Passkey（真实 WebAuthn 登录）──
  async function startPasskey(): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const begin = await authApi.passkeyLoginBegin();
      if (begin.isErr()) {
        setError(begin.error);
        return;
      }
      const serialized = await authenticate(begin.value.public_key);
      const complete = await authApi.passkeyLoginComplete(
        serialized.rawId,
        begin.value.challenge_id,
        serialized.response,
      );
      if (complete.isErr()) {
        setError(complete.error);
        return;
      }
      const data = complete.value;
      if (data.requires_2fa || data.setup_required) {
        store.holdPending2FA(data.temp_token ?? null);
        tempToken.value = data.temp_token ?? "";
        if (data.setup_required) {
          // 强制设置：必须进入设置流程，否则用户拿不到二维码/密钥（与 submitPassword/submitCode 一致）
          mode.value = "2fa_setup";
          await init2FASetup();
        } else {
          mode.value = "2fa";
        }
        return;
      }
      await applyTokenData(data);
      succeed();
    } catch (e) {
      setError(
        e instanceof Error
          ? new AppError(ErrorCode.AUTH_ERROR, e.message)
          : new AppError(
              ErrorCode.AUTH_ERROR,
              t("messages.auth.passkeyLoginFailed"),
            ),
      );
    } finally {
      loading.value = false;
    }
  }

  // ── 2FA 验证 ──
  async function submit2FA(
    verifyCode: string,
    tempTokenArg?: string,
    recoveryCode?: string,
  ): Promise<void> {
    error.value = null;
    loading.value = true;
    try {
      const tt = tempTokenArg ?? tempToken.value;
      if (!tt) {
        setError(
          new AppError(
            ErrorCode.AUTH_ERROR,
            t("messages.auth.missingTempToken"),
          ),
        );
        return;
      }
      // 恢复码登录与 TOTP 登录共用同一条落库路径，避免任一路径漏写会话
      const r = await authApi.verify2FA(
        tt,
        verifyCode || null,
        recoveryCode ?? null,
      );
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      const data = r.value;
      // 2FA 设置流程（purpose=recovery / admin setup）可能不立即发会话 token：
      // 没有 token 就不能标记已登录、更不能触发 onSuccess 跳转，只提示「本步完成」，
      // 由上层 UI 继续引导（与 complete2FASetup 的处理保持一致）
      if (!data.access_token) {
        successMessage.value = t("auth.twoFactor.verifyPassed");
        return;
      }
      store.setTokens(data.access_token, data.refresh_token ?? "");
      await store.fetchMe();
      store.persistToStorage();
      store.clearPending2FA();
      succeed();
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  // ── 强制 2FA 设置（setup_required，管理员等场景）──

  /** 拉取 otpauth 二维码与密钥（用登录临时令牌调 /2fa/setup/temp）。 */
  async function init2FASetup(): Promise<void> {
    setup_qr_url.value = "";
    // secret 也要清：流程重启时旧密钥残留会让用户扫到过期二维码
    setup_secret.value = "";
    setup_recovery_codes.value = [];
    setup_recovery_ready.value = false;
    error.value = null;
    loading.value = true;
    try {
      const r = await authApi.start2FATemp(tempToken.value);
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      setup_secret.value = r.value.secret;
      try {
        setup_qr_url.value = await QRCode.toDataURL(r.value.qr_code_uri);
      } catch {
        setup_qr_url.value = "";
      }
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  /** 提交 TOTP 码完成强制 2FA 设置，领取会话令牌并展示恢复码（/2fa/setup/complete/temp）。 */
  async function complete2FASetup(code: string): Promise<void> {
    error.value = null;
    if (!/^\d{6}$/.test(code)) {
      error.value = t("auth.twoFactor.enter6DigitError");
      return;
    }
    loading.value = true;
    try {
      const r = await authApi.verify2FAEnableTemp(tempToken.value, code);
      if (r.isErr()) {
        setError(r.error);
        return;
      }
      const data = r.value;
      // 领取会话令牌并同步用户，完成登录
      if (data.access_token) {
        store.setTokens(data.access_token, data.refresh_token ?? "");
        await store.fetchMe();
        // 与 submit2FA/applyTokenData 一致：不落盘的话强制 2FA 会话刷新页面即丢失
        store.persistToStorage();
        store.clearPending2FA();
      }
      setup_recovery_codes.value = data.recovery_codes ?? [];
      setup_recovery_ready.value = true;
      // 强制设置：先展示恢复码，用户确认保存后再完成登录（避免错过恢复码）
    } catch (e) {
      failWith(e, t("messages.operationFailed"));
    } finally {
      loading.value = false;
    }
  }

  /** 用户确认已保存恢复码：正式结束 2FA 设置流程，进入成功态。 */
  function confirmSetupRecovery(): void {
    successMessage.value = t("auth.twoFactor.verifyPassed");
    succeed();
  }

  async function applyTokenData(data: {
    access_token?: string | null;
    refresh_token?: string | null;
  }): Promise<void> {
    if (data.access_token) {
      store.setTokens(data.access_token, data.refresh_token ?? "");
      await store.fetchMe();
      store.persistToStorage();
    }
  }

  // ── 重置 ──
  function reset(): void {
    account.value = "";
    password.value = "";
    code.value = "";
    tempToken.value = "";
    magicSent.value = false;
    codeSent.value = false;
    loading.value = false;
    error.value = null;
    successMessage.value = "";
    loggedIn.value = false;
    countdown.stop();
    store.clearPending2FA();
    mode.value = "password";
    setup_qr_url.value = "";
    setup_secret.value = "";
    setup_recovery_codes.value = [];
    setup_recovery_ready.value = false;
  }

  return reactive({
    mode,
    account,
    password,
    code,
    tempToken,
    magicSent,
    loading,
    error,
    successMessage,
    loggedIn,
    codeSent,
    countdown: toRef(countdown, "countdown"),
    countdownRunning,
    submitPassword,
    requestCode,
    submitCode,
    startGithub,
    startMagic,
    continueMagic,
    startPasskey,
    submit2FA,
    init2FASetup,
    complete2FASetup,
    confirmSetupRecovery,
    setup_qr_url,
    setup_secret,
    setup_recovery_codes,
    setup_recovery_ready,
    reset,
    errorMessageByCode,
  });
}
