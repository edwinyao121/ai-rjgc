// PIPELINE VIEW
// ============================================================
function renderPipeline(container, data) {
  const tid = (data && data.tid) || state.activeTaskId;
  state.activeTaskId = tid;
  const task = getTask(tid);
  if (!task) { container.innerHTML = '<div class="card"><div class="empty-state">未找到任务</div></div>'; return; }
  const project = getProject(task.pid);
  state.activeProjectId = task.pid;

  if (task.stageNames.length === 0) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div><div style="font-size:22px;font-weight:700;">任务监控</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">任务: ${task.title} &mdash; 项目: ${project.name}</div></div>
        <div style="display:flex;gap:10px;"><button class="btn btn-primary btn-sm" id="btnAutoPlan">&#9730; AI 智能规划阶段</button></div>
      </div>
      <div class="card"><div class="empty-state"><div class="icon">&#9730;</div><div>该任务尚未规划执行阶段</div><div style="font-size:12px;color:var(--text-muted);margin-top:8px;">点击上方按钮，AI 将根据任务类型自动规划执行流水线</div></div></div>`;
    document.getElementById('btnAutoPlan').addEventListener('click', () => {
      autoPlanPipeline(task);
      task.stageCurrent = 0;
      task.stages[0] = 1; // mark first stage as done
      // Auto-pass first stage gates
      if (task.stageGates[0]) task.stageGates[0] = task.stageGates[0].map(() => 1);
      toast(`${task.stageNames.length} 个阶段已规划`);
      state.timeline.unshift({ time: m(0), text:`AI 为任务 <strong>${task.title}</strong> 智能规划了 ${task.stageNames.length} 个执行阶段` });
      renderPipeline(container, { tid });
      updateBadges();
    });
    return;
  }

  const stageIcons = { '需求分析':'@{oriole}', '需求拆解':'&#9776;', '方案设计':'&#9671;', '代码生成':'&#9745;', '代码审查':'&#9745;', '单元测试':'&#9881;', '集成测试':'&#9733;', '质量检查':'&#9737;', '部署发布':'&#9650;', '验收确认':'&#10003;', '持续监控':'&#8986;', '测试':'&#9881;' };

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:22px;font-weight:700;">任务监控</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">任务: ${task.title} &mdash; 项目: ${project.name}</div></div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline btn-sm" onclick="navigate('kanban')">&#9664; 返回看板</button>
        <button class="btn btn-primary btn-sm" id="btnNextStage">&#9654; 执行下一阶段</button>
      </div>
    </div>
    <div class="card" style="overflow-x:auto;">
      <div class="card-title" style="margin-bottom:12px;">任务流程</div>
      <div class="pipeline" id="pipelineGraph"></div>
    </div>
    <div class="grid-70-30">
      <div class="card" id="stageDetailPanel">
        <div class="tabs">
          <div class="tab active" data-tab="mindmap">Agent 思维 & 活动</div>
          <div class="tab" data-tab="gates">门禁信息</div>
          <div class="tab" data-tab="artifacts">产出物</div>
          <button class="btn btn-primary btn-sm" style="margin-left:auto;margin-bottom:5px;border-radius:20px;" onclick="openVSCode()" title="打开本地 VSCode">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z"/><path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/><path d="M19 13l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/></svg>
            智能代码编辑器
          </button>
        </div>
        <div id="tabContent"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;" id="sidePanel"></div>
    </div>
    </div>`;

  // Render pipeline SVG
  renderPipelineGraph(task, stageIcons);

  // Tab switching
  document.querySelectorAll('#stageDetailPanel .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#stageDetailPanel .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTabContent(task, tab.dataset.tab);
    });
  });

  renderTabContent(task, 'mindmap');
  renderSidePanel(task);

  // Next stage button
  document.getElementById('btnNextStage').addEventListener('click', () => advanceStage(task));
}

function renderPipelineGraph(task, icons) {
  const container = document.getElementById('pipelineGraph');
  if (!container) return;
  const stageIcons = {
    '需求分析': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    '需求拆解': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    '方案设计': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    '代码生成': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    '代码审查': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    '单元测试': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    '质量检查': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    '验收确认': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    '测试': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    '部署发布': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    '持续监控': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    '集成测试': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/></svg>'
  };

  // Human review stages
  const humanReviewStages = ['方案设计', '代码审查'];
  // Build pipeline HTML
  let html = '';
  task.stageNames.forEach((name, i) => {
    let cls = 'pending';
    if (task.stages[i] >= 1) cls = 'done';
    else if (i === task.stageCurrent) {
      const hasBlocked = task.stageGates[i] && task.stageGates[i].some(g => g === 0);
      cls = hasBlocked ? 'blocked' : 'active';
    }
    const icon = stageIcons[name] || '📦';
    const agent = stageAgents[name] || { name: '未知 Agent', avatar: '🤖', color: '#94A3B8' };
    const agentState = task.stages[i] >= 1 ? 'done' : (i === task.stageCurrent ? 'working' : 'idle');
    const hasHumanReview = humanReviewStages.includes(name) && i <= task.stageCurrent;
    const review = state.reviews.find(r => r.tid === task.id && r.stage === i);
    const reviewStatus = review ? review.status : (hasHumanReview && task.stages[i] >= 1 ? 'approved' : null);

    // Stage node with agent
    html += `<div class="pipeline-stage">
      ${hasHumanReview ? `
      <div class="pipeline-human-node" onclick="event.stopPropagation();${review ? `focusStage(${i})` : `requestReviewForStage(${i})`}">
        <div class="pipeline-human-icon">👤</div>
        <div class="pipeline-human-label">人工评审</div>
        ${reviewStatus ? `<span class="pipeline-human-status ${reviewStatus}">${reviewStatus==='approved'?'已通过':reviewStatus==='rejected'?'已驳回':reviewStatus==='changes'?'需修改':'待审批'}</span>` : '<span class="pipeline-human-status pending">待审批</span>'}
      </div>` : ''}
      <div class="pipeline-node" onclick="focusStage(${i})">
        <div class="pipeline-node-center"></div>
        <div class="pipeline-node-circle ${cls}">${icon}</div>
        <div class="pipeline-node-label">${name}</div>
        <div class="pipeline-node-sublabel">${task.stages[i] >= 1 ? '(已完成)' : i === task.stageCurrent ? '(执行中)' : '(待执行)'}</div>
        <div class="pipeline-node-gates">${(task.stageGates[i]||[]).map(g => `<span class="pipeline-gate-dot ${g===1?'pass':g===0?'fail':'pending'}"></span>`).join('')}</div>
      </div>
      <div class="pipeline-agent">
        ${stageMultiAgents[name] ? `
          <div class="pipeline-multi-agents">
            ${stageMultiAgents[name].map((ma, idx) => `
              <div class="pipeline-agent-avatar ${agentState}" style="border-color:${agentState==='done'?ma.color:'var(--border)'};background:${agentState==='done'?ma.color+'15':'var(--surface)'};">
                <span>${ma.avatar}</span>
              </div>
              ${idx < stageMultiAgents[name].length - 1 ? '<div class="agent-interaction-line">⟷</div>' : ''}
            `).join('')}
          </div>
          <div class="pipeline-agent-name" style="color:${agentState==='working'?stageMultiAgents[name][0].color:'var(--text-muted)'};">
            ${stageMultiAgents[name].map(ma => ma.name).join(' & ')}
          </div>
        ` : `
          <div class="pipeline-agent-avatar ${agentState}" style="border-color:${agentState==='done'?agent.color:'var(--border)'};background:${agentState==='done'?agent.color+'15':'var(--surface)'};">
            <span>${agent.avatar}</span>
          </div>
          <div class="pipeline-agent-name" style="color:${agentState==='working'?agent.color:'var(--text-muted)'};">${agent.name}</div>
        `}
      </div>
    </div>`;

    // Connector with agent communication
    if (i < task.stageNames.length - 1) {
      const nextName = task.stageNames[i + 1];
      const commKey = `${name}→${nextName}`;
      const commMsg = agentCommMessages[commKey] || '传递产出物';
      const isCommActive = task.stages[i] >= 1 && task.stages[i + 1] === 0;
      const isCommDone = task.stages[i] >= 1 && task.stages[i + 1] >= 1;
      html += `<div class="pipeline-connector ${isCommActive?'comm-active':''}">
        <div class="pipeline-connector-line ${isCommActive||isCommDone?'active':''}"></div>
        <div class="pipeline-connector-msg">${commMsg}</div>
      </div>`;
    }
  });
  container.innerHTML = html;
}

function renderActivityFeed(task) {
  const feedContainer = document.getElementById('activityFeed');
  if (!feedContainer) return;
  const logs = getActivityLogs(task);
  feedContainer.innerHTML = logs.length === 0
    ? '<div style="padding:12px;color:var(--text-muted);font-size:12px;">暂无活动记录</div>'
    : logs.map(log => `
      <div class="activity-item ${log.type}">
        <span class="activity-time">${log.time}</span>
        <span class="activity-icon ${log.iconType}">${log.icon}</span>
        <span class="activity-text">${log.text}</span>
      </div>`).join('');
}

function getActivityLogs(task) {
  const key = task.id;
  if (!activityLogs[key]) {
    activityLogs[key] = generateInitialActivityLogs(task);
  }
  return activityLogs[key];
}

function generateInitialActivityLogs(task) {
  const logs = [];
  const now = Date.now();
  const fmt = (s) => new Date(now - s * 1000).toLocaleString('zh-CN', {hour:'2-digit',minute:'2-digit',second:'2-digit'});

  task.stageNames.forEach((name, i) => {
    if (i > task.stageCurrent) return;
    const agent = stageAgents[name] || { name: '未知 Agent', avatar: '🤖' };
    const isDone = task.stages[i] >= 1;
    const isActive = i === task.stageCurrent;
    const baseTime = (task.stageCurrent - i) * 300;

    if (isDone || isActive) {
      logs.push({
        time: fmt(baseTime + 120),
        type: 'agent-work',
        icon: agent.avatar,
        iconType: 'agent',
        text: `<strong>${agent.name}</strong> 开始执行「${name}」阶段`
      });
    }

    // Artifact Generation
    if (isDone || isActive) {
      const artifacts = getArtifacts(name);
      if (artifacts.length > 0) {
        logs.push({
          time: fmt(baseTime + 60),
          type: 'agent-work',
          icon: '&#128196;',
          iconType: 'agent',
          text: `<strong>${agent.name}</strong> 产出了 <a href="javascript:void(0)" onclick="goToArtifacts('${artifacts[0].name}')" style="color:var(--primary);text-decoration:underline;font-weight:600;">${artifacts[0].name}</a> 等物料`
        });
      }
    }

    // Gate check logs
    if (task.stageGates[i] && (isDone || isActive)) {
      const gateDefs = state.gateDefs[name] || [];
      task.stageGates[i].forEach((g, gi) => {
        if (g === 1) {
          logs.push({
            time: fmt(baseTime + 80),
            type: 'gate-check',
            icon: '✓',
            iconType: 'gate',
            text: `门禁「${gateDefs[gi]?.name || '检查'}」<strong>通过</strong>`
          });
        } else if (g === 0 && isActive) {
          logs.push({
            time: fmt(baseTime + 80),
            type: 'gate-fail',
            icon: '✗',
            iconType: 'fail',
            text: `门禁「${gateDefs[gi]?.name || '检查'}」<strong>阻断</strong> — ${gateDefs[gi]?.desc || ''}`
          });
        }
      });
    }

    // Agent completion
    if (isDone && i < task.stageCurrent) {
      logs.push({
        time: fmt(baseTime + 30),
        type: 'agent-work',
        icon: '✓',
        iconType: 'agent',
        text: `<strong>${agent.name}</strong> 完成「${name}」阶段`
      });
      // Communication to next agent
      if (i < task.stageNames.length - 1) {
        const nextAgent = stageAgents[task.stageNames[i + 1]] || { name: '未知 Agent' };
        const commKey = `${name}→${task.stageNames[i + 1]}`;
        logs.push({
          time: fmt(baseTime + 20),
          type: 'agent-comm',
          icon: '→',
          iconType: 'agent',
          text: `<strong>${agent.name}</strong> → <strong>${nextAgent.name}</strong>: ${agentCommMessages[commKey] || '传递产出物'}`
        });
      }
    }

    // Human review logs
    const review = state.reviews.find(r => r.tid === task.id && r.stage === i);
    if (review) {
      const statusText = review.status === 'approved' ? '通过' : review.status === 'rejected' ? '驳回' : review.status === 'changes' ? '需修改' : '待审批';
      logs.push({
        time: fmt(baseTime + 50),
        type: 'human-action',
        icon: '👤',
        iconType: 'human',
        text: `<strong>${review.reviewer}</strong> 对「${name}」评审: <strong>${statusText}</strong> — ${review.desc}`
      });
    }
  });

  // Sort by time (most recent first)
  logs.sort((a, b) => b.time.localeCompare(a.time));
  return logs;
}

function addActivityLog(taskId, type, icon, iconType, text) {
  if (!activityLogs[taskId]) activityLogs[taskId] = [];
  const now = new Date().toLocaleString('zh-CN', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  activityLogs[taskId].unshift({ time: now, type, icon, iconType, text });
}

function requestReviewForStage(stageIdx) {
  const task = getTask(state.activeTaskId);
  if (!task) return;
  const stageName = task.stageNames[stageIdx];
  const existing = state.reviews.find(r => r.tid === task.id && r.stage === stageIdx);
  if (existing) {
    toast('该阶段已有评审任务', true);
    return;
  }
  const reviewers = ['王工','李工','赵工','刘工'];
  const rv = {
    id: 'r' + (reviewIdCounter++),
    tid: task.id,
    stage: stageIdx,
    stageName,
    reviewer: reviewers[Math.floor(Math.random() * reviewers.length)],
    status: 'pending',
    desc: `${stageName}阶段产出物需要人工评审确认`
  };
  state.reviews.push(rv);
  addActivityLog(task.id, 'human-action', '👤', 'human', `<strong>${rv.reviewer}</strong> 被分配为「${stageName}」评审人`);
  toast(`已创建评审任务，评审人: ${rv.reviewer}`);
  renderPipelineGraph(task, {});
  updateBadges();
}

function focusStage(idx) {
  const task = getTask(state.activeTaskId);
  if (!task || idx > task.stageCurrent + 1) { toast('请先完成当前阶段', true); return; }
  state._focusStage = idx;
  renderTabContent(task, document.querySelector('#stageDetailPanel .tab.active').dataset.tab);
}

function renderTabContent(task, tab) {
  const container = document.getElementById('tabContent');
  if (!container) return;
  const stageIdx = state._focusStage !== undefined ? state._focusStage : task.stageCurrent;
  if (stageIdx < 0 || !task.stageNames[stageIdx]) { container.innerHTML = '<div style="padding:20px;color:var(--text-muted);">暂无阶段数据</div>'; return; }
  const stageName = task.stageNames[stageIdx];
  const gates = task.stageGates[stageIdx] || [];
  const gateDefs = state.gateDefs[stageName] || [];

  if (tab === 'gates') {
    if (gateDefs.length === 0) { container.innerHTML = '<div style="padding:20px;color:var(--text-muted);">该阶段无门禁规则</div>'; return; }
    container.innerHTML = `
      <div style="margin-bottom:12px;font-size:13px;font-weight:600;">当前阶段: ${stageName} ${task.stages[stageIdx]>=1?'(已完成)':task.stageCurrent===stageIdx?'(执行中)':'(待执行)'}</div>
      ${gateDefs.map((g, i) => {
        const status = gates[i] === 1 ? 'pass' : (gates[i] === 0 && task.stageCurrent === stageIdx ? 'fail' : 'pending');
        const statusTag = status === 'pass' ? '<span class="tag tag-green">通过</span>' : (status === 'fail' ? '<span class="tag tag-red">阻断</span>' : '<span class="tag tag-slate">待检查</span>');
        const detailHtml = g.detail && status === 'fail' ? `<div class="gate-detail" style="color:var(--danger);">${g.detail}</div>` : (status === 'pass' ? `<div class="gate-detail">通过 · 0 错误 · 执行耗时 ${(Math.random()*5+1).toFixed(1)}s</div>` : '');
        return `<div class="gate-item${status==='fail'?' fail-anim':''}">
          <div class="gate-icon ${status==='pass'?'pass':status==='fail'?'fail':'warn'}">${status==='pass'?'&#10003;':status==='fail'?'&#10007;':'&#9888;'}</div>
          <div class="gate-info"><div class="gate-name">${g.name}</div><div class="gate-desc">${g.desc}</div>${detailHtml}</div>${statusTag}
        </div>`;
      }).join('')}
      ${task.stageCurrent === stageIdx && gates.some(g => g === 0) ? `
        <div style="margin-top:16px;padding:16px;background:var(--danger-light);border-radius:var(--radius);font-size:13px;">
          <strong>&#9888; 门禁阻断分析：</strong>
          <ul style="margin:8px 0 0 18px;line-height:1.6;" id="aiSuggestions"></ul>
          <button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="openSidebar({title:'门禁修复助手', subtitle:'智能分析并解决阻断问题', showInput:true})">&#9742; 唤起 Agent 对话协助解决</button>
        </div>` : ''}
    `;
    // AI suggestions
    const sugList = document.getElementById('aiSuggestions');
    if (sugList) {
      if (stageName === '代码审查') {
        sugList.innerHTML = `<li><strong>QueryOptimizer.process()</strong>: 提取子查询优化逻辑为独立方法，可降低圈复杂度至 10</li><li><strong>SQLBuilder.build()</strong>: 将 WHERE 子句和 JOIN 子句构建逻辑独立，预计行数降至 65</li>`;
      } else if (stageName === '单元测试') {
        sugList.innerHTML = `<li>补充边界值测试用例，预计覆盖率可提升至 85%</li><li>添加异常路径测试，覆盖 try-catch 分支</li>`;
      } else {
        sugList.innerHTML = `<li>Agent 将自动分析失败原因并生成修复方案</li>`;
      }
    }
  } else if (tab === 'mindmap') {
    const logs = getActivityLogs(task);
    const stageLogs = logs.filter(log => log.text.includes(stageName) || log.text.includes(stageAgents[stageName]?.name || ''));
    const legendHtml = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <span class="tag tag-blue"><span class="status-dot blue"></span>Agent 通信</span>
        <span class="tag tag-green"><span class="status-dot green"></span>Agent 工作</span>
        <span class="tag tag-amber"><span class="status-dot amber"></span>人工操作</span>
        <span class="tag tag-red"><span class="status-dot red"></span>门禁阻断</span>
        <span class="tag tag-slate"><span class="status-dot"></span>门禁通过</span>
      </div>`;
    const activityHtml = stageLogs.length === 0
      ? '<div style="padding:12px;color:var(--text-muted);font-size:12px;text-align:center;">暂无该阶段活动记录</div>'
      : `<div class="activity-feed" style="max-height:200px;">${stageLogs.map(log => `
          <div class="activity-item ${log.type}">
            <span class="activity-time">${log.time}</span>
            <span class="activity-icon ${log.iconType}">${log.icon}</span>
            <span class="activity-text">${log.text}</span>
          </div>`).join('')}</div>`;

    container.innerHTML = `
      <div style="margin-bottom:8px;font-size:13px;font-weight:600;">${stageName} Agent 工作流</div>
      <div class="mindmap-container" id="mindmapSvg" style="min-height:240px; position:relative; overflow:hidden;"></div>
      <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-size:13px;font-weight:600;">活动日志</div>
          ${legendHtml}
        </div>
        ${activityHtml}
      </div>`;
    setTimeout(() => drawMindMap(stageName), 100);
  } else if (tab === 'artifacts') {
    const artifacts = getArtifacts(stageName);
    container.innerHTML = `
      <div style="margin-bottom:12px;font-size:13px;font-weight:600;">阶段产出物 — ${stageName}</div>
      <div style="flex:1;min-width:0;">
        ${artifacts.map(a => `
          <div class="artifact-file" onclick="previewArtifact('${a.name}')">
            <div class="file-icon">${a.icon}</div>
            <div style="flex:1;"><div class="file-name">${a.name}</div><div class="file-meta">${a.meta}</div></div>
            <button class="btn btn-ghost btn-xs">&#9654; 预览</button>
          </div>`).join('')}
        <div id="artifactPreview"></div>
      </div>`;
    openSidebar({
      title: '产出物优化助手',
      subtitle: `当前聚焦: ${stageName}`,
      showInput: true
    });
  }
}

