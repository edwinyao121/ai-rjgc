// ============================================================
// AGENT PANEL
// ============================================================
function toggleAgentPanel() {
  const panel = document.getElementById('agentPanel');
  if (panel.style.display === 'none') {
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
}

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
function navigate(page, data) {
  state.activePage = page;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  document.getElementById('pageTitle').textContent = navItem ? navItem.textContent.replace(/\d+$/, '').trim() : page;
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

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

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
    case 'gates': renderGates(container); break;
    case 'reviews': renderReviews(container); break;
    case 'rules-config': renderRulesConfig(container); break;
    case 'agents': renderAgents(container); break;
    case 'summary': renderSummary(container); break;
    case 'skills': renderSkills(container); break;
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
