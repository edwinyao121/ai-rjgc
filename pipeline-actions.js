function sendMessage() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const task = getTask(state.activeTaskId);
  if (!task) return;
  const stageIdx = task.stageCurrent;
  const key = task.id + '-' + stageIdx;
  if (!state.conversations[key]) state.conversations[key] = [];
  state.conversations[key].push({ role:'user', text, time:m(0) });
  input.value = '';
  renderChat(task);
  // Simulate AI response
  const msgs = document.getElementById('chatMessages');
  if (chatTimeout) clearTimeout(chatTimeout);
  // Show typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg agent';
  typingEl.innerHTML = `<div class="avatar-sm agent">AI</div><div><div class="chat-bubble" style="color:var(--text-muted);">正在思考...</div></div>`;
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;
  chatTimeout = setTimeout(() => {
    typingEl.remove();
    const responses = [
      '好的，我来根据你的意见进行修改。已更新相关代码，并触发了增量门禁检查。',
      '理解你的需求。我已经调整了实现方案，现在的逻辑更清晰了。需要我再详细解释修改内容吗？',
      '已按照你的建议完成修改。产出物已更新，Harness 规则正在重新检查中...',
      '这个建议很好。我已经优化了这部分代码，现在性能应该会有明显改善。',
      '收到。我修改了对应的文件，保持了与其他模块的一致性。你可以预览最新的产出物。',
    ];
    const respText = responses[Math.floor(Math.random() * responses.length)];
    state.conversations[key].push({ role:'agent', text:respText, time:m(0) });
    renderChat(task);
    // Auto-fix a random gate
    if (task.stageGates[stageIdx]) {
      const failIdx = task.stageGates[stageIdx].findIndex(g => g === 0);
      if (failIdx >= 0) {
        setTimeout(() => {
          task.stageGates[stageIdx][failIdx] = 1;
          toast('增量门禁检查通过');
          renderTabContent(task, 'gates');
          renderPipelineGraph(task, {});
        }, 1500);
      }
    }
  }, 1500);
}

function openChatForFix() {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = '请帮我修复门禁失败的问题';
    sendMessage();
    input.focus();
  }
}

function autoFixGates(tid, stageIdx) {
  const task = getTask(tid);
  if (!task || !task.stageGates[stageIdx]) return;
  const stageName = task.stageNames[stageIdx];
  const agent = stageAgents[stageName] || { name: '未知 Agent', avatar: '🤖' };
  toast('Agent 正在自动修复门禁问题...');
  addActivityLog(tid, 'agent-work', agent.avatar, 'agent', `<strong>${agent.name}</strong> 开始自动修复「${stageName}」门禁问题`);
  const btn = document.querySelector('#stageDetailPanel .fix-gate-btn');
  if (btn) { btn.disabled = true; btn.textContent = '修复中...'; }

  // Simulate progress
  const progressInterval = setInterval(() => {
    // Fix gates one by one
    let allFixed = true;
    const gateDefs = state.gateDefs[stageName] || [];
    for (let i = 0; i < task.stageGates[stageIdx].length; i++) {
      if (task.stageGates[stageIdx][i] === 0) {
        if (Math.random() > 0.4) {
          task.stageGates[stageIdx][i] = 1;
          addActivityLog(tid, 'gate-check', '✓', 'gate', `门禁「${gateDefs[i]?.name || '检查'}」修复后 <strong>通过</strong>`);
        } else {
          allFixed = false;
        }
      }
    }
    renderTabContent(task, 'gates');
    renderPipelineGraph(task, {});
    if (allFixed) {
      clearInterval(progressInterval);
      if (btn) { btn.disabled = false; btn.textContent = '已修复'; btn.className = 'btn btn-success btn-sm fix-gate-btn'; }
      toast('全部门禁修复完成！');
      addActivityLog(tid, 'agent-work', '✓', 'agent', `<strong>${agent.name}</strong> 完成「${stageName}」门禁修复，全部通过`);
      state.timeline.unshift({ time: m(0), text: `Agent 自动修复了 <strong>${task.title}</strong> 的 ${stageName} 阶段门禁问题` });
    }
  }, 800);
}

