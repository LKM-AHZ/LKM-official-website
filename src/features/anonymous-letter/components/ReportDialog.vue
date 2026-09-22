<template>
  <!-- 违规内容举报弹窗 -->
  <div
    v-if="modelValue"
    class="dialog-overlay"
    @click.self="$emit('update:modelValue', false)"
  >
    <div class="dialog glass">
      <h2>{{ t("treehole.report.title") }}</h2>
      <div class="report">
        <p class="report-target">
          {{ t("treehole.report.targetLabel") }}<b>{{ target }}</b>
        </p>
        <div class="report-reasons">
          <button
            v-for="r in reasons"
            :key="r"
            class="chip"
            :class="{ active: selected === r }"
            @click="selected = r"
          >
            {{ r }}
          </button>
        </div>
        <textarea
          v-model="detail"
          rows="3"
          :placeholder="t('treehole.report.detailPlaceholder')"
          class="report-textarea"
        />
      </div>
      <div class="dialog-footer">
        <button class="chip" @click="$emit('update:modelValue', false)">
          {{ t("treehole.report.cancel") }}
        </button>
        <button class="btn-grad" :disabled="!selected" @click="submit">
          {{ t("treehole.report.submit") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { addReported } from "../stores/storage";
import { t } from "~/lib/i18n";

const props = defineProps({
  modelValue: Boolean,
  target: { type: String, default: () => t("treehole.report.defaultTarget") },
  targetId: { type: String, default: "" },
  targetType: { type: String, default: "letter" },
});
const emit = defineEmits(["update:modelValue", "reported"]);

const reasons = computed(() => [
  t("treehole.report.reasonPorn"),
  t("treehole.report.reasonViolence"),
  t("treehole.report.reasonAbuse"),
  t("treehole.report.reasonSpam"),
  t("treehole.report.reasonOther"),
]);
const selected = ref("");
const detail = ref("");

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      selected.value = "";
      detail.value = "";
    }
  },
);

function submit() {
  // 调用方漏绑 :target-id 时不得写入空 id 的举报记录（required 只校验「传了」，挡不住空串）
  if (!props.targetId) return;
  addReported(props.targetId);
  emit("reported");
  emit("update:modelValue", false);
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--mask);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.dialog {
  padding: 24px;
  border-radius: var(--radius);
  max-width: 420px;
  width: 92vw;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}
.dialog h2 {
  font-size: 18px;
  margin: 0 0 14px;
}
.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
.report-target {
  font-size: 13px;
  color: var(--text-sub);
  margin: 0 0 12px;
}
.report-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.report-textarea {
  width: 100%;
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text-main);
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}
.report-textarea:focus {
  outline: none;
  border-color: var(--accent);
}
</style>
