<template>
  <div class="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>

    <!-- Logged in / success -->
    <div v-if="state.flow === 'logged_in'" class="relative w-full max-w-md text-center">
      <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <div class="text-5xl mb-4">🎉</div>
        <h2 class="text-2xl font-semibold">注册成功，已自动登录</h2>
        <p class="text-neutral text-sm">
          欢迎加入理科迷，<span class="font-semibold">{{ state.user?.username }}</span>
        </p>
        <div class="flex gap-3 justify-center mt-6">
          <a :href="getAuthPath('account')" class="btn btn-ghost btn-sm">账户设置</a>
          <a :href="getAuthPath('')" class="btn btn-primary btn-sm">返回首页</a>
        </div>
      </div>
    </div>

    <!-- Guide step -->
    <div v-else-if="showGuide" class="relative w-full max-w-md">
      <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <RegisterGuide :onComplete="() => (showGuide = false)" :onSkip="() => (showGuide = false)" />
      </div>
    </div>

    <!-- Register form -->
    <div v-else class="relative w-full max-w-md">
      <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl md:text-4xl font-semibold leading-tight mb-2 text-base-content">注册</h1>
          <p class="text-sm text-neutral">创建理科迷账号</p>
        </div>

        <div class="tabs tabs-bordered mb-6">
          <a
            v-for="tab in tabs"
            :key="tab.key"
            class="tab tab-bordered"
            :class="{ 'tab-active': regType === tab.key }"
            @click.prevent="regType = tab.key"
            >{{ tab.label }}</a
          >
        </div>

        <LocalRegister v-if="regType === 'local'" :onRegister="handleRegister" />
        <NormalRegister v-if="regType === 'normal'" :onRegister="handleRegister" :onComplete="handleComplete" />
        <div v-if="regType === 'github'" class="space-y-4 text-center">
          <p class="text-sm text-neutral">GitHub OAuth 注册（模拟）</p>
          <button type="button" class="btn btn-outline w-full gap-2" @click="handleGithubRegister">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
            使用 GitHub 注册
          </button>
        </div>

        <p class="text-center text-[13px] text-neutral mt-5">
          已有账号？
          <a :href="getAuthPath('login')" class="text-primary font-semibold hover:underline">立即登录</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthProvider } from '~/composables/useAuth';
import { getAuthPath } from '../auth-paths';
import LocalRegister from './LocalRegister.vue';
import NormalRegister from './NormalRegister.vue';
import RegisterGuide from './RegisterGuide.vue';
import type { RegisterData, LoginResult } from '~/types/auth';

type RegType = 'local' | 'normal' | 'github';

const { state, register } = useAuthProvider();

const regType = ref<RegType>('normal');
const showGuide = ref(false);

const tabs = [
  { key: 'normal' as RegType, label: '普通账户' },
  { key: 'local' as RegType, label: '本地账户' },
  { key: 'github' as RegType, label: 'GitHub' },
];

function handleRegister(type: 'local' | 'normal', data: RegisterData): LoginResult {
  return register(type, data);
}

function handleComplete(withGuide: boolean) {
  showGuide.value = withGuide;
}

function handleGithubRegister() {
  register('normal', {
    username: 'github_user_' + Date.now().toString(36),
    password: '123456',
    email: 'github@likemi.com',
  });
}
</script>
