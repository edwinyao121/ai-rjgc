# AI研发助手实时日志与对话需求补充

## 1. 文档目的

本文档补充 `docs/AI研发助手单机版需求文档.md` 中的实时可视化要求，明确第一版需要支持：

- 看板阶段卡片详情展示进行中的实时日志。
- AI 研发助手展示用户、AI、系统和工具之间的实时交互。
- 阶段状态、阶段日志、AI 对话共用同一条实时事件流。

## 2. 背景

原需求已经确定第一版不做复杂审批、多人协作和远程部署，目标是在单机环境中完成从需求澄清、研发执行到本机部署的闭环。

在此基础上，用户需要在流水线执行过程中实时看到更多细节，而不是只在阶段完成后看到总日志或总结。尤其是：

- 点击 `系统设计`、`智能编码`、`测试质检` 等阶段卡片时，需要看到该阶段正在产生的实时日志。
- AI 研发助手面板需要持续展示和 AI 的需求澄清、阶段说明、执行摘要和错误解释。

## 3. 新增需求范围

### 3.1 包含

- 阶段详情面板实时显示日志增量。
- 日志来源至少区分：
  - `opencode`
  - `system`
  - `command`
  - `test`
  - `deploy`
- 日志级别至少区分：
  - `INFO`
  - `WARN`
  - `ERROR`
- AI 助手消息实时显示。
- 支持流式追加 AI 回复内容。
- 刷新页面后可以恢复历史阶段日志和历史聊天记录。
- 阶段日志和 AI 对话都通过 SSE 推送给前端。

### 3.2 不包含

- 展示模型内部推理链。
- 多用户聊天室。
- 人工审批流。
- 日志全文检索。
- 日志持久化到数据库。
- 远程日志采集。

## 4. 用户体验要求

### 4.1 阶段实时日志

用户点击某个阶段卡片后，界面打开该阶段详情区域，展示该阶段的实时日志。

详情区域至少包含：

- 阶段名称。
- 阶段状态。
- 当前进度。
- 日志列表。
- 自动滚动开关。
- 错误日志高亮。
- 日志为空时的空状态。

当阶段正在运行时：

- 新日志应实时追加。
- 默认自动滚动到底部。
- 用户手动向上查看历史日志后，可以暂停自动滚动。
- 阶段失败时，详情区域保留最后的错误日志和失败原因。

### 4.2 AI 研发助手实时对话

AI 研发助手面板需要实时展示以下内容：

- 用户提交的原始需求。
- AI 的澄清问题。
- 用户的澄清回答。
- AI 对需求完整性的确认。
- 每个阶段开始时的执行说明。
- 每个阶段完成后的摘要。
- 阶段失败时的原因说明和下一步建议。

AI 研发助手不展示模型内部推理链，只展示面向用户可审计的外部交互和执行反馈。

## 5. 事件模型

`GET /api/work-orders/:id/events` 是第一版唯一实时通道。前端通过 SSE 订阅该通道，同时驱动看板阶段状态、阶段详情日志和 AI 助手消息。

### 5.1 事件类型

事件类型建议如下：

```json
{
  "type": "stage.status.changed",
  "workOrderId": "WO-001",
  "stageId": "design",
  "status": "RUNNING",
  "progress": 20,
  "message": "系统设计阶段开始"
}
```

```json
{
  "type": "stage.log.append",
  "workOrderId": "WO-001",
  "stageId": "design",
  "entry": {
    "id": "log_001",
    "timestamp": "2026-06-24T10:00:00.000Z",
    "level": "INFO",
    "source": "opencode",
    "text": "正在分析需求文档并生成架构设计"
  }
}
```

```json
{
  "type": "assistant.message.append",
  "workOrderId": "WO-001",
  "message": {
    "id": "msg_001",
    "role": "assistant",
    "phase": "clarification",
    "stageId": null,
    "content": "请补充目标用户和验收条件。",
    "status": "COMPLETED"
  }
}
```

