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
  const currentUser = computed<UserInfo | null>(() => store.user ?? null);
  const userId = computed(() => store.user?.id ?? null);

  async function logout(): Promise<void> {
    await store.logout();
  }

  // 从 localStorage 恢复主站登录态（StarHope 是独立 Vue island，需主动恢复）
  function restore(): void {
    store.restoreFromStorage();
  }

  return { isLoggedIn, currentUser, userId, logout, restore };
}
