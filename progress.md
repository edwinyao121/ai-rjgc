# 项目进度

<!-- Machine-readable harness anchors: Current State | What | Next | Last Updated -->

## 当前状态

- 最后更新：2026-06-25 16:22（Asia/Shanghai）
- 当前分支：`0630`
- 当前事项：无。
- 会话目标：完成看板交互与界面布局微调（重命名详情按钮为日志、日志文字变白、去除新建工单基本描述、移除智脑浮标、移除 Live 图标、AI 研发助手缩放）。

## 已完成

- [x] 确认项目技术栈：Vite + React 前端、Node.js 后端，包管理器为 npm。
- [x] 确认产品事实来源：`docs/AI研发助手单机版需求文档.md`、`docs/requirements/` 与 `docs/设计规范.txt`。
- [x] 创建中文 `AGENTS.md`、`feature_list.json`、`progress.md`、`session-handoff.md` 与 `init.sh`。
- [x] 修复 `WO-20260625-001` 测试质检的 PEP 668 失败：安装改为项目内 `.factory-venv`，构建和测试显式定位 `frontend/` 与 `backend/` 子项目。
- [x] 加强生成提示：Python 项目不得使用系统 `pip` 或 `--break-system-packages`，且 manifest 必须显式指定子项目命令目录。
- [x] 实现测试质检自动返修：`install/build/test` 失败后写入 `repair-context/testing-failure-attempt-N.md`，调用“智能编码/修复”，最多返修 3 次后才失败。
- [x] 增加阶段交接文档：需求澄清后生成 app 内 `handoff.md`，后续阶段提示优先阅读该交接文档。
- [x] 精简需求展示：内部仍保留 `requirements.md` 与需求结构数据，但前端和助手不再单独展示“需求规格说明书”。
- [x] 修正看板应用访问地址：部署探活继续使用 `healthUrl`，看板和访问按钮使用 `appUrl`/前端根地址；历史 `/api/...` 地址在前端访问层自动规范为同源根地址。
- [x] 修复需求澄清错误处理：识别 opencode `type:error` 事件，提取可读错误原因，并在需求阶段启用基于原始需求的保底需求摘要，避免误报 `Unable to parse clarification JSON` 后卡死。
- [x] 优化新建工单交互：新建应用先填写标题和基本描述，创建应用壳后打开 AI 研发助手，由用户继续输入原始需求后再启动需求澄清。
- [x] 优化看板信息展示：应用列表标题可完整换行展示，描述单行省略并保留完整 tooltip。
- [x] 聚合成果物区域：文档、制品和访问地址统一在一个成果物卡片和详情弹窗中展示，单条成果物二次点击查看详情。
- [x] 精简应用列表卡片：删除紧急程度、当前阶段、进度条、工单号、进度百分比和运行按钮，只保留头像、应用名称和应用描述。
- [x] 移除全局左侧菜单：应用默认直接进入生产看板，不再展示工作台大盘、应用生产线、应用商店、Agent中心、规则引擎、工程链路、系统设置和收起/展开菜单入口。
- [x] 调整看板标题：顶部主标题改为“智能软件工厂”，并居中展示；新建工单按钮保留在右侧。
- [x] 看板交互与界面布局微调：
  - 将阶段流转卡片的“详情”按钮改名为“日志”，并将日志内容的灰色字体（时间戳、来源）改为白色。
  - 新建工单时去除了“基本描述”输入框与对应文案，创建时仅需登记标题。
  - 去除了页面右下角的“智脑”浮动气泡按钮。
  - 去除了页面顶部“智能软件工厂”标题旁边的 Radio 闪动 Live 图标。
  - AI 研发助手顶部栏新增了放大/缩小按钮，放大后以 fixed 遮罩形式占据屏幕 80% 大小并居中，且可恢复原样。

## 进行中

- 无。

## 下一步

1. 由用户在浏览器中刷新页面，手工确认无左侧导航菜单，顶部居中显示“智能软件工厂”。
2. 由用户在浏览器中点击“新建工单”，手工确认新建应用壳和 AI 助手输入原始需求流程仍符合预期。

## 风险与注意事项

- 本次没有修改运行态历史工单 state，因此已失败的历史工单不会自动恢复。
- `./init.sh` / `npm run build` 会刷新 `dist/index.html` 资源哈希；当前工作区也保留了既有 `node_modules/.vite/deps/_metadata.json` 缓存变更，提交时应单独确认是否纳入。
- 左侧应用列表不再提供运行/访问入口；访问部署应用统一保留在主内容区顶部按钮。
- 全局左侧菜单已删除，其他页面入口不再从当前壳层暴露；如后续需要工作台大盘或系统设置，应单独设计新的入口。

## 本会话修改文件

