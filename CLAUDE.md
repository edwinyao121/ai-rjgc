# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个「智能软件工厂」OA 办公系统的单文件 HTML 原型，用于演示在Harness框架下的 AI 驱动的软件研发全流程管理，并且展示出产品的可观测性、可验证性、可控性。整个应用包含在一个 `index.html` 文件中，无需构建步骤，直接用浏览器打开即可运行。

## 目标
围绕这一产品思想，需要修改`index.html` 原型文件的展现，来让核心开发成员和产品经理共同提出建议来定义好该产品的业务逻辑。

## Architecture

**单文件 SPA 结构**：`index.html` 包含三个内联部分：
- `<style>` — CSS 样式（约 320 行），使用 CSS 自定义属性作为设计令牌（`--primary`, `--radius`, `--shadow` 等）
- `<body>` — HTML 结构：侧边栏导航 + 顶栏 + 主内容区 + 浮动智能体面板
- `<script>` — JavaScript 逻辑（约 1600 行）

**状态管理**：全局 `state` 对象集中管理所有应用数据（项目、任务、门禁、评审、对话历史等）。无框架依赖，纯原生 JS。

**页面渲染**：`navigate(page)` → `renderPage(page)` → 各页面渲染函数（`renderDashboard`, `renderKanban`, `renderPipeline` 等），每个函数接收 `container` 元素并直接操作 `innerHTML`。

**核心页面**：
- `dashboard` — 工作台，统计卡片 + 时间线
- `projects` — 项目空间，项目卡片网格
- `kanban` — 任务看板，支持拖拽（原生 Drag & Drop API）
- `pipeline-view` — 阶段流水线，展示任务的 8 阶段进度和门禁状态
- `gates` — 门禁管理，按阶段分组展示门禁规则及通过/失败状态
- `reviews` — 评审中心，待评审任务列表
- `rules-config` — 规则配置，门禁规则的开关控制
- `skills` — 技能市场，Agent 技能卡片展示

**智能体面板**：浮动按钮触发 `toggleAgentPanel()`，用户输入需求后 `sendSmartMessage()` → `generateSmartPlan()` 生成流水线方案，支持从模板中随机匹配。

## Data Model

```
state.projects[] — 项目 { id, name, desc, repo, members, status, stagesDone, stagesTotal, rulesSet }
state.tasks[]    — 任务 { id, pid, title, type, priority, status, stageCurrent, stages[], stageGates[][] }
state.gateDefs   — 门禁定义，按阶段名称索引，每个门禁有 name/desc/type(pass|warn|fail)
state.conversations — 对话历史，key 为 `${taskId}-${stageIndex}`
state.reviews[]  — 评审记录 { id, tid, stage, reviewer, status }
state.rulesConfig — 门禁规则开关 { [ruleName]: boolean }
```

## Key Functions

- `navigate(page)` — 页面切换入口
- `renderKanban(container)` — 看板渲染，列按 `status` 分组（backlog/todo/executing/review/done）
- `handleDragStart/Over/Drop` — 看板卡片拖拽逻辑
- `renderPipeline(container, {tid})` — 流水线渲染，展示 8 阶段节点 + 门禁点
- `sendSmartMessage()` — 智能体对话入口
- `generateSmartPlan(taskName)` — 从预设模板生成流水线方案
- `toast(msg, isError)` — 全局通知提示

## Development

直接在浏览器中打开 `index.html` 即可预览。修改 CSS/JS 后刷新页面生效。无热更新、无构建工具、无外部依赖。

## Design Tokens

所有颜色、间距、圆角、阴影通过 CSS 变量定义在 `:root` 中，修改变量即可全局调整主题。主要变量：
- `--primary` / `--primary-hover` — 主色调（蓝色）
- `--success` / `--warning` / `--danger` — 状态色
- `--radius` / `--radius-sm` / `--radius-lg` — 圆角
- `--shadow-sm` / `--shadow` / `--shadow-md` / `--shadow-lg` — 阴影层级
