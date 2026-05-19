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
// SUMMARY PAGE - 定时任务管理
// ============================================================
function renderSummary(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">研制总结</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">定时任务管理 · 内置检测任务</div></div>
    </div>
    ${scheduledTasks.map(task => `
      <div class="card" style="margin-top:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:${task.status==='success'?'#ECFDF5':'#FFFBEB'};display:flex;align-items:center;justify-content:center;font-size:20px;">${task.icon}</div>
            <div>
              <div style="font-size:16px;font-weight:600;">${task.name}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">上次执行: ${task.lastRun} · 下次执行: ${task.nextRun}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="tag ${task.status==='success'?'tag-green':'tag-amber'}">${task.status==='success'?'正常':'告警'}</span>
            <button class="btn btn-primary btn-sm" onclick="executeScheduledTask('${task.id}')">&#9654; 手动执行</button>
          </div>
        </div>
        <div style="background:var(--bg);border-radius:8px;padding:12px 16px;margin-bottom:12px;">
          <div style="font-size:13px;color:var(--text-secondary);">执行结果</div>
          <div style="font-size:14px;font-weight:500;margin-top:4px;">${task.summary}</div>
        </div>
        <div style="display:flex;gap:12px;">
          <div style="flex:1;">
            <div class="scheduled-section-header" onclick="toggleScheduledSection(this)">
              <span>&#9881; 配置项</span><span class="toggle-icon">&#9660;</span>
            </div>
            <div class="scheduled-section-body">
              <table style="width:100%;">
                ${Object.values(task.config).map(c => `
                  <tr>
                    <td style="width:120px;color:var(--text-secondary);font-size:12px;">${c.label}</td>
                    <td style="font-size:13px;font-weight:500;">${c.value}</td>
                  </tr>`).join('')}
              </table>
            </div>
          </div>
          <div style="flex:1;">
            <div class="scheduled-section-header" onclick="toggleScheduledSection(this)">
              <span>&#128203; 历史记录</span><span class="toggle-icon">&#9660;</span>
            </div>
            <div class="scheduled-section-body">
              <table style="width:100%;">
                <thead><tr><th style="font-size:12px;color:var(--text-muted);text-align:left;padding-bottom:8px;">时间</th><th style="font-size:12px;color:var(--text-muted);text-align:left;padding-bottom:8px;">结果</th></tr></thead>
                <tbody>
                  ${task.history.map(h => `
                    <tr>
                      <td style="font-size:12px;color:var(--text-secondary);padding:4px 0;">${h.time}</td>
                      <td style="font-size:12px;padding:4px 0;">
                        <span class="status-dot ${h.status==='success'?'green':'amber'}"></span>${h.result}
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`).join('')}`;
}

function toggleScheduledSection(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('.toggle-icon');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    icon.innerHTML = '&#9650;';
  } else {
    body.style.display = 'none';
    icon.innerHTML = '&#9660;';
  }
}

function executeScheduledTask(taskId) {
  const task = scheduledTasks.find(t => t.id === taskId);
  if (!task) return;
  toast(`正在执行: ${task.name}...`);
  setTimeout(() => {
    const results = {
      st1: '扫描 128 文件，18,432 行',
      st2: 'AI 代码占比 46.2%',
      st3: '3 处格式问题，2 处链接失效',
    };
    task.lastRun = new Date().toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    task.summary = results[taskId] || '执行完成';
    task.history.unshift({ time: task.lastRun, result: task.summary, status: 'success' });
    if (task.history.length > 5) task.history.pop();
    toast(`${task.name} 执行完成`);
    if (state.activePage === 'summary') {
      renderSummary(document.getElementById('mainContent'));
    }
  }, 1500);
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

// ============================================================
// PROJECT AGENTS PAGE
// ============================================================
function renderProjectAgents(container) {
  const project = getProject(state.activeProjectId);
  // Pick a subset of agents for this project
  const allAgents = Object.entries(stageAgents).filter(([k]) => k !== '测试').map(([stage, a]) => ({ stage, ...a }));
  // Just for demo, take first 5 agents
  const agents = allAgents.slice(0, 5);
  
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">项目智能体</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">本项目启用的研发智能体实例</div></div>
      <button class="btn btn-primary btn-sm" onclick="showAddProjectAgentModal()">+ 添加智能体</button>
    </div>
    <div class="grid-3" style="margin-top:16px;">${agents.map(a => `
      <div class="card card-hover">
        <div class="card-header">
          <div><div class="card-title">${a.avatar} ${a.name}</div>
          <div class="card-subtitle">负责阶段: ${a.stage}</div></div>
          <span class="tag tag-green">运行中</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-top:8px;">${a.desc}</div>
        <div style="margin-top:12px;display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:10px;">
          <span style="font-size:12px;color:var(--text-muted);">&#9730; 已挂载 2 个专属技能</span>
          <button class="btn btn-outline btn-xs" onclick="toast('正在打开实例配置面板...')">&#9881; 参数配置</button>
        </div>
      </div>`).join('')}
    </div>`;
}

// ============================================================
// ADD PROJECT AGENT MODAL
// ============================================================
function showAddProjectAgentModal() {
  const project = getProject(state.activeProjectId);
  if (!project) { toast('请先选择项目', true); return; }

  const availableAgents = [
    { name: '需求分析 Agent', avatar: '📋', stage: '需求分析', desc: '解析需求文档，执行完整性/语义/追溯性检查' },
    { name: '任务拆解 Agent', avatar: '✂️', stage: '需求拆解', desc: '将需求拆解为可执行子任务，分析依赖关系' },
    { name: '方案设计 Agent', avatar: '🏗️', stage: '方案设计', desc: '架构设计、接口定义、技术选型评估' },
    { name: '代码生成 Agent', avatar: '💻', stage: '代码生成', desc: '基于方案生成代码，执行编码规范检查' },
    { name: '代码审查 Agent', avatar: '🔍', stage: '代码审查', desc: '静态分析、安全扫描、复杂度检测' },
    { name: '测试生成 Agent', avatar: '🧪', stage: '单元测试', desc: '生成测试用例，执行覆盖率门禁' },
    { name: '质量分析 Agent', avatar: '📊', stage: '质量检查', desc: '技术债务检测、重复率分析、性能基线' },
    { name: '验收检查 Agent', avatar: '✅', stage: '验收确认', desc: 'DoD 检查清单、合规审计、性能验收' },
  ];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <h3>添加智能体到「${project.name}」</h3>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">选择预置智能体或创建自定义智能体</p>

      <!-- Tab 切换 -->
      <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--border);">
        <div class="agent-tab active" onclick="switchAgentTab('preset')" id="tabPreset" style="padding:10px 20px;cursor:pointer;font-size:14px;font-weight:600;border-bottom:2px solid var(--primary);margin-bottom:-2px;color:var(--primary);">预置智能体</div>
        <div class="agent-tab" onclick="switchAgentTab('custom')" id="tabCustom" style="padding:10px 20px;cursor:pointer;font-size:14px;font-weight:600;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text-muted);">自定义智能体</div>
      </div>

      <!-- 预置智能体面板 -->
      <div id="presetAgentsPanel" style="max-height:400px;overflow-y:auto;">
        ${availableAgents.map((a, i) => `
          <div class="card" style="margin-bottom:8px;cursor:pointer;padding:12px;" id="agentOption${i}">
            <div style="display:flex;align-items:center;gap:12px;">
              <input type="checkbox" id="agentCheck${i}" style="width:16px;height:16px;">
              <div style="font-size:24px;">${a.avatar}</div>
              <div style="flex:1;">
                <div style="font-weight:600;">${a.name}</div>
                <div style="font-size:12px;color:var(--text-muted);">负责阶段: ${a.stage}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${a.desc}</div>
              </div>
            </div>
          </div>`).join('')}
      </div>

      <!-- 自定义智能体面板 -->
      <div id="customAgentPanel" style="display:none;max-height:400px;overflow-y:auto;">
        <div style="background:var(--bg);border-radius:var(--radius);padding:20px;">
          <div style="font-size:14px;font-weight:600;margin-bottom:16px;">创建专属智能体</div>
          <div class="form-group">
            <label style="font-size:13px;font-weight:500;">智能体名称 *</label>
            <input type="text" id="customAgentName" placeholder="例: 安全审计 Agent" style="margin-top:6px;">
          </div>
          <div class="form-group">
            <label style="font-size:13px;font-weight:500;">图标</label>
            <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;" id="avatarPicker">
              ${['🤖','🛡️','⚡','🔧','📡','🎯','💡','🔬','🎨','📝'].map(icon => `
                <div class="avatar-option" onclick="selectAvatar(this, '${icon}')" style="width:36px;height:36px;border:2px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;">${icon}</div>
              `).join('')}
            </div>
            <input type="hidden" id="customAgentAvatar" value="🤖">
          </div>
          <div class="form-group">
            <label style="font-size:13px;font-weight:500;">负责阶段 *</label>
            <select id="customAgentStage" style="margin-top:6px;">
              <option value="">选择阶段</option>
              <option value="需求分析">需求分析</option>
              <option value="需求拆解">需求拆解</option>
              <option value="方案设计">方案设计</option>
              <option value="代码生成">代码生成</option>
              <option value="代码审查">代码审查</option>
              <option value="单元测试">单元测试</option>
              <option value="质量检查">质量检查</option>
              <option value="验收确认">验收确认</option>
              <option value="自定义">自定义阶段</option>
            </select>
          </div>
          <div class="form-group" id="customStageGroup" style="display:none;">
            <label style="font-size:13px;font-weight:500;">自定义阶段名称</label>
            <input type="text" id="customStageName" placeholder="例: 安全审计" style="margin-top:6px;">
          </div>
          <div class="form-group">
            <label style="font-size:13px;font-weight:500;">功能描述 *</label>
            <textarea id="customAgentDesc" rows="3" placeholder="描述该智能体的职责和能力..." style="margin-top:6px;"></textarea>
          </div>
          <div class="form-group">
            <label style="font-size:13px;font-weight:500;">技能标签</label>
            <input type="text" id="customAgentTags" placeholder="用逗号分隔，例: 安全扫描, 漏洞检测" style="margin-top:6px;">
          </div>
        </div>
      </div>

      <div class="form-actions" style="margin-top:16px;">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" id="btnConfirmAddAgents">确认添加</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // 监听自定义阶段选择
  document.getElementById('customAgentStage').addEventListener('change', function() {
    document.getElementById('customStageGroup').style.display = this.value === '自定义' ? 'block' : 'none';
  });

  // Toggle checkbox when clicking preset agent card
  document.querySelectorAll('#presetAgentsPanel .card').forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const checkbox = document.getElementById(`agentCheck${i}`);
      checkbox.checked = !checkbox.checked;
      card.style.borderColor = checkbox.checked ? 'var(--primary)' : 'var(--border)';
      card.style.background = checkbox.checked ? '#F0F4FF' : '';
    });
  });

  document.getElementById('btnConfirmAddAgents').addEventListener('click', () => {
    const activeTab = document.querySelector('.agent-tab.active');

    if (activeTab.id === 'tabPreset') {
      // 处理预置智能体选择
      const selected = [];
      availableAgents.forEach((a, i) => {
        if (document.getElementById(`agentCheck${i}`).checked) {
          selected.push(a);
        }
      });

      if (selected.length === 0) {
        toast('请至少选择一个智能体', true);
        return;
      }

      toast(`已为「${project.name}」添加 ${selected.length} 个智能体`);
    } else {
      // 处理自定义智能体创建
      const name = document.getElementById('customAgentName').value.trim();
      const avatar = document.getElementById('customAgentAvatar').value;
      const stage = document.getElementById('customAgentStage').value;
      const customStage = document.getElementById('customStageName').value.trim();
      const desc = document.getElementById('customAgentDesc').value.trim();
      const tags = document.getElementById('customAgentTags').value.trim();

      if (!name) { toast('请输入智能体名称', true); return; }
      if (!stage) { toast('请选择负责阶段', true); return; }
      if (stage === '自定义' && !customStage) { toast('请输入自定义阶段名称', true); return; }
      if (!desc) { toast('请输入功能描述', true); return; }

      const agentData = {
        name,
        avatar,
        stage: stage === '自定义' ? customStage : stage,
        desc,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        isCustom: true
      };

      toast(`已创建自定义智能体「${name}」并添加到项目`);
    }

    overlay.remove();

    // Refresh the project agents page
    if (state.activePage === 'project-agents') {
      renderProjectAgents(document.getElementById('mainContent'));
    }
  });
}

function switchAgentTab(tab) {
  const tabPreset = document.getElementById('tabPreset');
  const tabCustom = document.getElementById('tabCustom');
  const presetPanel = document.getElementById('presetAgentsPanel');
  const customPanel = document.getElementById('customAgentPanel');

  if (tab === 'preset') {
    tabPreset.style.borderBottomColor = 'var(--primary)';
    tabPreset.style.color = 'var(--primary)';
    tabCustom.style.borderBottomColor = 'transparent';
    tabCustom.style.color = 'var(--text-muted)';
    presetPanel.style.display = 'block';
    customPanel.style.display = 'none';
  } else {
    tabPreset.style.borderBottomColor = 'transparent';
    tabPreset.style.color = 'var(--text-muted)';
    tabCustom.style.borderBottomColor = 'var(--primary)';
    tabCustom.style.color = 'var(--primary)';
    presetPanel.style.display = 'none';
    customPanel.style.display = 'block';
  }
}

function selectAvatar(el, icon) {
  document.querySelectorAll('.avatar-option').forEach(opt => {
    opt.style.borderColor = 'var(--border)';
    opt.style.background = '';
  });
  el.style.borderColor = 'var(--primary)';
  el.style.background = '#F0F4FF';
  document.getElementById('customAgentAvatar').value = icon;
}

// ============================================================
// PROJECT SKILLS PAGE
// ============================================================
function renderProjectSkills(container) {
  const skills = [
    { name:'需求分析技能', ver:'v2.3', agent:'需求分析 Agent', status:'enabled', desc:'智能分析需求文档，执行完整性检查、语义一致性分析。', tags:['需求分析阶段','NLU'] },
    { name:'代码生成技能', ver:'v3.1', agent:'代码生成 Agent', status:'enabled', desc:'智能生成高质量代码。支持 Java / Python / TypeScript。', tags:['代码生成阶段','CodeGen'] },
    { name:'代码审查技能', ver:'v2.8', agent:'代码审查 Agent', status:'enabled', desc:'静态分析、安全扫描（OWASP）、复杂度检测。', tags:['代码审查阶段','安全'] },
    { name:'任务拆解技能', ver:'v2.0', agent:'任务拆解 Agent', status:'enabled', desc:'将大粒度需求智能拆解为可执行子任务，生成看板 Backlog。', tags:['需求拆解阶段'] }
  ];
  
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">项目技能库</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">已从全局市场下载，并分配给本项目的技能</div></div>
      <button class="btn btn-primary btn-sm" onclick="navigate('skills')">+ 去市场获取技能</button>
    </div>
    <div class="grid-3" style="margin-top:16px;">${skills.map(s => `
      <div class="card card-hover">
        <div class="card-header">
          <div><div class="card-title">&#9671; ${s.name}</div><div class="card-subtitle">${s.ver}</div></div>
          <span class="tag tag-blue" style="background:#E0E7FF;color:#3730A3;">已绑定: ${s.agent}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-top:8px;">${s.desc}</div>
        <div style="margin-top:10px;display:flex;gap:4px;flex-wrap:wrap;">${s.tags.map(t=>`<span class="tag tag-slate">${t}</span>`).join('')}</div>
        <div style="margin-top:12px;display:flex;gap:8px;border-top:1px solid var(--border);padding-top:10px;">
          <button class="btn btn-outline btn-sm" style="flex:1;" onclick="toast('打开技能参数配置...')">&#9881; 实例参数</button>
          <button class="btn btn-outline btn-sm" style="flex:1;border-color:var(--danger);color:var(--danger);" onclick="toast('技能已解绑', true)">解除绑定</button>
        </div>
      </div>`).join('')}

    </div>`;
}

// ============================================================
// PROJECT GUIDELINES PAGE
// ============================================================
function renderProjectGuidelines(container) {
  const p = getProject(state.activeProjectId);
  if (!p) return;
  const g = p.guidelines || { stack: '', coding: '', domain: '', quality: '' };

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:22px;font-weight:700;">项目规范</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">配置本项目的技术约束与业务背景，自动注入 Agent 执行上下文</div>
      </div>
      <button class="btn btn-primary" onclick="saveProjectGuidelines()">保存配置</button>
    </div>
    
    <div style="margin-top:20px; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
      <div class="card">
        <div style="font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <span style="color:var(--primary);">🏗️</span> 架构与技术栈约束
        </div>
        <textarea id="guidelineStack" class="form-control" style="width:100%;height:120px;padding:10px;border-radius:6px;border:1px solid var(--border);font-family:inherit;font-size:14px;" placeholder="描述本项目采用的技术栈，如：JDK 17, Spring Boot 3.2, Vue 3, Redis 等">${g.stack}</textarea>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">提示：Agent 会根据技术栈约束生成符合版本的代码和配置文件。</div>
      </div>

      <div class="card">
        <div style="font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <span style="color:var(--primary);">📜</span> 编码与格式规范
        </div>
        <textarea id="guidelineCoding" class="form-control" style="width:100%;height:120px;padding:10px;border-radius:6px;border:1px solid var(--border);font-family:inherit;font-size:14px;" placeholder="输入本项目的编码风格、命名习惯、接口规范等">${g.coding}</textarea>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">提示：Agent 在代码生成和审查阶段会严格遵循这些规范。</div>
      </div>

      <div class="card">
        <div style="font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <span style="color:var(--primary);">💡</span> 业务领域知识与名词解释
        </div>
        <textarea id="guidelineDomain" class="form-control" style="width:100%;height:120px;padding:10px;border-radius:6px;border:1px solid var(--border);font-family:inherit;font-size:14px;" placeholder="定义本项目中的核心业务实体和术语，帮助 Agent 理解上下文">${g.domain}</textarea>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">提示：有助于 Agent 在需求分析和方案设计时保持业务语义一致。</div>
      </div>

      <div class="card">
        <div style="font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <span style="color:var(--primary);">✅</span> 测试与质量要求
        </div>
        <textarea id="guidelineQuality" class="form-control" style="width:100%;height:120px;padding:10px;border-radius:6px;border:1px solid var(--border);font-family:inherit;font-size:14px;" placeholder="配置单测覆盖率、静态检查、性能指标等质量门禁要求">${g.quality}</textarea>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">提示：这些要求将作为 Agent 自动执行门禁检查的判定依据。</div>
      </div>
    </div>

    <div class="card" style="margin-top:20px;background:#F0F7FF;border-color:#BFDBFE;">
      <div style="display:flex;gap:12px;">
        <div style="font-size:24px;">🤖</div>
        <div>
          <div style="font-weight:600;color:#1E40AF;">Agent 自动注入说明</div>
          <div style="font-size:13px;color:#374151;margin-top:4px;line-height:1.6;">
            上述规范将在本项目下的任何 Agent 执行任务前，自动通过 <b>System Prompt</b> 注入其上下文。
            Agent 会在理解这些规范的基础上，执行需求拆解、代码生成、代码审查等操作，确保其产出物与项目既定标准高度一致。
          </div>
        </div>
      </div>
    </div>
  `;
}

function saveProjectGuidelines() {
  const p = getProject(state.activeProjectId);
  if (!p) return;
  
  p.guidelines = {
    stack: document.getElementById('guidelineStack').value,
    coding: document.getElementById('guidelineCoding').value,
    domain: document.getElementById('guidelineDomain').value,
    quality: document.getElementById('guidelineQuality').value
  };
  
  toast('项目规范已保存，已同步至 Agent 执行引擎');
}
