// ============================================================
function renderAgents(container) {
  const agents = state.agents;
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:13px;color:var(--text-muted);">平台内置研发智能体一览</div></div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span class="tag tag-blue">${agents.length} 个智能体</span>
        <button class="btn btn-primary btn-sm" onclick="showAgentModal()">+ 新增智能体</button>
      </div>
    </div>
    <div class="grid-3">${agents.map(a => `
      <div class="card card-hover">
        <div class="card-header">
          <div><div class="card-title">${a.avatar} ${a.name}</div>
          <div class="card-subtitle">阶段: ${a.stage}</div></div>
          <span class="tag tag-green">运行中</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-top:8px;">${a.desc}</div>
        ${a.packageFile ? `<div style="margin-top:8px;display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg);border-radius:var(--radius-sm);font-size:11px;color:var(--primary);"><span>&#128230;</span> ${a.packageFile.name} <span style="color:var(--text-muted);">(${(a.packageFile.size/1024).toFixed(1)} KB)</span></div>` : ''}
        <div style="margin-top:12px;display:flex;gap:6px;border-top:1px solid var(--border);padding-top:8px;">
          <button class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 8px;" onclick="event.stopPropagation();showAgentModal('${a.id}')">&#9998; 编辑</button>
          <button class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 8px;border-color:var(--danger);color:var(--danger);" onclick="event.stopPropagation();deleteAgent('${a.id}')">&#10005; 删除</button>
        </div>
      </div>`).join('')}</div>`;
}

function showAgentModal(agentId) {
  const agent = agentId ? state.agents.find(a => a.id === agentId) : null;
  const isEdit = !!agent;
  const avatarOptions = ['📋','✂️','🏗️','💻','🔍','🧪','📊','✅','🤖','🛡️','⚡','🔧','📡','🎯','💡','🔬','🎨','📝','🚀','🔔'];
  const stages = ['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认','测试','部署发布','持续监控','自定义'];
  const existingFile = agent && agent.packageFile ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">当前: ${agent.packageFile.name} (${(agent.packageFile.size/1024).toFixed(1)} KB)</div>` : '';
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="width:540px;">
      <h3>${isEdit ? '编辑智能体' : '新增智能体'}</h3>
      <div class="form-group"><label>名称</label><input type="text" id="agName" value="${agent?agent.name:''}" placeholder="输入智能体名称"></div>
      <div class="form-group"><label>负责阶段</label>
        <select id="agStage">${stages.map(s => `<option value="${s}" ${agent&&agent.stage===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label>头像图标</label>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;" id="avatarPicker">
          ${avatarOptions.map(icon => `
            <div onclick="selectAgentAvatar(this, '${icon}')" style="width:34px;height:34px;border:2px solid ${agent&&agent.avatar===icon?'var(--primary)':'var(--border)'};border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;background:${agent&&agent.avatar===icon?'#F0F4FF':''};">${icon}</div>
          `).join('')}
        </div>
        <input type="hidden" id="agAvatar" value="${agent?agent.avatar:'🤖'}">
      </div>
      <div class="form-group"><label>描述</label><textarea id="agDesc" rows="3" placeholder="描述该智能体的职责和能力">${agent?agent.desc:''}</textarea></div>
      <div class="form-group"><label>上传压缩包</label>
        <div style="border:2px dashed var(--border);border-radius:var(--radius);padding:16px;text-align:center;cursor:pointer;" onclick="document.getElementById('agPackageFile').click()">
          <div style="font-size:28px;">&#128230;</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">点击选择 .zip / .tar.gz / .rar 文件</div>
          <div id="agPackageName" style="font-size:12px;color:var(--primary);margin-top:4px;font-weight:600;"></div>
          ${existingFile}
        </div>
        <input type="file" id="agPackageFile" accept=".zip,.tar.gz,.rar,.7z,.gz" style="display:none;" onchange="handleAgentPackageSelect(this)">
        <input type="hidden" id="agPackageData">
        <input type="hidden" id="agPackageFileName">
        <input type="hidden" id="agPackageFileSize">
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" id="btnSaveAgent">${isEdit ? '保存修改' : '添加智能体'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // Avatar picker
  document.querySelectorAll('#avatarPicker div').forEach(el => {
    el.addEventListener('click', () => selectAgentAvatar(el, el.textContent));
  });

  // Pre-fill package data for edit mode
  if (agent && agent.packageFile) {
    document.getElementById('agPackageData').value = agent.packageFile.data || '';
    document.getElementById('agPackageFileName').value = agent.packageFile.name || '';
    document.getElementById('agPackageFileSize').value = agent.packageFile.size || '';
  }

  document.getElementById('btnSaveAgent').addEventListener('click', () => {
    const name = document.getElementById('agName').value.trim();
    const stage = document.getElementById('agStage').value;
    const avatar = document.getElementById('agAvatar').value;
    const desc = document.getElementById('agDesc').value.trim();
    if (!name) { toast('请输入智能体名称', true); return; }

    const packageData = document.getElementById('agPackageData').value;
    const packageFileName = document.getElementById('agPackageFileName').value;
    const packageFileSize = parseInt(document.getElementById('agPackageFileSize').value) || 0;

    const agentData = {
      id: isEdit ? agent.id : ('ag' + (agentIdCounter++)),
      name, avatar, stage, desc
    };

    if (packageData && packageFileName) {
      agentData.packageFile = {
        name: packageFileName,
        size: packageFileSize,
        data: packageData
      };
    } else if (isEdit && agent.packageFile) {
      agentData.packageFile = agent.packageFile;
    }

    if (isEdit) {
      Object.assign(agent, agentData);
      toast(`智能体 "${name}" 已更新`);
    } else {
      state.agents.push(agentData);
      toast(`智能体 "${name}" 已添加`);
    }
    saveAgents();
    overlay.remove();
    renderAgents(document.getElementById('mainContent'));
  });
}

function selectAgentAvatar(el, icon) {
  document.querySelectorAll('#avatarPicker div').forEach(opt => {
    opt.style.borderColor = 'var(--border)';
    opt.style.background = '';
  });
  el.style.borderColor = 'var(--primary)';
  el.style.background = '#F0F4FF';
  document.getElementById('agAvatar').value = icon;
}

function handleAgentPackageSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function() {
    document.getElementById('agPackageData').value = reader.result;
    document.getElementById('agPackageFileName').value = file.name;
    document.getElementById('agPackageFileSize').value = file.size;
    document.getElementById('agPackageName').textContent = file.name + ' (' + (file.size/1024).toFixed(1) + ' KB)';
  };
  reader.readAsDataURL(file);
}

function handleSkillPackageSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function() {
    document.getElementById('skPackageData').value = reader.result;
    document.getElementById('skPackageFileName').value = file.name;
    document.getElementById('skPackageFileSize').value = file.size;
    document.getElementById('skPackageName').textContent = file.name + ' (' + (file.size/1024).toFixed(1) + ' KB)';
  };
  reader.readAsDataURL(file);
}

function deleteAgent(agentId) {
  const agent = state.agents.find(a => a.id === agentId);
  if (!agent) return;
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="width:400px;">
      <h3>确认删除</h3>
      <p style="color:var(--text-secondary);margin-bottom:20px;">确定要删除智能体「<strong>${agent.name}</strong>」吗？此操作不可恢复。</p>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-danger" id="btnConfirmDelete">确认删除</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('btnConfirmDelete').addEventListener('click', () => {
    state.agents = state.agents.filter(a => a.id !== agentId);
    saveAgents();
    toast(`智能体 "${agent.name}" 已删除`);
    overlay.remove();
    renderAgents(document.getElementById('mainContent'));
  });
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
  const skills = state.skills;
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:13px;color:var(--text-muted);">内置 Agent 技能库（Multica 风格）— 管理员维护，全局复用</div></div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span class="tag tag-blue">${skills.filter(s=>s.status==='enabled').length} 个技能可用</span>
        <button class="btn btn-primary btn-sm" onclick="showSkillModal()">+ 新增技能</button>
      </div>
    </div>
    <div class="grid-3">${skills.map(s => `
      <div class="card card-hover">
        <div class="card-header"><div><div class="card-title">&#9671; ${s.name}</div><div class="card-subtitle">${s.ver} · 调用 ${s.calls.toLocaleString()} 次</div></div><span class="tag ${s.status==='enabled'?'tag-green':'tag-slate'}">${s.status==='enabled'?'启用':'禁用'}</span></div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">${s.desc}</div>
        <div style="margin-top:10px;display:flex;gap:4px;flex-wrap:wrap;">${s.tags.map(t=>`<span class="tag tag-slate">${t}</span>`).join('')}</div>
        ${s.packageFile ? `<div style="margin-top:8px;display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg);border-radius:var(--radius-sm);font-size:11px;color:var(--primary);"><span>&#128230;</span> ${s.packageFile.name} <span style="color:var(--text-muted);">(${(s.packageFile.size/1024).toFixed(1)} KB)</span></div>` : ''}
        <div style="margin-top:12px;display:flex;gap:6px;border-top:1px solid var(--border);padding-top:8px;">
          <button class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 8px;" onclick="event.stopPropagation();showSkillModal('${s.id}')">&#9998; 编辑</button>
          <button class="btn btn-outline btn-sm" style="font-size:11px;padding:3px 8px;border-color:var(--danger);color:var(--danger);" onclick="event.stopPropagation();deleteSkill('${s.id}')">&#10005; 删除</button>
        </div>
      </div>`).join('')}</div>`;
}

function showSkillModal(skillId) {
  const skill = skillId ? state.skills.find(s => s.id === skillId) : null;
  const isEdit = !!skill;
  const existingFile = skill && skill.packageFile ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);margin-top:4px;">当前: ${skill.packageFile.name} (${(skill.packageFile.size/1024).toFixed(1)} KB)</div>` : '';
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="width:520px;">
      <h3>${isEdit ? '编辑技能' : '新增技能'}</h3>
      <div class="form-group"><label>技能名称</label><input type="text" id="skName" value="${skill?skill.name:''}" placeholder="输入技能名称"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group"><label>版本号</label><input type="text" id="skVer" value="${skill?skill.ver:'v1.0'}" placeholder="v1.0"></div>
        <div class="form-group"><label>状态</label>
          <select id="skStatus">
            <option value="enabled" ${skill&&skill.status==='enabled'?'selected':''}>启用</option>
            <option value="disabled" ${skill&&skill.status==='disabled'?'selected':''}>禁用</option>
          </select></div>
      </div>
      <div class="form-group"><label>描述</label><textarea id="skDesc" rows="3" placeholder="描述该技能的功能和用途">${skill?skill.desc:''}</textarea></div>
      <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="skTags" value="${skill?skill.tags.join(', '):''}" placeholder="如：需求分析阶段, NLU"></div>
      <div class="form-group"><label>上传压缩包</label>
        <div style="border:2px dashed var(--border);border-radius:var(--radius);padding:16px;text-align:center;cursor:pointer;" onclick="document.getElementById('skPackageFile').click()">
          <div style="font-size:28px;">&#128230;</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">点击选择 .zip / .tar.gz / .rar 文件</div>
          <div id="skPackageName" style="font-size:12px;color:var(--primary);margin-top:4px;font-weight:600;"></div>
          ${existingFile}
        </div>
        <input type="file" id="skPackageFile" accept=".zip,.tar.gz,.rar,.7z,.gz" style="display:none;" onchange="handleSkillPackageSelect(this)">
        <input type="hidden" id="skPackageData">
        <input type="hidden" id="skPackageFileName">
        <input type="hidden" id="skPackageFileSize">
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" id="btnSaveSkill">${isEdit ? '保存修改' : '添加技能'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  if (skill && skill.packageFile) {
    document.getElementById('skPackageData').value = skill.packageFile.data || '';
    document.getElementById('skPackageFileName').value = skill.packageFile.name || '';
    document.getElementById('skPackageFileSize').value = skill.packageFile.size || '';
  }

  document.getElementById('btnSaveSkill').addEventListener('click', () => {
    const name = document.getElementById('skName').value.trim();
    const ver = document.getElementById('skVer').value.trim();
    const status = document.getElementById('skStatus').value;
    const desc = document.getElementById('skDesc').value.trim();
    const tagsStr = document.getElementById('skTags').value.trim();
    if (!name) { toast('请输入技能名称', true); return; }
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    const packageData = document.getElementById('skPackageData').value;
    const packageFileName = document.getElementById('skPackageFileName').value;
    const packageFileSize = parseInt(document.getElementById('skPackageFileSize').value) || 0;

    if (isEdit) {
      skill.name = name;
      skill.ver = ver || 'v1.0';
      skill.status = status;
      skill.desc = desc;
      skill.tags = tags;
      if (packageData && packageFileName) {
        skill.packageFile = { name: packageFileName, size: packageFileSize, data: packageData };
      }
      toast(`技能 "${name}" 已更新`);
      saveSkills();
    } else {
      const newSkill = {
        id: 'sk' + (skillIdCounter++),
        name, ver: ver || 'v1.0', calls: 0, status, desc, tags
      };
      if (packageData && packageFileName) {
        newSkill.packageFile = { name: packageFileName, size: packageFileSize, data: packageData };
      }
      state.skills.push(newSkill);
      toast(`技能 "${name}" 已添加`);
      saveSkills();
    }
    overlay.remove();
    renderSkills(document.getElementById('mainContent'));
  });
}

function deleteSkill(skillId) {
  const skill = state.skills.find(s => s.id === skillId);
  if (!skill) return;
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="width:400px;">
      <h3>确认删除</h3>
      <p style="color:var(--text-secondary);margin-bottom:20px;">确定要删除技能「<strong>${skill.name}</strong>」吗？此操作不可恢复。</p>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-danger" id="btnConfirmDelete">确认删除</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('btnConfirmDelete').addEventListener('click', () => {
    state.skills = state.skills.filter(s => s.id !== skillId);
    saveSkills();
    toast(`技能 "${skill.name}" 已删除`);
    overlay.remove();
    renderSkills(document.getElementById('mainContent'));
  });
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

  // Ensure guidelines object exists and has fallback values
  if (!p.guidelines) p.guidelines = {};
  const g = p.guidelines;

  const dependency = g.dependency || '';
  const collaboration = g.collaboration || '';
  const stack = g.stack || '';
  const coding = g.coding || '';
  const domain = g.domain || g.businessRules || '';
  const quality = g.quality || g.bestPractices || '';

  // Inject localized premium CSS styles
  container.innerHTML = `
    <style>
      .pg-wrapper {
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: fadeIn 0.4s ease;
      }
      /* Premium Header */
      .pg-header-card {
        background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
        color: #fff;
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }
      .pg-header-card::before {
        content: '';
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
        top: -100px;
        right: -100px;
        pointer-events: none;
      }
      .pg-header-info h2 {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
        margin-bottom: 6px;
      }
      .pg-header-info p {
        font-size: 13px;
        opacity: 0.9;
      }
      .pg-header-stats {
        display: flex;
        gap: 20px;
      }
      .pg-stat-box {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: var(--radius);
        padding: 10px 16px;
        text-align: center;
        backdrop-filter: blur(8px);
        min-width: 90px;
      }
      .pg-stat-val {
        font-size: 18px;
        font-weight: 700;
        color: #38BDF8;
      }
      .pg-stat-lbl {
        font-size: 10px;
        opacity: 0.8;
        margin-top: 2px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .pg-pulse-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16,185,129,0.2);
        color: #34D399;
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 20px;
        border: 1px solid rgba(52,211,153,0.3);
      }
      .pg-pulse-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #34D399;
        box-shadow: 0 0 8px #34D399;
        animation: pgPulse 2s infinite;
      }
      @keyframes pgPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(1.3); }
      }

      /* Sections Title */
      .pg-sec-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 10px 0 2px;
      }
      .pg-sec-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text);
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .pg-sec-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, var(--border), transparent);
      }

      /* Card Grid */
      .pg-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
      @media(max-width: 900px) {
        .pg-grid { grid-template-columns: 1fr; }
      }

      /* Premium Card */
      .pg-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        overflow: visible;
      }
      .pg-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
      .pg-card.universal {
        border-top: 3px solid #7C3AED;
      }
      .pg-card.specific {
        border-top: 3px solid #2563EB;
      }
      
      .pg-card-header {
        padding: 16px 20px 12px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .pg-card-title-area {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .pg-card-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pg-card-subtitle {
        font-size: 11px;
        color: var(--text-muted);
      }
      .pg-card-tabs {
        display: flex;
        background: #F1F5F9;
        padding: 2px;
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-weight: 600;
      }
      .pg-card-tab {
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: var(--transition);
      }
      .pg-card-tab.active {
        background: #fff;
        color: var(--primary);
        box-shadow: var(--shadow-sm);
      }

      /* Card Badges */
      .pg-scope-badges {
        padding: 8px 20px;
        background: #F8FAFC;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .pg-scope-lbl {
        font-size: 10px;
        color: var(--text-muted);
        font-weight: 600;
      }
      .pg-agent-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
        background: #EFF6FF;
        color: #2563EB;
        border: 1px solid #DBEAFE;
      }
      .pg-agent-badge.global {
        background: #F3E8FF;
        color: #7C3AED;
        border: 1px solid #E9D5FF;
      }

      /* Card Content & Textarea */
      .pg-card-body {
        padding: 16px 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        min-height: 180px;
      }
      .pg-textarea {
        width: 100%;
        height: 120px;
        padding: 10px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        font-family: var(--font);
        font-size: 13px;
        line-height: 1.5;
        outline: none;
        resize: none;
        transition: border-color 0.2s;
        color: var(--text);
      }
      .pg-textarea:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
      }
      
      .pg-card-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
      }
      
      /* Preset Select Options */
      .pg-preset-select {
        padding: 4px 8px;
        font-size: 11px;
        border-radius: 4px;
        border: 1px solid var(--border);
        background: #fff;
        outline: none;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
      }
      .pg-preset-select:hover {
        background: #F8FAFC;
        border-color: var(--primary);
      }

      /* Preview Layout Rules */
      .pg-preview-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
        overflow-y: auto;
        max-height: 140px;
        padding-right: 4px;
      }
      .pg-preview-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 10px;
        border-radius: var(--radius-sm);
        background: #F8FAFC;
        border-left: 3px solid var(--primary);
        line-height: 1.4;
      }
      .pg-card.universal .pg-preview-item {
        border-left-color: #7C3AED;
      }
      .pg-preview-bullet {
        color: var(--primary);
        font-weight: 700;
        margin-top: 1px;
      }
      .pg-card.universal .pg-preview-bullet {
        color: #7C3AED;
      }
      .pg-preview-text {
        color: var(--text-secondary);
      }
      .pg-preview-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: var(--text-muted);
        font-size: 12px;
        margin: auto;
        gap: 6px;
      }

      /* Loading Animation Overlay */
      .pg-card-loading {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 10px;
        z-index: 5;
        font-size: 12px;
        font-weight: 600;
        color: var(--primary);
      }
      .pg-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(37,99,235,0.15);
        border-radius: 50%;
        border-top-color: var(--primary);
        animation: pgSpin 0.8s linear infinite;
      }
      @keyframes pgSpin {
        to { transform: rotate(360deg); }
      }

      /* Inline Help Tooltips */
      .pg-help-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        cursor: pointer;
        margin-left: 6px;
        position: relative;
        transition: background 0.2s, color 0.2s;
        user-select: none;
        vertical-align: middle;
        flex-shrink: 0;
      }
      .pg-card.universal .pg-help-trigger {
        background: rgba(124,58,237,0.15);
        color: #7C3AED;
      }
      .pg-card.specific .pg-help-trigger {
        background: rgba(37,99,235,0.15);
        color: #2563EB;
      }
      .pg-help-trigger:hover {
        background: var(--primary) !important;
        color: #fff !important;
      }
      /* Tooltip rendered as fixed overlay to escape any overflow:hidden parent */
      .pg-tooltip-box {
        position: fixed;
        width: 260px;
        background: #1E293B;
        color: #F8FAFC;
        padding: 12px;
        border-radius: var(--radius-sm);
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        font-size: 11px;
        line-height: 1.5;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
        z-index: 9999;
        font-weight: normal;
        white-space: normal;
        text-align: left;
        border: 1px solid #475569;
      }
      .pg-tooltip-box.visible {
        opacity: 1;
        visibility: visible;
      }
      .pg-tooltip-box::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #1E293B;
      }
      .pg-tooltip-title {
        font-weight: 700;
        color: #38BDF8;
        margin-bottom: 4px;
        font-size: 11px;
      }
      .pg-tooltip-item {
        margin-top: 4px;
        color: #94A3B8;
      }
      .pg-tooltip-item strong {
        color: #E2E8F0;
      }

      /* Preset Pill Badges */
      .pg-preset-pill {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 20px;
        background: #F1F5F9;
        color: var(--text-secondary);
        cursor: pointer;
        border: 1px solid var(--border);
        transition: all 0.2s;
        display: inline-block;
        user-select: none;
      }
      .pg-preset-pill:hover {
        background: #EFF6FF;
        color: var(--primary);
        border-color: var(--primary-light);
        transform: translateY(-1px);
      }

      /* Onboarding Tour styles */
      .pg-tour-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15,23,42,0.7);
        backdrop-filter: blur(4px);
        z-index: 1000;
        transition: opacity 0.3s;
      }
      .pg-tour-box {
        position: absolute;
        width: 320px;
        background: #fff;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 20px;
        z-index: 1001;
        border: 2px solid var(--primary);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: pgScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        color: var(--text);
      }
      @keyframes pgScaleUp {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .pg-tour-box-header {
        font-weight: 700;
        font-size: 14px;
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .pg-tour-box-body {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.6;
      }
      .pg-tour-box-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;
      }
      .pg-tour-highlight {
        position: relative;
        z-index: 999 !important;
        box-shadow: 0 0 20px var(--primary) !important;
        outline: 3px solid var(--primary) !important;
        background: var(--surface) !important;
      }

      /* Visual Agent Grid styles */
      .pg-agent-visual-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 10px;
        margin-top: 10px;
      }
      .pg-agent-grid-box {
        background: #334155;
        border: 1px solid #475569;
        border-radius: var(--radius-sm);
        padding: 10px 4px;
        text-align: center;
        color: #94A3B8;
        font-size: 10px;
        font-weight: 600;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        user-select: none;
      }
      .pg-agent-grid-box:hover {
        border-color: #38BDF8;
        color: #fff;
        transform: translateY(-1px);
      }
      .pg-agent-grid-box.active {
        background: rgba(56,189,248,0.12);
        border-color: #38BDF8;
        color: #38BDF8;
        box-shadow: 0 0 10px rgba(56,189,248,0.25);
      }
      .pg-agent-grid-box.linked {
        background: rgba(16,185,129,0.15);
        border-color: #34D399;
        color: #34D399;
        box-shadow: 0 0 14px rgba(52,211,153,0.35);
        transform: translateY(-2px);
      }
      .pg-agent-grid-box.faded {
        opacity: 0.25;
      }

      /* System Prompt Target Viewer Panel */
      .pg-viewer-card {
        background: #1E293B;
        color: #E2E8F0;
        border-radius: var(--radius-lg);
        padding: 22px;
        box-shadow: var(--shadow-md);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .pg-viewer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 12px;
      }
      .pg-viewer-title {
        font-size: 15px;
        font-weight: 700;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pg-viewer-select-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pg-viewer-select {
        background: #334155;
        color: #fff;
        border: 1px solid #475569;
        border-radius: var(--radius-sm);
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        outline: none;
        cursor: pointer;
      }
      .pg-viewer-select:focus {
        border-color: #38BDF8;
      }
      
      .pg-viewer-body {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 20px;
      }
      @media(max-width: 800px) {
        .pg-viewer-body { grid-template-columns: 1fr; }
      }
      
      .pg-viewer-map-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pg-viewer-map-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        background: #334155;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid transparent;
        transition: var(--transition);
      }
      .pg-viewer-map-item.injected {
        background: rgba(56,189,248,0.08);
        border-color: rgba(56,189,248,0.3);
        color: #38BDF8;
      }
      .pg-viewer-map-item.ignored {
        opacity: 0.35;
        background: rgba(255,255,255,0.02);
      }
      .pg-viewer-map-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: #475569;
        color: #94A3B8;
      }
      .pg-viewer-map-item.injected .pg-viewer-map-badge {
        background: #38BDF8;
        color: #0F172A;
      }
      
      .pg-viewer-prompt-box {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pg-prompt-display {
        background: #0F172A;
        border-radius: var(--radius);
        padding: 14px 18px;
        font-family: var(--mono);
        font-size: 11px;
        line-height: 1.6;
        height: 160px;
        overflow-y: auto;
        color: #34D399;
        border: 1px solid #1E293B;
      }

      /* Interactive Sandbox Simulator */
      .pg-sandbox-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 22px;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .pg-sandbox-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media(max-width: 850px) {
        .pg-sandbox-grid { grid-template-columns: 1fr; }
      }
      .pg-sandbox-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .pg-sandbox-terminal {
        background: #0F172A;
        color: #E2E8F0;
        border-radius: var(--radius);
        border: 1px solid #1E293B;
        padding: 16px;
        font-family: var(--mono);
        font-size: 11px;
        height: 240px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
      }
      .pg-term-cursor {
        display: inline-block;
        width: 6px;
        height: 12px;
        background: #38BDF8;
        margin-left: 2px;
        animation: pgBlink 1s step-end infinite;
        vertical-align: middle;
      }
      @keyframes pgBlink {
        from, to { background: transparent; }
        50% { background: #38BDF8; }
      }
      
      .pg-sandbox-check-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 6px;
        border-radius: 4px;
        background: rgba(255,255,255,0.05);
        font-size: 11px;
      }
      .pg-sandbox-check-row.pass {
        border-left: 3px solid #34D399;
      }
      .pg-sandbox-check-status {
        font-weight: 700;
        color: #34D399;
      }
    </style>

    <div class="pg-wrapper">
      
      <!-- Top Premium Header Banner -->
      <div class="pg-header-card" id="pgHeaderCard">
        <div class="pg-header-info">
          <h2>项目规范配置与校验中心</h2>
          <p style="margin-top:6px;opacity:0.85;font-size:13px;">定义并校验本项目的 AI 智能体执行规范，规范将自动注入到对应智能体的 System Prompt 中</p>
        </div>
        
        <div class="pg-header-stats">
          <div class="pg-stat-box">
            <div class="pg-stat-val" id="pgStatCount">6 个</div>
            <div class="pg-stat-lbl">规范块</div>
          </div>
          <div class="pg-stat-box">
            <div class="pg-stat-val">8 个</div>
            <div class="pg-stat-lbl">关联智能体</div>
          </div>
          <div style="display:flex;align-self:center;gap:8px;">
            <button class="btn btn-outline" id="pgTourBtn" onclick="startOnboardingTour()" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);height:42px;padding:0 18px;font-size:14px;font-weight:600;cursor:pointer;border-radius:var(--radius);transition:all 0.2s;">💡 易用指南</button>
            <button class="btn btn-primary" onclick="saveProjectGuidelines()" style="background:#fff;color:#1E40AF;height:42px;padding:0 20px;font-size:14px;box-shadow:0 4px 10px rgba(0,0,0,0.15);border:none;">保存配置</button>
          </div>
        </div>
      </div>

      <!-- Part 1: Universal Guidelines Section -->
      <div class="pg-sec-divider" id="universalSectionHeader">
        <div class="pg-sec-title">🌍 通用规范 (General Guidelines) <span style="font-size:11px;color:var(--text-muted);font-weight:500;margin-left:4px;">— 自动向全部智能体注入</span></div>
        <div class="pg-sec-line"></div>
      </div>

      <div class="pg-grid">
        <!-- 1. Universal Dependency -->
        <div class="pg-card universal" id="card_dependency" onmouseenter="highlightAgentLinkage('dependency')" onmouseleave="clearAgentLinkage()">
          <div class="pg-card-header">
            <div class="pg-card-title-area">
              <div class="pg-card-title">
                <span>📦</span> 依赖管理与制品安全规范
                <span class="pg-help-trigger">❓
                  <span class="pg-tooltip-box">
                    <span class="pg-tooltip-title">📦 依赖管理与制品安全规范</span>
                    规定项目可以或禁止引入的第三方组件及制品要求，防止外部依赖漏洞安全隐患。
                    <div class="pg-tooltip-item"><strong>对 AI 影响：</strong>代码生成 Agent 避开黑名单依赖；代码审查 Agent 自动扫描检测。</div>
                    <div class="pg-tooltip-item"><strong>编写建议：</strong>指定包管理工具，限制黑名单库（如 Fastjson），统一公司内网镜像源。</div>
                  </span>
                </span>
              </div>
              <div class="pg-card-subtitle">控制第三方库引入规范及镜像发布安全，确保系统级稳定性</div>
            </div>
            <div class="pg-card-tabs">
              <span class="pg-card-tab" onclick="switchCardTab('dependency', 'edit')">编辑</span>
              <span class="pg-card-tab active" onclick="switchCardTab('dependency', 'preview')">预览</span>
            </div>
          </div>
          
          <div class="pg-scope-badges">
            <span class="pg-scope-lbl">作用范围:</span>
            <span class="pg-agent-badge global">全部 8 个 AI 智能体</span>
          </div>
          
          <div class="pg-card-body" id="body_dependency">
            <textarea id="guidelineDependency" class="pg-textarea" placeholder="输入本项目的依赖管理与镜像准入要求...">${dependency}</textarea>
            <div class="pg-card-actions">
              <div class="pg-preset-pills-wrap" id="dependency_presets" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:10px;color:var(--text-muted);font-weight:600;">模板预设:</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('dependency', 'java')" title="点击套用 Java Maven & Jackson 依赖管理规范">☕ Spring Boot</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('dependency', 'go')" title="点击套用 Go Modules 依赖与原生标准库规范">🐹 Go Gin</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('dependency', 'nodejs')" title="点击套用 Node.js npm 依赖与安全审计规范">🟢 NestJS</span>
              </div>
              <button class="btn btn-outline btn-sm" id="dependency_copilot_btn" onclick="triggerAICopilot('dependency')" style="color:var(--primary);border-color:var(--primary-light);margin-left:auto;"><span style="font-size:12px;">⚡</span> AI 优化生成</button>
            </div>
          </div>
        </div>

        <!-- 2. Universal Collaboration -->
        <div class="pg-card universal" id="card_collaboration" onmouseenter="highlightAgentLinkage('collaboration')" onmouseleave="clearAgentLinkage()">
          <div class="pg-card-header">
            <div class="pg-card-title-area">
              <div class="pg-card-title">
                <span>🔄</span> 代码协同与分支提交规范
                <span class="pg-help-trigger">❓
                  <span class="pg-tooltip-box">
                    <span class="pg-tooltip-title">🔄 代码协同与分支提交规范</span>
                    约定团队协同工作的 Git 分支管理策略和 Commit 信息格式规范。
                    <div class="pg-tooltip-item"><strong>对 AI 影响：</strong>所有 Agent 输出 Git 建议或执行 Commit 动作时严格遵以此格式。</div>
                    <div class="pg-tooltip-item"><strong>编写建议：</strong>约定分支命名（如 feature/）和 Commit 格式（如 feat(scope): desc）。</div>
                  </span>
                </span>
              </div>
              <div class="pg-card-subtitle">规定 Git 分支管理策略和 Commit 信息约定，提升协同效能</div>
            </div>
            <div class="pg-card-tabs">
              <span class="pg-card-tab" onclick="switchCardTab('collaboration', 'edit')">编辑</span>
              <span class="pg-card-tab active" onclick="switchCardTab('collaboration', 'preview')">预览</span>
            </div>
          </div>
          
          <div class="pg-scope-badges">
            <span class="pg-scope-lbl">作用范围:</span>
            <span class="pg-agent-badge global">全部 8 个 AI 智能体</span>
          </div>
          
          <div class="pg-card-body" id="body_collaboration">
            <textarea id="guidelineCollaboration" class="pg-textarea" placeholder="输入 Git 分支命名约定与 Commit 规则...">${collaboration}</textarea>
            <div class="pg-card-actions">
              <div class="pg-preset-pills-wrap" id="collaboration_presets" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:10px;color:var(--text-muted);font-weight:600;">模板预设:</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('collaboration', 'angular')" title="点击套用经典 Angular Commit 格式规范">📐 Angular Git</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('collaboration', 'standard')" title="点击套用传统 Git Flow 分支和提交规范">🔄 Git Flow</span>
              </div>
              <button class="btn btn-outline btn-sm" id="collaboration_copilot_btn" onclick="triggerAICopilot('collaboration')" style="color:var(--primary);border-color:var(--primary-light);margin-left:auto;"><span style="font-size:12px;">⚡</span> AI 优化生成</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Part 2: Specific Guidelines Section -->
      <div class="pg-sec-divider" style="margin-top:14px;">
        <div class="pg-sec-title">🎯 专用规范 (Domain-Specific Guidelines) <span style="font-size:11px;color:var(--text-muted);font-weight:500;margin-left:4px;">— 仅注入到符合执行职责的智能体</span></div>
        <div class="pg-sec-line"></div>
      </div>

      <div class="pg-grid">
        <!-- 3. Stack Card -->
        <div class="pg-card specific" id="card_stack" onmouseenter="highlightAgentLinkage('stack')" onmouseleave="clearAgentLinkage()">
          <div class="pg-card-header">
            <div class="pg-card-title-area">
              <div class="pg-card-title">
                <span>🏗️</span> 架构与技术栈约束
                <span class="pg-help-trigger">❓
                  <span class="pg-tooltip-box">
                    <span class="pg-tooltip-title">🏗️ 架构与技术栈约束</span>
                    锁定本项目采用的特定技术栈选型与核心组件版本，确保微服务群的技术统一性。
                    <div class="pg-tooltip-item"><strong>对 AI 影响：</strong>方案设计与代码生成 Agent 绝对遵照此技术栈，不编写超纲的旧框架代码。</div>
                    <div class="pg-tooltip-item"><strong>编写建议：</strong>明确核心语言、框架、组件、数据库及中间件的具体版本。</div>
                  </span>
                </span>
              </div>
              <div class="pg-card-subtitle">控制技术选型、组件库与底层框架版本号，防范技术漂移</div>
            </div>
            <div class="pg-card-tabs">
              <span class="pg-card-tab" onclick="switchCardTab('stack', 'edit')">编辑</span>
              <span class="pg-card-tab active" onclick="switchCardTab('stack', 'preview')">预览</span>
            </div>
          </div>
          
          <div class="pg-scope-badges">
            <span class="pg-scope-lbl">注入智能体:</span>
            <span class="pg-agent-badge">🏗️ 方案设计</span>
            <span class="pg-agent-badge">💻 代码生成</span>
            <span class="pg-agent-badge">🔍 代码审查</span>
          </div>
          
          <div class="pg-card-body" id="body_stack">
            <textarea id="guidelineStack" class="pg-textarea" placeholder="描述本项目采用的技术栈和框架约束...">${stack}</textarea>
            <div class="pg-card-actions">
              <div class="pg-preset-pills-wrap" id="stack_presets" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:10px;color:var(--text-muted);font-weight:600;">模板预设:</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('stack', 'java')" title="点击套用 Spring Boot 3 + MyBatis-Plus + Redis + MySQL 技术选型">☕ Spring Boot</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('stack', 'go')" title="点击套用 Go 1.20 + Gin + gRPC + PostgreSQL 架构预设">🐹 Go Gin</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('stack', 'nodejs')" title="点击套用 NestJS 10 + TS + TypeORM + Docker 架构预设">🟢 NestJS</span>
              </div>
              <button class="btn btn-outline btn-sm" id="stack_copilot_btn" onclick="triggerAICopilot('stack')" style="color:var(--primary);border-color:var(--primary-light);margin-left:auto;"><span style="font-size:12px;">⚡</span> AI 优化生成</button>
            </div>
          </div>
        </div>

        <!-- 4. Coding Card -->
        <div class="pg-card specific" id="card_coding" onmouseenter="highlightAgentLinkage('coding')" onmouseleave="clearAgentLinkage()">
          <div class="pg-card-header">
            <div class="pg-card-title-area">
              <div class="pg-card-title">
                <span>📜</span> 编码与格式规范
                <span class="pg-help-trigger">❓
                  <span class="pg-tooltip-box">
                    <span class="pg-tooltip-title">📜 编码与格式规范</span>
                    管理编写代码时的命名准则、代码风格、注释红线以及 API 的统一输出结构。
                    <div class="pg-tooltip-item"><strong>对 AI 影响：</strong>代码生成 Agent 规范书写代码，代码审查 Agent 作为审查最高纲领执行。</div>
                    <div class="pg-tooltip-item"><strong>编写建议：</strong>指定公认代码开发手册、类/方法命名准则，以及接口返回值要求。</div>
                  </span>
                </span>
              </div>
              <div class="pg-card-subtitle">管理命名准则、返回值约定和注释规范，由代码智能体严格履行</div>
            </div>
            <div class="pg-card-tabs">
              <span class="pg-card-tab" onclick="switchCardTab('coding', 'edit')">编辑</span>
              <span class="pg-card-tab active" onclick="switchCardTab('coding', 'preview')">预览</span>
            </div>
          </div>
          
          <div class="pg-scope-badges">
            <span class="pg-scope-lbl">注入智能体:</span>
            <span class="pg-agent-badge">💻 代码生成</span>
            <span class="pg-agent-badge">🔍 代码审查</span>
          </div>
          
          <div class="pg-card-body" id="body_coding">
            <textarea id="guidelineCoding" class="pg-textarea" placeholder="指定具体的命名、类、方法及API输出要求...">${coding}</textarea>
            <div class="pg-card-actions">
              <div class="pg-preset-pills-wrap" id="coding_presets" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:10px;color:var(--text-muted);font-weight:600;">模板预设:</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('coding', 'java')" title="点击套用阿里 Java 开发手册简析和 API 标准">☕ 阿里开发规范</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('coding', 'go')" title="点击套用 Uber Go Style 编码与并发规范">🐹 Uber Go 规范</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('coding', 'vue')" title="点击套用 Vue 官方风格指南命名和数据流规范">🟢 Vue 风格指南</span>
              </div>
              <button class="btn btn-outline btn-sm" id="coding_copilot_btn" onclick="triggerAICopilot('coding')" style="color:var(--primary);border-color:var(--primary-light);margin-left:auto;"><span style="font-size:12px;">⚡</span> AI 优化生成</button>
            </div>
          </div>
        </div>

        <!-- 5. Domain Card -->
        <div class="pg-card specific" id="card_domain" onmouseenter="highlightAgentLinkage('domain')" onmouseleave="clearAgentLinkage()">
          <div class="pg-card-header">
            <div class="pg-card-title-area">
              <div class="pg-card-title">
                <span>💡</span> 业务领域与核心规则
                <span class="pg-help-trigger">❓
                  <span class="pg-tooltip-box">
                    <span class="pg-tooltip-title">💡 业务领域与核心规则</span>
                    注入本项目专属的商业逻辑术语、核心约束及最重要的数据底线。
                    <div class="pg-tooltip-item"><strong>对 AI 影响：</strong>需求分析和拆解 Agent 理解业务以发现伪需求，方案设计 Agent 正确采用数据类型。</div>
                    <div class="pg-tooltip-item"><strong>编写建议：</strong>配置业务专有名词含义或商业流程规则限制（如逻辑删除、大数使用 BigDecimal）。</div>
                  </span>
                </span>
              </div>
              <div class="pg-card-subtitle">配置核心术语、领域逻辑与删除/数据隔离设计，注入前序智能体</div>
            </div>
            <div class="pg-card-tabs">
              <span class="pg-card-tab" onclick="switchCardTab('domain', 'edit')">编辑</span>
              <span class="pg-card-tab active" onclick="switchCardTab('domain', 'preview')">预览</span>
            </div>
          </div>
          
          <div class="pg-scope-badges">
            <span class="pg-scope-lbl">注入智能体:</span>
            <span class="pg-agent-badge">📋 需求分析</span>
            <span class="pg-agent-badge">✂️ 需求拆解</span>
            <span class="pg-agent-badge">🏗️ 方案设计</span>
          </div>
          
          <div class="pg-card-body" id="body_domain">
            <textarea id="guidelineDomain" class="pg-textarea" placeholder="定义业务专属的名词与系统级核心商业规则...">${domain}</textarea>
            <div class="pg-card-actions">
              <div class="pg-preset-pills-wrap" id="domain_presets" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:10px;color:var(--text-muted);font-weight:600;">模板预设:</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('domain', 'oa')" title="点击套用 OA 审批流金额 BigDecimal、逻辑删除与状态机规范">💼 OA 审批流</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('domain', 'gateway')" title="点击套用微服务网关精准路由、熔断限制与敏感 Token 拦截规范">🌐 微服务网关</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('domain', 'finance')" title="点击套用金融货币四位精度、资金TraceID审计及幂等锁规范">💰 金融级账务</span>
              </div>
              <button class="btn btn-outline btn-sm" id="domain_copilot_btn" onclick="triggerAICopilot('domain')" style="color:var(--primary);border-color:var(--primary-light);margin-left:auto;"><span style="font-size:12px;">⚡</span> AI 优化生成</button>
            </div>
          </div>
        </div>

        <!-- 6. Quality Card -->
        <div class="pg-card specific" id="card_quality" onmouseenter="highlightAgentLinkage('quality')" onmouseleave="clearAgentLinkage()">
          <div class="pg-card-header">
            <div class="pg-card-title-area">
              <div class="pg-card-title">
                <span>✅</span> 测试与质量要求
                <span class="pg-help-trigger">❓
                  <span class="pg-tooltip-box">
                    <span class="pg-tooltip-title">✅ 测试与质量要求</span>
                    规定行/分支覆盖率下限、方法圈复杂度上限及单测通过门禁标准。
                    <div class="pg-tooltip-item"><strong>对 AI 影响：</strong>单测 Agent 对齐门禁编写高质量单测，质量检查 Agent 将超标流水线打印警告或阻断。</div>
                    <div class="pg-tooltip-item"><strong>编写建议：</strong>输入覆盖率基线（如行覆盖率 >80%）及圈复杂度嵌套级限制。</div>
                  </span>
                </span>
              </div>
              <div class="pg-card-subtitle">确立行/分支覆盖率下限、圈复杂度卡阈值及单测隔离标准</div>
            </div>
            <div class="pg-card-tabs">
              <span class="pg-card-tab" onclick="switchCardTab('quality', 'edit')">编辑</span>
              <span class="pg-card-tab active" onclick="switchCardTab('quality', 'preview')">预览</span>
            </div>
          </div>
          
          <div class="pg-scope-badges">
            <span class="pg-scope-lbl">注入智能体:</span>
            <span class="pg-agent-badge">🧪 单元测试</span>
            <span class="pg-agent-badge">📊 质量检查</span>
            <span class="pg-agent-badge">✅ 验收确认</span>
          </div>
          
          <div class="pg-card-body" id="body_quality">
            <textarea id="guidelineQuality" class="pg-textarea" placeholder="输入单测覆盖率基线、异常吞噬限制及圈复杂度要求...">${quality}</textarea>
            <div class="pg-card-actions">
              <div class="pg-preset-pills-wrap" id="quality_presets" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:10px;color:var(--text-muted);font-weight:600;">模板预设:</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('quality', 'high')" title="点击载入严苛质量指标（覆盖率>80%，圈复杂度<=15，通过率100%）">🛡️ 严苛门禁</span>
                <span class="pg-preset-pill" onclick="applyCardPreset('quality', 'medium')" title="点击载入敏捷低门槛指标（覆盖率>60%，圈复杂度<=25，不阻断流水线）">⚡ 敏捷门禁</span>
              </div>
              <button class="btn btn-outline btn-sm" id="quality_copilot_btn" onclick="triggerAICopilot('quality')" style="color:var(--primary);border-color:var(--primary-light);margin-left:auto;"><span style="font-size:12px;">⚡</span> AI 优化生成</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Part 3: Agent Prompt Observability Panel -->
      <div class="pg-viewer-card" id="pgViewerCard">
        <div class="pg-viewer-header">
          <div class="pg-viewer-title">🤖 智能体 System Prompt 注入可观测面板</div>
          <div class="pg-viewer-select-wrap">
            <span style="font-size:12px;color:#94A3B8;">选择观察的智能体:</span>
            <select class="pg-viewer-select" id="pgAgentSelector" onchange="updatePromptViewer()">
              <option value="req">📋 需求分析 Agent</option>
              <option value="split">✂️ 需求拆解 Agent</option>
              <option value="design">🏗️ 方案设计 Agent</option>
              <option value="codegen" selected>💻 代码生成 Agent</option>
              <option value="review">🔍 代码审查 Agent</option>
              <option value="test">🧪 单元测试 Agent</option>
              <option value="quality">📊 质量检查 Agent</option>
              <option value="accept">✅ 验收确认 Agent</option>
            </select>
          </div>
        </div>
        
        <!-- Premium Agent Visual Grid added here -->
        <div class="pg-agent-visual-grid" id="pgAgentVisualGrid">
          <div class="pg-agent-grid-box" data-agent="req" onclick="selectAgentFromGrid('req')">
            <span style="font-size: 16px;">📋</span>
            <span>需求分析</span>
          </div>
          <div class="pg-agent-grid-box" data-agent="split" onclick="selectAgentFromGrid('split')">
            <span style="font-size: 16px;">✂️</span>
            <span>需求拆解</span>
          </div>
          <div class="pg-agent-grid-box" data-agent="design" onclick="selectAgentFromGrid('design')">
            <span style="font-size: 16px;">🏗️</span>
            <span>方案设计</span>
          </div>
          <div class="pg-agent-grid-box" data-agent="codegen" onclick="selectAgentFromGrid('codegen')">
            <span style="font-size: 16px;">💻</span>
            <span>代码生成</span>
          </div>
          <div class="pg-agent-grid-box" data-agent="review" onclick="selectAgentFromGrid('review')">
            <span style="font-size: 16px;">🔍</span>
            <span>代码审查</span>
          </div>
          <div class="pg-agent-grid-box" data-agent="test" onclick="selectAgentFromGrid('test')">
            <span style="font-size: 16px;">🧪</span>
            <span>单元测试</span>
          </div>
          <div class="pg-agent-grid-box" data-agent="quality" onclick="selectAgentFromGrid('quality')">
            <span style="font-size: 16px;">📊</span>
            <span>质量检查</span>
          </div>
          <div class="pg-agent-grid-box" data-agent="accept" onclick="selectAgentFromGrid('accept')">
            <span style="font-size: 16px;">✅</span>
            <span>验收确认</span>
          </div>
        </div>
        
        <div class="pg-viewer-body">
          <div class="pg-viewer-map-list" id="pgViewerMapList">
            <!-- Dynamically populated map list -->
          </div>
          
          <div class="pg-viewer-prompt-box">
            <div style="font-size:12px;font-weight:600;color:#94A3B8;">最终靶向注入的 Agent System Prompt 预览:</div>
            <div class="pg-prompt-display" id="pgPromptDisplay">
              <!-- Dynamically populated prompt block -->
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Initialize interactive dynamic prompt viewer
  updatePromptViewer();

  // Initialize all cards in preview mode by default
  ['dependency', 'collaboration', 'stack', 'coding', 'domain', 'quality'].forEach(key => {
    switchCardTab(key, 'preview');
  });

  // Setup fixed-position tooltip positioning for ❓ triggers
  document.querySelectorAll('.pg-help-trigger').forEach(trigger => {
    const tooltip = trigger.querySelector('.pg-tooltip-box');
    if (!tooltip) return;
    // Move tooltip to body to avoid overflow clipping
    document.body.appendChild(tooltip);
    trigger.addEventListener('mouseenter', () => {
      const rect = trigger.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2 - 130) + 'px';
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      tooltip.classList.add('visible');
      // Recalculate after visibility (offsetHeight only available when visible)
      requestAnimationFrame(() => {
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      });
    });
    trigger.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
}

// ============================================================
// CORE DYNAMIC INTERACTS (TABS, AI GENERATE, TEMPLATES)
// ============================================================

// Toggle Edit vs Preview tabs inside individual guideline cards
function switchCardTab(cardKey, tabMode) {
  const card = document.getElementById(`card_${cardKey}`);
  if (!card) return;

  const tabs = card.querySelectorAll('.pg-card-tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  const textVal = document.getElementById(`guideline${cardKey.charAt(0).toUpperCase() + cardKey.slice(1)}`).value;
  const bodyEl = document.getElementById(`body_${cardKey}`);

  if (tabMode === 'edit') {
    tabs[0].classList.add('active');
    bodyEl.querySelector('.pg-textarea').style.display = 'block';
    
    const actions = bodyEl.querySelector('.pg-card-actions');
    if (actions) actions.style.display = 'flex';
    
    const previewEl = bodyEl.querySelector('.pg-preview-wrap');
    if (previewEl) previewEl.remove();
  } else {
    tabs[1].classList.add('active');
    bodyEl.querySelector('.pg-textarea').style.display = 'none';
    
    const actions = bodyEl.querySelector('.pg-card-actions');
    if (actions) actions.style.display = 'none';

    // Parse textarea bullet points into gorgeous rendered UI list
    const lines = textVal.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let previewHtml = '';

    if (lines.length > 0) {
      previewHtml = `
        <div class="pg-preview-wrap">
          ${lines.map(line => {
            // Strip leading bullet marks e.g. "1. ", "- "
            const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '');
            return `
              <div class="pg-preview-item">
                <span class="pg-preview-bullet">✔</span>
                <span class="pg-preview-text">${cleanLine}</span>
              </div>`;
          }).join('')}
        </div>`;
    } else {
      previewHtml = `
        <div class="pg-preview-wrap" style="justify-content:center;height:120px;">
          <div class="pg-preview-empty">
            <span style="font-size:24px;opacity:0.5;">📋</span>
            <span>该项规范目前为空，编辑保存后即可在此渲染</span>
          </div>
        </div>`;
    }
    
    // Clean old preview elements if any
    const oldPreview = bodyEl.querySelector('.pg-preview-wrap');
    if (oldPreview) oldPreview.remove();
    
    bodyEl.insertAdjacentHTML('afterbegin', previewHtml);
  }
}

// Preset library maps
const PRESETS = {
  dependency: {
    java: "1. 依赖管理：统一使用 Maven 进行依赖引入，严禁直接导入本地 JAR 包。\n2. 选型黑名单：严禁使用 Fastjson（存在安全高危漏洞），统一使用 Jackson 作为 JSON 解析器。\n3. 版本管理：线上依赖包必须固定 RELEASE 版本号，禁止使用 LATEST 或带有 SNAPSHOT 的不确定版本。",
    go: "1. 包管理：统一使用 Go Modules 进行依赖管理，Go.sum 必须随代码库提交。\n2. 依赖原则：严禁引入未经安全评估的第三方组件，优先使用官方原生标准库。\n3. 安全检查：发布前必须执行 go list -m all 并通过公司审计库校验。",
    nodejs: "1. 包管理：统一使用 npm/yarn 进行依赖导入，lockfile 必须保证提交。\n2. 安全扫描：引入外部 NPM 包前必须执行 npm audit 进行高危安全漏洞扫描并修复。\n3. 包源地址：统一强制拉取公司内网 Verdaccio 私有包源镜像地址。"
  },
  collaboration: {
    angular: "1. 分支命名：新功能分支为 feature/{issue-id}-{name}，缺陷修复分支为 hotfix/{issue-id}-{name}。\n2. 提交规范：Commit 格式统一为 <type>(<scope>): <subject>，类型可选 feat/fix/docs/style/refactor/test。\n3. 合并评审：禁止直接 Push 到主分支，必须经过 PR 且由 CI 流水线构建通过后合入。",
    standard: "1. 协作策略：采用经典 Git Flow，开发工作合并入 develop，生产发布合并至 main 分支。\n2. 提交约定：每次 Commit 必须附带简明清晰的功能说明，多行提交必须在首行进行概括。\n3. 代码同步：拉取代码统一使用 git pull --rebase，保持提交历史呈单链状线性演进。"
  },
  stack: {
    java: "Java 17, Spring Boot 3.0, MyBatis-Plus, Redis, MySQL 8.0, RabbitMQ",
    go: "Go 1.20, Gin Router, gRPC Protobuf, Etcd V3, Prometheus, PostgreSQL",
    nodejs: "Node.js 18, NestJS 10.0, TypeScript 5.0, TypeORM, Keycloak IAM"
  },
  coding: {
    java: "1. 命名规范：严格遵循《阿里巴巴Java开发手册》，包名小写，接口名以 I 开头，类以驼峰命名。\n2. 接口规范：统一使用 RESTful 风格定义 API，返回数据统一包装为 {code, data, msg} 状态体。\n3. 资源管理：所有文件流、数据库连接必须在 try-with-resources 或 finally 中执行严格释放。",
    go: "1. 命名习惯：严格遵循 Uber Go Style Guide 风格，结构体和公共方法以大写开头导出。\n2. 并发安全：所有 Goroutine 必须合理处理 defer recover，防止 panic 崩溃导致服务重启。\n3. 接口封装：方法参数中，context.Context 必须置于第一参数位置，统一命名为 ctx。",
    vue: "1. 组件命名：单文件组件文件名统一使用双单词驼峰（如 UserCard.vue），避开 HTML 原生标签。\n2. 数据流向：组件状态遵循 Props Down, Events Up 原则，单向流动，禁止子组件直接修改 Prop 数据。\n3. 性能规范：v-for 循环指令必须绑定唯一的 :key，严禁将 v-if 与 v-for 挂载在同一个 DOM 节点。"
  },
  domain: {
    oa: "1. 金额计算：金额运算统一使用 BigDecimal 结构，严禁直接使用 float/double，防范浮点数精度丢失。\n2. 逻辑删除：数据库记录删除统一采用逻辑删除（更新 is_deleted = 1），严禁物理性 DELETE 操作。\n3. 状态转化：审批流状态转换必须严格按照流程图状态机流转，禁止跳过审批级直接将草稿置为通过。",
    gateway: "1. 路由流转：网关匹配规则优先按精确 Path 进行路由匹配，最后采用通配符进行全局兜底分配。\n2. 熔断策略：当后端单个服务节点响应延迟 >2000ms 占比超过 30%，必须触发 10 秒自动断路熔断。\n3. 敏感透传：严禁将前端鉴权 Header 原封不动透传至下游不受信微服务，必须通过内网 Token 转换。",
    finance: "1. 精度把控：所有货币数据在存储和计算时统一保留到小数点后 4 位，财务报表输出前做四舍五入截断。\n2. 审计留痕：任何涉及用户财务资金的流转，必须强制留存全局流水 TraceID 并记录不可篡改的审计日志。\n3. 代理提交：核心支付交易接口必须强制进行分布式幂等校验，幂等锁有效期设为最大 30 秒。"
  },
  quality: {
    high: "1. 单测门禁：行覆盖率（Line Coverage）必须达到 80% 以上，分支覆盖率达到 70% 以上。\n2. 静态指标：SonarQube 静态扫描中不得包含 Blocker / Critical 等级漏洞，圈复杂度单个函数上限 15。\n3. 门禁策略：在单元测试和集成测试阶段，测试用例通过率必须达到 100%，否则阻断推进流程。",
    medium: "1. 单测标准：核心业务处理模块行覆盖率达到 60% 以上即可，其余通用工具类无需强制要求单测。\n2. 复杂限制：避免出现圈复杂度超过 25 的深度嵌套逻辑，超出必须强制进行提取重构处理。\n3. 警告门禁：质量门禁不通过在控制台打印 Warning，不强制阻断流水线提交，方便敏捷开发排产。"
  }
};

// Load standard presets in 1-click
function applyCardPreset(cardKey, presetType) {
  const pData = PRESETS[cardKey][presetType];
  if (pData) {
    const textEl = document.getElementById(`guideline${cardKey.charAt(0).toUpperCase() + cardKey.slice(1)}`);
    textEl.value = pData;
    toast(`已载入「${presetType}」的标准规范预设`);
    
    // If active tab is preview, update preview instantly
    const card = document.getElementById(`card_${cardKey}`);
    const activeTab = card.querySelector('.pg-card-tab.active');
    if (activeTab && activeTab.textContent === '预览') {
      switchCardTab(cardKey, 'preview');
    }
  }
}

// Simulates premium AI rule generation copilot
function triggerAICopilot(cardKey) {
  const cardBody = document.getElementById(`body_${cardKey}`);
  const textarea = document.getElementById(`guideline${cardKey.charAt(0).toUpperCase() + cardKey.slice(1)}`);
  
  // Inject Loading indicator spinner overlay
  const loadingHtml = `
    <div class="pg-card-loading" id="loading_${cardKey}">
      <div class="pg-spinner"></div>
      <div style="font-size:11px;">小智 Copilot 正在分析项目背景以重构规范...</div>
    </div>`;
  cardBody.insertAdjacentHTML('beforeend', loadingHtml);

  const project = getProject(state.activeProjectId);
  const pName = project?.name || '当前项目';
  const pDesc = project?.desc || '开发工程';
  
  setTimeout(() => {
    // Dynamic generated customized response according to project stack
    let aiContent = "";
    if (cardKey === 'dependency') {
      aiContent = `1. 依赖审计：在引入任何组件包前，必须经过公司制品中心进行安全漏洞审计核验。\n2. 版本锁定：所有引入组件必须指定确切稳定版本号，禁止随意使用 + 或 x 动态模糊占位符。\n3. 私有化镜像：严禁从外部未知公网 Registry 直接下载镜像，构建必须统一走本地安全代理源。`;
    } else if (cardKey === 'collaboration') {
      aiContent = `1. 提交流水：每次 Commit 必须关联 Jira/看板任务 ID（例如：feat(#t102): 实现员工入职流程）。\n2. 回滚原则：当生产发布版本出现回滚时，必须创建对应的 revert 分支并在提交信息里详细写明回滚根因。\n3. 人工门禁：任何代码合入 master 之前必须通过 SonarQube 门禁审查及同行至少一人的审核赞同。`;
    } else if (cardKey === 'stack') {
      if (project?.id === 'p1') {
        aiContent = "Java 17, Spring Boot 3.0.x Enterprise Core, Vue 3.x, MySQL 8.0, Redis 6.2, MyBatis-Plus Framework";
      } else if (project?.id === 'p2') {
        aiContent = "Go 1.20, Gin Fast Router v1.9, Etcd V3 Service Registry, Prometheus Custom Metric Scraper";
      } else {
        aiContent = "TypeScript 5.0, NestJS v10.0, Docker Containers, PostgreSQL 15, Keycloak Identity";
      }
    } else if (cardKey === 'coding') {
      aiContent = `1. 接口约束：API 请求体全部采用驼峰 json 命名，核心数据实体严禁物理表直接外露，必须包装 DTO 传输。\n2. 注释红线：所有 API 接口、DTO 核心字段及公共 Utility 函数必须强制描述核心用法与入参意图。\n3. 结构返回：接口执行异常必须使用全局 Handler 拦截，包装为标准非 200 业务错误格式抛给前端。`;
    } else if (cardKey === 'domain') {
      aiContent = `1. 流程留痕：在「${pName}」业务流中，审批、撤回及驳回操作必须在流转日志中留存时间戳与发起操作者工号。\n2. 实体校验：处理核心商业逻辑时，关键业务主键（例如：员工号、审批流ID）在参数入口层必须实行严格白名单正则过滤。\n3. 高效缓存：核心频繁变更的字典数据必须采用 Redis 缓存配合二级本地缓存，防止直接冲击 MySQL 数据库。`;
    } else if (cardKey === 'quality') {
      aiContent = `1. 异常红线：严禁在 catch 块中不做任何日志处理直接空吞异常，最少需要输出 logger.error 堆栈。\n2. 性能考核：主流程核心写操作接口平均耗时控制在 300ms 以下，核心大流量读接口在并发下压至 150ms 内。\n3. 重复代码：SonarQube 代码重复率分析门禁阈值设为不超过 5%，超出必须提取通用组件。`;
    }
    
    // Complete simulated AI response
    textarea.value = aiContent;
    document.getElementById(`loading_${cardKey}`)?.remove();
    toast(`小智 Copilot 已为您一键扩展并优化「${pName}」的专用规范！`);

    // Update preview if preview mode is active
    const card = document.getElementById(`card_${cardKey}`);
    const activeTab = card.querySelector('.pg-card-tab.active');
    if (activeTab && activeTab.textContent === '预览') {
      switchCardTab(cardKey, 'preview');
    }
  }, 1000);
}

