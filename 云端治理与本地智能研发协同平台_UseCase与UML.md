# 云端治理与本地智能研发协同平台 Use Case 与 UML

**版本：** 1.0
**适用场景：** 生成与智能编码一致的软件工程文档
**说明：** 本文中的“User Case”按软件工程通用术语统一表述为“Use Case（用例）”。

---

## 1. 场景说明

本场景聚焦“生成与智能编码一致的软件工程文档”：云端总控 Agent 负责辅助项目负责人和质量人员进行云端决策；本地 Agent 负责在真实代码环境中执行智能编码；本地客户端负责采集并上报研发事实。

- 云端总控 Agent 辅助项目负责人和质量人员完成需求分析、任务划分、阶段预审、文档校核和整改决策。
- 开发人员基于云端下发的项目上下文，通过本地 Agent 工作流在真实代码与工具环境中完成研发。
- 本地客户端采集开发人员、本地 Agent、工具和外部系统产生的交互、文件变化、测试、构建及产物信息，形成 Trace 并回传云端。
- 云端服务从 Trace 和 Artifact 中提取 Engineering Fact；云端总控 Agent 基于这些事实辅助项目负责人和质量人员形成判断。
- 项目负责人通过人工卡点完成需求确认、任务确认、阶段审查、风险接受和基线批准；质量人员负责质量结论和放行检查。
- 软件工程文档根据已确认的需求、实现、测试和审查事实增量生成，并与软件版本共同形成正式基线。
- 项目知识仅作为可选上下文输入，不作为本文主流程。

一句话概括：

> 云端负责规划、审查和文档生成，本地负责基于受控上下文执行研发；全过程研发事实回流云端，最终形成与软件版本一致的工程文档。

---

## 2. 系统参与者

| 参与者 | 主要职责 |
|---|---|
| 项目负责人 | 维护项目目标和约束，确认需求、任务、阶段结论、风险及软件与文档基线 |
| 开发人员 | 在本地工作区启动、监督和确认 Agent 执行，处理技术异常并审阅变更 |
| 云端总控 Agent | 在云端分析需求、拆分任务、生成受控上下文、汇总事实并辅助项目负责人和质量人员决策 |
| 本地 Agent | 读取受控研发上下文，组织本地研发工作流，执行分析、设计、编码、测试、审查和文档候选生成 |
| 质量人员 | 审查测试覆盖、Evidence、质量问题、一致性结果和放行条件 |
| 外部系统（如 Git、制品仓库、流水线等） | 提供代码、需求/缺陷、测试、构建、制品和档案等研发事实 |

---

## 3. 用例总览

本文只保留直接支撑“需求—代码—事实—文档”闭环的用例。项目初始化、组织级知识管理、复杂多 Agent 调度和自动审批属于平台支撑或后续扩展，不作为本场景主线展开。

| 编号 | 用例 | 主要参与者 | 关键输出 |
|---|---|---|---|
| UC-02 | 需求与验收项确认 | 项目负责人、云端总控 Agent | 需求版本、验收项、确认记录 |
| UC-03 | 编码任务与文档影响规划 | 项目负责人、云端总控 Agent | Task、追溯关系、文档影响范围 |
| UC-04 | 生成受控研发上下文 | 云端总控 Agent、项目负责人 | 受控研发上下文（Context Package）版本 |
| UC-05 | 同步任务与本地环境校验 | 开发人员、本地 Agent、外部系统 | 任务执行实例、执行计划 |
| UC-06 | 执行智能编码工作流 | 开发人员、本地 Agent、外部系统 | 代码、测试、文档候选 |
| UC-07 | 客户端采集研发 Trace 与 Artifact | 开发人员、外部系统 | Trace、Artifact 元数据 |
| UC-08 | 提取工程事实与 Evidence | 云端总控 Agent、外部系统 | Engineering Fact、Evidence |
| UC-09 | 云端总控 Agent 预审 | 云端总控 Agent、质量人员 | 预审报告、问题和风险 |
| UC-10 | 人工审查与阶段决策 | 项目负责人、质量人员 | 审查结论、整改决定 |
| UC-11 | 整改反馈与重新执行 | 云端总控 Agent、开发人员、本地 Agent | 整改任务、新任务执行实例 |
| UC-12 | 文档影响分析与增量生成 | 云端总控 Agent、项目负责人 | 文档草案、章节差异、来源标记 |
| UC-13 | 双向一致性校核 | 云端总控 Agent、质量人员、外部系统 | 一致性报告、Review Issue |
| UC-14 | 形成软件与文档共同基线 | 项目负责人、质量人员、外部系统 | 软件版本、文档版本、证据索引 |

---

