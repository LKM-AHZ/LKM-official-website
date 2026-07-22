<template>
  <ProtectedRoute>
    <div class="relative min-h-[calc(100vh-12rem)] px-4 py-8">
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-semibold mb-2">账户设置</h1>
          <p class="text-sm text-neutral">管理你的登录方式和安全设置</p>
        </div>

        <div v-if="message" class="alert alert-success text-sm">{{ message }}</div>

        <!-- Account info -->
        <div class="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6 space-y-4">
          <h3 class="text-lg font-semibold">账户信息</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-neutral">用户名：</span>
              <span class="font-medium">{{ state.user?.username }}</span>
            </div>
            <div>
              <span class="text-neutral">等级：</span>
              <span class="badge badge-sm" :class="levelBadgeClass">{{ levelLabel }}</span>
            </div>
            <div>
              <span class="text-neutral">邮箱：</span>
              <span class="font-medium">{{ state.user?.email || '未绑定' }}</span>
            </div>
            <div>
              <span class="text-neutral">手机号：</span>
              <span class="font-medium">{{ state.user?.phone || '未绑定' }}</span>
            </div>
          </div>

          <div v-if="state.user?.level === 'local'" class="alert alert-info text-sm">
            <span>当前为本地账户，绑定邮箱或手机号可自动升级为普通账户，解锁全部功能。</span>
          </div>

          <button
            v-if="state.user?.level === 'normal'"
            type="button"
            class="btn btn-ghost btn-sm"
            @click="handleUpgrade"
          >
            升级为管理员
          </button>
        </div>

        <!-- Bindings -->
        <div v-if="state.user" class="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6">
          <BindMethods :user="state.user" :onUpdate="handleUpdate" />
        </div>

        <!-- 2FA -->
        <div v-if="state.user" class="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6">
          <TwoFactorSetup :user="state.user" :onUpdate="handleUpdate" />
        </div>

        <!-- Passkey -->
        <div v-if="state.user" class="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6">
          <PasskeySetup :user="state.user" :onUpdate="handleUpdate" />
        </div>

        <div class="flex gap-3 justify-between">
          <a :href="getAuthPath('account/recovery')" class="btn btn-ghost btn-sm">密码找回</a>
          <button type="button" class="btn btn-outline btn-sm text-error" @click="logout">退出登录</button>
        </div>
      </div>
    </div>
  </ProtectedRoute>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthProvider } from '~/composables/useAuth';
import { getAuthPath } from '../auth-paths';
import ProtectedRoute from '../ProtectedRoute.vue';
import BindMethods from './BindMethods.vue';
import TwoFactorSetup from './TwoFactorSetup.vue';
import PasskeySetup from './PasskeySetup.vue';
import type { DemoUser } from '~/types/auth';

const { state, updateUser, logout } = useAuthProvider();

const message = ref('');

const levelBadgeClass = computed(() => {
  const level = state.user?.level;
  return level === 'admin' ? 'badge-error' : level === 'normal' ? 'badge-primary' : 'badge-ghost';
});
const levelLabel = computed(() => {
  const level = state.user?.level;
  return level === 'admin' ? '管理员' : level === 'normal' ? '普通账户' : '本地账户';
});

function handleUpdate(user: DemoUser) {
  updateUser(user);
  message.value = '设置已更新';
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

function handleUpgrade() {
  if (state.user?.has2FA) {
    handleUpdate({ ...state.user!, level: 'admin' });
  } else {
    message.value = '请先开启 2FA 后再升级为管理员';
    setTimeout(() => {
      message.value = '';
    }, 3000);
  }
}
</script>
