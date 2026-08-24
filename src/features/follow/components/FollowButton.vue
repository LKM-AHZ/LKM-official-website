<script setup lang="ts">
// FollowButton.vue — 复用关注按钮（用户/版块）。
// 登录态读取 followStatus 决定初态；切换调用 followApi；401 时 onMounted 静默跳过。
import { ref, onMounted, computed } from "vue";
import { followApi } from "~/lib/api";
import { useAuthStore } from "~/stores/auth";
import { t } from "~/lib/i18n";

const props = defineProps<{
  targetType: "user" | "board";
  targetId: number;
  variant?: "primary" | "ghost";
}>();

const auth = useAuthStore();
const isLoggedIn = computed(() => auth.isLoggedIn);
const following = ref(false);
const loading = ref(false);

async function apply(): Promise<void> {
  if (!isLoggedIn.value) return;
  const res = await followApi.followStatus(props.targetId);
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

onMounted(() => void apply());
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
