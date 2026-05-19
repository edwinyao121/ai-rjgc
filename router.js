// ============================================================
// AGENT PANEL
// ============================================================
function toggleAgentPanel() {
  const panel = document.getElementById('agentPanel');
  if (panel.style.display === 'none') {
    openSidebar({}); // 打开默认面板
  } else {
    panel.style.display = 'none';
  }
}

window.openSidebar = function(config) {
  const panel = document.getElementById('agentPanel');
  panel.style.display = 'flex';
  
  const titleEl = panel.querySelector('.smart-panel-title-main');
  const subEl = panel.querySelector('.smart-panel-title-sub');
  if (titleEl) titleEl.innerHTML = config.title || '小智 · 软件工厂超级智能体';
  if (subEl) subEl.innerHTML = config.subtitle || '智能生成软件研制方案，实现端到端交付';
  
  const bodyEl = document.getElementById('smartPanelBody');
  const inputEl = document.querySelector('.smart-panel-input');
  
  if (config.contentHtml) {
    bodyEl.innerHTML = config.contentHtml;
  } else {
    bodyEl.innerHTML = `
      <div class="smart-welcome">
        <div class="smart-welcome-icon">&#9759;</div>
        <h2>${config.title || '我是软件工厂超级智能体'}</h2>
        <p>${config.subtitle || '能帮你智能生成软件研制方案<br>实现端到端交付'}</p>
      </div>
      <div id="smartMessages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;"></div>
    `;
  }
  
  if (config.showInput === false) {
    inputEl.style.display = 'none';
  } else {
    inputEl.style.display = 'flex';
  }
};

