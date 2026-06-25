import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

test('renders application production line page without runtime errors', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { default: KanbanBoard } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')
    const html = renderToString(React.createElement(KanbanBoard, { sidebarOpen: true }))

    assert.match(html, /智能软件工厂/)
    assert.doesNotMatch(html, /<h1[^>]*>应用生产线<\/h1>/)
    assert.match(html, /<div class="[^"]*justify-center[^"]*text-center/)
    assert.match(html, /航母母港潮汐窗口计算器/)
    assert.doesNotMatch(html, /需求规格说明书/)
  } finally {
    await server.close()
  }
})

test('App shell renders the factory board without the left navigation menu', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  const originalWindow = globalThis.window
  globalThis.window = {
    location: { search: '' },
    open: () => {},
    close: () => {}
  }

  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    const html = renderToString(React.createElement(App))

    assert.match(html, /智能软件工厂/)
    assert.match(html, /航母母港潮汐窗口计算器/)
    assert.doesNotMatch(html, /工作台大盘/)
    assert.doesNotMatch(html, /应用生产线/)
    assert.doesNotMatch(html, /应用商店/)
    assert.doesNotMatch(html, /Agent中心/)
    assert.doesNotMatch(html, /规则引擎/)
    assert.doesNotMatch(html, /工程链路/)
    assert.doesNotMatch(html, /系统设置/)
    assert.doesNotMatch(html, /收起菜单|展开菜单/)
  } finally {
    globalThis.window = originalWindow
    await server.close()
  }
})

test('renders AI messages from new and legacy message formats', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { normalizeChatMessage } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    assert.deepEqual(normalizeChatMessage({
      id: 'new-msg',
      role: 'assistant',
      content: '系统设计阶段已开始',
      createdAt: '2026-06-24T08:00:00.000Z'
    }), {
      id: 'new-msg',
      sender: 'ai',
      text: '系统设计阶段已开始',
      kind: null,
      metadata: null,
      status: 'COMPLETED',
      stageId: null,
      phase: null,
      time: '16:00'
    })

    assert.deepEqual(normalizeChatMessage({
      id: 'old-msg',
      sender: 'user',
      text: '补充验收条件',
      createdAt: '2026-06-24T08:05:00.000Z'
    }), {
      id: 'old-msg',
      sender: 'user',
      text: '补充验收条件',
      kind: null,
      metadata: null,
      status: 'COMPLETED',
      stageId: null,
      phase: null,
      time: '16:05'
    })

    assert.deepEqual(normalizeChatMessage({
      id: 'stream-msg',
      role: 'assistant',
      kind: 'opencode-stream',
      content: 'opencode stdout line\n',
      status: 'STREAMING',
      metadata: { stageKey: 'design', source: 'opencode' },
      createdAt: '2026-06-24T08:10:00.000Z'
    }), {
      id: 'stream-msg',
      sender: 'ai',
      text: 'opencode stdout line\n',
      kind: 'opencode-stream',
      metadata: { stageKey: 'design', source: 'opencode' },
      status: 'STREAMING',
      stageId: 'design',
      phase: null,
      time: '16:10'
    })
  } finally {
    await server.close()
  }
})

test('RequirementsItemsCard does not label the internal requirements document as a standalone spec', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { RequirementsItemsCard } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    const emptyHtml = renderToString(React.createElement(RequirementsItemsCard, {
      items: null,
      title: '测试应用'
    }))
    assert.doesNotMatch(emptyHtml, /需求规格说明书/)
    assert.match(emptyHtml, /条目化需求/)

    const filledHtml = renderToString(React.createElement(RequirementsItemsCard, {
      title: '',
      items: {
        businessNecessity: ['降低测试流程中断率'],
        expectedOutcome: ['自动返修后继续质检'],
        detailedRequirements: []
      }
    }))
    assert.doesNotMatch(filledHtml, /需求规格说明书/)
    assert.match(filledHtml, /需求澄清结果/)
  } finally {
    await server.close()
  }
})

test('CreateWorkOrderModal collects app title and basic description before assistant requirements', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { CreateWorkOrderModal } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    const html = renderToString(React.createElement(CreateWorkOrderModal, {
      open: true,
      form: {
        title: '舰载任务态势应用',
        description: '登记任务、风险等级和处置进度'
      },
      onChange: () => {},
      onClose: () => {},
      onSubmit: () => {},
      submitting: false,
      error: ''
    }))

    assert.match(html, /应用标题/)
    assert.match(html, /基本描述/)
    assert.match(html, /创建应用/)
    assert.doesNotMatch(html, /输入应用目标、关键功能和验收口径/)
  } finally {
    await server.close()
  }
})

