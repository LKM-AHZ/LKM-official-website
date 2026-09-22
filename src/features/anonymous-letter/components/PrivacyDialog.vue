<template>
  <!-- 隐私声明弹窗：明确数据仅本地存储不上传 -->
  <div v-if="modelValue" class="dialog-overlay">
    <div class="dialog glass">
      <div class="privacy">
        <div class="privacy-emoji">🔒</div>
        <h2 class="grad-text">{{ t("treehole.privacy.title") }}</h2>
        <p class="privacy-text">
          {{ t("treehole.privacy.welcomePrefix") }}
          <b>{{ t("treehole.name") }}</b
          >{{ t("treehole.privacy.welcomeMiddle") }}
          <b>{{ t("treehole.privacy.pureAnonymous") }}</b
          >{{ t("treehole.privacy.welcomeSuffix") }}
        </p>
        <ul class="privacy-list">
          <li>
            🌿 {{ t("treehole.privacy.li1Prefix")
            }}<b>{{ t("treehole.privacy.li1Bold") }}</b
            >{{ t("treehole.privacy.li1Suffix") }}
          </li>
          <li>
            🌿 {{ t("treehole.privacy.li2Prefix")
            }}<b>{{ t("treehole.privacy.li2Bold") }}</b
            >{{ t("treehole.privacy.li2Suffix") }}
          </li>
          <li>
            🌿 {{ t("treehole.privacy.li3Prefix")
            }}<b>{{ t("treehole.privacy.li3Bold") }}</b
            >{{ t("treehole.privacy.li3Suffix") }}
          </li>
          <li>
            🌿 {{ t("treehole.privacy.li4Prefix")
            }}<b>{{ t("treehole.privacy.li4Bold") }}</b
            >{{ t("treehole.privacy.li4Suffix") }}
          </li>
        </ul>
        <p class="privacy-tip">{{ t("treehole.privacy.tip") }}</p>
        <div class="privacy-actions">
          <button class="btn-grad" @click="accept">
            {{ t("treehole.privacy.accept") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApp } from "../stores/app";
import { t } from "~/lib/i18n";
// 类型化声明：v-model 的取值与 emit 载荷都交给 vue-tsc 校验（原先的数组式 emits 不受检）
defineProps<{ modelValue?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const { acceptPrivacy } = useApp();

function accept() {
  acceptPrivacy();
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
  max-width: 440px;
  width: 92vw;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}
.privacy {
  padding: 28px 26px;
  text-align: center;
  border-radius: 22px;
}
.privacy-emoji {
  font-size: 46px;
  margin-bottom: 6px;
}
.privacy h2 {
  font-size: 22px;
  margin: 4px 0 14px;
}
.privacy-text {
  text-align: left;
  color: var(--text-sub);
  margin: 0 0 10px;
}
.privacy-list {
  text-align: left;
  padding-left: 4px;
  list-style: none;
  margin: 0 0 12px;
}
.privacy-list li {
  margin: 8px 0;
  font-size: 14px;
}
.privacy-tip {
  font-size: 12px;
  color: var(--text-sub);
  margin: 6px 0 18px;
}
.privacy-actions .btn-grad {
  width: 100%;
}
</style>
