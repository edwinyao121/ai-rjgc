# 项目进度

<!-- Machine-readable harness anchors: Current State | What | Next | Last Updated -->

## 当前状态

- 最后更新：2026-06-25 09:26（Asia/Shanghai）
- 当前分支：`0630`
- 当前事项：无。
- 会话目标：将看板里的应用访问地址改为前端访问地址。

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

## 进行中

- 无。

## 下一步

1. 由用户在看板点击已部署应用确认打开的是前端页面，不再是 API JSON/健康检查地址。
2. 由用户或产品负责人确认下一项具体工单。

## 风险与注意事项

- 工作区中 `docs/requirements/WO-20260625-001-requirements.md`、`node_modules/.package-lock.json`、`node_modules/.vite/deps/_metadata.json` 存在既有未提交变更，不属于本次地址修复范围。
- `vite.config.js` 当前也有未提交的 watch ignored 配置变更；该文件不是本次地址修复的手工修改范围，未覆盖或回退。

## 本会话修改文件

- `server/lib/manifest.js`：支持可选 `appUrl`，并提供从 `healthUrl` 推导前端根地址的工具。
- `server/lib/orchestrator.js`：部署阶段用 `healthUrl` 探活，用 `appUrl`/推导根地址写入 `deploymentUrl`、阶段输出和 SSE 事件。
- `server/lib/store.js`：新增 `deploymentHealthUrl` 初始字段，保留探活地址用于排障。
- `server/lib/opencode.js`：提示智能编码生成 manifest 时区分 `healthUrl` 和 `appUrl`。
- `src/pages/KanbanBoard.jsx`：看板访问按钮和访问地址成果物会将历史 `/api/...` 地址规范为前端根地址。
- `tests/backend.test.js`：增加部署 URL 分离、探活地址保留和 prompt 约束回归测试。
- `tests/frontend-render.test.js`：增加历史 API 地址规范化和 `deploymentHealthUrl` 合并回归测试。
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

## 构建提示

- Vite 报告一个压缩后超过 500 kB 的产物提示（`index-*.js` 约 201 kB gzip）；该提示不影响本次基线校验。后续如进行性能优化，可单独评估按路由或依赖拆包，避免与功能需求混合处理。