// ============================================================
// SYSTEM PROMPT OBSERVE VIEW (PRECISE CONTROLLABILITY)
// ============================================================

// Dynamic Agent specification targeted mapping
const AGENT_SPEC_MAPS = {
  req: {
    name: "📋 需求分析 Agent",
    specs: { dependency: true, collaboration: true, domain: true, stack: false, coding: false, quality: false }
  },
  split: {
    name: "✂️ 需求拆解 Agent",
    specs: { dependency: true, collaboration: true, domain: true, stack: false, coding: false, quality: false }
  },
  design: {
    name: "🏗️ 方案设计 Agent",
    specs: { dependency: true, collaboration: true, stack: true, domain: true, coding: false, quality: false }
  },
  codegen: {
    name: "💻 代码生成 Agent",
    specs: { dependency: true, collaboration: true, stack: true, coding: true, domain: false, quality: false }
  },
  review: {
    name: "🔍 代码审查 Agent",
    specs: { dependency: true, collaboration: true, stack: true, coding: true, domain: false, quality: false }
  },
  test: {
    name: "🧪 单元测试 Agent",
    specs: { dependency: true, collaboration: true, quality: true, stack: false, coding: false, domain: false }
  },
  quality: {
    name: "📊 质量检查 Agent",
    specs: { dependency: true, collaboration: true, quality: true, stack: false, coding: false, domain: false }
  },
  accept: {
    name: "✅ 验收确认 Agent",
    specs: { dependency: true, collaboration: true, quality: true, stack: false, coding: false, domain: false }
  }
};

