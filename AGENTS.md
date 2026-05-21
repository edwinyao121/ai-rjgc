# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

「智能软件工厂」OA 办公系统的多文件 HTML 原型，用于演示在 Harness 框架下的 AI 驱动的软件研发全流程管理，展示产品的可观测性、可验证性、可控性。无构建工具、无外部依赖，直接用浏览器打开 `index.html` 即可运行。

## 目标

围绕这一产品思想，修改原型文件的展现，让核心开发成员和产品经理共同提出建议来定义产品的业务逻辑。修改需求记录在 `docs/req1.0.md`（已完成）和 `docs/req2.0.md`（待规划）中。

## Architecture

**多文件 SPA 结构**：

```
index.html          — HTML 骨架（侧边栏 + 顶栏 + 主内容区 + 智能体面板）
styles.css          — 全部 CSS 样式，使用 CSS 自定义属性作为设计令牌
data.js             — state 数据对象 + 工具函数（getProject/getTask/toast 等）
router.js           — 导航、页面路由、智能体面板逻辑、init()
dashboard.js        — 工作台页面
projects.js         — 项目空间页面
kanban.js           — 任务看板 + 拖拽逻辑
pipeline-render.js  — 流水线渲染（图、标签页、侧边面板、思维导图、产出物）
pipeline-actions.js — 流水线操作（评审、推进、回退、门禁修复）
gates.js            — 研发追溯页面（审计报告卡片）
reviews.js          — 评审中心页面
rules-config.js     — 门禁配置页面（规则开关 + 添加规则）
pages.js            — 智能体管理、研制总结、技能市场页面
```

**加载顺序**：`data.js` → 各页面 JS → `router.js`（renderPage switch 依赖各页面函数已定义）

**状态管理**：全局 `state` 对象集中管理所有应用数据。所有 JS 文件通过全局作用域共享变量，无 module/import 机制。

**页面渲染**：`navigate(page)` → `renderPage(page)` → 各页面渲染函数，每个函数接收 `container` 元素并操作 `innerHTML`。

## 核心页面

| data-page | 渲染函数 | 文件 | 说明 |
|-----------|----------|------|------|
| `dashboard` | `renderDashboard` | dashboard.js | 工作台，统计卡片 + 趋势 + 需要关注 |
| `projects` | `renderProjects` | projects.js | 项目空间，项目卡片网格 |
| `kanban` | `renderKanban` | kanban.js | 任务看板，原生 Drag & Drop |
| `pipeline-view` | `renderPipeline` | pipeline-render.js | 阶段流水线，8 阶段进度 + 门禁 + 侧边面板 |
| `gates` | `renderGates` | gates.js | 研发追溯，审计报告卡片（可折叠） |
| `reviews` | `renderReviews` | reviews.js | 评审中心，待评审/已完成双栏 |
| `rules-config` | `renderRulesConfig` | rules-config.js | 门禁配置，规则开关 + 添加规则 |
| `agents` | `renderAgents` | pages.js | 智能体管理，8 个内置 Agent 卡片 |
| `summary` | `renderSummary` | pages.js | 研制总结，效能统计 + 阶段分布 |
| `skills` | `renderSkills` | pages.js | 技能市场，Agent 技能卡片 |

## Data Model

```
state.projects[]    — 项目 { id, name, desc, repo, members, status, stagesDone, stagesTotal }
state.tasks[]       — 任务 { id, pid, title, type, priority, status, stageCurrent, stageNames[], stages[], stageGates[][] }
state.gateDefs      — 门禁定义，按阶段名称索引，每个门禁有 name/desc/type(pass|warn|fail)
state.conversations — 对话历史，key 为 `${taskId}-${stageIndex}`
state.reviews[]     — 评审记录 { id, tid, stage, stageName, reviewer, status, desc }
state.rulesConfig   — 门禁规则开关 { [ruleName]: boolean }
```

## Key Functions

- `navigate(page, data)` — 页面切换入口（router.js）
- `renderPage(page, data)` — 路由分发 switch（router.js）
- `toast(msg, isError)` — 全局通知提示（data.js）
- `getProject(id)` / `getTask(id)` / `getProjectTasks(pid)` — 数据查询（data.js）
- `updateBadges()` — 更新侧边栏徽章数字（data.js）
- `toggleAgentPanel()` — 智能体面板开关（router.js）
- `sendSmartMessage()` — 智能体对话入口（router.js）

## Development

直接在浏览器中打开 `index.html` 即可预览。修改对应文件后刷新页面生效。

**修改指南**：
- 修改某个页面时，只需读写对应的 JS 文件，无需处理整个 index.html
- CSS 样式修改在 `styles.css`
- 数据结构修改在 `data.js`
- 新增页面：在 `data.js` 后新建 JS 文件，在 `router.js` 的 `renderPage` switch 中添加 case，在 `index.html` 中添加 `<script>` 引用

## Design Tokens

所有颜色、间距、圆角、阴影通过 CSS 变量定义在 `styles.css` 的 `:root` 中：
- `--primary` / `--primary-hover` — 主色调（蓝色）
- `--success` / `--warning` / `--danger` — 状态色
- `--radius` / `--radius-sm` / `--radius-lg` — 圆角
- `--shadow-sm` / `--shadow` / `--shadow-md` / `--shadow-lg` — 阴影层级
