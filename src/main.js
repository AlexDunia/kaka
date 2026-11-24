import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './styles/design-tokens.css'
import './styles/design-system.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
  // Public chrome and transitions do not wait for account discovery.
  void useAuthStore().initialize()
})

window.addEventListener('auth:unauthorized', () => {
  const route = router.currentRoute.value
  if (route.meta.requiresAuth) {
    void router.replace({ name: 'login', query: { redirect: route.fullPath } })
  }
})