test('AIChatPanel asks for original requirement after deferred app shell creation', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { AIChatPanel } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    const html = renderToString(React.createElement(AIChatPanel, {
      activeOrder: {
        id: 'WO-20260625-101',
        title: '舰载任务态势应用',
        description: '登记任务、风险等级和处置进度',
        status: 'CLARIFYING',
        awaitingOriginalRequirement: true,
        domain: 'AI生成',
        creator: 'AI研发助手',
        lastUpdate: '刚刚',
        messages: [],
        stages: []
      },
      onSendMessage: () => {},
      onStartDevelopment: () => {},
      onClose: () => {},
      loading: false,
      error: '',
      startingDevelopment: false
    }))

    assert.match(html, /应用已创建/)
    assert.match(html, /请输入原始需求/)
    assert.match(html, /输入原始需求/)
    assert.doesNotMatch(html, /请输入新的应用需求/)
  } finally {
    await server.close()
  }
})

test('renders structured stage log modal with controls and empty state', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { StageLogModal } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')
    const html = renderToString(React.createElement(StageLogModal, {
      open: true,
      stage: { name: '系统设计', status: 'RUNNING' },
      log: {
        stageName: '系统设计',
        status: 'RUNNING',
        entries: [
          {
            id: 'log-1',
            timestamp: '2026-06-24T08:00:00.000Z',
            level: 'ERROR',
            source: 'opencode',
            text: '设计失败'
          }
        ],
        content: ''
      },
      loading: false,
      error: '',
      onClose: () => {}
    }))

    assert.match(html, /自动滚动/)
    assert.match(html, /设计失败/)
    assert.match(html, /ERROR/)

    const emptyHtml = renderToString(React.createElement(StageLogModal, {
      open: true,
      stage: { name: '智能编码', status: 'PENDING' },
      log: { stageName: '智能编码', status: 'PENDING', entries: [], content: '' },
      loading: false,
      error: '',
      onClose: () => {}
    }))

    assert.match(emptyHtml, /暂无实时日志/)
  } finally {
    await server.close()
  }
})

test('WorkOrderCard shows only avatar title and description without operational clutter', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { WorkOrderCard } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')
    const longTitle = '这是一个需要在应用列表中完整展示的超长应用名称'
    const longDescription = '这是一个很长的基本描述，用于解释应用要解决的问题、目标用户、核心能力和交付边界，列表中应该单行省略。'
    const html = renderToString(React.createElement(WorkOrderCard, {
      order: {
        id: 'WO-20260625-102',
        title: longTitle,
        description: longDescription,
        domain: 'AI生成',
        creator: 'AI研发助手',
        priority: 'critical',
        progress: 95,
        stages: [
          { status: 'RUNNING', name: '部署交付' }
        ]
      },
      isSelected: false,
      onClick: () => {}
    }))

    assert.match(html, new RegExp(longTitle))
    assert.doesNotMatch(html, /<h3 class="[^"]*truncate/)
    assert.match(html, /title="这是一个很长的基本描述/)
    assert.match(html, /列表中应该单行省略/)
    assert.doesNotMatch(html, />(紧急|高|中|失败)</)
    assert.doesNotMatch(html, /当前阶段|部署交付|执行失败|已完成/)
    assert.doesNotMatch(html, /WO-20260625-102|95%|运行|访问|等待/)
    assert.doesNotMatch(html, /bg-gradient-to-r from-blue-500 to-blue-600/)
  } finally {
    await server.close()
  }
})

test('DeliverablesModal summarizes documents builds and urls before item detail is opened', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { DeliverablesModal } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')
    const html = renderToString(React.createElement(DeliverablesModal, {
      open: true,
      order: {
        id: 'WO-20260625-103',
        title: '交付聚合应用',
        deploymentUrl: 'http://127.0.0.1:4101',
        stages: [
          {
            name: '系统设计',
            outputs: [
              { label: '系统设计说明', value: 'docs/design.md', url: '#' }
            ]
          },
          {
            name: '智能编码',
            outputs: [
              { label: '代码仓库', value: 'git@code.example.com:demo.git', isLink: true },
              { label: '安装包', value: 'demo-v1.0.0.tar.gz', isFile: true }
            ]
          }
        ]
      },
      onClose: () => {}
    }))

    assert.match(html, /成果物详情/)
    assert.match(html, /文档/)
    assert.match(html, /制品/)
    assert.match(html, /访问地址/)
    assert.match(html, /系统设计说明/)
    assert.match(html, /代码仓库/)
    assert.match(html, /部署地址/)
    assert.match(html, /查看详情/)
    assert.doesNotMatch(html, /详细内容/)
  } finally {
    await server.close()
  }
})

