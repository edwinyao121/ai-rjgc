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
      status: 'COMPLETED',
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
      status: 'COMPLETED',
      time: '16:05'
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
