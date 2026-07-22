<template>
  <div class="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
    <!-- Setup flow: scan QR -->
    <template v-if="isSetupFlow && setupStep === 'scan'">
      <h2 class="text-2xl font-semibold text-center mb-4">绑定双因素认证</h2>
      <div class="space-y-4">
        <div class="alert alert-info text-sm">管理员账户必须绑定 2FA 才能登录</div>
        <div class="text-center space-y-3">
          <div class="bg-base-200 rounded-xl p-6 mx-auto w-48 h-48 flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl mb-2">📱</div>
              <p class="text-xs text-neutral">模拟二维码</p>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium">手动输入密钥</p>
            <div class="flex items-center justify-center gap-2 mt-1">
              <code class="bg-base-200 px-3 py-1 rounded text-sm select-all">{{
                showSecret ? DUMMY_TOTP_SECRET : '•••• •••• •••• ••••'
              }}</code>
              <button type="button" class="btn btn-ghost btn-xs" @click="showSecret = !showSecret">
                {{ showSecret ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>
        </div>
        <form @submit.prevent="handleSetupVerify" class="space-y-3">
          <div>
            <label class="label pb-1" for="setup-totp">
              <span class="label-text font-medium">输入验证码确认</span>
            </label>
            <input
              id="setup-totp"
              type="text"
              class="input input-bordered w-full"
              :class="{ 'input-error': setupError }"
              v-model="setupCode"
              placeholder="输入 6 位验证码（模拟：000000）"
              maxlength="6"
              @input="setupError = ''"
            />
            <span v-if="setupError" class="label-text-alt text-error">{{ setupError }}</span>
          </div>
          <button type="submit" class="btn btn-primary w-full">验证并继续</button>
        </form>
      </div>
    </template>

    <!-- Setup flow: recovery codes -->
    <template v-else-if="isSetupFlow && setupStep === 'recovery'">
      <div class="space-y-4">
        <div class="alert alert-warning text-sm">请安全保存以下备用恢复码，用于在丢失 2FA 设备时恢复账户访问</div>
        <div class="bg-base-200 rounded-xl p-4 space-y-1 font-mono text-sm">
          <div v-for="code in DUMMY_RECOVERY_CODES" :key="code" class="select-all">{{ code }}</div>
        </div>
        <label class="label cursor-pointer justify-start gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" v-model="savedCodes" />
          <span class="label-text">我已安全保存备用恢复码</span>
        </label>
        <button type="button" class="btn btn-primary w-full" :disabled="!savedCodes" @click="handleRecoveryConfirm">
          完成绑定
        </button>
      </div>
    </template>

    <!-- Recovery code entry (alternative to TOTP) -->
    <template v-else-if="showRecovery">
      <h2 class="text-xl font-semibold text-center mb-4">备用恢复码验证</h2>
      <form @submit.prevent="handleRecoverySubmit" class="space-y-4">
        <div>
          <label class="label pb-1" for="recovery-code">
            <span class="label-text font-medium">输入备用恢复码</span>
          </label>
          <input
            id="recovery-code"
            type="text"
            class="input input-bordered w-full"
            :class="{ 'input-error': recoveryError }"
            v-model="recoveryCode"
            placeholder="格式：AAAA-BBBB-CCCC"
            @input="recoveryError = ''"
          />
          <span v-if="recoveryError" class="label-text-alt text-error">{{ recoveryError }}</span>
        </div>
        <button type="submit" class="btn btn-primary w-full">验证</button>
        <button type="button" class="btn btn-ghost w-full btn-sm" @click="showRecovery = false">返回 TOTP 验证</button>
      </form>
    </template>

    <!-- Normal TOTP verify -->
    <template v-else>
      <h2 class="text-xl font-semibold text-center mb-2">双因素认证</h2>
      <p class="text-sm text-neutral text-center mb-4">请输入 Google Authenticator 中的 6 位验证码</p>
      <div v-if="totpError" class="alert alert-error text-sm mb-4">{{ totpError }}</div>
      <form @submit.prevent="handleTOTPSubmit" class="space-y-4">
        <div>
          <input
            id="totp-code"
            type="text"
            class="input input-bordered w-full text-center text-2xl tracking-widest"
            v-model="totpCode"
            placeholder="000000"
            maxlength="6"
            autocomplete="one-time-code"
            @input="totpError = ''"
          />
          <p class="text-xs text-neutral text-center mt-1">模拟验证码：000000</p>
        </div>
        <label v-if="user?.level !== 'admin'" class="label cursor-pointer justify-center gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" v-model="trustDevice" />
          <span class="label-text text-sm">信任此设备 30 天</span>
        </label>
        <p v-if="user?.level === 'admin'" class="text-xs text-neutral text-center">
          管理员账户每次登录必须进行 2FA 验证
        </p>
        <button type="submit" class="btn btn-primary w-full">验证</button>
      </form>
      <div class="text-center mt-3">
        <button type="button" class="btn btn-ghost btn-sm text-xs" @click="showRecovery = true">
          无法验证 / 丢失设备？使用备用恢复码
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DEMO_ACCOUNTS } from '~/data/demo-accounts';
import { useAuth } from '~/composables/useAuth';

const props = defineProps<{
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}>();

const DUMMY_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const DUMMY_RECOVERY_CODES = ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF', 'GGGG-HHHH-IIII', 'JJJJ-KKKK-LLLL'];

const { state } = useAuth();
const user = computed(() => DEMO_ACCOUNTS.find((u) => u.id === state.tempSession?.userId));

const isSetupFlow = computed(() => state.flow === '2fa_setup_required');

// TOTP
const totpCode = ref('');
const totpAttempts = ref(0);
const totpError = ref('');
const trustDevice = ref(false);
const showRecovery = ref(false);
const recoveryCode = ref('');
const recoveryError = ref('');

// Setup
const setupStep = ref<'scan' | 'recovery'>(isSetupFlow.value ? 'scan' : 'recovery');
const setupCode = ref('');
const setupError = ref('');
const savedCodes = ref(false);
const showSecret = ref(false);

function handleTOTPSubmit() {
  totpError.value = '';
  if (!/^\d{6}$/.test(totpCode.value)) {
    totpError.value = '请输入 6 位数字验证码';
    return;
  }
  totpAttempts.value++;
  if (totpCode.value === '000000' || totpCode.value === '123456') {
    state.flow = '2fa_required'; // simulate 2FA_PASSED
    if (trustDevice.value && user.value?.level !== 'admin') {
      state.trustedUntil = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }
    state.isLoggedIn = true;
    state.user = user.value!;
    state.flow = 'logged_in';
    state.tempSession = null;
    state.passwordAttempts = 0;
    state.lockedUntil = null;
    props.onSuccess('验证通过，登录成功');
  } else if (totpAttempts.value >= 3) {
    totpError.value = '验证码错误次数过多，请使用备用恢复码';
  } else {
    totpError.value = `验证码错误，剩余重试 ${3 - totpAttempts.value} 次`;
  }
}

function handleRecoverySubmit() {
  recoveryError.value = '';
  if (DUMMY_RECOVERY_CODES.some((c) => c === recoveryCode.value.toUpperCase().trim())) {
    state.isLoggedIn = true;
    state.user = user.value!;
    state.flow = 'logged_in';
    state.tempSession = null;
    state.passwordAttempts = 0;
    state.lockedUntil = null;
    props.onSuccess('恢复码验证通过，登录成功。请在设置中重新绑定 2FA。');
  } else {
    recoveryError.value = '恢复码无效，请重试';
  }
}

function handleSetupVerify() {
  if (!/^\d{6}$/.test(setupCode.value)) {
    setupError.value = '请输入 6 位数字验证码';
    return;
  }
  if (setupCode.value === '000000' || setupCode.value === '123456') {
    setupStep.value = 'recovery';
  } else {
    setupError.value = '验证码错误，请重试';
  }
}

function handleRecoveryConfirm() {
  if (!savedCodes.value) return;
  const updated = { ...user.value!, has2FA: true };
  state.isLoggedIn = true;
  state.user = updated;
  state.flow = 'logged_in';
  state.tempSession = null;
  state.passwordAttempts = 0;
  state.lockedUntil = null;
  props.onSuccess('2FA 绑定完成，登录成功');
}
</script>
