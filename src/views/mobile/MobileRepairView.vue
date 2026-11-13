<script>
export default {
  name: 'MobileRepairView'
}
</script>

<template>
  <!-- T4 移动端场景：学生端"报修提交 + 我的报修进度"，Vant 页面在手机壳容器内展示 -->
  <div class="phone-shell">
    <div style="padding: 16px">
      <h3 style="margin: 8px 0 12px">宿舍报修（移动端）</h3>
      <p style="color: #969799; font-size: 13px">
        负责人：移动端+UI ｜ 分支：feature/移动端报修-姓名 ｜ 硬指标：T4（van-form / van-field / van-steps）
      </p>
      <van-empty description="页面建设中（骨架占位）" />
    </div>
  </div>
</template>
