<script>
import AppHeader from '../../components/AppHeader.vue'
import { getBuildings, getRooms, getStudents } from '../../api/dorm'

/**
 * F2 楼栋 / 寝室列表（页面开发B · 分支 feature/楼栋寝室列表-姓名 · 硬指标 T3/T4/T5）
 * 核心点：
 *  - 一对多数据渲染：楼栋 el-radio-button 筛选 → 按楼栋重拉寝室列表（json-server ?buildingId=）
 *  - 床位入住状态标色（题目册明确要求）：每行按 capacity 渲染床位格子，
 *    已住床位 = 实心绿色块（悬浮显示在住学生姓名），空床位 = 灰色虚线块
 *  - 行级状态标色：满员 el-tag 红 / 可入住绿 / 空寝室灰，入住率 el-progress 渐变
 */
export default {
  name: 'BuildingsView',
  components: { AppHeader },
  data() {
    return {
      buildings: [], // 楼栋列表
      rooms: [], // 当前筛选下的寝室
      studentMap: {}, // 学生 id → 姓名 映射（寝室行的 students 存的是学生 id）
      currentBuilding: 0, // 0 = 全部楼栋
      loading: false,
      loadError: false,
      // 入住率进度条配色：0 灰 → 增长转绿 → 接近满员转橙 → 满员红
      rateColors: [
        { color: '#909399', percentage: 10 },
        { color: '#67c23a', percentage: 70 },
        { color: '#e6a23c', percentage: 99 },
        { color: '#f56c6c', percentage: 100 }
      ]
    }
  },
  computed: {
    // 表格行加工：把学生 id 数组解析成姓名，并派生入住率 / 空床数 / 状态
    roomRows() {
      return this.rooms.map((r) => {
        const names = (r.students || []).map((sid) => this.studentMap[sid] || `#${sid}`)
        const capacity = r.capacity || 0
        const used = names.length
        return {
          ...r,
          capacity,
          used,
          free: capacity - used,
          names,
          rate: capacity ? Math.round((used / capacity) * 100) : 0,
          status: used === 0 ? 'empty' : used >= capacity ? 'full' : 'part'
        }
      })
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    // 首屏并发拉三份数据（楼栋 + 全部寝室 + 学生名册）
    async init() {
      this.loading = true
      this.loadError = false
      const [buildings, rooms, students] = await Promise.all([
        getBuildings(),
        getRooms(),
        getStudents()
      ])
      this.loading = false
      // 任一接口不可用：页面不崩，给空态 + 重试入口（报告 8.3 用例 E01）
      if (buildings === null || rooms === null || students === null) {
        this.loadError = true
        this.buildings = this.rooms = []
        return
      }
      this.buildings = buildings
      this.rooms = rooms
      this.studentMap = {}
      students.forEach((s) => {
        this.studentMap[s.id] = s.name
      })
    },
    // 切换楼栋：只重拉寝室（一对多的「多」端按条件查询）
    async onBuildingChange(id) {
      this.loading = true
      const rooms = await getRooms(id === 0 ? undefined : id)
      this.loading = false
      if (rooms === null) {
        this.loadError = true
        return
      }
      this.rooms = rooms
    },
    buildingName(id) {
      const b = this.buildings.find((x) => x.id === id)
      return b ? b.name : `${id} 栋`
    },
    goDetail(row) {
      // 动态路由（T3）：寝室详情 /room/:id 由页面开发B后续迭代
      this.$router.push(`/room/${row.id}`)
    }
  }
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="page-body">
      <!-- 楼栋筛选（一对多：一栋 → 多寝室，切换后重拉接口） -->
      <div class="toolbar">
        <el-radio-group v-model="currentBuilding" @change="onBuildingChange">
          <el-radio-button :value="0">全部楼栋</el-radio-button>
          <el-radio-button v-for="b in buildings" :key="b.id" :value="b.id">
            {{ b.name }}
          </el-radio-button>
        </el-radio-group>
        <span v-if="!loadError" class="toolbar-tip">
          共 {{ roomRows.length }} 间寝室 · 空床位 {{ roomRows.reduce((s, r) => s + r.free, 0) }} 个
        </span>
      </div>

      <!-- F2 核心：寝室表格 + 床位入住状态标色 -->
      <el-table :data="roomRows" v-loading="loading" border stripe row-key="id">
        <el-table-column prop="roomNo" label="寝室号" width="90" align="center" />
        <el-table-column label="所属楼栋" min-width="140">
          <template #default="{ row }">{{ buildingName(row.buildingId) }}</template>
        </el-table-column>

        <el-table-column label="床位入住状态" min-width="240">
          <template #default="{ row }">
            <div class="beds">
              <el-tooltip
                v-for="(n, i) in row.names"
                :key="'u' + i"
                :content="'在住：' + n"
                placement="top"
              >
                <span class="bed bed-used">{{ n.slice(0, 3) }}</span>
              </el-tooltip>
              <span v-for="i in row.free" :key="'f' + i" class="bed bed-free">空</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="入住 / 容量" width="110" align="center">
          <template #default="{ row }">
            <b>{{ row.used }}</b> / {{ row.capacity }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="92" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.status === 'full' ? 'danger' : row.status === 'part' ? 'success' : 'info'"
            >
              {{ row.status === 'full' ? '满员' : row.status === 'part' ? '可入住' : '空寝室' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="入住率" width="160" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.rate"
              :stroke-width="10"
              :color="rateColors"
            />
          </template>
        </el-table-column>

        <el-table-column label="在住学生" min-width="200">
          <template #default="{ row }">
            <template v-if="row.names.length">
              <el-tag
                v-for="(n, i) in row.names"
                :key="i"
                class="stu-tag"
                size="small"
                effect="plain"
              >
                {{ n }}
              </el-tag>
            </template>
            <span v-else class="muted">暂无学生入住</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty
            :description="
              loadError
                ? '接口服务不可用：请确认已运行 npm run server（json-server :3001）'
                : '该楼栋暂无寝室数据'
            "
          />
        </template>
      </el-table>

      <div v-if="loadError" class="retry-bar">
        <el-button type="primary" plain @click="init">重新加载</el-button>
      </div>
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
  max-width: 1240px;
  margin: 0 auto;
  padding: 20px 24px 32px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.toolbar-tip {
  font-size: 13px;
  color: #8a97a8;
}

/* 床位入住状态标色：已住 = 实心绿（悬浮看姓名），空床 = 灰虚线 */
.beds {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.bed {
  min-width: 52px;
  height: 26px;
  line-height: 24px;
  text-align: center;
  border-radius: 6px;
  font-size: 12px;
  padding: 0 6px;
}

.bed-used {
  background: #67c23a;
  color: #fff;
  cursor: default;
}

.bed-free {
  border: 1px dashed #c0c4cc;
  color: #a8abb2;
  background: #fafafa;
}

.stu-tag {
  margin: 2px 6px 2px 0;
}

.muted {
  color: #a8abb2;
  font-size: 13px;
}

.retry-bar {
  text-align: center;
  padding: 16px 0 4px;
}
</style>
