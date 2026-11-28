<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const band = ref(null), track = ref(null), firstGroup = ref(null), copies = ref(4)
const audiences = ['event organizers', 'creators', 'churches', 'small businesses', 'schools', 'nonprofits', 'festivals', 'community groups', 'charities', 'event planners']
let observer, disposed = false
function measure() {
  if (disposed) return
  const width = firstGroup.value?.getBoundingClientRect().width
  if (!width || !track.value) return
  track.value.style.setProperty('--rh-loop-neg', `-${width}px`)
  track.value.style.setProperty('--rh-loop-time', `${Math.max(26, width / 43)}s`)
  copies.value = Math.max(4, Math.ceil((band.value?.clientWidth || 0) / width) + 2)
}
onMounted(async () => {
  await nextTick()
  if (disposed) return
  measure()
  observer = new ResizeObserver(measure)
  if (firstGroup.value) observer.observe(firstGroup.value)
  if (band.value) observer.observe(band.value)
  document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => { disposed = true; observer?.disconnect() })
</script>

<template>
  <div ref="band" class="rh-audience-strip" aria-label="Built for organisers, creators, and communities">
    <div ref="track" class="rh-audience-track">
      <div v-for="copy in copies" :key="copy" :ref="copy === 1 ? (element) => firstGroup = element : undefined" class="rh-audience-group" :aria-hidden="copy > 1 ? true : undefined">
        <template v-for="audience in audiences" :key="audience"><span class="rh-audience-item">For {{ audience }}</span><span class="rh-audience-mark" aria-hidden="true"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('plus')" width="24" height="24" /></svg></span></template>
      </div>
    </div>
  </div>
</template>
