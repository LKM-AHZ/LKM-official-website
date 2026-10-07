// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import ReportDialog from "./ReportDialog.vue";

const { contentApi, authStore, dispatchOpenLoginModal } = vi.hoisted(() => ({
  contentApi: { reportItem: vi.fn() },
  authStore: { isLoggedIn: true },
  dispatchOpenLoginModal: vi.fn(),
}));

vi.mock("~/lib/api/modules/content", () => ({ contentApi }));
vi.mock("~/stores/auth", () => ({ useAuthStore: () => authStore }));
vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }));
vi.mock("~/features/shell/common/shell-events", () => ({
  dispatchOpenLoginModal,
}));

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  vi.stubGlobal("alert", vi.fn());
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  authStore.isLoggedIn = true;
});

/**
 * Teleport 打桩成就地渲染：真实 Teleport 会把内容挂到 document.body，得跨组件边界
 * 去 query，节点残留还会污染后续用例（同 auth 的 permission-denied-dialog 教训）。
 */
function mountDialog(props: Record<string, unknown> = {}): VueWrapper {
  wrapper = mount(ReportDialog, {
    props: { open: true, targetType: "post", targetId: "p-1", ...props },
    global: { stubs: { teleport: true } },
  });
  return wrapper;
}

/** 弹窗里第一个举报理由按钮（理由列表在取消按钮之前）。 */
function firstReason(w: VueWrapper) {
  return w.findAll("button")[0];
}

describe("举报弹窗", () => {
  it("未登录点理由：关弹窗 + 引导登录，不发请求", async () => {
    authStore.isLoggedIn = false;
    const w = mountDialog();

    await firstReason(w).trigger("click");
    await flushPromises();

    expect(dispatchOpenLoginModal).toHaveBeenCalledOnce();
    expect(contentApi.reportItem).not.toHaveBeenCalled();
    expect(w.emitted("submitted")).toBeUndefined();
    expect(w.emitted("close")).toHaveLength(1);
  });

  it("已登录提交：带上目标类型与 id，成功后关弹窗并回传理由", async () => {
    contentApi.reportItem.mockResolvedValue(ok({ ok: true }));
    const w = mountDialog({ targetType: "comment", targetId: "c-9" });

    await firstReason(w).trigger("click");
    await flushPromises();

    expect(contentApi.reportItem).toHaveBeenCalledWith({
      target_type: "comment",
      target_id: "c-9",
      // t 被 mock 成返回 key，故这里断言的是「第一个理由」而非中文字面量
      reason: "community.forum.reportSpam",
    });
    expect(w.emitted("close")).toHaveLength(1);
    expect(w.emitted("submitted")).toHaveLength(1);
  });

  it("提交失败：保持弹窗打开、不谎报成功", async () => {
    contentApi.reportItem.mockResolvedValue(
      err(new AppError(ErrorCode.NETWORK_ERROR, "boom")),
    );
    const w = mountDialog();

    await firstReason(w).trigger("click");
    await flushPromises();

    expect(w.emitted("submitted")).toBeUndefined();
    expect(w.emitted("close")).toBeUndefined();
  });

  it("未打开时不渲染任何内容", () => {
    const w = mountDialog({ open: false });
    expect(w.findAll("button")).toHaveLength(0);
  });
});
