// ============================================================
function renderGates(container) {
  const isGlobal = state.activePage === 'gates';
  let pageTitle = '研发追溯';
  let pageSubtitle, tasks;

  if (isGlobal) {
    tasks = state.tasks.filter(t => t.stageNames.length > 0);
    pageSubtitle = `全部项目 · ${tasks.length} 个任务的审计报告`;
  } else {
    const project = getProject(state.activeProjectId);
    tasks = getProjectTasks(state.activeProjectId).filter(t => t.stageNames.length > 0);
    pageSubtitle = `${project ? project.name : '未知项目'} · ${tasks.length} 个任务的审计报告`;
  }

  // 模拟检查结果描述
  const gateResults = {
    '需求完整性检查': '需求包含背景、目标、验收标准、非功能需求',
    '语义冲突检测': '未发现逻辑矛盾和术语不一致',
    '可追溯性检查': '需求到业务目标追溯链路完整',
    '架构合规检查': '方案符合架构规范，无偏离',
    '技术选型评估': '技术栈选型合理，风险可控',
    '编码规范检查': 'ESLint 0 errors, 0 warnings',
    '安全漏洞扫描': 'OWASP Top 10 无风险项',
    '代码复杂度检查': '圈复杂度 23 > 阈值 15',
    '最佳实践检测': '异常处理、资源释放规范',
    '覆盖率门禁': '行覆盖率 62% < 80%',
    '测试通过率': '2 个测试用例失败',
    '技术债务检查': '技术债务比率 0.8%',
    'DoD检查清单': '功能完成、测试通过、文档齐全',
    '合规审计检查': '数据安全、隐私合规通过',
    '粒度合理性检查': '子任务粒度均在 1-5 人天范围内',
    '依赖无环检测': '任务依赖关系无循环',
  };

  // 截图/证据文件名模拟
  const gateEvidenceFiles = {
    '需求完整性检查': '需求规格说明书 v2.1.pdf',
    '语义冲突检测': '语义分析报告.pdf',
    '可追溯性检查': '追溯矩阵.xlsx',
    '架构合规检查': '架构评审报告.pdf',
    '技术选型评估': '技术选型对比分析.xlsx',
    '编码规范检查': 'ESLint Report.html',
    '安全漏洞扫描': 'OWASP-Scan-Report.pdf',
    '代码复杂度检查': 'SonarQube复杂度报告.png',
    '最佳实践检测': 'CodeReview-Checklist.pdf',
    '覆盖率门禁': 'JaCoCo覆盖率报告.png',
    '测试通过率': 'JUnit-TestReport.xml',
    '技术债务检查': 'SonarQube技术债务报告.png',
    'DoD检查清单': 'DoD-Checklist.pdf',
    '合规审计检查': '合规审计报告.pdf',
    '粒度合理性检查': '任务拆分评估表.xlsx',
    '依赖无环检测': '依赖拓扑图.png',
  };

  // 计算统计概览
  let totalGates = 0, passedGates = 0, blockedTasks = 0;
  tasks.forEach(task => {
    let taskBlocked = false;
    task.stageNames.forEach((name, i) => {
      if (i > task.stageCurrent) return;
      const gates = task.stageGates[i] || [];
      gates.forEach((v, j) => {
        totalGates++;
        if (v === 1) passedGates++;
      });
    });
    if (task.stageCurrent >= 0 && task.stageGates[task.stageCurrent]) {
      if (task.stageGates[task.stageCurrent].some(g => g === 0)) taskBlocked = true;
    }
    if (taskBlocked) blockedTasks++;
  });
  const overallRate = totalGates > 0 ? Math.round(passedGates / totalGates * 100) : 0;

  function renderAuditCard(task) {
    const projectObj = getProject(task.pid);
    const projectName = projectObj ? projectObj.name : '未知项目';
    const now = new Date();
    const checkTime = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    let taskTotalGates = 0, taskPassedGates = 0, taskStagesDone = 0, taskBlockedCount = 0;
    const stageBlocks = [];

    task.stageNames.forEach((name, i) => {
      if (i > task.stageCurrent) return;
      const gates = task.stageGates[i] || [];
      const defs = state.gateDefs[name] || [];
      let stagePassed = 0, stageTotal = gates.length, stageBlocked = false;

      gates.forEach((v) => {
        taskTotalGates++;
        if (v === 1) { stagePassed++; taskPassedGates++; }
        else if (i === task.stageCurrent) stageBlocked = true;
      });

      if (i < task.stageCurrent) taskStagesDone++;
      if (stageBlocked) { taskBlockedCount++; }

      stageBlocks.push({ name, index: i, gates, defs, stagePassed, stageTotal, stageBlocked, isCurrent: i === task.stageCurrent, isCompleted: i < task.stageCurrent });
    });

    const taskRate = taskTotalGates > 0 ? Math.round(taskPassedGates / taskTotalGates * 100) : 0;

    const stageSections = stageBlocks.map(block => {
      const statusLabel = block.stageBlocked
        ? '<span style="color:var(--danger);font-weight:700;">&#10007; 阻断</span>'
        : (block.isCompleted || block.isCurrent)
          ? '<span style="color:var(--success);font-weight:700;">&#10003; 全部通过</span>'
          : '<span style="color:var(--text-muted);">待执行</span>';
      const statusSummary = ` (${block.stagePassed}/${block.stageTotal})`;

      const gateItems = block.defs.map((g, j) => {
        const val = block.gates[j];
        const passed = val === 1;
        const failed = val === 0 && block.isCurrent;
        const pending = val === 0 && !block.isCurrent;
        const icon = passed ? '&#10003;' : failed ? '&#10007;' : '&#9679;';
        const iconColor = passed ? 'var(--success)' : failed ? 'var(--danger)' : 'var(--text-muted)';
        const statusText = passed ? '通过' : failed ? '未通过' : '待执行';
        
        let resultDesc = gateResults[g.name] || (g.detail || '检测未通过');
        let evidenceFile = gateEvidenceFiles[g.name] || (g.name + ' 检测报告.pdf');

        if (task.pid === 'p5') {
          const p5GateResults = {
            '需求完整性检查': '包含大模型文档摘要、既定流转顺序、双核验下载及印章审计的公文管理系统需求规范检查已通过',
            '语义冲突检测': (function() {
              const r4 = state.reviews.find(r => r.id === 'r4');
              if (r4 && r4.status === 'approved') {
                const choiceA = r4.desc.includes('方案A') || r4.desc.includes('方案八');
                return `【行政干预解除】张经理决策：${choiceA ? '采用方案八（保留完整历史版本，保障合规审计，废止方案九）' : '采用方案九（自动覆盖最新，限制方案八的使用）'}`;
              }
              return '检测到第8条（保留历史版本）与第9条（单版本自动覆盖）存在根本语义冲突，门禁触发强力阻断';
            })(),
            '可追溯性检查': '已完成“双因子(2FA)下载”、“流转状态机”及“多级印章审批”到国家公文安全标准的双向追溯审计',
            '粒度合理性检查': '状态机控制、2FA模块、版本重构、印章审批等子任务粒度拆分均在1-3人天范围内，无超大任务',
            '依赖无环检测': '子任务状态流转及代码依赖关系分析完成，图拓扑排序验证无环路依赖',
            '架构合规检查': '阅件流转状态机采用强控制拦截切面，满足信创架构的流程强可审计性要求',
            '技术选型评估': '已验证国产OFD阅读器兼容性及基于国产自主SM2/SM3算法的电子签名与证书安全集成可行性',
            '编码规范检查': '电子签名组件及流转切面规范检查 0 errors, 0 warnings，规范评级 A',
            '安全漏洞扫描': 'OWASP 安全扫描 100% 通过，公开级公文防篡改沙箱及越权检查无任何中高危漏洞',
            '最佳实践检测': '双因子(2FA)验证会话生存周期及电子印章 SM2 签名私钥内存管理最佳实践合规检查全部通过',
            '覆盖率门禁': '状态机及2FA下载切面单元测试行覆盖率 88%，分支覆盖率 82%（均超过80%门限）',
            '测试通过率': '5项核心安全测试用例（2FA核验、顺序强控、登记防篡改、电子公章印章、冲突决策）全部通过',
            '技术债务检查': 'SonarQube 扫描技术债务比率 0.5%，评级 A，预计偿还时间 0.5h',
            'DoD检查清单': '公文摘要、流转强控、2FA、多级印章及版本回溯核心 DoD 验收条件全部达成',
            '合规审计检查': '公开级公文流转审计追溯完成，已生成安全电子印章日志与唯一档案归档编号 SEAL-2026-0038491'
          };
          
          const p5GateEvidenceFiles = {
            '需求完整性检查': '公文系统需求规格说明书.pdf',
            '语义冲突检测': '语义冲突一致性决策报告.pdf',
            '可追溯性检查': '公文系统追溯矩阵表.xlsx',
            '粒度合理性检查': '公文系统子任务拆解评估表.xlsx',
            '依赖无环检测': '公文系统任务依赖拓扑图.png',
            '架构合规检查': '公文系统架构合规评估报告.pdf',
            '技术选型评估': '国产算法及OFD选型对比分析.xlsx',
            '编码规范检查': '公文系统代码规范扫描报告.html',
            '安全漏洞扫描': '公文系统防篡改漏洞扫描报告.pdf',
            '最佳实践检测': '公文系统最佳实践合规度量.pdf',
            '覆盖率门禁': '公文单元测试覆盖率报告.png',
            '测试通过率': '测试用例证据报告.html',
            '技术债务检查': '公文系统SonarQube技术债务报告.png',
            'DoD检查清单': '公文系统DoD验收核对单.pdf',
            '合规审计检查': '公文系统合规审计及印章日志报告.pdf'
          };
          
          if (p5GateResults[g.name]) resultDesc = p5GateResults[g.name];
          if (p5GateEvidenceFiles[g.name]) evidenceFile = p5GateEvidenceFiles[g.name];
        }

        const detailHtml = failed
          ? `<div style="margin-top:3px;font-size:11px;color:var(--danger);line-height:1.5;">检查结果: ${resultDesc}</div>`
          : passed
            ? `<div style="margin-top:3px;font-size:11px;color:var(--text-secondary);line-height:1.5;">检查结果: ${resultDesc}</div>`
            : '';

        const evidenceHtml = (passed || failed)
          ? `<div style="margin-top:4px;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px dashed ${failed ? 'var(--danger)' : 'var(--border)'};border-radius:4px;font-size:11px;color:${failed ? 'var(--danger)' : 'var(--text-muted)'};background:${failed ? 'var(--danger-light)' : 'var(--bg)'};">
              <span style="font-size:14px;">&#128206;</span> ${evidenceFile}
            </div>`
          : '';

        return `<div style="padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:${iconColor};font-size:15px;line-height:1;font-weight:700;">${icon}</span>
            <span style="font-size:12px;font-weight:600;color:var(--text);">${g.name}</span>
            <span style="font-size:11px;color:${iconColor};font-weight:500;">${statusText}</span>
          </div>
          ${detailHtml}
          ${evidenceHtml}
        </div>`;
      }).join('');

      return `<div style="padding:16px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:8px;">
          <span style="color:var(--primary);font-size:13px;">${block.index + 1}.</span>
          ${block.name}
          <span style="margin-left:auto;font-size:12px;">${statusLabel}<span style="color:var(--text-muted);">${statusSummary}</span></span>
        </div>
        <div style="padding:10px 14px;background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border);">
          ${gateItems || '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">暂无检查项</div>'}
        </div>
      </div>`;
    }).join('');

    // 追溯链路
    const traceNodes = task.stageNames.map((name, i) => {
      if (i > task.stageCurrent) return null;
      const isBlocked = i === task.stageCurrent && task.stageGates[i] && task.stageGates[i].some(g => g === 0);
      const shortName = name.replace(/检查|检测|评估|确认/g, '');
      return isBlocked
        ? `<span style="color:var(--danger);font-weight:700;">${shortName}</span>`
        : `<span style="color:var(--success);">${shortName}</span>`;
    }).filter(Boolean);
    const blockedAtEnd = task.stageCurrent >= 0 && task.stageGates[task.stageCurrent] && task.stageGates[task.stageCurrent].some(g => g === 0);
    const traceChain = traceNodes.join(' <span style="color:var(--text-muted);margin:0 2px;">&#8594;</span> ') + (blockedAtEnd ? ' <span style="color:var(--danger);font-weight:700;font-size:11px;">[阻断]</span>' : '');

    return `<div class="card" style="margin-bottom:24px;border:1px solid var(--border);overflow:hidden;">
      <div style="padding:18px 22px;background:linear-gradient(135deg,#F8FAFC,#EFF6FF);border-bottom:1px solid var(--border);cursor:pointer;user-select:none;" onclick="toggleAuditCard(this)">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:17px;font-weight:700;color:var(--text);">审计报告: ${task.title}</div>
          <span class="audit-toggle" style="font-size:18px;color:var(--text-muted);transition:transform .2s;">&#9660;</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 20px;font-size:12px;color:var(--text-secondary);line-height:1.8;margin-top:6px;">
          <span>任务编号: <strong>${task.id}</strong></span>
          <span>类型: <strong>${task.type}</strong></span>
          <span>优先级: <strong>${task.priority}</strong></span>
          <span>预估: <strong>${task.estimate}</strong></span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 20px;font-size:12px;color:var(--text-secondary);line-height:1.8;margin-top:2px;">
          <span>项目: <strong>${projectName}</strong></span>
          <span>需求来源: <strong>${projectObj ? projectObj.desc : '产品规划'}</strong></span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 20px;font-size:12px;color:var(--text-muted);line-height:1.8;margin-top:2px;">
          <span>最后检查: <strong>${checkTime}</strong></span>
          <span>审计员: <strong>系统自动</strong></span>
          <span style="margin-left:auto;"><span class="tag ${taskBlockedCount>0?'tag-red':'tag-green'}">${taskBlockedCount>0?taskBlockedCount+' 项阻断':'全部通过'}</span> <span class="tag tag-slate">${taskRate}%</span></span>
        </div>
      </div>
      <div class="audit-body" style="max-height:0;overflow:hidden;transition:max-height .3s ease;">
        <div style="padding:6px 22px;">
          ${stageSections || '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">该任务尚未开始执行，暂无审计数据</div>'}
        </div>
        <div style="padding:14px 22px;background:var(--bg);border-top:1px solid var(--border);">
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:6px;">
            审计结论: ${taskStagesDone}/${task.stageNames.length} 阶段完成, ${taskBlockedCount} 项阻断, 总门禁通过率 ${taskRate}%
          </div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">
            追溯链路: ${traceChain || '<span style="color:var(--text-muted);">尚未开始</span>'}
          </div>
        </div>
      </div>
    </div>`;
  }

  const statsHtml = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
      <div class="stat-card">
        <div class="stat-icon indigo">&#128203;</div>
        <div><div class="stat-value">${tasks.length}</div><div class="stat-label">审计任务数</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon ${overallRate >= 80 ? 'green' : overallRate >= 50 ? 'amber' : 'red'}">&#9745;</div>
        <div><div class="stat-value">${overallRate}%</div><div class="stat-label">总审计通过率</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon ${blockedTasks > 0 ? 'amber' : 'green'}">&#9888;</div>
        <div><div class="stat-value">${blockedTasks}</div><div class="stat-label">阻断任务数</div></div>
      </div>
    </div>`;

  if (isGlobal) {
    // 全局模式：按项目分组展示
    const tasksByProject = {};
    tasks.forEach(t => {
      if (!tasksByProject[t.pid]) tasksByProject[t.pid] = [];
      tasksByProject[t.pid].push(t);
    });

    const projectCards = state.projects.map(p => {
      const pTasks = tasksByProject[p.id] || [];
      if (pTasks.length === 0) return '';

      let pTotalGates = 0, pPassedGates = 0, pBlockedTasks = 0;
      pTasks.forEach(task => {
        let taskBlocked = false;
        task.stageNames.forEach((name, i) => {
          if (i > task.stageCurrent) return;
          const gates = task.stageGates[i] || [];
          gates.forEach(v => { pTotalGates++; if (v === 1) pPassedGates++; });
        });
        if (task.stageCurrent >= 0 && task.stageGates[task.stageCurrent]) {
          if (task.stageGates[task.stageCurrent].some(g => g === 0)) taskBlocked = true;
        }
        if (taskBlocked) pBlockedTasks++;
      });
      const pRate = pTotalGates > 0 ? Math.round(pPassedGates / pTotalGates * 100) : 0;

      return `
        <div class="card" style="margin-bottom:20px;border:1px solid var(--border);overflow:hidden;">
          <div style="padding:16px 22px;background:linear-gradient(135deg,#F8FAFC,#EFF6FF);border-bottom:1px solid var(--border);cursor:pointer;user-select:none;" onclick="toggleProjectGateCard(this)">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="font-size:16px;font-weight:700;color:var(--text);">&#9632; ${p.name}</div>
              <span class="audit-toggle" style="font-size:18px;color:var(--text-muted);transition:transform .2s;">&#9660;</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px 20px;font-size:12px;color:var(--text-secondary);line-height:1.8;margin-top:6px;">
              <span>任务数: <strong>${pTasks.length}</strong></span>
              <span>通过率: <strong>${pRate}%</strong></span>
              <span>阻断: <strong>${pBlockedTasks}</strong></span>
              <span style="margin-left:auto;"><span class="tag ${pBlockedTasks>0?'tag-red':'tag-green'}">${pBlockedTasks>0?pBlockedTasks+' 项阻断':'全部通过'}</span></span>
            </div>
          </div>
          <div class="audit-body" style="max-height:0;overflow:hidden;transition:max-height .3s ease;">
            <div style="padding:12px 22px;">
              ${pTasks.map(t => renderAuditCard(t)).join('')}
            </div>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div><div style="font-size:22px;font-weight:700;">${pageTitle}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${pageSubtitle}</div></div>
        <button class="btn btn-primary btn-sm" onclick="refreshAllGates()">&#8635; 全部重新检查</button>
      </div>
      ${statsHtml}
      ${projectCards || '<div class="card"><div class="empty-state"><div>暂无任务数据</div></div></div>'}`;
  } else {
    // 项目模式：保持原有行为
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div><div style="font-size:22px;font-weight:700;">${pageTitle}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${pageSubtitle}</div></div>
        <button class="btn btn-primary btn-sm" onclick="refreshAllGates()">&#8635; 全部重新检查</button>
      </div>
      ${statsHtml}
      ${tasks.length === 0 ? '<div class="card"><div class="empty-state"><div>暂无任务数据</div></div></div>' : tasks.map(t => renderAuditCard(t)).join('')}`;
  }
}

