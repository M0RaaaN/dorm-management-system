<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import AppHeader from '../../components/AppHeader.vue'
import { getBuildings, getRooms, getStudents, putStudent, putRoom } from '../../api/dorm'

/**
 * F3 学生入住 / 调宿 / 退宿（页面开发B · 分支 feature/入住调宿-姓名 · 硬指标 T4/T5）
 * 核心点：
 *  - 三种业务全部走 Dialog 表单（入住 / 调宿）或确认框（退宿），提交后 PUT 更新
 *  - 数据一致性：学生实体（roomId/buildingId）与寝室实体（students 床位数组）必须同步更新，
 *    任一 PUT 失败即整体报错并重新拉取数据对齐界面（不留半套状态）
 *  - 调宿 = 旧寝室 PUT（移出）+ 新寝室 PUT（移入）+ 学生 PUT，三次更新
 */
const STATUS_LABEL = { empty: '未分配', assigned: '在住' }

export default {
  name: 'StudentsView',
  components: { AppHeader },
  data() {
    return {
      students: [],
      rooms: [],
      buildings: [],
      loading: false,
      loadError: false,
      keyword: '', // 关键词过滤（computed 实现，报告 3.3 复杂度分析对象）
      // Dialog 状态：mode = checkin(入住) | transfer(调宿)
      dialog: {
        visible: false,
        mode: 'checkin',
        student: null,
        form: { buildingId: null, roomId: null },
        submitting: false
      }
    }
  },
  computed: {
    // 关键词过滤：命中姓名或学号（n 条数据 × 关键词长度 m，O(n·m)）
    filteredStudents() {
      const k = this.keyword.trim().toLowerCase()
      if (!k) return this.students
      return this.students.filter(
        (s) => s.name.toLowerCase().includes(k) || String(s.studentId).includes(k)
      )
    },
    // 未分配学生（入住对话框候选）
    unassignedStudents() {
      return this.students.filter((s) => !s.roomId)
    },
    // 当前选中楼栋下「有空床」的寝室（入住 / 调宿的目标候选）
    candidateRooms() {
      if (!this.dialog.form.buildingId) return []
      return this.rooms
        .filter((r) => r.buildingId === this.dialog.form.buildingId && this.freeOf(r) > 0)
        .map((r) => ({ ...r, free: this.freeOf(r) }))
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    async init() {
      this.loading = true
      this.loadError = false
      const [buildings, rooms, students] = await Promise.all([
        getBuildings(),
        getRooms(),
        getStudents()
      ])
      this.loading = false
      if (buildings === null || rooms === null || students === null) {
        this.loadError = true
        this.buildings = this.rooms = this.students = []
        return
      }
      this.buildings = buildings
      this.rooms = rooms
      this.students = students
    },
    freeOf(room) {
      return (room.capacity || 0) - (room.students || []).length
    },
    roomOf(student) {
      return this.rooms.find((r) => r.id === student.roomId) || null
    },
    roomLabel(room) {
      const b = this.buildings.find((x) => x.id === room.buildingId)
      return `${b ? b.name : ''} ${room.roomNo} 寝`
    },
    studentRoomText(student) {
      const room = this.roomOf(student)
      return room ? this.roomLabel(room) : '—'
    },
    statusType(student) {
      return student.roomId ? 'success' : 'info'
    },
    statusText(student) {
      return student.roomId ? STATUS_LABEL.assigned : STATUS_LABEL.empty
    },

    /* ---------- Dialog 开关 ---------- */
    openCheckin(student) {
      this.dialog.mode = 'checkin'
      this.dialog.student = student
      this.dialog.form.buildingId = null
      this.dialog.form.roomId = null
      this.dialog.visible = true
    },
    openTransfer(student) {
      this.dialog.mode = 'transfer'
      this.dialog.student = student
      // 默认聚焦学生当前楼栋，方便同楼调宿
      const cur = this.roomOf(student)
      this.dialog.form.buildingId = cur ? cur.buildingId : null
      this.dialog.form.roomId = null
      this.dialog.visible = true
    },
    // 楼栋切换后清空已选寝室（候选列表联动）
    onDialogBuildingChange() {
      this.dialog.form.roomId = null
    },
    dialogTitle() {
      return this.dialog.mode === 'checkin' ? '学生入住' : '调宿'
    },

    /* ---------- F3 三大操作（全部 PUT）---------- */
    async submitDialog() {
      const { mode, student, form } = this.dialog
      if (!form.roomId) {
        ElMessage.warning('请选择寝室')
        return
      }
      if (this.dialog.submitting) return
      this.dialog.submitting = true

      const targetRoom = this.rooms.find((r) => r.id === form.roomId)
      const curRoom = this.roomOf(student)

      // 组装 PUT 请求体（json-server 全量替换）
      const studentBody = {
        ...student,
        buildingId: targetRoom.buildingId,
        roomId: targetRoom.id
      }
      const moves = [] // 待执行的寝室 PUT 列表
      if (curRoom) {
        // 入住无旧寝室；调宿需把学生移出旧寝室
        moves.push(putRoom(curRoom.id, { ...curRoom, students: (curRoom.students || []).filter((id) => id !== student.id) }))
      }
      moves.push(putRoom(targetRoom.id, { ...targetRoom, students: [...(targetRoom.students || []), student.id] }))

      const [studentRes, ...roomRes] = await Promise.all([putStudent(student.id, studentBody), ...moves])
      this.dialog.submitting = false

      // 任一 PUT 失败（返回 null）：报错并整体重拉，保证界面与数据一致
      if (studentRes === null || roomRes.some((r) => r === null)) {
        ElMessage.error('操作失败：接口服务不可用或数据冲突，已重新加载数据')
        this.dialog.visible = false
        this.init()
        return
      }

      ElMessage.success(
        `${student.name} 已${mode === 'checkin' ? '入住' : '调宿至'} ${this.roomLabel(targetRoom)}`
      )
      this.dialog.visible = false
      this.init()
    },
    // 退宿：确认框 → 学生 PUT（roomId 置空）+ 寝室 PUT（移出床位数组）
    async checkout(student) {
      const room = this.roomOf(student)
      if (!room) return
      try {
        await ElMessageBox.confirm(`确认让 ${student.name}（${student.studentId}）退宿 ${this.roomLabel(room)}？`, '退宿确认', {
          type: 'warning',
          confirmButtonText: '确认退宿',
          cancelButtonText: '取消'
        })
      } catch {
        return // 用户取消
      }
      const studentBody = { ...student, buildingId: null, roomId: null }
      const roomBody = { ...room, students: (room.students || []).filter((id) => id !== student.id) }
      const [s1, s2] = await Promise.all([putStudent(student.id, studentBody), putRoom(room.id, roomBody)])
      if (s1 === null || s2 === null) {
        ElMessage.error('退宿失败：接口服务不可用，已重新加载数据')
        this.init()
        return
      }
      ElMessage.success(`${student.name} 已退宿`)
      this.init()
    }
  }
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="page-body">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          class="search"
          placeholder="按姓名 / 学号搜索"
          clearable
          :prefix-icon="'Search'"
        />
        <span class="toolbar-tip">
          共 {{ filteredStudents.length }} 名学生 · 未分配 {{ unassignedStudents.length }} 人
        </span>
        <el-button class="refresh" text @click="init">刷新</el-button>
      </div>

      <el-table :data="filteredStudents" v-loading="loading" border stripe row-key="id">
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="100" align="center" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="phone" label="联系电话" width="130" align="center" />

        <el-table-column label="在住寝室" min-width="180">
          <template #default="{ row }">{{ studentRoomText(row) }}</template>
        </el-table-column>

        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row)">{{ statusText(row) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.roomId" type="primary" link size="small" @click="openCheckin(row)">
              入住
            </el-button>
            <template v-else>
              <el-button type="primary" link size="small" @click="openTransfer(row)">调宿</el-button>
              <el-button type="danger" link size="small" @click="checkout(row)">退宿</el-button>
            </template>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty
            :description="
              loadError
                ? '接口服务不可用：请确认已运行 npm run server（json-server :3001）'
                : keyword
                  ? '没有匹配的学生'
                  : '暂无学生数据'
            "
          />
        </template>
      </el-table>
    </main>

    <!-- F3 入住 / 调宿 Dialog 表单 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialogTitle()"
      width="440px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border size="small" class="dlg-stu">
        <el-descriptions-item label="学生">{{ dialog.student?.name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ dialog.student?.studentId }}</el-descriptions-item>
        <el-descriptions-item v-if="dialog.mode === 'transfer'" label="当前寝室" :span="2">
          {{ dialog.student ? studentRoomText(dialog.student) : '—' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-form label-width="70px" class="dlg-form">
        <el-form-item label="目标楼栋">
          <el-select
            v-model="dialog.form.buildingId"
            placeholder="选择楼栋"
            style="width: 100%"
            @change="onDialogBuildingChange"
          >
            <el-option v-for="b in buildings" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标寝室">
          <el-select
            v-model="dialog.form.roomId"
            placeholder="先选楼栋，再选有空床的寝室"
            style="width: 100%"
            :disabled="!dialog.form.buildingId"
          >
            <el-option
              v-for="r in candidateRooms"
              :key="r.id"
              :label="`${r.roomNo} 寝 · 余 ${r.free} 床`"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="dialog.submitting"
          :disabled="!dialog.form.roomId"
          @click="submitDialog"
        >
          {{ dialog.mode === 'checkin' ? '确认入住' : '确认调宿' }}
        </el-button>
      </template>
    </el-dialog>
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
  max-width: 1240px;
  margin: 0 auto;
  padding: 20px 24px 32px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.search {
  width: 240px;
}

.toolbar-tip {
  font-size: 13px;
  color: #8a97a8;
}

.refresh {
  margin-left: auto;
}

.dlg-stu {
  margin-bottom: 16px;
}

.dlg-form {
  margin-top: 4px;
}
</style>