const SPEC_LABELS = {
  dependency: "📦 依赖管理与制品安全",
  collaboration: "🔄 代码协同与提交规范",
  stack: "🏗️ 架构与技术栈约束",
  coding: "📜 编码与格式规范",
  domain: "💡 业务领域与核心规则",
  quality: "✅ 测试与质量要求"
};

// Generates real-time targeted prompt compiled string
function updatePromptViewer() {
  const selector = document.getElementById('pgAgentSelector');
  if (!selector) return;
  const agentKey = selector.value;
  const config = AGENT_SPEC_MAPS[agentKey];
  if (!config) return;

  // Synchronize Grid Box Active State
  const boxes = document.querySelectorAll('.pg-agent-grid-box');
  boxes.forEach(box => {
    if (box.getAttribute('data-agent') === agentKey) {
      box.classList.add('active');
    } else {
      box.classList.remove('active');
    }
  });

  // 1. Render Left Map list (glowing or faded)
  const mapListEl = document.getElementById('pgViewerMapList');
  if (mapListEl) {
    mapListEl.innerHTML = Object.keys(SPEC_LABELS).map(key => {
      const isInjected = config.specs[key];
      return `
        <div class="pg-viewer-map-item ${isInjected ? 'injected' : 'ignored'}">
          <span>${SPEC_LABELS[key]}</span>
          <span class="pg-viewer-map-badge">${isInjected ? '已靶向注入' : '未注入'}</span>
        </div>`;
    }).join('');
  }

  // 2. Generate Combined system prompt
  const p = getProject(state.activeProjectId);
  const pName = p ? p.name : '当前项目';
  const g = p?.guidelines || {};
  
  const dep = g.dependency || '（未配置）';
  const col = g.collaboration || '（未配置）';
  const stk = g.stack || '（未配置）';
  const cod = g.coding || '（未配置）';
  const dom = g.domain || g.businessRules || '（未配置）';
  const qua = g.quality || g.bestPractices || '（未配置）';

  let promptStr = `/* System Prompt Injection Context for [${config.name}] in Project: ${pName} */\n`;
  promptStr += `你是一个具备 Harness 框架深度赋能的【${config.name}】智能助手，你需要基于项目特设标准进行工作。当前注入规范约束如下：\n\n`;

  // Always inject universal ones
  promptStr += `### 1. 🌎 全局通用基础规范 (Universal Rules)\n`;
  promptStr += `【依赖包安全规范】:\n${dep}\n\n`;
  promptStr += `【团队协同提交规范】:\n${col}\n\n`;

  // Conditionally inject specific ones based on target mapping
  let secIdx = 2;
  if (config.specs.stack) {
    promptStr += `### ${secIdx++}. 🏗️ 架构与技术栈约束 (Architecture Stack Rules)\n${stk}\n\n`;
  }
  if (config.specs.coding) {
    promptStr += `### ${secIdx++}. 📜 代码编码与命名格式规范 (Coding Style Rules)\n${cod}\n\n`;
  }
  if (config.specs.domain) {
    promptStr += `### ${secIdx++}. 💡 核心业务领域规则与名词约束 (Domain Business Rules)\n${dom}\n\n`;
  }
  if (config.specs.quality) {
    promptStr += `### ${secIdx++}. ✅ 测试覆盖率与质量门禁要求 (Testing & Quality Gates)\n${qua}\n\n`;
  }

  promptStr += `请根据开发者发出的业务任务指令，在严格对齐和执行上述已注入规范的基础之上生成输出产物。`;

  const displayEl = document.getElementById('pgPromptDisplay');
  if (displayEl) {
    displayEl.textContent = promptStr;
  }
}

