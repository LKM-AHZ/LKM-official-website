// ---------- 轻量本地加密 (AES-GCM via Web Crypto) ----------
// 密钥派生用 PBKDF2-SHA256 + 每份载荷独立随机 salt。此前直接把 padPass 的结果当密钥：
// 超长口令被静默截断（不同长口令撞成同一把密钥）、短口令用固定公开常量补位，密钥熵极低。
// 新载荷格式 enc2:salt:iv:ct；解密仍兼容历史 enc: 载荷（旧 padPass 直填密钥）。
const PBKDF2_ITERATIONS = 210_000;

async function deriveKey(
  pass: string,
  salt: Uint8Array,
  usage: KeyUsage,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(pass),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // 传底层 ArrayBuffer：Uint8Array<ArrayBufferLike> 不在 lib.dom 的 BufferSource 里
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}
export async function encryptText(text: string, pass: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt, "encrypt");
    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(text),
    );
    return (
      "enc2:" +
      b64(arrayBufferToBase64(salt.buffer as ArrayBuffer)) +
      ":" +
      b64(arrayBufferToBase64(iv.buffer as ArrayBuffer)) +
      ":" +
      b64(arrayBufferToBase64(ct))
    );
  } catch (err) {
    // 不能像以前那样返回明文：调用方会把它当密文存进 storage，
    // 之后再也分不出到底有没有加密过，只会静默泄露内容
    console.warn("[storage] 加密失败:", err);
    throw err;
  }
}
export async function decryptText(
  payload: string,
  pass: string,
): Promise<string | null> {
  try {
    if (!payload) return payload;
    const enc = new TextEncoder();
    if (payload.startsWith("enc2:")) {
      const [, saltB64, ivB64, ctB64] = payload.split(":");
      const salt = new Uint8Array(base64ToArrayBuffer(unb64(saltB64)));
      const iv = new Uint8Array(base64ToArrayBuffer(unb64(ivB64)));
      const ct = new Uint8Array(base64ToArrayBuffer(unb64(ctB64)));
      const key = await deriveKey(pass, salt, "decrypt");
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return new TextDecoder().decode(pt);
    }
    if (payload.startsWith("enc:")) {
      const [, ivB64, ctB64] = payload.split(":");
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(padPass(pass)),
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );
      const iv = new Uint8Array(base64ToArrayBuffer(unb64(ivB64)));
      const ct = new Uint8Array(base64ToArrayBuffer(unb64(ctB64)));
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return new TextDecoder().decode(pt);
    }
    // 非密文（历史明文）原样返回
    return payload;
  } catch (err) {
    // 解密失败返回 null 而不是本地化文案：文案会被当成真实内容继续存/显示
    console.warn("[storage] 解密失败:", err);
    return null;
  }
}
function padPass(p: string): string {
  return (p || "").padEnd(32, "🌙").slice(0, 32);
}
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function base64ToArrayBuffer(b64str: string): ArrayBuffer {
  const bin = atob(b64str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
// 仅用于混淆存储（非强加密）
function b64(s: string): string {
  return btoa(encodeURIComponent(s));
}
function unb64(s: string): string {
  return decodeURIComponent(atob(s));
}
