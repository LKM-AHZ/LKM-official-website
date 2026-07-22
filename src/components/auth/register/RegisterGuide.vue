<template>
  <div v-if="step === '2fa'" class="space-y-4 text-center">
    <h3 class="text-xl font-semibold">设置双因素认证（可选）</h3>
    <div class="bg-base-200 rounded-xl p-6 mx-auto w-40 h-40 flex items-center justify-center">
      <div class="text-4xl">📱</div>
    </div>
    <p class="text-sm text-neutral">使用 Google Authenticator 扫码绑定 2FA</p>
    <div class="flex gap-3 justify-center">
      <button type="button" class="btn btn-ghost btn-sm" @click="step = 'passkey'">跳过</button>
      <button type="button" class="btn btn-primary btn-sm" @click="step = 'passkey'">设置 2FA（模拟）</button>
    </div>
  </div>

  <div v-else class="space-y-4 text-center">
    <h3 class="text-xl font-semibold">创建通行密钥（可选）</h3>
    <div class="bg-base-200 rounded-xl p-6 mx-auto w-40 h-40 flex items-center justify-center">
      <div class="text-4xl">🔑</div>
    </div>
    <p class="text-sm text-neutral">通过指纹/面容/设备 PIN 实现免密登录</p>
    <div class="flex gap-3 justify-center">
      <button type="button" class="btn btn-ghost btn-sm" @click="props.onSkip()">跳过</button>
      <button type="button" class="btn btn-primary btn-sm" @click="props.onComplete()">创建（模拟）</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  onComplete: () => void;
  onSkip: () => void;
}>();

const step = ref<'2fa' | 'passkey'>('2fa');
</script>
