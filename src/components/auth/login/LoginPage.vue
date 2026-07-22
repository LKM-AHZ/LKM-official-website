<template>
  <div class="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>

    <!-- 2FA flow -->
    <div v-if="state.flow === '2fa_required' || state.flow === '2fa_setup_required'" class="relative w-full max-w-md">
      <TwoFactorVerify :onSuccess="handle2FASuccess" :onError="handle2FAError" />
    </div>

    <!-- Logged in -->
    <div v-else-if="state.flow === 'logged_in' && state.user" class="relative w-full max-w-md">
      <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8 text-center">
        <div class="mb-4 flex justify-center">
          <svg
            class="w-14 h-14 text-success"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 class="text-2xl font-semibold mb-2">登录成功</h2>
        <p class="text-neutral mb-1">
          欢迎回来，<span class="font-semibold text-base-content">{{ state.user.username }}</span>
        </p>
        <p class="text-xs text-neutral mb-4">
          账户等级：
          <span class="badge badge-sm ml-1" :class="levelBadgeClass">{{ levelLabel }}</span>
        </p>
        <div v-if="state.user.level === 'local'" class="alert alert-info mb-4 text-left text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            绑定邮箱或手机号即可解锁全部功能，
            <a :href="getAuthPath('account')" class="font-semibold underline">前往设置 →</a>
          </span>
        </div>
        <div class="flex gap-3 justify-center">
          <a :href="getAuthPath('account')" class="btn btn-ghost btn-sm">账户设置</a>
          <a :href="getAuthPath('')" class="btn btn-primary btn-sm">返回首页</a>
        </div>
      </div>
    </div>

    <!-- Login form -->
    <div v-else class="relative w-full max-w-md">
      <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl md:text-4xl font-semibold leading-tight mb-2 text-base-content">登录</h1>
          <p class="text-sm text-neutral">登录理科迷账号，访问社区资源与文档</p>
        </div>

        <div v-if="error" class="alert alert-error mb-4 text-sm">{{ error }}</div>
        <div v-if="success" class="alert alert-success mb-4 text-sm">{{ success }}</div>
        <div v-if="state.lockedUntil && Date.now() < state.lockedUntil" class="alert alert-error mb-4 text-sm">
          账号已锁定 {{ Math.ceil((state.lockedUntil - Date.now()) / 60000) }} 分钟，请稍后再试
        </div>

        <!-- Step 1: identifier -->
        <form v-if="!identifiedAccount" @submit.prevent="handleIdentify" class="space-y-4">
          <div>
            <label class="label pb-1" for="identify-input">
              <span class="label-text font-medium">用户名 / 邮箱 / 手机号</span>
            </label>
            <input
              id="identify-input"
              type="text"
              class="input input-bordered w-full"
              :class="{ 'input-error': identifierError }"
              v-model="identifier"
              placeholder="请先输入您的账号标识"
              autocomplete="username"
              @input="identifierError = ''"
            />
            <span v-if="identifierError" class="label-text-alt text-error">{{ identifierError }}</span>
          </div>
          <button type="submit" class="btn btn-primary w-full">继续</button>
          <p class="text-center text-[13px] text-neutral">
            没有账号？
            <a :href="getAuthPath('register')" class="text-primary font-semibold hover:underline">立即注册</a>
          </p>
        </form>

        <!-- Step 2: login methods -->
        <template v-if="identifiedAccount">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm">
              <span class="text-neutral">登录为 </span>
              <span class="font-semibold">{{ identifiedAccount.username }}</span>
              <span class="badge badge-xs ml-1.5" :class="identifiedBadgeClass">{{ identifiedLevelLabel }}</span>
            </div>
            <button type="button" class="btn btn-ghost btn-xs" @click="handleBack">切换账号</button>
          </div>

          <div class="tabs tabs-bordered mb-6">
            <a
              v-for="tab in availableTabs"
              :key="tab.key"
              class="tab tab-bordered"
              :class="{ 'tab-active': activeTab === tab.key }"
              @click.prevent="activeTab = tab.key"
              >{{ tab.label }}</a
            >
          </div>

          <PasswordLogin
            v-if="activeTab === 'password'"
            :onLogin="handleLogin"
            :identifiedAccount="identifiedAccount"
          />
          <SmsLogin v-if="activeTab === 'sms'" :onLogin="handleLogin" :identifiedAccount="identifiedAccount" />
          <GithubLogin v-if="activeTab === 'github'" :onLogin="handleLogin" />
          <MagicLinkLogin
            v-if="activeTab === 'magic-link'"
            :onLogin="handleLogin"
            :identifiedAccount="identifiedAccount"
          />
          <PasskeyLogin v-if="activeTab === 'passkey'" :onLogin="handleLogin" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthProvider } from '~/composables/useAuth';