test('StageCard shows estimated remaining while running and actual elapsed when completed', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { StageCard } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')
    const Icon = () => React.createElement('span', { 'aria-hidden': true })

    const runningHtml = renderToString(React.createElement(StageCard, {
      stage: {
        id: 2,
        key: 'design',
        name: '系统设计',
        icon: Icon,
        status: 'RUNNING',
        time: '16:00',
        duration: '进行中',
        estimatedRemaining: '12分钟',
        gate: { exit: '设计完备' },
        items: []
      },
      onShowLogs: () => {}
    }))

    assert.match(runningHtml, /预计剩余/)
    assert.match(runningHtml, /12分钟/)

    const completedHtml = renderToString(React.createElement(StageCard, {
      stage: {
        id: 2,
        key: 'design',
        name: '系统设计',
        icon: Icon,
        status: 'COMPLETED',
        time: '16:00',
        duration: '1分30秒',
        actualDuration: '1分30秒',
        gate: { exit: '设计完备' },
        items: []
      },
      onShowLogs: () => {}
    }))

    assert.match(completedHtml, /实际耗时/)
    assert.match(completedHtml, /1分30秒/)

    const repairingHtml = renderToString(React.createElement(StageCard, {
      stage: {
        id: 4,
        key: 'testing',
        name: '测试质检',
        icon: Icon,
        status: 'RUNNING',
        time: '16:05',
        duration: '进行中',
        estimatedRemaining: '8分钟',
        gate: { exit: '质检通过' },
        items: [
          { type: 'ai', label: '自动返修', value: '第 1/3 次返修中', progress: 40 }
        ],
        repairAttempts: { current: 1, max: 3 }
      },
      onShowLogs: () => {}
    }))

    assert.match(repairingHtml, /第 1\/3 次返修中/)
    assert.doesNotMatch(repairingHtml, /开发失败/)
  } finally {
    await server.close()
  }
})

test('AIChatPanel renders opencode-stream messages with pre-wrap and start button only when ready', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { AIChatPanel } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    const readyOrder = {
      id: 'WO-20260624-001',
      title: '潮汐窗口计算器',
      status: 'READY_FOR_DEVELOPMENT',
      domain: '海洋域',
      creator: 'AI研发助手',
      lastUpdate: '刚刚',
      messages: [
        {
          id: 'user-1',
          role: 'user',
          content: '帮我做一个潮汐计算器',
          createdAt: '2026-06-24T07:55:00.000Z'
        },
        {
          id: 'ai-1',
          role: 'assistant',
          content: '我对需求场景的理解如下：\n\n1. 需求内容：潮汐窗口自动判断\n业务需求必要性：减少人工查表和口径偏差\n预期成效：出港窗口判断时间压缩到分钟级\n\n请确认以上业务需求是否准确。',
          createdAt: '2026-06-24T08:00:00.000Z'
        },
        {
          id: 'stream-1',
          role: 'assistant',
          kind: 'opencode-stream',
          content: 'opencode stdout 第一行\nopencode stdout 第二行\n',
          status: 'STREAMING',
          metadata: { stageKey: 'design', source: 'opencode' },
          createdAt: '2026-06-24T08:00:00.000Z'
        }
      ],
      stages: []
    }

    const readyHtml = renderToString(React.createElement(AIChatPanel, {
      activeOrder: readyOrder,
      onSendMessage: () => {},
      onStartDevelopment: () => {},
      onClose: () => {},
      loading: false,
      error: '',
      startingDevelopment: false
    }))

    assert.match(readyHtml, /开始智能开发/)
    assert.match(readyHtml, /正在思考/)
    assert.match(readyHtml, /opencode stdout 第一行/)
    assert.match(readyHtml, /opencode stdout 第二行/)
    assert.match(readyHtml, /帮我做一个潮汐计算器/)
    assert.match(readyHtml, /我对需求场景的理解如下/)
    assert.match(readyHtml, /业务需求必要性：减少人工查表和口径偏差/)
    assert.match(readyHtml, /预期成效：出港窗口判断时间压缩到分钟级/)
    assert.match(readyHtml, /whitespace-pre-wrap/)
    assert.match(readyHtml, /white-space:pre-wrap|white-space: pre-wrap|pre-wrap/)
    assert.doesNotMatch(readyHtml, /opencode 原始输出/)

    const runningOrder = { ...readyOrder, status: 'RUNNING', messages: [] }
    const runningHtml = renderToString(React.createElement(AIChatPanel, {
      activeOrder: runningOrder,
      onSendMessage: () => {},
      onStartDevelopment: () => {},
      onClose: () => {},
      loading: false,
      error: '',
      startingDevelopment: false
    }))

    assert.doesNotMatch(runningHtml, /开始智能开发/)

    const clarifyingOrder = { ...readyOrder, status: 'CLARIFYING', messages: [] }
    const clarifyingHtml = renderToString(React.createElement(AIChatPanel, {
      activeOrder: clarifyingOrder,
      onSendMessage: () => {},
      onStartDevelopment: () => {},
      onClose: () => {},
      loading: false,
      error: '',
      startingDevelopment: false
    }))

    assert.doesNotMatch(clarifyingHtml, /开始智能开发/)

    const deployedOrder = { ...readyOrder, status: 'DEPLOYED', deploymentUrl: 'http://127.0.0.1:4101', messages: [] }
    const deployedHtml = renderToString(React.createElement(AIChatPanel, {
      activeOrder: deployedOrder,
      onSendMessage: () => {},
      onStartDevelopment: () => {},
      onClose: () => {},
      loading: false,
      error: '',
      startingDevelopment: false
    }))

    assert.doesNotMatch(deployedHtml, /开始智能开发/)
  } finally {
    await server.close()
  }
})

