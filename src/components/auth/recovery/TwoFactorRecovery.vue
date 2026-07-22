<template>
  <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
    <h2 class="text-xl font-semibold text-center mb-4">2FA 恢复</h2>

    <!-- Verify email -->
    <form v-if="step === 'verify'" @submit.prevent="handleVerify" class="space-y-4">
      <p class="text-sm text-neutral text-center">请通过邮箱验证身份</p>
      <div>
        <label class="label pb-1"><span class="label-text font-medium">邮箱</span></label>
        <input type="email" class="input input-bordered w-full" v-model="email" placeholder="请输入绑定邮箱" />
      </div>
      <div>
        <label class="label pb-1"><span class="label-text font-medium">验证码</span></label>
        <input
          type="text"
          class="input input-bordered w-full"
          v-model="code"
          placeholder="输入验证码（模拟：000000）"
          maxlength="6"
        />
      </div>
      <p class="text-xs text-success text-center">模拟验证码：000000</p>
      <div v-if="error" class="alert alert-error text-sm">{{ error }}</div>
      <button type="submit" class="btn btn-primary w-full">验证</button>
      <button type="button" class="btn btn-ghost w-full btn-sm" @click="props.onBack()">返回</button>
    </form>

    <!-- Recovery code -->
    <form v-else-if="step === 'recovery'" @submit.prevent="handleRecovery" class="space-y-4">
      <p class="text-sm text-neutral text-center">请输入备用恢复码</p>
      <div>
        <label class="label pb-1"><span class="label-text font-medium">恢复码</span></label>
        <input
          type="text"
          class="input input-bordered w-full"
          v-model="recoveryCode"
          placeholder="格式：AAAA-BBBB-CCCC"
        />
      </div>
      <div v-if="error" class="alert alert-error text-sm">{{ error }}</div>
      <button type="submit" class="btn btn-primary w-full">验证</button>
      <button
        v-if="props.level === 'admin'"
        type="button"
        class="btn btn-ghost w-full btn-sm"
        @click="props.onSuccess()"
      >
        联系其他管理员协助（模拟）
      </button>
    </form>

    <!-- Done -->
    <div v-else-if="step === 'done'" class="text-center space-y-4">
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
      <p class="font-semibold">恢复成功</p>
      <p class="text-sm text-neutral">请重新设置 2FA</p>
      <button type="button" class="btn btn-primary btn-sm" @click="props.onSuccess()">完成</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  level: 'normal' | 'admin';
  onSuccess: () => void;
  onBack: () => void;
}>();

const DUMMY_RECOVERY_CODES = ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF'];

const step = ref<'verify' | 'recovery' | 'done'>('verify');
const email = ref('');
const code = ref('');
const recoveryCode = ref('');
const error = ref('');

function handleVerify() {
  if (!email.value.trim()) {
    error.value = '请输入邮箱';
    return;
  }
  if (code.value !== '000000') {
    error.value = '验证码错误（模拟码：000000）';
    return;
  }
  error.value = '';
  step.value = 'recovery';
}

function handleRecovery() {
  if (DUMMY_RECOVERY_CODES.some((c) => c === recoveryCode.value.toUpperCase().trim())) {
    step.value = 'done';
  } else {
    error.value = '恢复码无效';
  }
}
</script>
