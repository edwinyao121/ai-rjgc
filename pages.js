// ============================================================
// PROJECT GUIDELINES PAGE
// ============================================================
function renderProjectGuidelines(container) {
  const p = getProject(state.activeProjectId);
  if (!p) return;
  const g = p.guidelines || { stack: '', coding: '', businessRules: '', bestPractices: '' };

  container.innerHTML = `
    <!-- Header Area -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;background:linear-gradient(to right, #F8FAFC, #FFFFFF);padding:24px;border-radius:12px;border:1px solid var(--border);margin-bottom:24px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
      <div style="display:flex;align-items:flex-start;gap:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg, #3B82F6, #1D4ED8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 10px rgba(37,99,235,0.2);">
          &#9881;
        </div>
        <div>
          <div style="font-size:22px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">项目规范引擎</div>
          <div style="font-size:14px;color:#475569;margin-top:6px;max-width:600px;line-height:1.5;">
            配置本项目的技术架构、编码标准、业务边界和防坑指南。这些规约将在 Agent 执行需求拆解、代码生成和审查时作为 <strong style="color:var(--primary);">System Prompt</strong> 自动注入。
          </div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="saveProjectGuidelines()" style="padding:10px 20px;font-size:14px;">&#10003; 保存并同步 Agent</button>
    </div>
    
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
      <!-- Card 1 -->
      <div class="card" style="border-top:4px solid #3B82F6;display:flex;flex-direction:column;">
        <div style="font-weight:700;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:#1E3A8A;">
          <div style="width:32px;height:32px;border-radius:8px;background:#EFF6FF;color:#3B82F6;display:flex;align-items:center;justify-content:center;font-size:18px;">🏗️</div>
          架构与技术栈约束
        </div>
        <textarea id="guidelineStack" style="flex:1;width:100%;min-height:140px;padding:14px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;font-family:var(--mono);font-size:13px;color:#334155;line-height:1.6;resize:vertical;" placeholder="描述本项目采用的技术栈，如：JDK 17, Spring Boot 3.2, Vue 3, Redis 等" onfocus="this.style.borderColor='#3B82F6';this.style.background='#fff';this.style.outline='none';this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'" onblur="this.style.borderColor='#E2E8F0';this.style.background='#F8FAFC';this.style.boxShadow='none'">${g.stack}</textarea>
        <div style="font-size:12px;color:#64748B;margin-top:12px;display:flex;align-items:center;gap:6px;">
          <span style="color:#3B82F6;">&#10024;</span> Agent 将生成符合此版本特性的代码。
        </div>
      </div>

      <!-- Card 2 -->
      <div class="card" style="border-top:4px solid #8B5CF6;display:flex;flex-direction:column;">
        <div style="font-weight:700;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:#4C1D95;">
          <div style="width:32px;height:32px;border-radius:8px;background:#F5F3FF;color:#8B5CF6;display:flex;align-items:center;justify-content:center;font-size:18px;">📜</div>
          编码与格式规范
        </div>
        <textarea id="guidelineCoding" style="flex:1;width:100%;min-height:140px;padding:14px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;font-family:var(--mono);font-size:13px;color:#334155;line-height:1.6;resize:vertical;" placeholder="输入本项目的编码风格、命名习惯、接口规范等" onfocus="this.style.borderColor='#8B5CF6';this.style.background='#fff';this.style.outline='none';this.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'" onblur="this.style.borderColor='#E2E8F0';this.style.background='#F8FAFC';this.style.boxShadow='none'">${g.coding}</textarea>
        <div style="font-size:12px;color:#64748B;margin-top:12px;display:flex;align-items:center;gap:6px;">
          <span style="color:#8B5CF6;">&#10024;</span> Agent 审查阶段会基于此标准拦截违规代码。
        </div>
      </div>

      <!-- Card 3 -->
      <div class="card" style="border-top:4px solid #10B981;display:flex;flex-direction:column;">
        <div style="font-weight:700;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:#065F46;">
          <div style="width:32px;height:32px;border-radius:8px;background:#ECFDF5;color:#10B981;display:flex;align-items:center;justify-content:center;font-size:18px;">🛡️</div>
          核心业务与数据规约
        </div>
        <textarea id="guidelineBusiness" style="flex:1;width:100%;min-height:140px;padding:14px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;font-family:var(--font);font-size:13px;color:#334155;line-height:1.6;resize:vertical;" placeholder="定义状态机流转限制、数据软删除规约、金额计算规范等..." onfocus="this.style.borderColor='#10B981';this.style.background='#fff';this.style.outline='none';this.style.boxShadow='0 0 0 3px rgba(16,185,129,0.1)'" onblur="this.style.borderColor='#E2E8F0';this.style.background='#F8FAFC';this.style.boxShadow='none'">${g.businessRules || ''}</textarea>
        <div style="font-size:12px;color:#64748B;margin-top:12px;display:flex;align-items:center;gap:6px;">
          <span style="color:#10B981;">&#10024;</span> 约束 Agent 防止设计出违背常理的业务逻辑。
        </div>
      </div>

      <!-- Card 4 -->
      <div class="card" style="border-top:4px solid #EF4444;display:flex;flex-direction:column;">
        <div style="font-weight:700;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:#991B1B;">
          <div style="width:32px;height:32px;border-radius:8px;background:#FEF2F2;color:#EF4444;display:flex;align-items:center;justify-content:center;font-size:18px;">🚧</div>
          工程实践与防坑指南
        </div>
        <textarea id="guidelinePractices" style="flex:1;width:100%;min-height:140px;padding:14px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;font-family:var(--font);font-size:13px;color:#334155;line-height:1.6;resize:vertical;" placeholder="配置单测隔离原则、严禁使用的三方库、异常处理铁律等..." onfocus="this.style.borderColor='#EF4444';this.style.background='#fff';this.style.outline='none';this.style.boxShadow='0 0 0 3px rgba(239,68,68,0.1)'" onblur="this.style.borderColor='#E2E8F0';this.style.background='#F8FAFC';this.style.boxShadow='none'">${g.bestPractices || ''}</textarea>
        <div style="font-size:12px;color:#64748B;margin-top:12px;display:flex;align-items:center;gap:6px;">
          <span style="color:#EF4444;">&#10024;</span> 让 Agent 避开团队历史技术债务和反模式。
        </div>
      </div>
    </div>

    <!-- Info Banner -->
    <div style="margin-top:24px;background:linear-gradient(to right, #0F172A, #1E293B);border-radius:12px;padding:20px 24px;display:flex;align-items:center;gap:20px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
      <div style="position:relative;">
        <div style="font-size:36px;animation:agent-work 2s infinite ease-in-out;">🤖</div>
        <div style="position:absolute;bottom:0;right:-4px;width:12px;height:12px;background:#10B981;border:2px solid #0F172A;border-radius:50%;"></div>
      </div>
      <div style="flex:1;">
        <div style="font-weight:700;color:#F8FAFC;font-size:16px;letter-spacing:0.5px;">已启用 Agent 上下文自动注入</div>
        <div style="font-size:13px;color:#94A3B8;margin-top:6px;line-height:1.6;">
          本页面配置的内容已深度整合到工作流中。当您在任务看板点击执行时，系统会自动提取上述文本，合成专属指令块并注入多智能体协作网络，确保生成的每一次架构设计和每一行代码都贴合您的项目标准。
        </div>
      </div>
    </div>
  `;
}

function saveProjectGuidelines() {
  const p = getProject(state.activeProjectId);
  if (!p) return;
  
  p.guidelines = {
    stack: document.getElementById('guidelineStack').value,
    coding: document.getElementById('guidelineCoding').value,
    businessRules: document.getElementById('guidelineBusiness').value,
    bestPractices: document.getElementById('guidelinePractices').value
  };
  
  toast('项目规范已保存，配置已同步至多智能体执行引擎！');
}