function getStageGateResults(task, stageName, gateDefs) {
  if (task.perfectDemo) return gateDefs.map(() => 1);

  const newGates = gateDefs.map((g) => {
    if (g.type === 'fail' && Math.random() > 0.5) return 0;
    return 1;
  });
  if (stageName === '代码审查') newGates[2] = 0;
  if (stageName === '单元测试') newGates[0] = 0;
  return newGates;
}

const PERFECT_DEMO_STAGE_DELAY = 10000;

function getPerfectDemoActivityDetails(stageName) {
  const details = {
    '需求分析': ['读取 OFD 正文与附件元数据，生成公文摘要、办理事项和保密等级识别结果'],
    '需求拆解': ['拆解接收、审批、传阅、归档的既定流转顺序，并标记禁止逆向/越级流转约束'],
    '方案设计': ['确认双重身份核验方案：安全口令 + 动态验证码，并接入用印审批状态机'],
    '代码生成': ['生成流转状态机、用印审批单、电子签名确认和档案编号自动归档接口'],
    '代码审查': ['审查登记防篡改、历史版本保留、审批记录不可抵赖和敏感信息脱敏实现'],
    '单元测试': ['执行流转顺序、双重身份核验、用印后归档和历史版本回溯测试用例'],
    'UI测试': ['验证待用印文件在线预览、电子签名确认、下载二次核验和审批轨迹展示'],
    '生成制品': ['生成档案编号 DOC-2026-ARCHIVE-001，并归档申请单、审批记录、前后文件和审计报告'],
  };
  return details[stageName] || [`完成「${stageName}」业务校验与产出物确认`];
}

function runPerfectDemoTask(task) {
  if (!task.perfectDemo) return false;
  if (task._perfectDemoRunning) {
    toast('完美任务示例正在执行中');
    return true;
  }
  if (task.status === 'done') {
    toast('完美任务示例已通过全部阶段');
    return true;
  }

  const wasDone = task.status === 'done';
  task.status = 'executing';
  task.stageCurrent = 0;
  task.stages = task.stageNames.map(() => 0);
  task._perfectDemoRunning = true;
  addActivityLog(task.id, 'agent-work', '▶', 'agent', '启动公文管理系统完美任务演示：按阶段模拟摘要、流转、核验、用印、归档和审计闭环');

  task.stageNames.forEach((stageName, i) => {
    const delay = PERFECT_DEMO_STAGE_DELAY * (i + 1);
    setTimeout(() => {
      const gateDefs = state.gateDefs[stageName] || [];
      task.stageCurrent = i;
      task.stages[i] = 2;
      task.stageGates[i] = getStageGateResults(task, stageName, gateDefs);

      const agent = stageAgents[stageName] || { name: '未知 Agent', avatar: '🤖' };
      addActivityLog(task.id, 'agent-work', agent.avatar || '🤖', 'agent', `<strong>${agent.name}</strong> 执行「${stageName}」阶段`);
      getPerfectDemoActivityDetails(stageName).forEach(detail => {
        addActivityLog(task.id, 'agent-work', '•', 'agent', detail);
      });
      task.stageGates[i].forEach((g, gi) => {
        const gateName = gateDefs[gi]?.name || '检查';
        if (g === 1) addActivityLog(task.id, 'gate-check', '✓', 'gate', `门禁「${gateName}」<strong>通过</strong>`);
      });
      addActivityLog(task.id, 'agent-work', '✓', 'agent', `<strong>${agent.name}</strong> 完成「${stageName}」阶段`);

      if (i < task.stageNames.length - 1) {
        const nextName = task.stageNames[i + 1];
        const nextAgent = stageAgents[nextName] || { name: '未知 Agent' };
        const commKey = `${stageName}→${nextName}`;
        addActivityLog(task.id, 'agent-comm', '→', 'agent', `<strong>${agent.name}</strong> → <strong>${nextAgent.name}</strong>: ${agentCommMessages[commKey] || '传递产出物'}`);
      } else {
        task.status = 'done';
        task._perfectDemoRunning = false;

        const project = getProject(task.pid);
        if (!wasDone && project && project.stagesDone < project.stagesTotal) project.stagesDone++;

        addActivityLog(task.id, 'agent-work', '✓', 'agent', '公文流转、用印审批、双重身份核验、归档审计闭环全部通过');
        state.timeline.unshift({ time: m(0), text: `任务 <strong>${task.title}</strong> 已通过全部阶段与门禁` });
        toast('完美任务示例已通过全部阶段');
      }

      const container = document.getElementById('mainContent');
      renderPipeline(container, { tid: task.id });
      updateBadges();
    }, delay);
  });

  const firstStageName = task.stageNames[0];
  const firstAgent = stageAgents[firstStageName] || { name: '未知 Agent', avatar: '🤖' };
  addActivityLog(task.id, 'agent-work', firstAgent.avatar || '🤖', 'agent', `<strong>${firstAgent.name}</strong> 开始执行「${firstStageName}」阶段`);

  const container = document.getElementById('mainContent');
  renderPipeline(container, { tid: task.id });
  updateBadges();
  return true;
}

