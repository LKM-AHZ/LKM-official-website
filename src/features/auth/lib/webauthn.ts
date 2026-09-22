// src/features/auth/lib/webauthn.ts
// WebAuthn 工具：把后端 begin 接口返回的 public_key（JSON dict）转换为可传给
// navigator.credentials 的 options，并把浏览器返回的凭据序列化为后端
// complete 接口所需的 payload。仅在浏览器环境中可用，SSR/Node 下应提前短路。

import { t } from "~/lib/i18n";

export interface SerializedAttestation {
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
}

export interface SerializedAssertion {
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    /** 可选：passkey 认证返回的 userHandle（Base64URL）。 */
    userHandle?: string;
  };
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.credentials
  );
}

/** 非浏览器环境下抛出可读错误（避免 RawError 泄漏）。 */
function requireBrowser(): void {
  if (!isBrowser()) {
    throw new Error(t("messages.webauthn.browserOnly"));
  }
}

// ── Base64URL <-> ArrayBuffer ──

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  // 服务端下发的值可能损坏/被截断：出现非法字符，或 base64 长度 %4===1（补等号也救不回来）
  // 时 atob 会抛 InvalidCharacterError/DOMException，不是本模块承诺的可读错误
  if (!/^[A-Za-z0-9\-_]*$/.test(base64Url) || base64Url.length % 4 === 1) {
    throw new Error(
      `Invalid base64url value from server (length=${base64Url.length})`,
    );
  }
  // URL-safe base64 -> base64
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── public_key（后端 dict）→ 标准 options ──

/** 后端 public_key 是任意形状的 dict：只用 unknown 承接，
    下面的取用点都先做 typeof/in 判断，避免宽松类型泄漏进导出的转换签名 */
interface JsonWebElement {
  [key: string]: unknown;
}

/** 把一个字段还原成 ArrayBuffer：字符串按 Base64URL 解，数字数组按字节数组解。 */
function decodeValue(value: unknown): unknown {
  if (typeof value === "string") return base64UrlToBuffer(value);
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return value;
  if (Array.isArray(value)) return new Uint8Array(value as number[]).buffer;
  return value;
}

/** 凭据描述符数组（allowCredentials / excludeCredentials）：逐元素解 id。 */
function decodeCredentialDescriptors(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item) =>
    item && typeof item === "object"
      ? {
          ...(item as JsonWebElement),
          id: decodeValue((item as JsonWebElement).id),
        }
      : item,
  );
}

/**
 * 把后端 public_key（JSON dict）里的 Base64URL 字段还原为 ArrayBuffer，
 * 并以调用方指定的浏览器 API 类型返回。
 *
 * 只解真正是 Base64URL 的字段：顶层 challenge、user.id、allow/excludeCredentials[].id、
 * userHandle。不能按「键名 === id」递归匹配——rp.id 是依赖方域名（如 "example.com"），
 * 送去 base64 解码会抛 InvalidCharacterError 或产出垃圾数据。
 *
 * 入参是**后端下发的未校验 dict**，本模块的职责只到「字段解码」为止：
 * options 的形状合法性由浏览器 API 自己校验（`navigator.credentials.*` 会拒绝非法 options）。
 * 因此这里是本模块唯一的类型边界，断言只集中在这一处，而不是散在两个导出函数上
 * （JsonWebElement 只有索引签名，与浏览器 API 类型无重叠，TS 要求必须显式转换）。
 */
function decodePublicKey<T>(pk: Record<string, unknown>): T {
  const out: JsonWebElement = { ...pk };
  if ("challenge" in out) out.challenge = decodeValue(out.challenge);
  if ("userHandle" in out) out.userHandle = decodeValue(out.userHandle);
  if (out.user && typeof out.user === "object" && !Array.isArray(out.user)) {
    out.user = {
      ...out.user,
      id: decodeValue((out.user as JsonWebElement).id),
    };
  }
  for (const key of ["allowCredentials", "excludeCredentials"]) {
    if (key in out) out[key] = decodeCredentialDescriptors(out[key]);
  }
  return out as T;
}

