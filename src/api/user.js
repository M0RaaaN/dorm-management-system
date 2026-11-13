import { apiGet } from './request'

/**
 * 用户 / 登录相关接口（F1 登录 + 守卫 · 页面开发A）
 *
 * 双通道策略（同 dorm.js，实验15 任务5）：
 *  - 开发环境：走 json-server 查询参数过滤（GET /users?username=&password=）
 *  - 生产环境：走 public/mock/users.json 静态全量，前端本地比对（只读演示）
 */
const isDev = import.meta.env.DEV

/**
 * F1 登录校验
 * 返回值三态（调用方据此区分提示文案，对应报告 8.3 异常用例 E01）：
 *  - null ：接口服务不可用（json-server 未启动 / 请求失败，request.js 兜底返回 null）
 *  - []   ：接口正常但凭据错误（用户名或密码不对）
 *  - [user]：校验通过，返回命中的用户对象
 */
export function login(username, password) {
  if (isDev) {
    // json-server 支持多查询参数过滤，命中返回数组、未命中返回空数组
    return apiGet(
      `/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    )
  }
  // 生产静态 mock 只读全量，再在前端比对账号密码
  return apiGet('mock/users.json').then((list) =>
    list ? list.filter((u) => u.username === username && u.password === password) : null
  )
}
