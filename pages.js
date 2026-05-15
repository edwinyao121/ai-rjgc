// ============================================================
function renderAgents(container) {
  const agents = Object.entries(stageAgents).filter(([k]) => k !== '测试').map(([stage, a]) => ({ stage, ...a }));
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">智能体管理</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">平台内置研发智能体一览</div></div>
      <span class="tag tag-blue">${agents.length} 个智能体</span>
    </div>
    <div class="grid-3">${agents.map(a => `
      <div class="card card-hover">
        <div class="card-header">
          <div><div class="card-title">${a.avatar} ${a.name}</div>
          <div class="card-subtitle">阶段: ${a.stage}</div></div>
          <span class="tag tag-green">运行中</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-top:8px;">${a.desc}</div>
      </div>`).join('')}
    </div>`;
}

// ============================================================
// SUMMARY PAGE
// ============================================================
const summaryStats = {
  totalCommits: 1284, totalRequirements: 356, totalTasks: 89, completedTasks: 67,
  codeLines: '128.6K', testCoverage: '82.3%', gatePassRate: '91.7%', avgCycleDays: 8.5,
  aiCodeRatio: '46%', agentExecutions: 3892, reviewsCompleted: 124, defectsFound: 37,
  weeklyTrend: [
    { label: '新增任务', value: '+12', delta: '+20%', positive: true },
    { label: '完成任务', value: '8', delta: '+15%', positive: true },
    { label: '门禁阻断', value: '3', delta: '+50%', positive: false },
    { label: '代码提交', value: '156', delta: '+8%', positive: true },
  ],
  stageDistribution: [
    { stage: '需求分析', count: 12 }, { stage: '需求拆解', count: 8 },
    { stage: '方案设计', count: 15 }, { stage: '代码生成', count: 22 },
    { stage: '代码审查', count: 18 }, { stage: '单元测试', count: 10 },
    { stage: '质量检查', count: 6 }, { stage: '验收确认', count: 4 },
  ],
};

function renderSummary(container) {
  const s = summaryStats;
  const maxCount = Math.max(...s.stageDistribution.map(d => d.count));
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">研制总结</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">平台研发效能统计 · 静态模拟数据</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">&#9776;</div><div><div class="stat-value">${s.totalTasks}</div><div class="stat-label">总任务数</div></div></div>
      <div class="stat-card"><div class="stat-icon green">&#10003;</div><div><div class="stat-value">${s.completedTasks}</div><div class="stat-label">已完成任务</div></div></div>
      <div class="stat-card"><div class="stat-icon indigo">&#8635;</div><div><div class="stat-value">${s.totalCommits}</div><div class="stat-label">代码提交数</div></div></div>
      <div class="stat-card"><div class="stat-icon amber">&#9733;</div><div><div class="stat-value">${s.totalRequirements}</div><div class="stat-label">需求数量</div></div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon green">&#9632;</div><div><div class="stat-value">${s.testCoverage}</div><div class="stat-label">测试覆盖率</div></div></div>
      <div class="stat-card"><div class="stat-icon blue">&#9745;</div><div><div class="stat-value">${s.gatePassRate}</div><div class="stat-label">门禁通过率</div></div></div>
      <div class="stat-card"><div class="stat-icon indigo">&#129302;</div><div><div class="stat-value">${s.aiCodeRatio}</div><div class="stat-label">AI 代码比例</div></div></div>
      <div class="stat-card"><div class="stat-icon amber">&#9203;</div><div><div class="stat-value">${s.avgCycleDays} 天</div><div class="stat-label">平均交付周期</div></div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">研发效能指标</div>
        <table>
          <tr><td>代码总行数</td><td style="font-weight:600;">${s.codeLines}</td></tr>
          <tr><td>Agent 执行次数</td><td style="font-weight:600;">${s.agentExecutions.toLocaleString()}</td></tr>
          <tr><td>评审完成数</td><td style="font-weight:600;">${s.reviewsCompleted}</td></tr>
          <tr><td>发现缺陷数</td><td style="font-weight:600;">${s.defectsFound}</td></tr>
          <tr><td>需求交付周期</td><td style="font-weight:600;">${s.avgCycleDays} 天</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">本周趋势</div>
        <table>
          ${s.weeklyTrend.map(t => `
          <tr>
            <td>${t.label}</td>
            <td style="font-weight:600;">${t.value}</td>
            <td><span class="tag ${t.positive ? 'tag-green' : 'tag-red'}">${t.delta}</span></td>
          </tr>`).join('')}
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:14px;">任务阶段分布</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${s.stageDistribution.map(d => `
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:80px;font-size:12px;color:var(--text-secondary);text-align:right;">${d.stage}</div>
          <div class="progress-bar" style="flex:1;"><div class="fill indigo" style="width:${Math.round(d.count/maxCount*100)}%;"></div></div>
          <div style="width:30px;font-size:12px;font-weight:600;">${d.count}</div>
        </div>`).join('')}
      </div>
    </div>`;
}