function getArtifacts(stageName) {
  const map = {
    '需求分析': [{ icon:'@{oriole}', name:'需求分析报告.html', meta:'12KB · 15项检查全部通过' },{ icon:'@{oriole}', name:'需求追溯矩阵.xlsx', meta:'8KB · 可追溯性验证通过' }],
    '需求拆解': [{ icon:'&#9776;', name:'任务拆解方案.html', meta:'6KB · 6个子任务' },{ icon:'&#9776;', name:'依赖关系图.mmd', meta:'2KB · 无环验证通过' }],
    '方案设计': [{ icon:'&#9671;', name:'架构设计方案.html', meta:'24KB · 3个核心模块' },{ icon:'&#9671;', name:'接口定义文档.yaml', meta:'15KB · 12个REST端点' }],
    '代码生成': [{ icon:'&#9745;', name:'Employee.java', meta:'5KB · 186行 · 员工实体类' },{ icon:'&#9745;', name:'EmployeeController.java', meta:'4KB · 142行 · REST控制器' },{ icon:'&#9745;', name:'EmployeeRepository.java', meta:'2KB · 78行 · 数据访问层' },{ icon:'&#9745;', name:'EmployeeService.java', meta:'3KB · 112行 · 业务逻辑层' },{ icon:'&#9881;', name:'api_hr.js', meta:'2KB · 45行 · HR API封装' },{ icon:'&#9881;', name:'EmployeeList.jsx', meta:'3KB · 98行 · 员工列表组件' }],
    '代码审查': [{ icon:'&#9745;', name:'QueryOptimizer.java', meta:'8KB · 245行' },{ icon:'&#9745;', name:'SQLBuilder.java', meta:'5KB · 142行' },{ icon:'&#9745;', name:'审查报告.json', meta:'3KB · 4项检查' }],
    '单元测试': [{ icon:'&#9881;', name:'QueryOptimizerTest.java', meta:'6KB · 18个用例' },{ icon:'&#9881;', name:'测试报告.html', meta:'15KB · 覆盖率62%' }],
    '质量检查': [{ icon:'&#9737;', name:'质量检查报告.pdf', meta:'20KB · 技术债务0.8%' }],
    '验收确认': [{ icon:'&#10003;', name:'验收报告.html', meta:'10KB · DoD通过' }],
  };
  return map[stageName] || [{ icon:'@{oriole}', name:'暂无产出物', meta:'等待阶段执行' }];
}