// ============================================================
// INTERACTIVE PLAYGROUND SANDBOX SIMULATOR (VERIFIABILITY)
// ============================================================

// Sandbox simulator mock outputs maps per project & agent
const MOCK_OUTPUTS = {
  p1: { // OA 办公系统
    codegen: `[Harness CodeGen Agent v2.1] 🟢 规范校验对齐通过！已为您生成 Java 业务代码：

package com.company.oa.service.impl;

import com.company.oa.model.Employee;
import com.company.oa.model.ApprovalFlow;
import com.company.oa.util.IndexHintHelper;
import com.fasterxml.jackson.databind.ObjectMapper; // 符合通用依赖：强制使用 Jackson 解析
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal; // 符合专用业务：严禁使用 float/double，统一使用 BigDecimal

/**
 * 核心流程审批与转账服务实现类
 * 符合专用规范：业务逻辑强制包含完整 Javadoc 注释描述
 */
public class ApprovalTransferServiceImpl implements IApprovalTransferService {

    private static final Logger log = LoggerFactory.getLogger(ApprovalTransferServiceImpl.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean processTransfer(String flowId, BigDecimal amount) {
        log.info("开始处理财务转账审批，流水号: {}", flowId);
        
        // 1. 金额范围校验
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.error("转账金额必须大于 0！当前金额: {}", amount);
            throw new BusinessException("AMOUNT_LIMIT_ERROR", "转账金额非正数");
        }
        
        // 2. 模拟逻辑删除业务数据更新 (符合专用领域：数据删除采用逻辑删除更新 is_deleted = 1)
        // db.update("UPDATE approval_flows SET is_deleted = 1 WHERE id = ?", flowId);
        
        log.info("财务金额转账审批流转成功，更新状态机：草稿 -> 审批中 -> 已通过");
        return true;
    }
}`,
    review: `[Harness CodeReview Agent v2.5] 🔍 增量代码规范门禁检测报告：

1. 🎯 通用包安全规范检查: PASSED
   - 依赖分析：检查未引入阿里 Fastjson 开源库依赖。
   - 依赖检查：全部使用 org.fasterxml.jackson 进行实体解析。

2. 🎯 架构合规度扫描: PASSED
   - 采用 Maven 引入，外部 JAR 未直导。
   - 使用 Spring Boot 3.0.x 基线依赖，符合系统架构版本约定。

3. 🎯 业务领域对齐门禁: PASSED
   - BigDecimal 金额计算使用校验：检查通过（1处 BigDecimal 逻辑对齐）。
   - is_deleted 逻辑删除更新校验：通过（检测到 UPDATE SET is_deleted = 1 动作，无物理删除）。

4. 🎯 圈复杂度静态检测: FAILED (质量门禁阻断 🔴)
   - 异常拦截测试：全部通过。
   - 方法名: com.company.oa.service.impl.ApprovalTransferServiceImpl.parseExcelAndProcess()
   - 问题：该方法由于包含 4 层嵌套 for 循环及 if 异常判定，圈复杂度达到 21，超出设定门禁阈值 15！
   - 修复策略建议：需将第 42-98 行解析单条 Excel 的嵌套块提取重构为独立的 parseSingleRowRecord() 辅助函数。`,
    req: `[Harness ReqAnalyst Agent v1.9] 📋 需求完整性与语义对齐分析报告：

1. 🎯 通用协同校验：
   - 当前分析任务已自动挂载至全局需求看板任务并分配追踪 TraceID：issue-t1

2. 🎯 业务领域实体词映射对齐结果：
   - 检测到业务名词「流程审批」，自动匹配系统底层状态机：【草稿 -> 审批中 -> 已通过/已驳回】。
   - 校验结果：该需求提到“转账被直接确认通过”，违反了状态机不可跳级规定！已在 AI 生成流中插入警告阻断点，并提示产品经理补充“财务两级审批中”过渡态需求。
   - 检查到敏感字段「金额存储」，提示自动注入后台「BigDecimal」强数据类型规范。`
  },
  p2: { // 网关 2.0 (Go)
    codegen: `[Harness CodeGen Agent v2.1] 🟢 规范校验对齐通过！已为您生成 Go 业务代码：

package controller

import (
	"context"
	"errors"
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus" // 符合专用：使用 Prometheus 采集指标
)

// 统一采用大写字母开头导出结构体 (符合专用：遵守 Uber Go Style Guide 规范)
type GatewayLimiter struct {
	LocalCache map[string]float64
	LimitLock  time.Duration
}

// 核心限流处理器 (符合专用：Context 必须放置在方法第一参数)
func (g *GatewayLimiter) LimitRoute(ctx context.Context, c *gin.Context, routePath string) error {
	// 1. 严格响应 context 退出信号，防范 Goroutine 泄露 (符合通用质量规范)
	select {
	case <-ctx.Done():
		log.Error("路由网关转发超时取消，trace_id: %s", c.GetString("trace_id"))
		return ctx.Err()
	default:
	}

	// 2. 限流匹配逻辑，如果本地缓存失效，必须回滚至 Etcd 分布式全局配置
	if routePath == "" {
		return errors.New("empty gateway path")
	}

	return nil
}`,
    review: `[Harness CodeReview Agent v2.5] 🔍 Go 项目静态门禁分析报告：

1. 🎯 依赖安全度检测: PASSED
   - 依赖分析：Go Modules (go.sum) 已完整提交，无本地引入依赖。

2. 🎯 Uber Go 代码格式对齐: PASSED
   - 方法入参 Context 校验：第一入参为 ctx context.Context（100% 对齐）。
   - 依赖注入：正确挂载 Uber-fx 启动钩子，无隐式反射依赖。

3. 🎯 Goroutine 协程防泄漏审计: PASSED
   - 协程控制分析：检测到 func Launch() 内部启动协程中已完整绑定了 <-ctx.Done() 超时逃逸退出分支，泄露风险为 0。

4. 🎯 全链路日志追踪审计: PASSED
   - 检测到所有 log.Error 错误日志中均已通过 log.With(zap.String("trace_id", ctx.Value("trace_id").(string))) 透传追踪，没有无源错误。`,
    req: `[Harness ReqAnalyst Agent v1.9] 📋 网关网管需求合规判定：

1. 🎯 精准路由匹配语义校验: PASSED
   - 校验逻辑：系统判定该限流需求路径 "/api/v1/auth/*" 采用先精确后模糊通配符匹配，符合网关总体架构逻辑规则。

2. 🎯 限流缓存 fallback 校验: PASSED
   - 需求提及：当 Etcd 集群网络分流抖动断开时，自动降级启用本地内存中有效期 10s 的静态降级缓存锁，符合规则设计安全防线。`
  }
};

