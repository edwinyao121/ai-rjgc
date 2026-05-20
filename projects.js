// ============================================================
// PROJECTS PAGE
// ============================================================
function renderProjects(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:13px;color:var(--text-muted);">管理所有智能研发项目</div></div>
      <button class="btn btn-primary" onclick="showNewProjectModal()">+ 新建项目</button>
    </div>
    <div class="grid-3" id="projectGrid"></div>`;
  renderProjectCards();
}

function renderProjectCards() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;
  grid.innerHTML = state.projects.map(p => `
    <div class="card card-hover" style="cursor:pointer;" onclick="selectProject('${p.id}');navigate('kanban');">
      <div class="card-header">
        <div><div class="card-title">&#9632; ${p.name}</div><div class="card-subtitle">${p.desc}</div></div>
        <span class="tag ${p.status==='running'?'tag-green':p.status==='reviewing'?'tag-amber':p.status==='blocked'?'tag-red':'tag-slate'}">${p.status==='running'?'运行中':p.status==='reviewing'?'评审中':p.status==='blocked'?'阻塞':'已完成'}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">关联仓库: ${p.repo}</div>
      <div class="progress-bar" style="margin-bottom:8px;"><div class="fill ${p.status==='blocked'?'red':p.status==='done'?'green':'indigo'}" style="width:${Math.round(p.stagesDone/p.stagesTotal*100)}%;"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);"><span>${p.stagesDone}/${p.stagesTotal} 阶段完成</span><span>成员 ${p.members}人</span></div>
    </div>`).join('') + `
    <div class="card" style="cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:200px;border:2px dashed var(--border);" onclick="showNewProjectModal()">
      <div style="text-align:center;color:var(--text-muted);"><div style="font-size:32px;">+</div><div>新建项目空间</div></div>
    </div>`;
}

function selectProject(pid) {
  state.activeProjectId = pid;
}

function showNewProjectModal() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>新建项目空间</h3>
      <div class="form-group"><label>项目名称</label><input type="text" id="npName" placeholder="输入项目名称"></div>
      <div class="form-group"><label>项目描述</label><textarea id="npDesc" rows="2" placeholder="简要描述项目目标与范围"></textarea></div>
      <div class="form-group"><label>关联代码仓库</label><input type="text" id="npRepo" placeholder="https://github.com/org/repo.git"></div>
      <div class="form-group"><label>添加成员</label><input type="text" id="npMembers" placeholder="搜索用户或输入邮箱（逗号分隔）..."></div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" id="btnCreateProject">创建项目</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('btnCreateProject').addEventListener('click', () => {
    const name = document.getElementById('npName').value.trim();
    if (!name) { toast('请输入项目名称', true); return; }
    const desc = document.getElementById('npDesc').value.trim() || '未填写描述';
    const repo = document.getElementById('npRepo').value.trim() || '未关联仓库';
    const members = document.getElementById('npMembers').value.trim() ? 3 : 1;
    const id = 'p' + (state.projects.length + 1);
    state.projects.push({ id, name, desc, repo, members, status:'running', stagesDone:0, stagesTotal:8 });
    toast(`项目 "${name}" 创建成功`);
    overlay.remove();
    if (state.activePage === 'projects') { renderProjectCards(); } else { navigate('projects'); }
    updateBadges();
  });
}
