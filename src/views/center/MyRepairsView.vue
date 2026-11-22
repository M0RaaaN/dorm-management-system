<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0; color: #303133;">报修记录</h3>
      
      <div style="display: flex; gap: 16px; align-items: center;">
        <el-radio-group v-model="currentStatus" size="default">
          <el-radio-button label="待受理" value="待受理" />
          <el-radio-button label="处理中" value="处理中" />
          <el-radio-button label="已完成" value="已完成" />
          <el-radio-button label="已撤销" value="已撤销" />
        </el-radio-group>
        <el-button type="success" icon="Plus" @click="openAddDialog">新增报修</el-button>
      </div>
    </div>

    <el-table :data="filteredData" border style="width: 100%">
      <el-table-column prop="id" label="单号" width="80" />
      <el-table-column prop="submitTime" label="报修时间" width="160" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="desc" label="报修内容" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getTagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="showRepairDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- =============================== -->
    <!-- 1. 报修详情弹窗 -->
    <!-- =============================== -->
    <el-dialog v-model="dialogVisible" title="报修单详情" width="550px" align-center>
      <div v-if="currentRepair" class="repair-detail">
        <h4>基础信息</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="单号">#RP{{ currentRepair.id }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ currentRepair.reporter }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ currentRepair.location }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentRepair.type }}</el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <span :style="{ color: currentRepair.urgency === '紧急' ? '#f56c6c' : '#606266' }">
              {{ currentRepair.urgency }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentRepair.phone }}</el-descriptions-item>
        </el-descriptions>

        <!-- 现场图片 -->
        <div v-if="currentRepair.images && currentRepair.images.length > 0" style="margin-top: 16px;">
          <strong>现场图片：</strong>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <el-image 
              v-for="(img, index) in currentRepair.images" 
              :key="index"
              style="width: 80px; height: 80px; border-radius: 4px;"
              :src="img" 
              :preview-src-list="currentRepair.images"
              fit="cover"
            />
          </div>
        </div>

        <h4 style="margin-top: 20px;">处理进度</h4>
        <el-steps :active="getStepActive(currentRepair.status)" align-center direction="vertical" style="height: 160px;">
          <el-step title="提交" :description="currentRepair.submitTime" />
          <el-step title="待受理" :description="currentRepair.status === '待受理' ? '等待派单' : ''" />
          <el-step title="处理中" :description="currentRepair.worker ? `师傅 ${currentRepair.worker}` : ''" />
          <el-step title="完成" :description="currentRepair.finishTime || ''" />
        </el-steps>

        <!-- 维修结果说明 -->
        <div style="margin-top: 10px; background: #f7f8fa; padding: 12px; border-radius: 6px;">
          <strong>{{ currentRepair.status === '已完成' ? '维修结果说明：' : '处理说明：' }}</strong> 
          <span style="color: #606266;">{{ currentRepair.processNote || '暂无说明' }}</span>
        </div>
        
        <!-- 撤销原因展示 -->
        <div v-if="currentRepair.status === '已撤销'" style="margin-top: 16px; background: #fef0f0; padding: 12px; border-radius: 6px; border: 1px solid #fde2e2;">
          <p style="margin: 0; color: #f56c6c; line-height: 1.8;">
            <strong>撤销时间：</strong> {{ currentRepair.cancelTime }}<br>
            <strong>撤销原因：</strong> {{ currentRepair.cancelReason }}
          </p>
        </div>

        <!-- 评价结果展示 -->
        <div v-if="currentRepair.rating" style="margin-top: 16px; background: #fdf6ec; padding: 12px; border-radius: 6px; border: 1px solid #faecd8;">
          <p style="margin: 0; color: #e6a23c; margin-bottom: 8px;">
            <strong>用户评价：</strong> 
            <el-rate v-model="currentRepair.rating" disabled show-score text-color="#ff9900" />
          </p>
          <p style="margin: 0; color: #606266; font-size: 14px;">
            <strong>评价内容：</strong> {{ currentRepair.ratingComment || '用户未填写文字评价' }}
          </p>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button v-if="currentRepair && currentRepair.status === '待受理'" type="danger" plain @click="handleCancelRepair">撤销报修</el-button>
          <el-button v-if="currentRepair && currentRepair.status === '已完成' && !currentRepair.rating" type="warning" @click="openRateDialog">满意度评价</el-button>
          <el-button type="primary" @click="dialogVisible = false">关闭详情</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- =============================== -->
    <!-- 2. 新增报修弹窗 -->
    <!-- =============================== -->
    <el-dialog v-model="addDialogVisible" title="新增报修" width="500px" align-center>
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="90px">
        <el-form-item label="报修类型" prop="type">
          <el-select v-model="addForm.type" placeholder="请选择" style="width: 100%;">
            <el-option label="水电" value="水电" /><el-option label="家具" value="家具" />
            <el-option label="空调" value="空调" /><el-option label="门锁" value="门锁" /><el-option label="网络" value="网络" />
          </el-select>
        </el-form-item>
        <el-form-item label="报修位置" prop="location">
          <el-input v-model="addForm.location"></el-input>
        </el-form-item>
        <el-form-item label="问题描述" prop="desc">
          <el-input type="textarea" v-model="addForm.desc" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="现场图片">
          <el-upload action="#" :auto-upload="false" list-type="picture-card" :on-change="handleImageUpload">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-radio-group v-model="addForm.urgency">
            <el-radio label="一般" value="一般" /><el-radio label="紧急" value="紧急" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="联系人/电话">
          <el-input v-model="addForm.contact" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddForm">提交报修</el-button>
      </template>
    </el-dialog>

    <!-- =============================== -->
    <!-- 3. 满意度评价弹窗 -->
    <!-- =============================== -->
    <el-dialog v-model="showRateDialog" title="满意度评价" width="450px" align-center>
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="font-size: 16px; color: #606266; margin-bottom: 10px;">请对本次维修服务进行评价</p>
        <el-rate v-model="rateForm.score" show-text :texts="['极差', '失望', '一般', '满意', '惊喜']" size="large" />
      </div>
      <el-input v-model="rateForm.comment" type="textarea" :rows="3" placeholder="请留下您的宝贵意见（选填）" maxlength="100" show-word-limit></el-input>
      <template #footer>
        <el-button @click="showRateDialog = false">取消</el-button>
        <el-button type="warning" @click="submitRate">提交评价</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const currentStatus = ref('待受理')

