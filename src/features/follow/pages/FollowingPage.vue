<script setup lang="ts">
// FollowingPage.vue — 我的关注（用户 + 版块），可取消关注。
import { ref, onMounted } from "vue";
import { followApi } from "~/lib/api";
import { t } from "~/lib/i18n";
import FollowButton from "../components/FollowButton.vue";

const users = ref<
  Array<{ user_id: number; display_name: string; avatar: string | null }>
>([]);
const boards = ref<Array<{ board_id: number; title: string }>>([]);
const loading = ref(true);
const error = ref("");

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  const [uRes, bRes] = await Promise.all([
    followApi.myFollowingUsers(),
    followApi.myFollowingBoards(),
  ]);
  if (uRes.isOk()) users.value = uRes.value.items;
  else error.value = uRes.error.message;
  if (bRes.isOk()) boards.value = bRes.value.items;
  else if (!error.value) error.value = bRes.error.message;
  loading.value = false;
}

onMounted(() => void load());
</script>

<template>
  <div class="space-y-8">
    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

    <section>
      <h2 class="text-lg font-semibold text-deep-text mb-3">
        {{ t("follow.followingUsers", { count: users.length }) }}
      </h2>
      <div v-if="loading" class="text-sm text-text-muted">
        {{ t("common.loading") }}
      </div>
      <div v-else-if="users.length === 0" class="text-sm text-text-muted">
        {{ t("follow.emptyUsers") }}
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="u in users"
          :key="u.user_id"
          class="flex items-center justify-between p-3 rounded-lg bg-card-bg border border-surface-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <img
              v-if="u.avatar"
              :src="u.avatar"
              :alt="u.display_name"
              class="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <div
              v-else
              class="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-text-muted text-sm shrink-0"
            >
              {{ u.display_name.slice(0, 1) }}
            </div>
            <span class="font-medium text-deep-text truncate">
              {{ u.display_name }}
            </span>
          </div>
          <FollowButton target-type="user" :target-id="u.user_id" />
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-lg font-semibold text-deep-text mb-3">
        {{ t("follow.followingBoards", { count: boards.length }) }}
      </h2>
      <div v-if="loading" class="text-sm text-text-muted">
        {{ t("common.loading") }}
      </div>
      <div v-else-if="boards.length === 0" class="text-sm text-text-muted">
        {{ t("follow.emptyBoards") }}
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="b in boards"
          :key="b.board_id"
          class="flex items-center justify-between p-3 rounded-lg bg-card-bg border border-surface-3"
        >
          <span class="font-medium text-deep-text">{{ b.title }}</span>
          <FollowButton target-type="board" :target-id="b.board_id" />
        </li>
      </ul>
    </section>
  </div>
</template>
