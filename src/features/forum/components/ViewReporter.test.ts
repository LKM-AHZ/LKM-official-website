// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import ViewReporter from "./ViewReporter.vue";

const { interactionApi, authStore } = vi.hoisted(() => ({
  interactionApi: { reportView: vi.fn() },
  authStore: { isLoggedIn: true, restoreFromStorage: vi.fn() },
}));

vi.mock("~/lib/api/modules/interaction", () => ({ interactionApi }));
vi.mock("~/stores/auth", () => ({ useAuthStore: () => authStore }));

let wrapper: VueWrapper | null = null;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  authStore.isLoggedIn = true;
});

function mountReporter(): VueWrapper {
  wrapper = mount(ViewReporter, { props: { contentId: "p-1" } });
  return wrapper;
}

describe("浏览上报", () => {
  it("登录态下上报一次浏览", async () => {
    interactionApi.reportView.mockResolvedValue(
      ok({ content_id: "p-1", viewed_at: new Date().toISOString() }),
    );

    mountReporter();
    await flushPromises();

    expect(authStore.restoreFromStorage).toHaveBeenCalledOnce();
    expect(interactionApi.reportView).toHaveBeenCalledWith("p-1");
  });

  it("未登录跳过：后端该端点要求 interaction.history 权限点，发了也是 403", async () => {
    authStore.isLoggedIn = false;

    mountReporter();
    await flushPromises();

    expect(interactionApi.reportView).not.toHaveBeenCalled();
  });

  it("上报失败静默：正文已经渲染出来了，为一次记账弹错会让人莫名其妙", async () => {
    const alert = vi.fn();
    vi.stubGlobal("alert", alert);
    interactionApi.reportView.mockResolvedValue(
      err(new AppError(ErrorCode.HTTP_CLIENT_ERROR, "403", 403)),
    );

    const w = mountReporter();
    await flushPromises();

    expect(alert).not.toHaveBeenCalled();
    // 无 UI 组件：不上报也不该渲染出任何元素
    expect(w.findAll("*")).toHaveLength(0);
  });
});
