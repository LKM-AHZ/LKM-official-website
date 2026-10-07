// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import MyInteractionsPage from "./MyInteractionsPage.vue";

const { interactionApi, authStore } = vi.hoisted(() => ({
  interactionApi: { myFavorites: vi.fn(), myHistory: vi.fn() },
  authStore: { isLoggedIn: true, restoreFromStorage: vi.fn() },
}));

vi.mock("~/lib/api/modules/interaction", () => ({ interactionApi }));
vi.mock("~/stores/auth", () => ({ useAuthStore: () => authStore }));
vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }));
// getPermalink 依赖 import.meta.env.BASE_URL，与本用例的断言无关，直接恒等替掉
vi.mock("~/lib/utils/permalinks", () => ({ getPermalink: (p: string) => p }));

let wrapper: VueWrapper | null = null;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.clearAllMocks();
  authStore.isLoggedIn = true;
});

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    content_id: "p-1",
    content_type: "discussion",
    title: "黎曼猜想",
    slug: null,
    board_id: "b-1",
    created_at: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

function mountPage(kind: "favorites" | "history"): VueWrapper {
  wrapper = mount(MyInteractionsPage, { props: { kind } });
  return wrapper;
}

describe("我的收藏 / 浏览历史", () => {
  it("收藏页取收藏列表并渲染条目与类型标签", async () => {
    interactionApi.myFavorites.mockResolvedValue(
      ok({ items: [makeItem()], total: 1, page: 1, pages: 1 }),
    );

    const w = mountPage("favorites");
    await flushPromises();

    expect(interactionApi.myFavorites).toHaveBeenCalledOnce();
    expect(interactionApi.myHistory).not.toHaveBeenCalled();
    expect(w.text()).toContain("黎曼猜想");
    expect(w.text()).toContain("community.forum.typeDiscussion");
    expect(w.find("a[href='/forum/post/p-1']").exists()).toBe(true);
  });

  it("历史页取历史列表，时间取 viewed_at 而非 created_at", async () => {
    interactionApi.myHistory.mockResolvedValue(
      ok({
        items: [makeItem({ viewed_at: "2026-09-09T00:00:00Z" })],
        total: 1,
        page: 1,
        pages: 1,
      }),
    );

    const w = mountPage("history");
    await flushPromises();

    expect(interactionApi.myHistory).toHaveBeenCalledOnce();
    expect(interactionApi.myFavorites).not.toHaveBeenCalled();
    // 展示的是 viewed_at（9 月）而非 created_at（10 月）
    const viewedAt = new Date("2026-09-09T00:00:00Z").toLocaleDateString(
      "zh-CN",
      { year: "numeric", month: "long", day: "numeric" },
    );
    expect(w.text()).toContain(viewedAt);
  });

  it("未登录不取数，给出登录提示", async () => {
    authStore.isLoggedIn = false;

    const w = mountPage("favorites");
    await flushPromises();

    expect(interactionApi.myFavorites).not.toHaveBeenCalled();
    expect(w.text()).toContain("myContent.loginRequired");
  });

  it("取数失败给出错误态，而不是伪装成「还没有收藏」", async () => {
    interactionApi.myFavorites.mockResolvedValue(
      err(new AppError(ErrorCode.NETWORK_ERROR, "boom")),
    );

    const w = mountPage("favorites");
    await flushPromises();

    expect(w.text()).toContain("common.loadError");
    expect(w.text()).not.toContain("myContent.noFavorites");
  });

  it("空列表给出空态文案", async () => {
    interactionApi.myHistory.mockResolvedValue(
      ok({ items: [], total: 0, page: 1, pages: 1 }),
    );

    const w = mountPage("history");
    await flushPromises();

    expect(w.text()).toContain("myContent.noHistory");
  });
});
