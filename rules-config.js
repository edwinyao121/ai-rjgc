// ============================================================
function renderRulesConfig(container) {
  const isProject = state.context.level === 'project';
  const stageNames = ['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'];
  const categories = stageNames
    .filter(s => state.gateDefs[s] && state.gateDefs[s].length > 0)
    .map(s => ({ title: s + '规则', keys: state.gateDefs[s].map(g => g.name) }));
  const subtitle = isProject
    ? '项目: ' + (getProject(state.activeProjectId)?.name || '未选择')
    : '平台级全局规则，所有项目共享';
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:13px;color:var(--text-muted);">${subtitle}</div></div>
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
        const config = state.rulesConfig[key] || { enabled: true, threshold: 80 };
        const on = config.enabled;
        const threshold = config.threshold;
        return `<div class="rule-config-item" style="flex-direction:column;align-items:stretch;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div><div class="rule-name">${key}</div><div class="rule-desc">${getRuleDesc(key)}</div></div>
            <div class="toggle${on?' on':''}" onclick="toggleRule(this,'${key}')"></div>
          </div>
          <div class="threshold-control" style="margin-top:10px;display:${on?'flex':'none'};align-items:center;gap:12px;">
            <span style="font-size:12px;color:var(--text-muted);min-width:60px;">阈值: ${threshold}%</span>
            <input type="range" min="0" max="100" value="${threshold}" style="flex:1;height:6px;-webkit-appearance:none;background:linear-gradient(to right,var(--success) 0%,var(--success) ${threshold}%,var(--border) ${threshold}%,var(--border) 100%);border-radius:3px;outline:none;cursor:pointer;" oninput="updateThreshold('${key}',this.value,this)">
            <span style="font-size:12px;font-weight:600;color:var(--primary);min-width:35px;">${threshold}%</span>
          </div>
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

  // 更新 rulesConfig 中的 enabled 状态
  if (!state.rulesConfig[key]) {
    state.rulesConfig[key] = { enabled: true, threshold: 80 };
  }
  state.rulesConfig[key].enabled = newVal;

  // 显示/隐藏阈值控制
  const thresholdControl = el.closest('.rule-config-item').querySelector('.threshold-control');
  if (thresholdControl) {
    thresholdControl.style.display = newVal ? 'flex' : 'none';
  }

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

function updateThreshold(key, value, inputEl) {
  const threshold = parseInt(value);

  // 更新 rulesConfig 中的 threshold
  if (!state.rulesConfig[key]) {
    state.rulesConfig[key] = { enabled: true, threshold: 80 };
  }
  state.rulesConfig[key].threshold = threshold;

  // 更新显示
  const container = inputEl.closest('.threshold-control');
  const label = container.querySelector('span:first-child');
  const valueLabel = container.querySelector('span:last-child');
  if (label) label.textContent = `阈值: ${threshold}%`;
  if (valueLabel) valueLabel.textContent = `${threshold}%`;

  // 更新滑块背景
  inputEl.style.background = `linear-gradient(to right, var(--success) 0%, var(--success) ${threshold}%, var(--border) ${threshold}%, var(--border) 100%)`;
}

function resetRules() {
  // 恢复默认阈值配置
  const defaultThresholds = {
    '需求完整性检查': 80,
    '语义冲突检测': 90,
    '可追溯性检查': 85,
    '粒度合理性检查': 70,
    '依赖无环检测': 100,
    '架构合规检查': 75,
    '技术选型评估': 80,
    '编码规范检查': 90,
    '安全漏洞扫描': 100,
    '代码复杂度检查': 85,
    '最佳实践检测': 80,
    '覆盖率门禁': 80,
    '测试通过率': 100,
    '技术债务检查': 95,
    'DoD检查清单': 100,
    '合规审计检查': 100,
  };

  Object.keys(state.rulesConfig).forEach(k => {
    state.rulesConfig[k] = {
      enabled: k !== '合规审计检查',
      threshold: defaultThresholds[k] || 80
    };
  });

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

  // 添加到 rulesConfig，默认阈值 80%
  state.rulesConfig[name] = { enabled: true, threshold: 80 };

  if (!state.gateDefs[stage]) state.gateDefs[stage] = [];
  state.gateDefs[stage].push({ name, desc, type });

  toast(`规则 "${name}" 已添加到「${stage}」阶段`);
  document.querySelector('.modal-overlay')?.remove();
  renderRulesConfig(document.getElementById('mainContent'));
}
