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
const authReady = useAuthStore().initialize()
app.use(router)

Promise.all([authReady, router.isReady()]).then(() => {
  app.mount('#app')
})
