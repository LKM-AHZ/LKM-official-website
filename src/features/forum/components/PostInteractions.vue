<template>
  <div
    class="flex items-center gap-1 border-t border-surface-3 bg-card-bg/95 backdrop-blur-sm px-2 py-2"
  >
    <button
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-3"
      :class="liked ? 'text-red-500' : 'text-text-muted'"
      @click="toggleLike"
    >
      <Icon
        :icon="
          liked
            ? 'material-symbols:favorite'
            : 'material-symbols:favorite-outline'
        "
        class="w-5 h-5"
      />
      <span>{{ formatCount(likeCount) }}</span>
    </button>

    <button
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-3"
      :class="bookmarked ? 'text-amber-500' : 'text-text-muted'"
      @click="toggleBookmark"
    >
      <Icon
        :icon="
          bookmarked
            ? 'material-symbols:bookmark'
            : 'material-symbols:bookmark-outline'
        "
        class="w-5 h-5"
      />
      <span>{{ formatCount(bookmarkCount) }}</span>
    </button>

    <button
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted transition-colors hover:bg-surface-3"
      @click="handleShare"
    >
      <Icon icon="material-symbols:share-outline" class="w-5 h-5" />
      <span class="hidden sm:inline">{{ formatCount(forwardCount) }}</span>
    </button>

    <button
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted transition-colors hover:bg-surface-3 ml-auto"
      @click="showReport = true"
    >
      <Icon icon="material-symbols:flag-outline" class="w-5 h-5" />
      <span class="hidden sm:inline">{{ t("community.forum.report") }}</span>
    </button>

    <!-- 举报弹窗 -->
    <Teleport to="body">
      <div
        v-if="showReport"
        class="fixed inset-0 bg-black/40 dark:bg-black/70 z-[200] flex items-center justify-center"
        @click.self="showReport = false"
      >
        <div class="bg-card-bg rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
          <h3 class="text-lg font-semibold text-deep-text mb-4">
            {{ t("community.forum.reportTitle") }}
          </h3>
          <div class="space-y-2">
            <button
              v-for="reason in reportReasons"
              :key="reason"
              class="w-full text-left px-4 py-2.5 rounded-lg text-sm text-deep-text hover:bg-surface-3 transition-colors"
              @click="submitReport(reason)"
            >
              {{ reason }}
            </button>
          </div>
          <button
            class="w-full mt-4 px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface-3 transition-colors"
            @click="showReport = false"
          >
            {{ t("community.forum.cancel") }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";

const props = withDefaults(
  defineProps<{
    likeCount: number;
    bookmarkCount: number;
    forwardCount: number;
    /** 当前用户是否已点赞/已收藏（由父级或后端回填）；缺省 false */
    liked?: boolean;
    bookmarked?: boolean;
  }>(),
  { liked: false, bookmarked: false },
);

const liked = ref(props.liked);
const bookmarked = ref(props.bookmarked);
const showReport = ref(false);

const likeCount = ref(props.likeCount);
const bookmarkCount = ref(props.bookmarkCount);
const forwardCount = ref(props.forwardCount);

// 本地态是一次性快照会随源变化而失真（切帖子、后台刷新回填）：
// props 变了就重新同步，服务端真值优先于本地乐观值
watch(
  () => [props.liked, props.bookmarked] as const,
  ([l, b]) => {
    liked.value = l;
    bookmarked.value = b;
  },
);
watch(
  () => [props.likeCount, props.bookmarkCount, props.forwardCount] as const,
  ([l, b, f]) => {
    likeCount.value = l;
    bookmarkCount.value = b;
    forwardCount.value = f;
  },
);

const reportReasons = computed(() => [
  t("community.forum.reportSpam"),
  t("community.forum.reportMisinformation"),
  t("community.forum.reportHarassment"),
  t("community.forum.reportInfringement"),
  t("community.forum.reportOther"),
]);

function toggleLike() {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;
}

function toggleBookmark() {
  bookmarked.value = !bookmarked.value;
  bookmarkCount.value += bookmarked.value ? 1 : -1;
}

function handleShare() {
  // 非安全上下文（http/旧浏览器）下 navigator.clipboard 是 undefined，直接调用会抛 TypeError
  if (!navigator.clipboard) {
    alert(t("community.forum.linkCopied"));
    return;
  }
  // window.location.href 即帖子详情页地址（本组件只在该页使用）；
  // 转发数不再本地 +1：分享没有对应的后端端点上账，本地自增只会让显示与真实数据脱节
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => alert(t("community.forum.linkCopied")))
    .catch((err) => {
      console.warn("[PostInteractions] 复制链接失败:", err);
      alert(t("messages.operationFailed"));
    });
}

function submitReport(reason: string) {
  showReport.value = false;
  alert(t("community.forum.reportSubmitted", { reason }));
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
</script>
