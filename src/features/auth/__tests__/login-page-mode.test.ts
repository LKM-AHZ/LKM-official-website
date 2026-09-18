// @vitest-environment happy-dom
// 验证 flow.mode 在模板中解包正确：切换分段控件后，登录/验证码表单随之切换。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import LoginPage from "../components/login/LoginPage.vue";
import * as authModule from "~/lib/api/modules/auth";
import { ok } from "~/lib/errors/result";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("LoginPage flow.mode 解包", () => {
  it("默认密码表单；点击「验证码登录」切到验证码表单", async () => {
    const w = mount(LoginPage, { props: { mode: "modal" } });
    // 默认：密码表单可见（提供包含「密码」标签的 AuthField；输入框 placeholder 含"密码"）
    const pwInput = w.find('input[autocomplete="current-password"]');
    expect(pwInput.exists()).toBe(true);

    // 切换到「验证码登录」
    const buttons = w.findAll("button");
    const codeTab = buttons.find((b) => b.text().includes("验证码登录"));
    expect(codeTab, "应存在“验证码登录”分段").toBeTruthy();
    await codeTab!.trigger("click");

    // 验证码态：出现「获取验证码」按钮，且不再渲染密码输入框
    const getBtn = w
      .findAll("button")
      .find((b) => b.text().includes("获取验证码"));
    expect(getBtn, "切换后应出现“获取验证码”按钮").toBeTruthy();
    expect(w.find('input[autocomplete="current-password"]').exists()).toBe(
      false,
    );
  });

  it("默认密码表单渲染（flow.mode 经 reactive 解包后模板 v-if 命中）", async () => {
    const w = mount(LoginPage, { props: { mode: "modal" } });
    await w.vm.$nextTick();
    expect(w.find('input[autocomplete="current-password"]').exists()).toBe(
      true,
    );
    expect(w.text()).toContain("登录");
  });

  it("密码登录成功后显示「登录成功」卡片且不自动跳转", async () => {
    vi.spyOn(authModule.authApi, "loginPassword").mockResolvedValue(
      ok({
        access_token: "a",
        refresh_token: "r",
        user_id: "00000000-0000-7000-8000-000000000001",
        account_level: "local",
      }),
    );
    vi.spyOn(authModule.authApi, "getMe").mockResolvedValue(
      ok({
        id: "00000000-0000-7000-8000-000000000001",
        username: "alma",
        account_level: "local",
      }),
    );
    const w = mount(LoginPage, { props: { mode: "modal" } });
    await w.vm.$nextTick();
    // 填入账号密码后提交（避开空值/校验差异）
    const acct = w.find('input[autocomplete="username"]');
    const pass = w.find('input[autocomplete="current-password"]');
    await acct.setValue("alma");
    await pass.setValue("123456");
    await w.find("form").trigger("submit");
    // 等 async submitPassword 完成并刷新 DOM
    await w.vm.$nextTick();
    await new Promise((r) => setTimeout(r, 20));
    // 断言成功卡渲染：标题「登录成功」+ 欢迎文案，且不再有密码输入框/分段控件（未跳转）
    expect(w.text()).toContain("登录成功");
    expect(w.text()).toContain("欢迎回来");
    expect(w.find('input[autocomplete="current-password"]').exists()).toBe(
      false,
    );
  });
});
