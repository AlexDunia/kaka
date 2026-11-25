import { ref } from 'vue'
import { defineStore } from 'pinia'

// Temporary presentation state, created only after a confirmed publication.
export const usePublishGuidanceStore = defineStore('publishGuidance', () => {
  const notice = ref(null)
  const prompted = ref(false)
  const guided = ref(false)
  function begin(eventId, title) {
    if (!eventId) return
    notice.value = { eventId, title }
    prompted.value = false
    guided.value = false
  }
  function reset() {
    notice.value = null
    prompted.value = false
    guided.value = false
  }
  return { notice, prompted, guided, begin, reset }
})
