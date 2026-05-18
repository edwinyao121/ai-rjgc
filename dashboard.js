function renderDashboard(container) {
  const pendingReviews = state.reviews.filter(r => r.status === 'pending');
  const blockedTasks = state.tasks.filter(t => {
    if (t.stageCurrent < 0 || !t.stageGates[t.stageCurrent]) return false;
    return t.stageGates[t.stageCurrent].some(g => g === 0);
  });

  // Create live feed items by repeating state.timeline to make it scroll
  const feedItems = state.timeline.map(t => {
    const isWarn = t.text.includes('阻断') || t.text.includes('失败');
    const isSuccess = t.text.includes('通过') || t.text.includes('完成');
    const msgClass = isWarn ? 'warn' : (isSuccess ? 'highlight' : '');
    return `<div class="feed-item"><div class="feed-time">${t.time}</div><div class="feed-msg ${msgClass}">${t.text}</div></div>`;
  });
  const doubleFeed = [...feedItems, ...feedItems].join('');

  container.innerHTML = `
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-card">
        <h2>欢迎来到智能协同指挥中心</h2>
        <p>基于 Agent 驱动的下一代软件研发范式。在这里，您可以通过"可视、可信、可控"的端到端流水线，轻松完成复杂的软件交付。</p>
        <div class="hero-steps">
          <div class="hero-step" onclick="navigate('projects')">
            <div class="hero-step-icon">&#128736;</div>
            <div>1. 建立项目</div>
            <div style="font-weight:400;opacity:0.8;font-size:11px;">创建项目空间，导入需求</div>
          </div>
          <div class="hero-step" onclick="navigate('rules-config')">
            <div class="hero-step-icon">&#128302;</div>
            <div>2. 设定门禁</div>
            <div style="font-weight:400;opacity:0.8;font-size:11px;">配置质控与安全护栏</div>
          </div>
          <div class="hero-step" onclick="navigate('projects')">
            <div class="hero-step-icon">&#128640;</div>
            <div>3. 启动流水线</div>
            <div style="font-weight:400;opacity:0.8;font-size:11px;">AI 自动推演，人类决策</div>
          </div>
        </div>
      </div>

      <div class="action-card">
        <div style="font-weight:700;font-size:16px;">我的待办 (Action Center)</div>
        <div class="action-list">
          ${pendingReviews.length > 0 ? `
            <div class="action-item" onclick="navigate('reviews')">
              <div class="action-icon todo">&#9737;</div>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:600;">有 ${pendingReviews.length} 项评审待处理</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">点击前往评审中心</div>
              </div>
              <div style="color:var(--text-muted);font-size:16px;">&#8250;</div>
            </div>` : ''}
          ${blockedTasks.length > 0 ? `
            <div class="action-item" onclick="navigate('gates')">
              <div class="action-icon urgent">&#9888;</div>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:600;">有 ${blockedTasks.length} 个门禁被阻断</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">需要您的人工干预</div>
              </div>
              <div style="color:var(--text-muted);font-size:16px;">&#8250;</div>
            </div>` : ''}
          ${pendingReviews.length === 0 && blockedTasks.length === 0 ? `
            <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">
              <div style="font-size:24px;margin-bottom:8px;">&#127881;</div>
              目前没有需要紧急处理的待办项
            </div>` : ''}
        </div>
      </div>
    </div>

    <!-- Value Triad Section -->
    <div class="triad-grid">
      <!-- 可视 -->
      <div class="triad-col">
        <div class="triad-header blue">&#128065; 可视 (Observability)</div>
        <div class="triad-card">
          <div class="triad-metric">
            <div><div class="triad-metric-val blue">12.5k</div><div class="triad-metric-label">今日 Agent 生成代码行数</div></div>
            <div><div class="triad-metric-val blue">342</div><div class="triad-metric-label">活跃智能体调用</div></div>
          </div>
        </div>
        <div class="live-feed-box">
          <div style="position:absolute;top:0;left:0;right:0;height:30px;background:linear-gradient(to bottom, #1E293B, transparent);z-index:2;"></div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(to top, #1E293B, transparent);z-index:2;"></div>
          <div class="live-feed-inner">
            ${doubleFeed}
          </div>
        </div>
      </div>

      <!-- 可信 -->
      <div class="triad-col">
        <div class="triad-header green">&#128175; 可信 (Verifiability)</div>
        <div class="triad-card">
          <div class="triad-metric">
            <div><div class="triad-metric-val green">98.2%</div><div class="triad-metric-label">全局门禁通过率</div></div>
            <div><div class="triad-metric-val green">100%</div><div class="triad-metric-label">需求可追溯性</div></div>
          </div>
        </div>
        <div class="card" style="flex:1;display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px;">六大质量门禁健康度</div>
          ${['架构合规检查','安全漏洞扫描','代码规范校验','测试覆盖率(>80%)','技术债务评估','制品防伪签章'].map(s => {
            const pct = Math.floor(Math.random()*15+85);
            return `<div style="display:flex;align-items:center;gap:12px;">
              <div style="width:110px;font-size:12px;color:var(--text-secondary);">${s}</div>
              <div class="progress-bar" style="flex:1;"><div class="fill ${pct>=95?'green':'indigo'}" style="width:${pct}%;"></div></div>
              <div style="width:30px;font-size:12px;font-weight:600;text-align:right;">${pct}%</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- 可控 -->
      <div class="triad-col">
        <div class="triad-header orange">&#127918; 可控 (Controllability)</div>
        <div class="triad-card">
          <div class="triad-metric">
            <div><div class="triad-metric-val orange">15</div><div class="triad-metric-label">本周人工干预次数</div></div>
            <div><div class="triad-metric-val orange">42</div><div class="triad-metric-label">已通过架构评审</div></div>
          </div>
        </div>
        <div class="card" style="flex:1;display:flex;flex-direction:column;">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px;">高危节点追踪</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${blockedTasks.slice(0, 3).map(t => `
              <div style="padding:10px;border:1px solid var(--danger-light);background:#FEF2F2;border-radius:var(--radius-sm);">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-size:12px;font-weight:600;color:var(--danger);">${t.title}</span>
                  <span class="tag tag-red">阻断</span>
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">触发了强控门禁，Agent 执行已挂起</div>
                <button class="btn btn-primary btn-xs" onclick="selectProject('${t.pid}');navigate('pipeline-view',{tid:'${t.id}'})">立即干预</button>
              </div>
            `).join('')}
            ${blockedTasks.length === 0 ? `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px;">当前无高危节点，系统运行平稳</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Projects Section -->
    <div class="card" style="margin-top:24px;">
      <div class="card-header"><div><div class="card-title">活跃项目空间</div><div class="card-subtitle">点击快速进入研发面板</div></div><button class="btn btn-outline btn-sm" onclick="navigate('projects')">查看所有项目</button></div>
      <table>
        ${state.projects.map(p => `
          <tr style="cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'" onclick="selectProject('${p.id}');navigate('kanban');">
            <td class="project-name" style="width:30%;padding:12px;">&#9632; ${p.name}</td>
            <td style="width:30%;padding:12px;"><div style="display:flex;align-items:center;gap:6px;"><div class="progress-bar" style="width:100px;"><div class="fill ${p.status==='blocked'?'red':p.status==='done'?'green':'indigo'}" style="width:${Math.round(p.stagesDone/p.stagesTotal*100)}%;"></div></div><span style="font-size:12px;">${p.stagesDone}/${p.stagesTotal} 阶段</span></div></td>
            <td style="padding:12px;"><span class="status-dot ${p.status==='running'?'green':p.status==='blocked'?'red':'amber'}"></span>${p.status==='running'?'运行中':p.status==='blocked'?'有阻断':'评审中'}</td>
            <td style="color:var(--text-muted);text-align:right;padding:12px;">${p.members} 人参与</td>
          </tr>`).join('')}
      </table>
    </div>
  `;
}
