import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// UI 组件库：Element Plus 承载主界面（T4），Vant 承载移动端页面
// 当前为全量引入（开发期简单直接）；按需引入是任务4打包优化的加分项
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Vant from 'vant'
import 'vant/lib/index.css'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // persist 持久化插件（T6）

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(Vant)

app.mount('#app')
