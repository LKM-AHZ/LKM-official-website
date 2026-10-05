import { describe, expect, it } from "vitest";
import { getIcon } from "@iconify/vue";
import "~/vue-entry";

describe("客户端本地图标", () => {
  it("在组件挂载前提供导航、资源操作和外观设置图标", () => {
    for (const name of [
      "material-symbols:search",
      "material-symbols:grid-view",
      "material-symbols:add",
      "material-symbols:wb-sunny-outline-rounded",
      "fa6-solid:arrow-rotate-left",
    ]) {
      expect(getIcon(name)?.body, name).toBeTruthy();
    }
  });
});
