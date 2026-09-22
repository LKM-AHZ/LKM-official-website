<template>
  <div class="space-y-4 text-center">
    <AuthStatus v-if="error" type="error" :message="error" class="mb-4" />
    <div v-else class="flex flex-col items-center gap-3 py-6">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-sm text-text-muted">{{ t("auth.oauth.completing") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { t } from "~/lib/i18n";
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import AuthStatus from "../shared/AuthStatus.vue";

/**
 * OAuth 回调处理页。
 *
 * 后端在 GitHub OAuth 成功后重定向到 `settings.frontend_callback`（如 /login/success），
 * 令牌放在 URL fragment（`#access_token=...`）中回传，避免进入 query/浏览器历史：
 *   - access_token / refresh_token：会话令牌
 *   - temp_token：若需 2FA 或首次设置
 *   - requires_2fa / setup_required：布尔标记
 *
 * 读取 fragment 后写入 auth store；若需 2FA 则持久化 temp_token 供后续验证。
 * 解析完随即清理 URL（含 hash），避免令牌留在地址栏/历史记录。
 */
const store = useAuthStore();
const error = ref<string | null>(null);

onMounted(() => {
  // 令牌在 #fragment 中。去除开头的 # 后按 query 语法解析。
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(raw);
  const token = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const tempToken = params.get("temp_token");
  const requires2FA =
    params.get("requires_2fa") === "1" || params.get("requires_2fa") === "true";
  const setupRequired =
    params.get("setup_required") === "1" ||
    params.get("setup_required") === "true";

  // 2FA / 首次设置优先：即使 fragment 里同时带了 access_token 也不能建立会话，
  // 否则下面的 token 分支会直接 fetchMe 并跳首页，二次验证被静默跳过
  const needsSecondFactor = requires2FA || setupRequired;
  // flag 在、temp_token 缺失（fragment 被截断或被中间层改写）时既不能建立会话，
  // 也不能带着空 token 进 2FA：下游 useLoginFlow 取的是 getPending2FA() ?? ""，
  // verify2FA("") 只能报出与真实原因无关的模糊错误
  const secondFactorUnusable = needsSecondFactor && !tempToken;
  if (needsSecondFactor && tempToken) {
    store.holdPending2FA(tempToken);
  } else if (!needsSecondFactor && token) {
    store.setTokens(token, refreshToken ?? "");
  }

  // 清理 URL 中的敏感参数，避免 token 留在地址栏/历史记录。
  // 条件要覆盖 refresh_token / 2FA 标记（只有它们时同样敏感）；保留 search：
  // query 里可能有后端或代理附加的 redirect/state，直接丢掉会造成坏跳转
  if (token || refreshToken || tempToken || requires2FA || setupRequired) {
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }

  const finish = () => {
    window.dispatchEvent(new CustomEvent("close-auth-modal"));
  };

  // setTokens 已把凭证写进 store，但服务器不接受这个会话（或请求直接失败）时必须清掉，
  // 否则 store 里留着一个被拒绝的登录态，且失败原因被完全吞掉
  const failedToSync = (e: unknown): void => {
    store.clearTokens();
    store.clearPending2FA();
    console.error("[oauth] fetchMe 失败:", e);
    finish();
    window.location.replace(getAuthPath("login"));
  };

  if (secondFactorUnusable) {
    error.value = t("auth.oauth.failed");
    return;
  }

  // 需 2FA：跳转登录页进入 2FA 验证（必须先于 token 分支判断）
  if (needsSecondFactor) {
    finish();
    window.location.replace(getAuthPath("login?2fa=1"));
    return;
  }

  // 有 token：立即同步用户并视为已登录（登录态持久化，刷新页面保持）
  if (token) {
    store
      .fetchMe()
      .then((me) => {
        if (me.isErr()) {
          failedToSync(me.error);
          return;
        }
        store.persistToStorage();
        finish();
        window.location.replace(getAuthPath(""));
      })
      .catch(failedToSync);
    return;
  }

  error.value = t("auth.oauth.failed");
});
</script>
