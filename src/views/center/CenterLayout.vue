<template>
  <div class="center-container">
    <!-- 顶部个人信息头部 (渐变卡片) -->
    <el-card class="profile-header" shadow="hover">
      <div class="user-info">
        <el-avatar :size="64" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
        <div class="text-info">
          <h2>张三 <el-tag size="small" type="success">学生</el-tag></h2>
          <p>学号：20230001 | 软件工程专业 | 辅导员：李老师</p>
        </div>
      </div>
    </el-card>

    <!-- 导航菜单 (悬浮在卡片下方) -->
    <el-card class="menu-card" shadow="never">
      <el-menu
        mode="horizontal"
        router
        :default-active="activePath"
        class="custom-menu"
      >
        <el-menu-item index="/center/my-room">
          <el-icon><HomeFilled /></el-icon>我的寝室
        </el-menu-item>
        <el-menu-item index="/center/my-repairs">
          <el-icon><Tools /></el-icon>我的报修
        </el-menu-item>
      </el-menu>
    </el-card>

    <!-- 子页面内容容器 -->
    <div class="content-area">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Tools } from '@element-plus/icons-vue' // 引入图标

const route = useRoute()
const activePath = computed(() => route.path)
</script>

<style scoped>
.center-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
}

/* 顶部信息卡片 */
.profile-header {
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #e6f7ff 100%);
  border: none;
  margin-bottom: 16px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}
.text-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
}
.text-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 菜单卡片 */
.menu-card {
  border-radius: 12px;
  margin-bottom: 16px;
  border: none;
}
.custom-menu {
  border-bottom: none; /* 去掉底部自带的下划线 */
}
:deep(.el-menu-item) {
  font-size: 15px;
  font-weight: 500;
}

/* 内容区域 */
.content-area {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 路由切换的淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>