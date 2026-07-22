<template>
  <div v-if="user.level === 'local'" class="space-y-4">
    <h3 class="text-lg font-semibold">双因素认证</h3>
    <div class="alert alert-info text-sm">本地账户不支持 2FA，请先绑定邮箱或手机号升级为普通账户</div>
  </div>

  <div v-else class="space-y-4">
    <h3 class="text-lg font-semibold">双因素认证 (2FA)</h3>
    <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
      <div>
        <span class="font-medium">TOTP 动态验证码</span>
        <span class="badge badge-xs ml-2" :class="user.has2FA ? 'badge-success' : 'badge-ghost'">
          {{ user.has2FA ? '已开启' : '未开启' }}
        </span>
      </div>
      <button v-if="user.has2FA" type="button" class="btn btn-ghost btn-xs text-error" @click="handleDisable">
        {{ user.level === 'admin' ? '关闭（将降级）' : '关闭' }}
      </button>
      <button v-else type="button" class="btn btn-ghost btn-xs" @click="handleEnable">开启</button>
    </div>

    <!-- Enable modal -->
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="show = false">
      <div class="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" @click.stop>
        <!-- Scan step -->
        <div v-if="curStep === 'scan'" class="space-y-4">
          <h4 class="font-semibold">设置 TOTP 双因素认证</h4>
          <div class="bg-base-200 rounded-xl p-6 mx-auto w-40 h-40 flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl mb-2">📱</div>
              <p class="text-xs text-neutral">模拟二维码</p>
            </div>
          </div>
          <div>
            <label class="label pb-1"><span class="label-text">输入验证码确认</span></label>
            <input
              type="text"
              class="input input-bordered w-full"
              v-model="setupCode"
              placeholder="模拟码：000000"
              maxlength="6"
            />
          </div>
          <div v-if="errorMsg" class="text-error text-xs">{{ errorMsg }}</div>
          <button type="button" class="btn btn-primary btn-sm w-full" @click="handleVerify">验证</button>
        </div>

        <!-- Codes step -->
        <div v-else class="space-y-4">
          <h4 class="font-semibold">备用恢复码</h4>
          <p class="text-sm text-neutral">请安全保存以下恢复码（模拟）</p>
          <div class="bg-base-200 rounded-xl p-3 font-mono text-xs space-y-1">
            <div v-for="c in DUMMY_RECOVERY_CODES" :key="c" class="select-all">{{ c }}</div>
          </div>
          <label class="label cursor-pointer justify-start gap-2">
            <input type="checkbox" class="checkbox checkbox-sm" v-model="savedCodes" />
            <span class="label-text text-sm">我已安全保存备用恢复码</span>
          </label>
          <button type="button" class="btn btn-primary btn-sm w-full" :disabled="!savedCodes" @click="handleConfirm">
            完成设置
          </button>
        </div>

        <button type="button" class="btn btn-ghost btn-xs w-full mt-2" @click="show = false">取消</button>
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

const DUMMY_RECOVERY_CODES = ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF', 'GGGG-HHHH-IIII', 'JJJJ-KKKK-LLLL'];

const show = ref(false);
const curStep = ref<'scan' | 'codes'>('scan');
const setupCode = ref('');
const errorMsg = ref('');
const savedCodes = ref(false);

function handleEnable() {
  show.value = true;
  curStep.value = 'scan';
  setupCode.value = '';
  errorMsg.value = '';
}

function handleVerify() {
  if (setupCode.value !== '000000' && setupCode.value !== '123456') {
    errorMsg.value = '验证码错误（模拟码：000000）';
    return;
  }
  errorMsg.value = '';
  curStep.value = 'codes';
}

function handleConfirm() {
  if (!savedCodes.value) return;
  props.onUpdate({ ...props.user, has2FA: true });
  show.value = false;
}

function handleDisable() {
  const updated = { ...props.user, has2FA: false };
  if (props.user.level === 'admin') {
    updated.level = 'normal';
    alert('关闭 2FA 后，管理员账户已自动降级为普通账户');
  }
  props.onUpdate(updated);
}
</script>
