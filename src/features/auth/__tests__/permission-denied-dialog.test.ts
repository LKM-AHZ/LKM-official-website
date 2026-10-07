import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { dispatchPermissionDenied } from "~/lib/http/permission-denied";
import PermissionDeniedDialog from "../components/PermissionDeniedDialog.vue";

const { authStore } = vi.hoisted(() => ({
  authStore: { user: null as { account_level?: string } | null },
}));

vi.mock("~/stores/auth", () => ({
  useAuthStore: () => authStore,
}));

// 必须逐个 unmount：对话框 Teleport 到 body，留下的实例会在下一个用例清空 body 后
// 继续 patch，撞上已被摘掉的父节点（insertBefore of null），把无关用例带红
let mounted: VueWrapper | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  document.body.innerHTML = "";
  authStore.user = null;
});

function dialogText(): string {
  return document.querySelector('[role="dialog"]')?.textContent ?? "";
}

/** ConfirmDialog 里取消在前、确认（data-testid="confirm"）在后。 */
function clickCancel(): void {
  (
    document.querySelector('[role="dialog"] button') as HTMLButtonElement
  ).click();
}

/** 打开对话框（先挂载再广播，模拟 HTTP 层在动作被拒时派发）。 */
async function openDialog(level: string | null): Promise<void> {
  authStore.user = level ? { account_level: level } : null;
  mounted = mount(PermissionDeniedDialog);
  await nextTick();
  dispatchPermissionDenied({ permission: "content.create" });
  await nextTick();
}

describe("越权引导对话框", () => {
  it("默认不渲染：它挂在全站每一页上，不能占位成常驻浮层", () => {
    mounted = mount(PermissionDeniedDialog);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("收到越权广播后，本地账户被引导去完成注册", async () => {
    await openDialog("local");

    // 文案要点明「绑定邮箱/手机号就能解锁」，而不是只丢一句「无权限」
    expect(dialogText()).toContain("绑定邮箱或手机号");
    expect(dialogText()).toContain("去完成注册");
  });

  it("非本地账户不引导注册 —— 他们是缺角色权限，注册解决不了", async () => {
    await openDialog("normal");

    expect(dialogText()).toContain("当前账号暂无执行该操作的权限");
    expect(dialogText()).not.toContain("绑定邮箱或手机号");
  });

  it("会话未水合（拿不到 account_level）时不误判成本地账户", async () => {
    // store 的 accountLevel getter 在无 user 时兜底成 "local"：
    // 直接用它会把「还不知道是谁」说成「你是本地账户」
    await openDialog(null);

    expect(dialogText()).toContain("当前账号暂无执行该操作的权限");
  });

  it("取消后关闭，不再遮挡页面", async () => {
    await openDialog("local");
    expect(dialogText()).not.toBe("");

    clickCancel();
    await nextTick();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  // 确认按钮的落点（本地账户 → /account?section=security）没有单测：happy-dom 下
  // 点它会真的导航并把文档拆掉，spy location.href 的 setter / location.assign 都拦不住
  //（window.location 是代理，拿到的是新对象）。分支本身由上面两条「文案 + 按钮名」用例锁住，
  // 跳转目标在真机验收时核对。
});