function advanceStage(task) {
  if (runPerfectDemoTask(task)) return;

  if (task.stageCurrent >= task.stageNames.length - 1) {
    toast('已是最后一个阶段', true); return;
  }
  if (task.stageCurrent >= 0 && task.stageGates[task.stageCurrent] && task.stageGates[task.stageCurrent].some(g => g === 0)) {
    showGateBlockedDialog(task);
    return;
  }

  const prevStageName = task.stageCurrent >= 0 ? task.stageNames[task.stageCurrent] : null;
  const prevAgent = prevStageName ? stageAgents[prevStageName] : null;

  if (task.stageCurrent >= 0) {
    task.stages[task.stageCurrent] = 2;
    // Log agent completion
    if (prevAgent) {
      addActivityLog(task.id, 'agent-work', '✓', 'agent', `<strong>${prevAgent.name}</strong> 完成「${prevStageName}」阶段`);
    }
  }
  task.stageCurrent++;
  if (task.status === 'planning') task.status = 'executing';
  task.stages[task.stageCurrent] = 0;

  const stageName = task.stageNames[task.stageCurrent];
  const agent = stageAgents[stageName] || { name: '未知 Agent', avatar: '🤖' };
  const gateDefs = state.gateDefs[stageName] || [];
  if (!task.stageGates[task.stageCurrent] || task.stageGates[task.stageCurrent].length === 0) {
    task.stageGates[task.stageCurrent] = gateDefs.map(() => 0);
  }
  const newGates = getStageGateResults(task, stageName, gateDefs);
  task.stageGates[task.stageCurrent] = newGates;

  // Log agent-to-agent communication
  if (prevAgent) {
    const commKey = `${prevStageName}→${stageName}`;
    addActivityLog(task.id, 'agent-comm', '→', 'agent', `<strong>${prevAgent.name}</strong> → <strong>${agent.name}</strong>: ${agentCommMessages[commKey] || '传递产出物'}`);
  }
  // Log new agent starting
  addActivityLog(task.id, 'agent-work', agent.avatar, 'agent', `<strong>${agent.name}</strong> 开始执行「${stageName}」阶段`);

  // Log gate results
  newGates.forEach((g, i) => {
    const gateName = gateDefs[i]?.name || '检查';
    if (g === 1) {
      addActivityLog(task.id, 'gate-check', '✓', 'gate', `门禁「${gateName}」<strong>通过</strong>`);
    } else {
      addActivityLog(task.id, 'gate-fail', '✗', 'fail', `门禁「${gateName}」<strong>阻断</strong> — ${gateDefs[i]?.desc || ''}`);
    }
  });

  if (!task.perfectDemo && ['方案设计','代码审查'].includes(stageName) && !state.reviews.find(r => r.tid === task.id && r.stage === task.stageCurrent)) {
    const reviewers = ['王工','李工','赵工','刘工'];
    const rv = { id:'r'+(reviewIdCounter++), tid:task.id, stage:task.stageCurrent, stageName, reviewer:reviewers[Math.floor(Math.random()*reviewers.length)], status:'pending', desc:`${stageName}阶段产出物需要人工评审确认` };
    state.reviews.push(rv);
    addActivityLog(task.id, 'human-action', '👤', 'human', `<strong>${rv.reviewer}</strong> 被分配为「${stageName}」评审人`);
    toast(`已自动创建 ${stageName} 评审任务，评审人: ${rv.reviewer}`);
  }

  state.timeline.unshift({ time: m(0), text: `任务 <strong>${task.title}</strong> 进入 <strong>${stageName}</strong> 阶段` });

  const project = getProject(task.pid);
  if (project && task.stageCurrent > project.stagesDone) project.stagesDone = task.stageCurrent;

  toast(`已进入 "${stageName}" 阶段`);

  if (task._animTimer) clearTimeout(task._animTimer);
  task._animRunning = true;
  task._animStageIdx = task.stageCurrent;

  const container = document.getElementById('mainContent');
  renderPipeline(container, { tid: task.id });
  updateBadges();

  function runAnim() {
    if (!task._animRunning || task.stageCurrent >= task.stageNames.length - 1) {
      task._animRunning = false;
      return;
    }
    const idx = task._animStageIdx;
    if (task.stages[idx] === 0) {
      const animStageName = task.stageNames[idx];
      const animAgent = stageAgents[animStageName] || { name: '未知 Agent', avatar: '🤖' };
      task.stages[idx] = 2;
      addActivityLog(task.id, 'agent-work', '✓', 'agent', `<strong>${animAgent.name}</strong> 完成「${animStageName}」阶段`);
      task._animStageIdx++;
      renderPipelineGraph(task, {});
      if (task._animStageIdx < task.stageNames.length) {
        const nextName = task.stageNames[task._animStageIdx];
        const nextAgent = stageAgents[nextName] || { name: '未知 Agent' };
        const commKey = `${animStageName}→${nextName}`;
        addActivityLog(task.id, 'agent-comm', '→', 'agent', `<strong>${animAgent.name}</strong> → <strong>${nextAgent.name}</strong>: ${agentCommMessages[commKey] || '传递产出物'}`);
task._animTimer = setTimeout(runAnim, 10000);
      } else {
        task._animRunning = false;
      }
    }
  }

  task._animTimer = setTimeout(runAnim, 10000);
}

