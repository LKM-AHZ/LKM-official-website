import { computed, type ComputedRef } from "vue";
import { useAuthStore as usePiniaAuth } from "~/stores/auth";
import type { UserInfo } from "~/lib/api/modules/auth";

export function useAuthStore(): {
  isLoggedIn: ComputedRef<boolean>;
  currentUser: ComputedRef<UserInfo | null>;
  userId: ComputedRef<string | null>;
  logout: () => Promise<void>;
  restore: () => void;
} {
  const store = usePiniaAuth();

  const isLoggedIn = computed(() => store.isLoggedIn);
  // store.user 声明就是 UserInfo | null，再 `?? null` 是永不生效的兜底；
  // userId 补显式类型，避免推断退化成宽泛类型
  const currentUser = computed<UserInfo | null>(() => store.user);
  const userId = computed<string | null>(() => store.user?.id ?? null);

  async function logout(): Promise<void> {
    try {
      await store.logout();
    } catch (e) {
      // store.logout 已清掉内存态，只剩 localStorage.removeItem 可能抛（隐私模式/沙箱）：
      // 这里兜住，避免点击退出时冒出一个未捕获的 rejection
      console.error("[starhope] 退出登录清理失败", e);
    }
  }

  // 从 localStorage 恢复主站登录态（StarHope 是独立 Vue island，需主动恢复）
  function restore(): void {
    // client:load 组件在 SSR 也会执行 setup，Node 端没有 localStorage，不加守卫会抛
    if (typeof window === "undefined") return;
    store.restoreFromStorage();
  }

  return { isLoggedIn, currentUser, userId, logout, restore };
}