// Main Sandbox execute controller
function runSandboxSimulation() {
  const agentKey = document.getElementById('pgSandboxAgent').value;
  const promptVal = document.getElementById('pgSandboxPrompt').value.trim();
  const project = getProject(state.activeProjectId);
  const pId = project ? project.id : 'p1';

  if (!promptVal) {
    toast('请输入开发者模拟任务指令！', true);
    return;
  }

  const term = document.getElementById('pgTerminal');
  const statusBadge = document.getElementById('sandboxStatus');
  
  // Set terminal running state
  statusBadge.className = 'tag tag-amber btn-xs';
  statusBadge.textContent = 'RUNNING';

  // Output scrolling lines simulation
  term.innerHTML = `
    <div style="color:#64748B;">[0.0s] 🚀 初始化 Harness 智能体校验沙箱...</div>
    <div style="color:#64748B;">[0.2s] 🔍 读取当前激活项目: <b>${project?.name || 'OA办公'}</b></div>
  `;
  term.scrollTop = term.scrollHeight;

  setTimeout(() => {
    term.innerHTML += `<div style="color:#38BDF8;">[0.4s] 🗺️ 解析注入策略：加载通用依赖与分支规范并对齐...</div>`;
    term.scrollTop = term.scrollHeight;
  }, 300);

  setTimeout(() => {
    term.innerHTML += `<div style="color:#38BDF8;">[0.7s] 🧩 装配 Prompt：已从 guidelines 读取靶向规范，完成 System Prompt 编译...</div>`;
    term.scrollTop = term.scrollHeight;
  }, 600);

  setTimeout(() => {
    term.innerHTML += `<div style="color:#7C3AED;">[1.0s] 🤖 AI 引擎启动：调度【${AGENT_SPEC_MAPS[agentKey]?.name || '智能体'}】读取当前规范并生成对齐上下文...</div>`;
    term.scrollTop = term.scrollHeight;
  }, 950);

  setTimeout(() => {
    // Fill in mock response matching active project ID and selected simulator Agent
    const prjKey = MOCK_OUTPUTS[pId] ? pId : 'p1';
    const agKey = MOCK_OUTPUTS[prjKey][agentKey] ? agentKey : 'codegen';
    const mockOutput = MOCK_OUTPUTS[prjKey][agKey];

    term.innerHTML += `
      <div style="color:#10B981;margin-top:8px;">[1.4s] 🟢 沙箱测试规范合规校验对准完毕！输出结果如下：</div>
      <pre style="background:#0F172A;color:#E2E8F0;padding:12px;border-radius:6px;font-size:11px;font-family:var(--mono);line-height:1.5;margin-top:8px;overflow-x:auto;white-space:pre-wrap;border:1px solid #1E293B;">${escapeHtml(mockOutput)}</pre>
      <div style="margin-top:10px;"><span style="color:#38BDF8;">antigravity@harness-sandbox:~$</span><span class="pg-term-cursor"></span></div>
    `;
    term.scrollTop = term.scrollHeight;
    
    statusBadge.className = 'tag tag-green btn-xs';
    statusBadge.textContent = 'COMPLETED';
    toast('沙箱合规校验模拟运行完毕！可以在右侧控制台查看对齐结果。');
  }, 1400);
}

