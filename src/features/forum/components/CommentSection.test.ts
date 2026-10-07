// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import CommentSection from "./CommentSection.vue";

vi.mock("@iconify/vue", () => ({
  Icon: { name: "Icon", props: ["icon"], template: '<i :data-icon="icon" />' },
}));

const { contentApi, authStore, dispatchOpenLoginModal } = vi.hoisted(() => ({
  contentApi: {
    listComments: vi.fn(),
    createComment: vi.fn(),
    likeComment: vi.fn(),
    unlikeComment: vi.fn(),
    reportItem: vi.fn(),
  },
  authStore: { isLoggedIn: true, restoreFromStorage: vi.fn() },
  dispatchOpenLoginModal: vi.fn(),
}));

vi.mock("~/lib/api/modules/content", () => ({ contentApi }));
vi.mock("~/stores/auth", () => ({ useAuthStore: () => authStore }));
// 带参的 t 把参数一并渲染出来：模板里 {count} 插值要靠它才能断言
vi.mock("~/lib/i18n", () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}|${Object.values(params).join(",")}` : key,
}));
vi.mock("~/features/shell/common/shell-events", () => ({
  dispatchOpenLoginModal,
}));

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

function makeComment(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    content_id: "p-1",
    author_id: "u-1",
    author_name: "alice",
    content: "一楼",
    floor_number: 1,
    parent_id: null,
    like_count: 0,
    liked: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function page(items: unknown[], total = items.length) {
  return ok({ items, total, page: 1, pages: 1 });
}

function mountSection(): VueWrapper {
  wrapper = mount(CommentSection, { props: { postId: "p-1" } });
  return wrapper;
}

/** 评论列表中第 index 条的两个按钮：0 = 点赞，1 = 回复。 */
function commentButtons(w: VueWrapper, index: number) {
  const row = w.findAll(".space-y-3 > div")[index];
  return row.findAll("button");
}

describe("评论区", () => {
  it("挂载时按 postId 拉取评论，并显示总数而非已加载条数", async () => {
    contentApi.listComments.mockResolvedValue(
      page([makeComment()], 37), // 总数远大于本页条数
    );

    const w = mountSection();
    await flushPromises();

    expect(contentApi.listComments).toHaveBeenCalledWith("p-1", 1, 20);
    expect(w.text()).toContain("一楼");
    expect(w.text()).toContain("community.forum.comments|37");
    // 还有未加载的评论 → 必须给出「加载更多」，否则等于静默少显示
    expect(w.text()).toContain("community.forum.loadMoreComments");
  });

  it("加载失败给出重试入口，而不是留白", async () => {
    contentApi.listComments.mockResolvedValue(
      err(new AppError(ErrorCode.NETWORK_ERROR, "boom")),
    );

    const w = mountSection();
    await flushPromises();

    expect(w.text()).toContain("community.forum.loadCommentsFailed");
    expect(w.text()).toContain("common.retry");
  });

  it("发表评论后插入接口返回的权威行（真实楼层号），不本地推楼层", async () => {
    contentApi.listComments.mockResolvedValue(page([]));
    // 后端返回 floor 5：本地按列表长度推算会得到 1，重号
    contentApi.createComment.mockResolvedValue(
      ok(makeComment({ id: "c-9", floor_number: 5, content: "新评论" })),
    );

    const w = mountSection();
    await flushPromises();
    await w.get("textarea").setValue("新评论");
    await w.get("button.btn-primary").trigger("click");
    await flushPromises();

    expect(contentApi.createComment).toHaveBeenCalledWith("p-1", {
      content: "新评论",
      parent_id: null,
    });
    expect(w.text()).toContain("新评论");
    expect(w.text()).toContain("#5");
    expect((w.get("textarea").element as HTMLTextAreaElement).value).toBe("");
  });

  it("回复时把 parent_id 一起提交", async () => {
    contentApi.listComments.mockResolvedValue(page([makeComment()]));
    contentApi.createComment.mockResolvedValue(
      ok(makeComment({ id: "c-2", floor_number: 2, content: "回复内容" })),
    );

    const w = mountSection();
    await flushPromises();
    // 点第一条评论的「回复」按钮，进入回复态
    await commentButtons(w, 0)[1].trigger("click");
    await w.get("textarea").setValue("回复内容");
    await w.get("button.btn-primary").trigger("click");
    await flushPromises();

    expect(contentApi.createComment).toHaveBeenCalledWith("p-1", {
      content: "回复内容",
      parent_id: "c-1",
    });
  });

  it("评论点赞乐观更新，失败时回滚", async () => {
    contentApi.listComments.mockResolvedValue(
      page([makeComment({ like_count: 4 })]),
    );
    contentApi.likeComment.mockResolvedValue(
      err(new AppError(ErrorCode.HTTP_CLIENT_ERROR, "403", 403)),
    );

    const w = mountSection();
    await flushPromises();
    await commentButtons(w, 0)[0].trigger("click");
    await flushPromises();

    expect(contentApi.likeComment).toHaveBeenCalledWith("p-1", "c-1");
    const likeButton = commentButtons(w, 0)[0];
    expect(likeButton.find("[data-icon]").attributes("data-icon")).toBe(
      "material-symbols:favorite-outline",
    );
    expect(likeButton.text()).toContain("4");
  });

  it("评论点赞成功后采用服务端计数", async () => {
    contentApi.listComments.mockResolvedValue(
      page([makeComment({ like_count: 4 })]),
    );
    contentApi.likeComment.mockResolvedValue(ok({ like_count: 11 }));

    const w = mountSection();
    await flushPromises();
    await commentButtons(w, 0)[0].trigger("click");
    await flushPromises();

    const likeButton = commentButtons(w, 0)[0];
    expect(likeButton.find("[data-icon]").attributes("data-icon")).toBe(
      "material-symbols:favorite",
    );
    expect(likeButton.text()).toContain("11");
  });

  it("未登录发表评论走登录浮层，不发请求", async () => {
    authStore.isLoggedIn = false;
    contentApi.listComments.mockResolvedValue(page([]));

    const w = mountSection();
    await flushPromises();
    await w.get("textarea").setValue("试试");
    await w.get("button.btn-primary").trigger("click");
    await flushPromises();

    expect(dispatchOpenLoginModal).toHaveBeenCalledOnce();
    expect(contentApi.createComment).not.toHaveBeenCalled();
  });

  it("举报按被点的那条评论的 id 提交，不是列表第一条", async () => {
    contentApi.listComments.mockResolvedValue(
      page([makeComment(), makeComment({ id: "c-2", floor_number: 2 })]),
    );
    contentApi.reportItem.mockResolvedValue(ok({ ok: true }));

    const w = mountSection();
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    // 每行三个按钮：0 赞 / 1 回复 / 2 举报
    await commentButtons(w, 1)[2].trigger("click");
    await nextTick();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    // 弹窗标题区分帖子/评论两种目标
    expect(dialog!.textContent).toContain("community.forum.reportCommentTitle");
    (dialog!.querySelectorAll("button")[0] as HTMLButtonElement).click();
    await flushPromises();

    expect(contentApi.reportItem).toHaveBeenCalledWith({
      target_type: "comment",
      target_id: "c-2",
      reason: "community.forum.reportSpam",
    });
  });
});
