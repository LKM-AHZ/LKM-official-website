import { reactive, ref, toRef } from "vue";
import { useAuthStore } from "~/stores/auth";
import { resolveSafeRedirect } from "~/features/auth/utils/safe-redirect";
import { t } from "~/lib/i18n";
import { useVerificationCountdown } from "./useVerificationCountdown";

export type RegisterType = "normal" | "local";
export type RegisterStage = "form" | "verify" | "done";

export interface RegisterFlowOptions {
  redirect?: string | null;
  onSuccess?: (dst: string) => void;
}

export interface RegisterFlow {
  // state —— reactive 包裹的 ref 已解包，模板里直接 flow.username=…
  type: RegisterType;
  username: string;
  password: string;
  confirm: string;
  contact: string;
  useEmail: boolean;
  code: string;
  txnId: string;
  stage: RegisterStage;
  loading: boolean;
  error: string | null;
  countdown: number;
  countdownRunning: boolean;
  // methods
  submit: () => Promise<void>;
  submitCode: () => Promise<void>;
  reset: () => void;
  hasAgreedTerms: boolean;
}

// ──────────────────────────────────────────────
// 工具函数：输入校验与安全防护（喵，安全第一！）
// ──────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^1[3-9]\d{9}$/;

/**
 * 前端侧 XSS 防护：移除输入中的 HTML 标签。（喵，坏人退散！）
 *
 * ⚠️ 注意：此函数仅作为前端第一道防线，不能替代后端校验。（喵喵喵，后端辛苦了！）
 * 攻击者可绕过浏览器直接调用 API，因此后端必须再次净化所有输入。（重要的事情说三遍喵！）
 *
 * 后端对接点：（喵，后端大佬可参考！）
 * - POST /api/v1/auth/register        → 需在后端对 username / contact 做二次净化
 * - POST /api/v1/auth/register/verify → 需在后端对 code 做格式校验
 */
const sanitizeInput = (value: string): string => value.replace(/<[^>]*>/g, "");

/**
 * 注册流程 Composable。（喵，注册逻辑！）
 *
 * 统一驱动本地 / 普通账户注册，复用 AuthStore 的 registerLocal / registerNormal /
 * verifyNormalRegister。**本地注册一律使用用户填写的密码，绝不生成随机密码。**（喵，用户自己设密码！）
 * 普通账户注册成功进入 verify 步（提交验证码），成功后跳转统一走 resolveSafeRedirect。
 */