function toggleAuditCard(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('.audit-toggle');
  if (body.style.maxHeight && body.style.maxHeight !== '0px') {
    body.style.maxHeight = '0px';
    arrow.style.transform = 'rotate(0deg)';
  } else {
    body.style.maxHeight = body.scrollHeight + 'px';
    arrow.style.transform = 'rotate(180deg)';
  }
}

function toggleProjectGateCard(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('.audit-toggle');
  if (body.style.maxHeight && body.style.maxHeight !== '0px') {
    body.style.maxHeight = '0px';
    arrow.style.transform = 'rotate(0deg)';
  } else {
    body.style.maxHeight = body.scrollHeight + 'px';
    arrow.style.transform = 'rotate(180deg)';
  }
}

function refreshAllGates() {
  toast('正在重新执行全部追溯检查...');
  setTimeout(() => {
    const isGlobal = state.activePage === 'gates';
    const tasksToRefresh = isGlobal ? state.tasks : getProjectTasks(state.activeProjectId);

    tasksToRefresh.forEach(task => {
      task.stageGates.forEach((gates, i) => {
        if (i <= task.stageCurrent && gates) {
          for (let j = 0; j < gates.length; j++) {
            if (gates[j] === 0 && Math.random() > 0.3) gates[j] = 1;
          }
        }
      });
    });
    toast('追溯检查完成');
    if (state.activePage === 'gates' || state.activePage === 'project-gates') {
      renderGates(document.getElementById('mainContent'));
    }
    updateBadges();
  }, 1200);
}
