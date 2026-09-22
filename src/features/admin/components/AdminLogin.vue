<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { NForm, NFormItem, NInput, NButton, NAlert } from "naive-ui";
import { useAdminAuthStore } from "~/stores/adminAuth";
import { t } from "~/lib/i18n";

const auth = useAdminAuthStore();

const username = ref("");
const password = ref("");
const submitting = ref(false);
const error = ref("");
const success = ref(false);
// 成功后跳后台首页的定时器句柄：组件在 600ms 内卸载（swup 换页 / 用户手动离开）时要清掉，
// 否则定时器会在已卸载的组件上执行跳转
let redirectTimer: number | null = null;

onBeforeUnmount(() => {
  if (redirectTimer !== null) window.clearTimeout(redirectTimer);
});

async function handleSubmit() {
  // 防重入：按钮的 :disabled 要等一次渲染才生效，表单回车提交更是绕过按钮，
  // 快速双击/连按回车会发出第二个登录请求。
  if (submitting.value) return;
  error.value = "";
  if (!username.value.trim() || !password.value) {
    error.value = t("admin.login.required");
    return;
  }
  submitting.value = true;
  try {
    await auth.login(username.value.trim(), password.value);
    success.value = true;
    // 成功提示由下方 NAlert 呈现（不再用 useMessage，避免无 provider）
    // 稍作停留展示成功态后跳回后台首页
    redirectTimer = window.setTimeout(() => {
      redirectTimer = null;
      window.location.href = "/admin";
    }, 600);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("admin.login.failed");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-page-bg flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="bg-card-bg border border-surface-3 rounded-xl p-8 shadow-sm">
        <h1 class="text-xl font-bold text-deep-text text-center mb-1">
          {{ t("admin.title") }}
        </h1>
        <p class="text-sm text-text-muted text-center mb-6">
          {{ t("admin.login.subtitle") }}
        </p>

        <NAlert v-if="error" type="error" :show-icon="false" class="mb-4">
          {{ error }}
        </NAlert>
        <NAlert
          v-else-if="success"
          type="success"
          :show-icon="false"
          class="mb-4"
        >
          {{ t("admin.login.success") }}
        </NAlert>

        <NForm @submit.prevent="handleSubmit">
          <NFormItem :label="t('admin.login.username')" class="mb-3">
            <NInput
              v-model:value="username"
              :placeholder="t('admin.login.usernamePlaceholder')"
              size="large"
              :disabled="submitting"
              autocomplete="username"
            />
          </NFormItem>
          <NFormItem :label="t('admin.login.password')" class="mb-4">
            <NInput
              v-model:value="password"
              type="password"
              :placeholder="t('admin.login.passwordPlaceholder')"
              size="large"
              :disabled="submitting"
              autocomplete="current-password"
              show-password-on="click"
            />
          </NFormItem>
          <NButton
            type="primary"
            attr-type="submit"
            block
            size="large"
            :loading="submitting"
          >
            {{ t("admin.login.submit") }}
          </NButton>
        </NForm>

        <div class="mt-6 text-center">
          <a
            href="/"
            class="text-xs text-text-muted hover:text-primary transition-colors"
            >← {{ t("admin.backToSite") }}</a
          >
        </div>
      </div>
    </div>
  </div>
</template>
