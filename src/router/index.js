import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// hash 路由（课程技术口径）：静态托管平台上刷新不会 404（实验15 任务5 受益于此）
// 页面组件全部懒加载 () => import()（T3 硬指标）
const routes = [
  { path: '/', redirect: '/buildings' },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login/LoginView.vue')
  },
  {
    path: '/buildings',
    name: 'buildings',
    component: () => import('../views/buildings/BuildingsView.vue') // F2 楼栋/寝室列表
  },
  {
    path: '/room/:id', // 动态路由（T3：详情页）
    name: 'room-detail',
    component: () => import('../views/room/RoomDetailView.vue')
  },
  {
    path: '/repairs',
    name: 'repairs',
    component: () => import('../views/repairs/RepairsView.vue') // F4 报修提交与处理
  },
  {
    path: '/center', // 嵌套路由（T3：个人中心外壳）
    name: 'center',
    component: () => import('../views/center/CenterLayout.vue'),
    children: [
      { path: '', redirect: 'my-room' },
      {
        path: 'my-room', // F5 我的寝室
        name: 'my-room',
        component: () => import('../views/center/MyRoomView.vue')
      },
      {
        path: 'my-repairs', // F5 我的报修
        name: 'my-repairs',
        component: () => import('../views/center/MyRepairsView.vue')
      }
    ]
  },
  {
    path: '/admin/students',
    name: 'admin-students',
    component: () => import('../views/admin/StudentsView.vue') // F3 入住/调宿/退宿管理
  },
  {
    path: '/mobile/repair',
    name: 'mobile-repair',
    component: () => import('../views/mobile/MobileRepairView.vue') // Vant 移动端（T4）
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// F1 全局前置守卫（T3 硬指标，页面开发A）：白名单放行 → 登录态校验 → 角色权限
// 登录态从 Pinia persist 仓库读取（localStorage key 'dorm-user'），刷新后自动恢复
const WHITE_LIST = ['/login', '/mobile/repair'] // 移动端报修演示页免登录（T4 答辩演示用）
const MANAGER_ONLY = ['/admin'] // 角色专属前缀：/admin/* 仅宿管可进

// 各角色默认主页：宿管看楼栋/寝室列表，学生看个人中心（我的寝室）
function roleHome(role) {
  return role === 'manager' ? '/buildings' : '/center'
}

router.beforeEach((to) => {
  // 在守卫回调内取仓库：首次导航发生时 pinia 已安装（main.js 先 use(pinia) 再 use(router)）
  const user = useUserStore()

  // ① 白名单直接放行；已登录再进 /login 则按角色送回主页，避免重复登录
  if (WHITE_LIST.includes(to.path)) {
    if (to.path === '/login' && user.isLogged) return roleHome(user.role)
    return true
  }

  // ② 未登录一律拦到 /login，并记录来源页供登录后回跳（报告用例 T01）
  if (!user.isLogged) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // ③ 角色权限：管理页仅宿管可进，学生误入时遣返其角色主页
  if (MANAGER_ONLY.some((p) => to.path.startsWith(p)) && !user.isManager) {
    return roleHome(user.role)
  }

  return true
})

export default router
