function renderKanban(container) {
  const project = getProject(state.activeProjectId);
  const tasks = getProjectTasks(state.activeProjectId);

  const statusCols = [
    { key:'backlog', title:'待办', icon:'&#9632;', color:'' },
    { key:'planning', title:'规划中', icon:'&#9654;', color:'' },
    { key:'executing', title:'执行中', icon:'&#8635;', color:'border-left:3px solid var(--primary);' },
    { key:'review', title:'待评审', icon:'&#9745;', color:'border-left:3px solid var(--warning);' },
    { key:'done', title:'已完成', icon:'&#10003;', color:'' },
  ];

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">任务看板</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">项目: ${project.name} &nbsp;|&nbsp; ${project.desc}</div></div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline btn-sm" onclick="navigate('projects')">&#9664; 切换项目</button>
        <button class="btn btn-primary btn-sm" onclick="showNewTaskModal()">+ 新建任务</button>
      </div>
    </div>
    <div class="kanban" id="kanbanBoard">${statusCols.map(col => {
      const colTasks = tasks.filter(t => t.status === col.key);
      return `<div class="kanban-col" data-status="${col.key}" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
        <div class="kanban-col-header"><span class="kanban-col-title">${col.icon} ${col.title}</span><span class="kanban-col-count">${colTasks.length}</span></div>
        ${colTasks.map(t => renderKanbanCard(t, col)).join('')}
      </div>`;
    }).join('')}</div>`;
}

function renderKanbanCard(t, col) {
  const statusKey = col ? col.key : t.status;
  const style = statusKey === 'executing' ? 'border-left:3px solid var(--primary);' : (statusKey === 'review' ? 'border-left:3px solid var(--warning);' : '');
  const stageInfo = t.stageCurrent >= 0 && t.stageNames.length > 0
    ? `<div class="stage-bar"><span class="status-dot ${t.status==='executing'?'blue':'amber'}"></span>当前: ${t.stageNames[t.stageCurrent]} ${t.stageCurrent>=0&&t.stageGates[t.stageCurrent]&&t.stageGates[t.stageCurrent].some(g=>g===0)?'<span style="color:var(--danger);">(门禁阻断)</span>':''}<div class="progress-bar" style="width:80px;margin-left:6px;"><div class="fill indigo" style="width:${Math.round((t.stageCurrent+1)/t.stageNames.length*100)}%;"></div></div></div>`
    : (statusKey === 'planning' && t.stageNames.length > 0 ? `<div class="stage-bar"><span class="status-dot green"></span>${t.stageNames.length}阶段已规划</div>` : '');
  return `
    <div class="kanban-card" style="${style}" draggable="true" data-task-id="${t.id}" ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)" onclick="navigate('pipeline-view',{tid:'${t.id}'})">
      <div class="title">${t.title}</div>
      <div class="meta">
        <span class="tag ${t.type==='Feature'?'tag-blue':t.type==='Refactor'?'tag-slate':'tag-purple'}">${t.type}</span>
        ${t.aiCreated?'<span class="tag tag-green">AI生成</span>':''}
        <span>${t.priority}</span>
        <span>&#9201; ${t.estimate}</span>
      </div>
      ${stageInfo}
    </div>`;
}

// Drag & Drop
let dragTaskId = null;
function handleDragStart(e) {
  dragTaskId = e.target.dataset.taskId;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function handleDragEnd(e) { e.target.classList.remove('dragging'); dragTaskId = null; }
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const newStatus = e.currentTarget.dataset.status;
  if (!dragTaskId || !newStatus) return;
  const task = getTask(dragTaskId);
  if (!task) return;
  const oldStatus = task.status;

  // Validate transition
  const validTransitions = {
    'backlog': ['planning'],
    'planning': ['backlog', 'executing'],
    'executing': ['review'],
    'review': ['executing', 'done'],
    'done': ['review'],
  };
  if (oldStatus === newStatus) return;
  if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(newStatus)) {
    toast(`不允许从 "${getStatusLabel(oldStatus)}" 直接流转到 "${getStatusLabel(newStatus)}"`, true);
    return;
  }

  // Special: planning -> executing: auto-plan pipeline
  if (oldStatus === 'planning' && newStatus === 'executing') {
    autoPlanPipeline(task);
    task.stageCurrent = 0;
  }

  // Special: review -> done: verify all gates pass
  if (oldStatus === 'review' && newStatus === 'done') {
    if (task.stageCurrent >= 0 && task.stageGates[task.stageCurrent] && task.stageGates[task.stageCurrent].some(g => g === 0)) {
      toast('当前阶段门禁未全部通过，无法完成', true);
      return;
    }
  }

  task.status = newStatus;

  // Update project progress
  if (newStatus === 'done') {
    const project = getProject(task.pid);
    if (project && project.stagesDone < project.stagesTotal) project.stagesDone++;
  }

  toast(`任务 "${task.title}" 已移至 "${getStatusLabel(newStatus)}"`);
  if (state.activePage === 'kanban') renderKanban(document.getElementById('mainContent'));
  updateBadges();
}

function getStatusLabel(s) {
  const map = { backlog:'待办', planning:'规划中', executing:'执行中', review:'待评审', done:'已完成' };
  return map[s] || s;
}

function autoPlanPipeline(task) {
  const isFeature = task.type === 'Feature' || task.type === 'Enhancement';
  const isRefactor = task.type === 'Refactor';
  if (isFeature) {
    task.stageNames = ['需求分析','需求拆解','方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'];
  } else if (isRefactor) {
    task.stageNames = ['方案设计','代码生成','代码审查','单元测试','质量检查','验收确认'];
  } else {
    task.stageNames = ['需求分析','代码生成','代码审查','测试','验收确认'];
  }
  task.stages = new Array(task.stageNames.length).fill(0);
  task.stageGates = task.stageNames.map(name => {
    const defs = state.gateDefs[name] || [];
    return defs.map(() => 0); // all pending initially
  });
  toast(`AI 已自动规划 ${task.stageNames.length} 个执行阶段`);
}

function showNewTaskModal() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>新建任务</h3>
      <div class="form-group"><label>任务标题</label><input type="text" id="ntTitle" placeholder="输入任务标题"></div>
      <div class="form-group"><label>任务描述</label><textarea id="ntDesc" rows="3" placeholder="详细描述任务内容..."></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group"><label>优先级</label><select id="ntPriority"><option>P0 - 紧急</option><option selected>P1 - 高</option><option>P2 - 中</option><option>P3 - 低</option></select></div>
        <div class="form-group"><label>估算工时</label><select id="ntEstimate"><option>1天</option><option selected>3天</option><option>5天</option><option>8天</option><option>10天</option></select></div>
      </div>
      <div class="form-group"><label>任务类型</label><select id="ntType"><option>Feature</option><option>Enhancement</option><option>Bug</option><option>Refactor</option></select></div>
      <div class="form-group"><label>AI 智能分析创建（可选）</label><textarea id="ntAiInput" rows="2" placeholder="粘贴需求文档、会议纪要等，AI 将自动分析生成候选 Backlog..."></textarea></div>
      <div id="aiResultContainer"></div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-outline btn-sm" id="btnAiAnalyze" style="margin-right:auto;">&#9730; AI 智能分析</button>
        <button class="btn btn-primary" id="btnCreateTask">创建任务</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('btnAiAnalyze').addEventListener('click', () => {
    const input = document.getElementById('ntAiInput').value.trim();
    if (!input) { toast('请先输入需求文档或会议纪要内容', true); return; }
    const container = document.getElementById('aiResultContainer');
    container.innerHTML = `<div class="ai-result">
      <div style="font-weight:600;font-size:13px;margin-bottom:8px;">&#9730; AI 分析中...</div>
      <div class="progress-bar" style="margin-bottom:10px;"><div class="fill indigo" style="width:0%;" id="aiProgress"></div></div>
      <div id="aiAnalysisContent" style="font-size:12px;color:var(--text-muted);">正在分析输入内容...</div>
    </div>`;
    // Simulate AI analysis
    let progress = 0;
    const steps = ['解析文档结构...', '提取关键需求点...', '识别功能边界...', '生成任务候选...'];
    let stepIdx = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress > 100) progress = 100;
      document.getElementById('aiProgress').style.width = progress + '%';
      if (stepIdx < steps.length && progress > (stepIdx+1)*20) {
        document.getElementById('aiAnalysisContent').textContent = steps[stepIdx];
        stepIdx++;
      }
      if (progress >= 100) {
        clearInterval(interval);
        container.innerHTML = `<div class="ai-result">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px;">&#10003; AI 分析完成，生成候选 Backlog：</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" checked data-title="数据导出格式支持 CSV/Excel" data-type="Feature" data-priority="P1" data-estimate="3天"> 数据导出格式支持 CSV/Excel — Feature · P1 · 3天</label>
            <label style="font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" checked data-title="导出进度实时通知优化" data-type="Enhancement" data-priority="P2" data-estimate="2天"> 导出进度实时通知优化 — Enhancement · P2 · 2天</label>
            <label style="font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" data-title="导出文件自动压缩与加密" data-type="Feature" data-priority="P2" data-estimate="5天"> 导出文件自动压缩与加密 — Feature · P2 · 5天</label>
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px;" id="btnBatchCreate">批量创建选中任务</button>
        </div>`;
        document.getElementById('btnBatchCreate').addEventListener('click', () => {
          const checks = container.querySelectorAll('input[type=checkbox]:checked');
          if (checks.length === 0) { toast('请至少选择一个任务', true); return; }
          checks.forEach(cb => {
            const t = createTask(cb.dataset.title, cb.dataset.type, cb.dataset.priority, cb.dataset.estimate, true);
            state.tasks.push(t);
          });
          toast(`成功创建 ${checks.length} 个任务`);
          container.innerHTML = '<div style="color:var(--success);font-size:13px;">&#10003; 任务已创建，可在看板查看</div>';
        });
      }
    }, 300);
  });

  document.getElementById('btnCreateTask').addEventListener('click', () => {
    const title = document.getElementById('ntTitle').value.trim();
    if (!title) { toast('请输入任务标题', true); return; }
    const type = document.getElementById('ntType').value;
    const priority = document.getElementById('ntPriority').value.split(' ')[0];
    const estimate = document.getElementById('ntEstimate').value;
    const task = createTask(title, type, priority, estimate, false);
    state.tasks.push(task);
    toast(`任务 "${title}" 创建成功`);
    overlay.remove();
    if (state.activePage === 'kanban') renderKanban(document.getElementById('mainContent'));
    updateBadges();
  });
}

function createTask(title, type, priority, estimate, aiCreated) {
  const id = 't' + (taskIdCounter++);
  return {
    id, pid: state.activeProjectId, title: (type === 'Bug' ? 'BUG-' : 'ST-') + String(taskIdCounter).padStart(3,'0') + ' ' + title,
    type, priority, estimate, status: 'backlog', stageCurrent: -1,
    stageNames: [], stages: [], stageGates: [], aiCreated,
  };
}
