<script setup lang="ts">
import { t } from "~/lib/i18n";
import StarHopePage from "../components/StarHopePage.vue";
import StarHopeEmptyState from "../components/StarHopeEmptyState.vue";
</script>

<template>
  <StarHopePage :title="t('starhope.reader.title')" icon="tabler:book-2">
    <StarHopeEmptyState
      icon="tabler:book-2"
      :message="t('starhope.reader.emptyHint')"
    />
  </StarHopePage>
</template>
