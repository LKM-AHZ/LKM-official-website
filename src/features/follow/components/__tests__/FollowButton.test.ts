// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import FollowButton from "../FollowButton.vue";
import { dispatchOpenLoginModal } from "~/features/shell/common/shell-events";

const restoreFromStorage = vi.hoisted(() => vi.fn());
vi.mock("~/stores/auth", () => ({
  useAuthStore: () => ({ isLoggedIn: false, restoreFromStorage }),
}));
vi.mock("~/lib/api", () => ({ followApi: {} }));
vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }));
vi.mock("~/features/shell/common/shell-events", () => ({
  dispatchOpenLoginModal: vi.fn(),
}));

describe("FollowButton", () => {
  it("opens login when a guest clicks follow", async () => {
    const wrapper = mount(FollowButton, {
      props: { targetType: "board", targetId: "board-1" },
    });
    const button = wrapper.get("button");

    expect(button.attributes("disabled")).toBeUndefined();
    expect(restoreFromStorage).toHaveBeenCalledOnce();
    await button.trigger("click");
    expect(dispatchOpenLoginModal).toHaveBeenCalledOnce();
  });
});
