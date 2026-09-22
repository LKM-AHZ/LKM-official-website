<template>
  <ProtectedRoute>
    <div class="relative min-h-[calc(100vh-12rem)] px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-semibold mb-2">{{ t("settings.title") }}</h1>
          <p class="text-sm text-text-muted">{{ t("settings.subtitle") }}</p>
        </div>

        <div v-if="message" class="alert alert-success text-sm mb-6">
          {{ message }}
        </div>

        <!-- 移动端顶部分段（横向滚动） -->
        <div class="md:hidden overflow-x-auto mb-6 -mx-4 px-4">
          <div class="flex gap-2 w-max">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="btn btn-sm"
              :class="activeSection === tab.key ? 'btn-primary' : 'btn-ghost'"
              @click="activeSection = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6">
          <!-- 桌面左侧导航 -->
          <aside class="hidden md:block w-56 shrink-0">
            <nav
              class="sticky top-6 space-y-1"
              aria-label="Account settings navigation"
            >
              <button
                v-for="grp in groups"
                :key="grp.key"
                type="button"
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium"
                :class="
                  activeSection === grp.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-page-bg'
                "
                @click="activeSection = grp.key"
              >
                {{ grp.label }}
              </button>
            </nav>
          </aside>

          <!-- 右侧内容卡 -->
          <main class="flex-1 min-w-0 space-y-6">
            <!-- 个人信息 -->
            <section
              v-show="activeSection === 'profile'"
              class="rounded-2xl bg-card-bg shadow-xl border border-surface-3 p-6 space-y-4"
            >
              <h3 class="text-lg font-semibold">
                {{ t("settings.profileTitle") }}
              </h3>

              <div class="flex items-center gap-5">
                <div class="relative shrink-0">
                  <img
                    v-if="store.user?.avatar"
                    :src="avatarUrl"
                    alt="avatar"
                    class="w-16 h-16 rounded-full object-cover bg-primary/20"
                  />
                  <div
                    v-else
                    class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary"
                  >
                    {{ avatarLetter }}
                  </div>
                  <label
                    class="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center text-xs text-transparent hover:bg-black/30 hover:text-white transition-colors"
                    title="上传头像"
                  >
                    上传头像
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="onAvatarChange"
                    />
                  </label>
                </div>
                <div class="flex-1">
                  <div class="text-lg font-semibold">
                    {{ store.user?.nickname || store.user?.username }}
                  </div>
                  <div class="text-sm text-text-muted">
                    @{{ store.user?.username }}
                  </div>
                  <span class="badge badge-sm mt-1" :class="levelBadgeClass">{{
                    levelLabel
                  }}</span>
                </div>
              </div>

              <form
                @submit.prevent="handleSaveNickname"
                class="flex gap-3 items-end"
              >
                <div class="flex-1">
                  <label class="label pb-1" for="settings-nickname">
                    <span class="label-text font-medium">{{
                      t("settings.nickname")
                    }}</span>
                  </label>
                  <input
                    id="settings-nickname"
                    type="text"
                    class="input input-bordered w-full"
                    v-model="editNickname"
                    :placeholder="t('settings.nicknamePlaceholder')"
                  />
                </div>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="saving"
                >
                  <span
                    v-if="saving"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <template v-else>{{ t("common.save") }}</template>
                </button>
              </form>
              <div v-if="editError" class="alert alert-error text-sm">
                {{ editError }}
              </div>

              <!-- 联系方式 -->
              <div class="border-t border-surface-3 pt-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium">{{ t("settings.contactTitle") }}</h4>
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost"
                    @click="addLink"
                  >
                    + {{ t("settings.add") }}
                  </button>
                </div>
                <p class="text-xs text-text-muted mb-3">
                  {{ t("settings.contactHint") }}
                </p>
                <div
                  v-for="(l, i) in editLinks"
                  :key="i"
                  class="flex flex-wrap gap-2 items-center mb-2"
                >
                  <input
                    v-model="l.name"
                    class="input input-bordered input-sm flex-1 min-w-[6rem]"
                    :placeholder="t('settings.linkNamePlaceholder')"
                  />
                  <input
                    v-model="l.icon"
                    class="input input-bordered input-sm w-36"
                    :placeholder="t('settings.iconPlaceholder')"
                  />
                  <input
                    v-model="l.url"
                    class="input input-bordered input-sm flex-[2] min-w-[8rem]"
                    :placeholder="t('settings.urlPlaceholder')"
                  />
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost text-error"
                    @click="removeLink(i)"
                  >
                    {{ t("common.delete") }}
                  </button>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  :disabled="saving"
                  @click="handleSaveLinks"
                >
                  {{ t("settings.saveContacts") }}
                </button>
              </div>

              <!-- 用户只读信息 -->
              <dl
                class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-surface-3 pt-4"
              >
                <div>
                  <dt class="text-text-muted mb-0.5">
                    {{ t("settings.userId") }}
                  </dt>
                  <dd class="font-mono">{{ store.user?.id }}</dd>
                </div>
                <div>
                  <dt class="text-text-muted mb-0.5">
                    {{ t("settings.username") }}
                  </dt>
                  <dd class="font-medium">{{ store.user?.username }}</dd>
                </div>
                <div>
                  <dt class="text-text-muted mb-0.5">
                    {{ t("settings.level") }}
                  </dt>
                  <dd>
                    <span class="badge badge-sm" :class="levelBadgeClass">{{
                      levelLabel
                    }}</span>
                  </dd>
                </div>
                <div>
                  <dt class="text-text-muted mb-0.5">
                    {{ t("settings.role") }}
                  </dt>
                  <dd class="font-medium">
                    {{ store.user?.role || "member" }}
                  </dd>
                </div>
                <div>
                  <dt class="text-text-muted mb-0.5">
                    {{ t("settings.email") }}
                  </dt>
                  <dd class="font-medium">
                    {{ store.user?.email || t("settings.notBound") }}
                  </dd>
                </div>
                <div>
                  <dt class="text-text-muted mb-0.5">
                    {{ t("settings.phone") }}
                  </dt>
                  <dd class="font-medium">
                    {{ store.user?.phone || t("settings.notBound") }}
                  </dd>
                </div>
              </dl>
            </section>

            <!-- 登录与安全 -->
            <section
              v-show="activeSection === 'security'"
              class="rounded-2xl bg-card-bg shadow-xl border border-surface-3 p-6"
            >
              <h3 class="text-lg font-semibold mb-4">
                {{ t("settings.securityTitle") }}
              </h3>
              <div class="space-y-6 divide-y divide-surface-3">
                <BindMethods :user="store.user!" @update="handleUserUpdate" />
                <div class="pt-6">
                  <TwoFactorSetup
                    :user="store.user!"
                    @update="handleUserUpdate"
                  />
                </div>
                <div class="pt-6">
                  <PasskeySetup
                    :user="store.user!"
                    @update="handleUserUpdate"
                  />
                </div>
              </div>
            </section>

            <!-- 账户操作 -->
            <section
              v-show="activeSection === 'account'"
              class="rounded-2xl bg-card-bg shadow-xl border border-surface-3 p-6 space-y-4"
            >
              <h3 class="text-lg font-semibold">
                {{ t("settings.accountTitle") }}
              </h3>

              <div
                v-if="store.user?.account_level === 'local'"
                class="alert alert-info text-sm"
              >
                <span>{{ t("settings.localUpgradeHint") }}</span>
              </div>

              <div class="flex flex-wrap gap-3 justify-between">
                <a
                  :href="getAuthPath('account/recovery')"
                  class="btn btn-ghost btn-sm"
                  >{{ t("settings.recovery") }}</a
                >
                <ConfirmDialog
                  :open="confirmLogout"
                  danger
                  :title="t('settings.logoutTitle')"
                  :message="t('settings.logoutMessage')"
                  :confirm-text="t('settings.logoutTitle')"
                  @confirm="handleLogout"
                  @cancel="confirmLogout = false"
                />
                <button
                  type="button"
                  class="btn btn-ghost btn-sm text-error"
                  @click="confirmLogout = true"
                >
                  {{ t("settings.logoutTitle") }}
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  </ProtectedRoute>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import { t } from "~/lib/i18n";
import ProtectedRoute from "~/features/auth/components/settings/ProtectedRoute.vue";
import BindMethods from "~/features/auth/components/settings/BindMethods.vue";
import TwoFactorSetup from "~/features/auth/components/settings/TwoFactorSetup.vue";
import PasskeySetup from "~/features/auth/components/settings/PasskeySetup.vue";
import ConfirmDialog from "~/features/auth/components/settings/ConfirmDialog.vue";
import { authApi, type ContactLink } from "~/lib/api/modules/auth";

