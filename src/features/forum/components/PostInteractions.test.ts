// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
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

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.clearAllMocks();
  authStore.isLoggedIn = true;
});

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

/** 第 n 个操作按钮（点赞 / 收藏），按模板顺序取。 */
function actionButton(w: VueWrapper, index: 0 | 1) {
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
});
