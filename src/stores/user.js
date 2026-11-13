import { defineStore } from 'pinia'
import { login as loginApi } from '../api/user'

// 用户/登录态仓库（T6：Pinia persist 持久化，刷新不丢）
// persist 落在 localStorage 的 key 为 'dorm-user'，路由守卫（router/index.js）经本仓库读取登录态
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    name: '',
    role: '', // student | manager
    studentId: '' // 学生角色才有，供「我的寝室 / 我的报修」按人查询
  }),
  getters: {
    isLogged: (state) => !!state.token,
    isManager: (state) => state.role === 'manager'
  },
  actions: {
    // F1 登录（T5：action 内走 axios → json-server）
    // 三态结果统一为 { ok, msg }，登录页只负责提示与跳转，不直接碰接口
    async login(username, password) {
      const found = await loginApi(username, password)
      if (found === null) {
        return { ok: false, msg: '接口服务不可用，请确认已运行 npm run server（json-server :3001）' }
      }
      if (!found.length) {
        return { ok: false, msg: '用户名或密码错误' }
      }
      const u = found[0]
      // json-server 无真实鉴权，按课程口径发一个模拟 token 标记登录态
      this.token = 'mock-token-' + u.id + '-' + Date.now()
      this.name = u.name
      this.role = u.role
      this.studentId = u.studentId || ''
      return { ok: true }
    },
    logout() {
      this.token = ''
      this.name = ''
      this.role = ''
      this.studentId = ''
    }
  },
  persist: {
    key: 'dorm-user'
  }
})
