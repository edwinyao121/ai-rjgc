const EVENT_TYPES = [
  'stage.status.changed',
  'stage.log.append',
  'assistant.message.append',
  'assistant.message.delta',
  'deployment.updated',
  'work-order.created',
  'message.created',
  'clarification.started',
  'clarification.completed',
  'stage.updated',
  'pipeline.completed',
  'pipeline.failed'
]

export async function listWorkOrders() {
  const payload = await apiFetch('/api/work-orders')
  return payload.workOrders || []
}

export async function createWorkOrder(message) {
  const payload = await apiFetch('/api/work-orders', {
    method: 'POST',
    body: JSON.stringify({ message })
  })
  return payload.workOrder
}

export async function sendWorkOrderMessage(id, message) {
  const payload = await apiFetch(`/api/work-orders/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message })
  })
  return payload.workOrder
}

export async function fetchStageLog(workOrderId, stageKey) {
  const payload = await apiFetch(`/api/work-orders/${workOrderId}/stages/${stageKey}/logs`)
  return payload.stageLog
}

export function subscribeWorkOrderEvents(id, { onEvent, onError }) {
  const source = new EventSource(`/api/work-orders/${id}/events`)
  const handler = (event) => {
    try {
      onEvent?.(JSON.parse(event.data))
    } catch (error) {
      onError?.(error)
    }
  }

  for (const eventType of EVENT_TYPES) {
    source.addEventListener(eventType, handler)
  }
  source.onerror = () => {
    onError?.(new Error('SSE connection interrupted'))
  }

  return () => {
    for (const eventType of EVENT_TYPES) {
      source.removeEventListener(eventType, handler)
    }
    source.close()
  }
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload.error?.message || `API request failed with ${response.status}`
    const error = new Error(message)
    error.code = payload.error?.code || 'API_ERROR'
    throw error
  }
  return payload
}
