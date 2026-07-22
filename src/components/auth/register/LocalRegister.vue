<template>
  <form v-if="!submitted" @submit.prevent="handleSubmit" class="space-y-4">
    <p class="text-sm text-neutral text-center">仅用户名 + 密码，无需绑定邮箱/手机</p>
    <div>
      <label class="label pb-1" for="reg-local-username">
        <span class="label-text font-medium">用户名</span>
      </label>
      <input
        id="reg-local-username"
        type="text"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.username }"
        v-model="username"
        placeholder="请输入用户名(至少3位)"
        @input="errors.username = ''"
      />
      <span v-if="errors.username" class="label-text-alt text-error">{{ errors.username }}</span>
    </div>
    <div>
      <label class="label pb-1" for="reg-local-password">
        <span class="label-text font-medium">密码</span>
      </label>
      <input
        id="reg-local-password"
        type="password"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.password }"
        v-model="password"
        placeholder="请输入密码（至少6位）"
        @input="errors.password = ''"
      />
      <span v-if="errors.password" class="label-text-alt text-error">{{ errors.password }}</span>
    </div>
    <div>
      <label class="label pb-1" for="reg-local-confirm">
        <span class="label-text font-medium">确认密码</span>
      </label>
      <input
        id="reg-local-confirm"
        type="password"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.confirmPassword }"
        v-model="confirmPassword"
        placeholder="再次输入密码（至少6位）"
        @input="errors.confirmPassword = ''"
      />
      <span v-if="errors.confirmPassword" class="label-text-alt text-error">{{ errors.confirmPassword }}</span>
    </div>
    <div v-if="submitError" class="alert alert-error text-sm">{{ submitError }}</div>
    <button type="submit" class="btn btn-primary w-full">注册本地账户</button>
  </form>

  <div v-else class="text-center space-y-4">
    <div class="flex justify-center">
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
    <p class="font-semibold text-lg">本地账户注册成功</p>
    <p class="text-sm text-neutral">账户等级：<span class="badge badge-sm">本地账户</span></p>
    <div class="alert alert-info text-sm text-left">
      <span>本地账户功能受限：不可找回密码、不支持 2FA。绑定邮箱或手机号可自动升级为普通账户。</span>
    </div>
    <a :href="getAuthPath('login')" class="btn btn-primary btn-sm">去登录</a>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getAuthPath } from '../auth-paths';
import type { RegisterData } from '~/types/auth';

const props = defineProps<{
  onRegister: (type: 'local', data: RegisterData) => { success: boolean; error?: string };
}>();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const errors = ref<Record<string, string>>({});
const submitted = ref(false);
const submitError = ref('');

function validate(): boolean {
  const errs: Record<string, string> = {};
  if (!username.value.trim()) errs.username = '请输入用户名';
  else if (username.value.trim().length < 3) errs.username = '用户名至少 3 个字符';
  if (!password.value) errs.password = '请输入密码';
  else if (password.value.length < 6) errs.password = '密码长度不能少于 6 位';
  if (password.value !== confirmPassword.value) errs.confirmPassword = '两次输入的密码不一致';
  errors.value = errs;
  return Object.keys(errs).length === 0;
}

function handleSubmit() {
  submitError.value = '';
  if (!validate()) return;
  const result = props.onRegister('local', { username: username.value.trim(), password: password.value });
  if (!result.success) {
    submitError.value = result.error || '注册失败';
    return;
  }
  submitted.value = true;
}
</script>
