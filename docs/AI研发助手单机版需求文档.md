# AI研发助手单机版需求文档

## 1. 背景

当前流水线看板已经具备五阶段可视化形态，但阶段推进仍是前端模拟逻辑。第一版目标是实现一条真实可运行的单机研发闭环：用户在 AI 研发助手输入需求，系统完成需求澄清后自动调用 opencode 执行研发流水线，最终将生成的软件部署在当前机器，并将阶段状态实时展示到流水线看板。

## 2. 第一版范围

### 2.1 包含

- 单用户/管理员使用。
- AI 研发助手输入和需求澄清。
- 自动生成并保存需求规格文档。
- 自动推进五阶段流水线：
  - 需求待入厂
  - 系统设计
  - 智能编码
  - 测试质检
  - 部署交付
- 每个阶段实时回传状态、日志、进度和产物。
- 使用 opencode 作为研发执行引擎。
- 在当前机器启动生成的软件服务。
- 部署成功后返回本机访问地址。
- 为内设应用创建稳定本地工作空间，便于后续放置应用专属 Agent、Skill、文档和源码。
- 新建项目时支持选择项目默认模型，并在需求澄清、系统设计、智能编码、测试质检、部署交付五个阶段使用本机 opencode 已配置模型。

### 2.2 不包含

- 复杂审批流。
- 多人协作。
- 远程服务器部署。
- 权限体系和组织管理。
- 消息通知。
- 多环境灰度发布。

## 3. 用户流程

1. 用户打开流水线看板，选择或创建一个应用工单。
2. 用户在 AI 研发助手中输入软件需求。
3. 系统判断需求是否足够执行。
4. 如果需求不完整，AI 研发助手继续提出澄清问题。
5. 当需求满足执行条件，系统生成可执行需求规格。
6. 系统将需求文档保存到 `docs` 目录。
7. 系统创建或更新工单，并开始自动执行流水线。
8. 前端通过实时事件流刷新阶段状态。
9. 最后一个阶段完成后，系统在当前机器启动服务。
10. 看板展示部署访问地址，用户可点击访问生成的软件。

## 4. 需求澄清完成标准

系统在进入流水线前，必须形成结构化需求信息：

- 目标：要构建或修改什么软件能力。
- 用户：目标使用者是谁。
- 输入：数据来源、用户输入或外部接口。
- 输出：界面、接口、报表、文件或服务能力。
- 验收条件：至少包含 3 条可验证条件。
- 技术约束：框架、语言、端口、依赖或本机运行要求。
- 部署目标：当前机器本地部署。

缺少关键字段时，AI 研发助手继续澄清；字段完整后，后续执行必须保持 0 用户参与。

## 5. 阶段与准出规则

### 5.1 需求待入厂

- 输入：用户原始需求和澄清结果。
- 处理：生成需求规格文档。
- 输出：
  - `docs/requirements/WO-xxx-requirements.md`
- 准出：
  - 需求文档生成成功。
  - 需求文档包含目标、范围、验收条件和部署目标。

### 5.2 系统设计

- 输入：需求规格文档。
- 处理：调用 opencode 生成设计文档。
- 输出：
  - `architecture.md`
  - `api.md`
  - `tasks.md`
- 准出：
  - 设计文档生成成功。
  - 任务拆分可进入编码阶段。

### 5.3 智能编码

- 输入：需求文档和设计文档。
- 处理：调用 opencode 生成或修改源码。
- 输出：
  - 源码文件。
  - 构建日志。
  - 代码变更摘要。
- 准出：
  - 源码生成完成。
  - 构建命令退出码为 0。

### 5.4 测试质检

- 输入：源码和测试要求。
- 处理：运行测试命令。
- 输出：
  - 测试报告。
  - 失败用例列表。
  - 覆盖率信息，如项目支持。
- 准出：
  - 测试命令退出码为 0。
  - 无阻断级失败。

### 5.5 部署交付

- 输入：构建产物。
- 处理：在当前机器分配端口并启动服务。
- 输出：
  - 本机访问地址。
  - 部署日志。
  - 健康检查结果。
- 准出：
  - 服务进程启动成功。
  - 健康检查通过。
  - 看板可展示访问地址。

### 5.6 阶段跳过

- 允许跳过阶段：
  - `系统设计`
  - `智能编码`
  - `测试质检`
  - `部署交付`
