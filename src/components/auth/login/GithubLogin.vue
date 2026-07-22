<template>
  <div class="space-y-4">
    <template v-if="!showSimulate">
      <p class="text-sm text-neutral text-center">GitHub OAuth 授权登录（当前为模拟模式）</p>
      <button type="button" class="btn btn-outline w-full gap-2" @click="handleClick">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
        使用 GitHub 登录
      </button>
    </template>
    <div v-else class="rounded-xl border border-base-300 bg-base-200 p-6 text-center space-y-4">
      <svg class="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
        />
      </svg>
      <p class="font-semibold text-base-content">模拟 GitHub 授权</p>
      <p class="text-sm text-neutral">此操作将使用 <code class="text-primary">demo_normal</code> 账户登录</p>
      <div v-if="cancelled" class="alert alert-warning text-sm">授权已取消，请重新操作</div>
      <div class="flex gap-3 justify-center">
        <button type="button" class="btn btn-ghost btn-sm" @click="handleCancel">取消</button>
        <button type="button" class="btn btn-primary btn-sm" @click="handleAuthorize" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          <template v-else>授权并登录</template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { LoginMethod } from '~/types/auth';

const props = defineProps<{
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
}>();

const loading = ref(false);
const showSimulate = ref(false);
const cancelled = ref(false);

function handleClick() {
  cancelled.value = false;
  showSimulate.value = true;
}

async function handleAuthorize() {
  loading.value = true;
  await props.onLogin('github', {});
  loading.value = false;
}

function handleCancel() {
  cancelled.value = true;
  showSimulate.value = false;
}
</script>
