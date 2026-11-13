import axios from 'axios'

// 统一 axios 封装（T5）：get / post / put / delete 四种请求全走这里
// baseURL 来自环境变量：开发 = http://localhost:3001（json-server），生产 = 相对路径（public/mock）
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 8000
})

// 统一 catch 兜底：失败打日志并返回 null，调用方判空即可（页面上再配 loading 态）
async function wrap(promise) {
  try {
    const res = await promise
    return res.data
  } catch (err) {
    console.error('[request error]', err.message || err)
    return null
  }
}

export const apiGet = (url) => wrap(request.get(url))
export const apiPost = (url, data) => wrap(request.post(url, data))
export const apiPut = (url, data) => wrap(request.put(url, data))
export const apiDelete = (url) => wrap(request.delete(url))

export default request
