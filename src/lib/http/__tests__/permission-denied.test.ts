// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { get, post } from "../client";
import {
  PERMISSION_DENIED_EVENT,
  parsePermissionDenial,
  type PermissionDeniedDetail,
} from "../permission-denied";

/** 后端拒绝体：`{"code":2,"message":"..."}`（见 client.ts 的 msg/message 取值）。 */
function denialResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ code: 2, message }), { status });
}

/** 订阅广播，收集载荷；返回退订函数避免用例之间互相串扰。 */
function collectDispatches(): {
  seen: PermissionDeniedDetail[];
  stop: () => void;
} {
  const seen: PermissionDeniedDetail[] = [];
  const onEvent = (e: Event): void => {
    seen.push((e as CustomEvent<PermissionDeniedDetail>).detail);
  };
  window.addEventListener(PERMISSION_DENIED_EVENT, onEvent);
  return {
    seen,
    stop: () => window.removeEventListener(PERMISSION_DENIED_EVENT, onEvent),
  };
}

const openDispatches: Array<() => void> = [];
afterEach(() => {
  openDispatches.forEach((stop) => stop());
  openDispatches.length = 0;
  vi.unstubAllGlobals();
});

describe("越权拒绝的分类", () => {
  it("只认后端两类「补权限/补注册即可继续」的报文", () => {
    // RequirePermission / require_permission
    expect(
      parsePermissionDenial(403, {
        message: "Missing permission: content.like",
      }),
    ).toEqual({
      permission: "content.like",
    });
    // RequireLevel("normal") —— 后端未指明具体权限点
    expect(
      parsePermissionDenial(403, { message: "Account level insufficient" }),
    ).toEqual({ permission: null });
  });

  it("不把其它 403 收编成「无权限」——它们是更具体的业务拒绝", () => {
    // 同样是 403，但文案本身已经准确（非提问者本人 / 板块禁言），
    // 硬套「无权限 + 去注册」会误导用户
    expect(
      parsePermissionDenial(403, { message: "不能采纳自己的回答" }),
    ).toBeNull();
    expect(
      parsePermissionDenial(403, { message: "你已被本板块禁言" }),
    ).toBeNull();
    expect(parsePermissionDenial(403, { message: "Forbidden" })).toBeNull();
    // 非 403 与本组件无关
    expect(
      parsePermissionDenial(401, { message: "Account level insufficient" }),
    ).toBeNull();
    expect(parsePermissionDenial(403, null)).toBeNull();
  });
});

describe("越权拒绝的广播", () => {
  it("非 GET 的 403 会广播，并带上缺失的权限点", async () => {
    const { seen, stop } = collectDispatches();
    openDispatches.push(stop);
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          denialResponse(403, "Missing permission: content.create"),
        ),
      ),
    );

    const result = await post("/api/v1/content", { title: "x" });

    expect(seen).toEqual([{ permission: "content.create" }]);
    // Result 契约不变：调用方仍拿到可展示的错误
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.cause).toBe(403);
  });

  it("账号等级不足（RequireLevel）同样广播，权限点为 null", async () => {
    const { seen, stop } = collectDispatches();
    openDispatches.push(stop);
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(denialResponse(403, "Account level insufficient")),
      ),
    );

    await post("/api/v1/content/qa/questions", { title: "x" });

    expect(seen).toEqual([{ permission: null }]);
  });

  it("GET 的 403 不广播：通知铃铛等只读请求在加载时被拒是常态，不能弹全局弹窗", async () => {
    const { seen, stop } = collectDispatches();
    openDispatches.push(stop);
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          denialResponse(403, "Missing permission: notification.read"),
        ),
      ),
    );

    await get("/api/v1/notification/me/unread-count");

    expect(seen).toEqual([]);
  });

  it("业务型 403 与成功响应都不广播", async () => {
    const { seen, stop } = collectDispatches();
    openDispatches.push(stop);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(denialResponse(403, "不能采纳自己的回答"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 0, data: {} }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await post("/api/v1/content/qa/questions/1/accept", {});
    await post("/api/v1/content/qa/questions/1/close", {});

    expect(seen).toEqual([]);
  });
});
