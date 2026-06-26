# 会话交接

<!-- Machine-readable harness anchors: Current Objective | Blockers | Files | Next Session | Recommended Next Step -->

## 当前目标

- 目标：完成 `product-021` 点击开始智能开发即确认 outputSpec（消除两轮澄清闭环）。
- 当前状态：已实现并通过定向自动化验证；首轮模型输出 outputSpec 后用户审阅 reply 末尾合成句，无误直接点击「开始智能开发」即视为确认，outputSpec 合成句静默注入后续阶段 `userInput`；CLARIFYING 状态下有 outputSpec 时也可强制启动。
- 分支 / 提交：`0630`，本次未创建提交。

## 本会话已完成

- `server/lib/opencode.js`：
  - `createClarificationPrompt` 删除两轮闭环描述（「用户可在下一条消息中直接回贴」「当用户最近一条消息明显确认或复述」），改为「满足条件时首轮即 `complete=true`，无需等待用户在对话中再次确认」「直接点击前端『开始智能开发』按钮即视为确认」。
- `server/lib/orchestrator.js`：
  - `processClarification` 在 `if (!clarification.complete)` 分支前新增 `state.outputSpec = clarification.outputSpec`，`complete=true` 与 `complete=false` 两分支均持久化。
  - `startDevelopmentRun` 放宽状态校验至 `[READY_FOR_DEVELOPMENT, CLARIFYING]`；CLARIFYING 强制启动时要求 `state.outputSpec?.sentence` 非空（否则 `CONFLICT`），并执行 `markStageCompleted(requirements, ...)`、`outputs=[]`、兜底 `fallbackRequirementsItems`/`fallbackRequirementsMarkdown`、`writeHandoffDocument`、`state.currentStage=2`。
  - 新增 `buildUserInput(state)` helper：`[extractUserInput(messages), state.outputSpec?.sentence].filter(Boolean).join('\n\n')`；`runOpencodePipelineStage` 与 `runTestingRepairAttempt` 的 `userInput` 改用 `buildUserInput(state)`，静默注入合成句，不新增可见聊天消息。
- `src/pages/KanbanBoard.jsx`：
  - `canStartDevelopment` 扩展为 `READY_FOR_DEVELOPMENT` 或 `(CLARIFYING 且 outputSpec?.sentence)`；按钮 tooltip 改为「点击即确认输出规格并启动智能开发流水线」。
- `tests/backend.test.js`：
  - 更新 `clarification prompt asks...` 断言（删两条旧文案、加两条新文案、加两条 `doesNotMatch` 确保旧两轮文案已移除）。
  - 新增 4 个测试：`processClarification persists outputSpec on state when clarification completes`、`runOpencodePipelineStage injects confirmed outputSpec sentence into stage prompt userInput`、`startDevelopmentRun force-starts from CLARIFYING when outputSpec sentence is present`、`startDevelopmentRun from CLARIFYING without outputSpec is rejected with CONFLICT`。
- `tests/frontend-render.test.js`：
  - 在既有 `AIChatPanel renders opencode-stream messages with pre-wrap and start button only when ready` 测试中新增 CLARIFYING+outputSpec 显示按钮 + tooltip 断言。
- 功能清单、进度文档和本交接文档已同步更新。

## 校验证据

| 检查项 | 命令 | 结果 | 备注 |
| --- | --- | --- | --- |
| 定向回归 | `node --test --test-name-pattern='clarification\|outputSpec\|startDevelopmentRun\|runPipeline\|opencode error events\|plain requirements markdown\|multiline requirementsMarkdown' tests/backend.test.js` | 通过（19/19） | 2026-06-26。 |
| 前端按钮测试 | `node --test --test-name-pattern='AIChatPanel renders opencode-stream messages with pre-wrap and start button only when ready' tests/frontend-render.test.js` | 通过 | 2026-06-26，含新增 CLARIFYING+outputSpec 断言。 |
| 全量测试 | `npm test` | 89/90 | 2026-06-26。失败项 `stage prompts require web applications to include Playwright end-to-end coverage` 为 baseline 预存失败，与本事项无关。 |
| 生产构建 | `npm run build` | 通过 | 2026-06-26。 |
| 基线校验 | `./init.sh` | 未全绿 | 因 baseline 预存失败，待单独工单修复 `createStagePrompt` coding 段 Playwright 提示词。 |

## 变更文件

- `server/lib/opencode.js`
- `server/lib/orchestrator.js`
- `src/pages/KanbanBoard.jsx`
- `tests/backend.test.js`
- `tests/frontend-render.test.js`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## 风险与阻塞

- 无阻塞。
- `outputSpec` 仍只在 AI reply 末尾以文本形式展示，前端未做独立高亮卡片；若需更醒目的审阅 UI，需另开工单。
- baseline `npm test` 当前 89/90：`stage prompts require web applications to include Playwright end-to-end coverage` 失败（`createStagePrompt` coding 段未含 Playwright）。已用 `git stash` 验证 baseline 同样失败，与本次改动无关；本次未触碰 `createStagePrompt`。

## 下次会话启动

1. 执行 `./init.sh` 确认基线（已知 `stage prompts require web applications...` 预存失败，与本工单无关）。
2. 真实跑一次新流程：首轮澄清应直接返回 `complete=true` + reply 末尾「输出规格：...」；用户点击「开始智能开发」后 design 阶段 prompt 的「原始用户需求如下」段应包含 outputSpec 合成句。CLARIFYING 状态下若已有 outputSpec 也能点击强制启动。
3. 排查并修复 baseline 预存失败 `stage prompts require web applications to include Playwright end-to-end coverage`（需在 `createStagePrompt` coding 段补回 Playwright 端到端测试要求，或更新该测试断言）。

## 推荐下一步

- 评估是否需要把 `outputSpec` 在前端做独立高亮卡片（含五空位 + 合成句 + 确认按钮），替代目前依赖 reply 末尾文本的审阅方式。
- 评估是否需要把 `state.requirementsMarkdown` 也从 state.json 中移除（当前保留仅作内部兜底解析）。