- 仅允许跳过尚未开始的 `PENDING` 阶段。
- `需求待入厂`、`RUNNING`、`COMPLETED`、`FAILED`、`SKIPPED` 阶段不得跳过。
- 跳过后阶段状态持久化为 `SKIPPED`，看板显示“已跳过”，整体进度按该阶段已完成计算。
- 流水线继续按原顺序执行；执行每个阶段前必须重新读取阶段状态，若阶段为 `SKIPPED`，不得调用该阶段的 opencode、测试或部署逻辑。
- 若 `部署交付` 被跳过，工单最终状态为 `COMPLETED`，不写入 `deploymentUrl`，也不发送部署成功事件。

## 6. 状态模型

每个工单维护统一状态：

```json
{
  "id": "WO-001",
  "title": "潮汐窗口计算器",
  "status": "RUNNING",
  "currentStage": "智能编码",
  "progress": 60,
  "deploymentUrl": null,
  "stages": [
    {
      "name": "需求待入厂",
      "status": "COMPLETED",
      "progress": 100,
      "message": "需求规格文档已生成",
      "artifacts": ["docs/requirements/WO-001-requirements.md"]
    }
  ]
}
```

阶段状态枚举：

- `PENDING`
- `RUNNING`
- `COMPLETED`
- `SKIPPED`
- `FAILED`

工单状态枚举：

- `CLARIFYING`
- `READY_FOR_DEVELOPMENT`
- `RUNNING`
- `DEPLOYED`
- `COMPLETED`
- `FAILED`

## 7. 后端接口

### 7.1 创建工单

```http
POST /api/work-orders
```

请求：

```json
{
  "title": "潮汐窗口计算器",
  "requirement": "接入公开潮汐API，计算四大母港可出港时间窗..."
}
```

响应：

```json
{
  "workOrderId": "WO-001",
  "status": "CLARIFYING"
}
```

### 7.2 发送助手消息

```http
POST /api/work-orders/:id/messages
```

用途：

- 继续需求澄清。
- 在澄清完成后自动启动流水线。

### 7.3 查询工单状态

```http
GET /api/work-orders/:id
```

返回当前阶段、进度、产物和部署地址。

### 7.4 订阅实时事件

```http
GET /api/work-orders/:id/events
```

使用 SSE 推送事件：

```json
{
  "type": "stage_progress",
  "workOrderId": "WO-001",
  "stage": "测试质检",
  "status": "RUNNING",
  "progress": 75,
  "message": "正在运行测试用例 18/24"
}
```

### 7.5 跳过阶段

```http
POST /api/work-orders/:id/stage-skips
```

请求：

```json
{
  "stageKey": "design"
}
```

`stageKey` 仅允许：

- `design`
- `coding`
- `testing`
- `deployment`

响应：

```json
{
  "workOrder": {}
}
```

校验规则：

- 仅允许状态为 `READY_FOR_DEVELOPMENT` 或 `RUNNING` 的工单跳过阶段。
- 仅允许跳过 `PENDING` 阶段。
- 无效阶段、`requirements` 或不允许跳过的阶段返回结构化错误。

### 7.6 查询内设应用

```http
GET /api/apps
```

返回 4 个内设应用及其工作空间状态。每个应用包含：

- `id`：稳定应用标识，例如 `builtin-tide-window`。
- `title`：应用名称。
- `workspaceDir`：应用工作空间路径。
- `appDir`：该应用源码目录。
- `directories`：`app`、`agents`、`skills`、`docs` 目录是否就绪。

### 7.7 查询 opencode 模型

```http
GET /api/opencode-models
```

后端只从当前机器的 `opencode models` 输出中读取可选模型。返回模型必须使用 `provider/model` 格式；未出现在该列表中的模型不得保存或提交给阶段执行。

### 7.8 保存阶段模型选择

```http
PATCH /api/work-orders/:id/model-selections
```

请求：

```json
{
  "modelSelections": {
    "requirements": "opencode/deepseek-v4-flash-free",
    "design": "openai/gpt-5.2",
    "coding": "opencode/deepseek-v4-flash-free",
    "testing": "openai/gpt-5.2",
    "deployment": "opencode/deepseek-v4-flash-free"
  }
}
```

规则：

- 仅支持 `requirements`、`design`、`coding`、`testing`、`deployment` 五个键。
- 只允许保存 `GET /api/opencode-models` 返回的模型。
- 仅允许在需求澄清或待启动智能开发阶段修改；流水线启动后锁定。
- 新建项目时选择的模型是项目默认模型；前端应将其填入五个阶段，后续允许系统设计、智能编码、测试质检、部署交付在阶段卡片中单独调整。
- 历史工单若缺少 `testing` 或 `deployment`，后端读取时保持兼容，不破坏旧数据。

