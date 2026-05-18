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
  projects: [
    { id:'p1', name:'OA办公系统', desc:'企业办公自动化系统', repo:'github.com/company/oa-system', members:8, status:'running', stagesDone:6, stagesTotal:8 },
    { id:'p2', name:'智能网关 2.0', desc:'API 网关升级与限流优化', repo:'github.com/stars/smart-gateway', members:5, status:'reviewing', stagesDone:4, stagesTotal:8 },
    { id:'p3', name:'用户中心重构', desc:'统一认证与权限中心', repo:'github.com/stars/user-center', members:4, status:'blocked', stagesDone:2, stagesTotal:6 },
    { id:'p4', name:'消息中间件升级', desc:'Kafka 集群升级与监控', repo:'github.com/stars/msg-bus', members:3, status:'done', stagesDone:7, stagesTotal:7 },
  ],
  tasks: [
    { id:'t1', pid:'p1', title:'办公系统基线版本研制', type:'Feature', priority:'P0', estimate:'20d', status:'executing', stageCurrent:4, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[1,1,1,1,0,0,0,0], stageGates:[[1,1,1],[1,1],[1],[1,1],[1,1,0,1],[0,0],[0],[0]], aiCreated:false, assignee:'张伟' },
    { id:'t2', pid:'p1', title:'新增人事管理模块', type:'Feature', priority:'P0', estimate:'15d', status:'executing', stageCurrent:2, stageNames:['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'], stages:[1,1,0,0,0,0,0,0], stageGates:[[1,1],[1],[0,1],[0],[0,0,0,0],[0],[0],[0]], aiCreated:false, assignee:'李工' },
    { id:'t3', pid:'p1', title:'重构流程审批模块', type:'Feature', priority:'P1', estimate:'12d', status:'backlog', stageCurrent:-1, stageNames:[], stages:[], stageGates:[], aiCreated:true, assignee:'王工' },
    { id:'t4', pid:'p1', title:'优化公文档案模块', type:'Enhancement', priority:'P2', estimate:'10d', status:'backlog', stageCurrent:-1, stageNames:[], stages:[], stageGates:[], aiCreated:false, assignee:'赵工' },
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
      { role:'agent', text:'已读取需求分析报告。主要功能包括：<br>• P0：员工花名册管理、入职流程、转正管理、离职管理<br>• P1：岗位调动、人事报表<br><br>技术要求：查询响应≤500ms，批量导入1000条≤10s，敏感数据加密存储。<br><br>先创建项目结构和数据库模型，可以吗？', time:m(1740) },
      { role:'user', text:'可以。', time:m(1680) },
      { role:'agent', text:'正在创建项目结构...<br><br><pre style="background:#F8FAFC;padding:10px;border-radius:6px;font-size:12px;">src/modules/hr/\n├── employee/      # 员工花名册\n├── onboarding/    # 入职流程\n├── confirmation/  # 转正管理\n├── transfer/      # 岗位调动\n├── resignation/   # 离职管理\n└── report/        # 人事报表</pre><br>数据库设计完成：<br>• ✅ employees 表 - 花名册主数据<br>• ✅ employee_events 表 - 入转调离事件流水<br>• ✅ approval_flows 表 - 审批流程配置', time:m(1620) },
      { role:'user', text:'先做员工花名册管理。', time:m(1560) },
      { role:'agent', text:'正在实现员工花名册管理...<br><br>• ✅ model: Employee, EmployeeEvent<br>• ✅ API: POST/GET/PUT/DELETE /api/hr/employees<br>• ✅ 敏感字段（身份证、薪资）加密存储<br>• ✅ 支持批量导入/导出，Excel模板下载<br><br>需要实现入职流程模块吗？', time:m(1500) },
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
  reviews: [
    { id:'r1', tid:'t1', stage:2, stageName:'代码审查', reviewer:'王工', status:'pending', desc:'安全相关代码需人工确认，门禁已全部通过' },
    { id:'r2', tid:'t2', stage:2, stageName:'方案设计', reviewer:'李工', status:'pending', desc:'数据脱敏规则引擎的架构方案涉及 3 个核心模块调整，需技术负责人评审' },
    { id:'r3', tid:'t3', stage:-1, stageName:'需求分析', reviewer:'赵工', status:'pending', desc:'日志采集组件升级方案确认' },
  ],
  timeline: [
    { time:m(0), text:'代码审查 Agent 完成 <strong>OA办公系统</strong> 的代码审查阶段，1 项门禁阻断' },
    { time:m(480), text:'张伟提交了 <strong>人事管理模块</strong> 的方案设计评审意见' },
    { time:m(900), text:'AI 自动拆解了 <strong>OA办公系统</strong> 的"流程审批模块"需求，生成 6 个子任务' },
    { time:m(1920), text:'单元测试门禁在 <strong>公文档案模块</strong> 触发阻断：覆盖率 62% < 80%' },
    { time:m(3600), text:'部署 Agent 完成 <strong>办公系统基线版本</strong> 的灰度发布，验收全部通过' },
  ],
};

let taskIdCounter = 10;
let reviewIdCounter = 4;
let chatTimeout = null;

// Agent assignments per stage
const stageAgents = {
  '需求分析': { name: '需求分析 Agent', avatar: '📋', color: '#10B981', desc: '解析需求文档，执行完整性/语义/追溯性检查' },
  '需求拆解': { name: '任务拆解 Agent', avatar: '✂️', color: '#8B5CF6', desc: '将需求拆解为可执行子任务，分析依赖关系' },
  '方案设计': { name: '方案设计 Agent', avatar: '🏗️', color: '#3B82F6', desc: '架构设计、接口定义、技术选型评估' },
  '代码生成': { name: '代码生成 Agent', avatar: '💻', color: '#06B6D4', desc: '基于方案生成代码，执行编码规范检查' },
  '代码审查': { name: '代码审查 Agent', avatar: '🔍', color: '#F59E0B', desc: '静态分析、安全扫描、复杂度检测' },
  '单元测试': { name: '测试生成 Agent', avatar: '🧪', color: '#EF4444', desc: '生成测试用例，执行覆盖率门禁' },
  '质量检查': { name: '质量分析 Agent', avatar: '📊', color: '#10B981', desc: '技术债务检测、重复率分析、性能基线' },
  '验收确认': { name: '验收检查 Agent', avatar: '✅', color: '#22C55E', desc: 'DoD 检查清单、合规审计、性能验收' },
  '测试': { name: '测试生成 Agent', avatar: '🧪', color: '#EF4444', desc: '执行测试用例，统计覆盖率' },
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
