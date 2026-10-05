import { afterEach, expect, it, vi } from "vitest";
import { createPinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import ProtectedRoute from "../components/settings/ProtectedRoute.vue";
import { useAuthStore } from "~/stores/auth";
import { authApi } from "~/lib/api/modules/auth";
import { ok } from "~/lib/errors/result";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("顶栏已恢复登录快照时，仍校验会话并显示受保护内容", async () => {
  const pinia = createPinia();
  const store = useAuthStore(pinia);
  const user = {
    id: "00000000-0000-7000-8000-000000000001",
    username: "ui-review",
    account_level: "local" as const,
  };
  localStorage.setItem(
    "lkm-auth-store",
    JSON.stringify({ user, isLoggedIn: true, _token: "token" }),
  );
  store.restoreFromStorage();
  const getMe = vi.spyOn(authApi, "getMe").mockResolvedValue(ok(user));
  const wrapper = mount(ProtectedRoute, {
    global: { plugins: [pinia] },
    slots: { default: '<div data-testid="settings">账户设置内容</div>' },
  });

  await flushPromises();

  expect(getMe).toHaveBeenCalledOnce();
  expect(store.session).toBe("authenticated");
  expect(wrapper.find('[data-testid="settings"]').exists()).toBe(true);
  wrapper.unmount();
});
