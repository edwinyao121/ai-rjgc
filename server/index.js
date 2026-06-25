import http from 'node:http'
import { URL } from 'node:url'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { WorkOrderStore } from './lib/store.js'
import { WorkOrderEventBus } from './lib/events.js'
import { WorkOrderService } from './lib/orchestrator.js'

const PORT = Number(process.env.FACTORY_SERVER_PORT || 3100)

export function createApiServer({ service, eventBus }) {
  return http.createServer(async (request, response) => {
    try {
      await routeRequest({ request, response, service, eventBus })
    } catch (error) {
      handleError(response, error)
    }
  })
}

async function routeRequest({ request, response, service, eventBus }) {
  setCorsHeaders(response)
  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url, 'http://127.0.0.1')
  const pathname = url.pathname

  if (request.method === 'GET' && pathname === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'smart-software-factory-api' })
    return
  }

  if (request.method === 'GET' && pathname === '/api/work-orders') {
    sendJson(response, 200, { workOrders: await service.listWorkOrders() })
    return
  }

  if (request.method === 'POST' && pathname === '/api/work-orders') {
    const body = await readJsonBody(request)
    const workOrder = await service.createWorkOrder({
      message: body.message || body.requirement || body.text,
      title: body.title,
      description: body.description,
      deferClarification: body.deferClarification === true
    })
    sendJson(response, 201, { workOrder })
    return
  }

  const stageLogMatch = pathname.match(/^\/api\/work-orders\/(WO-\d{8}-\d{3})\/stages\/([a-z]+)\/logs$/)
  if (stageLogMatch && request.method === 'GET') {
    const [, id, stageKey] = stageLogMatch
    const stageLog = await service.getStageLog(id, stageKey)
    sendJson(response, 200, { stageLog })
    return
  }

  const developmentRunMatch = pathname.match(/^\/api\/work-orders\/(WO-\d{8}-\d{3})\/development-runs$/)
  if (developmentRunMatch && request.method === 'POST') {
    const [, id] = developmentRunMatch
    const workOrder = await service.startDevelopmentRun(id)
    sendJson(response, 202, { workOrder })
    return
  }

  const stageSkipMatch = pathname.match(/^\/api\/work-orders\/(WO-\d{8}-\d{3})\/stage-skips$/)
  if (stageSkipMatch && request.method === 'POST') {
    const [, id] = stageSkipMatch
    const body = await readJsonBody(request)
    const workOrder = await service.skipStage(id, body.stageKey)
    sendJson(response, 200, { workOrder })
    return
  }

  const workOrderMatch = pathname.match(/^\/api\/work-orders\/(WO-\d{8}-\d{3})(?:\/(messages|events))?$/)
  if (workOrderMatch) {
    const [, id, child] = workOrderMatch

    if (request.method === 'GET' && !child) {
      const workOrder = await service.getWorkOrder(id)
      if (!workOrder) {
        sendError(response, 404, 'NOT_FOUND', 'Work order not found')
        return
      }
      sendJson(response, 200, { workOrder })
      return
    }

    if (request.method === 'POST' && child === 'messages') {
      const body = await readJsonBody(request)
      const workOrder = await service.appendUserMessage(id, { message: body.message || body.text })
      sendJson(response, 202, { workOrder })
      return
    }

    if (request.method === 'GET' && child === 'events') {
      const workOrder = await service.getWorkOrder(id)
      if (!workOrder) {
        sendError(response, 404, 'NOT_FOUND', 'Work order not found')
        return
      }
      const lastEventId = Number(request.headers['last-event-id'])
      const history = await service.getEvents(id, {
        afterSequence: Number.isFinite(lastEventId) ? lastEventId : null
      })
      eventBus.subscribe(id, response, history)
      return
    }
  }

  sendError(response, 404, 'NOT_FOUND', 'API route not found')
}

async function readJsonBody(request) {
  const chunks = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must be valid JSON')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Last-Event-ID')
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(`${JSON.stringify(payload)}\n`)
}

function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, { error: { code, message } })
}

function handleError(response, error) {
  if (response.headersSent) {
    response.end()
    return
  }
  if (error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_WORK_ORDER_ID') {
    sendError(response, 400, error.code, error.message)
    return
  }
  if (error.code === 'NOT_FOUND') {
    sendError(response, 404, 'NOT_FOUND', error.message)
    return
  }
  if (error.code === 'CONFLICT') {
    sendError(response, 409, 'CONFLICT', error.message)
    return
  }
  console.error(error)
  sendError(response, 500, 'INTERNAL_ERROR', 'Internal server error')
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMainModule) {
  const store = new WorkOrderStore()
  const eventBus = new WorkOrderEventBus()
  const service = new WorkOrderService({ store, eventBus })
  await service.init()
  const server = createApiServer({ service, eventBus })
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`AI研发助手后端已启动: http://127.0.0.1:${PORT}`)
  })
}
