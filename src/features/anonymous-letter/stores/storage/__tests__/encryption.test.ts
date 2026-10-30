import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decryptText, encryptText } from "../encryption";

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("树洞备份加密格式", () => {
  it("enc2 保留完整长口令，错误口令不返回内容", async () => {
    const password = "a".repeat(32) + "-secret";
    const encrypted = await encryptText("一封私信 🌙", password);
    expect(encrypted.startsWith("enc2:")).toBe(true);
    expect(await decryptText(encrypted, password)).toBe("一封私信 🌙");
    expect(await decryptText(encrypted, "a".repeat(32) + "-other")).toBeNull();
  });

  it("仍可读取旧 enc 载荷和历史明文", async () => {
    const password = "a".repeat(32);
    const iv = new Uint8Array(12);
    const key = await webcrypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "AES-GCM",
      false,
      ["encrypt"],
    );
    const ciphertext = await webcrypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode("legacy"),
    );
    const encode = (bytes: Uint8Array) =>
      btoa(encodeURIComponent(Buffer.from(bytes).toString("base64")));
    const legacy = `enc:${encode(iv)}:${encode(new Uint8Array(ciphertext))}`;
    expect(await decryptText(legacy, password)).toBe("legacy");
    expect(await decryptText("plain text", "unused")).toBe("plain text");
  });
});
