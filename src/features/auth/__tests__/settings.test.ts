// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { defineComponent, h } from "vue";
import BindMethods from "../components/settings/BindMethods.vue";
import TwoFactorSetup from "../components/settings/TwoFactorSetup.vue";
import PasskeySetup from "../components/settings/PasskeySetup.vue";
import ConfirmDialog from "../components/settings/ConfirmDialog.vue";
import ProtectedRoute from "../components/settings/ProtectedRoute.vue";
import SettingsPage from "../components/settings/SettingsPage.vue";
import { authApi, type UserInfo } from "~/lib/api/modules/auth";
import { ok } from "~/lib/errors/result";
import { useAuthStore } from "~/stores/auth";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.innerHTML = "";
});

function makeUser(over: Record<string, unknown> = {}): {
  id: string;
  username: string;
  account_level: string;
  email: string | null;
  phone: string | null;
  [key: string]: unknown;
} {
  return {
    id: "00000000-0000-7000-8000-000000000001",
    username: "alma",
    account_level: "normal",
    email: null,
    phone: null,
    ...over,
  };
}

describe("BindMethods", () => {
  beforeEach(() => {
    vi.spyOn(authApi, "getSettings").mockResolvedValue(
      ok({ email: null, phone: null, github: null, has_2fa: false }) as never,
    );
  });

  it("渲染绑定的邮箱", async () => {
    vi.spyOn(authApi, "getSettings").mockResolvedValue(
      ok({
        email: "a@b.com",
        phone: null,
        github: null,
        has_2fa: false,
      }) as never,
    );
    const w = mount(BindMethods, {
      props: { user: makeUser({ email: "a@b.com" }) as never },
    });
    await flushPromises();
    expect(w.text()).toContain("a@b.com");
    expect(w.text()).toContain("已绑定");
  });

  it("未绑定时展示「绑定」按钮并可发起邮箱绑定", async () => {
    const requestSpy = vi.spyOn(authApi, "bindEmailRequest").mockResolvedValue(
      ok({
        message: "code sent",
        record_id: "00000000-0000-7000-8000-000000000001",
      }) as never,
    );
    const w = mount(BindMethods, {
      props: { user: makeUser() as never },
    });
    await flushPromises();
    expect(w.text()).toContain("绑定");
    // 邮箱行的「绑定」按钮：进入发送验证码步骤；此步不应发起网络请求
    const bindBtn = w.find('[data-testid="bind-email"]');
    expect(bindBtn.exists()).toBe(true);
    await bindBtn.trigger("click");
    await flushPromises();
    expect(w.text()).toContain("发送验证码");
    expect(w.text()).not.toContain("输入验证码");
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it("邮箱验证码阶段允许提交数字验证码并更新绑定态", async () => {
    vi.spyOn(authApi, "bindEmailRequest").mockResolvedValue(
      ok({ message: "sent", record_id: "request-1" }),
    );
    const verify = vi
      .spyOn(authApi, "bindEmailVerify")
      .mockResolvedValue(ok({ message: "bound" }));
    const wrapper = mount(BindMethods, {
      props: { user: makeUser() as never },
    });
    await flushPromises();
    await wrapper.find('[data-testid="bind-email"]').trigger("click");
    const form = wrapper.find("form");
    await form.find("input").setValue("new@example.com");
    await form.trigger("submit");
    await flushPromises();
    const codeInput = form.find("input");
    expect(codeInput.attributes("type")).toBe("text");
    await codeInput.setValue("123456");
    await form.trigger("submit");
    await flushPromises();
    expect(verify).toHaveBeenCalledWith("new@example.com", "123456");
    expect(wrapper.emitted("update")?.[0]?.[0]).toMatchObject({
      email: "new@example.com",
    });
  });
});

describe("TwoFactorSetup", () => {
  it("渲染双因素认证标题与未开启状态，可发起开启", async () => {
    vi.spyOn(authApi, "get2FAStatus").mockResolvedValue(
      ok({ enabled: false }) as never,
    );
    vi.spyOn(authApi, "start2FA").mockResolvedValue(
      ok({
        secret: "SECRET",
        qr_code_uri: "otpauth://totp/LKM:alma?secret=SECRET",
      }) as never,
    );
    const w = mount(TwoFactorSetup, {
      props: { user: makeUser() as never },
    });
    await flushPromises();
    expect(w.text()).toContain("双因素");
    expect(w.text()).toContain("未开启");
    await w.find("button").trigger("click");
    expect(w.text()).toContain("确认开启");
  });
});

describe("PasskeySetup", () => {
  it("渲染 passkey 列表", async () => {
    vi.spyOn(authApi, "listPasskeys").mockResolvedValue(
      ok([
        {
          id: "00000000-0000-7000-8000-000000000001",
          credential_id: "c",
          device_name: "我的钥匙",
          created_at: "2026-01-01",
        },
      ]) as never,
    );
    const w = mount(PasskeySetup, {
      props: { user: makeUser() as never },
    });
    await flushPromises();
    expect(w.text()).toContain("我的钥匙");
  });
});

describe("ConfirmDialog", () => {
  it("打开时确认触发 confirm 事件", async () => {
    const w = mount(ConfirmDialog, {
      props: { open: true, message: "确定删除？", confirmText: "删除" },
    });
    await flushPromises();
    const confirmBtn = document.querySelector(
      'button[data-testid="confirm"]',
    ) as HTMLButtonElement;
    expect(confirmBtn).toBeTruthy();
    confirmBtn.click();
    expect(w.emitted("confirm")).toBeTruthy();
  });
});

describe("ProtectedRoute", () => {
  it("anonymous 时提示登录", async () => {
    const s = useAuthStore();
    s.session = "anonymous";
    s.isLoggedIn = false;
    const w = mount(ProtectedRoute, { slots: { default: "<div>内容</div>" } });
    await flushPromises();
    expect(w.text()).toContain("请先登录");
    expect(w.text()).not.toContain("内容");
  });
});

describe("SettingsPage", () => {
  it("applies changed account bindings to the shared user state", async () => {
    const store = useAuthStore();
    store.session = "authenticated";
    store.user = makeUser() as UserInfo;
    const BindUpdate = defineComponent({
      props: ["user"],
      emits: ["update"],
      setup(props, { emit }) {
        return () =>
          h(
            "button",
            {
              "data-testid": "bind-update",
              onClick: () =>
                emit("update", {
                  ...props.user,
                  email: "new@example.com",
                }),
            },
            "Update binding",
          );
      },
    });
    const page = mount(SettingsPage, {
      global: {
        stubs: {
          BindMethods: BindUpdate,
          TwoFactorSetup: true,
          PasskeySetup: true,
          ConfirmDialog: true,
        },
      },
    });
    await page.find('[data-testid="bind-update"]').trigger("click");
    expect((store.user as UserInfo).email).toBe("new@example.com");
  });

  it("loads server profile values and applies saved values from the response", async () => {
    const store = useAuthStore();
    const user = makeUser();
    store.session = "authenticated";
    store.user = user as UserInfo;
    const save = vi.spyOn(authApi, "editProfile").mockResolvedValue(
      ok({
        nickname: "Server Name",
        avatar: null,
        role: "member",
        contact_links: [{ name: "Home", url: "https://example.com" }],
      }),
    );
    const page = mount(SettingsPage, {
      global: {
        stubs: {
          BindMethods: true,
          TwoFactorSetup: true,
          PasskeySetup: true,
          ConfirmDialog: true,
        },
      },
    });
    store.updateUser({
      ...user,
      nickname: "Old Name",
      contact_links: [{ name: "Old", url: "https://old.example.com" }],
    });
    await page.vm.$nextTick();
    const nickname = page.find("#settings-nickname");
    expect((nickname.element as HTMLInputElement).value).toBe("Old Name");
    await nickname.setValue("Edited Name");
    await page.find("form").trigger("submit");
    await flushPromises();
    expect(save).toHaveBeenCalledWith(user.id, {
      nickname: "Edited Name",
    });
    expect((store.user as UserInfo).nickname).toBe("Server Name");
    expect((nickname.element as HTMLInputElement).value).toBe("Server Name");
  });

  it("sends contact links and uses the persisted response", async () => {
    const store = useAuthStore();
    const user = makeUser({
      contact_links: [{ name: "Old", url: "https://old.example.com" }],
    });
    store.session = "authenticated";
    store.user = user as UserInfo;
    const persisted = [{ name: "Home", url: "https://example.com" }];
    const save = vi.spyOn(authApi, "editProfile").mockResolvedValue(
      ok({
        nickname: null,
        avatar: null,
        role: "member",
        contact_links: persisted,
      }),
    );
    const page = mount(SettingsPage, {
      global: {
        stubs: {
          BindMethods: true,
          TwoFactorSetup: true,
          PasskeySetup: true,
          ConfirmDialog: true,
        },
      },
    });
    const name = page.find('input[placeholder="名称（如 QQ / GitHub）"]');
    const url = page.find('input[placeholder="链接 / 账号（选填）"]');
    expect(name.exists()).toBe(true);
    expect(url.exists()).toBe(true);
    await name.setValue("Home");
    await url.setValue("https://example.com");
    const saveButton = page
      .findAll("button")
      .find((button) => button.text().includes("保存联系方式"));
    expect(saveButton).toBeDefined();
    await saveButton!.trigger("click");
    await flushPromises();
    expect(save).toHaveBeenCalledWith(user.id, {
      contact_links: [
        { name: "Home", icon: undefined, url: "https://example.com" },
      ],
    });
    expect((store.user as UserInfo).contact_links).toEqual(persisted);
  });
});
