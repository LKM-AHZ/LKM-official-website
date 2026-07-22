<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">登录方式管理</h3>
    <div v-if="successMsg" class="alert alert-success text-sm">{{ successMsg }}</div>

    <div
      v-for="method in methods"
      :key="method.key"
      class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
    >
      <div>
        <span class="font-medium">{{ method.label }}</span>
        <span class="text-xs text-neutral ml-2">{{ method.detail }}</span>
        <span class="badge badge-xs ml-2" :class="user.bindings.includes(method.key) ? 'badge-success' : 'badge-ghost'">
          {{ user.bindings.includes(method.key) ? '已绑定' : '未绑定' }}
        </span>
      </div>
      <div class="flex gap-1">
        <button
          v-if="user.bindings.includes(method.key)"
          type="button"
          class="btn btn-ghost btn-xs text-error"
          @click="handleUnbind(method.key)"
        >
          解绑
        </button>
        <button
          v-else
          type="button"
          class="btn btn-ghost btn-xs"
          @click="handleBind(method.key)"
          :disabled="user.level === 'local' && method.key === 'passkey'"
        >
          绑定
        </button>
      </div>
    </div>

    <!-- Bind modal -->
    <div
      v-if="showBind"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click="showBind = null"
    >
      <div class="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" @click.stop>
        <h4 class="font-semibold mb-4">绑定 {{ bindLabel }}</h4>

        <div v-if="showBind === 'github'" class="space-y-4 text-center">
          <p class="text-sm text-neutral">模拟 Github OAuth 授权绑定</p>
          <button type="button" class="btn btn-primary btn-sm" @click="handleVerify">模拟授权并绑定</button>
        </div>

        <div v-else-if="showBind === 'passkey'" class="space-y-4 text-center">
          <p class="text-sm text-neutral">模拟 Passkey 创建</p>
          <button type="button" class="btn btn-primary btn-sm" @click="handleVerify">模拟创建通行密钥</button>
        </div>

        <div v-else class="space-y-3">
          <div>
            <label class="label pb-1"
              ><span class="label-text">{{ showBind === 'phone' ? '手机号' : '邮箱' }}</span></label
            >
            <input type="text" class="input input-bordered w-full" v-model="bindInput" />
          </div>
          <div>
            <label class="label pb-1"><span class="label-text">验证码</span></label>
            <input
              type="text"
              class="input input-bordered w-full"
              v-model="bindCode"
              placeholder="模拟码：000000"
              maxlength="6"
            />
          </div>
          <div v-if="error" class="text-error text-xs">{{ error }}</div>
          <button type="button" class="btn btn-primary btn-sm w-full" @click="handleVerify">验证并绑定</button>
        </div>

        <button type="button" class="btn btn-ghost btn-xs w-full mt-2" @click="showBind = null">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DemoUser } from '~/types/auth';

const props = defineProps<{
  user: DemoUser;
  onUpdate: (user: DemoUser) => void;
}>();

const methods = computed(() => [
  { key: 'email' as const, label: '邮箱', detail: props.user.email || '' },
  { key: 'phone' as const, label: '手机号', detail: props.user.phone || '' },
  { key: 'github' as const, label: 'Github OAuth', detail: '' },
  { key: 'passkey' as const, label: 'Passkey 通行密钥', detail: '' },
]);

const showBind = ref<string | null>(null);
const bindInput = ref('');
const bindCode = ref('');
const error = ref('');
const successMsg = ref('');

const bindLabel = computed(() => {
  const map: Record<string, string> = { email: '邮箱', phone: '手机号', github: 'Github', passkey: 'Passkey' };
  return map[showBind.value || ''] || '';
});

function handleBind(method: string) {
  showBind.value = method;
  bindInput.value = '';
  bindCode.value = '';
  error.value = '';
  successMsg.value = '';
}

function handleVerify() {
  if (showBind.value === 'email' || showBind.value === 'phone') {
    if (!bindInput.value.trim()) {
      error.value = `请输入${showBind.value === 'phone' ? '手机号' : '邮箱'}`;
      return;
    }
    if (bindCode.value !== '000000') {
      error.value = '验证码错误（模拟码：000000）';
      return;
    }
  }

  const updated: DemoUser = { ...props.user };
  if (showBind.value === 'email') {
    updated.email = bindInput.value.trim();
    if (!updated.bindings.includes('email')) updated.bindings.push('email');
  } else if (showBind.value === 'phone') {
    updated.phone = bindInput.value.trim();
    if (!updated.bindings.includes('phone')) updated.bindings.push('phone');
  } else if (showBind.value === 'github') {
    updated.hasGithub = true;
    if (!updated.bindings.includes('github')) updated.bindings.push('github');
  } else if (showBind.value === 'passkey') {
    updated.hasPasskey = true;
    if (!updated.bindings.includes('passkey')) updated.bindings.push('passkey');
  }

  if (
    props.user.level === 'local' &&
    showBind.value &&
    ['email', 'phone', 'github', 'passkey'].includes(showBind.value)
  ) {
    updated.level = 'normal';
    successMsg.value = `${bindLabel.value} 绑定成功！账户已从本地账户升级为普通账户，刷新后生效。`;
  } else {
    successMsg.value = '绑定成功';
  }
  props.onUpdate(updated);
  showBind.value = null;
}

function handleUnbind(method: string) {
  const updated: DemoUser = { ...props.user };
  if (method === 'email') {
    updated.email = null;
    updated.bindings = updated.bindings.filter((b) => b !== 'email');
  }
  if (method === 'phone') {
    updated.phone = null;
    updated.bindings = updated.bindings.filter((b) => b !== 'phone');
  }
  if (method === 'github') {
    updated.hasGithub = false;
    updated.bindings = updated.bindings.filter((b) => b !== 'github');
  }
  if (method === 'passkey') {
    updated.hasPasskey = false;
    updated.bindings = updated.bindings.filter((b) => b !== 'passkey');
  }
  props.onUpdate(updated);
  successMsg.value = '解绑成功';
}
</script>
