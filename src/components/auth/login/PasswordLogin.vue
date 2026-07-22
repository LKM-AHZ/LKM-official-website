<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="label pb-1" for="login-password">
        <span class="label-text font-medium">密码</span>
      </label>
      <input
        id="login-password"
        type="password"
        class="input input-bordered w-full"
        :class="{ 'input-error': passwordError }"
        v-model="password"
        placeholder="请输入密码"
        autocomplete="current-password"
        @input="passwordError = ''"
      />
      <span v-if="passwordError" class="label-text-alt text-error">{{ passwordError }}</span>
    </div>
    <div v-if="identifiedAccount.level !== 'local'" class="text-right">
      <a :href="getAuthPath('account/recovery')" class="text-xs text-primary hover:underline">忘记密码？</a>
    </div>
    <button type="submit" class="btn btn-primary w-full" :disabled="loading">
      <span v-if="loading" class="loading loading-spinner loading-xs"></span>
      <template v-else>登录</template>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getAuthPath } from '../auth-paths';
import type { LoginMethod, DemoUser } from '~/types/auth';

const props = defineProps<{
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
  identifiedAccount: DemoUser;
}>();

const password = ref('');
const passwordError = ref('');
const loading = ref(false);

async function handleSubmit() {
  if (!password.value) {
    passwordError.value = '请输入密码';
    return;
  }
  if (password.value.length < 6) {
    passwordError.value = '密码长度不能少于 6 位';
    return;
  }
  passwordError.value = '';
  loading.value = true;
  await props.onLogin('password', { username: props.identifiedAccount.username, password: password.value });
  loading.value = false;
}
</script>