// Save Project Guidelines to global state
function saveProjectGuidelines() {
  const p = getProject(state.activeProjectId);
  if (!p) return;

  p.guidelines = {
    dependency: document.getElementById('guidelineDependency').value,
    collaboration: document.getElementById('guidelineCollaboration').value,
    stack: document.getElementById('guidelineStack').value,
    coding: document.getElementById('guidelineCoding').value,
    domain: document.getElementById('guidelineDomain').value,
    quality: document.getElementById('guidelineQuality').value
  };

  // Synchronize top stat boxes counter if some values are filled
  const keys = Object.keys(p.guidelines);
  const filledCount = keys.filter(k => p.guidelines[k].trim().length > 0).length;
  const countEl = document.getElementById('pgStatCount');
  if (countEl) countEl.textContent = `${filledCount} 个`;

  toast('项目规范已保存，已成功同步至 Harness 智能体执行引擎！');
  
  // Propagate to Observability Prompt Viewer
  updatePromptViewer();
}

// Utility html escaping
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ============================================================
// AGENT LINKAGE VISUAL GLOWS & GRID SELECTIONS
// ============================================================
function selectAgentFromGrid(agentKey) {
  const selector = document.getElementById('pgAgentSelector');
  if (selector) {
    selector.value = agentKey;
    updatePromptViewer();
  }
}

