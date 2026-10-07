<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/40 dark:bg-black/70 z-[200] flex items-center justify-center"
      @click.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        class="bg-card-bg rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
      >
        <h3 class="text-lg font-semibold text-deep-text mb-4">
          {{ t(titleKey) }}
        </h3>
        <div class="space-y-2">
          <button
            v-for="reason in reasons"
            :key="reason"
            class="w-full text-left px-4 py-2.5 rounded-lg text-sm text-deep-text hover:bg-surface-3 transition-colors disabled:opacity-50"
            :disabled="submitting"
            @click="submit(reason)"
          >
            {{ reason }}
          </button>
        </div>
        <button
          class="w-full mt-4 px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface-3 transition-colors"
          @click="emit('close')"
        >
          {{ t("community.forum.cancel") }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// 帖子与评论共用同一套举报弹窗：理由列表、登录门槛、提交与失败处理只写一份，
// 两边各写一份的话改文案/加理由必漏一侧。
import { computed, ref } from "vue";
import { t } from "~/lib/i18n";
import { contentApi, type ReportTargetType } from "~/lib/api/modules/content";
import { useAuthStore } from "~/stores/auth";
import { dispatchOpenLoginModal } from "~/features/shell/common/shell-events";
import { reportInteractionFailure } from "~/features/forum/interaction-feedback";

const props = defineProps<{
  open: boolean;
  targetType: ReportTargetType;
  targetId: string;
}>();

const emit = defineEmits<{ close: []; submitted: [reason: string] }>();

const auth = useAuthStore();
const submitting = ref(false);

const titleKey = computed(() =>
  props.targetType === "comment"
    ? "community.forum.reportCommentTitle"
    : "community.forum.reportTitle",
);

const reasons = computed(() => [
  t("community.forum.reportSpam"),
  t("community.forum.reportMisinformation"),
  t("community.forum.reportHarassment"),
  t("community.forum.reportInfringement"),
  t("community.forum.reportOther"),
]);

async function submit(reason: string): Promise<void> {
  if (submitting.value) return;
  // 举报只要求登录（后端不挂权限点，见 content/router.py 的说明）：本地账户也该能举报违规内容
  if (!auth.isLoggedIn) {
    emit("close");
    dispatchOpenLoginModal();
    return;
  }
  submitting.value = true;
  const res = await contentApi.reportItem({
    target_type: props.targetType,
    target_id: props.targetId,
    reason,
  });
  submitting.value = false;
  if (res.isErr()) {
    reportInteractionFailure(res.error);
    return;
  }
  emit("close");
  emit("submitted", reason);
}
</script>
