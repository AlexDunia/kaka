<script setup>
import { computed, ref, watch } from 'vue'
import { TicketIcon } from '@/components/icons/pngIcons'
import { safePublicUrl } from '@/utils/eventProfile'

const props = defineProps({ src: { type: String, default: '' }, alt: { type: String, default: '' } })
const failed = ref(false)
const source = computed(() => safePublicUrl(props.src))
watch(() => props.src, () => { failed.value = false })
</script>

<template>
  <img v-if="source && !failed" :key="source" class="ep-hero-image" :src="source" :alt="alt" fetchpriority="high" @error="failed = true" />
  <div v-else class="ep-system-hero-placeholder" role="img" aria-label="Event cover unavailable"><TicketIcon aria-hidden="true" /><span>Event cover unavailable</span></div>
</template>
