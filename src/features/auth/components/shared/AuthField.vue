<template>
  <div class="w-full">
    <label v-if="label" :for="fieldId" class="label pb-1">
      <span class="label-text font-medium">{{ label }}</span>
    </label>
    <div class="relative">
      <!-- 不暴露 name/required/disabled：本组件只负责取值与展示，
           必填校验/提交/禁用态都由父级表单与 flow 状态机驱动（见 LoginPage/RegisterPage） -->
      <input
        :id="fieldId"
        :type="showPassword ? 'text' : type"
        class="input input-bordered w-full pr-12"
        :class="{ 'input-error': error }"
        :value="(modelValue as string | undefined) ?? ''"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :aria-describedby="
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        "
        :aria-invalid="!!error"
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-2 inset-y-0 flex items-center px-2 rounded text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="showPassword = !showPassword"
        :aria-label="
          showPassword
            ? t('auth.field.hidePassword')
            : t('auth.field.showPassword')
        "
      >
        {{ showPassword ? t("auth.field.hide") : t("auth.field.show") }}
      </button>
    </div>
    <span
      v-if="error"
      :id="`${fieldId}-error`"
      class="label-text-alt text-error"
      >{{ error }}</span
    >
    <span
      v-else-if="hint"
      :id="`${fieldId}-hint`"
      class="label-text-alt text-text-muted"
      >{{ hint }}</span
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { t } from "~/lib/i18n";

const props = withDefaults(
  defineProps<{
    id?: string;
    label?: string;
    error?: string;
    hint?: string;
    modelValue?: string;
    type?: string;
    autocomplete?: string;
    placeholder?: string;
  }>(),
  { type: "text" },
);

// 多数调用方不传 id，但 id 会被拼进 aria-describedby 与 label[for]：
// 直接用 undefined 会渲染出 "undefined-error" 且产生重复 DOM id，这里提供稳定回退。
const uid = useId();
const fieldId = computed(() => props.id ?? `auth-field-${uid}`);

const emit = defineEmits<(e: "update:modelValue", v: string) => void>();
const showPassword = ref(false);

// type 变化时必须收起明文：同一实例（复用/切换认证方式）下残留的展开态会让新变回的
// password 输入框一渲染就是明文
watch(
  () => props.type,
  () => {
    showPassword.value = false;
  },
);
</script>
