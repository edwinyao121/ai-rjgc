# 项目进度

<!-- Machine-readable harness anchors: Current State | What | Next | Last Updated -->

## 当前状态

- 最后更新：2026-06-26（Asia/Shanghai）
- 当前分支：`0630`
- 当前事项：`product-017` 补齐阶段 Agent 配置并强化生成提示词，已完成。
- 会话目标：从本机 opencode 全局 Agent 中选择真实执行 Agent，五个阶段均支持 Agent 配置，并强化设计、编码、测试、部署和自动返修提示词。

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
- [x] 阶段卡片跳过功能：
  - 新增 `SKIPPED` 阶段状态，跳过阶段计入整体进度且持久化为“已跳过”。
  - 新增 `POST /api/work-orders/:id/stage-skips`，仅允许跳过 `design`、`coding`、`testing`、`deployment` 四个 `PENDING` 阶段。
  - 后端流水线执行每个阶段前重新读取状态，`SKIPPED` 阶段不调用对应 opencode、测试或部署逻辑。
  - 跳过部署交付时工单最终状态为 `COMPLETED`，不写 `deploymentUrl`，不发送 `deployment.updated` 成功事件。
  - 前端阶段卡片在 2-5 号待执行阶段显示“跳过”按钮，`SKIPPED` 阶段显示“已跳过”，顶部统计新增“跳过”数量。
  - 产品文档已补充 `SKIPPED` 状态、跳过规则、跳过接口和 SSE 状态说明。
- [x] 看板布局耗时与新建描述精简优化：
  - 阶段流转卡片的“实际耗时/计划耗时”的标签与对应时间值由上下排列调整为左右并列显示（使用 flex justify-between 布局）。
  - 右侧“新建工单”按钮文字更名为“新建项目”。
  - 左侧应用列表卡片（WorkOrderCard）中移除了 `description` 的渲染，避免在去除基本描述后显示空白或虚假描述。
  - 隐藏了阶段卡片正中的“已完成”与“已跳过”文字状态，避免与进度条和百分比冗余。
  - 取消了后端创建应用时的 `Description is required` 强校验，实现描述字段的非必填支持。
- [x] 设置需求澄清超时时间为15分钟：
  - 后端需求澄清阶段的执行命令超时时间 `timeoutMs` 设为 15 分钟（`15 * 60 * 1000`）。
  - 需求澄清阶段的默认预估时间/计划时间 `estimatedDurationMs` 设为 15 分钟（`15 * 60 * 1000`），在页面展现为计划耗时 15 分钟。
- [x] opencode 超时诊断日志：
  - 需求澄清阶段的 opencode 命令已启用 `--print-logs --log-level DEBUG`，继续使用 `--format json`。
  - `runCommand` 返回 PID、startedAt、lastOutputAt、idleMs、stdout/stderr 字节数与行数、输出事件等诊断元数据。
  - 阶段日志记录 opencode 本机日志目录、启动信息、空输出提示、超时活动摘要，并保持 prompt 隐藏为 `[prompt omitted]`。
  - opencode 执行会追加本地 `opencode-diagnostics.jsonl`，其中包含 stageKey、pid、cwd、timeoutMs、startedAt、lastOutputAt、exitCode、timedOut、输出字节数和 opencode log dir。
  - 阶段日志、opencode-stream 可见内容和本地诊断 JSONL 对 `apiKey`、`token`、`password`、`authorization` 等明显敏感字段做基础脱敏。
- [x] 修复需求澄清日志点击时消息文件并发写入崩溃：
  - 复现固定 `messages.json.tmp` 临时文件在并发写入下触发 `ENOENT`。
  - 消息文件写入已按工单串行化，避免流式消息增量和完整消息保存并发破坏同一文件。
  - `messages.json` 与 `state.json` 原子写入均改为唯一临时文件名后 rename，消除固定 `.tmp` 文件名竞争。
