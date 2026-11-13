import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// 部署到 GitHub Pages 必须设置 base 为 '/仓库名/'，否则线上资源 404（实验15 任务5）
// Netlify 拖拽部署则不需要（但设置不影响 Netlify，可保留）
export default defineConfig({
  base: '/dorm-management-system/',
  plugins: [vue()],
})
