<script setup lang="ts">
// ModerationRuleTable.vue — 后台自动审校规则管理。
// 列表/测试只读（adminFetch）；增删改走 2FA（useAdminMFA 弹窗 step-up）。
import { ref, onMounted } from "vue";
import { moderationApi } from "~/lib/api";
import type { RuleInfo, RuleCreateInput } from "~/lib/api/modules/moderation";
import { useAdminMFA } from "~/lib/http/useAdminMFA";
import { t } from "~/lib/i18n";
import AdminMFAVerifyDialog from "./AdminMFAVerifyDialog.vue";

const rules = ref<RuleInfo[]>([]);
const loading = ref(false);
const error = ref("");
const message = ref("");

// 新增/编辑表单
const formOpen = ref(false);
const editing = ref<RuleInfo | null>(null);
const pattern = ref("");
const isRegex = ref(false);
const action = ref<"derank" | "hide">("derank");
const weight = ref<number>(0.5);

// 测试
const testText = ref("");
const testResult = ref<{
  matched: boolean;
  penalty: number;
  should_hide: boolean;
  total_rules: number;
  hits: Array<{ pattern: string; action: string }>;
} | null>(null);

const mfa = useAdminMFA();
const deletingId = ref<number | null>(null);

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    rules.value = await moderationApi.listRules();
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("admin.loadFailed");
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editing.value = null;
  pattern.value = "";
  isRegex.value = false;
  action.value = "derank";
  weight.value = 0.5;
  formOpen.value = true;
}

function openEdit(r: RuleInfo): void {
  editing.value = r;
  pattern.value = r.pattern;
  isRegex.value = r.is_regex;
  action.value = r.action;
  weight.value = r.weight;
  formOpen.value = true;
}

async function save(): Promise<void> {
  if (!pattern.value.trim()) return;
  const input: RuleCreateInput = {
    pattern: pattern.value.trim(),
    is_regex: isRegex.value,
    action: action.value,
    weight: weight.value,
  };
  const result = await mfa.run(async () =>
    editing.value
      ? moderationApi.updateRule(editing.value.id, input)
      : moderationApi.createRule(input),
  );
  if (result === null) return;
  formOpen.value = false;
  message.value = t("admin.saved");
  await load();
}

async function removeRule(id: number): Promise<void> {
  deletingId.value = id;
  const result = await mfa.run(async () => moderationApi.deleteRule(id));
  deletingId.value = null;
  if (result === null) return;
  message.value = t("admin.deleted");
  await load();
}

async function testRules(): Promise<void> {
  if (!testText.value.trim()) return;
  try {
    testResult.value = await mfa.run(async () =>
      moderationApi.testRule(testText.value),
    );
  } catch (e) {
    message.value = e instanceof Error ? e.message : t("admin.loadFailed");
  }
}

