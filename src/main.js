import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './styles/design-tokens.css'
import './styles/design-system.css'
import './styles/png-icon-motion.css'
import './styles/interaction-feedback.css'
import './styles/popup-motion.css'
import './styles/event-cards.css'

const app = createApp(App)

app.use(createPinia())
void useAuthStore().initialize()
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})
