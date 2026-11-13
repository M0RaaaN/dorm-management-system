# G2 高校宿舍管理系统（dorm-management-system）

前端框架技术期末大作业 · 小组项目。面向宿管部门的宿舍信息管理系统：管楼栋床位、学生入住与调宿、报修工单。

角色：学生、宿管员。功能清单 F1–F5（必须）+ E6/E7（期望）+ O8（可选），详见《期末大作业-小组项目题目册》G2 题。

## 快速开始

```bat
git clone https://github.com/M0RaaaN/dorm-management-system.git
cd dorm-management-system
npm install

REM 终端1：启动本地接口（json-server 3001）
npm run server

REM 终端2：启动前端
npm run dev
```

演示账号（见 db.json 的 users）：

- 学生：`student01 / 123456`
- 宿管：`manager01 / 123456`

## 技术栈（课程口径）

Vue 3（选项式 API）+ Vite ｜ npm ｜ hash 路由 ｜ Element Plus（主界面）+ Vant（移动端，手机壳容器内展示）｜ Axios（统一封装 + catch 兜底 + loading 态）｜ Pinia（≥2 仓库，persist 持久化）｜ json-server（3001 端口，db.json 建库）

## 目录结构

```
├── db.json               # 数据模型（buildings/rooms/students/repairs/users）——唯一数据源
├── public/mock/          # 线上静态 mock（随 dist 部署，见 public/mock/说明.md）
├── docs/分工表.md         # 分工与 M0 签名
└── src/
    ├── api/              # 接口模块（request.js 统一封装；按业务分文件）
    ├── stores/           # Pinia 仓库（user 登录态 + 业务仓库）
    ├── router/           # 路由（hash + 全部懒加载 + 全局守卫）
    ├── views/            # 页面（login/buildings/room/repairs/center/admin/mobile）
    ├── components/       # 通用组件（T2：≥3 个自封装，props+emit，至少 1 个插槽）
    └── style.css         # 基础样式 + .phone-shell 手机壳容器
```

## Git 协作（实验15 任务0 分支模型）

```
main                 —— 始终可运行，只接受合并（组长管理）
feature/登录-张三     —— 每人每功能一个分支，完成后申请合并（PR）
```

- 提交信息：`类型(模块): 描述`（feat / fix / docs / style / refactor / chore）
- 合并方式：Create a merge commit（保留个人提交署名，三方互证）
- 详见《G2宿舍管理系统-Git协作手册.html》

## 部署（实验15 任务5 · GitHub Pages）

1. `vite.config.js` 已设 `base: '/dorm-management-system/'`（不设会资源 404）；
2. `npm run build` 产出 `dist/`；
3. `npm run deploy`（gh-pages -d dist，推 dist 到 gh-pages 分支）；
4. 仓库 Settings → Pages → Source 选 `gh-pages` 分支 → 访问 `https://m0raaan.github.io/dorm-management-system/`；
5. 备选：Netlify 直接拖 `dist/` 文件夹上线（不受仓库公私有影响）。

hash 路由 + base 配置 = 静态平台上刷新不 404。线上演示走 `public/mock` 静态数据（只读动线），写操作在开发版演示。

## 打包优化记录（任务4，M4 时补）

| 优化项 | 操作 | 验证方法 |
|---|---|---|
| 路由懒加载分包 | 页面组件 `() => import()` | dist/assets 按页面分出多个 js |
| 静态资源压缩 | 图片放 src/assets；过大先压缩 | 构建日志对比产物体积 |
| 按需引入（加分） | unplugin-auto-import | 对比全量引入的体积差 |

## 硬指标自查（题目册 T1–T7）

- T1 Vue3+Vite，npm，命名规范 ✓（本骨架）
- T2 ≥3 个自封装通用组件（props+emit+插槽）+ computed + watch —— 待 components 落地
- T3 ≥5 页面 + 动态路由 `:id` + 嵌套路由 `/center` + 全局守卫 + 全部懒加载 ✓（路由骨架已就位）
- T4 Element Plus 主界面 + Vant 移动端页（手机壳）—— 布局由各功能分支实现
- T5 json-server 3001 + axios get/post/put/delete + catch 兜底 + loading ✓（request.js 骨架已就位）
- T6 Pinia ≥2 仓库 + actions + persist ✓（user 仓库骨架已就位，业务仓库待建）
- T7 build → preview → 部署上线 —— 部署链路已配好（base + deploy 脚本）

> AI生成
