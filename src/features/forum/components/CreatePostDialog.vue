<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/40 dark:bg-black/70 z-[150] flex items-start justify-center pt-12 overflow-y-auto"
      @click.self="close"
    >
      <div
        class="bg-card-bg rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-12"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-surface-3"
        >
          <h2 class="text-lg font-semibold text-deep-text">
            {{ t("community.forum.createPostTitle") }}
          </h2>
          <button
            class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-3"
            @click="close"
          >
            <Icon icon="material-symbols:close" class="w-5 h-5" />
          </button>
        </div>

        <!-- Form -->
        <div class="px-6 py-4 space-y-4">
          <!-- 选择板块 -->
          <div>
            <label class="block text-sm font-medium text-deep-text mb-1.5">{{
              t("community.forum.categoryLabel")
            }}</label>
            <select
              v-model="selectedCategory"
              class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">
                {{ t("community.forum.selectCategory") }}
              </option>
              <optgroup
                v-for="root in rootBoards"
                :key="root.id"
                :label="root.title"
              >
                <option
                  v-for="child in childrenOf(root.id)"
                  :key="child.id"
                  :value="child.id"
                >
                  {{ child.title }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- 标题 -->
          <div>
            <label class="block text-sm font-medium text-deep-text mb-1.5">{{
              t("community.forum.titleLabel")
            }}</label>
            <input
              v-model="title"
              type="text"
              class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              :placeholder="t('community.forum.titlePlaceholder')"
              maxlength="100"
            />
          </div>

          <!-- 标签 -->
          <div>
            <label class="block text-sm font-medium text-deep-text mb-1.5">{{
              t("community.forum.tagsLabel")
            }}</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <span
                v-for="(tag, i) in tags"
                :key="i"
                class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {{ tag }}
                <button class="hover:text-red-500" @click="tags.splice(i, 1)">
                  &times;
                </button>
              </span>
            </div>
            <input
              v-model="tagInput"
              type="text"
              class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              :placeholder="t('community.forum.tagsPlaceholder')"
              @keydown.enter.prevent="addTag"
            />
          </div>

          <!-- 正文 -->
          <div>
            <label class="block text-sm font-medium text-deep-text mb-1.5">{{
              t("community.forum.bodyLabel")
            }}</label>
            <textarea
              v-model="content"
              rows="10"
              class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none font-mono"
              :placeholder="t('community.forum.bodyPlaceholder')"
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between px-6 py-4 border-t border-surface-3"
        >
          <div class="text-xs text-text-muted/60">
            {{ t("community.forum.markdownHint") }}
          </div>
          <div class="flex gap-2">
            <button
              class="btn-ghost px-4 py-2 rounded-lg text-sm"
              @click="close"
            >
              {{ t("community.forum.cancel") }}
            </button>
            <button
              class="btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
              :disabled="!canSubmit"
              :class="!canSubmit ? 'opacity-50 cursor-not-allowed' : ''"
              @click="submit"
            >
              {{ t("community.forum.publish") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { contentApi, type BoardItem } from "~/lib/api/modules/content";
import { useAuthStore } from "~/stores/auth";
import { t } from "~/lib/i18n";

const visible = ref(false);
const selectedCategory = ref("");
const title = ref("");
const content = ref("");
const tags = ref<string[]>([]);
const tagInput = ref("");
const submitting = ref(false);

const auth = useAuthStore();
const boards = ref<BoardItem[]>([]);

const canSubmit = computed(
  () =>
    selectedCategory.value &&
    title.value.trim() &&
    content.value.trim() &&
    !submitting.value,
);

const rootBoards = computed(() =>
  boards.value.filter((b) => b.parent_id == null),
);
function childrenOf(parentId: number): BoardItem[] {
  return boards.value.filter((b) => b.parent_id === parentId);
}

function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag);
  }
  tagInput.value = "";
}

async function open() {
  const res = await contentApi.listBoards();
  if (res.isOk()) {
    boards.value = res.value?.items ?? [];
  }
  visible.value = true;
}

function close() {
  if (!submitting.value) visible.value = false;
}

async function submit() {
  if (!canSubmit.value) return;
  if (!auth.isLoggedIn) {
    alert(t("community.forum.loginRequired"));
    return;
  }
  submitting.value = true;
  const res = await contentApi.createItem({
    content_type: "discussion",
    board_id: Number(selectedCategory.value),
    title: title.value.trim(),
    content: content.value.trim(),
    tags: tags.value,
  });
  submitting.value = false;
  if (res.isOk()) {
    // 重置表单
    selectedCategory.value = "";
    title.value = "";
    content.value = "";
    tags.value = [];
    tagInput.value = "";
    visible.value = false;
    window.location.href = `/forum/post/${res.value.id}`;
  } else {
    alert(t("community.forum.publishFailed"));
  }
}

// 监听全局事件：SSR 页面静态"发帖"按钮 dispatch('lkm:open-create-post') 打开弹窗
onMounted(() => {
  window.addEventListener("lkm:open-create-post", open);
});
onBeforeUnmount(() => {
  window.removeEventListener("lkm:open-create-post", open);
});

defineExpose({ open, close });
</script>
