// ============================================================
// DATA STORE
// ============================================================
const now = Date.now();
const m = (s) => new Date(now - s * 1000).toLocaleString('zh-CN', {hour:'2-digit',minute:'2-digit'});

const state = {
  activePage: 'dashboard',
  context: { level: 'global' },
  activeProjectId: 'p1',
  activeTaskId: 't1',
  globalGuidelinesStatuses: {
    engineering: true,
    security: true,
    collaboration: true,
    testing: true,
    release: true
  },
  projects: [
    { 
      id:'p5', name:'公文管理系统', desc:'支持大模型文档摘要、既定流转顺序、双核验下载及印章审计的公文管理系统', repo:'gitlab.com/gov/doc-management', members:6, status:'blocked', stagesDone:0, stagesTotal:8,
      guidelines: {
        dependency: '1. 依赖管理：统一使用 Maven 进行依赖引入，严禁直接导入本地 JAR 包。\n2. 选型黑名单：严禁使用 Fastjson（存在安全高危漏洞），统一使用 Jackson 作为 JSON 解析器。\n3. 版本管理：线上依赖包必须固定 RELEASE 版本号，禁止使用 LATEST 或带有 SNAPSHOT 的不确定版本。',
        collaboration: '1. 分支命名：功能分支命名为 feature/issue-{id}-{title}，修复分支为 hotfix/{id}-{title}。\n2. 提交规范：Commit 提交信息格式统一为 <type>(<scope>): <subject>，例如 feat(approval): 增加三级流转流程审批功能。\n3. 合并规则：合并至 main 必须经过 PR 并获得至少 1 名核心开发者的 Review 通过。',
        stack: 'Spring Boot 3.2, Vue 3, PostgreSQL 15, OFD Reader, Gemini API, Redis 7',
        coding: '1. 命名规范：后端遵循中国信创开源规范，前端遵循 Vue 官方风格指南。\n2. 接口规范：使用 RESTful 风格，返回格式统一为 {code, data, msg}。\n3. 注释规范：核心业务逻辑必须包含 Javadoc 或 TSDoc 注释。',
        domain: '1. 文档摘要：对接大模型 API 生成文档摘要，长文本需流式读取分块处理。\n2. 流转顺序：阅件处理必须严格遵循“接收、审批、传阅、归档”既定顺序，由流转状态机进行强控，严禁逆向或越级。\n3. 登记防篡改：信件登记信息一经录入系统，任何员工均无权直接修改。若需更正必须提交“信息更正申请单”，经部门领导审批通过后方可由系统管理员操作。\n4. 用印审批：用印流程支持根据文件类型、次数、印章类型自定义多级审批，支持在线待用印文件预览、电子签名确认及用印后文件自动归档。\n5. 版本管理：档案修改后生成独立版本，历史版本需完整保留并随时回溯查看。',
        quality: '1. 安全下载：阅件下载必须实施双重身份核验（安全口令 + 短信/动态验证码 2FA）。\n2. 审计追溯：每次用印完成后自动归档申请单、审批记录、前后文件，生成唯一的档案编号。'
      }
    },
    { 
      id:'p1', name:'OA办公系统', desc:'企业办公自动化系统', repo:'gitlab.com/company/oa-system', members:8, status:'running', stagesDone:6, stagesTotal:8,
      guidelines: {
        dependency: '1. 依赖管理：统一使用 Maven 进行依赖引入，严禁直接导入本地 JAR 包。\n2. 选型黑名单：严禁使用 Fastjson（存在安全高危漏洞），统一使用 Jackson 作为 JSON 解析器。\n3. 版本管理：线上依赖包必须固定 RELEASE 版本号，禁止使用 LATEST 或带有 SNAPSHOT 的不确定版本。',
        collaboration: '1. 分支命名：功能分支命名为 feature/issue-{id}-{title}，修复分支为 hotfix/{id}-{title}。\n2. 提交规范：Commit 提交信息格式统一为 <type>(<scope>): <subject>，例如 feat(approval): 增加三级流转流程审批功能。\n3. 合并规则：合并至 main 必须经过 PR 并获得至少 1 名核心开发者的 Review 通过。',
        stack: 'Java 17, Spring Boot 3.0, Vue 3, Element Plus, MySQL 8.0, Redis 6.2',
        coding: '1. 命名规范：后端遵循阿里巴巴Java开发规范，前端遵循 Vue 官方风格指南。\n2. 接口规范：使用 RESTful 风格，返回格式统一为 {code, data, msg}。\n3. 注释规范：核心业务逻辑必须包含 Javadoc 或 TSDoc 注释。',
        domain: '1. 金额计算：金额计算统一使用 BigDecimal，严禁使用 float/double 浮点数，防范精度丢失。\n2. 逻辑删除：数据删除统一采用逻辑删除（更新 is_deleted = 1），禁止在业务表中执行物理物理删除。\n3. 审批流状态机：状态转移严格遵循草稿 -> 审批中 -> 已通过/已驳回，禁止逆向跳跃流转。'
      }
    },
    { 
      id:'p2', name:'智能网关 2.0', desc:'API 网关升级与限流优化', repo:'gitlab.com/stars/smart-gateway', members:5, status:'reviewing', stagesDone:4, stagesTotal:8,
      guidelines: {
        dependency: '1. 包管理：统一使用 Go Modules 进行依赖管理，Go.sum 必须随代码库提交。\n2. 依赖原则：严禁引入未经安全评估的第三方组件，优先使用官方原生标准库。',
        collaboration: '1. 分支管理：主分支保持稳定，开发在 dev 分支进行，发布分支遵循 release/v* 命名。\n2. 提交约定：符合 Conventional Commits 格式规则。',
        stack: 'Go 1.20, Gin, gRPC, Etcd, Prometheus',
        coding: '遵循 Uber Go Style Guide；使用 Uber-fx 进行依赖注入；Prometheus 指标命名需符合规范。',
        domain: '1. 路由匹配规则：优先精确匹配，兜底通配符匹配。\n2. 限流阈值动态下发：本地缓存有效期最大 10s，失效必须 fallback 到全局配置。'
      }
    },
    { 
      id:'p3', name:'用户中心重构', desc:'统一认证与权限中心', repo:'gitlab.com/stars/user-center', members:4, status:'blocked', stagesDone:2, stagesTotal:6,
      guidelines: {
        dependency: '1. 包管理：统一使用 npm/yarn 进行依赖导入，lockfile 必须保证提交。\n2. 安全扫描：引入包必须经过 npm audit 安全漏洞扫描。',
        collaboration: '1. 提交说明：详细描述重构修改的模块 and 影响范围。\n2. 分支规范：refactor/feature 分支按模块隔离。',
        stack: 'Node.js 18, NestJS, TypeScript, PostgreSQL, Keycloak',
        coding: '遵循 NestJS 推荐的项目结构 and 编码模式；所有 API 必须定义 DTO 并在 Swagger 中声明。',
        domain: '1. 口令安全：必须加盐 Hash 存储 (Bcrypt)，严禁明文。\n2. Token 策略：访问 Token 签发默认有效期 2 小时，刷新 Token 有效期 7 天。\n3. 租户隔离：跨租户数据访问必须经过严格权限校验拦截器。'
      }
    },
    { 
      id:'p4', name:'消息中间件升级', desc:'Kafka 集群升级与监控', repo:'gitlab.com/stars/msg-bus', members:3, status:'done', stagesDone:7, stagesTotal:7,
      guidelines: {
        dependency: '1. 镜像管理：严禁使用 latest 标签，必须指定具体的 Docker 镜像 tag。\n2. 依赖校验：Terraform 模块统一使用私有 Registry 版本。',
        collaboration: '1. 变更评审：所有部署脚本与 IaC 变更必须至少有 2 人联合 Review 后方能合并。',
        stack: 'Kafka 3.4, Kubernetes, Terraform, Grafana',
        coding: '基础设施即代码 (IaC)；所有部署脚本必须经过 dry-run 验证。',
        domain: '1. 核心交易 Topic 配置：必须设置 replicas=3, min.insync.replicas=2 保证高可用。\n2. 消费端约定：所有接入的业务消费端必须实现幂等处理。'
      }
    },
    {
      id:'p5', name:'公文管理系统', desc:'支持大模型文档摘要、既定流转顺序、双核验下载及印章审计的公文管理系统', repo:'gitlab.com/gov/doc-management', members:6, status:'blocked', stagesDone:0, stagesTotal:8,
      guidelines: {
        dependency: '1. 依赖管理：统一使用 Maven 进行依赖引入，严禁直接导入本地 JAR 包。\n2. 选型黑名单：严禁使用 Fastjson（存在安全高危漏洞），统一使用 Jackson 作为 JSON 解析器。\n3. 版本管理：线上依赖包必须固定 RELEASE 版本号，禁止使用 LATEST 或带有 SNAPSHOT 的不确定版本。',
        security: '1. 身份认证：所有系统入口必须实施多因素认证（MFA），禁止明文传输凭据。\n2. 数据安全：敏感数据（身份证、薪资、密钥）必须加密存储，日志中严禁打印明文敏感信息。\n3. 安全下载：阅件下载必须实施双重身份核验（安全口令 + 短信/动态验证码 2FA）。\n4. 审计追溯：每次用印完成后自动归档申请单、审批记录、前后文件，生成唯一的档案编号。',
        collaboration: '1. 分支命名：功能分支命名为 feature/issue-{id}-{title}，修复分支为 hotfix/{id}-{title}。\n2. 提交规范：Commit 提交信息格式统一为 <type>(<scope>): <subject>，例如 feat(approval): 增加三级流转流程审批功能。\n3. 合并规则：合并至 main 必须经过 PR 并获得至少 1 名核心开发者的 Review 通过。',
        stack: 'Spring Boot 3.2, Vue 3, PostgreSQL 15, OFD Reader, Gemini API, Redis 7',
        coding: '1. 命名规范：后端遵循中国信创开源规范，前端遵循 Vue 官方风格指南。\n2. 接口规范：使用 RESTful 风格，返回格式统一为 {code, data, msg}。\n3. 注释规范：核心业务逻辑必须包含 Javadoc 或 TSDoc 注释。',
        domain: '1. 文档摘要：对接大模型 API 生成文档摘要，长文本需流式读取分块处理。\n2. 流转顺序：阅件处理必须严格遵循”接收、审批、传阅、归档”既定顺序，由流转状态机进行强控，严禁逆向或越级。\n3. 登记防篡改：信件登记信息一经录入系统，任何员工均无权直接修改。若需更正必须提交”信息更正申请单”，经部门领导审批通过后方可由系统管理员操作。\n4. 用印审批：用印流程支持根据文件类型、次数、印章类型自定义多级审批，支持在线待用印文件预览、电子签名确认及用印后文件自动归档。\n5. 版本管理：档案修改后生成独立版本，历史版本需完整保留并随时回溯查看。'
      }
    }
  ],
  tasks: [
    { id:'t1', pid:'p1', title:'办公系统基线版本研制', type:'Feature', priority:'P0', estimate:'20d', status:'executing', stageCurrent:4, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[1,1,1,1,0,0,0,0], stageGates:[[1,1,1],[1,1],[1],[1,1],[1,1,0,1],[0,0],[0],[0]], stageAssignees:['张伟','张伟','王工','李工','王工','李工','王工','张伟'], aiCreated:false, assignee:'张伟' },
    { id:'t2', pid:'p1', title:'新增人事管理模块', type:'Feature', priority:'P0', estimate:'15d', status:'review', stageCurrent:2, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[1,1,0,0,0,0,0,0], stageGates:[[1,1],[1],[0,1],[0],[0,0,0,0],[0],[0],[0]], stageAssignees:['李工','李工','王工','赵工','刘工','李工','王工','张伟'], aiCreated:false, assignee:'李工' },
    { id:'t3', pid:'p1', title:'重构流程审批模块', type:'Feature', priority:'P1', estimate:'12d', status:'planning', stageCurrent:-1, stageNames:['方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[0,0,0,0,0,0], stageGates:[[0],[0],[0],[0],[0],[0]], stageAssignees:['王工','王工','王工','王工','王工','王工'], aiCreated:true, assignee:'王工' },
    { id:'t4', pid:'p1', title:'优化公文档案模块', type:'Enhancement', priority:'P2', estimate:'10d', status:'backlog', stageCurrent:-1, stageNames:[], stages:[], stageGates:[], stageAssignees:[], aiCreated:false, assignee:'赵工' },
    { id:'t5', pid:'p5', title:'公文阅件流转与用印审批核心功能研制', type:'Feature', priority:'P0', estimate:'25d', status:'executing', stageCurrent:0, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[0,0,0,0,0,0,0,0], stageGates:[[1,0,1],[0,0],[0],[0,0],[0,0,0,0],[0,0],[0],[0]], stageAssignees:['张经理','李工','王工','赵工','刘工','李工','王工','张经理'], aiCreated:false, assignee:'张经理' },
    { id:'t6', pid:'p5', title:'基于大模型的公文摘要提取模块研制', type:'Feature', priority:'P1', estimate:'10d', status:'planning', stageCurrent:-1, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[0,0,0,0,0,0,0,0], stageGates:[[0,0,0],[0,0],[0,0],[0,0],[0,0,0,0],[0,0],[0],[0]], stageAssignees:['李工','李工','李工','李工','李工','李工','李工','李工'], aiCreated:true, assignee:'李工' },
    { id:'t7', pid:'p5', title:'阅件二次身份核验双因子(2FA)下载模块开发', type:'Feature', priority:'P1', estimate:'8d', status:'backlog', stageCurrent:-1, stageNames:[], stages:[], stageGates:[], stageAssignees:[], aiCreated:false, assignee:'赵工' },
    { id:'t8', pid:'p5', title:'档案历史版本回溯查看与版本控制引擎重构', type:'Refactor', priority:'P2', estimate:'12d', status:'review', stageCurrent:2, stageNames:['方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[1,1,0,0,0,0], stageGates:[[1],[1],[1,1],[0,0],[0],[0]], stageAssignees:['刘工','刘工','刘工','刘工','刘工','刘工'], aiCreated:false, assignee:'刘工' },
    { id:'t9', pid:'p5', title:'自定义多级印章审批流程与电子签名日志组件', type:'Feature', priority:'P0', estimate:'15d', status:'done', stageCurrent:7, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[1,1,1,1,1,1,1,1], stageGates:[[1,1,1],[1,1],[1],[1,1],[1,1,1,1],[1,1],[1],[1]], stageAssignees:['王工','王工','王工','王工','王工','王工','王工','王工'], aiCreated:false, assignee:'王工' },
    { id:'t10', pid:'p1', title:'系统安全加固与配置巡检', type:'Enhancement', priority:'P1', estimate:'5d', status:'done', stageCurrent:7, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[1,1,1,1,1,1,1,1], stageGates:[[1,1],[1],[1],[1],[1],[1],[1],[1]], stageAssignees:['张伟','张伟','王工','李工','王工','李工','王工','张伟'], aiCreated:false, assignee:'张伟' }
  ],
  // Gate definitions per stage type
  gateDefs: {
    '需求分析': [
      { name:'需求完整性检查', desc:'检查需求是否包含背景、目标、验收标准、非功能需求', type:'pass' },
      { name:'语义冲突检测', desc:'检测需求之间的逻辑矛盾和术语不一致', type:'pass' },
      { name:'可追溯性检查', desc:'验证需求到业务目标的可追溯链路', type:'pass' },
    ],
    '需求拆解': [
      { name:'粒度合理性检查', desc:'子任务粒度 1-5 人天为合理范围', type:'pass' },
      { name:'依赖无环检测', desc:'确保任务依赖关系无循环', type:'pass' },
    ],
    '方案设计': [
      { name:'架构合规检查', desc:'检查方案是否符合架构规范和最佳实践', type:'warn' },
      { name:'技术选型评估', desc:'评估技术选型的合理性和风险', type:'pass' },
    ],
    '代码生成': [
      { name:'编码规范检查', desc:'检查代码是否符合团队编码规范', type:'pass' },
      { name:'安全漏洞扫描', desc:'OWASP Top 10 安全风险检测', type:'pass' },
    ],
    '代码审查': [
      { name:'编码规范检查', desc:'ESLint/Sonar 规范检查', type:'pass' },
      { name:'安全漏洞扫描', desc:'OWASP Top 10 安全风险检测', type:'pass' },
      { name:'代码复杂度检查', desc:'圈复杂度≤15，函数行数≤80', type:'fail', detail:'QueryOptimizer.process() 圈复杂度23>15\nSQLBuilder.build() 行数142>80' },
      { name:'最佳实践检测', desc:'异常处理、资源释放、设计模式', type:'pass' },
    ],
    '单元测试': [
      { name:'覆盖率门禁', desc:'行覆盖率≥80%，分支覆盖率≥70%', type:'fail', detail:'当前覆盖率62%，未达80%阈值' },
      { name:'测试通过率', desc:'全部测试用例必须100%通过', type:'pass' },
    ],
    '质量检查': [
      { name:'技术债务检查', desc:'技术债务比率不超过5%', type:'pass' },
    ],
    '验收确认': [
      { name:'DoD检查清单', desc:'功能完成、测试通过、文档齐全', type:'pass' },
    ],
    '测试': [
      { name:'覆盖率门禁', desc:'行覆盖率≥80%', type:'pass' },
      { name:'测试通过率', desc:'全部用例100%通过', type:'pass' },
    ],
  },
  // Conversations per task stage
  conversations: {
    't5-0': [
      { role:'agent', text:'需求分析阶段已开启自动门禁检查。<br>• <strong>需求完整性检查</strong>：通过 (100%) ✅<br>• <strong>可追溯性检查</strong>：通过 (100%) ✅<br>• <strong>语义冲突检测</strong>：<span style="color:var(--danger);font-weight:bold;">阻断 ❌</span><br><br><strong>检测到重大语义冲突（版本规则矛盾）：</strong><br>开发规范第8条指出“档案修改后生成独立版本，历史版本需完整保留并随时回溯查看”，而需求第9条指出“档案每次修改后自动覆盖版本，仅保留最新版本记录”。<br>这两个规则在公文版本的更新策略上存在根本的逻辑冲突！该门禁已阻断流水线，系统已自动提交“【高危需求冲突决策】公文系统版本控制行政决策”评审（ID: r4），等待项目负责人张经理进行行政决策。', time:m(1) }
    ],
    't1-4': [ // task t1, stage index 4 (代码审查)
      { role:'agent', text:'代码审查阶段已完成自动门禁检查。编码规范和安全扫描通过，但 <strong>QueryOptimizer.process()</strong> 圈复杂度超标 (23>15)，<strong>SQLBuilder.build()</strong> 方法过长 (142>80行)。这是详细的检查报告，需要我帮你自动重构吗？', time:m(120) },
      { role:'user', text:'先帮我重构 QueryOptimizer.process()。把子查询优化那块拆出来，注意不要改业务逻辑。', time:m(60) },
      { role:'agent', text:'已重构 <code>QueryOptimizer.java</code>，将 process() 中的子查询优化逻辑提取为 <code>optimizeSubquery()</code> 和 <code>applyIndexHint()</code> 两个独立方法，圈复杂度从 23 降至 10。修改仅涉及结构拆分，业务逻辑未变。已触发增量门禁检查——编码规范和安全扫描仍然通过，复杂度检查现在也通过了。', time:m(5) },
    ],
    't1-3': [
      { role:'agent', text:'代码生成阶段已完成。生成了 5 个 Java 文件和 2 个配置文件。所有产出物已通过编码规范检查和安全漏洞扫描。', time:m(360) },
      { role:'user', text:'QueryOptimizer 的索引提示逻辑需要参考我们现有的 IndexHintHelper 工具类，不要重复造轮子。', time:m(300) },
      { role:'agent', text:'已修改，现在 QueryOptimizer 通过 IndexHintHelper 复用索引提示逻辑，减少了 45 行重复代码。已重新通过编码规范检查。', time:m(240) },
    ],
    't2-3': [
      { role:'user', text:'参考需求分析报告，我要新增一个人事管理模块。', time:m(1800) },
      { role:'agent', text:'已读取需求分析报告。主要功能包括：<br>• P0：员工花名册管理、入职流程、转正管理、离职管理<br>• P1：岗位调动、人事报表<br><br>技术要求：查询响应≤500ms，批量导入1000条≤10s，敏感数据脱敏存储。<br><br>先创建项目结构和数据库模型，可以吗？', time:m(1740) },
      { role:'user', text:'张经理：可以。', time:m(1680) },
      { role:'agent', text:'正在创建项目结构...<br><br><pre style="background:#F8FAFC;padding:10px;border-radius:6px;font-size:12px;">src/modules/hr/\n├── employee/      # 员工花名册\n├── onboarding/    # 入职流程\n├── confirmation/  # 转正管理\n├── transfer/      # 岗位调动\n├── resignation/   # 离职管理\n└── report/        # 人事报表</pre><br>数据库设计完成：<br>• ✅ employees 表 - 花名册主数据<br>• ✅ employee_events 表 - 入转调离事件流水<br>• ✅ approval_flows 表 - 审批流程配置', time:m(1620) },
      { role:'user', text:'先做员工花名册管理。', time:m(1560) },
      { role:'agent', text:'正在实现员工花名册管理...<br><br>• ✅ model: Employee, EmployeeEvent<br>• ✅ API: POST/GET/PUT/DELETE /api/hr/employees<br>• ✅ 敏感字段（身份证、薪资）脱敏存储<br>• ✅ 支持批量导入/导出，Excel模板下载<br><br>需要实现入职流程模块吗？', time:m(1500) },
      { role:'user', text:'接下来做入职流程。', time:m(1440) },
      { role:'agent', text:'正在实现入职流程...<br><br>• ✅ workflow: 发起申请 → 部门审批 → HR确认 → 自动建账<br>• ✅ 消息通知集成（邮件/站内信）<br>• ✅ 状态机：pending → department_approved → hr_approved → active<br><br>需要实现转正管理吗？', time:m(1380) },
      { role:'user', text:'接下来做转正管理。', time:m(1320) },
      { role:'agent', text:'正在实现转正管理...<br><br>• ✅ 试用期到期自动提醒（定时任务）<br>• ✅ 两级审批流程：直属上级 → HR<br>• ✅ 审批通过后自动更新员工状态为正式员工<br><br>需要实现离职管理吗？', time:m(1260) },
      { role:'user', text:'接下来做离职管理。', time:m(1200) },
      { role:'agent', text:'正在实现离职管理...<br><br>• ✅ 离职申请 → 部门审批 → HR办理交接<br>• ✅ 账号自动冻结<br>• ✅ 数据保留3年后归档<br><br>还需要实现岗位调动和人事报表，要继续吗？', time:m(1140) },
      { role:'user', text:'做岗位调动。', time:m(1080) },
      { role:'agent', text:'正在实现岗位调动...<br><br>• ✅ 调动申请流程<br>• ✅ 原部门和新部门双方审批<br>• ✅ 审批通过后同步更新组织架构（延迟≤1s）<br><br>接下来做人事报表吗？', time:m(1020) },
      { role:'user', text:'做人事报表。', time:m(960) },
      { role:'agent', text:'正在实现人事报表...<br><br>• ✅ 在职员工统计报表<br>• ✅ 离职率分析报表<br>• ✅ 部门人员结构报表<br>• ✅ 支持导出Excel<br><br>性能要求达标：报表生成≤3s ✅', time:m(900) },
      { role:'user', text:'最后运行测试，确保模块正常工作。', time:m(840) },
      { role:'agent', text:'执行单元测试和集成测试...<br><br><pre style="background:#1E293B;color:#E2E8F0;padding:12px;border-radius:6px;font-size:12px;">✓ Employee CRUD - 8 tests passed\n✓ Onboarding Workflow - 5 tests passed\n✓ Confirmation Workflow - 4 tests passed\n✓ Transfer Sync - 3 tests passed\n✓ Resignation - 4 tests passed\n✓ Reports - 6 tests passed\n\nTotal: 30 tests, all passed ✅\n\n覆盖率: 85%</pre><br>人事管理模块开发完成！所有功能已通过测试。', time:m(780) },
    ],
  },
  rulesConfig: {
    '需求完整性检查': { enabled: true, threshold: 80 },
    '语义冲突检测': { enabled: true, threshold: 90 },
    '可追溯性检查': { enabled: true, threshold: 85 },
    '粒度合理性检查': { enabled: true, threshold: 70 },
    '依赖无环检测': { enabled: true, threshold: 100 },
    '架构合规检查': { enabled: true, threshold: 75 },
    '技术选型评估': { enabled: true, threshold: 80 },
    '编码规范检查': { enabled: true, threshold: 90 },
    '安全漏洞扫描': { enabled: true, threshold: 100 },
    '代码复杂度检查': { enabled: true, threshold: 85 },
    '最佳实践检测': { enabled: true, threshold: 80 },
    '覆盖率门禁': { enabled: true, threshold: 80 },
    '测试通过率': { enabled: true, threshold: 100 },
    '技术债务检查': { enabled: true, threshold: 95 },
    'DoD检查清单': { enabled: true, threshold: 100 },
    '合规审计检查': { enabled: false, threshold: 100 },
  },
  globalGuidelines: {
    engineering: '1. 版本控制：所有代码必须纳入 Git 管理，主分支受保护，禁止直接 push。\n2. 分支策略：采用 GitFlow 工作流，功能分支命名 feature/{module}-{desc}，修复分支 hotfix/{issue}。\n3. 代码评审：合并请求必须通过至少 1 名核心成员 Code Review，严禁自审自合。\n4. 持续集成：每次提交自动触发 CI 流水线，包含编译、单测、静态扫描三个阶段。',
    security: '1. 身份认证：所有系统入口必须实施多因素认证（MFA），禁止明文传输凭据。\n2. 数据安全：敏感数据（身份证、薪资、密钥）必须加密存储，日志中严禁打印明文敏感信息。\n3. 权限控制：遵循最小权限原则，接口级鉴权必须覆盖全部写操作。\n4. 依赖安全：引入第三方组件前必须通过漏洞扫描（CVE/CNVD），高危组件严禁上线。',
    collaboration: '1. 提交规范：Commit Message 格式为 <type>(<scope>): <subject>，type 取 feat/fix/refactor/docs/chore。\n2. 文档同步：接口变更必须同步更新 API 文档，需求变更必须同步更新 PRD。\n3. 沟通机制：每日站会不超过 15 分钟，技术方案评审需提前 24 小时发出文档。',
    testing: '1. 测试分层：单元测试（70%）→ 集成测试（20%）→ E2E 测试（10%），金字塔模型。\n2. 环境隔离：测试环境必须与生产环境配置隔离，禁止测试写入生产库。\n3. 回归策略：每次发版前必须执行全量回归测试套件，关键路径用例 100% 通过。',
    release: '1. 发布流程：采用灰度发布策略，先金丝雀（5%）→ 小流量（20%）→ 全量。\n2. 回滚机制：每次发布必须具备一键回滚能力，回滚操作 ≤ 5 分钟完成。\n3. 变更窗口：非紧急变更仅在工作日 10:00-16:00 执行，禁止周五下午发布。',
  },
  reviews: [
    { id:'r1', tid:'t1', stage:2, stageName:'代码审查', reviewer:'王工', status:'pending', desc:'安全相关代码需人工确认，门禁已全部通过' },
    { id:'r2', tid:'t2', stage:2, stageName:'方案设计', reviewer:'李工', status:'pending', desc:'数据脱敏规则引擎的架构方案涉及 3 个核心模块调整，需技术负责人评审' },
    { id:'r3', tid:'t3', stage:-1, stageName:'需求分析', reviewer:'赵工', status:'pending', desc:'日志采集组件升级方案确认' },
    { id:'r4', tid:'t5', stage:0, stageName:'需求分析', reviewer:'张经理', status:'pending', desc:'【高危需求冲突决策】公文系统开发规范第8条（保留历史版本）与需求第9条（单版本自动覆盖）存在根本性冲突，请项目负责人进行行政决策！' },
    { id:'r5', tid:'t8', stage:2, stageName:'方案设计', reviewer:'刘工', status:'pending', desc:'公文多版本控制引擎架构设计，涉及底层存储及归档逻辑，需核心架构师评审' },
  ],
  timeline: [
    { time:m(0), text:'AI 语义分析 Agent 发现 <strong>公文管理系统</strong> 存在第8条与第9条版本控制规则语义冲突，门禁触发阻断！' },
    { time:m(2), text:'系统自动创建了 <strong>公文管理系统</strong> 的“语义一致性行政决策评审” (r4)' },
    { time:m(5), text:'李工 提交了 <strong>公文管理系统</strong> 阅件二次身份核验方案设计评审意见' },
    { time:m(10), text:'测试 Agent 为 <strong>公文管理系统</strong> 生成了双重核验与用印状态机测试报告' },
    { time:m(15), text:'代码审查 Agent 完成 <strong>OA办公系统</strong> 的代码审查阶段，1 项门禁阻断' },
    { time:m(480), text:'张伟提交了 <strong>人事管理模块</strong> 的方案设计评审意见' },
    { time:m(900), text:'AI 自动拆解了 <strong>OA办公系统</strong> 的"流程审批模块"需求，生成 6 个子任务' },
    { time:m(1920), text:'单元测试门禁在 <strong>公文档案模块</strong> 触发阻断：覆盖率 62% < 80%' },
    { time:m(3600), text:'部署 Agent 完成 <strong>办公系统基线版本</strong> 的灰度发布，验收全部通过' },
  ],
  skills: [
    { id:'sk1', name:'需求分析技能', ver:'v2.3', calls:1247, status:'enabled', desc:'智能分析需求文档，执行完整性检查、语义一致性分析、可追溯性验证。支持 .html / .docx / .txt 格式输入。', tags:['需求分析阶段','NLU'] },
    { id:'sk2', name:'代码生成技能', ver:'v3.1', calls:3892, status:'enabled', desc:'基于方案设计与需求，智能生成高质量代码。支持 Java / Python / TypeScript / Go，内置编码规范和最佳实践。', tags:['代码生成阶段','CodeGen'] },
    { id:'sk3', name:'代码审查技能', ver:'v2.8', calls:2104, status:'enabled', desc:'静态分析、安全扫描（OWASP）、复杂度检测、最佳实践审查。输出结构化审查报告和修复建议。', tags:['代码审查阶段','安全'] },
    { id:'sk4', name:'测试生成技能', ver:'v1.9', calls:1856, status:'enabled', desc:'自动生成单元测试和集成测试用例，支持 JUnit / pytest / Jest。目标覆盖率可配置。', tags:['测试阶段','TDD'] },
    { id:'sk5', name:'任务拆解技能', ver:'v2.0', calls:923, status:'enabled', desc:'将大粒度需求智能拆解为可执行子任务，评估依赖关系 and 工时，生成看板 Backlog。', tags:['需求拆解阶段'] },
    { id:'sk6', name:'质量分析技能', ver:'v1.7', calls:1567, status:'enabled', desc:'技术债务检测、代码重复率分析、性能基线检查。', tags:['质量检查阶段','Metrics'] },
    { id:'sk7', name:'方案设计技能', ver:'v1.8', calls:892, status:'enabled', desc:'架构设计辅助、接口定义、技术选型建议。自动生成设计文档。', tags:['方案设计阶段'] },
    { id:'sk8', name:'部署编排技能', ver:'v1.5', calls:412, status:'disabled', desc:'灰度发布策略生成、回滚条件校验、部署环境一致性检查。', tags:['部署阶段'] },
    { id:'sk9', name:'验收检查技能', ver:'v1.6', calls:678, status:'enabled', desc:'DoD 检查清单自动化校验、合规审计辅助、性能验收。', tags:['验收阶段'] },
  ],
  agents: [
    { id:'ag1', name:'需求分析 Agent', avatar:'📋', color:'#10B981', stage:'需求分析', desc:'解析需求文档，执行完整性/语义/追溯性检查' },
    { id:'ag2', name:'需求拆解 Agent', avatar:'✂️', color:'#8B5CF6', stage:'需求拆解', desc:'将需求拆解为可执行子任务，分析依赖关系' },
    { id:'ag3', name:'方案设计 Agent', avatar:'🏗️', color:'#3B82F6', stage:'方案设计', desc:'架构设计、接口定义、技术选型评估' },
    { id:'ag4', name:'代码生成 Agent', avatar:'💻', color:'#06B6D4', stage:'代码生成', desc:'基于方案生成代码，执行编码规范检查' },
    { id:'ag5', name:'代码审查 Agent', avatar:'🔍', color:'#F59E0B', stage:'代码审查', desc:'静态分析、安全扫描、复杂度检测' },
    { id:'ag6', name:'单元测试 Agent', avatar:'🧪', color:'#EF4444', stage:'单元测试', desc:'生成测试用例，执行覆盖率门禁' },
    { id:'ag7', name:'质量检查 Agent', avatar:'📊', color:'#10B981', stage:'质量检查', desc:'技术债务检测、重复率分析、性能基线' },
    { id:'ag8', name:'验收确认 Agent', avatar:'✅', color:'#22C55E', stage:'验收确认', desc:'DoD 检查清单、合规审计、性能验收' },
  ],
};

let taskIdCounter = 11;
let reviewIdCounter = 5;
let skillIdCounter = 10;
let agentIdCounter = 10;
let chatTimeout = null;

// Agent assignments per stage
const stageAgents = {
  '需求分析': { name: '需求分析 Agent', avatar: '📋', color: '#10B981', desc: '解析需求文档，执行完整性/语义/追溯性检查' },
  '需求拆解': { name: '需求拆解 Agent', avatar: '✂️', color: '#8B5CF6', desc: '将需求拆解为可执行子任务，分析依赖关系' },
  '方案设计': { name: '方案设计 Agent', avatar: '🏗️', color: '#3B82F6', desc: '架构设计、接口定义、技术选型评估' },
  '代码生成': { name: '代码生成 Agent', avatar: '💻', color: '#06B6D4', desc: '基于方案生成代码，执行编码规范检查' },
  '代码审查': { name: '代码审查 Agent', avatar: '🔍', color: '#F59E0B', desc: '静态分析、安全扫描、复杂度检测' },
  '单元测试': { name: '单元测试 Agent', avatar: '🧪', color: '#EF4444', desc: '生成测试用例，执行覆盖率门禁' },
  '质量检查': { name: '质量检查 Agent', avatar: '📊', color: '#10B981', desc: '技术债务检测、重复率分析、性能基线' },
  '验收确认': { name: '验收确认 Agent', avatar: '✅', color: '#22C55E', desc: 'DoD 检查清单、合规审计、性能验收' },
  '测试': { name: '测试 Agent', avatar: '🧪', color: '#EF4444', desc: '执行测试用例，统计覆盖率' },
};

// 多Agent协作配置 - 某些阶段有多个Agent协作
const stageMultiAgents = {
  '需求分析': [
    { id: 'req-analyst', name: '需求分析 Agent', avatar: '📋', color: '#10B981', role: '分析需求完整性' },
    { id: 'req-reviewer', name: '需求分析 Agent', avatar: '🔍', color: '#3B82F6', role: '质疑需求合理性' },
  ],
  '方案设计': [
    { id: 'architect', name: '方案设计 Agent', avatar: '🏗️', color: '#8B554A', role: '设计系统架构' },
    { id: 'tech-lead', name: '方案设计 Agent', avatar: '👨‍💻', color: '#6366F1', role: '评估技术可行性' },
  ],
};

// Agent communication messages between stages
const agentCommMessages = {
  '需求分析→需求拆解': '需求文档已通过完整性检查',
  '需求拆解→方案设计': '6个子任务已拆解完成',
  '方案设计→代码生成': '架构方案和接口定义已就绪',
  '代码生成→代码审查': '5个Java文件已生成',
  '代码审查→单元测试': '代码审查完成，2处需修复',
  '单元测试→质量检查': '测试用例已生成，覆盖率62%',
  '质量检查→验收确认': '技术债务0.8%，质量达标',
};

// 阶段负责人配置 - 每个阶段可选的负责人列表
const stageOwners = {
  '需求分析': ['张伟', '李工', '王工'],
  '需求拆解': ['张伟', '李工'],
  '方案设计': ['王工', '赵工', '刘工'],
  '代码生成': ['李工', '赵工'],
  '代码审查': ['王工', '刘工'],
  '单元测试': ['李工', '赵工'],
  '质量检查': ['王工', '刘工'],
  '验收确认': ['张伟', '王工'],
};

// Activity log for current task
const activityLogs = {};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function getProject(id) { return state.projects.find(p => p.id === id); }
function getTask(id) { return state.tasks.find(t => t.id === id); }
function getProjectTasks(pid) { return state.tasks.filter(t => t.pid === pid); }
function formatTime(ts) { return ts; }

function toast(msg, isError) {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.innerHTML = (isError ? '&#10007; ' : '&#10003; ') + msg;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2500);
}

function animateValue(el, start, end, duration) {
  const startTime = performance.now();
  function update(ts) {
    const progress = Math.min((ts - startTime) / duration, 1);
    el.textContent = Math.floor(start + (end - start) * progress);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function updateBadges() {
  const tasks = getProjectTasks(state.activeProjectId);
  const execTasks = tasks.filter(t => t.status === 'executing' || t.status === 'review');
  const blockedGates = execTasks.filter(t => {
    if (t.stageCurrent < 0 || !t.stageGates[t.stageCurrent]) return false;
    return t.stageGates[t.stageCurrent].some(g => g === 0);
  });
  const pendingReviews = state.reviews.filter(r => r.status === 'pending');
  
  const bTasks = document.getElementById('badgeTasks');
  const bGates = document.getElementById('badgeGates');
  const bReviews = document.getElementById('badgeReviews');
  const bProjectReviews = document.getElementById('badgeProjectReviews');
  
  if(bTasks) bTasks.textContent = tasks.filter(t => t.status !== 'done').length;
  if(bGates) bGates.textContent = blockedGates.length;
  if(bReviews) bReviews.textContent = pendingReviews.length;
  if(bProjectReviews) {
    const projectTaskIds = tasks.map(t => t.id);
    const pendingProjectReviews = pendingReviews.filter(r => projectTaskIds.includes(r.tid));
    bProjectReviews.textContent = pendingProjectReviews.length;
  }
}

// ============================================================
// SCHEDULED TASKS DATA
// ============================================================
const scheduledTasks = [
  {
    id: 'st1',
    name: '代码行数检测任务',
    icon: '&#128203;',
    status: 'success',
    lastRun: '2026-05-12 09:00',
    nextRun: '2026-05-19 09:00',
    summary: '扫描 128 个文件，总计 18,432 行代码',
    config: {
      scanPath: { label: '扫描路径', value: '/src', type: 'text' },
      fileTypes: { label: '文件类型', value: '.js, .ts, .py, .java, .go', type: 'text' },
      excludeDirs: { label: '排除目录', value: 'node_modules, dist, .git', type: 'text' },
      lineThreshold: { label: '告警阈值', value: '500 行', type: 'text' },
      schedule: { label: '执行周期', value: '每周一 09:00', type: 'text' },
    },
    history: [
      { time: '2026-05-12 09:00', result: '扫描 128 文件，18,432 行', status: 'success' },
      { time: '2026-05-05 09:00', result: '扫描 125 文件，17,890 行', status: 'success' },
      { time: '2026-04-28 09:00', result: '扫描 120 文件，16,540 行', status: 'success' },
      { time: '2026-04-21 09:00', result: '3 个文件超过 500 行阈值', status: 'warning' },
      { time: '2026-04-14 09:00', result: '扫描 115 文件，15,230 行', status: 'success' },
    ],
  },
  {
    id: 'st2',
    name: 'AI 代码比例检测任务',
    icon: '&#129302;',
    status: 'success',
    lastRun: '2026-05-15 08:00',
    nextRun: '2026-05-16 08:00',
    summary: 'AI 代码占比 46.2%，低于 60% 告警阈值',
    config: {
      scanPath: { label: '扫描路径', value: '/src', type: 'text' },
      aiTagRule: { label: 'AI 标识规则', value: 'git commit 含 "AI" / "copilot" 标签', type: 'text' },
      ratioThreshold: { label: '告警阈值', value: '60%', type: 'text' },
      dimension: { label: '统计维度', value: '按模块', type: 'select', options: ['按文件', '按人', '按模块'] },
      schedule: { label: '执行周期', value: '每日 08:00', type: 'text' },
    },
    history: [
      { time: '2026-05-15 08:00', result: 'AI 代码占比 46.2%', status: 'success' },
      { time: '2026-05-14 08:00', result: 'AI 代码占比 45.8%', status: 'success' },
      { time: '2026-05-13 08:00', result: 'AI 代码占比 47.1%', status: 'success' },
      { time: '2026-05-12 08:00', result: 'AI 代码占比 44.5%', status: 'success' },
      { time: '2026-05-11 08:00', result: 'AI 代码占比 62.3%，超过阈值', status: 'warning' },
    ],
  },
  {
    id: 'st3',
    name: '文档规范检查任务',
    icon: '&#128196;',
    status: 'warning',
    lastRun: '2026-05-10 17:00',
    nextRun: '2026-05-17 17:00',
    summary: '发现 3 处文档格式问题，2 处链接失效',
    config: {
      docPath: { label: '文档目录', value: '/docs', type: 'text' },
      docFormat: { label: '文档格式', value: '.md, .docx', type: 'text' },
      checkRules: { label: '检查规则', value: '标题层级、必填章节、链接有效性', type: 'text' },
      severity: { label: '严重级别', value: 'warning', type: 'select', options: ['error', 'warning', 'info'] },
      schedule: { label: '执行周期', value: '每周五 17:00', type: 'text' },
    },
    history: [
      { time: '2026-05-10 17:00', result: '3 处格式问题，2 处链接失效', status: 'warning' },
      { time: '2026-05-03 17:00', result: '全部文档通过检查', status: 'success' },
      { time: '2026-04-26 17:00', result: '1 处必填章节缺失', status: 'warning' },
      { time: '2026-04-19 17:00', result: '全部文档通过检查', status: 'success' },
      { time: '2026-04-12 17:00', result: '5 处格式问题', status: 'warning' },
    ],
  },
];

// Persist skills to localStorage
function saveSkills() {
  localStorage.setItem('app_skills', JSON.stringify(state.skills));
  localStorage.setItem('app_skillIdCounter', skillIdCounter);
}

// Load skills from localStorage on init
(function loadSkills() {
  try {
    const saved = localStorage.getItem('app_skills');
    if (saved) {
      state.skills = JSON.parse(saved);
    }
    const savedCounter = localStorage.getItem('app_skillIdCounter');
    if (savedCounter) {
      skillIdCounter = parseInt(savedCounter, 10);
    }
  } catch(e) { /* ignore corrupt data */ }
})();

function saveAgents() {
  localStorage.setItem('app_agents', JSON.stringify(state.agents));
  localStorage.setItem('app_agentIdCounter', agentIdCounter);
}

(function loadAgents() {
  try {
    const saved = localStorage.getItem('app_agents');
    if (saved) {
      state.agents = JSON.parse(saved);
    }
    const savedCounter = localStorage.getItem('app_agentIdCounter');
    if (savedCounter) {
      agentIdCounter = parseInt(savedCounter, 10);
    }
  } catch(e) { /* ignore corrupt data */ }
})();