## UC-02 需求与验收项确认

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 将原始业务需求转化为可开发、可验证、可追溯的正式需求和验收项。 |
| 主要参与者 | 项目负责人、云端总控 Agent |
| 前置条件 | 项目已初始化；项目背景、现有软件和文档基线可访问。 |
| 基本流程 | 1. 项目负责人输入原始需求。<br>2. 云端总控 Agent 读取项目背景、现有软件和文档基线。<br>3. 深化业务场景、目标用户、核心流程和边界。<br>4. 生成细化需求、验收项和影响范围建议。<br>5. 识别冲突、风险和待澄清问题。<br>6. 项目负责人修正并确认需求和验收项。<br>7. 系统固化需求版本和人工确认记录。 |
| 强制升级 | 核心目标无法确定时保持“待澄清”；验收项不可验证时不得进入任务规划；与已批准需求冲突时必须提交人工裁决；正式需求至少包含一个可验证验收项。 |
| 输出 | Requirement、验收项、需求版本、影响范围、人工确认记录。 |

## UC-03 编码任务与文档影响规划

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 将已确认需求拆分为可执行任务，并确定代码、测试和工程文档的影响范围。 |
| 主要参与者 | 项目负责人、云端总控 Agent |
| 前置条件 | 需求及验收项已确认；项目 Agent 工作流可用。 |
| 基本流程 | 1. 云端总控 Agent 分析需求、代码现状、架构和文档结构。<br>2. 生成任务拆分建议。<br>3. 定义任务目标、输入、输出、边界和验收条件。<br>4. 识别依赖和并行关系。<br>5. 建立需求—任务—代码模块—测试—文档章节的追溯关系。<br>6. 标记需要新增、修改或复核的文档章节。<br>7. 配置工作流、强制验证项和必须提交的 Artifact。<br>8. 项目负责人确认任务规划和关键人工卡点。 |
| 强制升级 | 任务粒度过大时退回拆分；依赖形成循环时禁止发布；缺少可用工作流时不得下发；每个 Task 必须具备边界、验收条件和预期文档影响。 |
| 输出 | Task、依赖关系、需求—代码—测试—文档追溯关系、文档影响范围、验证要求、人工卡点。 |

## UC-04 生成受控研发上下文

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 将本地智能编码所需的权威信息裁剪为受控、版本化研发上下文。 |
| 主要参与者 | 云端总控 Agent、项目负责人 |
| 前置条件 | Task、需求、设计、规则和当前软件/文档基线可访问。 |
| 基本流程 | 1. 读取 Task、Requirement、设计、规则和当前基线。<br>2. 云端总控 Agent 识别任务实际需要的上下文。<br>3. 加入工作流、工具权限、验证要求和必须提交的 Artifact。<br>4. 检查引用内容是否有效、冲突或过期。<br>5. 高风险约束由项目负责人确认。<br>6. 生成受控研发上下文新版本并进入“可下发”状态。 |
| 强制升级 | 引用内容无效、冲突或过期时不得下发；高风险约束未经项目负责人确认不得执行；受控研发上下文变化必须形成新版本；已批准约束不得被本地 Agent 静默修改。 |
| 输出 | 受控研发上下文（Context Package）版本、任务范围、验证命令、工具权限、Artifact 提交要求。 |

## UC-05 同步任务与本地环境校验

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 将云端 Task 和受控研发上下文安全同步至本地，并建立一次可追溯任务执行实例。 |
| 主要参与者 | 开发人员、本地 Agent、外部系统 |
| 前置条件 | Task 和受控研发上下文已发布；本地客户端可访问代码仓库和必要研发工具。 |
| 基本流程 | 1. 开发人员选择待执行 Task。<br>2. 客户端获取 Task 和受控研发上下文。<br>3. 校验上下文版本、完整性和有效性。<br>4. 校验本地仓库、分支、Commit 基线和工作区状态。<br>5. 开发人员确认本地执行环境。<br>6. 系统创建任务执行实例。<br>7. 本地 Agent 读取上下文并形成执行计划。<br>8. 开发人员确认计划后开始执行。 |
| 强制升级 | 受控研发上下文过期、代码基线不一致、环境缺失或存在高风险未提交修改时，必须重新同步、建立隔离工作区或暂停执行。 |
| 输出 | 任务执行实例、本地上下文缓存、环境校验记录、执行计划。 |