const store = useAuthStore();

type SectionKey = "profile" | "security" | "account";

const groups = [
  { key: "profile", label: t("settings.profileTitle") },
  { key: "security", label: t("settings.securityTitle") },
  { key: "account", label: t("settings.accountTitle") },
] as const;

const tabs = groups;

const activeSection = ref<SectionKey>("profile");

const message = ref("");
const saving = ref(false);
const editNickname = ref(store.user?.nickname || "");
const editLinks = ref<ContactLink[]>(
  (store.user?.contact_links || []).map((l) => ({
    name: l.name,
    icon: l.icon ?? "",
    url: l.url ?? "",
  })),
);
const editError = ref("");
const confirmLogout = ref(false);

const avatarLetter = computed(() =>
  (store.user?.nickname || store.user?.username || "?").charAt(0).toUpperCase(),
);

// 头像 URL 只由 user.id 派生，重传后字符串不变 → 浏览器直接吃缓存里的旧图，
// 看起来像上传失败。用版本号做 cache-busting，上传成功后自增。
const avatarVersion = ref(0);
const avatarUrl = computed(() =>
  store.user?.avatar && store.user.id
    ? `${authApi.getAvatarUrl(store.user.id)}?v=${avatarVersion.value}`
    : "",
);

const levelBadgeClass = computed(() => {
  const level = store.user?.account_level;
  return level === "admin"
    ? "badge-error"
    : level === "normal"
      ? "badge-primary"
      : "badge-ghost";
});
const levelLabel = computed(() => {
  const level = store.user?.account_level;
  return level === "admin"
    ? t("user.admin")
    : level === "normal"
      ? t("user.normalUser")
      : t("user.localAccount");
});