onMounted(() => void load());
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-deep-text">
        {{ t("admin.moderation.title") }}
      </h2>
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg text-sm bg-primary text-on-primary hover:bg-primary/90"
        @click="openCreate"
      >
        {{ t("admin.moderation.addRule") }}
      </button>
    </div>

    <p v-if="message" class="mb-3 text-sm text-green-600">{{ message }}</p>

    <!-- 规则列表 -->
    <div v-if="loading" class="text-sm text-text-muted py-6">
      {{ t("common.loading") }}
    </div>
    <div v-else-if="error" class="text-sm text-red-500 py-6">{{ error }}</div>
    <div
      v-else-if="rules.length === 0"
      class="text-sm text-text-muted py-6 text-center"
    >
      {{ t("admin.moderation.noRules") }}
    </div>
    <div
      v-else
      class="bg-card-bg border border-surface-3 rounded-xl overflow-hidden"
    >
      <table class="w-full text-sm">
        <thead class="bg-surface-3/50">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-text-muted">#</th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.moderation.pattern") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.moderation.action") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.moderation.weight") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.moderation.regex") }}
            </th>
            <th class="text-left px-4 py-3 font-medium text-text-muted">
              {{ t("admin.moderation.status") }}
            </th>
            <th class="text-right px-4 py-3 font-medium text-text-muted">
              {{ t("admin.actions") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-3">
          <tr
            v-for="r in rules"
            :key="r.id"
            class="hover:bg-page-bg transition-colors"
          >
            <td class="px-4 py-3 text-text-muted">{{ r.id }}</td>
            <td class="px-4 py-3 font-medium text-deep-text">
              {{ r.pattern }}
            </td>
            <td class="px-4 py-3">
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="
                  r.action === 'hide'
                    ? 'bg-red-500/15 text-red-500'
                    : 'bg-surface-3 text-text-muted'
                "
              >
                {{ r.action }}
              </span>
            </td>
            <td class="px-4 py-3 text-text-muted">{{ r.weight }}</td>
            <td class="px-4 py-3 text-text-muted">
              {{ r.is_regex ? "✓" : "—" }}
            </td>
            <td class="px-4 py-3">
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="
                  r.enabled
                    ? 'bg-green-500/15 text-green-600'
                    : 'bg-surface-3 text-text-muted'
                "
              >
                {{
                  r.enabled
                    ? t("admin.moderation.enabled")
                    : t("admin.moderation.disabled")
                }}
              </span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button
                type="button"
                class="text-primary hover:underline mr-3"
                @click="openEdit(r)"
              >
                {{ t("admin.edit") }}
              </button>
              <button
                type="button"
                class="text-red-500 hover:underline disabled:opacity-40"
                :disabled="deletingId === r.id"
                @click="removeRule(r.id)"
              >
                {{ t("admin.delete") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑表单 -->
    <div
      v-if="formOpen"
      class="mt-6 p-4 rounded-xl bg-card-bg border border-surface-3"
    >
      <h3 class="text-base font-semibold text-deep-text mb-3">
        {{
          editing
            ? t("admin.moderation.editRule")
            : t("admin.moderation.addRule")
        }}
      </h3>
      <div class="grid gap-3 max-w-md">
        <input
          v-model="pattern"
          type="text"
          :placeholder="t('admin.moderation.patternPlaceholder')"
          class="px-3 py-2 rounded-lg text-sm bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
        />
        <label class="flex items-center gap-2 text-sm text-text-muted">
          <input v-model="isRegex" type="checkbox" />
          {{ t("admin.moderation.isRegex") }}
        </label>
        <div class="flex gap-2">
          <select
            v-model="action"
            class="flex-1 px-3 py-2 rounded-lg text-sm bg-page-bg border border-surface-3"
          >
            <option value="derank">derank</option>
            <option value="hide">hide</option>
          </select>
          <input
            v-model.number="weight"
            type="number"
            min="0"
            max="1"
            step="0.1"
            class="w-24 px-3 py-2 rounded-lg text-sm bg-page-bg border border-surface-3"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 px-4 py-2 rounded-lg text-sm bg-primary text-on-primary hover:bg-primary/90"
            @click="save"
          >
            {{ t("admin.save") }}
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-2 rounded-lg text-sm bg-surface-3 text-deep-text hover:bg-surface-3/70"
            @click="formOpen = false"
          >
            {{ t("common.cancel") }}
          </button>
        </div>
      </div>
    </div>

    <!-- 规则测试 -->
    <div class="mt-6 p-4 rounded-xl bg-card-bg border border-surface-3">
      <h3 class="text-base font-semibold text-deep-text mb-2">
        {{ t("admin.moderation.testRules") }}
      </h3>
      <div class="flex gap-2">
        <input
          v-model="testText"
          type="text"
          :placeholder="t('admin.moderation.testPlaceholder')"
          class="flex-1 px-3 py-2 rounded-lg text-sm bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm bg-surface-3 text-deep-text hover:bg-surface-3/70 disabled:opacity-40"
          :disabled="!testText.trim()"
          @click="testRules"
        >
          {{ t("admin.moderation.runTest") }}
        </button>
      </div>
      <div v-if="testResult" class="mt-3 text-sm">
        <p :class="testResult.matched ? 'text-red-500' : 'text-green-600'">
          {{
            testResult.matched
              ? t("admin.moderation.testMatched")
              : t("admin.moderation.testClean")
          }}
        </p>
        <p class="text-text-muted mt-1">
          {{
            t("admin.moderation.penalty", {
              value: testResult.penalty.toFixed(2),
            })
          }}
          · {{ t("admin.moderation.shouldHide") }}:
          {{ testResult.should_hide ? "✓" : "—" }} ·
          {{
            t("admin.moderation.totalRules", { count: testResult.total_rules })
          }}
        </p>
        <ul
          v-if="testResult.hits.length"
          class="list-disc list-inside mt-2 text-text-muted"
        >
          <li v-for="(h, i) in testResult.hits" :key="i">
            {{ h.pattern }} ({{ h.action }})
          </li>
        </ul>
      </div>
    </div>

    <AdminMFAVerifyDialog
      :state="mfa.dialog"
      @verify="mfa.onCode"
      @cancel="mfa.onCancel"
    />
  </div>
</template>