export function toPublicKeyCredentialCreationOptions(
  pk: Record<string, unknown>,
): PublicKeyCredentialCreationOptions {
  // 返回的是后端字段的浅拷贝（键名已与浏览器 API 对齐）：原来的「展开后再逐字段重列」
  // 既没有过滤未知键，又会在后端省略可选字段时主动补上 undefined 键，故直接返回
  return decodePublicKey<PublicKeyCredentialCreationOptions>(pk);
}

export function toPublicKeyCredentialRequestOptions(
  pk: Record<string, unknown>,
): PublicKeyCredentialRequestOptions {
  return decodePublicKey<PublicKeyCredentialRequestOptions>(pk);
}

// ── 浏览器凭据 → 后端序列化 payload ──

export function serializeAttestation(
  cred: PublicKeyCredential & { response: AuthenticatorAttestationResponse },
): SerializedAttestation {
  return {
    rawId: bufferToBase64Url(cred.rawId),
    response: {
      clientDataJSON: bufferToBase64Url(cred.response.clientDataJSON),
      attestationObject: bufferToBase64Url(cred.response.attestationObject),
    },
  };
}

export function serializeAssertion(
  cred: PublicKeyCredential & { response: AuthenticatorAssertionResponse },
): SerializedAssertion {
  const serialized: SerializedAssertion = {
    rawId: bufferToBase64Url(cred.rawId),
    response: {
      clientDataJSON: bufferToBase64Url(cred.response.clientDataJSON),
      authenticatorData: bufferToBase64Url(cred.response.authenticatorData),
      signature: bufferToBase64Url(cred.response.signature),
    },
  };
  if (cred.response.userHandle && cred.response.userHandle.byteLength > 0) {
    serialized.response.userHandle = bufferToBase64Url(
      cred.response.userHandle as ArrayBuffer,
    );
  }
  return serialized;
}

// ── 高层封装 ──

/**
 * 把 WebAuthn 抛出的 DOMException 转成本地化错误。
 * credentials.create/get 在取消、超时、非安全上下文时是 reject 而不是返回 null，
 * 不转换的话浏览器原文会直接冒到 UI，本地化的失败分支永远走不到。
 */
function toLocalizedError(err: unknown, fallbackMsg: string): Error {
  console.warn("[webauthn] 调用失败:", err);
  return err instanceof Error && err.message
    ? new Error(`${fallbackMsg}（${err.name}）`)
    : new Error(fallbackMsg);
}

/** 注册新 passkey：begin → navigator.credentials.create → 序列化。 */
export async function registerNew(
  pk: Record<string, unknown>,
): Promise<SerializedAttestation> {
  requireBrowser();
  const options = toPublicKeyCredentialCreationOptions(pk);
  // 不预置 null：赋值发生在 try 内、catch 直接抛错，初值在静态上从未被读取
  //（原来是 `= null`，触发 eslint no-useless-assignment）。类型仍保留 `| null`，
  // 下面那句失败兜底判空才有意义。
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.create({
      publicKey: options,
    })) as PublicKeyCredential & { response: AuthenticatorAttestationResponse };
  } catch (err) {
    throw toLocalizedError(err, t("messages.webauthn.createFailed"));
  }
  if (!credential) throw new Error(t("messages.webauthn.createFailed"));
  return serializeAttestation(
    credential as PublicKeyCredential & {
      response: AuthenticatorAttestationResponse;
    },
  );
}

/** 用 passkey 认证：begin → navigator.credentials.get → 序列化。 */
export async function authenticate(
  pk: Record<string, unknown>,
): Promise<SerializedAssertion> {
  requireBrowser();
  const options = toPublicKeyCredentialRequestOptions(pk);
  // 同上：初值从未被读取，去掉 `= null` 但保留 `| null`（失败兜底判空）
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.get({
      publicKey: options,
    })) as PublicKeyCredential & { response: AuthenticatorAssertionResponse };
  } catch (err) {
    throw toLocalizedError(err, t("messages.webauthn.authenticateFailed"));
  }
  if (!credential) throw new Error(t("messages.webauthn.authenticateFailed"));
  return serializeAssertion(
    credential as PublicKeyCredential & {
      response: AuthenticatorAssertionResponse;
    },
  );
}