// ============================================================
// SKILLS PAGE
// ============================================================
function renderSkills(container) {
  const skills = [
    { name:'需求分析技能', ver:'v2.3', calls:1247, status:'enabled', desc:'智能分析需求文档，执行完整性检查、语义一致性分析、可追溯性验证。支持 .html / .docx / .txt 格式输入。', tags:['需求分析阶段','NLU'] },
    { name:'代码生成技能', ver:'v3.1', calls:3892, status:'enabled', desc:'基于方案设计与需求，智能生成高质量代码。支持 Java / Python / TypeScript / Go，内置编码规范和最佳实践。', tags:['代码生成阶段','CodeGen'] },
    { name:'代码审查技能', ver:'v2.8', calls:2104, status:'enabled', desc:'静态分析、安全扫描（OWASP）、复杂度检测、最佳实践审查。输出结构化审查报告和修复建议。', tags:['代码审查阶段','安全'] },
    { name:'测试生成技能', ver:'v1.9', calls:1856, status:'enabled', desc:'自动生成单元测试和集成测试用例，支持 JUnit / pytest / Jest。目标覆盖率可配置。', tags:['测试阶段','TDD'] },
    { name:'任务拆解技能', ver:'v2.0', calls:923, status:'enabled', desc:'将大粒度需求智能拆解为可执行子任务，评估依赖关系和工时，生成看板 Backlog。', tags:['需求拆解阶段'] },
    { name:'质量分析技能', ver:'v1.7', calls:1567, status:'enabled', desc:'技术债务检测、代码重复率分析、性能基线检查。', tags:['质量检查阶段','Metrics'] },
    { name:'方案设计技能', ver:'v1.8', calls:892, status:'enabled', desc:'架构设计辅助、接口定义、技术选型建议。自动生成设计文档。', tags:['方案设计阶段'] },
    { name:'部署编排技能', ver:'v1.5', calls:412, status:'disabled', desc:'灰度发布策略生成、回滚条件校验、部署环境一致性检查。', tags:['部署阶段'] },
    { name:'验收检查技能', ver:'v1.6', calls:678, status:'enabled', desc:'DoD 检查清单自动化校验、合规审计辅助、性能验收。', tags:['验收阶段'] },
  ];
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">技能市场</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">内置 Agent 技能库（Multica 风格）— 管理员维护，全局复用</div></div>
      <span class="tag tag-blue">${skills.filter(s=>s.status==='enabled').length} 个技能可用</span>
    </div>
    <div class="grid-3">${skills.map(s => `
      <div class="card card-hover">
        <div class="card-header"><div><div class="card-title">&#9671; ${s.name}</div><div class="card-subtitle">${s.ver} · 调用 ${s.calls.toLocaleString()} 次</div></div><span class="tag ${s.status==='enabled'?'tag-green':'tag-slate'}">${s.status==='enabled'?'启用':'禁用'}</span></div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">${s.desc}</div>
        <div style="margin-top:10px;display:flex;gap:4px;flex-wrap:wrap;">${s.tags.map(t=>`<span class="tag tag-slate">${t}</span>`).join('')}</div>
        ${s.status==='enabled'?`<button class="btn btn-outline btn-sm" style="margin-top:10px;width:100%;" onclick="runSkillDemo('${s.name}')">&#9654; 演示调用</button>`:''}
      </div>`).join('')}</div>`;
}

function runSkillDemo(name) {
  toast(`技能 "${name}" 演示调用已触发`);
  const task = getTask(state.activeTaskId);
  if (!task || task.stageCurrent < 0) return;
  // Simulate skill execution
  setTimeout(() => {
    if (task.stageGates[task.stageCurrent]) {
      for (let i = 0; i < task.stageGates[task.stageCurrent].length; i++) {
        if (task.stageGates[task.stageCurrent][i] === 0 && Math.random() > 0.3) {
          task.stageGates[task.stageCurrent][i] = 1;
        }
      }
    }
    toast(`技能 "${name}" 执行完成`);
    if (state.activePage === 'pipeline-view') {
      const container = document.getElementById('mainContent');
      renderPipeline(container, { tid: task.id });
    }
    updateBadges();
  }, 1000);
}
