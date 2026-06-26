# 会话交接

<!-- Machine-readable harness anchors: Current Objective | Blockers | Files | Next Session | Recommended Next Step -->

## 当前目标

- 目标：完成 `product-017` 补齐阶段 Agent 配置并强化生成提示词。
- 当前状态：已实现并通过自动化验证；五个阶段均可从本机 opencode 全局 Agent 中选择真实执行 Agent，阶段执行会传入对应 `--agent`，历史/空值默认使用 `build`，主卡片继续展示产品化虚拟 Agent 名称。
- 分支 / 提交：`0630`，本次未创建提交。

## 本会话已完成

- 新增 `GET /api/opencode-agents`，通过 `opencode agent list` 读取本机全局 Agent，只解析顶层 Agent 标识并返回 `id`、`label`、`isPrimary`。
- 后端 `agentSelections` 支持 `requirements`、`design`、`coding`、`testing`、`deployment` 五个阶段键；空值和历史工单默认使用 `build`，显式保存时只允许使用 Agent 目录返回的 id。
- `POST /api/work-orders`、`PATCH /api/work-orders/:id/agent-selections`、`POST /api/work-orders/:id/development-runs` 已支持提交阶段 Agent 配置。
- 需求澄清、系统设计、智能编码、测试质检准备、测试自动返修、部署交付准备均按阶段向 opencode 传入 `--agent`。
- 前端五个阶段齿轮均支持 Agent 配置；系统设计/智能编码/测试质检/部署交付保留模型配置，需求待入厂齿轮只配置 Agent。
- 主卡片继续显示现有虚拟 Agent 名称，不直接暴露真实 opencode Agent id。
- 系统设计、编码、测试质检、部署交付和测试自动返修提示词已强化；Web/浏览器应用明确要求优先补齐并执行 Playwright 端到端测试。
- 产品需求文档、功能清单、进度文档和本交接文档已同步更新。

## 校验证据

| 检查项 | 命令 | 结果 | 备注 |
| --- | --- | --- | --- |
| 红灯验证 | `node --test --test-name-pattern='opencode agent|agent selections|--agent|Playwright|StageCard.*agent|work order API sends.*agent' tests/backend.test.js tests/frontend-render.test.js` | 失败 | 确认旧实现缺少 Agent 目录、`agentSelections`、`--agent`、Playwright 提示词和前端 API/UI 支持。 |
| 定向回归 | 同上 | 通过（9/9） | Agent 目录解析、保存校验、命令传参、Playwright 提示词和前端配置入口通过。 |
| 后端/前端回归 | `node --test tests/backend.test.js tests/frontend-render.test.js` | 通过（80/80） | 2026-06-26。 |
| 全量测试 | `npm test` | 通过（80/80） | 2026-06-26。 |
| 生产构建 | `npm run build` | 通过 | 2026-06-26。 |
| 基线校验 | `./init.sh` | 通过（80/80 + build） | 2026-06-26。 |

## 变更文件

- `server/lib/orchestrator.js`
- `server/lib/store.js`
- `server/lib/opencode.js`
- `server/index.js`
- `src/api/workOrders.js`
- `src/pages/KanbanBoard.jsx`
- `tests/backend.test.js`
- `tests/frontend-render.test.js`
- `docs/AI研发助手单机版需求文档.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `dist/index.html`

## 风险与阻塞

- 无阻塞。
- 当前工作区仍存在既有 `node_modules/.vite/deps/*` 删除项，本次未触碰也未回退。
- 历史工单若没有 `agentSelections` 会默认使用 `build` Agent。
- Agent 列表完全来自本机 `opencode agent list`，未配置或不存在的 Agent 不会展示，也不能保存。
- 前端 Agent 配置已通过 SSR/渲染测试覆盖；本次未额外执行真实浏览器 DevTools 手工验收。

## 下次会话启动

1. 执行 `./init.sh` 确认基线。
2. 在浏览器中确认五个阶段齿轮均可配置 Agent，且阶段主卡片仍只显示产品化虚拟 Agent 名称。
3. 如需进一步验收真实执行链路，可新建工单选择非默认 Agent，启动流水线后查看阶段命令日志确认对应 `--agent` 生效。

## 推荐下一步

- 若继续优化交互，可单独设计已锁定模型/Agent 的只读总览或配置确认面板，避免把真实执行 id 放回阶段主卡片。