function showGateBlockedDialog(task) {
  const stageName = task.stageNames[task.stageCurrent];
  const agent = stageAgents[stageName] || { name: '未知 Agent', avatar: '🤖' };
  const gateDefs = state.gateDefs[stageName] || [];
  const failedGates = task.stageGates[task.stageCurrent]
    .map((g, i) => g === 0 ? gateDefs[i] : null)
    .filter(Boolean);

  // Find the code generation stage index for rollback
  const codeGenIdx = task.stageNames.indexOf('代码生成');
  const canRollback = codeGenIdx >= 0 && task.stageCurrent > codeGenIdx;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="width:520px;">
      <h3 style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:24px;">&#9888;</span>
        门禁阻断 — ${stageName}
      </h3>
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
          <strong>${agent.name}</strong> 在「${stageName}」阶段遇到门禁阻断，无法继续推进：
        </div>
        ${failedGates.map(g => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--danger-light);border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid var(--danger);">
            <span style="color:var(--danger);font-weight:700;">&#10007;</span>
            <div>
              <div style="font-size:13px;font-weight:600;">${g.name}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${g.desc}</div>
              ${g.detail ? `<div style="font-size:11px;color:var(--danger);margin-top:4px;font-family:var(--mono);">${g.detail}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-bottom:16px;padding:14px;background:#F8FAFC;border-radius:var(--radius);border:1px solid var(--border);">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">&#9730; AI 建议</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">
          ${stageName === '代码审查' ? '代码复杂度超标，建议回退到代码生成阶段，由代码生成 Agent 自动重构相关代码后重新审查。' :
            stageName === '单元测试' ? '测试覆盖率不足，建议回退到代码生成阶段，由代码生成 Agent 补充代码后重新生成测试。' :
            '建议回退到代码生成阶段，由 Agent 修复问题后重新执行后续流程。'}
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${canRollback ? `
          <button class="btn btn-primary" onclick="agentRollbackToCodeGen('${task.id}')" style="flex:1;min-width:180px;">
            &#9730; 让 Agent 修复（回退到代码生成）
          </button>
        ` : ''}
        <button class="btn btn-success" onclick="skipGateAndAdvance('${task.id}')" style="flex:1;min-width:140px;">
          &#9654; 手动跳过门禁
        </button>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()" style="flex:1;min-width:80px;">
          取消
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function agentRollbackToCodeGen(taskId) {
  const task = getTask(taskId);
  if (!task) return;

  const currentStage = task.stageNames[task.stageCurrent];
  const codeGenIdx = task.stageNames.indexOf('代码生成');
  if (codeGenIdx < 0) { toast('未找到代码生成阶段', true); return; }

  const codeGenAgent = stageAgents['代码生成'] || { name: '代码生成 Agent', avatar: '💻' };
  const currentAgent = stageAgents[currentStage] || { name: '未知 Agent', avatar: '🤖' };

  // Close modal
  document.querySelector('.modal-overlay')?.remove();

  // Log the rollback decision
  addActivityLog(taskId, 'agent-comm', '↩', 'agent', `<strong>${currentAgent.name}</strong> → <strong>${codeGenAgent.name}</strong>: 门禁阻断，请求回退修复`);
  addActivityLog(taskId, 'human-action', '👤', 'human', `审批通过：回退到「代码生成」阶段进行修复`);

  // Reset stages from codeGenIdx+1 to current
  for (let i = codeGenIdx + 1; i <= task.stageCurrent; i++) {
    task.stages[i] = 0;
    if (task.stageGates[i]) {
      task.stageGates[i] = task.stageGates[i].map(() => 0);
    }
  }

  // Set current to code generation
  task.stageCurrent = codeGenIdx;
  task.stages[codeGenIdx] = 0; // Mark as in-progress

  // Reset code gen gates to all pass (simulating agent fixing)
  const codeGenGates = state.gateDefs['代码生成'] || [];
  task.stageGates[codeGenIdx] = codeGenGates.map(() => 1);

  // Start the repair animation
  toast('Agent 开始回退修复...');
  addActivityLog(taskId, 'agent-work', codeGenAgent.avatar, 'agent', `<strong>${codeGenAgent.name}</strong> 开始修复代码，解决门禁阻断问题`);

  const container = document.getElementById('mainContent');
  renderPipeline(container, { tid: taskId });
  updateBadges();

  // Simulate agent repair process
  setTimeout(() => {
    task.stages[codeGenIdx] = 2; // Mark code gen as done
    addActivityLog(taskId, 'agent-work', '✓', 'agent', `<strong>${codeGenAgent.name}</strong> 完成代码修复`);

    // Re-advance through subsequent stages
    const stagesToRedo = [];
    for (let i = codeGenIdx + 1; i <= task.stageNames.length - 1; i++) {
      stagesToRedo.push(i);
    }

    let delay = 0;
    stagesToRedo.forEach((stageIdx, seq) => {
      delay += 1200;
      setTimeout(() => {
        const sName = task.stageNames[stageIdx];
        const sAgent = stageAgents[sName] || { name: '未知 Agent', avatar: '🤖' };
        const prevName = stageIdx > 0 ? task.stageNames[stageIdx - 1] : null;
        const prevAgent = prevName ? stageAgents[prevName] : null;

        // Mark previous as done
        if (stageIdx > 0) task.stages[stageIdx - 1] = 2;
        task.stageCurrent = stageIdx;
        task.stages[stageIdx] = 0;

        // Generate gates with better odds (agent fixed the issues)
        const gateDefs = state.gateDefs[sName] || [];
        const newGates = gateDefs.map((g, i) => {
          // Code review complexity check now passes after fix
          if (sName === '代码审查' && g.name === '代码复杂度检查') return 1;
          // Unit test coverage now passes after fix
          if (sName === '单元测试' && g.name === '覆盖率门禁') return 1;
          if (g.type === 'fail' && Math.random() > 0.7) return 0;
          return 1;
        });
        task.stageGates[stageIdx] = newGates;

        // Log communication
        if (prevAgent) {
          const commKey = `${prevName}→${sName}`;
          addActivityLog(taskId, 'agent-comm', '→', 'agent', `<strong>${prevAgent.name}</strong> → <strong>${sAgent.name}</strong>: ${agentCommMessages[commKey] || '传递产出物'}`);
        }
        addActivityLog(taskId, 'agent-work', sAgent.avatar, 'agent', `<strong>${sAgent.name}</strong> 开始执行「${sName}」阶段`);

        // Log gate results
        newGates.forEach((g, i) => {
          const gateName = gateDefs[i]?.name || '检查';
          if (g === 1) {
            addActivityLog(taskId, 'gate-check', '✓', 'gate', `门禁「${gateName}」<strong>通过</strong>`);
          } else {
            addActivityLog(taskId, 'gate-fail', '✗', 'fail', `门禁「${gateName}」<strong>阻断</strong>`);
          }
        });

        renderPipelineGraph(task, {});

        // If last stage, mark as done
        if (stageIdx === task.stageNames.length - 1) {
          setTimeout(() => {
            task.stages[stageIdx] = 2;
            addActivityLog(taskId, 'agent-work', '✓', 'agent', `<strong>${sAgent.name}</strong> 完成「${sName}」阶段`);
            addActivityLog(taskId, 'agent-work', '✅', 'agent', `全部阶段修复完成，流水线已恢复`);
            renderPipelineGraph(task, {});
            toast('Agent 修复完成，流水线已恢复！');
            state.timeline.unshift({ time: m(0), text: `Agent 修复了 <strong>${task.title}</strong> 的门禁问题，流水线已恢复` });
          }, 1200);
        }
      }, delay);
    });
  }, 2000);
}

function skipGateAndAdvance(taskId) {
  const task = getTask(taskId);
  if (!task) return;

  // Close modal
  document.querySelector('.modal-overlay')?.remove();

  const stageName = task.stageNames[task.stageCurrent];
  const agent = stageAgents[stageName] || { name: '未知 Agent' };

  // Force pass all gates
  if (task.stageGates[task.stageCurrent]) {
    task.stageGates[task.stageCurrent] = task.stageGates[task.stageCurrent].map(() => 1);
  }

  addActivityLog(taskId, 'human-action', '👤', 'human', `手动跳过「${stageName}」阶段门禁`);
  toast('已手动跳过门禁');

  // Now advance
  renderPipelineGraph(task, {});
  advanceStage(task);
}

function submitReview(rid, decision) {
  const review = state.reviews.find(r => r.id === rid);
  if (!review) return;
  review.status = decision === 'approved' ? 'approved' : (decision === 'changes' ? 'changes_requested' : 'rejected');
  const decisionLabel = decision === 'approved' ? '通过' : (decision === 'changes' ? '需修改' : '驳回');
  toast(`评审已${decisionLabel}`);

  // Log human action
  addActivityLog(review.tid, 'human-action', '👤', 'human', `<strong>${review.reviewer}</strong> 对「${review.stageName}」评审: <strong>${decisionLabel}</strong>`);

  // If approved, check if all reviews for this task are approved
  if (decision === 'approved') {
    const task = getTask(review.tid);
    if (task) {
      // Check if there are any remaining pending reviews for this task
      const pendingReviews = state.reviews.filter(r => r.tid === task.id && r.status === 'pending');
      const hasRejected = state.reviews.some(r => r.tid === task.id && r.status === 'rejected');

      if (pendingReviews.length === 0 && !hasRejected) {
        // All reviews passed - auto advance
        addActivityLog(task.id, 'agent-comm', '✓', 'agent', `全部评审通过，流水线自动推进`);
        state.timeline.unshift({ time: m(0), text: `<strong>${task.title}</strong> 的全部评审已通过，流水线自动推进` });

        // Check if gates are all passed before advancing
        const gatesOk = !task.stageGates[task.stageCurrent] || !task.stageGates[task.stageCurrent].some(g => g === 0);
        if (gatesOk) {
          setTimeout(() => {
            toast('全部评审通过，自动推进到下一阶段');
            advanceStage(task);
          }, 800);
        } else {
          toast('评审已通过，但当前阶段门禁未通过，需先修复门禁');
        }
      } else if (pendingReviews.length > 0) {
        toast(`还有 ${pendingReviews.length} 项评审待完成`);
      }
    }
  }

  state.timeline.unshift({ time: m(0), text: `${review.reviewer} ${decisionLabel}了 <strong>${getTask(review.tid)?.title||''}</strong> 的 ${review.stageName} 评审` });
  const container = document.getElementById('mainContent');
  if (state.activePage === 'pipeline-view') {
    const task = getTask(state.activeTaskId);
    if (task) renderPipeline(container, { tid: task.id });
  } else if (state.activePage === 'reviews') {
    renderReviews(container);
  }
  updateBadges();
}

function submitReviewWithComment(rid) {
  const comment = document.getElementById('reviewComment')?.value?.trim();
  if (comment) {
    state.timeline.unshift({ time: m(0), text: `评审意见: ${comment}` });
  }
  submitReview(rid, comment ? 'changes' : 'approved');
}

function resolveConflictReview(rid, choice) {
  const review = state.reviews.find(r => r.id === rid);
  if (!review) return;
  
  const choiceText = choice === 'A' 
    ? '【已决策】采用方案八（保留完整历史版本，确保审计可追溯，废止方案九）' 
    : '【已决策】采用方案九（自动覆盖仅保留最新，限制方案八的使用）';
    
  review.status = 'approved';
  review.desc += '<br><br><strong style="color:var(--success);">' + choiceText + '</strong>';
  
  const task = getTask(review.tid);
  if (task) {
    // Clear the semantic conflict gate (index 1 of stage 0)
    if (task.stageGates[0]) {
      task.stageGates[0][1] = 1;
    }
    
    // Log human action
    addActivityLog(task.id, 'human-action', '👤', 'human', `项目负责人张经理进行行政干预决策：<strong>${choiceText}</strong>`);
    
    toast('行政决策成功！语义一致性冲突已消除，门禁阻断已清空！');
  }
  
  // Set project p5 status to running
  const project = state.projects.find(p => p.id === 'p5');
  if (project) {
    project.status = 'running';
  }
  
  state.timeline.unshift({ time: m(0), text: `项目负责人张经理通过行政干预化解了 <strong>公文管理系统</strong> 的需求语义冲突` });
  
  const container = document.getElementById('mainContent');
  if (state.activePage === 'pipeline-view') {
    if (task) renderPipeline(container, { tid: task.id });
  } else if (state.activePage === 'reviews' || state.activePage === 'project-reviews') {
    renderReviews(container);
  } else if (state.activePage === 'dashboard') {
    renderDashboard(container);
  }
  updateBadges();
}

function requestReview() {
  const task = getTask(state.activeTaskId);
  if (!task) return;
  const stageName = task.stageNames[task.stageCurrent] || '未知';
  const rv = { id:'r'+(reviewIdCounter++), tid:task.id, stage:task.stageCurrent, stageName, reviewer:'王工', status:'pending', desc:'手动请求人工评审' };
  state.reviews.push(rv);
  addActivityLog(task.id, 'human-action', '👤', 'human', `<strong>${rv.reviewer}</strong> 被分配为「${stageName}」评审人（手动请求）`);
  toast(`已请求 ${rv.reviewer} 进行评审`);
  updateBadges();
  const container = document.getElementById('mainContent');
  renderPipeline(container, { tid: task.id });
}
