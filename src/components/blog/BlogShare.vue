<template>
  <div class="relative flex items-center gap-1.5">
    <dialog ref="wechatDialog" class="modal" @close="showWechatQR = false">
      <div class="modal-box max-w-xs text-center">
        <p class="text-sm font-medium mb-3">微信扫一扫分享</p>
        <div ref="qrContainer" class="bg-white rounded-xl p-2 mx-auto mb-3 inline-block" />
        <p class="text-xs text-base-content/50 mb-3">打开微信"扫一扫"，扫描二维码分享文章</p>
        <div class="modal-action mt-0 justify-center">
          <form method="dialog">
            <button class="btn btn-sm btn-outline">关闭</button>
          </form>
        </div>
      </div>
    </dialog>

    <Transition name="toast">
      <span
        v-if="showCopiedToast"
        class="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-base-content text-base-100 text-xs rounded-full whitespace-nowrap shadow-lg"
      >
        已复制链接
      </span>
    </Transition>

    <span class="text-xs font-bold text-base-content/60 mr-1">分享</span>

    <button
      class="share-btn p-1.5 rounded-full transition-colors hover:bg-green-50 hover:text-green-500 text-base-content/60"
      title="分享到微信"
      aria-label="分享到微信"
      @click="shareToWechat"
    >
      <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.33.33 0 0 0 .167-.054l1.903-1.114a.86.86 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.159 4.927c-3.579 0-6.364 2.396-6.364 5.42 0 3.025 2.785 5.42 6.364 5.42.619 0 1.226-.074 1.798-.21a.41.41 0 0 1 .296.04l1.58.917a.18.18 0 0 0 .086.03c.1 0 .173-.08.173-.18a.3.3 0 0 0-.03-.13l-.311-1.17a.41.41 0 0 1 .123-.431C20.3 19.479 22 17.987 22 16.291c0-2.964-2.624-5.373-6.243-5.373zm-2.505 2.548c.476 0 .861.392.861.875a.868.868 0 0 1-.861.874.868.868 0 0 1-.861-.874c0-.483.385-.875.861-.875zm5.009 0c.476 0 .861.392.861.875a.868.868 0 0 1-.861.874.868.868 0 0 1-.861-.874c0-.483.385-.875.861-.875z"
        />
      </svg>
    </button>

    <button
      class="share-btn p-1.5 rounded-full transition-colors hover:bg-blue-50 hover:text-blue-500 text-base-content/60"
      title="分享到 QQ"
      aria-label="分享到 QQ"
      @click="shareToQQ"
    >
      <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 1.978 1.69 3.108 3.568 3.108.41 0 .823-.064 1.234-.194a5.12 5.12 0 0 0 2.349.698 4.58 4.58 0 0 0 2.605-.698c.411.13.822.194 1.232.194 1.877 0 3.568-1.13 3.568-3.108 0-2.514-2.005-6.954-2.005-6.954V9.325C18.1 3.364 14.267 2 12.003 2z"
        />
      </svg>
    </button>

    <button
      class="share-btn p-1.5 rounded-full transition-colors hover:bg-red-50 hover:text-red-500 text-base-content/60"
      title="分享到微博"
      aria-label="分享到微博"
      @click="shareToWeibo"
    >
      <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zm-3.965-4.158c-.168 1.227.847 2.348 2.264 2.499 1.422.153 2.705-.628 2.87-1.854.16-1.229-.855-2.346-2.276-2.498-1.414-.155-2.692.625-2.858 1.853zm4.527-1.742c-1.671-.187-3.258.726-3.547 2.038-.29 1.315.626 2.58 2.042 2.83 1.413.251 2.835-.592 3.18-1.962.344-1.366-.472-2.659-1.675-2.906zm1.671-5.06c-5.235-1.296-11.51 1.193-11.366 5.67.03.958.304 1.844.764 2.611-.59-.344-1.06-.848-1.358-1.457-.747-1.526-.28-3.449.877-4.813 1.158-1.361 2.944-2.247 4.787-2.57 1.839-.325 3.582-.118 4.735.526.582-.446 1.143-.525 1.561.033zM20.954.136c-.9.781-1.58 2.333-1.691 3.452-.058.595-.036 1.176.076 1.52.112.344.357.553.684.553.316 0 .541-.182.646-.526.101-.341.122-.788.106-1.176-.02-.505.029-1.011.191-1.36.16-.347.41-.546.73-.546.335 0 .565.19.672.526.107.332.123.773.103 1.18-.022.481-.058.994-.168 1.414-.11.42-.23.734-.278.968 0 0 1.504-.133 2.11-2.24.23-.798.213-1.829-.039-2.627C23.812.332 22.973-.145 22.28.04c-.688.189-1.114.76-1.326.096z"
        />
      </svg>
    </button>

    <button
      class="share-btn p-1.5 rounded-full transition-colors hover:bg-base-300 text-base-content/60 hover:text-base-content"
      title="复制链接"
      aria-label="复制文章链接"
      @click="copyLink"
    >
      <svg
        class="w-4.5 h-4.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>

    <button
      v-if="supportsWebShare"
      class="share-btn p-1.5 rounded-full transition-colors hover:bg-base-300 text-base-content/60 hover:text-base-content"
      title="更多分享方式"
      aria-label="更多分享方式"
      @click="shareNative"
    >
      <svg
        class="w-4.5 h-4.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick, watch } from 'vue';

const props = defineProps<{
  url: string;
  title: string;
  description?: string;
}>();

const showWechatQR = ref(false);
const showCopiedToast = ref(false);
const qrContainer = ref<HTMLElement | null>(null);
const wechatDialog = ref<HTMLDialogElement | null>(null);

const supportsWebShare = typeof navigator !== 'undefined' && !!navigator.share;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

watch(showWechatQR, async (val) => {
  if (val && wechatDialog.value) {
    wechatDialog.value.showModal();
    await nextTick();
    if (qrContainer.value) {
      loadQRCode();
    }
  }
});

function shareToWechat() {
  showWechatQR.value = true;
}

function closeWechatModal() {
  showWechatQR.value = false;
  wechatDialog.value?.close();
}

function encodeURL(value: string) {
  return encodeURIComponent(value);
}

async function loadQRCode() {
  if (!qrContainer.value) return;
  try {
    const QRCode = await import('qrcode');
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, props.url, {
      width: 180,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    qrContainer.value.innerHTML = '';
    qrContainer.value.appendChild(canvas);
  } catch {
    if (qrContainer.value) {
      qrContainer.value.innerHTML = '<p class="text-sm text-base-content/50">二维码加载失败</p>';
    }
  }
}

function shareToPlatform(platformUrl: string) {
  window.open(platformUrl, '_blank', 'width=600,height=500');
}

function shareToQQ() {
  shareToPlatform(
    `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURL(props.url)}&title=${encodeURL(props.title)}`
  );
}

function shareToWeibo() {
  shareToPlatform(
    `https://service.weibo.com/share/share.php?url=${encodeURL(props.url)}&title=${encodeURL(props.title)}`
  );
}

function shareNative() {
  if (navigator.share) {
    navigator
      .share({
        url: props.url,
        title: props.title,
        text: props.description || props.title,
      })
      .catch(() => {});
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = props.url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  showCopiedToast.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    showCopiedToast.value = false;
    toastTimer = null;
  }, 2000);
}

onUnmounted(() => {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  wechatDialog.value?.close();
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px);
}

.share-btn {
  position: relative;
}
.share-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  transition: transform 0.15s ease;
}
.share-btn:active::after {
  transform: scale(0.85);
}
</style>