- `server/index.js`、`server/lib/store.js`、`server/lib/orchestrator.js`、`server/lib/opencode.js`：扩展创建工单请求体，支持标题/描述/延迟澄清，确保后续 prompt 包含应用壳上下文和用户原始需求。
- `src/api/workOrders.js`、`src/pages/KanbanBoard.jsx`：新建应用弹窗、AI 助手原始需求提示、应用列表名称/描述展示、成果物聚合和二级详情。
- `src/pages/KanbanBoard.jsx`：应用列表卡片极简化，仅展示头像、应用名称和应用描述。
- `src/App.jsx`、`src/pages/KanbanBoard.jsx`：删除全局左侧菜单，默认直接展示生产看板；看板标题改为“智能软件工厂”并居中。
- `tests/backend.test.js`：新增延迟澄清应用壳和 prompt 上下文回归测试。
- `tests/frontend-render.test.js`：新增新建弹窗、原始需求提示、应用列表、成果物聚合渲染测试，并更新应用列表极简展示断言。
- `tests/frontend-render.test.js`：新增无左侧菜单、默认看板入口、标题改名和居中断言。
- `feature_list.json`、`progress.md`：记录本次事项和校验证据。

## 校验证据

- [x] `npm test`：2026-06-25 03:26 通过，35 个测试全部通过。
- [x] `npm run build`：2026-06-25 03:26 通过，Vite 生产构建成功。
- [x] 手工检查：协作文件均已生成，`init.sh` 已可执行并完成全流程。
- [x] 工单质检链路：2026-06-25 执行 `bash scripts/setup.sh && npm --prefix frontend run build && bash scripts/test.sh` 通过；Python 29/29、Vitest 24/24。
- [x] `./init.sh`：2026-06-25 通过；`npm test` 37/37，`npm run build` 成功。
- [x] 定向后端回归：2026-06-25 执行 `node --test --test-name-pattern='testing failure|clarification complete leaves|stage prompt' tests/backend.test.js` 通过。
- [x] 定向前端回归：2026-06-25 执行 `node --test --test-name-pattern='RequirementsItemsCard|StageCard shows' tests/frontend-render.test.js` 通过。
- [x] `npm test`：2026-06-25 04:12 前执行通过，41 个测试全部通过。
- [x] `./init.sh`：2026-06-25 04:12 后执行通过；`npm test` 41/41，`npm run build` 成功。
- [x] 定向回归：2026-06-25 09:26 执行 `node --test --test-name-pattern='complete mock pipeline|subproject directories|applyGranularEventToOrder' tests/backend.test.js tests/frontend-render.test.js` 通过。
- [x] `./init.sh`：2026-06-25 09:26 执行通过；`npm test` 41/41，`npm run build` 成功。
- [x] 定向回归：2026-06-25 09:39 执行 `node --test --test-name-pattern='clarification|opencode error events|plain requirements markdown|multiline requirementsMarkdown' tests/backend.test.js` 通过。
- [x] `./init.sh`：2026-06-25 09:39 执行通过；`npm test` 43/43，`npm run build` 成功。
- [x] 定向后端回归：2026-06-25 15:31 执行 `node --test --test-name-pattern='deferred app shell|clarification prompt includes title|clarification complete leaves|startDevelopmentRun only launches|allocates work order ids' tests/backend.test.js` 通过。
- [x] 定向前端回归：2026-06-25 15:31 执行 `node --test --test-name-pattern='renders application production line|CreateWorkOrderModal|original requirement|WorkOrderCard|DeliverablesModal|AIChatPanel renders opencode-stream|applyGranularEventToOrder' tests/frontend-render.test.js` 通过。
- [x] `npm test`：2026-06-25 15:31 执行通过，49 个测试全部通过。
- [x] `npm run build`：2026-06-25 15:31 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-25 15:31 执行通过；`npm test` 49/49，`npm run build` 成功。
- [x] 定向前端回归：2026-06-25 15:51 执行 `node --test --test-name-pattern='WorkOrderCard|renders application production line' tests/frontend-render.test.js` 通过。
- [x] `npm test`：2026-06-25 15:51 执行通过，49 个测试全部通过。
- [x] `npm run build`：2026-06-25 15:51 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-25 15:51 执行通过；`npm test` 49/49，`npm run build` 成功。
- [x] 红灯验证：2026-06-25 15:58 执行 `node --test --test-name-pattern='application production line|App shell' tests/frontend-render.test.js` 失败，确认旧实现仍渲染“应用生产线”、左侧菜单和工作台大盘。
- [x] 定向前端回归：2026-06-25 15:58 执行 `node --test --test-name-pattern='application production line|App shell' tests/frontend-render.test.js` 通过。
- [x] `npm test`：2026-06-25 15:58 执行通过，50 个测试全部通过。
- [x] `npm run build`：2026-06-25 15:58 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-25 15:58 执行通过；`npm test` 50/50，`npm run build` 成功。

## 构建提示

- Vite 报告一个压缩后超过 500 kB 的产物提示（`index-*.js` 约 201 kB gzip）；该提示不影响本次基线校验。后续如进行性能优化，可单独评估按路由或依赖拆包，避免与功能需求混合处理。
