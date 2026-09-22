// src/lib/api/fetch.ts
// 统一 fetch wrapper — 用于需要原生 fetch 能力的场景（SSE / AbortController / 流式响应）
//
// 设计：
//  - SSR 时直连真实后端地址（由 API_URL 指定）
//  - CSR 时使用同域 /api
//  - 所有请求返回 Result<Response, AppError>
//  - 调用方自行处理 response.body（如 ReadableStream for SSE）
//  - 调用方可通过 init.signal 传入 AbortController 的 signal
//
// 使用场景：
//  - AI 客户端（外部 OpenAI API）→ apiFetch() with AbortController
//  - 需要 SSE 流式读取的场景
//  - 不适用于普通 REST 请求 → 请使用 ~/lib/http/client 的 get/post/put/del

import { AppError, ErrorCode } from "../errors/error-codes";
import { ok, err } from "../errors/result";
import { t } from "~/lib/i18n";
import type { Result } from "../errors/result";

const DEFAULT_TIMEOUT_MS = 15_000;

function getApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL ?? "";
  }
  return "";
}

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

/**
 * 合并多个 AbortSignal：任一触发则合并后的 signal 触发。
 * 返回 cleanup 供请求结束后摘除监听 —— 外部 signal 常被调用方长期复用，
 * 不摘除会让 abort 监听随请求次数累积（内存泄漏）。
 */
function mergeAbortSignals(signals: AbortSignal[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const cleanup = (): void => {
    signals.forEach((s) => s.removeEventListener("abort", onAbort));
  };
  const onAbort = (): void => {
    controller.abort();
    cleanup();
  };
  signals.forEach((s) => {
    if (s.aborted) {
      controller.abort();
      return;
    }
    s.addEventListener("abort", onAbort, { once: true });
  });
  // 已有 signal 处于 aborted 时提前返回，这里补一次 cleanup，
  // 否则循环中先前已注册的监听不会被摘除
  if (controller.signal.aborted) cleanup();
  return { signal: controller.signal, cleanup };
}

/**
 * 统一 fetch wrapper。
 *
 * 自动处理 SSR/CSR base URL 拼接，添加默认 timeout。
 * 调用方通过 init.signal 传入自定义 AbortController（会与内部 timeout 合并）。
 */
export async function apiFetch(
  url: string,
  init?: RequestInit & { timeout?: number },
): Promise<Result<Response, AppError>> {
  const base = getApiBase();
  const fullUrl = base ? `${base.replace(/\/$/, "")}${url}` : url;
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT_MS;

  const timeoutCtl = createTimeoutSignal(timeout);
  const externalSignal = init?.signal;
  const merged = externalSignal
    ? mergeAbortSignals([timeoutCtl.signal, externalSignal])
    : { signal: timeoutCtl.signal, cleanup: (): void => {} };

  const { signal: _sig, timeout: _to, ...restInit } = init || {};
  void _sig;
  void _to;

  try {
    // eslint-disable-next-line no-restricted-globals
    const response = await fetch(fullUrl, {
      ...restInit,
      signal: merged.signal,
    });
    return ok(response);
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      // 只有内部超时器触发才算超时；外部 signal 主动取消（离开页面/卸载组件）
      // 不该被上报成超时。用 instanceof Error 而非 DOMException：polyfill/运行时
      // 可能抛 name 为 AbortError 的普通 Error。
      const timedOut = timeoutCtl.signal.aborted;
      return err(
        new AppError(
          timedOut ? ErrorCode.HTTP_TIMEOUT : ErrorCode.NETWORK_ERROR,
          t("messages.timeoutOrCancelled"),
        ),
      );
    }

    const message = e instanceof Error ? e.message : String(e);
    return err(
      new AppError(
        ErrorCode.NETWORK_ERROR,
        t("messages.networkRequestFailed", { error: message.slice(0, 300) }),
      ),
    );
  } finally {
    // 无论成功失败都清超时器并摘除合并 signal 上的 abort 监听
    timeoutCtl.clear();
    merged.cleanup();
  }
}
