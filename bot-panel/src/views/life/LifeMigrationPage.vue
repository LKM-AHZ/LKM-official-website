<template>
  <LifePageShell
    v-model:message="message"
    :title="tm('migration.title')"
    :subtitle="tm('migration.subtitle')"
    :loading="loading"
    :error="error"
    @refresh="load"
  >
    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="tonal" class="pa-4 h-100">
          <div class="text-subtitle-1 font-weight-medium mb-1">
            {{ tm('migration.memoryTitle') }}
          </div>
          <p class="text-body-2 mb-3">{{ tm('migration.memoryHint') }}</p>
          <v-text-field
            v-model="exportUmo"
            :label="tm('migration.exportUmo')"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
          />
          <v-btn variant="tonal" prepend-icon="mdi-download" @click="exportMemory">
            {{ tm('migration.memoryExport') }}
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="tonal" class="pa-4 h-100">
          <div class="text-subtitle-1 font-weight-medium mb-1">
            {{ tm('migration.statusTitle') }}
          </div>
          <p class="text-body-2 mb-3">{{ tm('migration.statusHint') }}</p>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="(value, key) in statusChips"
              :key="key"
              size="small"
              variant="flat"
            >
              {{ key }}: {{ value }}
            </v-chip>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card variant="tonal" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ tm('migration.configTitle') }}
              </div>
              <p class="text-body-2 mb-0">{{ tm('migration.configHint') }}</p>
            </div>
            <v-btn
              variant="text"
              prepend-icon="mdi-content-save-outline"
              :loading="saving"
              @click="saveConfig"
            >
              {{ tm('migration.save') }}
            </v-btn>
          </div>
          <v-textarea
            v-model="configText"
            variant="outlined"
            density="compact"
            rows="18"
            spellcheck="false"
            :error-messages="configError ? [configError] : []"
          />
        </v-card>
      </v-col>
    </v-row>
  </LifePageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { lifeApi } from '@/api/life';
import { useModuleI18n } from '@/i18n/composables';
import { downloadJson } from './format';
import LifePageShell from './LifePageShell.vue';

const { tm } = useModuleI18n('features/life');

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const message = ref('');
const configError = ref('');
const configText = ref('');
const exportUmo = ref('');
const status = ref<Record<string, any> | null>(null);

const statusChips = computed(() => {
  const payload = (status.value || {}) as Record<string, any>;
  return {
    enabled: String(payload.enabled ?? false),
    configured: String(payload.configured ?? false),
    sessions: String(payload.sessions ?? 0),
    started_at: String(payload.started_at ?? 0),
  };
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [config, statusPayload] = await Promise.all([
      lifeApi.config(),
      lifeApi.status(),
    ]);
    configText.value = JSON.stringify(config, null, 2);
    status.value = statusPayload;
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}

async function exportMemory() {
  try {
    const payload = await lifeApi.memoryExport(exportUmo.value || undefined);
    downloadJson(`life-memory-${Date.now()}.json`, payload);
  } catch (err) {
    error.value = String(err);
  }
}

async function saveConfig() {
  saving.value = true;
  configError.value = '';
  try {
    const parsed = JSON.parse(configText.value);
    await lifeApi.saveConfig(parsed);
    message.value = tm('migration.saved');
    await load();
  } catch (err) {
    configError.value = String(err);
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
