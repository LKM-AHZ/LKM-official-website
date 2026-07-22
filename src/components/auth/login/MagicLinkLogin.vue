<template>
  <div class="space-y-4">
    <!-- Sent state -->
    <div v-if="stage === 'sent'" class="text-center space-y-4">
      <div class="rounded-xl border border-base-300 bg-base-200 p-6 space-y-4">
        <div class="text-4xl">📧</div>
        <p class="font-semibold text-base-content">魔法链接已发送</p>
        <p class="text-sm text-neutral">
          模拟已向 <span class="font-semibold">{{ email }}</span> 发送登录链接
        </p>
        <div class="flex flex-col gap-2">
          <button type="button" class="btn btn-primary btn-sm" @click="handleSimulateClick" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-xs"></span>
            <template v-else>模拟点击邮件链接</template>
          </button>
          <div class="flex gap-2 justify-center">
            <button type="button" class="btn btn-ghost btn-xs" @click="stage = 'expired'">模拟链接已过期</button>
            <button type="button" class="btn btn-ghost btn-xs" @click="stage = 'used'">模拟链接已使用</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Expired state -->
    <div v-else-if="stage === 'expired'" class="text-center space-y-4">
      <div class="alert alert-warning"><span>链接已过期，请重新获取</span></div>
      <button type="button" class="btn btn-ghost btn-sm" @click="stage = 'input'">返回重新发送</button>
    </div>

    <!-- Used state -->
    <div v-else-if="stage === 'used'" class="text-center space-y-4">
      <div class="alert alert-warning"><span>链接已失效（已使用），请重新获取</span></div>
      <button type="button" class="btn btn-ghost btn-sm" @click="stage = 'input'">返回重新发送</button>
    </div>

    <!-- Input state (default) -->
    <form v-else @submit.prevent="handleSend" class="space-y-4">
      <p class="text-sm text-neutral text-center">
        我们将向 <span class="font-semibold">{{ email }}</span> 发送包含登录链接的邮件
      </p>
      <button type="submit" class="btn btn-primary w-full">发送魔法链接</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LoginMethod, DemoUser } from '~/types/auth';

const props = defineProps<{
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
  identifiedAccount: DemoUser;
}>();

type Stage = 'input' | 'sent' | 'expired' | 'used';

const email = computed(() => props.identifiedAccount.email || '');
const stage = ref<Stage>('input');
const loading = ref(false);

function handleSend(e: Event) {
  e.preventDefault();
  stage.value = 'sent';
}

async function handleSimulateClick() {
  loading.value = true;
  await props.onLogin('magic-link', { email: email.value });
  loading.value = false;
}
</script>
