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
