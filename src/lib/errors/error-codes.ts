// src/lib/errors/error-codes.ts
export const ErrorCode = {
  // 持久化
  DB_OPEN_FAILED: "DB_OPEN_FAILED",
  DB_WRITE_FAILED: "DB_WRITE_FAILED",
  DB_READ_FAILED: "DB_READ_FAILED",
  DB_DELETE_FAILED: "DB_DELETE_FAILED",
  AUTOSAVE_FAILED: "AUTOSAVE_FAILED",
  VERSION_SAVE_FAILED: "VERSION_SAVE_FAILED",
  BACKUP_FAILED: "BACKUP_FAILED",
  DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND",
  IMPORT_FAILED: "IMPORT_FAILED",
  EXPORT_FAILED: "EXPORT_FAILED",

  // 网络 / HTTP
  NETWORK_ERROR: "NETWORK_ERROR",
  HTTP_TIMEOUT: "HTTP_TIMEOUT",
  HTTP_SERVER_ERROR: "HTTP_SERVER_ERROR",
  HTTP_CLIENT_ERROR: "HTTP_CLIENT_ERROR",

  // 通用
  PARSE_ERROR: "PARSE_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",

  // 安全
  MFA_REQUIRED: "MFA_REQUIRED", // 危险操作需 step-up 2FA（后端 CommonErr.MFA_REQUIRED code=4）
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  constructor(
    public code: ErrorCodeType,
    message: string,
    public cause?: unknown,
  ) {
    // cause 交给原生 Error 通道：它定义的是不可枚举自有属性，而参数属性的后续赋值
    // 只会更新已存在的属性（不改变可枚举性），Object.keys/序列化不会把它当业务字段列出来
    super(message, { cause });
    this.name = "AppError";
  }
}

/** 危险操作需 2FA step-up：会话有效但缺 1 小时内信任。调用方应弹 TOTP 验证后重试。 */
export class MFARequiredError extends AppError {
  constructor() {
    super(ErrorCode.MFA_REQUIRED, "2FA required");
    this.name = "MFARequiredError";
  }
}