test('AIChatPanel shows 正在执行 indicator when metadata.activity is tool', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { AIChatPanel } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    const order = {
      id: 'WO-20260624-010',
      title: '工具执行指示器测试',
      status: 'RUNNING',
      domain: '海洋域',
      creator: 'AI研发助手',
      lastUpdate: '刚刚',
      messages: [
        {
          id: 'stream-tool',
          role: 'assistant',
          kind: 'opencode-stream',
          content: '正在初始化项目结构\n▸ 执行 bash: npm install\n',
          status: 'STREAMING',
          metadata: { stageKey: 'coding', source: 'opencode', activity: 'tool', tool: 'bash', toolDescription: 'npm install' },
          createdAt: '2026-06-24T08:00:00.000Z'
        }
      ],
      stages: []
    }

    const html = renderToString(React.createElement(AIChatPanel, {
      activeOrder: order,
      onSendMessage: () => {},
      onStartDevelopment: () => {},
      onClose: () => {},
      loading: false,
      error: '',
      startingDevelopment: false
    }))

    assert.match(html, /正在执行 bash/)
    assert.match(html, /npm install/)
    assert.doesNotMatch(html, /正在思考/)
    assert.match(html, /▸ 执行 bash: npm install/)
  } finally {
    await server.close()
  }
})

test('AIChatPanel shows 执行失败 indicator when stream status is FAILED', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { AIChatPanel } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    const order = {
      id: 'WO-20260624-011',
      title: '失败指示器测试',
      status: 'FAILED',
      domain: '海洋域',
      creator: 'AI研发助手',
      lastUpdate: '刚刚',
      messages: [
        {
          id: 'stream-failed',
          role: 'assistant',
          kind: 'opencode-stream',
          content: '▸ 执行 bash: npm test\n',
          status: 'FAILED',
          metadata: { stageKey: 'testing', source: 'opencode', activity: null },
          createdAt: '2026-06-24T08:00:00.000Z'
        }
      ],
      stages: []
    }

    const html = renderToString(React.createElement(AIChatPanel, {
      activeOrder: order,
      onSendMessage: () => {},
      onStartDevelopment: () => {},
      onClose: () => {},
      loading: false,
      error: '',
      startingDevelopment: false
    }))

    assert.match(html, /执行失败/)
    assert.doesNotMatch(html, /正在思考/)
    assert.doesNotMatch(html, /正在执行/)
  } finally {
    await server.close()
  }
})

