<script>
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'

// F1 登录页（页面开发A · 分支 feature/登录-姓名 · 硬指标 T3 守卫联动 / T5 axios）
// 动线：表单校验 → Pinia action（内部 axios 查 json-server users 表）→ 成功写登录态并按角色跳转
export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      // E02 用例：空输入由组件库校验红字拦截，不发请求
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度需为 3 - 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度需为 6 - 20 个字符', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    // 登录后的落地页：优先回跳守卫记录的 redirect（未登录被拦的场景），否则按角色分流
    resolveHome() {
      const userStore = useUserStore()
      const redirect = this.$route.query.redirect
      if (redirect) return String(redirect)
      // 宿管进楼栋/寝室列表；学生进个人中心（我的寝室 / 我的报修）
      return userStore.isManager ? '/buildings' : '/center'
    },
    async handleLogin() {
      try {
        await this.$refs.loginForm.validate()
      } catch {
        return // 校验未通过：红字已提示，直接返回
      }
      if (this.loading) return // 防重复提交
      this.loading = true
      const userStore = useUserStore()
      // 失败原因（服务不可用 / 凭据错误）已在 store 内区分，页面只负责提示
      const res = await userStore.login(this.form.username.trim(), this.form.password)
      this.loading = false
      if (!res.ok) {
        ElMessage.error(res.msg)
        return
      }
      ElMessage.success(`欢迎回来，${userStore.name}`)
      this.$router.push(this.resolveHome())
    }
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <div class="login-head">
        <div class="logo">宿</div>
        <h2 class="title">高校宿舍管理系统</h2>
        <p class="subtitle">G2 · 楼栋床位 / 入住调宿 / 报修工单</p>
      </div>
      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="如 student01 / manager01"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button
          class="login-btn"
          type="primary"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中…' : '登　录' }}
        </el-button>
      </el-form>
      <el-alert class="tips" type="info" :closable="false">
        <template #title>
          测试账号：学生 <b>student01</b> / 123456　　宿管 <b>manager01</b> / 123456
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #eef4fb 0%, #f7fafd 55%, #e8f1fa 100%);
  padding: 24px;
}

.login-card {
  width: 400px;
  border-radius: 12px;
  border: 1px solid #e3ecf5;
}

.login-head {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  width: 52px;
  height: 52px;
  line-height: 52px;
  margin: 0 auto 12px;
  border-radius: 14px;
  background: #3f7fcb;
  color: #fff;
  font-size: 26px;
  font-weight: 600;
}

.title {
  font-size: 20px;
  color: #1f2d3d;
}

.subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #8a97a8;
}

.login-btn {
  width: 100%;
  margin-top: 4px;
  letter-spacing: 4px;
}

.tips {
  margin-top: 16px;
}
</style>