## UC-06 执行智能编码工作流

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 在真实代码和工具环境中完成分析、设计、编码、测试、审查和文档候选生成。 |
| 主要参与者 | 开发人员、本地 Agent、外部系统 |
| 前置条件 | 任务执行实例已创建；本地 Agent 已读取 Task、验收项和执行计划。 |
| 基本流程 | 1. 本地 Agent 完成影响分析和设计。<br>2. 修改代码并生成或补充测试。<br>3. 执行构建、测试和验证命令。<br>4. 检查代码变更并生成文档候选。<br>5. 汇总代码、测试、文档和风险。<br>6. 开发人员审阅 Diff 和阶段成果。<br>7. 开发人员确认提交，任务执行实例进入“待云端预审”状态。 |
| 强制升级 | 高风险工具调用必须人工确认；任务范围外修改必须标记并确认；Agent 重试超过策略限制时转人工接管；测试和构建结果必须绑定当前代码版本。 |
| 输出 | 代码变更、测试结果、构建结果、文档候选、风险清单、任务执行实例更新记录。 |

## UC-07 客户端采集研发 Trace 与 Artifact

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 由本地客户端可靠记录智能编码过程及其产物，为事实提取和文档生成提供来源。 |
| 主要参与者 | 开发人员、外部系统 |
| 前置条件 | 本地客户端已连接任务执行实例，并已启用项目 Trace 和数据安全策略。 |
| 基本流程 | 1. 本地客户端监听本地 Agent、工具和外部系统产生的执行事件。<br>2. 关联 Project、Task、任务执行实例、Agent 和受控研发上下文版本。<br>3. 按安全策略脱敏、摘要和引用化。<br>4. 将 Trace 和 Artifact 写入本地可靠缓存。<br>5. 本地客户端批量上报云端。<br>6. 云端执行幂等校验和重复事件去重。<br>7. 接收成功后清理已确认缓存。 |
| 强制升级 | 网络中断时必须缓存并补传；敏感内容命中禁止规则时停止上报并告警；云端接收失败时必须重试并保留失败原因；上报失败不得静默丢失。 |
| 输出 | Trace、Artifact 元数据、事件来源、上报状态、失败重试记录。 |

## UC-08 提取工程事实与 Evidence

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 将 Trace 和 Artifact 转化为可审查、可校核和可证明结论的工程事实与证据。 |
| 主要参与者 | 云端总控 Agent、外部系统 |
| 前置条件 | Trace 和 Artifact 已由本地客户端上报并可被云端服务检索。 |
| 基本流程 | 1. 云端服务解析 Trace、Artifact 及外部系统结果。<br>2. 识别代码、接口、数据、配置、文档、测试、构建和人工确认事实。<br>3. 将事实关联 Requirement、Task、任务执行实例和软件版本。<br>4. 对比计划范围和实际修改范围。<br>5. 生成实现 Evidence 和验证 Evidence 候选。<br>6. 确认来源和版本有效性，将有效候选转为正式 Evidence。<br>7. 将缺失、冲突和低可信内容进入问题清单。 |
| 强制升级 | Trace 不得直接等同于正式 Evidence；Evidence 必须支撑具体结论并绑定软件版本；来源、版本或关联关系不完整时不得形成正式证据；关键验收项缺少实现或验证证据时不得判定完成。 |
| 输出 | Engineering Fact、实现 Evidence、验证 Evidence、Evidence 索引、缺失/冲突/低可信问题清单。 |

## UC-09 云端总控 Agent 预审

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 在人工审查前汇总任务完成情况、关键 Trace、Evidence、问题和风险。 |
| 主要参与者 | 云端总控 Agent、质量人员 |
| 前置条件 | Task、验收项、任务执行实例、Trace、Artifact 和 Evidence 可访问。 |
| 基本流程 | 1. 云端总控 Agent 读取 Task、验收项和人工卡点要求。<br>2. 汇总任务执行实例关键路径和主要 Artifact。<br>3. 对比计划范围与实际变化。<br>4. 分析验收项实现和验证覆盖。<br>5. 检查工作流完整性、异常重试、范围外修改和缺失 Evidence。<br>6. 初步检查代码、测试和文档一致性。<br>7. 生成问题清单、严重级别和建议通过/退回/补充的预审意见。 |
| 强制升级 | 预审建议必须展示依据；规则问题与 AI 语义建议必须区分；存在缺失 Evidence、范围外修改或高风险问题时必须进入人工审查；云端总控 Agent 不得直接批准。 |
| 输出 | 任务执行摘要、验收覆盖表、关键 Trace、Evidence 索引、问题与风险清单、预审建议。 |

