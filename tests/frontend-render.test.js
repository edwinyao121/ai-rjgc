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

    assert.match(html, /应用生产线/)
    assert.match(html, /航母母港潮汐窗口计算器/)
  } finally {
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
    const { applyGranularEventToOrder } = await server.ssrLoadModule('/src/pages/KanbanBoard.jsx')

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
  } finally {
    await server.close()
  }
})
