import { get, post, put, del, getHttpAccessToken } from "../../http/client";
import { apiFetch } from "../fetch";

// ── 类型 ──

export interface UserInfo {
  id: number;
  username: string;
  account_level: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  user_id: number;
  account_level: string;
  requires_2fa?: boolean;
  setup_required?: boolean;
  temp_token?: string;
}

/** 登录/续签成功后返回的令牌载荷（与 TokenData 同构）。 */
export type AuthTokenData = TokenData;

export interface ContactLink {
  name: string;
  icon?: string;
  url?: string;
}

export interface ProfileInfo {
  nickname: string | null;
  avatar: string | null;
  role: string;
  account_level?: string;
  bio?: string | null;
  major?: string | null;
  grade?: string | null;
  interests?: string[];
  ideals?: string | null;
  points?: number;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  project_count?: number;
  column_article_count?: number;
  has_column_access?: boolean;
  title?: string;
  contact_links?: ContactLink[];
}

export interface RegNormalResponse {
  message: string;
  txn_id: string;
  email_sent: boolean;
  phone_sent: boolean;
  email_code?: string;
  phone_code?: string;
}

export interface MessageResponse {
  message: string;
}

export interface OnboardingState {
  step: number;
  completed: boolean;
  data?: Record<string, unknown> | null;
}

// ── 2FA / TOTP ──

/** POST /auth/2fa/setup/begin 与 /setup/temp 的响应 data。 */
export interface TOTPSetupBeginData {
  secret: string;
  qr_code_uri: string;
}

/** POST /auth/2fa/setup/complete(或 complete/temp) 的响应 data。 */
export interface TOTPSetupCompleteData {
  recovery_codes: string[];
  confirmed_saved_required: boolean;
}

/** TOTPSetupCompleteTempData —— 管理员强制设置也带令牌。 */
export interface TOTPSetupCompleteTempData extends TOTPSetupCompleteData {
  access_token?: string | null;
  refresh_token?: string | null;
}

/** POST /auth/2fa/verify（登录时 TOTP 验证）的响应 data。 */
export interface TOTPVerifyData {
  access_token?: string | null;
  refresh_token?: string | null;
  user_id: number;
  account_level: string;
  trust_device: boolean;
  mfa_verified?: boolean | null;
  message?: string | null;
}

export interface TOTPConfirmData {
  message: string;
}

export interface TOTPDisableData {
  message: string;
}

/** GET /auth/2fa/status —— 2FA 是否已开启。 */
export interface TOTPStatusData {
  enabled: boolean;
}

/** GET /auth/settings —— 当前绑定状态。 */
export interface SettingsInfo {
  email?: string | null;
  phone?: string | null;
  github?: string | null;
  has_2fa: boolean;
}

// ── Passkey / WebAuthn ──

/** Passkey begin（register/login）的响应 data。public_key 结构见 webauthn util。 */
export interface PasskeyBeginOptions {
  challenge_id: string;
  public_key: Record<string, unknown>;
}

export interface PasskeyRegisterCompleteData {
  message: string;
  device_name: string;
}

/** GET /auth/passkey/credentials 的单条记录。 */
export interface PasskeyCredential {
  id: number;
  credential_id: string;
  device_name: string;
  created_at: string;
}

// ── GitHub OAuth ──

export interface OAuthRedirectData {
  url: string;
}

// ── 找回密码 ──

/** recover verify 类的响应 data（可能触发 2FA 分流）。 */
export interface RecoverRequires2FA {
  message: string;
  requires_2fa?: boolean | null;
  txn_id?: string | null;
  temp_token?: string | null;
}

export interface RecoverTxMsg {
  message: string;
  txn_id: string;
}

// ── 绑定(settings) ──

export interface BindCodeRequestData {
  message: string;
  record_id: number;
}

export interface BindCodeVerifyData {
  message: string;
}

// ── Auth API ──