function highlightAgentLinkage(guidelineKey) {
  const boxes = document.querySelectorAll('.pg-agent-grid-box');
  boxes.forEach(box => {
    const agKey = box.getAttribute('data-agent');
    const config = AGENT_SPEC_MAPS[agKey];
    if (config && config.specs[guidelineKey]) {
      box.classList.add('linked');
      box.classList.remove('faded');
    } else {
      box.classList.remove('linked');
      box.classList.add('faded');
    }
  });
}

function clearAgentLinkage() {
  const boxes = document.querySelectorAll('.pg-agent-grid-box');
  boxes.forEach(box => {
    box.classList.remove('linked');
    box.classList.remove('faded');
  });
}

// ============================================================
// ONBOARDING TOUR FOR PROJECT GUIDELINES
// ============================================================
const TOUR_STEPS = [
  {
    targetId: 'card_dependency',
    title: '全局通用规范',
    content: '通用规范（如依赖管理、协作规范）会自动注入到全部 8 个智能体的大脑中。你可以悬停在标题旁边的 ❓ 问号上，用最通俗的语言了解每一项规范的作用、对 AI 智能体的影响以及推荐写法。',
    position: 'bottom'
  },
  {
    targetId: 'dependency_presets',
    title: '快捷徽章模板',
    content: '不知道规范该怎么写？我们贴心地准备了行业标准的快速徽章预设。鼠标悬停在徽章上即可预览其核心内容，一键点击即可秒速导入配置！',
    position: 'bottom'
  },
  {
    targetId: 'dependency_copilot_btn',
    title: 'AI 一键润色',
    content: '自己写的规范太简短？点击这个按钮，小智 Copilot 会根据您当前的项目背景和底层技术栈，自动为您扩写并精润出最专业的规范文本！',
    position: 'bottom'
  },
  {
    targetId: 'pgViewerCard',
    title: '智能体注入图谱与 Prompt 预览',
    content: '在下方可观测面板中，您可以切换不同的智能体。网格里被注入的智能体盒子会自动亮起彩虹边缘，右侧还能实时显示它在执行任务时真正读取的 System Prompt 完整拼装！',
    position: 'top'
  }
];

