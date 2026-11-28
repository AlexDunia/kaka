import { onBeforeUnmount, ref } from 'vue'
import { usesPublicTransition } from '../utils/routePresentation.js'

export function shouldShowPublicLoader({ protectedRoute, samePage, back, publicPage = true }) {
  return publicPage && !protectedRoute && !samePage && !back
}

export function usePublicPageLoader(router) {
  const visible = ref(false)
  const stage = ref('skeleton')
  const destination = ref('home')
  const sequence = ref(0)
  let timer
  let lastPosition = window.history.state?.position ?? 0

  function stop() {
    clearTimeout(timer)
    visible.value = false
  }

  function start(to) {
    stop()
    destination.value = to.name === 'home'
      ? 'home'
      : ['find-events', 'search'].includes(to.name) || to.meta.discoveryCategory
        ? 'discovery'
        : 'page'
    // Fast navigation needs no overlay. Show it only while a slower route is pending.
    timer = window.setTimeout(() => {
      sequence.value++
      visible.value = true
    }, 200)
  }

  const removeBefore = router.beforeEach((to, from) => {
    const back = (window.history.state?.position ?? lastPosition) < lastPosition
    const samePage = to.path === from.path
    if (shouldShowPublicLoader({
      protectedRoute: to.meta.requiresAuth,
      publicPage: usesPublicTransition(to),
      samePage,
      back,
    })) start(to)
    else stop()
  })
  const removeAfter = router.afterEach(() => {
    lastPosition = window.history.state?.position ?? lastPosition
    stop()
  })
  const removeError = router.onError(stop)
  // The initial route is already ready when App mounts.
  onBeforeUnmount(() => { stop(); removeBefore(); removeAfter(); removeError() })
  return { visible, stage, destination, sequence }
}
