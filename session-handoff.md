# 会话交接

<!-- Machine-readable harness anchors: Current Objective | Blockers | Files | Next Session | Recommended Next Step -->

## 当前目标

- 目标：完成 `product-018` 无文档生成实验：编码阶段直接使用原始用户需求。
- 当前状态：已实现并通过自动化验证；不再落盘 `requirements.md` 与 `docs/design.md`，设计/编码/测试/返修/部署提示词改用原始用户需求，前端条目化需求展示不变。
- 分支 / 提交：`0630`，本次未创建提交。

## 本会话已完成

- `server/lib/opencode.js`：
  - `createStagePrompt` 新增 `userInput` 参数，共享段嵌入「原始用户需求如下」替代「需求文档备用内容」，并明确告知「不要读取或依赖 requirements.md、docs/design.md 等需求/设计文档文件」。
  - 设计阶段提示词改为「仅用于本次阶段思考，不要写入 docs/design.md 或任何需求/设计文档文件」；编码阶段由「根据docs/design.md文档」改为「根据上方原始用户需求」。
  - `createTestingRepairPrompt` 参数由 `requirementsMarkdown` 改为 `userInput`，透传给 `createStagePrompt`。
- `server/lib/orchestrator.js`：
  - `processClarification` 不再调用 `store.writeRequirements` 或 `store.writeAppFile` 写入 `requirements.md`，不再设置 `state.requirementsPath`；`state.requirementsMarkdown` 与 `state.requirementsItems` 仍保留于 state.json。
  - 新增 `extractUserInput(messages)` 工具函数，从 `state.messages` 拼接全部用户消息文本，由 `runOpencodePipelineStage` 与 `runTestingRepairAttempt` 传入提示词。
  - `buildHandoffDocument` 第一阅读项与当前工单段改为「结合本工单对话中的原始用户需求」「原始用户需求：见本工单对话记录」，并补充「本工单不落盘 requirements.md、docs/design.md」。
  - 移除已无人调用的 `getRequirementsMarkdown` 方法。
- `tests/backend.test.js`：更新 clarification 完成与 handoff 首读项断言（不再断言 `requirementsPath`，改为断言不写 `requirements.md` 文件、handoff 引用「原始用户需求」）；新增 `stage prompts use original user input instead of requirements markdown and avoid saving design docs` 测试。
- 前端 `RequirementsItemsCard` 链路未改，仍基于 `state.requirementsItems` 渲染。
- 功能清单、进度文档和本交接文档已同步更新。

## 校验证据

| 检查项 | 命令 | 结果 | 备注 |
| --- | --- | --- | --- |
| 定向回归 | `node --test --test-name-pattern='clarification complete leaves\|stage prompt requires handoff\|stage prompts use original user input\|stage prompts require web applications\|coding prompt requires' tests/backend.test.js` | 通过（9/9） | 2026-06-26。 |
| 全量测试 | `npm test` | 通过（81/81） | 2026-06-26。 |
| 生产构建 | `npm run build` | 通过 | 2026-06-26。 |
| 基线校验 | `./init.sh` | 通过（81/81 + build） | 2026-06-26。 |

## 变更文件

- `server/lib/opencode.js`
- `server/lib/orchestrator.js`
- `tests/backend.test.js`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `dist/index.html`

## 风险与阻塞

- 无阻塞。
- 本次为实验性改动：设计阶段不再产出 `docs/design.md`，编码阶段完全依赖原始用户需求与 handoff.md，生成质量可能下降——这正是要观察的效果。
- `state.requirementsMarkdown` 仍保留在 state.json（非文档文件），用于 `parseClarificationResponse` 兜底解析 `requirementsItems`；未写入 app 目录的 `requirements.md`。
- 历史工单若已写入 `requirements.md` 或 `docs/design.md`，文件不会被主动清理；新工单不再生成这些文档。
- `store.writeRequirements` 方法保留（store 层未改动），仅 orchestrator 不再调用；直接测试该方法的单测仍通过。

## 下次会话启动

1. 执行 `./init.sh` 确认基线。
2. 新建工单跑一次完整流水线，观察无文档情况下编码阶段仅凭原始用户需求的生成质量与 Playwright 覆盖情况。
3. 如效果不佳，可考虑回退或引入轻量设计思路落盘。

## 推荐下一步

- 评估是否需要把 `state.requirementsMarkdown` 也从 state.json 中移除（当前保留仅作内部兜底解析）。
- 若实验结果显示生成质量下降明显，可在设计阶段引入「轻量设计要点直接写入 handoff.md」而非独立 docs/design.md，兼顾无独立文档与上下文延续。