- [x] 内设应用工作空间与 opencode 模型选择：
  - 新增后端应用注册表，初始化 4 个内设应用的 `.runtime/app-workspaces/<app-slug>/` 工作空间，并创建 `app/`、`agents/`、`skills/`、`docs/` 和 `workspace.json`。
  - 新增 `GET /api/apps`，返回内设应用和工作空间目录状态；使用 `appId` 创建工单时绑定对应应用 workspace 的 `app/` 目录作为 `appDir`。
  - 新增 `GET /api/opencode-models`，只读取本机 `opencode models` 输出；新增 `PATCH /api/work-orders/:id/model-selections` 保存 requirements/design/coding 模型选择并拒绝无效模型。
  - `POST /api/work-orders` 与 `POST /api/work-orders/:id/development-runs` 支持提交 `modelSelections`；需求澄清、系统设计、智能编码调用 opencode 时传入 `--model`。
  - 测试准备、部署准备和测试返修沿用 `coding` 模型。
  - 前端加载后端应用注册表和本机模型列表；新建应用和首次需求前可选需求澄清模型，READY_FOR_DEVELOPMENT 状态下系统设计/智能编码阶段卡片可选模型，启动后锁定。
- [x] 阶段卡片模型配置收纳与需求流实时刷新：
  - 系统设计和智能编码阶段卡片不再直接展示模型名称或下拉框，仅在 READY_FOR_DEVELOPMENT 且阶段尚未开始时显示齿轮配置按钮。
  - 点击齿轮按钮后在卡片内打开轻量配置层选择该阶段模型；启动智能开发后配置入口锁定隐藏。
  - 阶段卡片主体移除了“进行中”“等待中”“开发失败”“已跳过”等状态文案，保留图标、进度条、颜色、耗时和日志入口。
  - 前端新增 `fetchWorkOrder` 快照读取；用户首次输入需求创建真实工单后立即补取工单快照。
  - `assistant.message.delta` 到达但对应 stream append 已错过时，前端会创建 opencode-stream 占位消息并继续追加增量，避免需求待入厂思考过程必须刷新才可见。
- [x] 补齐阶段模型配置与默认模型继承：
  - `modelSelections` 已扩展为 `requirements`、`design`、`coding`、`testing`、`deployment` 五个阶段键，后端仍只允许保存本机 `opencode models` 返回的模型。
  - 新建项目弹窗和内设应用首次需求前的模型选择统一命名为“项目默认模型”，选择后填入五个阶段。
  - 系统设计、智能编码、测试质检准备、部署交付准备分别使用对应阶段模型；历史工单缺少 `testing`/`deployment` 时后端兼容回落到旧的 `coding` 配置。
  - 测试质检自动返修改用 `testing` 阶段模型。
  - 测试质检和部署交付阶段卡片在 READY_FOR_DEVELOPMENT 且待执行时显示齿轮配置入口，主卡片不直接展示模型名或下拉框，启动后锁定隐藏。
- [x] 补齐阶段 Agent 配置并强化生成提示词：
  - 新增 `GET /api/opencode-agents`，通过 `opencode agent list` 获取本机全局 Agent，只解析顶层 Agent 标识并返回 `id`、`label`、`isPrimary`。
  - `agentSelections` 已扩展为 `requirements`、`design`、`coding`、`testing`、`deployment` 五个阶段键；空值和历史工单默认使用 `build`，并且只允许保存本机 Agent 目录返回的值。
  - `POST /api/work-orders`、`PATCH /api/work-orders/:id/agent-selections`、`POST /api/work-orders/:id/development-runs` 支持提交并保存阶段 Agent 配置。
  - 需求澄清、系统设计、智能编码、测试质检准备、测试自动返修、部署交付准备均按阶段向 opencode 传入 `--agent`，缺失时传 `build`。
  - 五个阶段卡片齿轮均支持 Agent 配置；主卡片继续展示产品化虚拟 Agent 名称，不暴露真实 opencode Agent id。
  - 系统设计、编码、测试质检、部署交付和测试自动返修提示词已强化；Web/浏览器应用明确要求优先补齐并执行 Playwright 端到端测试。

## 进行中

- 无。

## 下一步

1. 重启或等待 Vite 热更新后，在浏览器中确认五个阶段齿轮均可配置 Agent，且阶段主卡片仍只显示产品化虚拟 Agent 名称。
2. 如需进一步验收真实执行链路，可新建工单选择非默认 Agent，启动流水线后查看阶段命令日志确认对应 `--agent` 生效。

## 风险与注意事项