let currentTourStep = 0;

function startOnboardingTour() {
  currentTourStep = 0;
  // Create overlay if not exists
  let overlay = document.getElementById('pgTourOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pgTourOverlay';
    overlay.className = 'pg-tour-overlay';
    overlay.onclick = exitOnboardingTour;
    document.body.appendChild(overlay);
  }
  
  let tourBox = document.getElementById('pgTourBox');
  if (!tourBox) {
    tourBox = document.createElement('div');
    tourBox.id = 'pgTourBox';
    tourBox.className = 'pg-tour-box';
    document.body.appendChild(tourBox);
  }
  
  overlay.style.display = 'block';
  tourBox.style.display = 'flex';
  
  // Also register window resize handler to reposition the box
  window.addEventListener('resize', repositionCurrentTourBox);
  
  renderTourStep();
}

function repositionCurrentTourBox() {
  const step = TOUR_STEPS[currentTourStep];
  if (step) {
    const target = document.getElementById(step.targetId);
    positionTourBox(target, step.position);
  }
}

function renderTourStep() {
  const step = TOUR_STEPS[currentTourStep];
  if (!step) {
    exitOnboardingTour();
    return;
  }
  
  // Clear previous highlights
  document.querySelectorAll('.pg-tour-highlight').forEach(el => {
    el.classList.remove('pg-tour-highlight');
  });
  
  // Highlight target
  const target = document.getElementById(step.targetId);
  if (target) {
    target.classList.add('pg-tour-highlight');
    // Scroll target into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  const tourBox = document.getElementById('pgTourBox');
  if (!tourBox) return;
  
  const totalSteps = TOUR_STEPS.length;
  tourBox.innerHTML = `
    <div class="pg-tour-box-header">
      <span>💡 ${step.title}</span>
      <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">${currentTourStep + 1} / ${totalSteps}</span>
    </div>
    <div class="pg-tour-box-body">
      ${step.content}
    </div>
    <div class="pg-tour-box-actions">
      <button class="btn btn-xs" style="border:1px solid var(--border); background:#fff; color:var(--text); padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;" onclick="exitOnboardingTour()">跳过</button>
      <div style="display:flex;gap:6px;">
        ${currentTourStep > 0 ? `<button class="btn btn-xs btn-outline" style="padding:4px 8px; font-size:11px; cursor:pointer;" onclick="prevTourStep()">上一步</button>` : ''}
        <button class="btn btn-xs btn-primary" style="padding:4px 8px; font-size:11px; cursor:pointer;" onclick="${currentTourStep === totalSteps - 1 ? 'exitOnboardingTour()' : 'nextTourStep()'}">
          ${currentTourStep === totalSteps - 1 ? '完成' : '下一步'}
        </button>
      </div>
    </div>
  `;
  
  // Position tour box relative to highlighted element
  setTimeout(() => {
    positionTourBox(target, step.position);
  }, 150); // Wait for potential scrolling to finish
}

function nextTourStep() {
  if (currentTourStep < TOUR_STEPS.length - 1) {
    currentTourStep++;
    renderTourStep();
  }
}

function prevTourStep() {
  if (currentTourStep > 0) {
    currentTourStep--;
    renderTourStep();
  }
}

function exitOnboardingTour() {
  window.removeEventListener('resize', repositionCurrentTourBox);
  
  // Clear highlights
  document.querySelectorAll('.pg-tour-highlight').forEach(el => {
    el.classList.remove('pg-tour-highlight');
  });
  
  const overlay = document.getElementById('pgTourOverlay');
  if (overlay) overlay.style.display = 'none';
  
  const tourBox = document.getElementById('pgTourBox');
  if (tourBox) tourBox.style.display = 'none';
  
  toast('向导学习完成，快来定义并校验您的专属项目规范吧！');
}

function positionTourBox(target, position) {
  const tourBox = document.getElementById('pgTourBox');
  if (!tourBox) return;
  
  if (!target) {
    // Fallback: center of viewport
    tourBox.style.position = 'fixed';
    tourBox.style.top = '50%';
    tourBox.style.left = '50%';
    tourBox.style.transform = 'translate(-50%, -50%)';
    return;
  }
  
  const rect = target.getBoundingClientRect();
  const boxRect = tourBox.getBoundingClientRect();
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  
  let top = 0;
  let left = 0;
  
  if (position === 'bottom') {
    top = rect.bottom + scrollTop + 12;
    left = rect.left + scrollLeft + (rect.width - boxRect.width) / 2;
  } else if (position === 'top') {
    top = rect.top + scrollTop - boxRect.height - 12;
    left = rect.left + scrollLeft + (rect.width - boxRect.width) / 2;
  } else if (position === 'left') {
    top = rect.top + scrollTop + (rect.height - boxRect.height) / 2;
    left = rect.left + scrollLeft - boxRect.width - 12;
  } else { // right
    top = rect.top + scrollTop + (rect.height - boxRect.height) / 2;
    left = rect.right + scrollLeft + 12;
  }
  
  // Ensure tour box stays within viewport boundaries
  const viewportWidth = window.innerWidth;
  if (left < 10) left = 10;
  if (left + boxRect.width > viewportWidth - 10) {
    left = viewportWidth - boxRect.width - 10;
  }
  
  tourBox.style.position = 'absolute';
  tourBox.style.top = `${top}px`;
  tourBox.style.left = `${left}px`;
  tourBox.style.transform = 'none';
}
