import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

export function useLandingMotion(root) {
  const slide = ref(0)
  const paused = ref(false)
  let observer, timer, motion
  const stop = () => { window.clearInterval(timer); timer = null }
  const start = () => {
    stop()
    if (!motion || motion.matches || paused.value || document.hidden) return
    timer = window.setInterval(() => { slide.value = (slide.value + 1) % 2 }, 4400)
  }
  const chooseSlide = (index) => { slide.value = index; start() }
  const syncVisibility = () => document.hidden ? stop() : start()
  watch(paused, (value) => value ? stop() : start())
  const replay = (event) => {
    const row = event.currentTarget.closest('.story-row')
    if (!row || motion?.matches) return
    row.classList.remove('playing')
    void row.offsetWidth
    row.classList.add('playing')
  }
  onMounted(() => {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => target.classList.toggle('playing', isIntersecting && !motion.matches))
    }, { threshold: 0.2 })
    root.value?.querySelectorAll('.story-row').forEach((row) => observer.observe(row))
    document.addEventListener('visibilitychange', syncVisibility)
    start()
  })
  onBeforeUnmount(() => { observer?.disconnect(); stop(); document.removeEventListener('visibilitychange', syncVisibility) })
  return { slide, paused, replay, chooseSlide }
}
