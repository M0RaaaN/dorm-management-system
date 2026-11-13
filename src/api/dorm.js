import { apiGet, apiPost, apiPut, apiDelete } from './request'

/**
 * 业务接口模块（T5）：按业务分文件，本文件为宿舍/楼栋相关示例
 *
 * 双通道策略（实验15 任务5 的 mock 部署方案）：
 *  - 开发环境：走 json-server REST 接口（http://localhost:3001/buildings）
 *  - 生产环境：走 public/mock/ 静态 JSON（随 dist 一起部署，只读演示）
 *
 * 其余接口（/rooms /students /repairs /users）由组员照此模式补充。
 */
const isDev = import.meta.env.DEV

// F2 楼栋列表
export function getBuildings() {
  return apiGet(isDev ? '/buildings' : 'mock/buildings.json')
}

// F2 寝室列表（可带 buildingId 查询参数，体现楼栋→寝室一对多）
export function getRooms(buildingId) {
  if (isDev) {
    return apiGet(buildingId ? `/rooms?buildingId=${buildingId}` : '/rooms')
  }
  return apiGet('mock/rooms.json')
}

// F2 在住学生：寝室行的 students 字段是学生 id 数组，页面据此映射姓名
export function getStudents() {
  return apiGet(isDev ? '/students' : 'mock/students.json')
}

// F4 学生报修：按学号查学生记录（拿到数字 id 与所在寝室）
export function getStudentByStudentId(studentId) {
  return apiGet(isDev ? `/students?studentId=${encodeURIComponent(studentId)}` : 'mock/students.json').then(
    (list) => (Array.isArray(list) ? list.find((s) => s.studentId === studentId) || null : null)
  )
}

// F4 报修列表（E7：可按状态筛选，"全部"传 undefined）
export function getRepairs(status) {
  if (isDev) {
    return apiGet(status ? `/repairs?status=${encodeURIComponent(status)}` : '/repairs')
  }
  return apiGet('mock/repairs.json').then((list) =>
    list ? (status ? list.filter((r) => r.status === status) : list) : null
  )
}

// F4 报修提交（学生端 post；生产环境为静态只读演示，写操作仅在开发版有效）
export function postRepair(repair) {
  return apiPost('/repairs', repair)
}

// F4 报修处理（宿管端 put 状态流转：待处理 → 处理中 → 已完成）
export function putRepair(id, data) {
  return apiPut(`/repairs/${id}`, data)
}

// F3 入住 / 调宿 / 退宿：put 更新学生实体（json-server 全量替换，需带完整对象）
export function putStudent(id, data) {
  return apiPut(`/students/${id}`, data)
}

// F3 入住 / 调宿 / 退宿：put 更新寝室实体（students 床位数组同步增删）
export function putRoom(id, data) {
  return apiPut(`/rooms/${id}`, data)
}

// 删除示例（T5 要求 delete 覆盖；具体业务由负责同学调用）
export function deleteStudent(id) {
  return apiDelete(`/students/${id}`)
}
