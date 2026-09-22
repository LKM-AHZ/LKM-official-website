// src/stores/adminAuth.ts
// 后台管理员登录态（Pinia，单一状态源）。
//
// 与前台 auth 不同：后台凭证在 httpOnly cookie，前端不读写 token。
// 本 store 只记录"当前后台用户信息 + 会话状态"，供 /admin 页面决定展示登录界面还是业务内容。
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  adminLogin as apiAdminLogin,
  adminLogout as apiAdminLogout,
  bootAdminSession as apiBootAdminSession,
  resetRedirectGuard,
  type AdminUser,
} from "~/lib/api/admin";

export type AdminSession = "idle" | "checking" | "authenticated" | "anonymous";

export const useAdminAuthStore = defineStore("adminAuth", () => {
  const user = ref<AdminUser | null>(null);
  const session = ref<AdminSession>("idle");
  // 由 session 派生，避免两个标志手工同步时漂移（session 是单一状态源）
  const isLoggedIn = computed(() => session.value === "authenticated");
  // 请求代数：并发/乱序响应只允许「最后一次」提交状态（例如慢 check 在 logout 之后返回）
  let requestId = 0;

  /** 进入后台前调用：校验 cookie 会话。 */
  async function check(): Promise<boolean> {
    const id = ++requestId;
    session.value = "checking";
    const u = await apiBootAdminSession();
    if (id !== requestId) return false; // 已被更新的 check/logout 取代，丢弃本次结果
    if (u) {
      user.value = u;
      session.value = "authenticated";
      return true;
    }
    user.value = null;
    session.value = "anonymous";
    return false;
  }

  /** 后台登录；成功后后端 Set-Cookie 已写入，设置登录态。 */
  async function login(username: string, password: string): Promise<void> {
    const id = ++requestId;
    const { user: u } = await apiAdminLogin(username, password);
    if (id !== requestId) return;
    // 响应包络缺 data 时 u 是 undefined：静默写进 user.value 会让 user.value.id 崩
    if (!u) throw new Error("后台登录响应缺少用户信息");
    user.value = u;
    session.value = "authenticated";
  }

  /** 后台登出：清 cookie 会话与本地姿态，重入锁复位（供页面跳转到 /admin/login）。 */
  async function logout(): Promise<void> {
    ++requestId; // 让在途的 check/login 结果作废
    await apiAdminLogout();
    user.value = null;
    session.value = "anonymous";
    resetRedirectGuard();
  }

  /** 供守卫在并发静默失败时复位（可选）。 */
  function resetGuard(): void {
    resetRedirectGuard();
  }

  return {
    user,
    session,
    isLoggedIn,
    check,
    login,
    logout,
    resetGuard,
  };
});
