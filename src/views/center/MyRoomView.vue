<template>
  <div>
    <!-- 1. 个人主卡 -->
    <el-card class="profile-header" shadow="hover" @click="showProfileDialog = true" style="cursor: pointer; margin-bottom: 24px;">
      <div class="user-profile">
        <div class="avatar-section">
          <el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="user-avatar" />
        </div>
        <div class="info-section">
          <h2>
            {{ myInfo.name }} <el-tag size="small" type="success" effect="dark" round>学生</el-tag>
            <el-tag size="small" type="info" effect="plain" style="margin-left: 8px;">
              在寝 (最近: {{ myInfo.lastReturn }})
            </el-tag>
          </h2>
          <p class="sub-info">
            <span>学号：{{ myInfo.studentId }}</span><el-divider direction="vertical" /><span>专业：{{ myInfo.major }}</span>
          </p>
        </div>
        <div class="contact-section">
          <div class="view-profile-link"><span>查看档案</span><el-icon style="margin-left: 4px;"><ArrowRight /></el-icon></div>
        </div>
      </div>
    </el-card>

    <!-- 2. 寝室信息 -->
    <h3 style="margin-top: 0; color: #303133; border-left: 4px solid #409eff; padding-left: 8px;">寝室信息</h3>
    <el-descriptions border :column="2" style="margin-bottom: 24px;">
      <el-descriptions-item label="楼栋">A栋</el-descriptions-item>
      <el-descriptions-item label="寝室号">302室</el-descriptions-item>
      <el-descriptions-item label="房型">四人间</el-descriptions-item>
      <el-descriptions-item label="床位">{{ myInfo.bed }}</el-descriptions-item>
    </el-descriptions>

    <!-- 3. 室友列表 -->
    <h3 style="margin-top: 24px; color: #303133; border-left: 4px solid #409eff; padding-left: 8px;">室友列表 (点击查看详情)</h3>
    <el-table :data="roommates" border style="width: 100%">
      <el-table-column label="头像" width="80" align="center">
        <template #default><el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" /></template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="studentId" label="学号" width="120" /> 
      <el-table-column prop="major" label="专业" />
      <el-table-column prop="bed" label="床位" width="100" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="showRoommateDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 4. 个人档案弹窗 (明文电话，补充字段) -->
    <el-dialog v-model="showProfileDialog" title="个人档案" width="550px" align-center>
      <div class="profile-detail-content">
        <div class="dialog-header"><el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" /><h2>{{ myInfo.name }}</h2></div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学号">{{ myInfo.studentId }}</el-descriptions-item>
          <el-descriptions-item label="出生日期">{{ myInfo.birthday }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ myInfo.className }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ myInfo.major }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ myInfo.college }}</el-descriptions-item>
          <el-descriptions-item label="民族">{{ myInfo.ethnicity }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ myInfo.age }}</el-descriptions-item>
          <el-descriptions-item label="辅导员">{{ myInfo.counselor }}</el-descriptions-item>
          <el-descriptions-item label="政治面貌">{{ myInfo.politics }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">
            <!-- 本人看自己，明文展示 -->
            <span style="color: #409eff;">{{ myInfo.phone }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="邮箱" :span="2">{{ myInfo.email }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button type="danger" plain @click="openPwdDialog">修改密码</el-button>
        <el-button @click="showProfileDialog = false">关闭详情</el-button>
      </template>
    </el-dialog>

    <!-- 5. 修改密码弹窗 (逻辑不变，省略...) -->
    <el-dialog v-model="showPwdDialog" title="修改密码" width="420px" align-center>
       <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="90px">
        <el-form-item label="旧密码" prop="oldPwd"><el-input v-model="pwdForm.oldPwd" type="password" show-password></el-input></el-form-item>
        <el-form-item label="新密码" prop="newPwd"><el-input v-model="pwdForm.newPwd" type="password" show-password></el-input></el-form-item>
        <el-form-item label="确认新密码" prop="confirmPwd"><el-input v-model="pwdForm.confirmPwd" type="password" show-password></el-input></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPwdDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPwdForm">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 6. 室友详情弹窗 (脱敏，补充性别/政治面貌，按钮统一) -->
    <el-dialog v-model="dialogVisible" title="室友详情" width="420px" align-center>
      <div v-if="currentMate" class="mate-detail">
        <div class="avatar-box"><el-avatar :size="64" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" /></div>
        <p><strong>姓名：</strong> {{ currentMate.name }}</p>
        <p><strong>性别：</strong> {{ currentMate.gender }}</p>
        <p><strong>政治面貌：</strong> {{ currentMate.politics }}</p>
        <p><strong>学号：</strong> {{ currentMate.studentId }}</p>
        <p><strong>班级：</strong> {{ currentMate.className }}</p>
        <p><strong>专业：</strong> {{ currentMate.major }}</p>
        <p><strong>床位：</strong> {{ currentMate.bed }}</p>
        <p><strong>在寝状态：</strong> <el-tag size="small" :type="getStatusColor(currentMate.status)">{{ currentMate.status }}</el-tag></p>
        <p><strong>联系电话：</strong> 
          <!-- 别人看你，脱敏并拨打 -->
          <a :href="'tel:' + currentMate.phone" style="color: #409eff; text-decoration: none;">{{ maskPhone(currentMate.phone) }}</a>
        </p>
        <p><strong>辅导员：</strong> {{ currentMate.counselor }}</p>
      </div>
      <template #footer><el-button type="primary" @click="dialogVisible = false">关闭详情</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const myInfo = ref({ 
  name: '张三', studentId: '20230001', birthday: '2004-05-20', age: 20, 
  major: '软件工程', className: '软工2301', college: '计算机学院', 
  counselor: '李老师', phone: '13900009999', email: '20230001@xx.edu.cn', 
  gender: '男', politics: '共青团员', ethnicity: '汉族', bed: '3号床',
  lastReturn: '昨天 22:30' // 新增：最近归寝时间
})

// 室友数据同步补充
const allRoommates = [
  { name: '李四', studentId: '20230002', className: '计科2301', major: '计算机科学与技术', bed: '1号床', phone: '13900139000', hometown: '江苏南京', status: '在寝', counselor: '王老师', gender: '男', politics: '中共党员' },
  { name: '王五', studentId: '20230003', className: '物联网2301', major: '物联网工程', bed: '2号床', phone: '13700137000', hometown: '浙江杭州', status: '外出', counselor: '赵老师', gender: '女', politics: '共青团员' },
  { name: '赵六', studentId: '20230004', className: '网工2301', major: '网络工程', bed: '4号床', phone: '13600136000', hometown: '四川成都', status: '请假', counselor: '孙老师', gender: '男', politics: '群众' }
]

const roommates = ref(allRoommates.filter(mate => mate.name !== myInfo.value.name))

const showProfileDialog = ref(false)
const dialogVisible = ref(false)
const currentMate = ref(null)

const showRoommateDetail = (row) => {
  currentMate.value = row
  dialogVisible.value = true
}

const maskPhone = (phone) => {
  if (!phone) return '未填写'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const getStatusColor = (status) => {
  if (status === '在寝') return 'success'
  if (status === '外出') return 'warning'
  if (status === '请假') return 'info'
  return 'info'
}

// --- 修改密码逻辑 ---
const showPwdDialog = ref(false)
const pwdFormRef = ref(null)
const pwdForm = ref({ oldPwd: '', newPwd: '', confirmPwd: '' })
const pwdRules = {
  oldPwd: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPwd: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '至少 6 位', trigger: 'blur' }],
  confirmPwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value, callback) => value !== pwdForm.value.newPwd ? callback(new Error('两次密码不一致')) : callback(), trigger: 'blur' }
  ]
}

