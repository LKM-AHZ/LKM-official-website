import { afterEach, expect, it, vi } from "vitest";
import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import UserAvatarMenu from "~/features/shell/components/user/UserAvatarMenu.vue";

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

it("头像菜单链接指向实际路由，并允许导航点击冒泡", async () => {
  localStorage.setItem(
    "lkm-auth-store",
    JSON.stringify({
      isLoggedIn: true,
      user: { id: "1", username: "alma", account_level: "normal" },
    }),
  );
  const menu = mount(UserAvatarMenu, {
    props: { base: "/sub/" },
    attachTo: document.body,
    global: { plugins: [createPinia()] },
  });
  await nextTick();
  await menu.find("button").trigger("click");

  const links = menu.findAll("a");
  expect(links.map((link) => link.attributes("href"))).toEqual([
    "/sub/user/alma",
    "/sub/contribution",
    "/sub/account",
  ]);

  const navigation = vi.fn();
  document.addEventListener("click", navigation);
  await links[0]!.trigger("click");
  expect(navigation).toHaveBeenCalledOnce();
  expect(menu.findAll("a")).toHaveLength(0);

  document.removeEventListener("click", navigation);
  menu.unmount();
});
