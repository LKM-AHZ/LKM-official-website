<template>
  <div v-if="user.level === 'local'" class="space-y-4">
    <h3 class="text-lg font-semibold">通行密钥 (Passkey)</h3>
    <div class="alert alert-info text-sm">本地账户不支持 Passkey，请先升级为普通账户</div>
  </div>

  <div v-else class="space-y-4">
    <h3 class="text-lg font-semibold">通行密钥 (Passkey)</h3>
    <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
      <div>
        <span class="font-medium">生物识别 / PIN 码</span>
        <span class="badge badge-xs ml-2" :class="user.hasPasskey ? 'badge-success' : 'badge-ghost'">
          {{ user.hasPasskey ? '已创建' : '未创建' }}
        </span>
      </div>
      <button v-if="user.hasPasskey" type="button" class="btn btn-ghost btn-xs text-error" @click="handleDelete">
        删除
      </button>
      <button v-else type="button" class="btn btn-ghost btn-xs" @click="showCreate = true">创建</button>
    </div>

    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click="showCreate = false"
    >
      <div class="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center space-y-4" @click.stop>
        <div class="text-5xl">🔑</div>
        <h4 class="font-semibold">创建通行密钥</h4>
        <p class="text-sm text-neutral">系统将调用你设备的指纹、面容或 PIN 码进行验证（模拟）</p>
        <button type="button" class="btn btn-primary btn-sm" @click="handleCreate">模拟创建</button>
        <button type="button" class="btn btn-ghost btn-xs w-full" @click="showCreate = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { DemoUser } from '~/types/auth';

const props = defineProps<{
  user: DemoUser;
  onUpdate: (user: DemoUser) => void;
}>();

const showCreate = ref(false);

function handleCreate() {
  props.onUpdate({
    ...props.user,
    hasPasskey: true,
    bindings: [...new Set([...props.user.bindings, 'passkey'])],
  });
  showCreate.value = false;
}

function handleDelete() {
  props.onUpdate({
    ...props.user,
    hasPasskey: false,
    bindings: props.user.bindings.filter((b) => b !== 'passkey'),
  });
}
</script>
