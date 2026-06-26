const EVENT_TYPES = [
  'stage.status.changed',
  'stage.log.append',
  'assistant.message.append',
  'assistant.message.delta',
  'deployment.updated',
  'work-order.created',
  'work-order.status.changed',
  'work-order.model-selections.updated',
  'work-order.agent-selections.updated',
  'development.run.started',
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

export async function fetchWorkOrder(id) {
  const payload = await apiFetch(`/api/work-orders/${id}`)
  return payload.workOrder
}

export async function listApps() {
  const payload = await apiFetch('/api/apps')
  return payload.apps || []
}

export async function listOpencodeModels() {
  const payload = await apiFetch('/api/opencode-models')
  return payload.models || []
}

export async function listOpencodeAgents() {
  const payload = await apiFetch('/api/opencode-agents')
  return payload.agents || []
}

export async function createWorkOrder(input) {
  const body = typeof input === 'string' ? { message: input } : input
  const payload = await apiFetch('/api/work-orders', {
    method: 'POST',
    body: JSON.stringify(body)
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

export async function updateWorkOrderModelSelections(id, modelSelections) {
  const payload = await apiFetch(`/api/work-orders/${id}/model-selections`, {
    method: 'PATCH',
    body: JSON.stringify({ modelSelections })
  })
  return payload.workOrder
}

export async function updateWorkOrderAgentSelections(id, agentSelections) {
  const payload = await apiFetch(`/api/work-orders/${id}/agent-selections`, {
    method: 'PATCH',
    body: JSON.stringify({ agentSelections })
  })
  return payload.workOrder
}

export async function startDevelopmentRun(id, modelSelections = null, agentSelections = null) {
  const options = { method: 'POST' }
  if (modelSelections || agentSelections) {
    options.body = JSON.stringify({
      ...(modelSelections ? { modelSelections } : {}),
      ...(agentSelections ? { agentSelections } : {})
    })
  }
  const payload = await apiFetch(`/api/work-orders/${id}/development-runs`, {
    ...options
  })
  return payload.workOrder
}

export async function skipWorkOrderStage(id, stageKey) {
  const payload = await apiFetch(`/api/work-orders/${id}/stage-skips`, {
    method: 'POST',
    body: JSON.stringify({ stageKey })
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