test('applyGranularEventToOrder merges SSE deltas into the same message without duplicating on replay', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  })

  try {
    const { applyGranularEventToOrder, toAppAccessUrl } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

    assert.equal(toAppAccessUrl('http://127.0.0.1:4101/api/v1/tides/ports'), 'http://127.0.0.1:4101')
    assert.equal(toAppAccessUrl('http://127.0.0.1:4101/dashboard'), 'http://127.0.0.1:4101/dashboard')

    const baseOrder = {
      id: 'WO-20260624-002',
      title: '潮汐窗口计算器',
      status: 'RUNNING',
      messages: [
        {
          id: 'stream-1',
          role: 'assistant',
          kind: 'opencode-stream',
          content: '',
          status: 'STREAMING',
          createdAt: '2026-06-24T08:00:00.000Z'
        }
      ],
      stages: []
    }

    const delta1 = applyGranularEventToOrder(baseOrder, {
      type: 'assistant.message.delta',
      workOrderId: baseOrder.id,
      messageId: 'stream-1',
      delta: 'first line\n',
      status: 'STREAMING',
      metadata: { activity: 'thinking' },
      sequence: 5
    })
    assert.equal(delta1.messages[0].content, 'first line\n')
    assert.equal(delta1.messages[0].status, 'STREAMING')
    assert.equal(delta1.messages[0].kind, 'opencode-stream')
    assert.equal(delta1.messages[0].metadata.activity, 'thinking')

    const delta2 = applyGranularEventToOrder(delta1, {
      type: 'assistant.message.delta',
      workOrderId: baseOrder.id,
      messageId: 'stream-1',
      delta: 'second line\n',
      status: 'STREAMING',
      metadata: { activity: 'tool', tool: 'bash', toolDescription: 'npm install' },
      sequence: 6
    })
    assert.equal(delta2.messages[0].content, 'first line\nsecond line\n')
    assert.equal(delta2.messages[0].metadata.activity, 'tool')
    assert.equal(delta2.messages[0].metadata.tool, 'bash')
    assert.equal(delta2.messages[0].metadata.toolDescription, 'npm install')

    const finalize = applyGranularEventToOrder(delta2, {
      type: 'assistant.message.delta',
      workOrderId: baseOrder.id,
      messageId: 'stream-1',
      delta: '',
      status: 'COMPLETED',
      metadata: { activity: null },
      sequence: 7
    })
    assert.equal(finalize.messages[0].content, 'first line\nsecond line\n')
    assert.equal(finalize.messages[0].status, 'COMPLETED')
    assert.equal(finalize.messages[0].metadata.activity, null)
    assert.equal(finalize.messages[0].metadata.tool, 'bash')

    const appendedOrder = applyGranularEventToOrder(baseOrder, {
      type: 'assistant.message.append',
      workOrderId: baseOrder.id,
      message: {
        id: 'stream-2',
        role: 'assistant',
        kind: 'opencode-stream',
        content: '',
        status: 'STREAMING',
        metadata: { stageKey: 'coding', source: 'opencode' },
        createdAt: '2026-06-24T08:05:00.000Z'
      }
    })
    assert.equal(appendedOrder.messages.length, 2)
    assert.equal(appendedOrder.messages[1].kind, 'opencode-stream')
    assert.deepEqual(appendedOrder.messages[1].metadata, { stageKey: 'coding', source: 'opencode' })

    const statusChanged = applyGranularEventToOrder(baseOrder, {
      type: 'work-order.status.changed',
      workOrderId: baseOrder.id,
      status: 'READY_FOR_DEVELOPMENT',
      progress: 25,
      workOrder: { id: baseOrder.id, status: 'READY_FOR_DEVELOPMENT', progress: 25 }
    })
    assert.equal(statusChanged.status, 'READY_FOR_DEVELOPMENT')
    assert.equal(statusChanged.progress, 25)

    const deployed = applyGranularEventToOrder(baseOrder, {
      type: 'deployment.updated',
      workOrderId: baseOrder.id,
      status: 'DEPLOYED',
      deploymentUrl: 'http://127.0.0.1:4101',
      deploymentHealthUrl: 'http://127.0.0.1:4101/api/health'
    })
    assert.equal(deployed.status, 'DEPLOYED')
    assert.equal(deployed.deploymentUrl, 'http://127.0.0.1:4101')
    assert.equal(deployed.deploymentHealthUrl, 'http://127.0.0.1:4101/api/health')
  } finally {
    await server.close()
  }
})
