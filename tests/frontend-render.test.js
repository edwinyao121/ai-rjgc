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
