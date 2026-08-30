import type { AppError } from "~/lib/errors";
import type { Result } from "~/lib/errors/result";

// ── 真实用户类型（对齐后端 UserInfo + profile） ──

export interface User {
  id: number;
  username: string;
  account_level: "local" | "normal" | "admin";
  email?: string | null;
  phone?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  role?: string;
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
  contact_links?: import("~/lib/api/modules/auth").ContactLink[];
}

export type AccountLevel = User["account_level"];
export type LoginMethod =
  "password" | "sms" | "github" | "magic-link" | "passkey";
export type AuthFlow =
  "idle" | "logging_in" | "2fa_required" | "2fa_setup_required" | "logged_in";
export type SessionStatus = "anonymous" | "restoring" | "authenticated";

export interface TempSession {
  userId: number;
  method: LoginMethod;
  isRecovery?: boolean;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  flow: AuthFlow;
  tempSession: TempSession | null;
  loginMethod: LoginMethod | null;
  session: SessionStatus;
  lockedUntil?: number | null;
}

export interface AuthSuccess {
  requires2FA?: boolean;
  requires2FASetup?: boolean;
}

export interface RegisterData {
  username: string;
  password?: string;
  email?: string;
  phone?: string;
}

export type LoginResult = Result<AuthSuccess, AppError>;
export type RegisterResult = Result<void, AppError>;