## UC-10 人工审查与阶段决策

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 由项目负责人和质量人员基于预审、代码/文档差异和 Evidence 作出正式阶段决策。 |
| 主要参与者 | 项目负责人、质量人员 |
| 前置条件 | 云端预审已完成；代码、测试、文档差异和 Evidence 可审查。 |
| 基本流程 | 1. 项目负责人或质量人员打开 Review Task。<br>2. 查看任务要求、实际变化、预审摘要、代码 Diff、测试结果、文档差异和 Evidence。<br>3. 判断问题和风险。<br>4. 选择通过、退回修改、补充测试/证据、调整需求/设计、接受风险、暂停或终止。<br>5. 填写审查意见、责任人和期限。<br>6. 系统记录人工决策并推进阶段或创建整改任务。 |
| 强制升级 | 正式通过必须有人工决策记录；风险接受必须记录影响、责任人和有效期限；未关闭高风险问题不得直接通过；云端总控 Agent 的建议不能替代人工批准。 |
| 输出 | 审查结论、审查意见、风险接受记录、责任人和期限、整改任务或阶段通过状态。 |

## UC-11 整改反馈与重新执行

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 将云端审查问题转换为可由开发人员通过本地客户端执行的结构化整改任务。 |
| 主要参与者 | 云端总控 Agent、开发人员、本地 Agent |
| 前置条件 | Review Issue 已创建并包含问题依据、影响范围和通过条件。 |
| 基本流程 | 1. 云端总控 Agent 整理 Review Issue。<br>2. 关联问题描述、Evidence 位置、影响范围和通过条件。<br>3. 更新原 Task 或生成整改子任务。<br>4. 必要时生成受控研发上下文新版本。<br>5. 开发人员通过本地客户端同步整改任务。<br>6. 本地客户端创建新的任务执行实例并关联原执行实例和 Review Task。<br>7. 本地 Agent 修改代码、测试、文档或补充证据。<br>8. 重新验证、采集并上报 Trace/Artifact，云端重新提取 Evidence 并复审。 |
| 强制升级 | 整改意见不得只有自然语言；新任务执行实例必须关联原问题和原执行实例；云端总控 Agent 不直接调用本地 Agent；问题关闭必须具有规则或人工复核结论。 |
| 输出 | 结构化 Review Issue、整改 Task、受控研发上下文新版本、新任务执行实例、复审结论。 |

## UC-12 文档影响分析与增量生成

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 根据已确认工程事实识别受影响文档和章节，并生成可审查的增量修改建议。 |
| 主要参与者 | 云端总控 Agent、项目负责人 |
| 前置条件 | Engineering Fact、Evidence、需求/设计追溯关系和文档基线可访问。 |
| 基本流程 | 1. 识别需求、设计、代码、接口、数据、测试和版本变化。<br>2. 根据追溯关系定位受影响文档、章节和内容单元。<br>3. 标记必须更新、建议更新、待确认和可能失效内容。<br>4. 云端总控 Agent 基于模板、Engineering Fact 和 Evidence 生成修改建议。<br>5. 标记工程事实、规则生成、AI 归纳、AI 推断和人工编写等内容来源。<br>6. 展示生成前后差异并检测人工锁定内容冲突。<br>7. 项目负责人确认、编辑或驳回，形成文档草案新版本。 |
| 强制升级 | 未受影响章节不得无故重新生成；人工内容不得被静默覆盖；AI 推断必须显式标记；关键结论没有有效 Evidence 时不得作为正式文档结论。 |
| 输出 | 文档影响范围、章节级差异、内容来源标记、文档草案新版本、待确认问题。 |

## UC-13 双向一致性校核

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 同时验证代码是否符合已确认文档，以及文档是否真实反映当前软件。 |
| 主要参与者 | 云端总控 Agent、质量人员、外部系统 |
| 前置条件 | 当前软件、测试、文档、追溯关系和 Evidence 已准备完成。 |
| 基本流程 | 1. 执行需求、设计、接口、数据、测试、状态、过程和版本一致性规则校核。<br>2. 云端总控 Agent 执行语义辅助校核。<br>3. 生成问题、严重级别、影响范围、处理建议和证据。<br>4. 将问题归类为修改代码、修改文档、发起变更、补充证据、接受风险或驳回 AI 建议。<br>5. 阻断问题进入 Review Issue 整改闭环。 |
| 强制升级 | 规则问题和 AI 建议必须区分；每个问题必须有来源、影响范围和处理状态；未处理高风险问题不得进入基线批准；无法确定代码与文档责任边界时必须升级人工裁决。 |
| 输出 | 双向一致性报告、问题清单、严重级别、影响范围、Evidence 引用、Review Issue。 |

## UC-14 形成软件与文档共同基线

