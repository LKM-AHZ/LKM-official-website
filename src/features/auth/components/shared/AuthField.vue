<template>
  <div class="w-full">
    <label v-if="label" :for="fieldId" class="label pb-1">
      <span class="label-text font-medium">{{ label }}</span>
    </label>
    <div class="relative">
      <input
        :id="fieldId"
        :type="showPassword ? 'text' : type"
        class="input input-bordered w-full pr-10"
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
        class="absolute right-2 inset-y-0 flex items-center px-2 text-text-muted"
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
import { computed, ref, useId } from "vue";
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
</script>
