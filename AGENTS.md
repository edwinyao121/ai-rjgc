# AGENTS.md

<!-- Machine-readable harness anchors: Startup Workflow | Definition of Done | One feature at a time | Stay in scope | End of Session | restartable | clean -->

本仓库是“AI 研发助手单机版”：前端使用 Vite + React，后端使用 Node.js。产品范围、阶段准出规则与接口约定以 `docs/AI研发助手单机版需求文档.md` 为准；页面视觉规范见 `docs/设计规范.txt`。

## 启动流程

修改代码前依次执行：

1. 使用 `pwd` 确认位于仓库根目录，并完整阅读本文件。
2. 阅读与任务相关的需求文档：优先查看 `docs/requirements/` 中对应工单，再查看产品需求文档。
3. 执行 `./init.sh`，确认当前基线可用。
4. 阅读 `feature_list.json` 和 `progress.md`，确认唯一进行中的事项、依赖关系与已知风险。
5. 使用 `git log --oneline -5` 和 `git status --short` 了解近期变更及工作区状态。

基线校验失败时，先在 `progress.md` 记录并解决或升级该问题；不要在失败基线上扩大需求范围。

## 工作约束

- 每次只处理 `feature_list.json` 中的一项未完成事项；没有明确事项时，先向用户确认，不自行扩展产品范围。
- 只修改与当前事项直接相关的文件；不得覆盖或回退用户已有的未提交变更。
- 改动接口、流水线阶段、状态枚举或需求准出规则前，必须先核对产品需求文档。
- 新增或变更行为时，同步新增或更新可自动执行的测试；无法自动化的部分须记录手工验证步骤和结果。
- 不得在代码、文档、日志或提交中写入密钥、令牌、真实个人数据或外部服务凭据。
- 结束会话前，更新 `feature_list.json`、`progress.md`；跨会话或存在未完成工作时，也更新 `session-handoff.md`。

## 完成定义

一项功能仅在以下条件全部满足后才可标为 `completed`：

- [ ] 目标行为和验收条件已实现。
- [ ] 相关自动化测试已新增或更新，并已通过。
- [ ] `npm test` 与 `npm run build` 均已在本次修改后通过。
- [ ] 手工验证、命令输出或未覆盖风险已写入状态文档。
- [ ] 仓库可由下一位执行者通过 `./init.sh` 重新开始工作。

## 会话收尾

1. 执行与改动匹配的测试以及 `./init.sh`。
2. 在 `feature_list.json` 写入状态和可复核证据。
3. 在 `progress.md` 记录完成项、进行项、风险和下一步。
4. 若未完成或需换会话，更新 `session-handoff.md`。
5. 仅在工作处于安全、可验证状态后创建描述准确的提交。

## 标准校验

```bash
./init.sh
```

该脚本顺序执行：

- `npm test`
- `npm run build`

## 需要升级给用户的情况

- 需求、验收标准或工单优先级不明确。
- 需要改动既有架构、对外接口、端口或部署方式。
- 连续两次定位后仍无法恢复基线校验。
- 需要新增第三方服务、凭据、真实数据或破坏性数据操作。
