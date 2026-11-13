import { createRouter, createWebHashHistory } from 'vue-router'

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

// 全局守卫骨架：未登录一律拦到 /login（T3）
// TODO 页面开发A：在此按角色（student/manager）细化放行规则
const WHITE_LIST = ['/login', '/mobile/repair']

router.beforeEach((to) => {
  const logged = !!localStorage.getItem('dorm-user')
  if (!WHITE_LIST.includes(to.path) && !logged) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
