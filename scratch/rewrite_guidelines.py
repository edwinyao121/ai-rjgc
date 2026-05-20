# -*- coding: utf-8 -*-
import os
import re

file_path = "/Users/yyh/Desktop/15s/project/ai-rjgc/pages.js"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

content = "".join(lines)

# 1. 替换整个 renderProjectGuidelines(container) 函数
new_render_guidelines = """function renderProjectGuidelines(container) {
  const p = getProject(state.activeProjectId);
  if (!p) return;

  // Ensure guidelines and guidelineStatuses exist
  if (!p.guidelines) p.guidelines = {};
  if (!p.guidelineStatuses) p.guidelineStatuses = {};
  const g = p.guidelines;

  // 平滑迁移：如果老数据中有 dependency 且 security 为空，则迁移过来作为初始化
  if (g.dependency && !g.security) {
    g.security = g.dependency;
  }

  // 6大全局通用规范定义
  const universalSpecs = [
    { key: 'engineering', label: '工程规范', icon: '⚙️', subtitle: '版本控制、分支策略、代码评审、持续集成', desc: '规定项目工程的架构约定、MR合并、CI触发门禁以及分支管理策略，防止混乱分支发布。', color: '#3B82F6', agents: ['🏗️ 方案设计', '💻 代码生成', '🔍 代码审查'], presets: [{ label: '⚙️ 推荐标准', type: 'standard' }] },
    { key: 'security', label: '安全规范', icon: '🔒', subtitle: '凭证安全、漏洞防范、SQL注入审计、依赖准入', desc: '控制第三方库的安全引入、漏洞防范以及密钥、机密凭证的安全隔离规范。', color: '#EF4444', agents: ['💻 代码生成', '🔍 代码审查'], presets: [{ label: '☕ Spring Boot', type: 'java' }, { label: '🐹 Go Gin', type: 'go' }, { label: '🟢 NestJS', type: 'nodejs' }] },
    { key: 'collaboration', label: '协作规范', icon: '🤝', subtitle: 'Git 提交流程、文档同步、Jira 追踪与发布窗口', desc: '约定团队协同提交格式（如 Angular Git）和发布周期的规范，提升协作透明度。', color: '#8B5CF6', agents: ['📋 需求分析', '✂️ 需求拆解', '💻 代码生成'], presets: [{ label: '📐 Angular Git', type: 'angular' }, { label: '🔄 Git Flow', type: 'standard' }] },
    { key: 'quality', label: '质量标准', icon: '✅', subtitle: 'SonarQube 静态扫描、圈复杂度、重复率指标', desc: '规定项目的 SonarQube 质量门禁基线、圈复杂度上限与写操作响应耗时要求。', color: '#10B981', agents: ['🔍 代码审查', '📊 UI测试'], presets: [{ label: '🛡️ 严苛门禁', type: 'high' }, { label: '⚡ 敏捷门禁', type: 'medium' }] },
    { key: 'testing', label: '测试规范', icon: '🧪', subtitle: '单元测试覆盖率、Mock 外部服务、回归策略', desc: '规定单测/集成测试要求，防范测试环境与生产配置污染，建立全量回归策略。', color: '#F59E0B', agents: ['🧪 单元测试', '📊 UI测试'], presets: [{ label: '🧪 推荐标准', type: 'standard' }] },
    { key: 'release', label: '发布规范', icon: '🚀', subtitle: '灰度发布、蓝绿部署、一键回滚门禁机制', desc: '锁定发布与变更时间窗口，规定灰度比例，确立一键回滚能力和金丝雀测试。', color: '#06B6D4', agents: ['✅ 生成制品'], presets: [{ label: '🚀 推荐标准', type: 'standard' }] }
  ];

  // 3大专用规范定义
  const specificSpecs = [
    { key: 'stack', label: '架构与技术栈约束', icon: '🏗️', subtitle: '微服务语言、框架、组件、数据库选型基线', desc: '锁定本项目采用的特定技术栈选型与核心组件版本，防范团队技术漂移。', color: '#2563EB', agents: ['🏗️ 方案设计', '💻 代码生成', '🔍 代码审查'], presets: [{ label: '☕ Spring Boot', type: 'java' }, { label: '🐹 Go Gin', type: 'go' }, { label: '🟢 NestJS', type: 'nodejs' }] },
    { key: 'coding', label: '编码与格式规范', icon: '📜', subtitle: '类/方法命名准则、RESTful 返回格式、资源释放', desc: '管理代码书写时的命名规则、代码风格与统一 RESTful 异常返回值封装。', color: '#2563EB', agents: ['💻 代码生成', '🔍 代码审查'], presets: [{ label: '☕ 阿里规范', type: 'java' }, { label: '🐹 Uber Go', type: 'go' }, { label: '🟢 Vue 风格', type: 'vue' }] },
    { key: 'domain', label: '业务领域与核心规则', icon: '💡', subtitle: '商业专有名词、逻辑删除、状态流转校验规则', desc: '注入本项目专属的商业逻辑术语、核心约束及数据防删除隔离规范。', color: '#2563EB', agents: ['📋 需求分析', '✂️ 需求拆解', '🏗️ 方案设计'], presets: [{ label: '💼 OA 审批流', type: 'oa' }, { label: '🌐 路由网关', type: 'gateway' }, { label: '💰 金融账务', type: 'finance' }] }
  ];

  // 初始化通用规范缺省值与开启状态
  universalSpecs.forEach(spec => {
    if (g[spec.key] === undefined) {
      g[spec.key] = state.globalGuidelines[spec.key] || '';
    }
    if (p.guidelineStatuses[spec.key] === undefined) {
      p.guidelineStatuses[spec.key] = true;
    }
  });

  // 初始化专用规范开启状态
  specificSpecs.forEach(spec => {
    if (g[spec.key] === undefined) g[spec.key] = '';
    if (p.guidelineStatuses[spec.key] === undefined) {
      p.guidelineStatuses[spec.key] = true;
    }
  });

  // 渲染卡片 HTML
  function renderCardHtml(spec, categoryType) {
    const key = spec.key;
    const content = g[key] || '';
    const isEnabled = p.guidelineStatuses[key] !== false;
    return `
      <div class="pg-card ${categoryType} ${isEnabled ? '' : 'disabled'}" id="card_${key}">
        <div class="pg-card-header">
          <div class="pg-card-title-area">
            <div class="pg-card-title">
              <span>${spec.icon}</span> ${spec.label}
              <span class="pg-help-trigger">❓
                <span class="pg-tooltip-box">
                  <span class="pg-tooltip-title">${spec.icon} ${spec.label}</span>
                  ${spec.desc}
                  <div class="pg-tooltip-item" style="margin-top:6px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px;"><strong>对 AI 影响：</strong>对应智能体将被深度注入该规范，严格对齐执行。</div>
                </span>
              </span>
            </div>
            <div class="pg-card-subtitle">${spec.subtitle}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="pg-card-tabs">
              <span class="pg-card-tab" onclick="switchCardTab('${key}', 'edit')">编辑</span>
              <span class="pg-card-tab active" onclick="switchCardTab('${key}', 'preview')">预览</span>
            </div>
            <label class="pg-switch" title="开启/停用该规范">
              <input type="checkbox" class="pg-switch-input" id="status_${key}" ${isEnabled ? 'checked' : ''} onchange="toggleGuidelineStatus('${key}')">
              <span class="pg-switch-slider"></span>
            </label>
          </div>
        </div>
        
        <div class="pg-scope-badges">
          <span class="pg-scope-lbl">注入智能体:</span>
          ${spec.agents.map(a => `<span class="pg-agent-badge ${categoryType === 'universal' ? 'global' : ''}">${a}</span>`).join('')}
        </div>
        
        <div class="pg-card-body" id="body_${key}">
          <textarea id="guideline${key.charAt(0).toUpperCase() + key.slice(1)}" class="pg-textarea" placeholder="输入本项目的${spec.label}要求...">${content}</textarea>
          <div class="pg-card-actions">
            <div class="pg-preset-pills-wrap" id="${key}_presets" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              <span style="font-size:10px;color:var(--text-muted);font-weight:600;">模板预设:</span>
              ${spec.presets.map(pr => `<span class="pg-preset-pill" onclick="applyCardPreset('${key}', '${pr.type}')" title="点击套用 ${pr.label}">${pr.label}</span>`).join('')}
            </div>
            <button class="btn btn-outline btn-sm" id="${key}_copilot_btn" onclick="triggerAICopilot('${key}')" style="color:var(--primary);border-color:var(--primary-light);margin-left:auto;"><span style="font-size:12px;">⚡</span> AI 优化生成</button>
          </div>
        </div>
      </div>
    `;
  }

  // 计算已填充的规范数量
  const allKeys = [...universalSpecs.map(s => s.key), ...specificSpecs.map(s => s.key)];
  const filledCount = allKeys.filter(k => g[k] && g[k].trim().length > 0).length;

  container.innerHTML = `
    <style>
      .pg-wrapper {
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: fadeIn 0.4s ease;
      }
      /* Premium Header */
      .pg-header-card {
        background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
        color: #fff;
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }
      .pg-header-card::before {
        content: '';
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
        top: -100px;
        right: -100px;
        pointer-events: none;
      }
      .pg-header-info h2 {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
        margin-bottom: 6px;
      }
      .pg-header-info p {
        font-size: 13px;
        opacity: 0.9;
      }
      .pg-header-stats {
        display: flex;
        gap: 20px;
      }
      .pg-stat-box {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: var(--radius);
        padding: 10px 16px;
        text-align: center;
        backdrop-filter: blur(8px);
        min-width: 90px;
      }
      .pg-stat-val {
        font-size: 18px;
        font-weight: 700;
        color: #38BDF8;
      }
      .pg-stat-lbl {
        font-size: 10px;
        opacity: 0.8;
        margin-top: 2px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Slide Toggle Switch */
      .pg-switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }
      .pg-switch-input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .pg-switch-slider {
        position: relative;
        width: 34px;
        height: 18px;
        background-color: #CBD5E1;
        transition: .3s;
        border-radius: 20px;
      }
      .pg-switch-slider:before {
        position: absolute;
        content: "";
        height: 12px;
        width: 12px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
      }
      .pg-switch-input:checked + .pg-switch-slider {
        background-color: var(--primary);
      }
      .pg-switch-input:checked + .pg-switch-slider:before {
        transform: translateX(16px);
      }

      /* Card Grid */
      .pg-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
      @media(max-width: 900px) {
        .pg-grid { grid-template-columns: 1fr; }
      }

      /* Premium Card */
      .pg-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        overflow: visible;
      }
      .pg-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
      .pg-card.universal {
        border-top: 3px solid #7C3AED;
      }
      .pg-card.specific {
        border-top: 3px solid #2563EB;
      }
      .pg-card.disabled {
        opacity: 0.55;
        background: var(--bg);
        border-color: var(--border);
      }
      
      .pg-card-header {
        padding: 16px 20px 12px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .pg-card-title-area {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .pg-card-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pg-card-subtitle {
        font-size: 11px;
        color: var(--text-muted);
      }
      .pg-card-tabs {
        display: flex;
        background: #F1F5F9;
        padding: 2px;
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-weight: 600;
      }
      .pg-card-tab {
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: var(--transition);
      }
      .pg-card-tab.active {
        background: #fff;
        color: var(--primary);
        box-shadow: var(--shadow-sm);
      }

      /* Card Badges */
      .pg-scope-badges {
        padding: 8px 20px;
        background: #F8FAFC;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .pg-scope-lbl {
        font-size: 10px;
        color: var(--text-muted);
        font-weight: 600;
      }
      .pg-agent-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
        background: #EFF6FF;
        color: #2563EB;
        border: 1px solid #DBEAFE;
      }
      .pg-agent-badge.global {
        background: #F3E8FF;
        color: #7C3AED;
        border: 1px solid #E9D5FF;
      }

      /* Card Content & Textarea */
      .pg-card-body {
        padding: 16px 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        min-height: 180px;
      }
      .pg-textarea {
        width: 100%;
        height: 120px;
        padding: 10px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        font-family: var(--font);
        font-size: 13px;
        line-height: 1.5;
        outline: none;
        resize: none;
        transition: border-color 0.2s;
        color: var(--text);
      }
      .pg-textarea:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
      }
      
      .pg-card-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
      }
      
      /* Preset Select Options */
      .pg-preset-select {
        padding: 4px 8px;
        font-size: 11px;
        border-radius: 4px;
        border: 1px solid var(--border);
        background: #fff;
        outline: none;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
      }
      .pg-preset-select:hover {
        background: #F8FAFC;
        border-color: var(--primary);
      }

      /* Preview Layout Rules */
      .pg-preview-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
        overflow-y: auto;
        max-height: 140px;
        padding-right: 4px;
      }
      .pg-preview-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 10px;
        border-radius: var(--radius-sm);
        background: #F8FAFC;
        border-left: 3px solid var(--primary);
        line-height: 1.4;
      }
      .pg-card.universal .pg-preview-item {
        border-left-color: #7C3AED;
      }
      .pg-preview-bullet {
        color: var(--primary);
        font-weight: 700;
        margin-top: 1px;
      }
      .pg-card.universal .pg-preview-bullet {
        color: #7C3AED;
      }
      .pg-preview-text {
        color: var(--text-secondary);
      }
      .pg-preview-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: var(--text-muted);
        font-size: 12px;
        margin: auto;
        gap: 6px;
      }

      /* Loading Animation Overlay */
      .pg-card-loading {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 10px;
        z-index: 5;
        font-size: 12px;
        font-weight: 600;
        color: var(--primary);
      }
      .pg-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(37,99,235,0.15);
        border-radius: 50%;
        border-top-color: var(--primary);
        animation: pgSpin 0.8s linear infinite;
      }
      @keyframes pgSpin {
        to { transform: rotate(360deg); }
      }

      /* Inline Help Tooltips */
      .pg-help-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        cursor: pointer;
        margin-left: 6px;
        position: relative;
        transition: background 0.2s, color 0.2s;
        user-select: none;
        vertical-align: middle;
        flex-shrink: 0;
      }
      .pg-card.universal .pg-help-trigger {
        background: rgba(124,58,237,0.15);
        color: #7C3AED;
      }
      .pg-card.specific .pg-help-trigger {
        background: rgba(37,99,235,0.15);
        color: #2563EB;
      }
      .pg-help-trigger:hover {
        background: var(--primary) !important;
        color: #fff !important;
      }
      /* Tooltip rendered as fixed overlay to escape any overflow:hidden parent */
      .pg-tooltip-box {
        position: fixed;
        width: 260px;
        background: #1E293B;
        color: #F8FAFC;
        padding: 12px;
        border-radius: var(--radius-sm);
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        font-size: 11px;
        line-height: 1.5;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
        z-index: 9999;
        font-weight: normal;
        white-space: normal;
        text-align: left;
        border: 1px solid #475569;
      }
      .pg-tooltip-box.visible {
        opacity: 1;
        visibility: visible;
      }
      .pg-tooltip-box::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #1E293B;
      }
      .pg-tooltip-title {
        font-weight: 700;
        color: #38BDF8;
        margin-bottom: 4px;
        font-size: 11px;
      }
      .pg-tooltip-item {
        margin-top: 4px;
        color: #94A3B8;
      }
      .pg-tooltip-item strong {
        color: #E2E8F0;
      }

      /* Preset Pill Badges */
      .pg-preset-pill {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 20px;
        background: #F1F5F9;
        color: var(--text-secondary);
        cursor: pointer;
        border: 1px solid var(--border);
        transition: all 0.2s;
        display: inline-block;
        user-select: none;
      }
      .pg-preset-pill:hover {
        background: #EFF6FF;
        color: var(--primary);
        border-color: var(--primary-light);
        transform: translateY(-1px);
      }

      /* Onboarding Tour styles */
      .pg-tour-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15,23,42,0.7);
        backdrop-filter: blur(4px);
        z-index: 1000;
        transition: opacity 0.3s;
      }
      .pg-tour-box {
        position: absolute;
        width: 320px;
        background: #fff;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 20px;
        z-index: 1001;
        border: 2px solid var(--primary);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: pgScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        color: var(--text);
      }
      @keyframes pgScaleUp {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .pg-tour-box-header {
        font-weight: 700;
        font-size: 14px;
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .pg-tour-box-body {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.6;
      }
      .pg-tour-box-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;
      }
      .pg-tour-highlight {
        position: relative;
        z-index: 999 !important;
        box-shadow: 0 0 20px var(--primary) !important;
        outline: 3px solid var(--primary) !important;
        background: var(--surface) !important;
      }

      /* Premium main tab styles */
      .pg-tab-nav {
        display: flex;
        border-bottom: 2px solid var(--border);
        margin-bottom: 8px;
        gap: 24px;
        padding: 0 8px;
      }
      .pg-main-tab {
        padding: 10px 4px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        color: var(--text-muted);
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .pg-main-tab.active {
        color: var(--primary);
        border-bottom-color: var(--primary);
      }
    </style>

    <div class="pg-wrapper">
      
      <!-- Top Premium Header Banner -->
      <div class="pg-header-card" id="pgHeaderCard">
        <div class="pg-header-info">
          <h2>项目规范配置中心</h2>
          <p style="margin-top:6px;opacity:0.85;font-size:13px;">定义与配置本项目的 AI 智能体执行规范，规范将自动作为高内聚约束靶向注入到对应智能体的 System Prompt 中</p>
        </div>
        
        <div class="pg-header-stats">
          <div class="pg-stat-box">
            <div class="pg-stat-val" id="pgStatCount">${filledCount} 个</div>
            <div class="pg-stat-lbl">已设规范块</div>
          </div>
          <div class="pg-stat-box">
            <div class="pg-stat-val">8 个</div>
            <div class="pg-stat-lbl">关联智能体</div>
          </div>
          <div style="display:flex;align-self:center;gap:8px;">
            <button class="btn btn-outline" id="pgTourBtn" onclick="startOnboardingTour()" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);height:42px;padding:0 18px;font-size:14px;font-weight:600;cursor:pointer;border-radius:var(--radius);transition:all 0.2s;">💡 易用指南</button>
            <button class="btn btn-primary" onclick="saveProjectGuidelines()" style="background:#fff;color:#1E40AF;height:42px;padding:0 20px;font-size:14px;box-shadow:0 4px 10px rgba(0,0,0,0.15);border:none;">保存配置</button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation Header -->
      <div class="pg-tab-nav">
        <div class="pg-main-tab active" id="pgMainTabUniversal" onclick="switchProjectGuidelinesTab('universal')">🌍 通用规范约束</div>
        <div class="pg-main-tab" id="pgMainTabSpecific" onclick="switchProjectGuidelinesTab('specific')">🎯 专用规范约束</div>
      </div>

      <!-- Tab Content 1: Universal Guidelines -->
      <div id="universalTabContent">
        <div class="pg-grid">
          ${universalSpecs.map(spec => renderCardHtml(spec, 'universal')).join('')}
        </div>
      </div>

      <!-- Tab Content 2: Specific Guidelines -->
      <div id="specificTabContent" style="display:none;">
        <div class="pg-grid">
          ${specificSpecs.map(spec => renderCardHtml(spec, 'specific')).join('')}
        </div>
      </div>

    </div>
  `;

  // Register Tab Navigation Switch globally
  window.switchProjectGuidelinesTab = function(tabName) {
    const tabUniversal = document.getElementById('pgMainTabUniversal');
    const tabSpecific = document.getElementById('pgMainTabSpecific');
    const contentUniversal = document.getElementById('universalTabContent');
    const contentSpecific = document.getElementById('specificTabContent');

    if (tabName === 'universal') {
      tabUniversal.classList.add('active');
      tabSpecific.classList.remove('active');
      contentUniversal.style.display = 'block';
      contentSpecific.style.display = 'none';
    } else {
      tabUniversal.classList.remove('active');
      tabSpecific.classList.add('active');
      contentUniversal.style.display = 'none';
      contentSpecific.style.display = 'block';
    }
  };

  // Register Status Toggle Switch globally
  window.toggleGuidelineStatus = function(key) {
    const checkbox = document.getElementById('status_' + key);
    const card = document.getElementById('card_' + key);
    const prj = getProject(state.activeProjectId);
    if (checkbox && card && prj) {
      if (!prj.guidelineStatuses) prj.guidelineStatuses = {};
      prj.guidelineStatuses[key] = checkbox.checked;
      if (checkbox.checked) {
        card.classList.remove('disabled');
      } else {
        card.classList.add('disabled');
      }
      toast(`已${checkbox.checked ? '启用' : '停用'}项目「${key}」规范`);
    }
  };

  // Initialize all cards in preview mode by default
  allKeys.forEach(key => {
    switchCardTab(key, 'preview');
  });

  // Setup fixed-position tooltip positioning for ❓ triggers
  document.querySelectorAll('.pg-help-trigger').forEach(trigger => {
    const tooltip = trigger.querySelector('.pg-tooltip-box');
    if (!tooltip) return;
    // Move tooltip to body to avoid overflow clipping
    document.body.appendChild(tooltip);
    trigger.addEventListener('mouseenter', () => {
      const rect = trigger.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2 - 130) + 'px';
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      tooltip.classList.add('visible');
      // Recalculate after visibility (offsetHeight only available when visible)
      requestAnimationFrame(() => {
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      });
    });
    trigger.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
}"""

