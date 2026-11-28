<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { onBeforeUnmount, ref } from 'vue'
const props = defineProps({
  value: String,
  label: String,
  compact: Boolean,
  text: String,
  buttonClass: String,
})
const emit = defineEmits(['notify'])
const copied = ref(false)
const copying = ref(false)
let timer
async function copy() {
  if (copying.value) return
  copying.value = true
  let ok = false
  try {
    await navigator.clipboard.writeText(props.value)
    ok = true
  } catch {
    const input = document.createElement('textarea'),
      focused = document.activeElement
    input.value = props.value
    input.readOnly = true
    input.style.cssText = 'position:fixed;left:-10000px;opacity:0'
    document.body.append(input)
    input.select()
    try {
      ok = document.execCommand('copy')
    } catch {
      /* The visible value remains selectable. */
    }
    input.remove()
    focused?.focus()
  }
  copying.value = false
  copied.value = ok
  emit(
    'notify',
    ok
      ? 'Copied to your clipboard.'
      : 'We couldn’t copy that. Select the text and try copying it again.',
  )
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 2000)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <button
    type="button"
    :class="[buttonClass || 'rh28-copy-email', { 'rh-copy-icon': !compact && !buttonClass }]"
    :aria-label="copied ? 'Copied' : label"
    :title="copied ? 'Copied' : label"
    :data-copied="copied"
    :disabled="copying"
    :aria-busy="copying"
    @click="copy"
  >
    <span v-if="text">{{ copied ? 'Copied' : text }}</span>
    <svg
      v-else-if="!copied"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    ><image :href="pngIconUrl('copy')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg
    ><svg
      v-else
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    ><image :href="pngIconUrl('check')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
  </button>
</template>
