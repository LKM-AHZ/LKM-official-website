<template>
  <!-- Verify step -->
  <form v-if="step === 'verify'" @submit.prevent="handleVerify" class="space-y-4">
    <p class="text-sm text-neutral text-center">验证码已发送至 {{ useEmail ? email : phone }}（模拟码：000000）</p>
    <input
      id="reg-verify"
      type="text"
      class="input input-bordered w-full"
      v-model="verifyCode"
      placeholder="请输入 6 位验证码"
      maxlength="6"
    />
    <div v-if="submitError" class="alert alert-error text-sm">{{ submitError }}</div>
    <button type="submit" class="btn btn-primary w-full">验证并完成注册</button>
    <button type="button" class="btn btn-ghost w-full btn-sm" @click="step = 'form'">返回修改</button>
  </form>

  <!-- Done step -->
  <div v-else-if="step === 'done'" class="text-center space-y-4">
    <div class="text-5xl">✅</div>
    <p class="font-semibold text-lg">普通账户注册成功</p>
    <p class="text-sm text-neutral">现在可以设置 2FA 和通行密钥增强安全性</p>
    <div class="flex gap-3 justify-center">
      <button type="button" class="btn btn-ghost btn-sm" @click="props.onComplete(false)">跳过</button>
      <button type="button" class="btn btn-primary btn-sm" @click="props.onComplete(true)">去设置 2FA</button>
    </div>
  </div>

  <!-- Form step (default) -->
  <form v-else @submit.prevent="handleSubmit" class="space-y-4">
    <p class="text-sm text-neutral text-center">仅需用户名 + {{ useEmail ? '邮箱' : '手机号' }}，验证后即可注册</p>
    <div>
      <label class="label pb-1" for="reg-normal-user">
        <span class="label-text font-medium">用户名</span>
      </label>
      <input
        id="reg-normal-user"
        type="text"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.username }"
        v-model="username"
        placeholder="请输入用户名（至少3位）"
        @input="errors.username = ''"
      />
      <span v-if="errors.username" class="label-text-alt text-error">{{ errors.username }}</span>
    </div>
    <div class="flex gap-2">
      <button type="button" class="btn btn-xs" :class="useEmail ? 'btn-primary' : 'btn-ghost'" @click="useEmail = true">
        使用邮箱
      </button>
      <button
        type="button"
        class="btn btn-xs"
        :class="!useEmail ? 'btn-primary' : 'btn-ghost'"
        @click="useEmail = false"
      >
        使用手机号
      </button>
    </div>
    <div v-if="useEmail">
      <label class="label pb-1" for="reg-normal-email">
        <span class="label-text font-medium">邮箱</span>
      </label>
      <input
        id="reg-normal-email"
        type="email"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.email }"
        v-model="email"
        placeholder="请输入邮箱地址"
        @input="errors.email = ''"
      />
      <span v-if="errors.email" class="label-text-alt text-error">{{ errors.email }}</span>
    </div>
    <div v-else>
      <label class="label pb-1" for="reg-normal-phone">
        <span class="label-text font-medium">手机号</span>
      </label>
      <input
        id="reg-normal-phone"
        type="tel"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.phone }"
        v-model="phone"
        placeholder="请输入手机号"
        @input="errors.phone = ''"
      />
      <span v-if="errors.phone" class="label-text-alt text-error">{{ errors.phone }}</span>
    </div>
    <div v-if="submitError" class="alert alert-error text-sm">{{ submitError }}</div>
    <button type="submit" class="btn btn-primary w-full">发送验证码</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { RegisterData } from '~/types/auth';

const props = defineProps<{
  onRegister: (type: 'normal', data: RegisterData) => { success: boolean; error?: string };
  onComplete: (withGuide: boolean) => void;
}>();

const step = ref<'form' | 'verify' | 'done'>('form');
const username = ref('');
const email = ref('');
const phone = ref('');
const useEmail = ref(true);
const errors = ref<Record<string, string>>({});
const submitError = ref('');
const verifyCode = ref('');

function validate(): boolean {
  const errs: Record<string, string> = {};
  if (!username.value.trim()) errs.username = '请输入用户名';
  else if (username.value.trim().length < 3) errs.username = '用户名至少 3 个字符';
  if (useEmail.value && !email.value.trim()) errs.email = '请输入邮箱';
  else if (useEmail.value && !email.value.includes('@')) errs.email = '请输入有效的邮箱地址';
  if (!useEmail.value && !phone.value.trim()) errs.phone = '请输入手机号';
  errors.value = errs;
  return Object.keys(errs).length === 0;
}

function handleSubmit() {
  submitError.value = '';
  if (!validate()) return;
  step.value = 'verify';
}

function handleVerify() {
  if (verifyCode.value !== '000000') {
    submitError.value = '验证码错误（模拟码：000000）';
    return;
  }
  const result = props.onRegister('normal', {
    username: username.value.trim(),
    email: useEmail.value ? email.value.trim() : undefined,
    phone: !useEmail.value ? phone.value.trim() : undefined,
  });
  if (!result.success) {
    submitError.value = result.error || '注册失败';
    return;
  }
  step.value = 'done';
}
</script>
