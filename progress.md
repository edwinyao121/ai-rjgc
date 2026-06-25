# 项目进度

<!-- Machine-readable harness anchors: Current State | What | Next | Last Updated -->

## 当前状态

- 最后更新：2026-06-25 09:39（Asia/Shanghai）
- 当前分支：`0630`
- 当前事项：无。
- 会话目标：修复需求待入厂阶段 opencode 错误输出导致的 JSON 解析失败。

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

## 进行中

- 无。

## 下一步

1. 由用户新建同类工单验证需求待入厂阶段可进入“准备智能开发”状态。
2. 已经失败的 `WO-20260625-002` 是历史运行态数据；如需继续该工单，需要重新创建或后续单独增加失败工单恢复/重跑入口。

## 风险与注意事项

- 本次没有修改运行态 `WO-20260625-002/state.json`，因此已失败的历史工单不会自动恢复。
- `./init.sh` 会生成 `dist/index.html` 资源哈希变化；本次已清理该生成产物 diff。

## 本会话修改文件

- `server/lib/opencode.js`：识别 opencode `type:error` JSONL 事件，提取嵌套错误中的 `code/message`，并抛出 `OPENCODE_OUTPUT_ERROR`。
- `server/lib/orchestrator.js`：需求澄清解析遇到 `OPENCODE_OUTPUT_ERROR` 时，记录告警日志并使用 `fallbackRequirementsMarkdown` / `fallbackRequirementsItems` 生成保底需求，继续进入 `READY_FOR_DEVELOPMENT`。
- `tests/backend.test.js`：新增 opencode 错误事件解析和需求阶段保底需求回归测试。
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

## 构建提示

- Vite 报告一个压缩后超过 500 kB 的产物提示（`index-*.js` 约 201 kB gzip）；该提示不影响本次基线校验。后续如进行性能优化，可单独评估按路由或依赖拆包，避免与功能需求混合处理。
