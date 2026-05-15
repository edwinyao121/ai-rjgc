// ============================================================
function renderRulesConfig(container) {
  const project = getProject(state.activeProjectId);
  const stageNames = ['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'];
  const categories = stageNames
    .filter(s => state.gateDefs[s] && state.gateDefs[s].length > 0)
    .map(s => ({ title: s + '规则', keys: state.gateDefs[s].map(g => g.name) }));
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">门禁配置</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">项目: ${project.name}</div></div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="showAddRuleModal()">+ 添加规则</button>
        <button class="btn btn-outline btn-sm" onclick="resetRules()">&#9881; 恢复默认</button>
      </div>
    </div>
    <div class="grid-2" id="rulesGrid"></div>`;
  renderRulesGrid(categories);
}

function renderRulesGrid(categories) {
  const grid = document.getElementById('rulesGrid');
  if (!grid) return;
  grid.innerHTML = categories.map(cat => `
    <div class="card">
      <div class="card-title" style="margin-bottom:14px;">${cat.title}</div>
      ${cat.keys.map(key => {
        const on = state.rulesConfig[key] !== false;
        return `<div class="rule-config-item">
          <div><div class="rule-name">${key}</div><div class="rule-desc">${getRuleDesc(key)}</div></div>
          <div class="toggle${on?' on':''}" onclick="toggleRule(this,'${key}')"></div>
        </div>`;
      }).join('')}
    </div>`).join('');
}

function getRuleDesc(key) {
  const map = {
    '需求完整性检查':'检查需求是否包含背景、目标、验收标准、非功能需求',
    '语义冲突检测':'检测需求之间的逻辑矛盾和术语不一致',
    '可追溯性检查':'验证需求到业务目标的可追溯链路',
    '架构合规检查':'检查方案是否符合架构规范，阈值可调',
    '技术选型评估':'评估技术选型的合理性和风险等级',
    '编码规范检查':'ESLint/Sonar 规范检查，阈值可调',
    '安全漏洞扫描':'OWASP Top 10 安全风险检测',
    '代码复杂度检查':'圈复杂度 ≤ 15 · 函数行数 ≤ 80',
    '最佳实践检测':'异常处理、资源释放、设计模式检查',
    '覆盖率门禁':'行覆盖率 ≥ 80% · 分支覆盖率 ≥ 70%',
    '测试通过率':'全部测试用例必须 100% 通过',
    '技术债务检查':'技术债务比率不超过 5%',
    'DoD检查清单':'功能完成、测试通过、文档齐全、性能达标',
    '合规审计检查':'数据安全、隐私合规、许可证合规',
  };
  return map[key] || '自定义规则';
}

function toggleRule(el, key) {
  const newVal = !el.classList.contains('on');
  if (newVal) el.classList.add('on'); else el.classList.remove('on');
  state.rulesConfig[key] = newVal;
  toast(`规则 "${key}" 已${newVal?'启用':'禁用'}`);
  // Propagate to active gates
  const task = getTask(state.activeTaskId);
  if (task && task.stageCurrent >= 0 && task.stageGates[task.stageCurrent]) {
    const stageName = task.stageNames[task.stageCurrent];
    const defs = state.gateDefs[stageName] || [];
    const idx = defs.findIndex(d => d.name === key);
    if (idx >= 0 && task.stageGates[task.stageCurrent][idx] !== undefined) {
      task.stageGates[task.stageCurrent][idx] = newVal ? 0 : 1; // re-check if enabled, auto-pass if disabled
      if (state.activePage === 'pipeline-view') {
        renderTabContent(task, 'gates');
      }
    }
  }
}

function resetRules() {
  Object.keys(state.rulesConfig).forEach(k => state.rulesConfig[k] = true);
  state.rulesConfig['合规审计检查'] = false;
  toast('规则配置已恢复默认');
  const stageNames = ['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'];
  const categories = stageNames
    .filter(s => state.gateDefs[s] && state.gateDefs[s].length > 0)
    .map(s => ({ title: s + '规则', keys: state.gateDefs[s].map(g => g.name) }));
  renderRulesGrid(categories);
}

function showAddRuleModal() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  const stages = ['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'];
  overlay.innerHTML = `
    <div class="modal">
      <h3>添加门禁规则</h3>
      <div class="form-group"><label>规则名称</label><input type="text" id="arName" placeholder="输入规则名称"></div>
      <div class="form-group"><label>所属阶段</label>
        <select id="arStage">${stages.map(s => `<option>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label>规则描述</label><textarea id="arDesc" rows="2" placeholder="描述规则检查内容"></textarea></div>
      <div class="form-group"><label>门禁类型</label>
        <select id="arType"><option value="pass">阻断（不通过则阻塞）</option><option value="warn">警告（不通过仅提醒）</option></select></div>
      <div class="form-group"><label>检查方式</label>
        <select id="arMethod"><option value="auto">自动</option><option value="manual">手动</option></select></div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="addNewRule()">添加</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function addNewRule() {
  const name = document.getElementById('arName').value.trim();
  const stage = document.getElementById('arStage').value;
  const desc = document.getElementById('arDesc').value.trim() || '自定义规则';
  const type = document.getElementById('arType').value;
  if (!name) { toast('请输入规则名称', true); return; }
  state.rulesConfig[name] = true;
  if (!state.gateDefs[stage]) state.gateDefs[stage] = [];
  state.gateDefs[stage].push({ name, desc, type });
  toast(`规则 "${name}" 已添加到「${stage}」阶段`);
  document.querySelector('.modal-overlay')?.remove();
  renderRulesConfig(document.getElementById('mainContent'));
}