export function useRegisterFlow(
  options: RegisterFlowOptions = {},
): RegisterFlow {
  const store = useAuthStore();
  const { redirect = null, onSuccess } = options;

  // ── State ──（喵，状态管理不能乱！）
  const type = ref<RegisterType>("normal");
  const username = ref("");
  const password = ref("");
  const confirm = ref("");
  const contact = ref("");
  const useEmail = ref(true);
  const code = ref("");
  const txnId = ref("");
  const stage = ref<RegisterStage>("form");
  const loading = ref(false);
  const error = ref<string | null>(null);
  const countdown = useVerificationCountdown(60);
  const countdownRunning = toRef(countdown, "running");

  // 项目当前无真实可访问的 terms 页面（src/pages 下无 terms.*），故不提供该勾选，
  // 避免指向无效链接。
  const hasAgreedTerms = ref(false);

  // ── 帮助函数（喵，工具人上线！） ──
  function fail(msg?: string): void {
    error.value = msg ?? t("messages.operationFailed");
  }

  function succeed(): void {
    error.value = null;
    const dst = resolveSafeRedirect(redirect) || "/";
    if (typeof onSuccess === "function") onSuccess(dst);
  }

  // ── 提交注册（喵，重头戏来了！） ──
  async function submit(): Promise<void> {
    error.value = null;

    // ── 前端校验层（喵，把坏东西挡在外面！） ──
    // 用户名（喵，起个好名字很重要！）
    const trimmedUsername = username.value.trim();
    if (trimmedUsername.length < 3)
      return fail(t("messages.register.usernameTooShort"));
    if (trimmedUsername.length > 50)
      return fail(t("messages.register.usernameTooLong"));
    if (/[<>/]/.test(trimmedUsername))
      return fail(t("messages.register.usernameSpecialChars"));

    // 密码（不净化，保留原始输入交给后端 bcrypt，喵，密码要保护好！）
    if (password.value.length < 6)
      return fail(t("messages.register.passwordTooShort"));
    if (password.value.length > 128)
      return fail(t("messages.register.passwordTooLong"));
    if (password.value !== confirm.value)
      return fail(t("messages.register.passwordMismatch"));

    // 联系方式（仅普通账户必填，喵，不然找不到人！）
    if (type.value === "normal") {
      const trimmedContact = contact.value.trim();
      if (!trimmedContact)
        return fail(
          useEmail.value
            ? t("messages.register.enterEmail")
            : t("messages.register.enterPhone"),
        );
      if (/[<>/]/.test(trimmedContact))
        return fail(t("messages.register.contactSpecialChars"));
      if (useEmail.value && !EMAIL_RE.test(trimmedContact))
        return fail(t("messages.register.invalidEmail"));
      if (!useEmail.value && !PHONE_RE.test(trimmedContact))
        return fail(t("messages.register.invalidPhone"));
    }

    loading.value = true;
    try {
      if (type.value === "local") {
        // 本地注册：使用用户输入的密码，无随机生成
        const r = await store.registerLocal(
          sanitizeInput(trimmedUsername),
          password.value,
        );
        if (r.isErr()) return fail(r.error.message);
        stage.value = "done";
        succeed();
        return;
      }

      // 普通账户：发送验证码，进入 verify 步（喵，等验证码来敲门～）
      const email = useEmail.value ? sanitizeInput(contact.value.trim()) : null;
      const phone = !useEmail.value
        ? sanitizeInput(contact.value.trim())
        : null;
      const r = await store.registerNormal(
        sanitizeInput(trimmedUsername),
        password.value,
        email ?? undefined,
        phone ?? undefined,
      );
      if (r.isErr()) return fail(r.error.message);

      // 防御：确保 txn_id 存在（喵，后端没返回就报错！）
      if (!r.value?.txn_id) {
        return fail(t("messages.register.codeRequestFailed"));
      }
      txnId.value = r.value.txn_id;
      stage.value = "verify";
      countdown.start(); // 倒计时开始！
    } finally {
      loading.value = false;
    }
  }

  // ── 提交验证码（喵，对暗号！） ──
  async function submitCode(): Promise<void> {
    error.value = null;
    if (!txnId.value) return fail(t("messages.register.sessionExpired"));
    if (code.value.length < 1) return fail(t("messages.recovery.enterCode"));
    if (code.value.length > 10)
      return fail(t("messages.register.invalidCodeLength"));
    if (!/^\d+$/.test(code.value))
      return fail(t("messages.register.invalidCodeFormat"));

    loading.value = true;
    try {
      const r = await store.verifyNormalRegister(
        txnId.value,
        sanitizeInput(code.value),
        useEmail.value ? "email" : "phone",
      );
      if (r.isErr()) return fail(r.error.message);
      stage.value = "done";
      succeed(); // 喵，注册成功！完结撒花！
    } finally {
      loading.value = false;
    }
  }

  // ── 重置（喵，回到起点重新来过～） ──
  function reset(): void {
    stage.value = "form";
    username.value = "";
    password.value = "";
    confirm.value = "";
    contact.value = "";
    code.value = "";
    txnId.value = "";
    loading.value = false;
    error.value = null;
    // 防御：确保 stop 方法存在（喵，兼容不同实现！）
    if (typeof countdown.stop === "function") {
      countdown.stop();
    }
    countdownRunning.value = false;
  }

  // reactive 包裹使 ref 解包（与 useLoginFlow 一致），模板里即值类型，消除误报
  return reactive({
    type,
    username,
    password,
    confirm,
    contact,
    useEmail,
    code,
    txnId,
    stage,
    loading,
    error,
    countdown: toRef(countdown, "countdown"),
    countdownRunning,
    submit,
    submitCode,
    reset,
    hasAgreedTerms,
  });
}
