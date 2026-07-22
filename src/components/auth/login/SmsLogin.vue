<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
      <span class="text-sm text-neutral">发送至：</span>
      <span class="text-sm font-medium">{{ target }}</span>
    </div>
    <button type="button" class="btn btn-outline w-full" @click="handleSendCode" :disabled="countdown > 0">
      {{ countdown > 0 ? `${countdown}s 后重新获取` : codeSent ? '重新获取验证码' : '获取验证码' }}
    </button>
    <p v-if="codeSent" class="text-xs text-success text-center">验证码已发送（模拟码：000000）</p>
    <div>
      <label class="label pb-1" for="sms-code">
        <span class="label-text font-medium">验证码</span>
      </label>
      <input
        id="sms-code"
        type="text"
        class="input input-bordered w-full"
        :class="{ 'input-error': codeError }"
        v-model="code"
        placeholder="请输入 6 位验证码"
        maxlength="6"
        @input="codeError = ''"
      />
      <span v-if="codeError" class="label-text-alt text-error">{{ codeError }}</span>
    </div>
    <button type="submit" class="btn btn-primary w-full" :disabled="loading || !codeSent">
      <span v-if="loading" class="loading loading-spinner loading-xs"></span>
      <template v-else>登录</template>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import type { LoginMethod, DemoUser } from '~/types/auth';

const props = defineProps<{
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
  identifiedAccount: DemoUser;
}>();

const target = computed(() => props.identifiedAccount.phone || props.identifiedAccount.email || '');

const code = ref('');
const codeError = ref('');
const countdown = ref(0);
const codeSent = ref(false);
const loading = ref(false);
const attempts = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

function handleSendCode() {
  codeSent.value = true;
  attempts.value = 0;
  countdown.value = 60;
  timer = setInterval(() => {
    if (countdown.value <= 1) {
      clearInterval(timer);
      countdown.value = 0;
      return;
    }
    countdown.value--;
  }, 1000);
}

async function handleSubmit() {
  if (!code.value.trim()) {
    codeError.value = '请输入验证码';
    return;
  }
  if (attempts.value >= 3) {
    codeError.value = '验证码错误次数过多，请重新获取';
    codeSent.value = false;
    code.value = '';
    attempts.value = 0;
    return;
  }
  loading.value = true;
  codeError.value = '';
  attempts.value++;
  await props.onLogin('sms', { phoneOrEmail: props.identifiedAccount.username, code: code.value });
  loading.value = false;
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