import { getAuthPath } from '../auth-paths';
import { findAccount } from '~/data/demo-accounts';
import PasswordLogin from './PasswordLogin.vue';
import SmsLogin from './SmsLogin.vue';
import GithubLogin from './GithubLogin.vue';
import MagicLinkLogin from './MagicLinkLogin.vue';
import PasskeyLogin from './PasskeyLogin.vue';
import TwoFactorVerify from './TwoFactorVerify.vue';
import type { LoginMethod, DemoUser } from '~/types/auth';

// Self-contained provider
const { state, login } = useAuthProvider();

interface Tab {
  key: LoginMethod;
  label: string;
}

const ALL_TABS: Tab[] = [
  { key: 'password', label: '密码登录' },
  { key: 'sms', label: '验证码登录' },
  { key: 'github', label: 'Github 登录' },
  { key: 'magic-link', label: 'Magic Link' },
  { key: 'passkey', label: '通行密钥' },
];

const error = ref<string | null>(null);
const success = ref<string | null>(null);
const identifier = ref('');
const identifiedAccount = ref<DemoUser | null>(null);
const identifierError = ref('');
const activeTab = ref<LoginMethod>('password');
const availableTabs = ref<Tab[]>(ALL_TABS);

const levelBadgeClass = computed(() => {
  const level = state.user?.level;
  return level === 'admin' ? 'badge-error' : level === 'normal' ? 'badge-primary' : 'badge-ghost';
});
const levelLabel = computed(() => {
  const level = state.user?.level;
  return level === 'admin' ? '管理员' : level === 'normal' ? '普通账户' : '本地账户';
});
const identifiedBadgeClass = computed(() => {
  const level = identifiedAccount.value?.level;
  return level === 'admin' ? 'badge-error' : level === 'normal' ? 'badge-primary' : 'badge-ghost';
});
const identifiedLevelLabel = computed(() => {
  const level = identifiedAccount.value?.level;
  return level === 'admin' ? '管理员' : level === 'normal' ? '普通' : '本地';
});

function getAvailableTabs(account: DemoUser): Tab[] {
  const tabs: Tab[] = [...ALL_TABS];
  if (account.level === 'local') {
    return tabs.filter((t) => t.key === 'password');
  }
  return tabs.filter((t) => {
    switch (t.key) {
      case 'password':
        return true;
      case 'sms':
        return account.bindings.includes('email') || account.bindings.includes('phone');
      case 'github':
        return account.hasGithub;
      case 'magic-link':
        return account.level === 'normal' && account.bindings.includes('email');
      case 'passkey':
        return account.hasPasskey;
      default:
        return false;
    }
  });
}

function handleBack() {
  identifiedAccount.value = null;
  identifier.value = '';
  activeTab.value = 'password';
  availableTabs.value = ALL_TABS;
  error.value = null;
}

function handleIdentify() {
  identifierError.value = '';
  error.value = null;
  if (!identifier.value.trim()) {
    identifierError.value = '请输入用户名、邮箱或手机号';
    return;
  }
  const acc = findAccount(identifier.value);
  if (!acc) {
    identifierError.value = '未找到关联账号，请检查输入';
    return;
  }
  identifiedAccount.value = acc;
  const tabs = getAvailableTabs(acc);
  availableTabs.value = tabs;
  activeTab.value = tabs[0].key;
}

watch(activeTab, () => {
  error.value = null;
});

async function handleLogin(method: LoginMethod, credentials: Record<string, string>): Promise<void> {
  error.value = null;
  success.value = null;
  const result = login(method, credentials, identifiedAccount.value ?? undefined);
  if (!result.success) {
    error.value = result.error || '登录失败';
  }
}

function handle2FASuccess(msg: string) {
  success.value = msg;
}
function handle2FAError(msg: string) {
  error.value = msg;
}
</script>
