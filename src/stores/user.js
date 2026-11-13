import { defineStore } from 'pinia'

// 用户/登录态仓库（T6：Pinia ≥2 仓库之一，persist 持久化）
// persist 落在 localStorage 的 key 为 'dorm-user'，路由守卫据此判断登录态
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    name: '',
    role: '' // student | manager
  }),
  actions: {
    // TODO 页面开发A：调 /login 接口校验 users 表，成功后写入 token/name/role
    async login() {},
    logout() {
      this.token = ''
      this.name = ''
      this.role = ''
    }
  },
  persist: {
    key: 'dorm-user'
  }
})
