<script setup lang="ts">
// FollowButton.vue — 复用关注按钮（用户/版块）。
// 登录态读取 followStatus 决定初态；切换调用 followApi；401 时 onMounted 静默跳过。
import { ref, watch, computed } from "vue";
import { followApi } from "~/lib/api";
import { useAuthStore } from "~/stores/auth";
import { t } from "~/lib/i18n";

const props = defineProps<{
  targetType: "user" | "board";
  targetId: string;
  variant?: "primary" | "ghost";
}>();

const auth = useAuthStore();
const isLoggedIn = computed(() => auth.isLoggedIn);
const following = ref(false);
const loading = ref(false);

async function apply(): Promise<void> {
  if (!isLoggedIn.value) return;
  // 目标在 await 前固定：请求期间 props 可能已变（列表复用同一组件、切换目标），
  // 过期响应会把上一个目标的关注态写到当前按钮上
  const { targetId, targetType } = props;
  const stale = (): boolean =>
    props.targetId !== targetId || props.targetType !== targetType;

  if (targetType === "board") {
    // followStatus 只有用户维度（/users/{id}/follow/status），拿版块 id 去查必然错/404。
    // 版块初态改用「我关注的版块」列表判断。
    const res = await followApi.myFollowingBoards();
    if (stale()) return;
    if (res.isOk()) {
      following.value = res.value.items.some((b) => b.board_id === targetId);
    }
    return;
  }
  const res = await followApi.followStatus(targetId);
  if (stale()) return;
  if (res.isOk()) following.value = res.value.is_following;
}

async function toggle(): Promise<void> {
  if (!isLoggedIn.value) return;
  loading.value = true;
  const call =
    props.targetType === "user"
      ? following.value
        ? followApi.unfollowUser(props.targetId)
        : followApi.followUser(props.targetId)
      : following.value
        ? followApi.unfollowBoard(props.targetId)
        : followApi.followBoard(props.targetId);
  const res = await call;
  if (res.isOk()) following.value = res.value.following;
  loading.value = false;
}

// 原来只 onMounted 拉一次：列表复用同一组件（key 变化/切换目标）或用户中途登录后，
// 按钮会继续显示上一个目标的关注态；isLoggedIn 一并监听是为了登录后立刻纠正
watch(
  [() => props.targetId, () => props.targetType, isLoggedIn],
  () => void apply(),
  { immediate: true },
);
</script>

<template>
  <button
    type="button"
    :disabled="loading || !isLoggedIn"
    class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    :class="
      following
        ? 'bg-surface-3 text-text-muted hover:bg-surface-3/70'
        : variant === 'primary'
          ? 'bg-primary text-on-primary hover:bg-primary/90'
          : 'bg-card-bg border border-primary/40 text-primary hover:bg-primary/5'
    "
    @click="toggle"
  >
    {{
      loading
        ? t("common.loading")
        : following
          ? t("follow.unfollow")
          : t(isLoggedIn ? "follow.follow" : "follow.loginToFollow")
    }}
  </button>
</template>
