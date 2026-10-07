// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import { markPermissionDeniedHandled } from "~/lib/http/permission-denied";
import PostInteractions from "./PostInteractions.vue";

// 图标组件换成只暴露 icon 名的桩：断言「已赞」看的是图标语义，
// 直接查 span 文本会把「5 个赞」和「未赞的 5」混在一起
vi.mock("@iconify/vue", () => ({
  Icon: { name: "Icon", props: ["icon"], template: '<i :data-icon="icon" />' },
}));

const { contentApi, interactionApi, authStore, dispatchOpenLoginModal } =
  vi.hoisted(() => ({
    contentApi: {
      getViewerState: vi.fn(),
      likeItem: vi.fn(),
      unlikeItem: vi.fn(),
      forwardItem: vi.fn(),
      reportItem: vi.fn(),
    },
    interactionApi: { favorite: vi.fn(), unfavorite: vi.fn() },
    authStore: { isLoggedIn: true, restoreFromStorage: vi.fn() },
    dispatchOpenLoginModal: vi.fn(),
  }));

vi.mock("~/lib/api/modules/content", () => ({ contentApi }));
vi.mock("~/lib/api/modules/interaction", () => ({ interactionApi }));
vi.mock("~/stores/auth", () => ({ useAuthStore: () => authStore }));
vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }));
vi.mock("~/features/shell/common/shell-events", () => ({
  dispatchOpenLoginModal,
}));

// 未回填的 getViewerState 会让组件停在加载态并被每个用例的 await 卡住，统一给默认值
const IDLE_VIEWER = {
  liked: false,
  favorited: false,
  like_count: 0,
  bookmark_count: 0,
};

let wrapper: VueWrapper | null = null;

// happy-dom 不保证有全局 alert，而失败反馈会调它——不桩住就是未捕获异常
beforeEach(() => {
  vi.stubGlobal("alert", vi.fn());
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  // 举报弹窗 Teleport 到 body：不清会残留到下一个用例
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  authStore.isLoggedIn = true;
});

/**
 * 点举报弹窗的第一个理由（ReportDialog 内部 Teleport 到 body，不在 wrapper 里）。
 *
 * 不查子组件 props 而点真实节点：一是断言的是「提交了什么」而不是「传了什么」，
 * 二是 `findComponent(X.vue)` 在该项目的类型下解析不出组件类型（报 DOMWrapper<Node>）。
 * 返回是否点到了——弹窗未渲染时返回 false，便于先断言「默认不弹」。
 */
function clickFirstReportReason(expectedTitleKey?: string): boolean {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return false;
  if (expectedTitleKey) {
    expect(dialog.textContent).toContain(expectedTitleKey);
  }
  (dialog.querySelectorAll("button")[0] as HTMLButtonElement).click();
  return true;
}

/** 非安全上下文下 navigator.clipboard 不存在，组件会走 alert 分支——测试里给它一个可断言的桩。 */
function stubClipboard(): ReturnType<typeof vi.fn> {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  return writeText;
}

function mountBar(props: Record<string, unknown> = {}): VueWrapper {
  wrapper = mount(PostInteractions, {
    props: {
      postId: "p-1",
      likeCount: 0,
      bookmarkCount: 0,
      forwardCount: 0,
      ...props,
    },
  });
  return wrapper;
}

/** 操作栏按模板顺序的按钮：0 赞 / 1 收藏 / 2 分享 / 3 举报。 */
type ActionIndex = 0 | 1 | 2 | 3;

function actionButton(w: VueWrapper, index: ActionIndex) {
  return w.findAll("button")[index];
}

function iconOf(w: VueWrapper, index: 0 | 1): string {
  return w.findAll("[data-icon]")[index].attributes("data-icon") ?? "";
}