### 7.9 启动智能开发时提交模型选择

```http
POST /api/work-orders/:id/development-runs
```

请求体可包含最终模型选择：

```json
{
  "modelSelections": {
    "design": "openai/gpt-5.2",
    "coding": "opencode/deepseek-v4-flash-free",
    "testing": "openai/gpt-5.2",
    "deployment": "opencode/deepseek-v4-flash-free"
  }
}
```

后端保存并校验模型选择后再启动流水线。

## 8. opencode 执行策略

每个阶段单独调用 opencode，避免一个长任务不可控。

若工单保存了阶段模型选择，后端必须在对应 opencode 命令中增加 `--model provider/model`。需求澄清使用 `requirements`，系统设计使用 `design`，智能编码使用 `coding`，测试质检准备和测试自动返修使用 `testing`，部署交付准备使用 `deployment`。历史工单缺少 `testing` 或 `deployment` 时，允许兼容回落到旧的 `coding` 配置。

示例：

```bash
opencode run --format json --dir .runtime/work-orders/WO-001/app \
  "你现在执行系统设计阶段。根据 docs/requirements/WO-001-requirements.md 生成 architecture.md、api.md、tasks.md。不要进入编码。"
```

编码阶段：

```bash
opencode run --format json --dir .runtime/work-orders/WO-001/app \
  "你现在执行智能编码阶段。根据需求和设计完成实现。完成后不要部署，只保证构建通过。"
```

构建、测试、部署由后端直接执行确定性命令，不完全依赖模型判断。

## 9. 本机部署策略

第一版使用本地进程部署。

- 每个工单分配一个独立端口。
- 端口从 `4101` 开始递增。
- 部署命令优先使用项目脚本：
  - `npm run build`
  - `npm run preview -- --host 0.0.0.0 --port <port>`
- 健康检查默认访问：
  - `http://127.0.0.1:<port>`

部署成功后，工单写入：

```json
{
  "deploymentUrl": "http://127.0.0.1:4101"
}
```

## 10. 本地文件结构

建议第一版使用本地文件保存运行状态：

```text
.runtime/
  app-workspaces/
    tide-window-calculator/
      workspace.json
      agents/
      skills/
      docs/
      app/
  work-orders/
    WO-001/
      state.json
      events.jsonl
      logs/
      app/
docs/
  requirements/
    WO-001-requirements.md
```

说明：

- `docs/requirements/` 保存最终需求规格文档。
- `.runtime/app-workspaces/` 保存内设应用的稳定工作空间。
- `.runtime/work-orders/` 保存运行态数据、日志和生成应用。
- 第一版不引入数据库；后续可迁移到 SQLite 或 PostgreSQL。

## 11. 前端改造点

- 将 `KanbanBoard.jsx` 中的静态 `workOrders` 替换为后端工单数据。
- 删除 `onAdvanceStages` 的 `setTimeout` 模拟推进逻辑。
- `AIChatPanel` 发送消息时调用后端接口。
- 看板通过 SSE 订阅阶段事件。
- 收到事件后刷新阶段卡片、进度、日志和产物。
- 首次从内设应用输入需求并创建真实工单后，前端必须立即展示需求待入厂阶段的思考过程；若订阅建立前已有事件落盘，应通过工单快照或 SSE 历史/增量兜底合并，无需用户刷新页面。
- 新建项目弹窗和内设应用首次需求前的模型选择命名为“项目默认模型”，选择后应填入 `requirements`、`design`、`coding`、`testing`、`deployment` 五个阶段。
- 系统设计、智能编码、测试质检、部署交付阶段的模型选择应收纳在阶段卡片的齿轮配置按钮中；点击后才展示模型选择器，主卡片不直接展示模型名称或下拉框。
- 阶段卡片不展示“进行中”“等待中”“已完成”“开发失败”等冗余状态文案，状态由图标、进度条、颜色和日志内容表达。
- 部署成功后启用“访问部署应用”按钮。

## 12. 验收标准

- 用户输入需求后，系统可以完成必要澄清。
- 澄清完成后，用户不再参与，流水线自动执行。
- 需求文档保存到 `docs/requirements/`。
- 看板实时展示五阶段状态变化。
- opencode 至少被用于系统设计和智能编码阶段。
- 构建失败或测试失败时，阶段显示 `FAILED` 并保留日志。
- 部署成功后，页面展示本机访问地址。
- 用户点击访问地址可以打开生成的软件。