| 项目 | 内容 |
| --- | --- |
| 用例目标 | 将已通过审查的软件版本、构建产物、工程文档和 Evidence 统一固化。 |
| 主要参与者 | 项目负责人、质量人员、外部系统 |
| 前置条件 | 一致性校核完成；高风险问题已关闭或形成有效风险接受记录。 |
| 基本流程 | 1. 锁定 Commit 范围、软件版本和构建制品。<br>2. 锁定 Document Package、文档版本和章节差异。<br>3. 关联追溯矩阵、Evidence 索引、校核报告和人工决策。<br>4. 质量人员执行最终完整性检查。<br>5. 项目负责人确认共同基线。<br>6. 系统锁定并归档基线，更新当前有效的软件—文档共同基线。 |
| 强制升级 | 正式文档必须绑定唯一软件版本和构建制品；高风险问题未处理或证据链不完整时不得批准；已归档基线不得被重新生成覆盖，只能形成新版本。 |
| 输出 | 软件基线、Document Package、文档版本、构建制品摘要、Evidence 索引、校核报告、人工批准记录。 |

---

## 4. 关键业务规则

1. 云端总控 Agent 只在云端辅助项目负责人和质量人员决策，不直接调用或指挥本地 Agent。
2. 每个任务执行实例必须关联唯一 Task 和受控研发上下文版本。
3. Agent 的自然语言“已完成”声明不能直接成为正式完成事实。
4. Trace 只有经过事实提取、任务关联和有效性确认后，才能成为 Evidence。
5. 必要验收项必须具有实现 Evidence 和验证 Evidence。
6. 超出 Task 边界的修改必须经过人工确认。
7. 退回整改必须形成结构化 Review Issue。
8. 整改必须创建新任务执行实例或明确续接关系。
9. 文档关键结论必须关联有效 Evidence。
10. AI 推断内容必须显式标记。
11. 人工、已审核和已归档内容不得被静默覆盖。
12. 正式文档必须绑定软件版本和构建产物。
13. Trace 和源码上报必须由本地客户端遵循项目安全策略执行。
14. 已归档共同基线只能形成新版本，不能直接修改。


## 5. UML 用例图

以下图使用 PlantUML 语法，可在 PlantUML、IDE 插件或对应渲染器中直接生成图片。

```plantuml

@startuml
left to right direction
scale 1.3
skinparam defaultFontSize 16
skinparam usecaseFontSize 16
skinparam actorFontSize 16
skinparam packageStyle rectangle

actor 项目负责人 as PM
actor 开发人员 as Dev
actor "云端总控 Agent" as CloudAgent
actor "本地 Agent" as LocalAgent
actor 质量人员 as QA
actor "外部系统\n(Git/制品仓库/流水线等)" as External

rectangle "云端治理与本地智能研发协同平台" {
  usecase "UC-02\n需求与验收项确认" as UC02
  usecase "UC-03\n编码任务与文档影响规划" as UC03
  usecase "UC-04\n生成受控研发上下文" as UC04
  usecase "UC-05\n同步任务与环境校验" as UC05
  usecase "UC-06\n执行智能编码工作流" as UC06
  usecase "UC-07\n客户端采集研发 Trace 与 Artifact" as UC07
  usecase "UC-08\n提取工程事实与 Evidence" as UC08
  usecase "UC-09\n云端总控 Agent 预审" as UC09
  usecase "UC-10\n人工审查与阶段决策" as UC10
  usecase "UC-11\n整改反馈与重新执行" as UC11
  usecase "UC-12\n文档影响分析与增量生成" as UC12
  usecase "UC-13\n双向一致性校核" as UC13
  usecase "UC-14\n形成软件与文档共同基线" as UC14
}

PM --> UC02
CloudAgent --> UC02
PM --> UC03
CloudAgent --> UC03
CloudAgent --> UC04
Dev --> UC05
LocalAgent --> UC05
External --> UC05
Dev --> UC06
LocalAgent --> UC06
External --> UC06
Dev --> UC07
External --> UC07
CloudAgent --> UC08
External --> UC08
CloudAgent --> UC09
QA --> UC09
PM --> UC10
QA --> UC10
CloudAgent --> UC11
Dev --> UC11
LocalAgent --> UC11
CloudAgent --> UC12
PM --> UC12
CloudAgent --> UC13
QA --> UC13
External --> UC13
PM --> UC14
QA --> UC14
External --> UC14

UC02 ..> UC03 : <<include>>
UC03 ..> UC04 : <<include>>
UC04 ..> UC05 : <<include>>
UC05 ..> UC06 : <<include>>
UC06 ..> UC07 : <<include>>
UC07 ..> UC08 : <<include>>
UC08 ..> UC09 : <<include>>
UC09 ..> UC10 : <<include>>
UC11 ..> UC06 : <<extend>>
UC08 ..> UC12 : <<include>>
UC12 ..> UC13 : <<include>>
UC13 ..> UC14 : <<include>>
@enduml
```

---

## 6. UML 端到端活动图

