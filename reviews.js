// ============================================================
function renderReviews(container) {
  let filteredReviews = state.reviews;
  let pageTitle = '评审中心';

  if (state.activePage === 'project-reviews' && state.activeProjectId) {
    const projectTasks = state.tasks.filter(t => t.pid === state.activeProjectId).map(t => t.id);
    filteredReviews = state.reviews.filter(r => projectTasks.includes(r.tid));
    pageTitle = '项目评审';
  }

  const pending = filteredReviews.filter(r => r.status === 'pending');
  const done = filteredReviews.filter(r => r.status !== 'pending');

  function renderReviewCard(r, showActions) {
    const task = getTask(r.tid);
    const project = task ? getProject(task.pid) : null;
    const projectName = project ? project.name : '未知项目';
    const taskTitle = task ? task.title : '未知任务';
    const statusTag = r.status === 'pending'
      ? '<span class="tag tag-amber">待评审</span>'
      : `<span class="tag ${r.status==='approved'?'tag-green':r.status==='changes_requested'?'tag-amber':'tag-red'}">${r.status==='approved'?'已通过':r.status==='changes_requested'?'需修改':'已驳回'}</span>`;

    const actionBtns = showActions && task ? `
      <div style="margin-top:10px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-xs" onclick="selectProject('${task.pid}');navigate('pipeline-view',{tid:'${r.tid}'});">查看详情</button>
        <button class="btn btn-success btn-xs" onclick="submitReview('${r.id}','approved')">&#10003; 快速通过</button>
      </div>` : showActions && !task ? `<div style="margin-top:10px;"><button class="btn btn-outline btn-xs" disabled>任务不存在</button></div>` : '';

    return `
      <div class="review-card">
        <div class="review-header"><div class="reviewer"><span class="status-dot ${r.status==='pending'?'amber':'green'}"></span> ${taskTitle} · ${r.stageName}</div>${statusTag}</div>
        <div style="font-size:12px;color:var(--text-muted);">项目: ${projectName} | 评审人: ${r.reviewer}</div>
        ${r.desc ? `<div style="font-size:12px;margin-top:6px;">${r.desc}</div>` : ''}
        ${actionBtns}
      </div>`;
  }

  container.innerHTML = `
    <div style="font-size:13px;color:var(--text-muted);">${pageTitle}</div>
    <div class="grid-2">
      <div class="card"><div class="card-title" style="margin-bottom:14px;">待我评审 (${pending.length})</div>
        ${pending.length === 0 ? '<div class="empty-state"><div>暂无待评审项</div></div>' : pending.map(r => renderReviewCard(r, true)).join('')}
      </div>
      <div class="card"><div class="card-title" style="margin-bottom:14px;">已完成评审 (${done.length})</div>
        ${done.length === 0 ? '<div class="empty-state"><div>暂无完成记录</div></div>' : done.map(r => renderReviewCard(r, false)).join('')}
      </div>
    </div>`;
}
