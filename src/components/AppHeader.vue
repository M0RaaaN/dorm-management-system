<script>
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

/**
 * 全局顶栏（三个 PC 页面共用：楼栋列表 / 报修工单 / 学生管理）
 * 职责：品牌标识 + 主导航（按登录角色显隐）+ 用户菜单（个人中心 / 退出）
 * 原各页内联页头由此组件统一，保持 Element Plus 布局一致（分工表「UI 统一」要求）
 */
export default {
  name: 'AppHeader',
  computed: {
    user() {
      return useUserStore()
    }
  },
  methods: {
    onUserCommand(cmd) {
      if (cmd === 'logout') {
        this.user.logout()
        ElMessage.success('已退出登录')
        this.$router.push('/login')
      } else if (cmd === 'center') {
        this.$router.push('/center')
      }
    }
  }
}
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <span class="logo">宿</span>
      <span class="sys-name">高校宿舍管理系统</span>
    </div>

    <nav class="nav">
      <router-link class="nav-link" to="/buildings">楼栋 / 寝室</router-link>
      <router-link class="nav-link" to="/repairs">报修工单</router-link>
      <router-link v-if="user.isManager" class="nav-link" to="/admin/students">
        学生管理
      </router-link>
    </nav>

    <div class="right">
      <span class="role-chip">{{ user.isManager ? '宿管' : '学生' }} · {{ user.name }}</span>
      <el-dropdown trigger="click" @command="onUserCommand">
        <span class="user-chip">▾</span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="center">个人中心</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 56px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e6edf5;
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  border-radius: 8px;
  background: #3f7fcb;
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}

.sys-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  white-space: nowrap;
}

.nav {
  flex: 1;
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #475669;
  text-decoration: none;
}

.nav-link:hover {
  background: #f0f6fd;
  color: #3f7fcb;
}

/* 当前页高亮（vue-router 自动加的激活类） */
.nav-link.router-link-active {
  background: #e8f1fb;
  color: #2b6cb5;
  font-weight: 600;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-chip {
  font-size: 13px;
  color: #475669;
}

.user-chip {
  cursor: pointer;
  font-size: 13px;
  color: #475669;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #e6edf5;
  background: #fafcfe;
}

.user-chip:hover {
  border-color: #b9d3f2;
}
</style>