export const authApi = {
  // ── 获取当前用户 ──
  getMe: () => get<UserInfo>("/api/v1/auth/me"),

  // ── 密码登录 ──
  loginPassword: (account: string, password: string) =>
    post<TokenData>("/api/v1/auth/login/password", { account, password }),

  // ── 短信/邮箱验证码登录（请求验证码） ──
  requestLoginCode: (contact: string) =>
    post<MessageResponse>(
      `/api/v1/auth/login/code/request?contact=${encodeURIComponent(contact)}`,
    ),

  // ── 短信/邮箱验证码登录（验证） ──
  loginCode: (contact: string, code: string) =>
    post<TokenData>(
      `/api/v1/auth/login/code?contact=${encodeURIComponent(contact)}&code=${encodeURIComponent(code)}`,
    ),

  // ── Magic Link 请求 ──
  requestMagicLink: (email: string) =>
    post<MessageResponse>(
      `/api/v1/auth/login/magic-link/request?email=${encodeURIComponent(email)}`,
    ),

  // ── Magic Link 验证 ──
  verifyMagicLink: (token: string) =>
    get<TokenData>(
      `/api/v1/auth/login/magic-link/verify?token=${encodeURIComponent(token)}`,
    ),

  // ── 注册本地账户 ──
  registerLocal: (username: string, password: string) =>
    post<TokenData>("/api/v1/auth/reg/local", { username, password }),

  // ── 注册普通账户（发送验证码） ──
  registerNormal: (
    username: string,
    password: string,
    email: string | null,
    phone: string | null,
  ) =>
    post<RegNormalResponse>("/api/v1/auth/reg/normal", {
      username,
      password,
      email,
      phone,
    }),

  // ── 验证并完成普通账户注册 ──
  registerNormalVerify: (
    txnId: string,
    emailCode: string | null,
    phoneCode: string | null,
  ) => {
    const params = new URLSearchParams();
    params.set("txn_id", txnId);
    if (emailCode) params.set("email_code", emailCode);
    if (phoneCode) params.set("phone_code", phoneCode);
    return post<TokenData>(
      `/api/v1/auth/reg/normal/verify?${params.toString()}`,
    );
  },

  // ── 手机号注册（发送验证码） ──
  registerPhone: (phone: string) =>
    post<{ phone: string; message: string }>("/api/v1/auth/reg/phone", {
      phone,
    }),

  // ── 手机号注册（验证） ──
  registerPhoneVerify: (phone: string, code: string) =>
    post<TokenData>(
      `/api/v1/auth/reg/phone/verify?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(code)}`,
    ),

  // ── 邮箱注册（发送验证码） ──
  registerEmail: (email: string) =>
    post<{ email: string; message: string }>("/api/v1/auth/reg/email", {
      email,
    }),

  // ── 邮箱注册（验证） ──
  registerEmailVerify: (email: string, code: string) =>
    post<TokenData>(
      `/api/v1/auth/reg/email/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
    ),

  // ── 刷新 Token ──
  refreshToken: (refreshToken: string) =>
    post<{ access_token: string; refresh_token: string }>(
      "/api/v1/auth/refresh",
      { refresh_token: refreshToken },
    ),

  // ── 登出 ──
  logout: () => post<MessageResponse>("/api/v1/auth/logout"),

  // ── 获取用户资料 ──
  getUserProfile: (userId: number) =>
    get<ProfileInfo>(`/api/v1/auth/${userId}`),

  // ── 编辑用户资料 ──
  editProfile: (
    userId: number,
    info: {
      nickname?: string | null;
      avatar?: string | null;
      contact_links?: ContactLink[];
    },
  ) => put<ProfileInfo>(`/api/v1/auth/${userId}/profile`, info),

  // ── 头像 ──

  /** 上传头像（multipart file，≤2MB），成功后返回更新后的 avatar 字段。 */
  uploadAvatar: async (file: File): Promise<{ avatar: string | null }> => {
    const token = getHttpAccessToken();
    const fd = new FormData();
    fd.append("file", file);
    const result = await apiFetch("/api/v1/auth/avatar", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (result.isErr()) {
      throw new Error(
        `头像上传失败 ${result.error.message ?? result.error.name}`,
      );
    }
    const res = result.value;
    if (!res.ok) {
      throw new Error(`头像上传失败 ${res.status}`);
    }
    const b = (await res.json()) as { data?: { avatar: string | null } };
    return (b?.data ?? { avatar: null }) as { avatar: string | null };
  },

  /** 读取头像图片 URL（GET 流式返回，未上传时为 404）。 */
  getAvatarUrl: (userId: string | number): string =>
    `/api/v1/auth/avatar/${userId}`,

  // ── 根据用户名获取用户信息（公开，无需登录） ──
  getUserByUsername: (username: string) =>
    get<ProfileInfo>(
      `/api/v1/auth/user/by-username/${encodeURIComponent(username)}`,
    ),

  // ── 2FA / TOTP ──

  /** 开始 TOTP 设置，返回密钥与 otpauth 二维码 URI。 */
  start2FA: () => post<TOTPSetupBeginData>("/api/v1/auth/2fa/setup/begin"),

  /** 提交当前 TOTP 码完成设置，返回恢复码。 */
  verify2FAEnable: (code: string) =>
    post<TOTPSetupCompleteData>("/api/v1/auth/2fa/setup/complete", { code }),

  /** 管理员强制设置：用登录临时令牌开始 TOTP 设置（返回密钥与二维码 URI）。 */
  start2FATemp: (tempToken: string) =>
    post<TOTPSetupBeginData>("/api/v1/auth/2fa/setup/temp", undefined, {
      params: { temp_token: tempToken },
    }),

  /** 管理员强制设置：提交当前 TOTP 码完成设置，返回恢复码与会话令牌。 */
  verify2FAEnableTemp: (tempToken: string, code: string) =>
    post<TOTPSetupCompleteTempData>(
      "/api/v1/auth/2fa/setup/complete/temp",
      undefined,
      {
        params: { temp_token: tempToken, code },
      },
    ),

  /** 确认已保存恢复码。 */
  confirm2FA: () => post<TOTPConfirmData>("/api/v1/auth/2fa/setup/confirm"),

  /** 关闭 2FA（需当前 TOTP 码或恢复码）。 */
  disable2FA: (code: string, recoveryCode?: string) =>
    del<TOTPDisableData>("/api/v1/auth/2fa", {
      data: { code, recovery_code: recoveryCode },
    }),

  /** 登录时验证 TOTP 或恢复码（purpose=2fa/recovery）。 */
  verify2FA: (
    tempToken: string,
    code?: string | null,
    recoveryCode?: string | null,
  ) =>
    post<TOTPVerifyData>("/api/v1/auth/2fa/verify", {
      temp_token: tempToken,
      code: code ?? undefined,
      recovery_code: recoveryCode ?? undefined,
    }),

  /** 查询当前用户 2FA 是否已开启。 */
  get2FAStatus: () => get<TOTPStatusData>("/api/v1/auth/2fa/status"),

  /** 前台危险操作 step-up：验证当前已登录用户 TOTP 或恢复码，通过后换发带 1h 信任的新 access token。 */
  verifyStepUp2FA: (code: string | undefined, recoveryCode?: string) =>
    post<TOTPVerifyData>("/api/v1/auth/2fa/step-up", {
      code,
      recovery_code: recoveryCode,
    }),

  // ── Passkey / WebAuthn ──

  passkeyRegisterBegin: () =>
    post<PasskeyBeginOptions>("/api/v1/auth/passkey/register/begin"),
  passkeyRegisterComplete: (
    rawId: string,
    challengeId: string,
    response: Record<string, unknown>,
    deviceName?: string,
  ) =>
    post<PasskeyRegisterCompleteData>(
      "/api/v1/auth/passkey/register/complete",
      {
        rawId,
        challenge_id: challengeId,
        response,
        device_name: deviceName,
      },
    ),
  passkeyLoginBegin: () =>
    post<PasskeyBeginOptions>("/api/v1/auth/passkey/login/begin"),
  passkeyLoginComplete: (
    rawId: string,
    challengeId: string,
    response: Record<string, unknown>,
  ) =>
    post<TokenData>("/api/v1/auth/passkey/login/complete", {
      rawId,
      challenge_id: challengeId,
      response,
    }),
  listPasskeys: () =>
    get<PasskeyCredential[]>("/api/v1/auth/passkey/credentials"),
  deletePasskey: (id: number) =>
    del<MessageResponse>(`/api/v1/auth/passkey/${id}`),

  // ── GitHub OAuth ──

  /** 登录入口（整页跳转，走 302）。 */
  githubLoginUrl: () => "/api/v1/auth/oauth/github/login",
  /** 绑定用授权 URL（供 JS 跳转）。 */
  githubBindRedirect: () =>
    post<OAuthRedirectData>("/api/v1/auth/oauth/github/login/redirect"),
  /** 绑定回调确认。 */
  githubBindCallback: (code: string, state: string) =>
    get<MessageResponse>(
      `/api/v1/auth/oauth/github/bind-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    ),

  // ── 找回密码 ──

  recoverCheck: (account: string) =>
    post<{ recoverable: boolean }>("/api/v1/auth/recover/check", { account }),
  recoverPhone: (phone: string) =>
    post<MessageResponse>("/api/v1/auth/recover/phone", { phone }),
  recoverPhoneVerify: (phone: string, code: string, newPassword?: string) =>
    post<RecoverRequires2FA>("/api/v1/auth/recover/phone/verify", {
      phone,
      code,
      new_password: newPassword,
    }),
  recoverEmail: (email: string) =>
    post<MessageResponse>("/api/v1/auth/recover/email", { email }),
  recoverEmailVerify: (email: string, code: string, newPassword?: string) =>
    post<RecoverRequires2FA>("/api/v1/auth/recover/email/verify", {
      email,
      code,
      new_password: newPassword,
    }),
  recoverMagicLink: (email: string) =>
    post<MessageResponse>("/api/v1/auth/recover/magic-link", { email }),
  recoverMagicLinkVerify: (token: string, newPassword?: string) =>
    post<RecoverRequires2FA>("/api/v1/auth/recover/magic-link/verify", {
      token,
      new_password: newPassword,
    }),
  recoverVerifyTotp: (txnId: string, tempToken: string) =>
    post<RecoverTxMsg>("/api/v1/auth/recover/verify-totp", {
      txn_id: txnId,
      temp_token: tempToken,
    }),
  recoverComplete: (txnId: string, newPassword: string) =>
    post<MessageResponse>("/api/v1/auth/recover/complete", {
      txn_id: txnId,
      new_password: newPassword,
    }),

  // ── 绑定邮箱 / 手机 ──

  bindEmailRequest: (email: string) =>
    post<BindCodeRequestData>("/api/v1/auth/settings/bind-email/request", {
      email,
    }),
  bindEmailVerify: (email: string, code: string) =>
    post<BindCodeVerifyData>("/api/v1/auth/settings/bind-email/verify", {
      email,
      code,
    }),
  bindPhoneRequest: (phone: string) =>
    post<BindCodeRequestData>("/api/v1/auth/settings/bind-phone/request", {
      phone,
    }),
  bindPhoneVerify: (phone: string, code: string) =>
    post<BindCodeVerifyData>("/api/v1/auth/settings/bind-phone/verify", {
      phone,
      code,
    }),

  /** 查询当前绑定状态（邮箱 / 手机 / GitHub / 2FA）。 */
  getSettings: () => get<SettingsInfo>("/api/v1/auth/settings"),

  /** 解绑（type: email | phone | github）；已开启 2FA 时需 TOTP 码或恢复码。 */
  unbind: (
    type: "email" | "phone" | "github",
    code?: string,
    recoveryCode?: string,
  ) =>
    del<MessageResponse>(`/api/v1/auth/settings/${type}`, {
      data: { code, recovery_code: recoveryCode },
    }),

  // ── Onboarding ──
  getOnboarding: () => get<OnboardingState>("/api/v1/auth/onboarding"),
  setOnboardingStep: (step: number, data: Record<string, unknown>) =>
    put<OnboardingState>(`/api/v1/auth/onboarding/steps/${step}`, { data }),
  skipOnboarding: () => post<OnboardingState>("/api/v1/auth/onboarding/skip"),
};
