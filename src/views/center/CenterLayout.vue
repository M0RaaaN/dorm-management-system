<script>
export default {
  name: 'CenterLayout'
}
</script>

<template>
  <div style="padding: 24px">
    <h2>个人中心</h2>
    <p style="color: #909399; margin-top: 8px">
      F5 · 负责人：页面开发A ｜ 分支：feature/个人中心-姓名 ｜ 硬指标：T3（嵌套路由外壳）+ T4（Menu/Container）
    </p>
    <el-menu mode="horizontal" style="margin-top: 16px">
      <el-menu-item index="my-room">我的寝室</el-menu-item>
      <el-menu-item index="my-repairs">我的报修</el-menu-item>
    </el-menu>
    <router-view style="margin-top: 16px" />
  </div>
</template>
