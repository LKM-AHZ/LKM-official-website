<template>
  <div
    class="flex items-center gap-1 border-t border-surface-3 bg-card-bg/95 backdrop-blur-sm px-2 py-2"
  >
    <button
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-3 disabled:opacity-60"
      :class="liked ? 'text-red-500' : 'text-text-muted'"
      :disabled="likePending"
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
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-3 disabled:opacity-60"
      :class="bookmarked ? 'text-amber-500' : 'text-text-muted'"
      :disabled="bookmarkPending"
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

    <!-- 举报弹窗（与评论区共用同一组件） -->
    <ReportDialog
      :open="showReport"
      target-type="post"
      :target-id="postId"
      @close="showReport = false"
      @submitted="onReported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import { contentApi } from "~/lib/api/modules/content";
import { interactionApi } from "~/lib/api/modules/interaction";
import { useAuthStore } from "~/stores/auth";
import { dispatchOpenLoginModal } from "~/features/shell/common/shell-events";
import { reportInteractionFailure } from "~/features/forum/interaction-feedback";
import ReportDialog from "~/features/forum/components/ReportDialog.vue";

const props = withDefaults(
  defineProps<{
    postId: string;
    likeCount: number;
    bookmarkCount: number;
    forwardCount: number;
    /** 当前用户是否已点赞/已收藏（由父级或后端回填）；缺省 false */
    liked?: boolean;
    bookmarked?: boolean;
  }>(),
  { liked: false, bookmarked: false },
);

const auth = useAuthStore();
const isLoggedIn = computed(() => auth.isLoggedIn);

const liked = ref(props.liked);
const bookmarked = ref(props.bookmarked);
const showReport = ref(false);

const likeCount = ref(props.likeCount);
const bookmarkCount = ref(props.bookmarkCount);
const forwardCount = ref(props.forwardCount);
// 写入去重：连点两下不该发两次请求（第二次会以同一意图再翻一次状态）
const likePending = ref(false);
const bookmarkPending = ref(false);

onMounted(() => auth.restoreFromStorage());

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

// 页面 SSR 时拿不到登录态（后端只认 Authorization 头，SSR 只转发 Cookie），
// 故「当前用户是否已赞/已藏」必须在客户端补拉——否则刷新后按钮永远显示未赞未藏。
// 与 FollowButton.vue 同款：登录态变化也重拉（未登录→登录后立刻纠正初值）。
let viewerSeq = 0;
async function loadViewerState(): Promise<void> {
  const id = props.postId;
  const seq = ++viewerSeq;
  const res = await contentApi.getViewerState(id);
  // 过期响应丢弃：切帖子后返回的旧结果会把上一个帖子的互动态写到当前按钮上
  if (seq !== viewerSeq || props.postId !== id) return;
  // 拉失败时保持现状（沿用 props/本地值），不假装成「未点赞」——
  // 写操作仍以服务端返回为准，下一次挂载会再纠正
  if (res.isErr()) return;
  liked.value = res.value.liked;
  bookmarked.value = res.value.favorited;
  likeCount.value = res.value.like_count;
  bookmarkCount.value = res.value.bookmark_count;
}

watch([() => props.postId, isLoggedIn], () => void loadViewerState(), {
  immediate: true,
});

/** 下界保护：服务端计数为 0 但本地态是「已赞」时，取消会算出 -1 并直接渲染出来 */
function applyLike(value: boolean, count: number): void {
  liked.value = value;
  likeCount.value = Math.max(0, count);
}

function applyBookmark(value: boolean, count: number): void {
  bookmarked.value = value;
  bookmarkCount.value = Math.max(0, count);
}

async function toggleLike(): Promise<void> {
  if (!isLoggedIn.value) {
    dispatchOpenLoginModal();
    return;
  }
  if (likePending.value) return;
  const next = !liked.value;
  const before = likeCount.value;
  likePending.value = true;
  applyLike(next, before + (next ? 1 : -1)); // 乐观
  const res = next
    ? await contentApi.likeItem(props.postId)
    : await contentApi.unlikeItem(props.postId);
  likePending.value = false;
  if (res.isErr()) {
    applyLike(!next, before); // 回滚：本地不能停在错的颜色/计数上
    reportInteractionFailure(res.error);
    return;
  }
  // 用服务端权威计数校正：重复点赞是幂等的，本地 +1 可能与真实值差 1
  applyLike(next, res.value.like_count);
}

async function toggleBookmark(): Promise<void> {
  if (!isLoggedIn.value) {
    dispatchOpenLoginModal();
    return;
  }
  if (bookmarkPending.value) return;
  const next = !bookmarked.value;
  const before = bookmarkCount.value;
  bookmarkPending.value = true;
  applyBookmark(next, before + (next ? 1 : -1)); // 乐观
  const res = next
    ? await interactionApi.favorite(props.postId)
    : await interactionApi.unfavorite(props.postId);
  bookmarkPending.value = false;
  if (res.isErr()) {
    applyBookmark(!next, before); // 回滚
    reportInteractionFailure(res.error);
    return;
  }
  // 收藏接口回带权威态与计数，直接采用（不靠本地推算）
  applyBookmark(res.value.favorited, res.value.bookmark_count);
}

function handleShare(): void {
  // 非安全上下文（http/旧浏览器）下 navigator.clipboard 是 undefined，直接调用会抛 TypeError
  if (!navigator.clipboard) {
    alert(t("community.forum.linkCopied"));
    return;
  }
  // window.location.href 即帖子详情页地址（本组件只在该页使用）
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => {
      alert(t("community.forum.linkCopied"));
      void reportForward();
    })
    .catch((err) => {
      console.warn("[PostInteractions] 复制链接失败:", err);
      alert(t("messages.operationFailed"));
    });
}

/**
 * 转发上报：只在链接真的复制成功后才调，返回的服务端计数用来校正显示。
 *
 * 失败**刻意不提示**（连 403 也不弹）：用户要的动作（复制链接）已经成功并已弹过提示，
 * 为一个后台计数再报一次错只会让人以为复制失败了。失败时保留原计数、不本地自增，
 * 显示与服务端真值因此不会脱节。未登录直接跳过——复制链接不该要求登录。
 */
async function reportForward(): Promise<void> {
  if (!isLoggedIn.value) return;
  const res = await contentApi.forwardItem(props.postId);
  if (res.isErr()) {
    console.warn("[PostInteractions] 转发上报失败:", res.error);
    return;
  }
  forwardCount.value = res.value.forward_count;
}

function onReported(reason: string): void {
  alert(t("community.forum.reportSubmitted", { reason }));
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
</script>
