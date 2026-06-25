# 会话交接

<!-- Machine-readable harness anchors: Current Objective | Blockers | Files | Next Session | Recommended Next Step -->

## 当前目标

- 目标：完成 `product-014` 内设应用工作空间与 opencode 模型选择。
- 当前状态：已实现并通过自动化验证；4 个内设应用现在由后端注册表管理，并拥有稳定工作空间；需求澄清、系统设计、智能编码支持从本机 `opencode models` 中选择模型。
- 分支 / 提交：`0630`

## 本会话已完成

- 新增内设应用注册表与工作空间初始化：`.runtime/app-workspaces/<app-slug>/` 下包含 `app/`、`agents/`、`skills/`、`docs/` 和 `workspace.json`。
- 新增 `/api/apps`、`/api/opencode-models`、`PATCH /api/work-orders/:id/model-selections`，并扩展创建工单与启动智能开发接口支持 `modelSelections`。
- 工单可通过 `appId` 绑定内设应用 workspace；绑定后流水线使用该 workspace 的 `app/` 作为 `appDir`。
- opencode 命令支持按阶段传入 `--model provider/model`：需求澄清用 `requirements`，系统设计用 `design`，智能编码、测试准备、部署准备和测试返修用 `coding`。
- 前端加载后端应用注册表和模型列表；新建应用与首次需求前可选择需求澄清模型；READY_FOR_DEVELOPMENT 状态下系统设计/智能编码阶段卡片可选择模型，启动后锁定。
- 产品需求文档、功能清单和进度文档已同步更新。

## 校验证据

| 检查项 | 命令 | 结果 | 备注 |
| --- | --- | --- | --- |
| 红灯后端 | `node --test --test-name-pattern='built-in app|model catalog|model selections|opencode command uses|opencode stages use|buildOpencodeCommand adds --model|GET /api/apps|PATCH /api/work-orders' tests/backend.test.js` | 失败 | 确认旧实现缺少后端注册表、模型接口和 `--model`。 |
| 红灯前端 | `node --test --test-name-pattern='requirements model selector|work order API sends model selections|StageCard renders editable model selector' tests/frontend-render.test.js` | 失败 | 确认旧前端缺少模型选择 UI 和 API。 |
| 定向后端回归 | `node --test --test-name-pattern='built-in app|model catalog|model selections|opencode command uses|opencode stages use|buildOpencodeCommand adds --model|GET /api/apps|PATCH /api/work-orders|startDevelopmentRun only launches|install/build/test commands' tests/backend.test.js` | 通过 | 新后端行为与既有启动/质检链路通过。 |
| 定向前端回归 | `node --test --test-name-pattern='renders application production line|CreateWorkOrderModal|requirements model selector|work order API sends model selections|StageCard renders editable model selector|AIChatPanel renders opencode-stream' tests/frontend-render.test.js` | 通过 | 新前端 UI 与既有助手渲染通过。 |
| 全量测试 | `npm test` | 通过（72/72） | 2026-06-25 22:57。 |
| 生产构建 | `npm run build` | 通过 | 2026-06-25 22:57。 |
| 基线校验 | `./init.sh` | 通过（72/72 + build） | 2026-06-25 22:57。 |

## 变更文件

- `server/lib/apps.js`
- `server/index.js`
- `server/lib/orchestrator.js`
- `server/lib/store.js`
- `server/lib/opencode.js`
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
- 模型列表完全依赖本机 `opencode models`；未配置的模型不会展示，也会被后端拒绝。
- `.runtime/app-workspaces/` 是运行态目录，不纳入 git；需要重启后端以初始化或刷新工作空间。
- 工作区仍有既有 `node_modules/.vite/deps/_metadata.json` 缓存变更，提交前需单独确认是否纳入。

## 下次会话启动

1. 执行 `./init.sh` 确认基线。
2. 重启后端服务后访问看板，确认模型下拉只显示当前机器 `opencode models` 中的条目。
3. 若要给内设应用增加专属 agent 或 skill，直接放入 `.runtime/app-workspaces/<app-slug>/agents/` 或 `skills/`。

## 推荐下一步

- 在浏览器中手工创建一个应用壳，选择需求澄清模型，输入原始需求后确认工单进入 READY_FOR_DEVELOPMENT，再为系统设计和智能编码选择不同模型并启动智能开发。