```json
{
  "type": "assistant.message.delta",
  "workOrderId": "WO-001",
  "messageId": "msg_002",
  "delta": "正在生成系统设计文档...",
  "status": "STREAMING"
}
```

```json
{
  "type": "deployment.updated",
  "workOrderId": "WO-001",
  "deploymentUrl": "http://127.0.0.1:4101",
  "status": "DEPLOYED"
}
```

### 5.2 事件顺序

后端必须保证单个工单内事件按产生顺序写入和推送。

推荐规则：

- 每个事件生成单调递增的 `sequence`。
- SSE 推送时携带 `id: <sequence>`。
- 前端按 `sequence` 合并状态，避免重复渲染。
- 浏览器重连时可以使用 `Last-Event-ID` 继续接收后续事件。

## 6. 数据结构补充

### 6.1 阶段日志

阶段日志条目：

```json
{
  "id": "log_001",
  "sequence": 12,
  "workOrderId": "WO-001",
  "stageId": "design",
  "timestamp": "2026-06-24T10:00:00.000Z",
  "level": "INFO",
  "source": "opencode",
  "text": "正在生成 architecture.md"
}
```

### 6.2 AI 消息

AI 助手消息：

```json
{
  "id": "msg_001",
  "sequence": 8,
  "workOrderId": "WO-001",
  "role": "assistant",
  "phase": "execution",
  "stageId": "design",
  "content": "系统设计阶段已开始，我会先生成架构、接口和任务拆分。",
  "status": "COMPLETED",
  "createdAt": "2026-06-24T10:00:00.000Z",
  "updatedAt": "2026-06-24T10:00:01.000Z"
}
```

`role` 枚举：

- `user`
- `assistant`
- `system`
- `tool`

`phase` 枚举：

- `clarification`
- `execution`

消息状态枚举：

- `STREAMING`
- `COMPLETED`
- `FAILED`

## 7. 本地存储补充

第一版继续使用本地文件保存运行态数据。

建议结构：

```text
.runtime/
  work-orders/
    WO-001/
      state.json
      events.jsonl
      messages.json
      logs/
        requirement.jsonl
        design.jsonl
        coding.jsonl
        testing.jsonl
        deploy.jsonl
      app/
```

说明：

- `events.jsonl` 保存所有实时事件，用于 SSE 重放和排障。
- `messages.json` 保存 AI 助手面板可见的完整消息。
- `logs/<stage>.jsonl` 保存每个阶段的日志条目。
- 阶段完成后的总结可以作为普通 `assistant.message.append` 或阶段产物保存，不替代实时日志。

## 8. 后端实现要求

- 执行 `opencode run` 时实时读取 `stdout` 和 `stderr`。
- 后端执行安装、构建、测试和部署命令时也需要实时读取输出。
- 每一行输出转换为 `stage.log.append` 事件。
- AI 澄清和阶段说明使用 `assistant.message.append` 或 `assistant.message.delta` 事件。
- 写入本地文件和推送 SSE 应使用同一个事件入口，避免状态不一致。
- 子进程退出码非 0 时，当前阶段标记为 `FAILED`，并追加错误日志。

## 9. 前端实现要求

- 看板阶段卡片点击后展示阶段详情日志。
- 阶段详情日志按时间顺序显示。
- AI 助手面板订阅同一条 SSE 事件流。
- 前端需要处理 SSE 断线重连。
- 页面首次加载时先调用 `GET /api/work-orders/:id` 获取快照，再连接 SSE 接收增量事件。
- 前端不得依赖 `setTimeout` 模拟阶段推进。

## 10. 验收标准

- 用户点击正在运行的 `系统设计` 卡片，可以看到日志持续追加。
- `opencode` 输出内容能实时出现在对应阶段详情中。
- 构建、测试、部署命令输出能实时出现在对应阶段详情中。
- AI 研发助手能实时显示需求澄清和执行过程中的 AI 消息。
- 刷新页面后，历史日志和历史 AI 消息仍然可见。
- 阶段失败时，看板状态、阶段详情日志和 AI 助手说明保持一致。
- 部署成功后，AI 助手展示交付说明，看板展示本机访问地址。

