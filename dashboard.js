function renderDashboard(container) {
  const tasks = getProjectTasks(state.activeProjectId);
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const execCount = tasks.filter(t => t.status === 'executing' || t.status === 'review').length;
  const blockedCount = tasks.filter(t => {
    if (t.stageCurrent < 0 || !t.stageGates[t.stageCurrent]) return false;
    return t.stageGates[t.stageCurrent].some(g => g === 0);
  }).length;
  const totalProjects = state.projects.length;

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" onclick="navigate('projects')">
        <div class="stat-icon indigo">&#9632;</div><div><div class="stat-value">${totalProjects}</div><div class="stat-label">活跃项目</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">&#10003;</div><div><div class="stat-value">${doneCount+11}</div><div class="stat-label">已完成任务</div></div>
      </div>
      <div class="stat-card" onclick="navigate('gates')">
        <div class="stat-icon amber">&#9888;</div><div><div class="stat-value">${blockedCount+2}</div><div class="stat-label">门禁阻塞</div></div>
      </div>
      <div class="stat-card" onclick="navigate('kanban')">
        <div class="stat-icon blue">&#8635;</div><div><div class="stat-value">${execCount}</div><div class="stat-label">进行中任务</div></div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon green">&#9745;</div><div><div class="stat-value">91.7%</div><div class="stat-label">门禁通过率</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber">&#9203;</div><div><div class="stat-value">8.5 天</div><div class="stat-label">需求交付周期</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo">&#129302;</div><div><div class="stat-value">596</div><div class="stat-label">AI 代码提交数</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">&#9888;</div><div><div class="stat-value">3.2%</div><div class="stat-label">缺陷逃逸率</div></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div><div class="card-title">最近项目</div><div class="card-subtitle">点击项目查看详情</div></div><button class="btn btn-outline btn-sm" onclick="navigate('projects')">查看全部</button></div>
        <table>${state.projects.map(p => `
          <tr>
            <td class="project-name" onclick="selectProject('${p.id}')">&#9632; ${p.name}</td>
            <td><div style="display:flex;align-items:center;gap:6px;"><div class="progress-bar" style="width:100px;"><div class="fill ${p.status==='blocked'?'red':p.status==='done'?'green':'indigo'}" style="width:${Math.round(p.stagesDone/p.stagesTotal*100)}%;"></div></div><span style="font-size:12px;">${p.stagesDone}/${p.stagesTotal}</span></div></td>
            <td><span class="status-dot ${p.status==='running'?'green':p.status==='blocked'?'red':'amber'}"></span>${p.status==='running'?'全部通过':p.status==='blocked'?'有阻断':'评审中'}</td>
            <td style="color:var(--text-muted);">${p.status==='done'?'1天前':p.status==='blocked'?'3小时前':'5分钟前'}</td>
          </tr>`).join('')}</table>
      </div>
      <div class="card">
        <div class="card-header"><div><div class="card-title">实时动态</div><div class="card-subtitle">平台事件时间线</div></div></div>
        <div class="timeline">${state.timeline.map(t => `<div class="timeline-item"><div class="time">${t.time}</div><div class="desc">${t.text}</div></div>`).join('')}</div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">门禁健康度</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${['需求分析','方案设计','代码生成','代码审查','单元测试','质量检查'].map(s => {
            const pct = Math.floor(Math.random()*20+80);
            return `<div style="display:flex;align-items:center;gap:12px;">
              <div style="width:70px;font-size:12px;color:var(--text-secondary);text-align:right;">${s}</div>
              <div class="progress-bar" style="flex:1;"><div class="fill ${pct>=90?'green':pct>=80?'indigo':'red'}" style="width:${pct}%;"></div></div>
              <div style="width:40px;font-size:12px;font-weight:600;text-align:right;">${pct}%</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">本周趋势</div>
        <table>
          <tr><td>新增任务</td><td style="font-weight:600;">+12</td><td><span class="tag tag-green">+20%</span></td></tr>
          <tr><td>完成任务</td><td style="font-weight:600;">8</td><td><span class="tag tag-green">+15%</span></td></tr>
          <tr><td>门禁阻断</td><td style="font-weight:600;">3</td><td><span class="tag tag-red">+50%</span></td></tr>
          <tr><td>代码提交</td><td style="font-weight:600;">156</td><td><span class="tag tag-green">+8%</span></td></tr>
          <tr><td>AI 代码提交</td><td style="font-weight:600;">72</td><td><span class="tag tag-green">+25%</span></td></tr>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div><div class="card-title">需要关注</div><div class="card-subtitle">当前阻塞的门禁项</div></div></div>
      <table>
        <thead><tr><th>项目</th><th>任务</th><th>阶段</th><th>门禁规则</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr>
            <td>${getProject('p3').name}</td><td>UC-102 权限模块重构</td><td>单元测试</td><td>覆盖率门禁（80%）</td>
            <td><span class="tag tag-red">阻断</span></td>
            <td><button class="btn btn-outline btn-xs" onclick="selectProject('p3');navigate('pipeline-view',{tid:'t8'});">查看详情</button></td>
          </tr>
          <tr>
            <td>${getProject('p1').name}</td><td>ST-081 查询引擎优化</td><td>代码审查</td><td>代码复杂度检查</td>
            <td><span class="tag tag-red">阻断</span></td>
            <td><button class="btn btn-outline btn-xs" onclick="navigate('pipeline-view',{tid:'t1'});">查看详情</button></td>
          </tr>
          <tr>
            <td>${getProject('p2').name}</td><td>GW-045 限流策略优化</td><td>方案设计</td><td>架构合规检查</td>
            <td><span class="tag tag-amber">警告</span></td>
            <td><button class="btn btn-outline btn-xs" onclick="selectProject('p2');navigate('pipeline-view',{tid:'t7'});">等待评审</button></td>
          </tr>
        </tbody>
      </table>
    </div>`;
}