# 2. 替换整个 saveProjectGuidelines() 函数
# 找到原来 saveProjectGuidelines() 的行范围并做替换
new_save_guidelines = """function saveProjectGuidelines() {
  const p = getProject(state.activeProjectId);
  if (!p) return;

  const keys = ['engineering', 'security', 'collaboration', 'quality', 'testing', 'release', 'stack', 'coding', 'domain'];
  
  if (!p.guidelines) p.guidelines = {};
  if (!p.guidelineStatuses) p.guidelineStatuses = {};

  keys.forEach(k => {
    const el = document.getElementById(`guideline${k.charAt(0).toUpperCase() + k.slice(1)}`);
    const statusEl = document.getElementById(`status_${k}`);
    if (el) {
      p.guidelines[k] = el.value;
    }
    if (statusEl) {
      p.guidelineStatuses[k] = statusEl.checked;
    }
  });

  // 同步统计卡片
  const filledCount = keys.filter(k => p.guidelines[k] && p.guidelines[k].trim().length > 0).length;
  const countEl = document.getElementById('pgStatCount');
  if (countEl) countEl.textContent = `${filledCount} 个`;

  toast('项目规范已保存，已成功同步至 Harness 智能体执行引擎！');
}"""

# 3. 替换 PRESETS 变量
# 将 PRESETS 常量替换为支持 9 大规范的高内聚对象
new_presets = """const PRESETS = {
  engineering: {
    standard: "1. 版本控制：主分支 master/main 必须保护，只允许通过 MR 合入，禁止直接 push。\\n2. 持续集成：每次提交自动触发编译与静态分析流水线，构建失败禁止合入。\\n3. 变更机制：引入新核心模块前需经架构委员会评审，通过后方可建立代码仓库。"
  },
  security: {
    java: "1. 依赖管理：统一使用 Maven 进行依赖引入，严禁直接导入本地 JAR 包。\\n2. 选型黑名单：严禁使用 Fastjson（存在安全高危漏洞），统一使用 Jackson 作为 JSON 解析器。\\n3. 凭据安全：凭证（Token/Password）禁止明文硬编码，使用 Vault 或环境变量注入。",
    go: "1. 包管理：统一使用 Go Modules 进行依赖管理，Go.sum 必须随代码库提交。\\n2. 依赖原则：严禁引入未经安全评估的第三方组件，优先使用官方原生标准库。\\n3. 边界审计：所有对外 API 必须强制通过 CSRF 与鉴权拦截器。",
    nodejs: "1. 包管理：统一使用 npm/yarn 进行依赖导入，lockfile 必须保证提交。\\n2. 安全扫描：引入外部 NPM 包前必须执行 npm audit 进行高危安全漏洞扫描并修复。\\n3. 凭据泄露：使用 dotenv 处理生产环境变量，.env 文件严禁提交至 Git。"
  },
  collaboration: {
    angular: "1. 分支命名：新功能分支为 feature/{issue-id}-{name}，缺陷修复分支为 hotfix/{issue-id}-{name}。\\n2. 提交规范：Commit 格式统一为 <type>(<scope>): <subject>，类型可选 feat/fix/docs/style/refactor/test。\\n3. 合并评审：禁止直接 Push 到主分支，必须经过 PR 且由 CI 流水线构建通过后合入。",
    standard: "1. 协作策略：采用经典 Git Flow，开发工作合并入 develop，生产发布合并至 main 分支。\\n2. 提交约定：每次 Commit 必须附带简明清晰的功能说明，多行提交必须在首行进行概括。\\n3. 代码同步：拉取代码统一使用 git pull --rebase，保持提交历史呈单链状线性演进。"
  },
  quality: {
    high: "1. 单测门禁：核心模块行覆盖率必须达到 80% 以上，分支覆盖率达到 70% 以上。\\n2. 静态指标：SonarQube 静态扫描中不得包含 Blocker / Critical 等级漏洞，圈复杂度单个函数上限 15。\\n3. 门禁策略：在单元测试和集成测试阶段，测试用例通过率必须达到 100%，否则阻断推进流程。",
    medium: "1. 单测标准：核心业务处理模块行覆盖率达到 60% 以上即可，其余通用工具类无需强制要求单测。\\n2. 复杂限制：避免出现圈复杂度超过 25 的深度嵌套逻辑，超出必须强制进行提取重构处理。\\n3. 警告门禁：质量门禁不通过在控制台打印 Warning，不强制阻断流水线提交，方便敏捷开发排产。"
  },
  testing: {
    standard: "1. 测试分层：单元测试（70%）→ 集成测试（20%）→ UI/E2E 测试（10%），金字塔模型。\\n2. 环境隔离：测试环境必须与生产环境配置隔离，禁止测试写入生产数据库。\\n3. 回归策略：每次发版前必须执行全量回归测试套件，关键路径用例 100% 通过。"
  },
  release: {
    standard: "1. 发布流程：采用灰度发布策略，先金丝雀（5%）→ 小流量（20%）→ 全量。\\n2. 回滚机制：每次发布必须具备一键回滚能力，回滚操作 <= 5 分钟完成。\\n3. 变更窗口：非紧急变更仅在工作日 10:00-16:00 执行，禁止周五下午发布。"
  },
  stack: {
    java: "Java 17, Spring Boot 3.0, MyBatis-Plus, Redis, MySQL 8.0, RabbitMQ",
    go: "Go 1.20, Gin Router, gRPC Protobuf, Etcd V3, Prometheus, PostgreSQL",
    nodejs: "Node.js 18, NestJS 10.0, TypeScript 5.0, TypeORM, Keycloak IAM"
  },
  coding: {
    java: "1. 命名规范：严格遵循《阿里巴巴Java开发手册》，包名小写，接口名以 I 开头，类以驼峰命名。\\n2. 接口规范：统一使用 RESTful 风格定义 API，返回数据统一包装为 {code, data, msg} 状态体。\\n3. 资源管理：所有文件流、数据库连接必须在 try-with-resources 或 finally 中执行严格释放。",
    go: "1. 命名习惯：严格遵循 Uber Go Style Guide 风格，结构体和公共方法以大写开头导出。\\n2. 并发安全：所有 Goroutine 必须合理处理 defer recover，防止 panic 崩溃导致服务重启。\\n3. 接口封装：方法参数中，context.Context 必须置于第一参数位置，统一命名为 ctx。",
    vue: "1. 组件命名：单文件组件文件名统一使用双单词驼峰（如 UserCard.vue），避开 HTML 原生标签。\\n2. 数据流向：组件状态遵循 Props Down, Events Up 原则，单向流动，禁止子组件直接修改 Prop 数据。\\n3. 性能规范：v-for 循环指令必须绑定唯一的 :key，严禁将 v-if 与 v-for 挂载在同一个 DOM 节点。"
  },
  domain: {
    oa: "1. 金额计算：金额运算统一使用 BigDecimal 结构，严禁直接使用 float/double，防范浮点数精度丢失。\\n2. 逻辑删除：数据库记录删除统一采用逻辑删除（更新 is_deleted = 1），严禁物理性 DELETE 操作。\\n3. 状态转化：审批流状态转换必须严格按照流程图状态机流转，禁止跳过审批级直接将草稿置为通过。",
    gateway: "1. 路由流转：网关匹配规则优先按精确 Path 进行路由匹配，最后采用通配符进行全局兜底分配。\\n2. 熔断策略：当后端单个服务节点响应延迟 >2000ms 占比超过 30%，必须触发 10 秒自动断路熔断。\\n3. 敏感透传：严禁将前端鉴权 Header 原封不动透传至下游不受信微服务，必须通过内网 Token 转换。",
    finance: "1. 精度把控：所有货币数据在存储和计算时统一保留到小数点后 4 位，财务报表输出前做四舍五入截断。\\n2. 审计留痕：任何涉及用户财务资金的流转，必须强制留存全局流水 TraceID 并记录不可篡改的审计日志。\\n3. 交易幂等：核心支付交易接口必须强制进行分布式幂等校验，幂等锁有效期设为最大 30 秒。"
  }
};"""

