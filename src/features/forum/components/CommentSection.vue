<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-deep-text">
      {{ t("community.forum.comments", { count: total }) }}
    </h3>

    <!-- 评论输入 -->
    <div class="flex gap-3">
      <div
        class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm"
      >
        {{ t("community.forum.me") }}
      </div>
      <div class="flex-1">
        <div
          v-if="replyToId"
          class="text-xs text-primary bg-primary/5 px-3 py-1.5 rounded-lg mb-2 inline-flex items-center gap-1"
        >
          {{ t("community.forum.replyTo", { name: replyToAuthor }) }}
          <button class="ml-1 hover:text-red-500" @click="cancelReply">
            &times;
          </button>
        </div>
        <textarea
          ref="commentInputEl"
          v-model="newComment"
          rows="3"
          class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-colors"
          :placeholder="t('community.forum.commentPlaceholder')"
          @keydown.ctrl.enter="submitComment"
        ></textarea>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-text-muted/60">{{
            t("community.forum.ctrlEnterSend")
          }}</span>
          <button
            type="button"
            class="btn-primary px-4 py-1.5 rounded-lg text-sm font-medium"
            :disabled="!newComment.trim() || submitting"
            :class="
              !newComment.trim() || submitting
                ? 'opacity-50 cursor-not-allowed'
                : ''
            "
            @click="submitComment"
          >
            {{ t("community.forum.submitComment") }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载失败：给出可见提示与重试入口，不静默留白 -->
    <div
      v-if="loadError"
      class="text-center py-8 text-sm text-text-muted space-y-2"
    >
      <p>{{ t("community.forum.loadCommentsFailed") }}</p>
      <button
        type="button"
        class="text-primary hover:underline"
        @click="loadComments(true)"
      >
        {{ t("common.retry") }}
      </button>
    </div>

    <!-- 评论列表 -->
    <template v-else>
      <div v-if="loading" class="text-center py-8 text-sm text-text-muted">
        {{ t("common.loading") }}
      </div>
      <div v-else-if="comments.length > 0" class="space-y-3">
        <div v-for="comment in comments" :key="comment.id" class="flex gap-3">
          <div
            class="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center shrink-0 text-text-muted font-bold text-sm"
          >
            {{ comment.author_name.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-deep-text">{{
                comment.author_name
              }}</span>
              <span class="text-xs text-text-muted/60"
                >#{{ comment.floor_number }}</span
              >
              <span class="text-xs text-text-muted/60">{{
                formatTime(comment.created_at)
              }}</span>
              <!-- 回复目标：parentId 从提交起就有，但此前模板是扁平列表、被回复者不可见 -->
              <span
                v-if="parentAuthor(comment)"
                class="text-xs text-text-muted/60"
              >
                {{
                  t("community.forum.replyTo", {
                    name: parentAuthor(comment),
                  })
                }}
              </span>
            </div>
            <p class="text-sm text-deep-text mt-1 leading-relaxed">
              {{ comment.content }}
            </p>
            <div class="flex items-center gap-3 mt-1.5">
              <button
                class="text-xs text-text-muted/60 hover:text-primary transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                :disabled="likePending.has(comment.id)"
                @click="toggleCommentLike(comment)"
              >
                <Icon
                  :icon="
                    comment.liked
                      ? 'material-symbols:favorite'
                      : 'material-symbols:favorite-outline'
                  "
                  class="w-3.5 h-3.5"
                  :class="comment.liked ? 'text-red-500' : ''"
                />
                {{ comment.like_count }}
              </button>
              <button
                class="text-xs text-text-muted/60 hover:text-primary transition-colors"
                @click="startReply(comment.id, comment.author_name)"
              >
                {{ t("community.forum.reply") }}
              </button>
            </div>
          </div>
        </div>

        <!-- 分页：不加载更多就等于静默少显示评论，故把「还有多少条」摆出来 -->
        <button
          v-if="comments.length < total"
          type="button"
          class="w-full py-2 rounded-lg text-sm text-text-muted hover:bg-surface-3 transition-colors disabled:opacity-50"
          :disabled="loadingMore"
          @click="loadComments(false)"
        >
          {{
            loadingMore
              ? t("common.loading")
              : t("community.forum.loadMoreComments")
          }}
        </button>
      </div>
      <div v-else class="text-center py-8 text-sm text-text-muted">
        {{ t("community.forum.noComments") }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import { contentApi, type ContentComment } from "~/lib/api/modules/content";
import { useAuthStore } from "~/stores/auth";
import { dispatchOpenLoginModal } from "~/features/shell/common/shell-events";
import { reportInteractionFailure } from "~/features/forum/interaction-feedback";

const props = defineProps<{
  postId: string;
}>();

const auth = useAuthStore();
const isLoggedIn = computed(() => auth.isLoggedIn);
onMounted(() => auth.restoreFromStorage());

const PAGE_SIZE = 20;
const PAGE_ONE = 1;

const comments = ref<ContentComment[]>([]);
const total = ref(0);
const page = ref(PAGE_ONE);
const loading = ref(true);
const loadingMore = ref(false);
const loadError = ref(false);
// 在途的评论点赞 id：连点两下不该发两次请求
const likePending = ref<Set<string>>(new Set());

const newComment = ref("");
const submitting = ref(false);
const replyToId = ref("");
const replyToAuthor = ref("");
// 本组件输入框的模板引用（回复时只聚焦它，不碰页面上别的 textarea）
const commentInputEl = ref<HTMLTextAreaElement | null>(null);
// 回复聚焦的定时器句柄：重复点回复/卸载时要能清掉
let focusTimer: number | null = null;

/**
 * 加载评论。
 *
 * ``reset`` 为 true 时从第一页重来（首次挂载 / 失败重试），否则追加下一页。
 * 用 page/total 分页而非一次全量：评论无上限，一次性拉全会在热帖上把响应体撑爆。
 */
async function loadComments(reset: boolean): Promise<void> {
  if (reset) {
    loading.value = true;
    loadError.value = false;
  } else {
    loadingMore.value = true;
  }
  const target = reset ? PAGE_ONE : page.value + 1;
  const res = await contentApi.listComments(props.postId, target, PAGE_SIZE);
  loading.value = false;
  loadingMore.value = false;
  if (res.isErr()) {
    // 失败时保留已加载的评论，只标记错误——把列表清空会让用户以为评论没了
    loadError.value = comments.value.length === 0;
    if (comments.value.length > 0) reportInteractionFailure(res.error);
    return;
  }
  comments.value = reset
    ? res.value.items
    : [...comments.value, ...res.value.items];
  total.value = res.value.total;
  page.value = target;
}

onMounted(() => void loadComments(true));

// 被回复者：本地已加载的列表里能找到父评论时显示（父评论在未加载的页里则不显示）
function parentAuthor(comment: ContentComment): string {
  if (!comment.parent_id) return "";
  return (
    comments.value.find((c) => c.id === comment.parent_id)?.author_name ?? ""
  );
}

async function submitComment(): Promise<void> {
  if (!isLoggedIn.value) {
    dispatchOpenLoginModal();
    return;
  }
  const text = newComment.value.trim();
  if (!text || submitting.value) return;
  submitting.value = true;
  const res = await contentApi.createComment(props.postId, {
    content: text,
    parent_id: replyToId.value || null,
  });
  submitting.value = false;
  if (res.isErr()) {
    reportInteractionFailure(res.error);
    return;
  }
  // 用接口返回的权威行（含真实楼层号与作者名），不本地拼一条——
  // 楼层由后端在行锁下分配，本地推算在并发/软删下会重号
  comments.value.push(res.value);
  total.value += 1;
  newComment.value = "";
  cancelReply();
}

async function toggleCommentLike(comment: ContentComment): Promise<void> {
  if (!isLoggedIn.value) {
    dispatchOpenLoginModal();
    return;
  }
  if (likePending.value.has(comment.id)) return;
  const next = !comment.liked;
  const before = comment.like_count;
  likePending.value.add(comment.id);
  comment.liked = next;
  comment.like_count = Math.max(0, before + (next ? 1 : -1)); // 乐观
  const res = next
    ? await contentApi.likeComment(props.postId, comment.id)
    : await contentApi.unlikeComment(props.postId, comment.id);
  likePending.value.delete(comment.id);
  if (res.isErr()) {
    comment.liked = !next; // 回滚：本地不能停在错的颜色/计数上
    comment.like_count = before;
    reportInteractionFailure(res.error);
    return;
  }
  comment.like_count = res.value.like_count;
}

function startReply(id: string, author: string) {
  replyToId.value = id;
  replyToAuthor.value = author;
  // 只聚焦本组件的输入框：document.querySelector("textarea") 会命中文档里第一个
  // textarea（帖子编辑器、别的评论区、弹窗），把焦点抢到不相干的控件上
  if (focusTimer !== null) window.clearTimeout(focusTimer);
  focusTimer = window.setTimeout(() => {
    focusTimer = null;
    commentInputEl.value?.focus();
  }, 50);
}

function cancelReply() {
  replyToId.value = "";
  replyToAuthor.value = "";
}

onBeforeUnmount(() => {
  // 卸载后定时器再 focus 会碰到已脱离文档的节点（swup 换页时 document 复用，残留定时器
  // 更会跨页触发）
  if (focusTimer !== null) window.clearTimeout(focusTimer);
});

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("community.forum.justNow");
  if (mins < 60) return t("community.forum.minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("community.forum.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("community.forum.daysAgo", { count: days });
}
</script>
