import { ref } from 'vue'

const hidden = ref(false)
let loaded = false
export function useWorkspacePrivacy() {
  if (typeof window !== 'undefined' && !loaded) {
    try {
      hidden.value = window.sessionStorage.getItem('rushhour-hide-amounts') === 'yes'
    } catch {
      /* Privacy still works when storage is blocked. */
    }
    loaded = true
  }
  function toggleAmounts() {
    hidden.value = !hidden.value
    try {
      window.sessionStorage.setItem('rushhour-hide-amounts', hidden.value ? 'yes' : 'no')
    } catch {
      /* Keep the current view private. */
    }
  }
  return { amountsHidden: hidden, toggleAmounts }
}
