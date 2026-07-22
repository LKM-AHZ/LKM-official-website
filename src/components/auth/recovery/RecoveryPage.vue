<template>
  <!-- Done -->
  <div v-if="step === 'done'" class="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
    <div class="relative w-full max-w-md text-center">
      <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-xl font-semibold mb-2">密码重置成功</h2>
        <p class="text-sm text-neutral">所有设备已强制下线，请使用新密码重新登录</p>
        <a :href="getAuthPath('login')" class="btn btn-primary btn-sm mt-4">去登录</a>
      </div>
    </div>
  </div>

  <!-- 2FA step -->
  <div
    v-else-if="step === '2fa' && account"
    class="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4"
  >
    <div class="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
    <div class="relative w-full max-w-md">
      <TwoFactorRecovery
        :level="account.level as 'normal' | 'admin'"
        :onSuccess="() => (step = 'reset')"
        :onBack="() => (step = 'verify')"
      />
    </div>
  </div>

  <!-- Main form -->
  <div v-else class="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
    <div class="relative w-full max-w-md">
      <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-semibold mb-2">密码找回</h1>
          <p class="text-sm text-neutral">重置您的登录密码</p>
        </div>

        <div v-if="errorMsg" class="alert alert-error text-sm mb-4">{{ errorMsg }}</div>

        <!-- Step: input -->
        <form v-if="step === 'input'" @submit.prevent="handleFind" class="space-y-4">
          <div class="tabs tabs-bordered mb-4">
            <a
              v-for="t in methodTabs"
              :key="t.key"
              class="tab tab-bordered"
              :class="{ 'tab-active': method === t.key }"
              @click.prevent="method = t.key"
              >{{ t.label }}</a
            >
          </div>
          <div>
            <label class="label pb-1">
              <span class="label-text font-medium">{{ method === 'sms' ? '手机号' : '邮箱' }}</span>
            </label>
            <input
              type="text"
              class="input input-bordered w-full"
              v-model="input"
              :placeholder="method === 'sms' ? '请输入绑定的手机号' : '请输入绑定的邮箱'"
            />
          </div>
          <button type="submit" class="btn btn-primary w-full">下一步</button>
        </form>

        <!-- Step: verify (magic-link) -->
        <div v-if="step === 'verify' && method === 'magic-link'" class="space-y-4 text-center">
          <p class="text-sm text-neutral">重置链接已发送至 {{ account?.email }}（模拟）</p>
          <button type="button" class="btn btn-primary" @click="handleMagicLinkClick">模拟点击重置链接</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="step = 'input'">返回</button>
        </div>

        <!-- Step: verify (sms / email-code) -->
        <form v-if="step === 'verify' && method !== 'magic-link'" @submit.prevent="handleVerify" class="space-y-4">
          <p class="text-sm text-neutral">验证码已发送（模拟码：000000）</p>
          <div>
            <label class="label pb-1"><span class="label-text font-medium">验证码</span></label>
            <input
              type="text"
              class="input input-bordered w-full"
              v-model="code"
              placeholder="请输入 6 位验证码"
              maxlength="6"
            />
          </div>
          <button type="submit" class="btn btn-primary w-full">验证</button>
          <button type="button" class="btn btn-ghost w-full btn-sm" @click="step = 'input'">返回</button>
        </form>

        <!-- Step: reset -->
        <form v-if="step === 'reset'" @submit.prevent="handleReset" class="space-y-4">
          <p class="text-sm text-neutral">为 {{ account?.username }} 设置新密码</p>
          <div>
            <label class="label pb-1"><span class="label-text font-medium">新密码</span></label>
            <input type="password" class="input input-bordered w-full" v-model="newPassword" placeholder="至少 6 位" />
          </div>
          <div>
            <label class="label pb-1"><span class="label-text font-medium">确认密码</span></label>
            <input
              type="password"
              class="input input-bordered w-full"
              v-model="confirmPassword"
              placeholder="再次输入新密码"
            />
          </div>
          <button type="submit" class="btn btn-primary w-full">重置密码</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getAuthPath } from '../auth-paths';
import { findAccount, VALIDATE_CODE } from '~/data/demo-accounts';
import TwoFactorRecovery from './TwoFactorRecovery.vue';
import type { DemoUser } from '~/types/auth';

type Method = 'sms' | 'email-code' | 'magic-link';
type Step = 'input' | 'verify' | 'reset' | '2fa' | 'done';

const input = ref('');
const method = ref<Method>('email-code');
const step = ref<Step>('input');
const account = ref<DemoUser | null>(null);
const code = ref('');
const errorMsg = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const methodTabs = [
  { key: 'email-code' as Method, label: '邮箱验证码' },
  { key: 'sms' as Method, label: '手机验证码' },
  { key: 'magic-link' as Method, label: 'Magic Link' },
];

function handleFind() {
  errorMsg.value = '';
  const found = findAccount(input.value);
  if (!found) {
    errorMsg.value = '未找到关联账号';
    return;
  }
  account.value = found;
  if (found.level === 'local') {
    errorMsg.value = '本地账户不支持密码找回，忘记密码即账号不可恢复';
    return;
  }
  if (method.value === 'magic-link' && found.level === 'admin') {
    errorMsg.value = '管理员账户不支持 Magic Link 找回，请使用邮箱验证码方式';
    return;
  }
  step.value = 'verify';
}

function handleVerify() {
  if (code.value !== VALIDATE_CODE) {
    errorMsg.value = '验证码错误（模拟码：000000）';
    return;
  }
  errorMsg.value = '';
  if (account.value?.level === 'admin') {
    step.value = '2fa';
  } else {
    step.value = 'reset';
  }
}

function handleMagicLinkClick() {
  if (account.value?.level === 'admin') {
    step.value = '2fa';
  } else {
    step.value = 'reset';
  }
}

function handleReset() {
  if (!newPassword.value || newPassword.value.length < 6) {
    errorMsg.value = '密码长度不能少于 6 位';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致';
    return;
  }
  step.value = 'done';
}
</script>