# 4. 替换 TOUR_STEPS 引导
# 适配新的卡片 ID 并去掉 pgViewerCard 可观测面板引导步
new_tour_steps = """const TOUR_STEPS = [
  {
    targetId: 'card_engineering',
    title: '全局通用规范',
    content: '通用规范（如工程、协作、安全规范等）会高内聚地注入到全部 8 个智能体大脑中。你可以悬停在标题旁的 ❓ 问号上，深入了解每一项规范的作用以及对 AI 智能体的影响。',
    position: 'bottom'
  },
  {
    targetId: 'engineering_presets',
    title: '快捷预设模板',
    content: '不知道规范该怎么写？我们贴心地准备了行业标准的快速徽章预设。鼠标悬停在徽章上即可预览其核心内容，一键点击即可秒速导入配置！',
    position: 'bottom'
  },
  {
    targetId: 'engineering_copilot_btn',
    title: 'AI 一键润色',
    content: '自己写的规范太简短？点击这个按钮，小智 Copilot 会根据您当前的项目背景和底层技术栈，自动为您一键扩写并精润出最专业的规范文本！',
    position: 'bottom'
  }
];"""

# 用正则做超级精准替换
# 替换 renderProjectGuidelines 函数
# 正则匹配最安全，以 function renderProjectGuidelines 开始，到 } 结束
content_new = re.sub(
    r"function renderProjectGuidelines\(container\)\s*\{.*?\}\n\n// ============================================================\n// CORE DYNAMIC INTERACTS",
    new_render_guidelines + "\n\n// ============================================================\n// CORE DYNAMIC INTERACTS",
    content,
    flags=re.DOTALL
)

# 替换 saveProjectGuidelines 函数
content_new = re.sub(
    r"function saveProjectGuidelines\(\)\s*\{.*?\}",
    new_save_guidelines,
    content_new,
    flags=re.DOTALL
)

# 替换 PRESETS 字典
content_new = re.sub(
    r"const PRESETS\s*=\s*\{.*?\};",
    new_presets,
    content_new,
    flags=re.DOTALL
)

# 替换 TOUR_STEPS
content_new = re.sub(
    r"const TOUR_STEPS\s*=\s*\[.*?\];",
    new_tour_steps,
    content_new,
    flags=re.DOTALL
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content_new)

print("SUCCESS")
