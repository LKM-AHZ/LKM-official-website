<template>
  <slot v-if="state.isLoggedIn" />
  <slot v-else name="fallback">
    <div class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div class="text-6xl">🔒</div>
      <p class="text-lg text-base-content">请先登录后再访问此页面</p>
      <a :href="getAuthPath('login')" class="btn btn-primary">前往登录</a>
    </div>
  </slot>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth';
import { getAuthPath } from './auth-paths';

const { state } = useAuth();
</script>
