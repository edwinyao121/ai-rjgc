# 项目进度

<!-- Machine-readable harness anchors: Current State | What | Next | Last Updated -->

## 当前状态

- 最后更新：2026-06-25 04:12（Asia/Shanghai）
- 当前分支：`0630`
- 当前事项：无。
- 会话目标：实现测试质检失败后的自动返修循环、阶段交接文档与需求展示精简。

## 已完成

- [x] 确认项目技术栈：Vite + React 前端、Node.js 后端，包管理器为 npm。
- [x] 确认产品事实来源：`docs/AI研发助手单机版需求文档.md`、`docs/requirements/` 与 `docs/设计规范.txt`。
- [x] 创建中文 `AGENTS.md`、`feature_list.json`、`progress.md`、`session-handoff.md` 与 `init.sh`。
- [x] 修复 `WO-20260625-001` 测试质检的 PEP 668 失败：安装改为项目内 `.factory-venv`，构建和测试显式定位 `frontend/` 与 `backend/` 子项目。
- [x] 加强生成提示：Python 项目不得使用系统 `pip` 或 `--break-system-packages`，且 manifest 必须显式指定子项目命令目录。
- [x] 实现测试质检自动返修：`install/build/test` 失败后写入 `repair-context/testing-failure-attempt-N.md`，调用“智能编码/修复”，最多返修 3 次后才失败。
- [x] 增加阶段交接文档：需求澄清后生成 app 内 `handoff.md`，后续阶段提示优先阅读该交接文档。
- [x] 精简需求展示：内部仍保留 `requirements.md` 与需求结构数据，但前端和助手不再单独展示“需求规格说明书”。

## 进行中

- 无。

## 下一步

1. 若需要让既有历史失败工单重新进入流水线，需再设计“失败工单恢复/重跑”入口；本次只改变后续新运行的流水线行为。
2. 由用户或产品负责人确认下一项具体工单。

## 风险与注意事项

- 工作区中 `dist/index.html` 和 `.DS_Store` 为既有未提交变更，不属于本次修复范围。
- `WO-20260625-001` 的历史状态仍为 `FAILED`；本次新增的是后续流水线的自动返修逻辑，没有直接篡改历史状态。
- 自动返修目前覆盖测试质检阶段；系统设计、智能编码、部署交付的失败仍保持原有失败处理。

## 本会话修改文件

- `AGENTS.md`：中文化的启动流程、边界、验证和收尾要求。
- `feature_list.json`：功能状态与验收证据结构。
- `progress.md`：当前进度与风险记录。
- `session-handoff.md`：跨会话交接模板。
- `init.sh`：统一校验入口。
- `server/lib/opencode.js`：加入 Python 虚拟环境与子项目命令约束。
- `server/lib/opencode.js`：加入 handoff 优先阅读规则与测试返修提示。
- `server/lib/orchestrator.js`：新增测试质检自动返修循环、返修上下文文件、handoff 写入和启动提示。
- `src/pages/KanbanBoard.jsx`：隐藏需求规格说明书单独展示，并显示测试质检返修状态。
- `tests/backend.test.js`：增加生成约束、自动返修、返修上限、handoff 与需求展示隐藏回归测试。
- `tests/frontend-render.test.js`：增加需求卡片隐藏与测试返修状态展示回归测试。
- `.runtime/work-orders/WO-20260625-001/app/`：修复忽略运行态工单的 manifest、安装/测试/启动脚本与 pytest 配置。

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

## 构建提示

- Vite 报告一个压缩后超过 500 kB 的产物提示（`index-*.js` 约 201 kB gzip）；该提示不影响本次基线校验。后续如进行性能优化，可单独评估按路由或依赖拆包，避免与功能需求混合处理。
