<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import { buildUrl } from "~/lib/utils/paths";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });
const isOpen = ref(false);
const keyword = ref("");
const input = ref<HTMLInputElement | null>(null);

async function open() {
  isOpen.value = true;
  await nextTick();
  input.value?.focus();
}
function close() {
  isOpen.value = false;
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") close();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    open();
  }
}
function submit() {
  const q = keyword.value.trim();
  if (!q) return;
  window.location.href = `${buildUrl("/search")}?q=${encodeURIComponent(q)}`;
}
onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <button
    type="button"
    :aria-label="t('common.search')"
    class="flex h-11 w-11 items-center justify-center gap-2 rounded-full text-text-muted transition-colors hover:bg-btn-plain-bg-hover hover:text-deep-text focus-visible:outline-2 focus-visible:outline-primary xl:w-44 xl:justify-start xl:bg-base-200 xl:px-4"
    @click="open"
  >
    <Icon icon="material-symbols:search" class="text-[1.25rem]" />
    <span class="hidden text-sm font-medium xl:inline">{{
      t("common.search")
    }}</span>
    <span
      v-if="compact"
      class="ml-auto hidden text-xs text-text-muted 2xl:inline"
      >⌘/Ctrl K</span
    >
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex justify-center bg-black/40 px-4 pt-24"
      role="presentation"
      @click.self="close"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="全站搜索"
        class="h-fit w-full max-w-xl rounded-2xl border border-surface-3 bg-card-bg p-5 shadow-2xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <strong class="text-lg text-deep-text">搜索理科迷</strong>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-sm text-text-muted hover:text-deep-text"
            @click="close"
          >
            关闭
          </button>
        </div>
        <form class="flex gap-2" @submit.prevent="submit">
          <label for="global-search-input" class="sr-only">搜索关键词</label>
          <input
            id="global-search-input"
            ref="input"
            v-model="keyword"
            type="search"
            maxlength="200"
            placeholder="搜索帖子、专栏、文件库和题库…"
            class="min-w-0 flex-1 rounded-xl border border-surface-3 bg-page-bg px-4 py-3 text-deep-text outline-none focus:border-primary"
          />
          <button
            type="submit"
            class="rounded-xl bg-primary-action px-5 py-3 text-sm font-bold text-white"
          >
            搜索
          </button>
        </form>
        <p class="mt-3 text-xs text-text-muted">
          按 Ctrl / ⌘ + K 可随时打开搜索
        </p>
      </div>
    </div>
  </Teleport>
</template>