```plantuml
@startuml
start

partition 云端治理 {
  :项目负责人提交需求;
  :云端总控 Agent 分析需求;
  :形成细化需求和验收项;
  :人工确认需求;
  :云端总控 Agent 拆分 Task;
  :配置工作流和人工卡点;
  :生成受控研发上下文;
}

partition 本地执行 {
  :同步 Task 和受控研发上下文;
  :校验代码基线与本地环境;
  :创建任务执行实例;
  :本地 Agent 组织本地研发工作流;
  :修改代码、生成测试和文档候选;
  :执行构建、测试和本地审查;
}

partition 客户端采集与云端证据 {
  :本地客户端采集交互、工具、文件和执行事件;
  :本地客户端脱敏、缓存并上报 Trace 与 Artifact;
  :云端服务提取 Engineering Fact;
  :云端总控 Agent 辅助形成 Evidence;
}

partition 云端审查 {
  :云端总控 Agent 预审;
  :生成摘要、问题和风险;
  :人工审查;
  if (审查通过?) then (否)
    :形成结构化整改意见;
  else (是)
    :文档影响分析与增量生成;
    :双向一致性校核;
    if (存在阻断问题?) then (是)
      :形成 Review Issue;
    else (否)
      :人工审核文档;
      :形成软件与文档共同基线;
      stop
    endif
  endif
}

partition 本地执行 {
  :同步整改 Task;
  :创建后续任务执行实例;
  :修改、补证和重新验证;
}

partition 客户端采集与云端证据 {
  :本地客户端上报新增 Trace 和 Artifact;
  :云端服务更新 Fact 和 Evidence;
}

partition 云端审查 {
  :重新预审和人工复审;
}

stop
@enduml
```

---

## 7. UML 核心时序图

```plantuml
@startuml
actor 项目负责人 as PM
actor 开发人员 as Dev
actor 质量人员 as QA
actor "云端总控 Agent" as CloudAgent
actor "本地 Agent" as LocalAgent
actor "外部系统\n(Git/制品仓库/流水线等)" as External
participant "项目/任务服务" as ProjectService
participant "受控研发上下文服务" as ContextService
participant "本地客户端" as Client
participant "本地 Agent 工作流" as Workflow
participant "Trace/Evidence 服务" as TraceService
participant "人工审查工作台" as ReviewUI
participant "文档与基线服务" as DocService

PM -> CloudAgent : 提交原始需求
CloudAgent -> ProjectService : 查询需求、软件和文档基线
ProjectService --> CloudAgent : 项目上下文
CloudAgent --> PM : 需求分析、验收项和问题
PM -> ProjectService : 确认需求和验收项

CloudAgent -> ProjectService : 生成 Task 拆分建议
PM -> ProjectService : 确认 Task、工作流和卡点
ProjectService -> ContextService : 生成受控研发上下文
ContextService --> ProjectService : 受控研发上下文 v1

Dev -> Client : 选择 Task
Client -> ContextService : 获取 Task 与受控研发上下文
ContextService --> Client : Task + 受控研发上下文 v1
Client -> LocalAgent : 创建任务执行实例
LocalAgent --> Dev : 展示执行计划
Dev -> LocalAgent : 确认计划

LocalAgent -> Workflow : 启动分析/编码/测试/审查
Workflow -> Workflow : 修改代码并执行验证
Workflow --> LocalAgent : 代码、测试和文档候选
LocalAgent --> Dev : 展示 Diff 与阶段成果
Dev -> LocalAgent : 确认提交

LocalAgent -> Client : 交互、工具、文件和测试事件
Client -> Client : 脱敏、缓存并关联任务执行实例
Client -> TraceService : Trace + Artifact
TraceService -> TraceService : 提取 Fact 与 Evidence 候选

TraceService -> CloudAgent : 触发云端预审
CloudAgent -> ProjectService : 获取 Task 与验收项
CloudAgent -> TraceService : 获取关键 Trace 和 Evidence
CloudAgent --> ReviewUI : 预审报告、问题和建议
PM -> ReviewUI : 人工审查
QA -> ReviewUI : 质量审查
External -> ProjectService : 提供 Git、流水线和制品事实

alt 退回整改
  ReviewUI -> ProjectService : 记录整改要求
  ProjectService -> ContextService : 生成整改上下文 v2
  Client -> ContextService : 同步整改 Task
  Client -> LocalAgent : 创建后续任务执行实例
else 审查通过
  ReviewUI -> DocService : 进入文档生成与校核
  DocService -> TraceService : 获取 Fact 和 Evidence
  DocService -> DocService : 增量生成与一致性校核
  DocService --> ReviewUI : 文档草案和校核结果
  PM -> DocService : 审核批准
  QA -> DocService : 质量放行检查
  DocService -> DocService : 形成共同基线
end
@enduml
```

---

## 8. UML 组件图