- 本次没有修改运行态历史工单 state，因此已失败的历史工单不会自动恢复；历史工单若没有 `agentSelections` 会按默认 `build` Agent 执行。
- Agent 列表完全来自本机 `opencode agent list`，未配置或不存在的 Agent 不会展示，也不能保存到工单配置中。
- 前端 Agent 配置已通过 SSR/渲染测试覆盖；本次未额外执行真实浏览器 DevTools 手工验收，若需要可按“下一步”进行交互确认。
- `./init.sh` / `npm run build` 会刷新 `dist/index.html` 资源哈希；当前工作区也保留了既有 `node_modules/.vite/deps/_metadata.json` 缓存变更，提交时应单独确认是否纳入。
- `.runtime/app-workspaces/` 是运行态工作空间，不纳入 git；后续可直接向对应应用的 `agents/` 或 `skills/` 放置专属能力文件。
- 模型列表完全来自本机 `opencode models`，未配置的 GLM5.2 不会展示，也不能保存到工单配置中。
- 阶段卡片已隐藏直接模型展示；如需确认当前锁定模型，应以后续配置确认面板或日志/工单状态详情承载，不再放回主卡片。
- 历史工单若只保存了 `coding` 模型，测试质检和部署交付仍会兼容使用旧的 `coding` 配置；新建或重新提交模型选择后会保存五阶段配置。
- 首次需求流修复依赖前端快照补取和 SSE delta 占位合并；若后端长时间完全无输出，仍需要等待 opencode 输出或超时诊断日志。
- 左侧应用列表不再提供运行/访问入口；访问部署应用统一保留在主内容区顶部按钮。
- 全局左侧菜单已删除，其他页面入口不再从当前壳层暴露；如后续需要工作台大盘或系统设置，应单独设计新的入口。
- 阶段跳过不会伪造产物或部署地址；若后续真实阶段缺少必要产物，会在实际使用该产物的阶段失败。
- 跳过部署交付后工单状态为 `COMPLETED` 而非 `DEPLOYED`，访问部署应用按钮仍因没有 `deploymentUrl` 保持不可用。
- 本次不修改 15 分钟超时策略；opencode 自身日志只记录目录位置，阶段日志和本地诊断 JSONL 仅写入脱敏摘要。

## 本会话修改文件

