<script>
import { ElMessage } from 'element-plus'
import AppHeader from '../../components/AppHeader.vue'
import {
  getRooms,
  getStudents,
  getRepairs,
  postRepair,
  putRepair,
  getStudentByStudentId
} from '../../api/dorm'
import { useUserStore } from '../../stores/user'

/**
 * F4 报修提交与处理（页面开发A · 分支 feature/报修-姓名 · 硬指标 T5 + E7）
 * 核心点：
 *  - 角色分流渲染：学生 = 提交表单（POST）+ 我的报修；宿管 = 全部工单处理（PUT）
 *  - 状态流转（题目册技术侧重）：待处理 --开始处理--> 处理中 --标记完成--> 已完成
 *  - E7 报修历史筛选：radio 按状态过滤（dev 走 json-server ?status= 查询参数）
 */
const STATUS_FLOW = {
  // 状态 → 下一状态 + 按钮
  待处理: { next: '处理中', action: '开始处理' },
  处理中: { next: '已完成', action: '标记完成' },
  已完成: { next: null, action: '' }
}
const STATUS_TAG_TYPE = { 待处理: 'danger', 处理中: 'primary', 已完成: 'success' }

export default {
  name: 'RepairsView',
  components: { AppHeader },
  data() {
    return {
      user: useUserStore(),
      repairs: [],
      rooms: [],
      studentMap: {}, // reporterId → 学生姓名
      myStudent: null, // 学生登录者对应的学生记录（含数字 id / roomId）
      statusFilter: '全部', // E7 状态筛选
      loading: false,
      loadError: false,
      form: { desc: '' }, // 学生提交表单
      submitting: false,
      formRules: {
        desc: [
          { required: true, message: '请描述故障情况', trigger: 'blur' },
          { min: 5, max: 100, message: '5 - 100 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    statuses() {
      return ['全部', '待处理', '处理中', '已完成']
    },
    // 学生视角：只看自己提交的（reporterId = 学生数字 id）
    visibleRepairs() {
      if (this.user.isManager) {
        return this.statusFilter === '全部' ? this.repairs : this.repairs.filter((r) => r.status === this.statusFilter)
      }
      const myId = this.myStudent ? this.myStudent.id : -1
      const mine = this.repairs.filter((r) => r.reporterId === myId)
      return this.statusFilter === '全部' ? mine : mine.filter((r) => r.status === this.statusFilter)
    },
    // 我的寝室（提交表单展示，只读）
    myRoomText() {
      if (!this.myStudent || !this.myStudent.roomId) return '未分配寝室'
      const room = this.rooms.find((r) => r.id === this.myStudent.roomId)
      return room ? `${room.roomNo} 寝` : '—'
    },
    canSubmit() {
      return !!this.myStudent && !!this.myStudent.roomId
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    async init() {
      this.loading = true
      this.loadError = false
      // 学生需先按学号定位自己的学生记录（拿到数字 id 与所在寝室）
      const tasks = [getRepairs(), getRooms(), getStudents()]
      if (!this.user.isManager && this.user.studentId) {
        tasks.push(getStudentByStudentId(this.user.studentId))
      }
      const [repairs, rooms, students, myStudent] = await Promise.all(tasks)
      this.loading = false
      if (repairs === null || rooms === null || students === null) {
        this.loadError = true
        this.repairs = this.rooms = []
        return
      }
      this.repairs = repairs
      this.rooms = rooms
      this.studentMap = {}
      students.forEach((s) => {
        this.studentMap[s.id] = s.name
      })
      if (myStudent !== undefined) {
        // getStudentByStudentId 兜底返回 null（接口不可用），不影响主列表展示
        this.myStudent = myStudent
        if (myStudent === null) {
          ElMessage.warning('未能定位你的学生档案，报修提交暂不可用')
        }
      }
    },
    roomText(roomId) {
      const room = this.rooms.find((r) => r.id === roomId)
      return room ? `${room.roomNo} 寝` : `#${roomId}`
    },
    reporterText(reporterId) {
      return this.studentMap[reporterId] || `#${reporterId}`
    },
    statusTagType(status) {
      return STATUS_TAG_TYPE[status] || 'info'
    },
    flowInfo(row) {
      return STATUS_FLOW[row.status] || { next: null, action: '' }
    },

    /* ---------- 学生：提交报修（POST）---------- */
    async submitRepair() {
      try {
        await this.$refs.repairForm.validate()
      } catch {
        return
      }
      if (!this.canSubmit || this.submitting) return
      this.submitting = true
      // 新工单：状态从「待处理」起步，走完整状态流转链
      const repair = {
        roomId: this.myStudent.roomId,
        desc: this.form.desc.trim(),
        status: '待处理',
        date: new Date().toISOString().slice(0, 10),
        reporterId: this.myStudent.id
      }
      const res = await postRepair(repair)
      this.submitting = false
      if (res === null) {
        ElMessage.error('提交失败：接口服务不可用，请确认已运行 npm run server')
        return
      }
      ElMessage.success('报修已提交，等待宿管处理')
      this.form.desc = ''
      this.init()
    },

    /* ---------- 宿管：状态流转（PUT）---------- */
    async advance(row) {
      const { next, action } = this.flowInfo(row)
      if (!next) return
      // put 全量对象（json-server 全量替换）
      const res = await putRepair(row.id, { ...row, status: next })
      if (res === null) {
        ElMessage.error(`${action}失败：接口服务不可用`)
        this.init()
        return
      }
      ElMessage.success(`工单已${action}，当前状态：${next}`)
      this.init()
    }
  }
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="page-body">
      <!-- E7 报修历史筛选（按状态） -->
      <div class="toolbar">
        <el-radio-group v-model="statusFilter">
          <el-radio-button v-for="s in statuses" :key="s" :value="s">{{ s }}</el-radio-button>
        </el-radio-group>
        <span class="toolbar-tip">
          <template v-if="user.isManager">全部工单 {{ visibleRepairs.length }} 条</template>
          <template v-else>我的报修 {{ visibleRepairs.length }} 条</template>
        </span>
        <span v-if="!user.isManager" class="flow-legend">
          流转：待处理 → 处理中 → 已完成
        </span>
      </div>

      <!-- 学生端：提交报修（POST） -->
      <el-card v-if="!user.isManager" class="submit-card" shadow="never">
        <template #header><b>提交报修</b></template>
        <el-form
          ref="repairForm"
          :model="form"
          :rules="formRules"
          label-position="top"
          :disabled="!canSubmit"
        >
          <el-form-item label="报修寝室">
            <el-input :model-value="myRoomText" disabled style="width: 220px" />
          </el-form-item>
          <el-form-item label="故障描述" prop="desc">
            <el-input
              v-model="form.desc"
              type="textarea"
              :rows="3"
              maxlength="100"
              show-word-limit
              placeholder="例：水龙头漏水，关不紧"
            />
          </el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="submitRepair"
          >
            提交报修
          </el-button>
        </el-form>
        <el-alert v-if="!canSubmit" type="warning" :closable="false" title="未分配寝室，暂无法提交报修" />
      </el-card>

      <!-- 工单列表（宿管 = 全部 + 处理操作；学生 = 我的报修） -->
      <el-table :data="visibleRepairs" v-loading="loading" border stripe row-key="id">
        <el-table-column prop="id" label="工单号" width="80" align="center" />
        <el-table-column label="寝室" width="100" align="center">
          <template #default="{ row }">{{ roomText(row.roomId) }}</template>
        </el-table-column>
        <el-table-column prop="desc" label="故障描述" min-width="180" />
        <el-table-column label="报修人" width="100" align="center">
          <template #default="{ row }">{{ reporterText(row.reporterId) }}</template>
        </el-table-column>
        <el-table-column prop="date" label="报修日期" width="110" align="center" />

        <el-table-column label="状态" width="92" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column v-if="user.isManager" label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="flowInfo(row).next"
              type="primary"
              link
              size="small"
              @click="advance(row)"
            >
              {{ flowInfo(row).action }}
            </el-button>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty
            :description="
              loadError
                ? '接口服务不可用：请确认已运行 npm run server（json-server :3001）'
                : statusFilter === '全部'
                  ? '暂无报修工单'
                  : `暂无「${statusFilter}」的工单`
            "
          />
        </template>
      </el-table>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  background: #f5f8fc;
  display: flex;
  flex-direction: column;
}

.page-body {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 24px 32px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.toolbar-tip {
  font-size: 13px;
  color: #8a97a8;
}

.flow-legend {
  margin-left: auto;
  font-size: 12px;
  color: #a8abb2;
}

.submit-card {
  margin-bottom: 16px;
  border: 1px solid #e6edf5;
}

.muted {
  color: #c0c4cc;
}
</style>
