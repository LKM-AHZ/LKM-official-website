// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { err, ok } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import CreatePostDialog from "./CreatePostDialog.vue";

const { listBoards, createItem, authStore } = vi.hoisted(() => {
  const authStore = {
    isLoggedIn: false,
    restoreLogin: true,
    restoreFromStorage: vi.fn(() => {
      authStore.isLoggedIn = authStore.restoreLogin;
    }),
  };
  return { listBoards: vi.fn(), createItem: vi.fn(), authStore };
});

vi.mock("~/lib/api/modules/content", () => ({
  contentApi: { listBoards, createItem },
}));
vi.mock("~/stores/auth", () => ({
  useAuthStore: () => authStore,
}));

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
  authStore.isLoggedIn = false;
  authStore.restoreLogin = true;
});

describe("发帖弹窗", () => {
  it("预选当前板块，允许在无子板块的根板块发帖并展示后端错误", async () => {
    listBoards.mockResolvedValue(
      ok({
        items: [
          {
            id: "root-id",
            title: "平台讨论",
            parent_id: null,
            status: "active",
          },
          {
            id: "off-id",
            title: "已停用",
            parent_id: null,
            status: "inactive",
          },
        ],
      }),
    );
    createItem.mockResolvedValue(
      err(new AppError(ErrorCode.HTTP_CLIENT_ERROR, "今日发帖次数已达上限")),
    );
    const wrapper = mount(CreatePostDialog, {
      props: { boardId: "root-id" },
      global: { stubs: { Icon: true } },
    });
    await (wrapper.vm as unknown as { open(): Promise<void> }).open();
    await nextTick();

    const select = document.querySelector("select") as HTMLSelectElement;
    expect(select.value).toBe("root-id");
    expect(select.querySelectorAll("option")).toHaveLength(2);
    const title = document.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    title.value = "测试发帖";
    title.dispatchEvent(new Event("input"));
    const content = document.querySelector("textarea") as HTMLTextAreaElement;
    content.value = "**正文**";
    content.dispatchEvent(new Event("input"));
    await nextTick();

    (document.querySelector("button.btn-primary") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(createItem).toHaveBeenCalledOnce());
    expect(authStore.restoreFromStorage).toHaveBeenCalledOnce();
    expect(createItem).toHaveBeenCalledWith({
      content_type: "discussion",
      board_id: "root-id",
      title: "测试发帖",
      content: "**正文**",
      tags: [],
    });
    await vi.waitFor(() =>
      expect(document.querySelector('[role="alert"]')?.textContent).toContain(
        "今日发帖次数已达上限",
      ),
    );
    wrapper.unmount();
  });

  it("未登录时关闭发帖弹窗并打开登录弹窗", async () => {
    authStore.restoreLogin = false;
    listBoards.mockResolvedValue(
      ok({
        items: [
          { id: "root-id", title: "讨论", parent_id: null, status: "active" },
        ],
      }),
    );
    const onLogin = vi.fn();
    window.addEventListener("open-auth-modal", onLogin);
    const wrapper = mount(CreatePostDialog, {
      props: { boardId: "root-id" },
      global: { stubs: { Icon: true } },
    });
    await (wrapper.vm as unknown as { open(): Promise<void> }).open();
    await nextTick();
    const title = document.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    title.value = "标题";
    title.dispatchEvent(new Event("input"));
    const content = document.querySelector("textarea") as HTMLTextAreaElement;
    content.value = "正文";
    content.dispatchEvent(new Event("input"));
    await nextTick();

    (document.querySelector("button.btn-primary") as HTMLButtonElement).click();
    await nextTick();

    expect(onLogin).toHaveBeenCalledOnce();
    expect(document.querySelector("select")).toBeNull();
    expect(createItem).not.toHaveBeenCalled();
    wrapper.unmount();
    window.removeEventListener("open-auth-modal", onLogin);
  });
});
