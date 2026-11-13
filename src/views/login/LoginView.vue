<script>
export default {
  name: 'LoginView'
}
</script>

<template>
  <div style="padding: 24px">
    <h2>登录</h2>
    <p style="color: #909399; margin-top: 8px">
      F1 · 负责人：页面开发A ｜ 分支：feature/登录-姓名 ｜ 硬指标：T3（守卫联动）
    </p>
    <el-form label-width="70px" style="max-width: 360px; margin-top: 16px">
      <el-form-item label="用户名"><el-input placeholder="骨架占位，待实现" /></el-form-item>
      <el-form-item label="密码"><el-input type="password" placeholder="骨架占位，待实现" /></el-form-item>
      <el-form-item><el-button type="primary">登录（待实现）</el-button></el-form-item>
    </el-form>
  </div>
</template>