describe("帖子互动栏", () => {
  it("挂载后按服务端互动态回填，而不是一直显示未赞未藏", async () => {
    contentApi.getViewerState.mockResolvedValue(
      ok({
        liked: true,
        favorited: true,
        like_count: 7,
        bookmark_count: 2,
      }),
    );

    const w = mountBar({ likeCount: 1, bookmarkCount: 1 });
    await flushPromises();

    expect(contentApi.getViewerState).toHaveBeenCalledWith("p-1");
    expect(iconOf(w, 0)).toBe("material-symbols:favorite");
    expect(iconOf(w, 1)).toBe("material-symbols:bookmark");
    // 计数一并采用服务端值：SSR 给的是公共计数，可能已过期
    expect(actionButton(w, 0).text()).toContain("7");
    expect(actionButton(w, 1).text()).toContain("2");
  });

  it("初值拉取失败时不误判成「未点赞」，保持 props 原样", async () => {
    contentApi.getViewerState.mockResolvedValue(
      err(new AppError(ErrorCode.NETWORK_ERROR, "boom")),
    );

    const w = mountBar({ likeCount: 3, bookmarkCount: 4 });
    await flushPromises();

    expect(iconOf(w, 0)).toBe("material-symbols:favorite-outline");
    expect(actionButton(w, 0).text()).toContain("3");
    expect(actionButton(w, 1).text()).toContain("4");
  });

  it("点赞成功后用服务端计数校正乐观值", async () => {
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    // 服务端计数与本地乐观 +1 不一致（同一内容此前已在别处点过赞）
    contentApi.likeItem.mockResolvedValue(ok({ like_count: 9 }));

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 0).trigger("click");
    await flushPromises();

    expect(contentApi.likeItem).toHaveBeenCalledWith("p-1");
    expect(contentApi.unlikeItem).not.toHaveBeenCalled();
    expect(iconOf(w, 0)).toBe("material-symbols:favorite");
    expect(actionButton(w, 0).text()).toContain("9");
  });

  it("点赞被拒（403）时回滚本地态——颜色不能停在错的一侧", async () => {
    // 回滚目标取服务端初值（挂载后它会覆盖 props 计数），故这里把初值设成非 0
    contentApi.getViewerState.mockResolvedValue(
      ok({ ...IDLE_VIEWER, like_count: 1 }),
    );
    contentApi.likeItem.mockResolvedValue(
      err(new AppError(ErrorCode.HTTP_CLIENT_ERROR, "403", 403)),
    );

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 0).trigger("click");
    await flushPromises();

    expect(iconOf(w, 0)).toBe("material-symbols:favorite-outline");
    expect(actionButton(w, 0).text()).toContain("1");
    // 403 由全局无权限对话框承接，这里不越权再弹一次
    expect(dispatchOpenLoginModal).not.toHaveBeenCalled();
  });

  it("收藏采用接口回带的权威态与计数，而非本地推算", async () => {
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    interactionApi.favorite.mockResolvedValue(
      ok({ content_id: "p-1", favorited: true, bookmark_count: 6 }),
    );

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 1).trigger("click");
    await flushPromises();

    expect(interactionApi.favorite).toHaveBeenCalledWith("p-1");
    expect(iconOf(w, 1)).toBe("material-symbols:bookmark");
    expect(actionButton(w, 1).text()).toContain("6");
  });

  it("未登录点击不偷改本地态，直接引导登录", async () => {
    authStore.isLoggedIn = false;
    contentApi.getViewerState.mockResolvedValue(
      ok({ ...IDLE_VIEWER, like_count: 2 }),
    );

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 0).trigger("click");
    await flushPromises();

    expect(dispatchOpenLoginModal).toHaveBeenCalledOnce();
    expect(contentApi.likeItem).not.toHaveBeenCalled();
    expect(iconOf(w, 0)).toBe("material-symbols:favorite-outline");
    expect(actionButton(w, 0).text()).toContain("2");
  });

  it("复制链接成功后上报转发，并用服务端计数校正显示", async () => {
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    contentApi.forwardItem.mockResolvedValue(ok({ forward_count: 5 }));
    const writeText = stubClipboard();

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 2).trigger("click"); // 0 赞 / 1 藏 / 2 分享 / 3 举报
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(contentApi.forwardItem).toHaveBeenCalledWith("p-1");
    expect(actionButton(w, 2).text()).toContain("5");
  });

  it("转发上报失败不改本地计数，也不打断「已复制」的提示", async () => {
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    contentApi.forwardItem.mockResolvedValue(
      err(new AppError(ErrorCode.HTTP_CLIENT_ERROR, "403", 403)),
    );
    stubClipboard();

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 2).trigger("click");
    await flushPromises();

    // 用户要的动作（复制）已成功，计数保持服务端原值 0，不本地自增
    expect(actionButton(w, 2).text()).toContain("0");
  });

  it("未登录也能复制链接，但不上报转发（复制不该要求登录）", async () => {
    authStore.isLoggedIn = false;
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    const writeText = stubClipboard();

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 2).trigger("click");
    await flushPromises();

    expect(writeText).toHaveBeenCalledOnce();
    expect(contentApi.forwardItem).not.toHaveBeenCalled();
  });

  it("已被全局对话框承接的 403 不再自己提示一次", async () => {
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    // client.ts 在广播 lkm:permission-denied 的同时会给错误打上这个标记；
    // 这里模拟同一条链路，断言「不会既弹对话框又弹 alert / 登录浮层」
    const denied = new AppError(ErrorCode.HTTP_CLIENT_ERROR, "403", 403);
    markPermissionDeniedHandled(denied);
    contentApi.likeItem.mockResolvedValue(err(denied));

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 0).trigger("click");
    await flushPromises();

    expect(alert).not.toHaveBeenCalled();
    expect(dispatchOpenLoginModal).not.toHaveBeenCalled();
  });

  it("未被承接的 403（如没带令牌）给出可见反馈，而不是静默", async () => {
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    contentApi.likeItem.mockResolvedValue(
      err(new AppError(ErrorCode.HTTP_CLIENT_ERROR, "403", 403)),
    );

    const w = mountBar();
    await flushPromises();
    await actionButton(w, 0).trigger("click");
    await flushPromises();

    expect(alert).toHaveBeenCalledOnce();
  });

  it("点举报后按帖子 id 提交，且默认不发请求", async () => {
    contentApi.getViewerState.mockResolvedValue(ok(IDLE_VIEWER));
    contentApi.reportItem.mockResolvedValue(ok({ ok: true }));

    const w = mountBar();
    await flushPromises();
    expect(clickFirstReportReason()).toBe(false); // 没点举报前弹窗不渲染

    await actionButton(w, 3).trigger("click");
    await nextTick();

    // 标题 key 区分帖子/评论两种目标
    expect(clickFirstReportReason("community.forum.reportTitle")).toBe(true);
    await flushPromises();
    expect(contentApi.reportItem).toHaveBeenCalledWith({
      target_type: "post",
      target_id: "p-1",
      reason: "community.forum.reportSpam",
    });
  });
});
