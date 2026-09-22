import type { ProfileInfo, UserInfo } from "~/lib/api/modules/auth";

// ── 真实用户类型（由 API 层类型派生） ──
// UserInfo/ProfileInfo 已声明全部字段，这里只做「组合 + 收窄」，
// 避免同一实体维护两份定义后静默漂移（account_level 曾是 string vs 字面量联合）。

export type AccountLevel = "local" | "normal" | "admin";

export type User = UserInfo &
  Partial<ProfileInfo> & {
    account_level: AccountLevel;
    email?: string | null;
    phone?: string | null;
  };

export type LoginMethod =
  "password" | "sms" | "github" | "magic-link" | "passkey";
export type SessionStatus = "anonymous" | "restoring" | "authenticated";

/** 注册表单提交载荷：后端 registerLocal / registerNormal 都强制要求密码。 */
export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
}
