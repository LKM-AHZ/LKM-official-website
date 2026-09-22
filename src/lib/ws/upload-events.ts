// WebSocket 上传登记事件等待器 — 对接后端 /api/v1/ws/events 的「登记完成」推送。
//
// Phase 2-C 起前端直传后**不再 confirm**，登记由对象存储事件通知在后端异步完成，
// 经 WebSocket 推送「upload_registered」。本模块封装：
//   - query token 鉴权（浏览器 WebSocket 无法带自定义头，token 走握手 query 参数）
//   - 同域建立连接（生产同源；dev 由 Vite /api 代理转发 WS upgrade）
//   - 匹配目标 upload_id 的登记事件 → registered；连接失败 → ws-unavailable；
//     超时 → timeout（三种结果由调用方决定提示/回退）
// 仅浏览器运行；SSR 下返回 ws-unavailable，不触碰 WebSocket。

import { getHttpAccessToken } from "../http/client";

export type UploadConfirmResult = "registered" | "timeout" | "ws-unavailable";

const DEFAULT_TIMEOUT_MS = 60_000;

function wsEndpoints(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/v1/ws/events`;
}

/**
 * 等待某次直传被后端登记完成。后端登记完成时向 uploader 的 WS 推送
 * ``{"event":"upload_registered","upload_id":...,"file":{...}}``。
 *
 * @returns 'registered' 登记完成已收到；'timeout' 超时未见登记；
 *          'ws-unavailable' 无法建立 WS/无 token（调用方应回退到列表刷新兜底）。
 */
export async function waitForUploadRegistration(
  uploadId: string,
  options?: { timeoutMs?: number },
): Promise<UploadConfirmResult> {
  // SSR 或浏览器缺 WebSocket：无法实时推送，按不可用处理。
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return "ws-unavailable";
  }
  const token = getHttpAccessToken();
  if (!token) return "ws-unavailable";

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise<UploadConfirmResult>((resolve) => {
    let ws: WebSocket | undefined;
    let settled = false;

    // 超时兜底先建（WebSocket 构造是同步的，提前建不影响语义）：
    // 声明在 finish 之前，finish 里才能安全引用（否则提前 finish 会命中 TDZ）
    const timer = setTimeout(() => finish("timeout"), timeoutMs);

    // finish 幂等：多次触发（超时/事件/断连竞态）仅首次生效
    const finish = (result: UploadConfirmResult): void => {
      if (settled) return;
      settled = true;
      // 清掉超时定时器：否则它会把 finish/ws/resolve 这些引用多留一整个超时窗口
      clearTimeout(timer);
      try {
        ws?.close();
      } catch {
        /* 已被关闭可不理会 */
      }
      resolve(result);
    };

    let url: string;
    try {
      url = `${wsEndpoints()}?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(url);
    } catch {
      finish("ws-unavailable");
      return;
    }

    ws.onmessage = (ev: MessageEvent): void => {
      try {
        const data = JSON.parse(String(ev.data)) as {
          event?: string;
          upload_id?: string;
        };
        if (data.event === "upload_registered" && data.upload_id === uploadId) {
          finish("registered");
        }
      } catch {
        // 忽略无法解析的帧
      }
    };

    // 建连失败（鉴权 401 / 网络不可达）按不可用收敛，交由上层回退；已 settle 时无害。
    ws.onerror = (): void => finish("ws-unavailable");
    ws.onclose = (): void => finish("ws-unavailable");
  });
}