function previewArtifact(name) {
  const preview = document.getElementById('artifactPreview');
  if (!preview) return;
  if (name.includes('.java')) {
    preview.innerHTML = `<div style="margin-top:12px;"><div style="font-weight:600;font-size:13px;margin-bottom:8px;">&#9745; ${name}</div><div class="code-block"><span class="comment">// Generated by Code Generation Agent</span>
<span class="keyword">public class</span> <span style="color:#F9A8D4;">QueryOptimizer</span> {
    <span class="keyword">private final</span> IndexHintHelper indexHintHelper;

    <span class="keyword">public</span> QueryPlan <span style="color:#93C5FD;">process</span>(Query query) {
        QueryPlan plan = <span class="keyword">new</span> QueryPlan(query);
        plan = <span style="color:#93C5FD;">optimizeSubquery</span>(plan);
        plan = indexHintHelper.<span style="color:#93C5FD;">applyIndexHint</span>(plan);
        <span class="keyword">return</span> plan;
    }

    <span class="keyword">private</span> QueryPlan <span style="color:#93C5FD;">optimizeSubquery</span>(QueryPlan plan) {
        <span class="comment">// 子查询优化逻辑（已从 process 提取）</span>
        <span class="keyword">return</span> plan.<span style="color:#93C5FD;">optimizeSubqueries</span>();
    }
}</div></div>`;
  } else if (name === '需求分析报告.html') {
    preview.innerHTML = `<div style="margin-top:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;margin-bottom:12px;">
        <div>
          <div style="font-weight:600;font-size:14px;">&#9745; 需求分析报告.html</div>
          <div style="font-size:12px;color:#065F46;margin-top:3px;">15项检查全部通过 · 2026-05-12 生成</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.open('需求分析报告.html', '_blank')">&#8599; 在新窗口打开完整报告</button>
      </div>
      <div style="background:#FAFBFC;border-radius:8px;padding:24px;border:1px solid #E2E8F0;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#1E40AF,#2563EB);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;">&#9745;</div>
          <div>
            <div style="font-weight:700;font-size:16px;">新增人事管理模块 · 需求分析报告</div>
            <div style="font-size:12px;color:#64748B;margin-top:2px;">15 项检查全部通过 · 完整性得分 100%</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#1E40AF;">15</div>
            <div style="font-size:11px;color:#64748B;margin-top:3px;">检查项总数</div>
          </div>
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#065F46;">15</div>
            <div style="font-size:11px;color:#64748B;margin-top:3px;">通过项</div>
          </div>
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#065F46;">0</div>
            <div style="font-size:11px;color:#64748B;margin-top:3px;">警告项</div>
          </div>
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#1E40AF;">100%</div>
            <div style="font-size:11px;color:#64748B;margin-top:3px;">完整性得分</div>
          </div>
        </div>
        <div style="font-size:12px;color:#475569;line-height:1.7;">
          <strong>业务背景：</strong>随着公司规模扩大，现有人事管理方式已无法满足需求，拟建设人事管理模块集成至OA系统...<br>
          <strong>功能需求：</strong>员工花名册管理、入职流程、转正管理、岗位调动、离职管理、人事报表 共6项<br>
          <strong>非功能需求：</strong>性能(响应≤500ms)、安全(敏感信息加密)、可靠性(可用性≥99.5%)
        </div>
      </div>
    </div>`;
  } else {
    preview.innerHTML = `<div style="margin-top:12px;padding:16px;background:#FAFBFC;border-radius:var(--radius);font-size:13px;color:var(--text-secondary);">&#9745; ${name} — 预览（模拟内容）<br>该产出物由 Agent 自动生成，包含结构化数据和详细分析。</div>`;
  }

  openSidebar({
    title: '产出物优化助手',
    subtitle: `当前聚焦: ${name}`,
    showInput: true
  });
}