- `server/index.js`、`server/lib/store.js`、`server/lib/orchestrator.js`、`server/lib/opencode.js`：扩展创建工单请求体，支持标题/描述/延迟澄清，确保后续 prompt 包含应用壳上下文和用户原始需求。
- `src/api/workOrders.js`、`src/pages/KanbanBoard.jsx`：新建应用弹窗、AI 助手原始需求提示、应用列表名称/描述展示、成果物聚合和二级详情。
- `src/pages/KanbanBoard.jsx`：应用列表卡片极简化，仅展示头像、应用名称和应用描述。
- `src/App.jsx`、`src/pages/KanbanBoard.jsx`：删除全局左侧菜单，默认直接展示生产看板；看板标题改为“智能软件工厂”并居中。
- `tests/backend.test.js`：新增延迟澄清应用壳和 prompt 上下文回归测试。
- `tests/frontend-render.test.js`：新增新建弹窗、原始需求提示、应用列表、成果物聚合渲染测试，并更新应用列表极简展示断言。
- `tests/frontend-render.test.js`：新增无左侧菜单、默认看板入口、标题改名和居中断言。
- `feature_list.json`、`progress.md`：记录本次事项和校验证据。
- `server/lib/stages.js`、`server/lib/orchestrator.js`、`server/index.js`：新增 `SKIPPED` 状态、跳过阶段服务逻辑、阶段跳过接口与流水线跳过判定。
- `src/api/workOrders.js`、`src/pages/KanbanBoard.jsx`：新增跳过阶段 API 调用、StageCard 跳过按钮、已跳过视觉状态和顶部跳过统计。
- `tests/backend.test.js`：新增跳过阶段、接口、部署跳过、中间阶段跳过和缺失产物失败归属回归测试。
- `tests/frontend-render.test.js`：新增 StageCard 跳过按钮/已跳过渲染断言和 `SKIPPED` 事件合并断言。
- `docs/AI研发助手单机版需求文档.md`、`docs/AI研发助手实时日志与对话需求补充.md`：补充跳过规则、状态模型、接口和 SSE 状态说明。
- `server/lib/runner.js`：为命令执行结果增加 PID、startedAt、lastOutputAt、idleMs、stdout/stderr 字节和行数等诊断元数据。
- `server/lib/opencode.js`：支持需求澄清阶段启用 `--print-logs --log-level DEBUG`。
- `server/lib/orchestrator.js`：增强 opencode 阶段日志、写入 `opencode-diagnostics.jsonl`、记录 opencode 本机日志目录并脱敏敏感字段。
- `tests/backend.test.js`：新增 opencode 超时诊断、空输出提示、stderr 脱敏和需求澄清 debug 参数回归测试。
- `server/lib/store.js`：修复 `messages.json.tmp` / `state.json.tmp` 固定临时文件名并发 rename 竞争，消息写入按工单串行化。
- `tests/backend.test.js`：新增并发 `messages.json` 写入回归测试。
- `server/lib/apps.js`：新增内设应用注册表和工作空间初始化逻辑。
- `server/index.js`、`server/lib/orchestrator.js`、`server/lib/store.js`、`server/lib/opencode.js`：新增应用注册表 API、模型列表 API、模型选择保存、工单绑定应用 workspace、opencode `--model` 传参。
- `src/api/workOrders.js`、`src/pages/KanbanBoard.jsx`：新增应用/模型 API 调用、新建应用需求澄清模型选择、阶段卡片设计/编码模型选择、启动智能开发时提交模型配置。
- `tests/backend.test.js`、`tests/frontend-render.test.js`：新增应用工作空间、模型目录、模型校验、命令传参、前端选择器和 API 请求体回归测试。
- `docs/AI研发助手单机版需求文档.md`：补充应用工作空间、模型选择接口和 opencode 执行策略。
- `dist/index.html`：`npm run build` 刷新的构建产物入口。
- `feature_list.json`、`progress.md`、`session-handoff.md`：记录 `product-014` 状态与校验证据。
- `src/api/workOrders.js`：新增 `fetchWorkOrder`，用于首次发送需求后补取当前工单快照。
- `src/pages/KanbanBoard.jsx`：阶段卡片模型选择改为齿轮配置弹层，隐藏卡片内状态文案，并增强 SSE delta 缺失 append 时的流式消息合并。
- `tests/frontend-render.test.js`：新增/更新卡片齿轮配置、状态文案移除、API 快照读取和缺失 append 的需求流回归测试。
- `docs/AI研发助手单机版需求文档.md`：补充阶段卡片配置收纳、状态文案精简和首次需求实时刷新要求。
- `feature_list.json`、`progress.md`、`session-handoff.md`：记录 `product-015` 状态与校验证据。
- `server/lib/orchestrator.js`、`server/lib/store.js`：将模型选择扩展为五阶段，测试/部署使用对应模型，测试自动返修使用 `testing` 模型，并兼容旧工单缺失 `testing`/`deployment` 的情况。
- `src/pages/KanbanBoard.jsx`：项目默认模型一次填入五个阶段，测试质检/部署交付阶段卡片支持齿轮配置入口。
- `tests/backend.test.js`、`tests/frontend-render.test.js`：新增/更新五阶段模型保存校验、阶段命令传参、测试返修模型、项目默认模型和测试/部署卡片齿轮入口回归测试。
- `docs/AI研发助手单机版需求文档.md`：更新五阶段模型选择接口、执行策略和前端改造点。
- `feature_list.json`、`progress.md`、`session-handoff.md`：记录 `product-016` 状态与校验证据。
- `server/index.js`、`server/lib/orchestrator.js`、`server/lib/store.js`、`server/lib/opencode.js`：新增 opencode Agent 目录接口、五阶段 `agentSelections` 校验/持久化、阶段执行 `--agent` 传参和生成提示词强化。
- `src/api/workOrders.js`、`src/pages/KanbanBoard.jsx`：新增 Agent 目录/配置 API 调用、五阶段 Agent 配置齿轮、创建工单与启动开发时提交 `agentSelections`，并保持主卡片不暴露真实 Agent id。
- `tests/backend.test.js`、`tests/frontend-render.test.js`：新增/更新 Agent 目录解析、Agent 选择保存校验、阶段命令传参、测试返修 Agent、Playwright 提示词和前端 Agent 配置回归测试。
- `docs/AI研发助手单机版需求文档.md`：补充 Agent 目录接口、阶段 Agent 配置接口、开发启动请求体和 opencode `--agent` 执行策略。
- `feature_list.json`、`progress.md`、`session-handoff.md`：记录 `product-017` 状态与校验证据。

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
- [x] 红灯验证：2026-06-25 16:43 执行 `node --test --test-name-pattern='skipStage|skips deployment|skipped middle|skipped coding' tests/backend.test.js` 失败，确认旧实现缺少 `service.skipStage`。
- [x] 红灯验证：2026-06-25 16:43 执行 `node --test --test-name-pattern='StageCard shows|applyGranularEventToOrder' tests/frontend-render.test.js` 失败，确认旧 StageCard 未渲染“跳过”按钮。
- [x] 定向后端回归：2026-06-25 16:43 执行 `node --test --test-name-pattern='skipStage|stage-skips|skips deployment|skipped middle|skipped coding' tests/backend.test.js` 通过。
- [x] 定向前端回归：2026-06-25 16:43 执行 `node --test --test-name-pattern='StageCard shows|applyGranularEventToOrder' tests/frontend-render.test.js` 通过。
- [x] `npm test`：2026-06-25 16:43 执行通过，56 个测试全部通过。
- [x] `npm run build`：2026-06-25 16:43 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-25 16:43 执行通过；`npm test` 56/56，`npm run build` 成功。
- [x] `./init.sh`：2026-06-25 17:05 执行通过；`npm test` 56/56，`npm run build` 成功。
- [x] `./init.sh`：2026-06-25 17:26 执行通过；`npm test` 56/56，`npm run build` 成功。
- [x] 红灯验证：2026-06-25 17:47 执行 `node --test --test-name-pattern='diagnostics|print logs|times out without output|stderr diagnostics' tests/backend.test.js` 失败，确认旧实现缺少 runner diagnostics、阶段日志 PID/空输出/脱敏和 opencode debug 参数。
- [x] 定向诊断回归：2026-06-25 17:52 执行 `node --test --test-name-pattern='clarification complete|diagnostics|print logs|times out without output|stderr diagnostics' tests/backend.test.js` 通过。
- [x] 后端回归：2026-06-25 17:52 执行 `node --test tests/backend.test.js` 通过，46 个测试全部通过。
- [x] `npm test`：2026-06-25 17:55 执行通过，60 个测试全部通过。
- [x] `npm run build`：2026-06-25 17:55 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-25 17:55 执行通过；`npm test` 60/60，`npm run build` 成功。
- [x] 基线校验：2026-06-25 18:06 执行 `./init.sh` 通过；`npm test` 60/60，`npm run build` 成功。
- [x] 红灯验证：2026-06-25 18:06 执行 `node --test --test-name-pattern='concurrent message file writes' tests/backend.test.js` 失败，复现并发写 `messages.json.tmp` 触发多个 `ENOENT`。
- [x] 定向回归：2026-06-25 18:06 执行 `node --test --test-name-pattern='concurrent message file writes' tests/backend.test.js` 通过。
- [x] 后端回归：2026-06-25 18:06 执行 `node --test tests/backend.test.js` 通过，47 个测试全部通过。
- [x] `npm test`：2026-06-25 18:07 执行通过，61 个测试全部通过。
- [x] `npm run build`：2026-06-25 18:07 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-25 18:07 执行通过；`npm test` 61/61，`npm run build` 成功。
- [x] 红灯验证：2026-06-25 22:57 执行 `node --test --test-name-pattern='built-in app|model catalog|model selections|opencode command uses|opencode stages use|buildOpencodeCommand adds --model|GET /api/apps|PATCH /api/work-orders' tests/backend.test.js` 失败，确认旧实现缺少应用注册表、模型目录、模型选择接口和 `--model` 传参。
- [x] 红灯验证：2026-06-25 22:57 执行 `node --test --test-name-pattern='requirements model selector|work order API sends model selections|StageCard renders editable model selector' tests/frontend-render.test.js` 失败，确认旧前端缺少模型下拉、模型 API 和阶段卡片配置。
- [x] 定向后端回归：2026-06-25 22:57 执行 `node --test --test-name-pattern='built-in app|model catalog|model selections|opencode command uses|opencode stages use|buildOpencodeCommand adds --model|GET /api/apps|PATCH /api/work-orders|startDevelopmentRun only launches|install/build/test commands' tests/backend.test.js` 通过。
- [x] 定向前端回归：2026-06-25 22:57 执行 `node --test --test-name-pattern='renders application production line|CreateWorkOrderModal|requirements model selector|work order API sends model selections|StageCard renders editable model selector|AIChatPanel renders opencode-stream' tests/frontend-render.test.js` 通过。
- [x] `npm test`：2026-06-25 22:57 执行通过，72 个测试全部通过。
- [x] `npm run build`：2026-06-25 22:57 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-25 22:57 执行通过；`npm test` 72/72，`npm run build` 成功。
- [x] 红灯验证：2026-06-26 执行 `node --test --test-name-pattern='work order API sends model selections|StageCard shows estimated|StageCard hides model details|applyGranularEventToOrder merges SSE deltas' tests/frontend-render.test.js` 失败，确认旧实现缺少 `fetchWorkOrder`、仍直接展示模型 select/模型名、仍展示卡片状态文案，且缺失 append 的 delta 会被丢弃。
- [x] 定向前端回归：2026-06-26 执行 `node --test --test-name-pattern='work order API sends model selections|StageCard shows estimated|StageCard hides model details|applyGranularEventToOrder merges SSE deltas' tests/frontend-render.test.js` 通过。
- [x] 前端渲染回归：2026-06-26 执行 `node --test tests/frontend-render.test.js` 通过，17 个测试全部通过。
- [x] `npm test`：2026-06-26 执行通过，72 个测试全部通过。
- [x] `npm run build`：2026-06-26 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-26 执行通过；`npm test` 72/72，`npm run build` 成功。
- [x] 红灯验证：2026-06-26 执行 `node --test --test-name-pattern='model selections|opencode stages use|testing failure triggers one automatic repair attempt|StageCard hides model details|work order API sends model selections|project default model' tests/backend.test.js tests/frontend-render.test.js` 失败，确认旧实现拒绝 `testing/deployment`、测试/部署/返修仍沿用 `coding`，且前端仍显示“需求澄清模型”、测试/部署无齿轮入口。
- [x] 定向回归：2026-06-26 执行 `node --test --test-name-pattern='model selections|opencode stages use|testing failure triggers one automatic repair attempt|StageCard hides model details|work order API sends model selections|project default model' tests/backend.test.js tests/frontend-render.test.js` 通过。
- [x] `npm test`：2026-06-26 执行通过，72 个测试全部通过。
- [x] `npm run build`：2026-06-26 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-26 执行通过；`npm test` 72/72，`npm run build` 成功。
- [x] 红灯验证：2026-06-26 执行 `node --test --test-name-pattern='opencode agent|agent selections|--agent|Playwright|StageCard.*agent|work order API sends.*agent' tests/backend.test.js tests/frontend-render.test.js` 失败，确认旧实现缺少 Agent 目录、`agentSelections`、`--agent`、Playwright 提示词和前端 API/UI 支持。
- [x] 定向回归：2026-06-26 执行 `node --test --test-name-pattern='opencode agent|agent selections|--agent|Playwright|StageCard.*agent|work order API sends.*agent' tests/backend.test.js tests/frontend-render.test.js` 通过，9 个测试全部通过。
- [x] 后端/前端回归：2026-06-26 执行 `node --test tests/backend.test.js tests/frontend-render.test.js` 通过，80 个测试全部通过。
- [x] `npm test`：2026-06-26 执行通过，80 个测试全部通过。
- [x] `npm run build`：2026-06-26 执行通过，Vite 生产构建成功。
- [x] `./init.sh`：2026-06-26 执行通过；`npm test` 80/80，`npm run build` 成功。

## 构建提示

- Vite 报告一个压缩后超过 500 kB 的产物提示（`index-*.js` 约 201 kB gzip）；该提示不影响本次基线校验。后续如进行性能优化，可单独评估按路由或依赖拆包，避免与功能需求混合处理。