```plantuml
@startuml
skinparam componentStyle rectangle

package "云端控制面" {
  [项目与权限服务] as Project
  [需求与任务服务] as Task
  [云端总控 Agent] as CloudAgent
  [受控研发上下文服务] as Context
  [Agent/工作流配置服务] as Config
  [Trace 接收与检索服务] as Trace
  [工程事实与 Evidence 服务] as Evidence
  [人工审查工作台] as ReviewUI
  [文档生成与一致性校核] as Doc
  [共同基线与归档服务] as Baseline
}

package "本地执行面" {
  [本地研发客户端] as Client
  [Agent Runtime] as Runtime
  [本地 Agent] as LocalAgent
  [本地 Agent 工作流] as Agents
  [工具/MCP 适配层] as Tools
  [本地代码工作区] as Workspace
  [测试与构建执行器] as Validator
  [Telemetry Plugin] as Plugin
  [本地可靠缓存] as Cache
}

package "外部系统（Git、制品仓库、流水线等）" {
  [代码仓库] as SCM
  [需求/缺陷系统] as Req
  [测试平台] as Test
  [构建平台] as CI
  [制品库] as ArtifactRepo
  [文档/档案系统] as Archive
}

Project --> Task
CloudAgent --> Task
Task --> Context
Config --> Context

Client --> Context : 同步任务上下文
Client --> Runtime
Runtime --> LocalAgent
LocalAgent --> Agents
Agents --> Tools
Tools --> Workspace
Agents --> Validator
Validator --> Test
Validator --> CI
Workspace --> SCM

Runtime --> Plugin
Plugin --> Client : 执行事件/Artifact
Client --> Cache
Client --> Trace : Trace/Artifact

Trace --> Evidence
Task --> CloudAgent
Evidence --> CloudAgent
CloudAgent --> ReviewUI
ReviewUI --> Task : 阶段决策/整改

Evidence --> Doc
Task --> Doc
Doc --> Baseline
Baseline --> Archive
Baseline --> ArtifactRepo

Req --> Task
SCM --> Evidence
Test --> Evidence
CI --> Evidence
@enduml
```

---

## 9. UML 领域模型图

```plantuml
@startuml
hide methods
skinparam classAttributeIconSize 0

class Project {
  projectId
  name
  status
}

class Requirement {
  requirementId
  version
  status
}

class AcceptanceItem {
  acceptanceItemId
  description
  verificationMethod
  status
}

class Task {
  taskId
  version
  goal
  scope
  status
  riskLevel
}

class ContextPackage {
  contextPackageId
  version
  status
}

class AgentWorkflow {
  workflowId
  version
  name
}

class TaskExecution {
  executionId
  status
  startedAt
  endedAt
}

class TraceEvent {
  eventId
  eventType
  occurredAt
  sequenceNo
}

class Artifact {
  artifactId
  type
  name
  version
  uri
}

class EngineeringFact {
  factId
  factType
  sourceType
  confidence
  status
}

class Evidence {
  evidenceId
  evidenceType
  status
}

class ReviewTask {
  reviewTaskId
  stage
  status
  decision
}

class ReviewIssue {
  issueId
  severity
  issueType
  status
  resolutionType
}

class DocumentPackage {
  documentPackageId
  version
  status
}

class Document {
  documentId
  type
  version
  status
}

class DocumentContentUnit {
  contentUnitId
  contentType
  sourceType
  status
  locked
}

class SoftwareBaseline {
  softwareBaselineId
  version
  commitRange
  artifactDigest
}

class DocumentBaseline {
  documentBaselineId
  version
  approvedAt
}

Project "1" o-- "*" Requirement
Requirement "1" o-- "*" AcceptanceItem
Requirement "*" -- "*" Task
Project "1" o-- "*" Task

Task "1" -- "*" ContextPackage
ContextPackage "*" -- "1" AgentWorkflow
Task "1" -- "*" TaskExecution
TaskExecution "1" o-- "*" TraceEvent
TaskExecution "1" o-- "*" Artifact

TraceEvent "*" --> "*" EngineeringFact : 提取
Artifact "*" --> "*" EngineeringFact : 提取
EngineeringFact "*" --> "*" Evidence : 支撑
AcceptanceItem "1" --> "*" Evidence : 实现/验证

Task "1" -- "*" ReviewTask
ReviewTask "1" o-- "*" ReviewIssue
ReviewIssue "*" --> "*" Evidence : 问题依据

Project "1" o-- "*" DocumentPackage
DocumentPackage "1" o-- "*" Document
Document "1" o-- "*" DocumentContentUnit
DocumentContentUnit "*" --> "*" Evidence : 引用

Project "1" o-- "*" SoftwareBaseline
Project "1" o-- "*" DocumentBaseline
DocumentBaseline "1" --> "1" SoftwareBaseline : 共同基线
DocumentBaseline "1" --> "1" DocumentPackage

@enduml
```

