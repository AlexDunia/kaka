import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './styles/design-tokens.css'
import './styles/design-system.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})