// TwoFactorSetup 的 update 事件不再携带 payload（它只用于刷新提示）
function handleUserUpdate() {
  message.value = t("settings.securityUpdated");
  setTimeout(() => (message.value = ""), 3000);
}

async function handleSaveNickname() {
  editError.value = "";
  saving.value = true;
  try {
    if (store.user) {
      const r = await authApi.editProfile(store.user.id, {
        nickname: editNickname.value || null,
      });
      if (r.isErr()) {
        editError.value = r.error.message || t("settings.saveFailed");
        return;
      }
      store.updateUser({ ...store.user, nickname: r.value?.nickname ?? null });
      message.value = t("settings.profileUpdated");
      setTimeout(() => (message.value = ""), 3000);
    }
  } catch {
    editError.value = t("settings.saveFailed");
  } finally {
    saving.value = false;
  }
}

async function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !store.user) return;
  editError.value = "";
  saving.value = true;
  try {
    const res = await authApi.uploadAvatar(file);
    // 接口在响应体缺 data 时会成功返回 avatar: null —— 那不是「上传成功」，
    // 直接写进 store 会把头像清空却提示成功（与 handleSaveNickname/Links 的判法保持一致）
    if (res.avatar === null) {
      editError.value = t("settings.saveFailed");
      return;
    }
    store.updateUser({ ...store.user, avatar: res.avatar });
    avatarVersion.value += 1;
    message.value = t("settings.profileUpdated");
    setTimeout(() => (message.value = ""), 3000);
  } catch (err) {
    // 硬编码中文换成 i18n；有服务端错误信息就优先透出，否则给通用文案
    editError.value =
      err instanceof Error && err.message
        ? err.message
        : t("settings.saveFailed");
  } finally {
    saving.value = false;
    input.value = "";
  }
}

function addLink() {
  editLinks.value.push({ name: "", icon: "", url: "" });
}
function removeLink(index: number) {
  editLinks.value.splice(index, 1);
}

/**
 * 联系方式链接只放行 http(s) 与站内相对路径，其余（javascript:/data:/vbscript: 等）
 * 一律置空。这些值会被渲染成 <a href>，不校验等于把注入点交给用户输入。
 */
function normalizeHttpUrl(raw: string | undefined): string | undefined {
  const v = (raw ?? "").trim();
  if (!v) return undefined;
  return v.startsWith("/") || /^https?:\/\//i.test(v) ? v : undefined;
}
async function handleSaveLinks() {
  saving.value = true;
  editError.value = "";
  try {
    if (store.user) {
      const cleaned = editLinks.value
        .filter((l) => l.name.trim())
        .map((l) => ({
          name: l.name.trim(),
          icon: l.icon?.trim() || undefined,
          url: normalizeHttpUrl(l.url),
        }));
      const r = await authApi.editProfile(store.user.id, {
        contact_links: cleaned,
      });
      if (r.isErr()) {
        editError.value = r.error.message || t("settings.saveFailed");
        return;
      }
      store.updateUser({ ...store.user, contact_links: cleaned });
      message.value = t("settings.contactsUpdated");
      setTimeout(() => (message.value = ""), 3000);
    }
  } catch {
    editError.value = t("settings.saveFailed");
  } finally {
    saving.value = false;
  }
}

async function handleLogout() {
  confirmLogout.value = false;
  await store.logout();
}
</script>