---

## 10. UML Task 状态图

```plantuml
@startuml
[*] --> 待规划

待规划 --> 待确认 : 完成任务拆分
待确认 --> 待规划 : 退回修改
待确认 --> 待下发 : 人工确认

待下发 --> 待执行 : 受控研发上下文发布
待执行 --> 执行中 : 创建任务执行实例

执行中 --> 等待本地确认 : 到达本地卡点
等待本地确认 --> 执行中 : 开发人员确认
等待本地确认 --> 已暂停 : 开发人员暂停

执行中 --> 待云端预审 : 任务执行实例完成并上报
待云端预审 --> 待人工审查 : 云端总控 Agent 预审完成

待人工审查 --> 整改中 : 退回/补充
待人工审查 --> 已通过 : 审查通过
待人工审查 --> 已接受风险 : 风险接受
待人工审查 --> 已暂停 : 暂停
待人工审查 --> 已终止 : 终止

整改中 --> 执行中 : 创建整改任务执行实例
整改中 --> 待复审 : 整改完成
待复审 --> 待人工审查 : 复审材料就绪

已暂停 --> 执行中 : 恢复
已暂停 --> 已终止 : 终止

已通过 --> [*]
已接受风险 --> [*]
已终止 --> [*]
@enduml
```

---

## 11. UML 任务执行实例状态图

```plantuml
@startuml
[*] --> 已创建
已创建 --> 受控上下文同步中
受控上下文同步中 --> 就绪 : 同步成功
受控上下文同步中 --> 已失败 : 同步失败

就绪 --> 运行中 : 开发人员启动
运行中 --> 等待开发人员确认 : 人工卡点
等待开发人员确认 --> 运行中 : 开发人员确认继续
等待开发人员确认 --> 暂停 : 开发人员暂停

运行中 --> 暂停 : 开发人员/系统暂停
暂停 --> 运行中 : 恢复

运行中 --> 上报中 : 本地执行完成
上报中 --> 已完成 : 云端确认接收
上报中 --> 上报失败 : 网络/服务异常
上报失败 --> 上报中 : 补传
上报失败 --> 已失败 : 超出重试策略

运行中 --> 已失败 : Agent/工具失败
运行中 --> 已取消 : 开发人员取消
已完成 --> 已被后续执行实例替代 : 创建整改任务执行实例

已完成 --> [*]
已失败 --> [*]
已取消 --> [*]
已被后续执行实例替代 --> [*]
@enduml
```

---

## 12. 第一阶段建议实现范围

第一阶段优先实现以下用例：

1. UC-02 需求与验收项确认。
2. UC-03 编码任务与文档影响规划。
3. UC-04 生成受控研发上下文。
4. UC-05 同步任务与本地环境校验。
5. UC-06 执行智能编码工作流。
6. UC-07 客户端采集研发 Trace 与 Artifact。
7. UC-08 提取 Engineering Fact 与 Evidence。
8. UC-09 云端总控 Agent 预审。
9. UC-10 人工审查与阶段决策。
10. UC-11 整改反馈与重新执行。
11. UC-12 文档影响分析与增量生成。
12. UC-13 双向一致性校核。
13. UC-14 形成软件与文档共同基线。

第一阶段暂不优先：

- 复杂跨项目多 Agent 调度。
- 完整组织级知识图谱。
- 全部 GJB 文档自动生成。
- 自动审批和自动风险接受。
- 全量源码和全量交互永久云端存储。
- 复杂多级会签和档案系统替代。

---

## 13. 第一阶段验收主线

```text
项目负责人提交需求
  -> 云端总控 Agent 形成需求分析和验收项
  -> 人工确认
  -> 云端总控 Agent 拆分 Task
  -> 生成受控研发上下文
  -> 本地同步并执行智能编码工作流
  -> 产生代码、测试和文档候选
  -> 本地客户端采集并上报 Trace 与 Artifact
  -> 云端提取 Engineering Fact 和 Evidence
  -> 云端总控 Agent 预审
  -> 人工通过或退回
  -> 本地按结构化问题整改
  -> 文档增量生成和双向一致性校核
  -> 软件版本与文档版本共同形成基线
```

验收时重点证明：

- 云端与本地使用同一 Task 和受控研发上下文版本。
- 项目负责人和质量人员能够查看关键研发过程和真实差异。
- 任务完成结论具有实现 Evidence 和验证 Evidence。
- 云端问题能够结构化反馈至本地继续执行。
- 文档能够根据代码变化进行章节级增量更新。
- 正式文档能够绑定明确的软件版本和构建产物。