function sendSmartMessage() {
  const input = document.getElementById('smartInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const messages = document.getElementById('smartMessages');
  const welcome = document.querySelector('.smart-welcome');
  if (welcome) welcome.style.display = 'none';

  messages.innerHTML += `<div class="smart-msg user"><div class="smart-msg-bubble">${text}</div><div class="smart-msg-avatar user-avatar">张</div></div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  const typingEl = document.createElement('div');
  typingEl.className = 'smart-msg ai';
  typingEl.innerHTML = `<div class="smart-msg-avatar ai">&#9759;</div><div class="smart-msg-bubble" style="color:var(--text-muted);">正在分析任务需求...</div>`;
  messages.appendChild(typingEl);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    typingEl.remove();
    const plan = generateSmartPlan(text);
    const resultHtml = `<div class="smart-msg ai">
      <div class="smart-msg-avatar ai">&#9759;</div>
      <div class="smart-msg-bubble">
        <div style="font-size:15px;font-weight:600;color:#1E40AF;margin-bottom:10px;">&#10003; 智能分析完成！为「${text}」规划如下流水线</div>
        <div style="font-size:13px;color:#475569;margin-bottom:14px;">共 <strong>${plan.stages.length}</strong> 个执行阶段，由多智能体协作完成</div>
        <div class="smart-plan-result">
          <div class="smart-plan-title">&#9776; 流水线阶段详情</div>
          ${plan.stages.map((s, i) => `
            <div class="smart-plan-stage">
              <div class="smart-plan-stage-num">${i + 1}</div>
              <div class="smart-plan-stage-info">
                <div class="smart-plan-stage-name">${s.name}</div>
                <div class="smart-plan-stage-agent">&#9759; ${s.agent}</div>
                <div class="smart-plan-gates">
                  ${s.gates.map(g => `<span class="smart-plan-gate${g.fail?' fail':''}">${g.name}</span>`).join('')}
                </div>
                <div class="smart-plan-artifacts">&#9745; 产出物: ${s.artifacts}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="smart-plan-execute">
          <button class="btn btn-primary" onclick="executeSmartPlan('${plan.taskId}')">&#9654; 执行流水线</button>
          <button class="btn btn-outline" onclick="toggleAgentPanel()">取消</button>
        </div>
      </div>
    </div>`;
    messages.innerHTML += resultHtml;
    messages.scrollTop = messages.scrollHeight;
  }, 1500);
}

function generateSmartPlan(taskName) {
  const templates = [
    {
      name: '用户登录功能',
      stages: [
        { name: '需求分析', agent: '需求分析 Agent', gates: [{name:'需求完整性检查',fail:false},{name:'语义冲突检测',fail:false}], artifacts: '需求分析报告.html' },
        { name: '需求拆解', agent: '任务拆解 Agent', gates: [{name:'粒度合理性检查',fail:false},{name:'依赖无环检测',fail:false}], artifacts: '任务拆解方案.html' },
        { name: '方案设计', agent: '方案设计 Agent', gates: [{name:'架构合规检查',fail:false},{name:'技术选型评估',fail:true}], artifacts: '架构设计方案.html' },
        { name: '代码生成', agent: '代码生成 Agent', gates: [{name:'编码规范检查',fail:false},{name:'安全漏洞扫描',fail:false}], artifacts: 'LoginController.java, UserService.java' },
        { name: '代码审查', agent: '代码审查 Agent', gates: [{name:'编码规范检查',fail:false},{name:'安全漏洞扫描',fail:false},{name:'代码复杂度检查',fail:false}], artifacts: '审查报告.json' },
        { name: '单元测试', agent: '测试生成 Agent', gates: [{name:'覆盖率门禁',fail:false},{name:'测试通过率',fail:false}], artifacts: 'LoginControllerTest.java' },
        { name: '验收确认', agent: '验收检查 Agent', gates: [{name:'DoD检查清单',fail:false}], artifacts: '验收报告.html' },
      ]
    },
    {
      name: '订单查询模块',
      stages: [
        { name: '需求分析', agent: '需求分析 Agent', gates: [{name:'需求完整性检查',fail:false}], artifacts: '需求分析报告.html' },
        { name: '需求拆解', agent: '任务拆解 Agent', gates: [{name:'粒度合理性检查',fail:false}], artifacts: '任务拆解方案.html' },
        { name: '方案设计', agent: '方案设计 Agent', gates: [{name:'架构合规检查',fail:false},{name:'技术选型评估',fail:false}], artifacts: '架构设计方案.html, 接口定义.yaml' },
        { name: '代码生成', agent: '代码生成 Agent', gates: [{name:'编码规范检查',fail:false},{name:'安全漏洞扫描',fail:false}], artifacts: 'OrderQueryController.java, OrderService.java' },
        { name: '代码审查', agent: '代码审查 Agent', gates: [{name:'编码规范检查',fail:false},{name:'代码复杂度检查',fail:false}], artifacts: '审查报告.json' },
        { name: '单元测试', agent: '测试生成 Agent', gates: [{name:'覆盖率门禁',fail:false},{name:'测试通过率',fail:false}], artifacts: 'OrderQueryTest.java' },
      ]
    },
    {
      name: '数据导出功能',
      stages: [
        { name: '需求分析', agent: '需求分析 Agent', gates: [{name:'需求完整性检查',fail:false},{name:'可追溯性检查',fail:false}], artifacts: '需求分析报告.html' },
        { name: '需求拆解', agent: '任务拆解 Agent', gates: [{name:'粒度合理性检查',fail:false}], artifacts: '任务拆解方案.html' },
        { name: '方案设计', agent: '方案设计 Agent', gates: [{name:'架构合规检查',fail:false}], artifacts: '架构设计方案.html' },
        { name: '代码生成', agent: '代码生成 Agent', gates: [{name:'编码规范检查',fail:false},{name:'安全漏洞扫描',fail:false}], artifacts: 'ExportService.java, ExcelUtil.java' },
        { name: '质量检查', agent: '质量分析 Agent', gates: [{name:'技术债务检查',fail:false},{name:'重复率分析',fail:false}], artifacts: '质量检查报告.pdf' },
      ]
    }
  ];

  const idx = Math.floor(Math.random() * templates.length);
  return { ...templates[idx], taskId: 't' + (++taskIdCounter) };
}

function executeSmartPlan(taskId) {
  toast('任务已创建，流水线启动成功！');
  toggleAgentPanel();
  navigate('kanban');
}

// ============================================================
// NAVIGATION
// ============================================================
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // 更新顶部菜单栏
  const topbarLeft = document.querySelector('.topbar-left');
  if (topbarLeft) {
    if (state.context.level === 'global') {
      topbarLeft.innerHTML = `<h1>智能软件工厂</h1><span class="breadcrumb" id="breadcrumbWrapper"></span>`;
    } else {
      topbarLeft.innerHTML = `<h1 onclick="navigate('dashboard')" style="cursor:pointer;" title="返回工作台">智能软件工厂</h1><span class="breadcrumb" id="breadcrumbWrapper"></span>`;
    }
  }

  if (state.context.level === 'global') {
    sidebar.innerHTML = `
      <div class="logo" onclick="navigate('dashboard')"><div class="icon">&#9670;</div>智能软件工厂</div>
      <div class="nav-section">概览与个人</div>
      <div class="nav-item" data-page="dashboard" onclick="navigate('dashboard')">&#9698; 工作台</div>
      <div class="nav-item" data-page="projects" onclick="navigate('projects')">&#9632; 项目空间</div>
      <div class="nav-item" data-page="reviews" onclick="navigate('reviews')">&#9737; 我的评审<span class="badge" id="badgeReviews">0</span></div>
      <div class="nav-section">平台资产</div>
      <div class="nav-item" data-page="agents" onclick="navigate('agents')">&#129302; 智能体</div>
      <div class="nav-item" data-page="skills" onclick="navigate('skills')">&#9730; 技能市场</div>
      <div class="nav-item" data-page="rules-config" onclick="navigate('rules-config')">&#9881; 门禁配置</div>
    `;
  } else {
    const p = getProject(state.activeProjectId);
    const pName = p ? p.name : '项目内';
    sidebar.innerHTML = `
      <div class="logo" onclick="navigate('dashboard')" style="cursor:pointer;" title="返回工作台"><div class="icon">&#9670;</div>智能软件工厂</div>
      <div class="nav-section" style="color:var(--primary);font-weight:600;font-size:14px;padding:8px 20px;">${pName}</div>
      <div class="nav-item" data-page="kanban" onclick="navigate('kanban')">&#9776; 任务看板<span class="badge" id="badgeTasks">0</span></div>
      <div class="nav-item" data-page="project-reviews" onclick="navigate('project-reviews')">&#9737; 项目评审<span class="badge" id="badgeProjectReviews">0</span></div>
      <div class="nav-section">项目智能</div>
      <div class="nav-item" data-page="project-agents" onclick="navigate('project-agents')">&#129302; 项目智能体</div>
      <div class="nav-item" data-page="project-skills" onclick="navigate('project-skills')">&#9730; 项目技能库</div>
      <div class="nav-section">效能与质量</div>
      <div class="nav-item" data-page="project-gates" onclick="navigate('project-gates')">&#9745; 研发追溯</div>
      <div class="nav-item" data-page="project-rules-config" onclick="navigate('project-rules-config')">&#9881; 门禁配置</div>
      <div class="nav-item" data-page="project-summary" onclick="navigate('project-summary')">&#9776; 研制总结</div>
    `;
  }
}

function navigate(page, data) {
  state.activePage = page;
  
  const globalPages = ['dashboard', 'projects', 'reviews', 'agents', 'skills', 'rules-config'];
  const projectPages = ['kanban', 'pipeline-view', 'project-gates', 'project-reviews', 'project-agents', 'project-skills', 'project-rules-config', 'project-summary'];
  
  if (globalPages.includes(page)) {
    state.context.level = 'global';
  } else if (projectPages.includes(page)) {
    state.context.level = 'project';
  }

  renderSidebar();

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  
  const breadcrumbWrapper = document.getElementById('breadcrumbWrapper');
  let pageName = navItem ? navItem.textContent.replace(/[\\d]+$/, '').trim() : page;
  // Clean up icon symbols in textContent (assuming space after icon)
  if (pageName.includes(' ')) {
    pageName = pageName.split(' ').slice(1).join(' ').trim();
  }
  
  if (state.context.level === 'project' && state.activeProjectId) {
    const p = getProject(state.activeProjectId);
    const pName = p ? p.name : '未知项目';
    breadcrumbWrapper.innerHTML = `
      <span style="cursor:pointer;font-weight:600;" onclick="navigate('kanban')">${pName}</span>
      / <span id="pageTitle">${pageName}</span>`;
  } else {
    breadcrumbWrapper.innerHTML = `<span id="pageTitle">${pageName}</span>`;
  }

  renderPage(page, data);
  updateBadges();
  updateAgentWidget();
}

function updateAgentWidget() {
  const widget = document.getElementById('agentFloatWidget');
  if (widget) {
    widget.style.display = state.activePage === 'kanban' ? 'flex' : 'none';
  }
}

// remove the previous querySelectorAll listener, let sidebar handle it via onclick
// ============================================================
// PAGE RENDERER
// ============================================================
function renderPage(page, data) {
  const container = document.getElementById('mainContent');
  container.innerHTML = '';
  switch(page) {
    case 'dashboard': renderDashboard(container); break;
    case 'projects': renderProjects(container); break;
    case 'kanban': renderKanban(container); break;
    case 'pipeline-view': renderPipeline(container, data); break;
    case 'gates': 
    case 'project-gates': renderGates(container); break;
    case 'reviews': 
    case 'project-reviews': renderReviews(container); break;
    case 'rules-config':
    case 'project-rules-config': renderRulesConfig(container); break;
    case 'agents': renderAgents(container); break;
    case 'project-agents': renderProjectAgents(container); break;
    case 'summary':
    case 'project-summary': renderSummary(container); break;
    case 'skills': renderSkills(container); break;
    case 'project-skills': renderProjectSkills(container); break;
  }
}

// ============================================================
// INIT
// ============================================================
function init() {
  navigate('dashboard');
  // Keyboard shortcut: Ctrl+Enter in chat
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') {
      const input = document.getElementById('chatInput');
      if (input === document.activeElement) sendMessage();
    }
  });
}

// Bootstrap application
init();
