import { onBeforeUnmount, ref } from 'vue'
import { usesPublicTransition } from '../utils/routePresentation.js'

export function shouldShowPublicLoader({ protectedRoute, samePage, back, publicPage = true }) {
  return publicPage && !protectedRoute && !samePage && !back
}

export function usePublicPageLoader(router) {
  const visible = ref(false), stage = ref('brand'), destination = ref('home'), sequence = ref(0)
  let timer, ready = false, brandDone = false, lastPosition = window.history.state?.position ?? 0
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  function stop() { clearTimeout(timer); visible.value = false; sequence.value++ }
  function reveal() {
    if (!ready || !brandDone || !visible.value) return
    timer = window.setTimeout(() => {
      stage.value = 'reveal'
      timer = window.setTimeout(stop, motion.matches ? 0 : 190)
    }, motion.matches ? 0 : 285)
  }
  function start(to, isReady = false) {
    clearTimeout(timer)
    sequence.value++
    destination.value = to.name === 'home' ? 'home' : ['find-events', 'search'].includes(to.name) || to.meta.discoveryCategory ? 'discovery' : 'page'
    stage.value = 'brand'
    visible.value = true
    ready = isReady
    brandDone = false
    timer = window.setTimeout(() => { brandDone = true; stage.value = 'skeleton'; reveal() }, motion.matches ? 0 : 1375)
  }
  const removeBefore = router.beforeEach((to, from) => {
    const back = (window.history.state?.position ?? lastPosition) < lastPosition
    const samePage = to.path === from.path
    if (shouldShowPublicLoader({ protectedRoute: to.meta.requiresAuth, publicPage: usesPublicTransition(to), samePage, back })) start(to)
    else stop()
  })
  const removeAfter = router.afterEach((_to, _from, failure) => {
    lastPosition = window.history.state?.position ?? lastPosition
    if (failure) stop()
    else { ready = true; reveal() }
  })
  const removeError = router.onError(stop)
  const navigation = performance.getEntriesByType('navigation')[0]
  if (shouldShowPublicLoader({ protectedRoute: router.currentRoute.value.meta.requiresAuth, publicPage: usesPublicTransition(router.currentRoute.value), samePage: false, back: navigation?.type === 'back_forward' })) start(router.currentRoute.value, true)
  onBeforeUnmount(() => { stop(); removeBefore(); removeAfter(); removeError() })
  return { visible, stage, destination, sequence }
}
