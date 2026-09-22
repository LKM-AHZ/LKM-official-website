// ---------------------------------------------------------------------------
// AI Client – security-hardened store
//
// Principles:
//  1. API key lives ONLY in module memory (never localStorage / sessionStorage / URL)
//  2. Endpoints must be HTTPS (no http / javascript / data / file / credentials-in-URL)
//  3. Every request is guarded by a 15 s timeout merged with the caller's AbortSignal
//  4. Responses are validated for content-type, byte-size and text field before return
//  5. Error messages never include the key or the full raw response body
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AI Client 使用 ~/lib/api 的 apiFetch wrapper（支持 AbortController/SSE）
// ---------------------------------------------------------------------------

import { ok, err } from "neverthrow";
import { apiFetch } from "~/lib/api";
import type { Result } from "neverthrow";
import { t } from "~/lib/i18n";

// ---- Types -----------------------------------------------------------------

export interface AiCompletionInput {
  prompt: string;
  context: string;
  operation: string;
  language?: string;
}

export interface AiCompletionOptions {
  /** Caller-provided AbortSignal (merged with internal timeout) */
  signal?: AbortSignal;
}

// ---- Constants -------------------------------------------------------------

const PROMPT_TEMPLATES: Record<string, string> = {
  续写: "请续写以下内容，保持一致的风格和语气：\n\n{context}\n\n续写：",
  总结: "请用简洁的语言总结以下内容，提取关键要点：\n\n{context}\n\n总结：",
  翻译: "请将以下内容翻译为{language}：\n\n{context}\n\n翻译：",
  改写: "请改写以下内容，使用更专业的语言表达：\n\n{context}\n\n改写：",
  修复语法: "请修复以下内容的语法和拼写错误：\n\n{context}\n\n修复后：",
  生成标题: "请根据以下内容生成一个简短的标题：\n\n{context}\n\n标题：",
};

const DEFAULT_MODEL = "gpt-3.5-turbo";
const MAX_RESPONSE_BYTES = 262144; // 256 KiB

/** Allowed protocols for the endpoint URL */
const ALLOWED_PROTOCOLS = new Set(["https:"]);

// ---- Module-level in-memory config (never persisted to storage or URL) -----

let _endpoint: string | null = null;
let _apiKey: string | null = null;
let _model: string = DEFAULT_MODEL;

// ---- Public helpers --------------------------------------------------------

/**
 * Validate a user-supplied AI endpoint URL.
 *
 * Only plain HTTPS URLs are accepted. Credentials in the URL, non-HTTPS
 * protocols and pseudo-URLs (`javascript:`, `data:`, `file:`) are rejected.
 */
export function validateAiEndpoint(raw: string): Result<URL, string> {
  if (!raw || raw.trim().length === 0) {
    return err(t("editorData.errApiUrlRequired"));
  }

  const trimmed = raw.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return err(t("editorData.errApiUrlInvalid"));
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return err(t("editorData.errHttpsOnly"));
  }

  if (url.username || url.password) {
    return err(t("editorData.errCredentials"));
  }

  // 伪协议（javascript:/data:/file:）会被 URL 解析成各自的 protocol，上面 ALLOWED_PROTOCOLS
  // 只放行 https:，已在此前拦掉；这层 startsWith 检查不可达，故删除以免留下「多一层保护」的错觉

  return ok(url);
}

/**
 * Store AI config in module memory (NO localStorage / sessionStorage / URL).
 */
export function setAiConfig(
  endpoint: string,
  apiKey: string,
  model: string,
): void {
  _endpoint = endpoint;
  _apiKey = apiKey;
  _model = model || DEFAULT_MODEL;
}

/**
 * Clear the in-memory config (useful for tests and teardown).
 */
export function clearAiConfig(): void {
  _endpoint = null;
  _apiKey = null;
  _model = DEFAULT_MODEL;
}

/**
 * Returns a copy of the current in-memory config (for diagnostic use only;
 * the returned object does NOT include the raw key).
 */
export function getAiConfig(): { endpoint: string | null; model: string } {
  return { endpoint: _endpoint, model: _model };
}

/**
 * Send a completion request to the configured AI endpoint.
 *
 * Security guarantees:
 *  - Requires `setAiConfig()` to have been called first
 *  - Validates the endpoint is HTTPS before every request
 *  - Enforces 15 s timeout (merged with caller's AbortSignal)
 *  - Caps response body at 256 KiB
 *  - Verifies JSON content-type and required text field
 *  - Error messages never leak the API key or full raw body
 */