const openPwdDialog = () => {
  showProfileDialog.value = false
  pwdForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
  showPwdDialog.value = true
}

const submitPwdForm = () => {
  pwdFormRef.value.validate((valid) => {
    if (valid) {
      if (pwdForm.value.oldPwd !== '123456') return ElMessage.error('旧密码不正确！')
      ElMessage.success('密码修改成功！')
      showPwdDialog.value = false
    }
  })
}
</script>

<style scoped>
/* 样式保持原样即可 */
.profile-header { border-radius: 12px; background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border: 1px solid #e1e8ed; transition: transform 0.2s, box-shadow 0.2s; }
.profile-header:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.user-profile { display: flex; align-items: center; justify-content: space-between; padding: 10px; }
.avatar-section { flex-shrink: 0; }
.user-avatar { border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.info-section { flex-grow: 1; margin-left: 20px; }
.info-section h2 { margin: 0 0 8px 0; font-size: 22px; color: #2c3e50; display: flex; align-items: center; }
.sub-info { margin: 0; font-size: 14px; color: #606266; }
.contact-section { text-align: right; }
.view-profile-link { color: #409eff; font-size: 14px; display: flex; align-items: center; justify-content: flex-end; }
.profile-detail-content { padding: 10px; }
.dialog-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
.dialog-header h2 { margin: 12px 0 0 0; color: #303133; }
.mate-detail { line-height: 2; color: #333; }
.mate-detail p { margin: 5px 0; }
.avatar-box { text-align: center; margin-bottom: 16px; }
</style>