function drawMindMap(stageName) {
  const container = document.getElementById('mindmapSvg');
  if (!container) return;

  const w = container.clientWidth || 360;
  const h = 260;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width','100%'); svg.setAttribute('height', h);

  // Root node
  const rootX = 20, rootY = h/2 - 16, rootW = 105, rootH = 32;
  const g1 = document.createElementNS('http://www.w3.org/2000/svg','g');
  const r1 = document.createElementNS('http://www.w3.org/2000/svg','rect');
  r1.setAttribute('x',rootX); r1.setAttribute('y',rootY); r1.setAttribute('width',rootW); r1.setAttribute('height',rootH);
  r1.setAttribute('rx','6'); r1.setAttribute('fill','#EEF2FF'); r1.setAttribute('stroke','#4F46E5'); r1.setAttribute('stroke-width','2');
  g1.appendChild(r1);
  const t1 = document.createElementNS('http://www.w3.org/2000/svg','text');
  t1.setAttribute('x',rootX+rootW/2); t1.setAttribute('y',rootY+rootH/2+5); t1.setAttribute('text-anchor','middle');
  t1.setAttribute('fill','#4F46E5'); t1.setAttribute('font-size','12'); t1.setAttribute('font-weight','600');
  t1.setAttribute('font-family','system-ui,sans-serif'); t1.textContent = stageName + ' Agent';
  g1.appendChild(t1);
  svg.appendChild(g1);

  // Child nodes
  const children = getAgentSteps(stageName);
  const n = children.length;
  const spacing = h / (n + 1);
  const startX = rootX + rootW + 35;
  const nodeW = 80, nodeH = 26;

  children.forEach((child, i) => {
    const cy = spacing * (i + 1) - nodeH/2;
    // Curved line
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    const sx = rootX + rootW, sy = rootY + rootH/2;
    const ex = startX, ey = cy + nodeH/2;
    path.setAttribute('d', `M${sx},${sy} C${sx+20},${sy} ${ex-20},${ey} ${ex},${ey}`);
    path.setAttribute('fill','none'); path.setAttribute('stroke', child.color || '#CBD5E1'); path.setAttribute('stroke-width','1.5');
    svg.appendChild(path);

    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','mindmap-clickable');
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x',startX); r.setAttribute('y',cy); r.setAttribute('width',nodeW); r.setAttribute('height',nodeH);
    r.setAttribute('rx','5'); r.setAttribute('fill',child.fill || '#F1F5F9');
    r.setAttribute('stroke',child.stroke || '#CBD5E1'); r.setAttribute('stroke-width','1');
    g.appendChild(r);
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',startX+nodeW/2); t.setAttribute('y',cy+nodeH/2+4);
    t.setAttribute('text-anchor','middle'); t.setAttribute('fill',child.color || '#475569');
    t.setAttribute('font-size','10'); t.setAttribute('font-weight','500');
    t.setAttribute('font-family','system-ui,sans-serif'); t.textContent = child.text;
    g.appendChild(t);
    svg.appendChild(g);

    // Second level if any
    if (child.children) {
      child.children.forEach((c2, j) => {
        const c2x = startX + nodeW + 20;
        const c2y = cy + (j - (child.children.length-1)/2) * 28;
        const p2 = document.createElementNS('http://www.w3.org/2000/svg','path');
        const c2sx = startX + nodeW, c2sy = cy + nodeH/2;
        p2.setAttribute('d', `M${c2sx},${c2sy} C${c2sx+12},${c2sy} ${c2x-12},${c2y+nodeH/2} ${c2x},${c2y+nodeH/2}`);
        p2.setAttribute('fill','none'); p2.setAttribute('stroke',c2.color||'#CBD5E1'); p2.setAttribute('stroke-width','1');
        svg.appendChild(p2);
        const g2 = document.createElementNS('http://www.w3.org/2000/svg','g');
        g2.setAttribute('class','mindmap-clickable');
        const r2 = document.createElementNS('http://www.w3.org/2000/svg','rect');
        r2.setAttribute('x',c2x); r2.setAttribute('y',c2y); r2.setAttribute('width',72); r2.setAttribute('height',nodeH);
        r2.setAttribute('rx','4'); r2.setAttribute('fill',c2.fill||'#F8FAFC');
        r2.setAttribute('stroke',c2.color||'#E2E8F0'); r2.setAttribute('stroke-width','1');
        g2.appendChild(r2);
        const t2 = document.createElementNS('http://www.w3.org/2000/svg','text');
        t2.setAttribute('x',c2x+36); t2.setAttribute('y',c2y+nodeH/2+4);
        t2.setAttribute('text-anchor','middle'); t2.setAttribute('fill','#475569');
        t2.setAttribute('font-size','9'); t2.setAttribute('font-family','system-ui,sans-serif');
        t2.textContent = c2.text;
        g2.appendChild(t2);
        svg.appendChild(g2);
      });
    }
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

function getAgentSteps(stageName) {
  const map = {
    '需求分析': [{ text:'读取需求文档', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'完整性检查', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981', children:[{text:'背景/目标',color:'#10B981',fill:'#ECFDF5'},{text:'验收标准',color:'#10B981',fill:'#ECFDF5'}] },{ text:'语义一致性', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'追溯性验证', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' }],
    '代码生成': [{ text:'读取规范', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'读取任务说明', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'预检查冲突', color:'#F59E0B', fill:'#FFFBEB', stroke:'#F59E0B' },{ text:'最小化实现', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'执行自我验证', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'分步提交', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'更新任务记录', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'上报结果', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' }],
    '代码审查': [{ text:'读取产出代码', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'规范检查', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'安全扫描', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'复杂度检查', color:'#EF4444', fill:'#FEF2F2', stroke:'#EF4444', children:[{text:'2处超标',color:'#EF4444',fill:'#FEF2F2'}] },{ text:'最佳实践', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' }],
    '单元测试': [{ text:'读取代码', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'生成测试用例', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'执行测试', color:'#EF4444', fill:'#FEF2F2', stroke:'#EF4444', children:[{text:'覆盖率62%',color:'#EF4444',fill:'#FEF2F2'}] },{ text:'生成报告', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' }],
    '质量检查': [{ text:'技术债务扫描', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'重复率分析', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'性能基线', color:'#F59E0B', fill:'#FFFBEB', stroke:'#F59E0B' }],
    '验收确认': [{ text:'DoD检查', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'合规审计', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'性能验证', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' }],
    '方案设计': [{ text:'分析需求', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'架构设计', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981', children:[{text:'模块划分',color:'#10B981',fill:'#ECFDF5'},{text:'接口定义',color:'#10B981',fill:'#ECFDF5'}] },{ text:'技术选型', color:'#F59E0B', fill:'#FFFBEB', stroke:'#F59E0B' }],
    '需求拆解': [{ text:'分析需求粒度', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'拆解子任务', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981', children:[{text:'6个子任务',color:'#10B981',fill:'#ECFDF5'}] },{ text:'依赖分析', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' }],
    '测试': [{ text:'读取代码', color:'#3B82F6', fill:'#EFF6FF', stroke:'#3B82F6' },{ text:'执行用例', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' },{ text:'覆盖率统计', color:'#10B981', fill:'#ECFDF5', stroke:'#10B981' }],
  };
  return map[stageName] || [{ text:'读取输入', color:'#3B82F6', fill:'#EFF6FF' },{ text:'执行任务', color:'#10B981', fill:'#ECFDF5' },{ text:'产出结果', color:'#10B981', fill:'#ECFDF5' }];
}

function renderSidePanel(task) {
  const panel = document.getElementById('sidePanel');
  if (!panel) return;
  const stageIdx = task.stageCurrent;
  const review = state.reviews.find(r => r.tid === task.id && r.status === 'pending');
  const stageName = stageIdx >= 0 ? task.stageNames[stageIdx] : '';
  const stageAssignee = task.stageAssignees ? task.stageAssignees[stageIdx] : null;
  const assignableUsers = stageOwners[stageName] || [];

  panel.innerHTML = `
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;">&#9737; 人工评审</div>
      ${review ? `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">评审人: ${review.reviewer}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">${review.desc}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-success btn-sm" onclick="submitReview('${review.id}','approved')">&#10003; 通过</button>
          <button class="btn btn-outline btn-sm" onclick="submitReview('${review.id}','changes')">&#9998; 需修改</button>
          <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="submitReview('${review.id}','rejected')">&#10007; 驳回</button>
        </div>
        <textarea placeholder="输入评审意见..." style="width:100%;margin-top:10px;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font);resize:vertical;min-height:60px;" id="reviewComment"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:6px;width:100%;" onclick="submitReviewWithComment('${review.id}')">提交评审意见</button>
      ` : `
        <div style="font-size:13px;color:var(--text-muted);">当前阶段无需人工评审</div>
        <button class="btn btn-outline btn-sm" style="margin-top:8px;width:100%;" onclick="requestReview()">&#9737; 请求评审</button>
      `}
      ${stageName && assignableUsers.length > 0 ? `
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">阶段负责人</div>
          <select class="side-owner-select" onchange="changeStageOwner('${task.id}', ${stageIdx}, this.value)" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font);background:var(--surface);">
            ${assignableUsers.map(u => `<option value="${u}" ${u === stageAssignee ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      ` : ''}
    </div>`;
}

function drawSideMindMap(stageName) {
  const container = document.getElementById('sideMindmap');
  if (!container) return;
  const w = container.clientWidth || 300, h = 170;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('width','100%'); svg.setAttribute('height',h);
  const children = getAgentSteps(stageName).slice(0, 4);
  const n = Math.min(children.length, 4);
  const spacing = w / (n + 1);
  children.forEach((c, i) => {
    const cx = spacing * (i + 1), cy = h/2;
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',20); line.setAttribute('y1',h/2); line.setAttribute('x2',cx-35); line.setAttribute('y2',cy);
    line.setAttribute('stroke','#CBD5E1'); line.setAttribute('stroke-width','1');
    svg.appendChild(line);
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x',cx-32); r.setAttribute('y',cy-14); r.setAttribute('width',64); r.setAttribute('height',28);
    r.setAttribute('rx','5'); r.setAttribute('fill',c.fill||'#F1F5F9'); r.setAttribute('stroke',c.color||'#CBD5E1'); r.setAttribute('stroke-width','1');
    g.appendChild(r);
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',cx); t.setAttribute('y',cy+4); t.setAttribute('text-anchor','middle');
    t.setAttribute('fill',c.color||'#475569'); t.setAttribute('font-size','9'); t.setAttribute('font-weight','500');
    t.setAttribute('font-family','system-ui,sans-serif'); t.textContent = c.text.length > 5 ? c.text.slice(0,5)+'..' : c.text;
    g.appendChild(t);
    svg.appendChild(g);
  });
  // Root
  const gr = document.createElementNS('http://www.w3.org/2000/svg','g');
  const rr = document.createElementNS('http://www.w3.org/2000/svg','rect');
  rr.setAttribute('x',2); rr.setAttribute('y',h/2-16); rr.setAttribute('width',16); rr.setAttribute('height',32); rr.setAttribute('rx','4');
  rr.setAttribute('fill','#EEF2FF'); rr.setAttribute('stroke','#4F46E5'); rr.setAttribute('stroke-width','1.5');
  gr.appendChild(rr);
  svg.appendChild(gr);
  container.innerHTML = ''; container.appendChild(svg);
}

function renderChat(task) {
  const msgs = document.getElementById('smartMessages');
  if (!msgs) return;
  const stageIdx = task.stageCurrent;
  const key = task.id + '-' + stageIdx;
  const conv = state.conversations[key] || [];
  msgs.innerHTML = conv.map(m => `
    <div class="chat-msg ${m.role}">
      <div class="avatar-sm ${m.role==='agent'?'agent':'human'}">${m.role==='agent'?'AI':'张'}</div>
      <div><div class="chat-bubble">${m.text}</div><div class="chat-meta">${m.role==='agent'?'Agent':'我'} · ${m.time}</div></div>
    </div>`).join('');
  // Scroll to bottom
  msgs.scrollTop = msgs.scrollHeight;
}

window.showNodeDetails = function(stageName, nodeName, color) {
  const tokenCount = Math.floor(Math.random() * 2000 + 500);
  const timeMs = Math.floor(Math.random() * 3000 + 500);
  const isPending = (color === '#F59E0B' || color === '#CBD5E1' || color === '#3B82F6');
  
  let contentHtml = '';
  if (isPending) {
    contentHtml = `
      <div style="padding:16px;">
        <div style="font-weight:600; color:var(--warning); margin-bottom:12px;">&#9888; 节点处于待执行/执行中状态</div>
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">您可以为 Agent 注入额外的上下文或干预执行策略：</div>
        <textarea placeholder="例如：等下生成代码时，重点关注一下边界条件或性能损耗..." style="width:100%; height:120px; padding:10px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:12px; font-family:var(--font); resize:none;"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:12px; width:100%;" onclick="toast('已成功注入干预指令'); document.getElementById('agentPanel').style.display='none';">注入执行上下文</button>
      </div>
    `;
  } else {
    contentHtml = `
      <div style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px; font-size:12px;">
        <div>
          <div style="font-weight:600; color:var(--text-secondary); margin-bottom:6px;">&#9881; 执行参数 (Meta)</div>
          <div style="display:flex; gap:10px; color:var(--text-muted);">
            <span class="tag tag-slate" style="font-family:var(--mono);">耗时: ${timeMs}ms</span>
            <span class="tag tag-slate" style="font-family:var(--mono);">Tokens: ${tokenCount}</span>
          </div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text-secondary); margin-bottom:6px;">&#10148; System Prompt (系统提示词)</div>
          <div class="code-block" style="padding:10px; background:#1E293B; color:#A5B4FC; font-size:11px;">You are an expert software engineer performing ${nodeName}. Analyze the context strictly and follow the DoD constraints...</div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text-secondary); margin-bottom:6px;">&#9737; Chain of Thought (思维链)</div>
          <div style="padding:10px; background:#F1F5F9; border-radius:var(--radius-sm); color:var(--text-secondary); line-height:1.5;">
            1. 解析输入参数...<br>
            2. 发现潜在依赖冲突，尝试调用 search_code 工具...<br>
            3. 工具返回无冲突，准备生成结构...<br>
            4. 最终完成格式化并返回。
          </div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text-secondary); margin-bottom:6px;">&#10003; Output (原始输出)</div>
          <div class="code-block" style="padding:10px; background:#1E293B; color:#6EE7B7; font-size:11px; white-space:pre-wrap; word-wrap:break-word;">{
  "status": "success",
  "data": "..."
}</div>
        </div>
      </div>
    `;
  }
  
  openSidebar({
    title: `${nodeName} ${isPending ? '干预' : '细节'}`,
    subtitle: `所属阶段: ${stageName}`,
    contentHtml: contentHtml,
    showInput: false
  });
};

window.goToArtifacts = function(artifactName) {
  const tabs = document.querySelectorAll('#stageDetailPanel .tab');
  let artifactsTab = null;
  tabs.forEach(t => {
    if (t.dataset.tab === 'artifacts') artifactsTab = t;
  });
  if (artifactsTab) {
    artifactsTab.click();
    setTimeout(() => {
      if (typeof previewArtifact === 'function') {
        previewArtifact(artifactName);
      }
    }, 50);
  } else {
    toast('当前阶段未找到产出物视图');
  }
};

function openVSCode() {
  // 使用 vscode://file/ 协议打开指定路径
  const projectPath = '/home/edwin/桌面/demo4.6/原型';
  const vscodeUrl = `vscode://file${projectPath}`;

  // 创建一个隐藏的链接并点击它
  const link = document.createElement('a');
  link.href = vscodeUrl;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 显示提示信息
  toast('正在使用 VSCode 打开项目...');
}

// 切换阶段负责人
function changeStageOwner(taskId, stageIdx, newOwner) {
  const task = getTask(taskId);
  if (!task) return;

  if (!task.stageAssignees) {
    task.stageAssignees = new Array(task.stageNames.length).fill('');
  }

  const oldOwner = task.stageAssignees[stageIdx];
  task.stageAssignees[stageIdx] = newOwner;

  const stageName = task.stageNames[stageIdx];
  addActivityLog(taskId, 'human-action', '👤', 'human', `「${stageName}」阶段负责人变更为 <strong>${newOwner}</strong>`);
  toast(`「${stageName}」阶段负责人已变更为 ${newOwner}`);
}