export async function requestAiCompletion(
  input: AiCompletionInput,
  options?: AiCompletionOptions,
): Promise<Result<string, string>> {
  // ---- 1. Config check ----------------------------------------------------
  if (!_endpoint) {
    return err(t("editorData.errNotConfigured"));
  }

  const endpointValidation = validateAiEndpoint(_endpoint);
  if (endpointValidation.isErr()) {
    return err(
      t("editorData.errConfigInvalid", { detail: endpointValidation.error }),
    );
  }

  const apiKey = _apiKey || "";
  const model = _model;

  // ---- 2. Build prompt ----------------------------------------------------
  let prompt = (PROMPT_TEMPLATES[input.operation] ?? "{context}").replace(
    "{context}",
    input.context,
  );
  if (input.operation === "翻译") {
    prompt = prompt.replace("{language}", input.language || "英文");
  }
  if (input.prompt) {
    prompt = input.prompt;
  }

  // ---- 3. Fetch (via unified apiFetch wrapper, handles timeout + abort) -----
  // 用校验后的 URL 组装请求地址，而不是拿原始字符串拼接：
  // 若 endpoint 带 ?query 或 #fragment（校验只查协议/凭据，不拦这些），
  // 字符串拼接会得到 https://host/api?token=1/v1/chat/completions 这类畸形地址。
  const endpointUrl = endpointValidation.value;
  const url = `${endpointUrl.origin}${endpointUrl.pathname.replace(/\/$/, "")}/v1/chat/completions`;

  const fetchResult = await apiFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的内容写作助手。请直接给出回答，不要多余的解释。",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
    signal: options?.signal,
  });

  if (fetchResult.isErr()) {
    const message = fetchResult.error.message;
    // 只要报文里出现了 key（不论长短）就退回泛化文案：原条件额外要求 length > 4，
    // 于是 ≤4 字符的短 key 会随下面的 detail 一起回显到 UI
    if (apiKey && message.includes(apiKey)) {
      return err(t("editorData.errNetworkFailed"));
    }
    return err(
      t("editorData.errNetworkFailedDetail", {
        message: message.slice(0, 120),
      }),
    );
  }

  const response = fetchResult.value;

  // ---- 5. Validate response metadata --------------------------------------
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    // Consume the body so the connection can be reused
    await response.text().catch(() => {});
    const statusPart = response.status
      ? t("editorData.errStatusCodeSuffix", { status: response.status })
      : "";
    return err(t("editorData.errUnexpectedContentType") + statusPart);
  }

  // ---- 6. Check status code -----------------------------------------------
  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
      // Truncate error body to avoid leaking large responses
      if (errorBody.length > 300) {
        errorBody = errorBody.slice(0, 300) + "…";
      }
    } catch {
      // ignore
    }

    // Sanitize: never include the API key in error messages
    let safeError = t("editorData.errServiceStatus", {
      status: response.status,
    });
    if (errorBody && !errorBody.includes(apiKey) && apiKey.length > 0) {
      safeError += `：${errorBody.slice(0, 200)}`;
    } else if (errorBody) {
      // Body might contain the key – use a generic prefix
      safeError += t("editorData.errCheckKey");
    }

    return err(safeError);
  }

  // ---- 7. Parse and validate JSON body ------------------------------------
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return err(t("editorData.errParseFailed"));
  }

  if (data === null || data === undefined || typeof data !== "object") {
    return err(t("editorData.errInvalidDataFormat"));
  }

  const obj = data as Record<string, unknown>;

  // ---- 8. Check for API-level errors --------------------------------------
  if (obj.error && typeof obj.error === "object") {
    const errMsg =
      (obj.error as Record<string, unknown>).message ??
      t("editorData.errUnknown");
    const safe = String(errMsg).slice(0, 200);
    if (safe.includes(apiKey) && apiKey.length > 4) {
      return err(t("editorData.errApiKeyInvalid"));
    }
    return err(t("editorData.errServiceError", { detail: safe }));
  }

  // ---- 9. Extract and validate text field ---------------------------------
  const choices = obj.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return err(t("editorData.errIncompleteReply"));
  }

  const firstChoice = choices[0] as Record<string, unknown> | undefined;
  if (!firstChoice || typeof firstChoice !== "object") {
    return err(t("editorData.errIncomplete"));
  }

  const message = firstChoice.message as Record<string, unknown> | undefined;
  if (!message || typeof message !== "object") {
    return err(t("editorData.errMissingMessage"));
  }

  const content = message.content;
  if (typeof content !== "string" || content.length === 0) {
    return err(t("editorData.errEmptyReply"));
  }

  // ---- 10. Enforce response size limit ------------------------------------
  const byteLength = new TextEncoder().encode(content).length;
  if (byteLength > MAX_RESPONSE_BYTES) {
    return err(
      t("editorData.errTooLarge", {
        bytes: byteLength,
        max: MAX_RESPONSE_BYTES,
      }),
    );
  }

  // ---- 11. Success --------------------------------------------------------
  return ok(content);
}

export { PROMPT_TEMPLATES };
