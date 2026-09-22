<template>
  <div class="w-full">
    <div class="flex justify-between gap-2">
      <label class="label pb-1" :for="`${fieldId}-0`">
        <span class="label-text font-medium">{{
          t("auth.twoFactor.code")
        }}</span>
      </label>
      <!-- 测试模式标记仅用于演示，非交互 -->
    </div>
    <div
      class="flex gap-2"
      role="group"
      :aria-describedby="error ? `${fieldId}-error` : undefined"
    >
      <input
        v-for="(v, i) in digits"
        :key="i"
        :id="`${fieldId}-${i}`"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="1"
        class="input input-bordered w-12 h-12 text-center text-lg"
        :class="{ 'input-error': error }"
        :value="v"
        :aria-label="t('auth.twoFactor.digitLabel', { index: i + 1 })"
        :aria-invalid="!!error"
        @input="onInput(i, $event)"
        @keydown.backspace.prevent="onBackspace(i)"
        @paste="onPaste($event)"
      />
    </div>
    <span
      v-if="error"
      :id="`${fieldId}-error`"
      class="label-text-alt text-error"
      >{{ error }}</span
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { t } from "~/lib/i18n";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    error?: string;
    id?: string;
  }>(),
  { modelValue: "" },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "complete"): void;
}>();

// 6 位独立输入槽
const numCells = 6;
const cells = ref<string[]>(Array.from({ length: numCells }, () => ""));

// 每个实例一个唯一 id 前缀：固定用 "verify" 会在同页挂载两次时产生重复 DOM id，
// 而 focusIndex 又是按 id 全局查找的，会聚焦到另一个实例的输入框
const uid = useId();
const fieldId = computed(() => props.id ?? `verify-${uid}`);

// 由外部 modelValue 同步（外部清空/填整串）
watch(
  () => props.modelValue,
  (val) => {
    const next = val ?? "";
    // 与自己刚 emit 出去的值相同就不要再重建 cells：受控父组件回写时会把用户
    // 正在输入的槽位与焦点重置掉
    if (next === joinCells()) return;
    syncFromString(next);
  },
  { immediate: true },
);

const digits = computed(() => cells.value);

function syncFromString(str: string): void {
  // 与 onInput/onPaste 保持同一套清洗规则：只保留数字并截断到槽位数，
  // 否则外部传入 "12 34 56" / "123-456" 会原样落进输入槽，产出非数字验证码
  const digitsOnly = (str ?? "").replace(/\D/g, "").slice(0, numCells);
  cells.value = Array.from({ length: numCells }, (_, i) => digitsOnly[i] ?? "");
}

function joinCells(): string {
  return cells.value.join("");
}

function focusIndex(idx: number): void {
  const el = document.getElementById(
    `${fieldId.value}-${idx}`,
  ) as HTMLInputElement | null;
  if (el) el.focus();
}

function onInput(i: number, e: Event): void {
  // 变量名不要叫 t：会遮蔽 i18n 的 t()
  const inputEl = e.target as HTMLInputElement;
  let value = inputEl.value;
  // 仅保留一位数字
  value = value.replace(/\D/g, "").slice(0, 1);
  cells.value[i] = value;
  if (value && i < numCells - 1) {
    focusIndex(i + 1);
  }
  pushValue();
}

function onBackspace(i: number): void {
  if (cells.value[i]) {
    cells.value[i] = "";
  } else if (i > 0) {
    cells.value[i - 1] = "";
    focusIndex(i - 1);
  }
  pushValue();
}

function onPaste(e: Event): void {
  const clip = (e as ClipboardEvent).clipboardData?.getData("text") ?? "";
  e.preventDefault();
  const code = clip.replace(/\D/g, "").slice(0, numCells);
  if (code) {
    syncFromString(code);
    const last = Math.min(code.length, numCells) - 1;
    focusIndex(last);
    pushValue();
  }
}

let lastCode = "";

function pushValue(): void {
  const code = joinCells();
  emit("update:modelValue", code);
  // 只在「由不完整变为完整」那一次通知：重复编辑已是完整的码、重贴同一串都不应再次触发提交
  if (code.length === numCells && lastCode.length < numCells) {
    emit("complete");
  }
  lastCode = code;
}
</script>
