<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-deep-text">
      {{ t("community.forum.comments", { count: comments.length }) }}
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
            :disabled="!newComment.trim()"
            :class="!newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''"
            @click="submitComment"
          >
            {{ t("community.forum.submitComment") }}
          </button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="comments.length > 0" class="space-y-3">
      <div v-for="comment in comments" :key="comment.id" class="flex gap-3">
        <div
          class="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center shrink-0 text-text-muted font-bold text-sm"
        >
          {{ comment.authorName.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium text-deep-text">{{
              comment.authorName
            }}</span>
            <span class="text-xs text-text-muted/60"
              >#{{ comment.floorNumber }}</span
            >
            <span class="text-xs text-text-muted/60">{{
              formatTime(comment.createdAt)
            }}</span>
            <!-- 回复目标：parentId 从提交起就有，但此前模板是扁平列表、被回复者不可见 -->
            <span
              v-if="parentAuthor(comment)"
              class="text-xs text-text-muted/60"
            >
              {{
                t("community.forum.replyTo", { name: parentAuthor(comment) })
              }}
            </span>
          </div>
          <p class="text-sm text-deep-text mt-1 leading-relaxed">
            {{ comment.content }}
          </p>
          <div class="flex items-center gap-3 mt-1.5">
            <button
              class="text-xs text-text-muted/60 hover:text-primary transition-colors inline-flex items-center gap-1"
              @click="toggleCommentLike(comment.id)"
            >
              <Icon
                :icon="
                  likedComments.has(comment.id)
                    ? 'material-symbols:favorite'
                    : 'material-symbols:favorite-outline'
                "
                class="w-3.5 h-3.5"
                :class="likedComments.has(comment.id) ? 'text-red-500' : ''"
              />
              {{ likeCountFor(comment) }}
            </button>
            <button
              class="text-xs text-text-muted/60 hover:text-primary transition-colors"
              @click="startReply(comment.id, comment.authorName)"
            >
              {{ t("community.forum.reply") }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-8 text-sm text-text-muted">
      {{ t("community.forum.noComments") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";

defineProps<{
  postId: string;
}>();

interface Comment {
  id: string;
  authorName: string;
  content: string;
  floorNumber: number;
  parentId?: string;
  likeCount: number;
  createdAt: string;
}

// 评论初始为空，待接入真实评论接口后加载
const comments = ref<Comment[]>([]);
const likedComments = ref<Set<string>>(new Set());

const newComment = ref("");
const replyToId = ref("");
const replyToAuthor = ref("");
// 本组件输入框的模板引用（回复时只聚焦它，不碰页面上别的 textarea）
const commentInputEl = ref<HTMLTextAreaElement | null>(null);
// 回复聚焦的定时器句柄：重复点回复/卸载时要能清掉
let focusTimer: number | null = null;

// 点赞数展示值：liked 时 +1（本地乐观态，未持久化），0 也要显示 "0" 而不是空串
function likeCountFor(comment: Comment): number {
  return (
    (comment.likeCount ?? 0) + (likedComments.value.has(comment.id) ? 1 : 0)
  );
}

// 被回复者：本地列表里能找到父评论时显示（跨页父评论不在本地则不显示）
function parentAuthor(comment: Comment): string {
  if (!comment.parentId) return "";
  return (
    comments.value.find((c) => c.id === comment.parentId)?.authorName ?? ""
  );
}

function submitComment() {
  if (!newComment.value.trim()) return;
  const newId = `c-new-${Date.now()}`;
  // 楼层取现有最大值 +1：数组长度在分页/删除/乱序加载下并不等于楼层
  const floor =
    comments.value.reduce((max, c) => Math.max(max, c.floorNumber), 0) + 1;
  comments.value.push({
    id: newId,
    authorName: t("community.forum.me"),
    content: newComment.value.trim(),
    floorNumber: floor,
    parentId: replyToId.value || undefined,
    likeCount: 0,
    createdAt: new Date().toISOString(),
  });
  newComment.value = "";
  replyToId.value = "";
  replyToAuthor.value = "";
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

function toggleCommentLike(id: string) {
  // ref(new Set()) 本身是响应式的：add/delete 就会触发模板更新，重建 Set 只是多分配对象
  if (likedComments.value.has(id)) {
    likedComments.value.delete(id);
  } else {
    likedComments.value.add(id);
  }
  // 说明：点赞目前只存在本地内存，未持久化到后端——论坛旧 REST/GraphQL 数据层已移除
  // （见 features/forum/index.ts 顶部注释），要真正落库需先有对应的 content API 契约。
}

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