// 模拟全状态数据
const allRepairs = ref([
  { id: 1, submitTime: '2023-12-01 09:20', reporter: '张三', location: 'A栋 302室', urgency: '紧急', type: '水电', desc: '寝室空调漏水', status: '待受理', phone: '138****1111', images: [] },
  { id: 2, submitTime: '2023-11-28 14:30', reporter: '张三', location: 'A栋 302室', urgency: '一般', type: '家具', desc: '宿舍门锁坏了', status: '处理中', worker: '王师傅', processNote: '带工具前往处理中', phone: '138****1111', images: [] },
  { id: 3, submitTime: '2023-11-20 08:15', reporter: '张三', location: 'A栋 302室', urgency: '一般', type: '水电', desc: '阳台灯泡不亮', status: '已完成', worker: '李师傅', finishTime: '2023-11-20 15:30', processNote: '已更换全新LED灯泡', phone: '138****1111', images: [] },
  { id: 4, submitTime: '2023-11-15 10:00', reporter: '张三', location: 'A栋 302室', urgency: '一般', type: '网络', desc: '网线接口松动', status: '已撤销', cancelTime: '2023-11-15 10:30', cancelReason: '自己能修好', phone: '138****1111', images: [] }
])

const filteredData = computed(() => allRepairs.value.filter(item => item.status === currentStatus.value))

const getTagType = (status) => {
  const map = { '待受理': 'danger', '处理中': 'warning', '已完成': 'success', '已撤销': 'info' }
  return map[status] || 'info'
}

// --- 详情弹窗逻辑 ---
const dialogVisible = ref(false)
const currentRepair = ref(null)
const showRepairDetail = (row) => {
  currentRepair.value = row
  dialogVisible.value = true
}

// --- 撤销逻辑 ---
const handleCancelRepair = () => {
  ElMessageBox.prompt('请输入撤销报修的原因', '撤销确认', {
    confirmButtonText: '确认撤销',
    cancelButtonText: '取消',
    inputPlaceholder: '例如：我自己修好了 / 填错了...',
    inputValidator: (value) => {
      if (!value) return '撤销原因不能为空哦！'
      return true
    }
  }).then(({ value }) => {
    const target = allRepairs.value.find(item => item.id === currentRepair.value.id)
    if (target) {
      target.status = '已撤销'
      target.cancelTime = new Date().toLocaleString()
      target.cancelReason = value
      ElMessage.success('报修单已撤销')
      dialogVisible.value = false
      currentStatus.value = '已撤销' 
    }
  }).catch(() => {})
}

const getStepActive = (status) => {
  if (status === '待受理') return 1
  if (status === '处理中') return 2
  if (status === '已完成') return 3
  if (status === '已撤销') return 0
  return 0
}

// --- 新增报修逻辑 ---
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = ref({ location: 'A栋 302室', contact: '张三 (138****1111)', type: '', urgency: '一般', desc: '' })
const addRules = {
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  desc: [{ required: true, message: '请填写描述', trigger: 'blur' }]
}

const handleImageUpload = (file) => {
  addForm.value.images = [URL.createObjectURL(file.raw)]
}

const openAddDialog = () => {
  addForm.value = { location: 'A栋 302室', contact: '张三 (138****1111)', type: '', urgency: '一般', desc: '' }
  addDialogVisible.value = true
}

const submitAddForm = () => {
  addFormRef.value.validate((valid) => {
    if (valid) {
      const now = new Date()
      const newRepair = {
        id: allRepairs.value.length + 1,
        submitTime: now.toLocaleString(),
        reporter: '张三', phone: '138****1111',
        location: addForm.value.location, urgency: addForm.value.urgency, type: addForm.value.type, desc: addForm.value.desc,
        status: '待受理', processNote: null, images: addForm.value.images || []
      }
      allRepairs.value.unshift(newRepair)
      ElMessage.success('报修提交成功！')
      addDialogVisible.value = false
      currentStatus.value = '待受理'
    }
  })
}

// --- 满意度评价逻辑 ---
const showRateDialog = ref(false)
const rateForm = ref({ score: 5, comment: '' })

const openRateDialog = () => {
  rateForm.value = { score: 5, comment: '' }
  showRateDialog.value = true
}

const submitRate = () => {
  if (rateForm.value.score === 0) return ElMessage.warning('请至少给一颗星哦！')
  
  const target = allRepairs.value.find(item => item.id === currentRepair.value.id)
  if (target) {
    target.rating = rateForm.value.score
    target.ratingComment = rateForm.value.comment
    currentRepair.value.rating = rateForm.value.score
    currentRepair.value.ratingComment = rateForm.value.comment
  }
  ElMessage.success('感谢您的评价！')
  showRateDialog.value = false
}
</script>

<style scoped>
.repair-detail { font-size: 14px; color: #333; }
.repair-detail h4 { margin: 0 0 12px 0; font-size: 15px; color: #303133; border-left: 3px solid #409eff; padding-left: 8px; }
:deep(.el-step__head.is-success) { color: #67c23a; border-color: #67c23a; }
:deep(.el-step__title.is-success) { color: #67c23a; }
</style>